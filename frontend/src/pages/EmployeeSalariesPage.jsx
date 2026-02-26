import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import EmployeeSalaryRecordModal from '../components/EmployeeSalaryRecordModal';
import TablePagination from '../components/TablePagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const EmployeeSalariesPage = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState(null);
  const [periodFilter, setPeriodFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('period');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (err) {
      console.error('Falha ao carregar funcionarios', err);
    }
  };

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/employee-salaries');
      setSalaries(data);
    } catch (err) {
      console.error('Falha ao carregar salarios', err);
      alert('Falha ao carregar salarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchSalaries();
  }, []);

  const handleOpenModal = (salary = null) => {
    setEditingSalary(salary);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingSalary(null);
    setIsModalOpen(false);
  };

  const handleSaveSalary = async (formData) => {
    try {
      if (editingSalary) {
        await api.put(`/employee-salaries/${editingSalary.id}`, formData);
      } else {
        await api.post('/employee-salaries', formData);
      }
      fetchSalaries();
      handleCloseModal();
    } catch (err) {
      console.error('Erro ao salvar salario', err);
      alert(err.response?.data?.message || 'Erro ao salvar salario.');
    }
  };

  const handleDeleteSalary = async (salaryId) => {
    if (!window.confirm('Excluir este salario?')) return;
    try {
      await api.delete(`/employee-salaries/${salaryId}`);
      fetchSalaries();
    } catch (err) {
      console.error('Erro ao excluir salario', err);
      alert('Erro ao excluir salario.');
    }
  };

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const sortIndicator = (key) => {
    if (sortBy !== key) return '';
    return sortDir === 'asc' ? '▲' : '▼';
  };

  const filteredSalaries = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return salaries.filter((salary) => {
      if (employeeFilter && String(salary.employee_id) !== String(employeeFilter)) return false;
      if (periodFilter && salary.period !== periodFilter) return false;
      if (!term) return true;
      const haystack = [
        salary.employee?.name,
        salary.notes,
        salary.period,
        salary.amount,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [salaries, searchTerm, employeeFilter, periodFilter]);

  const sortedSalaries = useMemo(() => {
    const copy = [...filteredSalaries];
    copy.sort((a, b) => {
      let aValue;
      let bValue;
      if (sortBy === 'employee') {
        aValue = a.employee?.name || '';
        bValue = b.employee?.name || '';
      } else if (sortBy === 'amount') {
        aValue = Number(a.amount);
        bValue = Number(b.amount);
      } else {
        aValue = a[sortBy];
        bValue = b[sortBy];
      }
      const aComparable = typeof aValue === 'number' ? aValue : String(aValue ?? '').toLowerCase();
      const bComparable = typeof bValue === 'number' ? bValue : String(bValue ?? '').toLowerCase();
      if (aComparable < bComparable) return sortDir === 'asc' ? -1 : 1;
      if (aComparable > bComparable) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredSalaries, sortBy, sortDir]);

  const paginatedSalaries = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedSalaries.slice(start, start + pageSize);
  }, [sortedSalaries, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, employeeFilter, periodFilter, pageSize, salaries.length]);

  if (loading) return <div>Carregando salarios...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Salarios</h1>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <button className="btn" onClick={() => handleOpenModal()} style={{ maxWidth: '250px', width: 'auto' }}>
            Lancar Salario
          </button>
          <div className="spacer" />
          <input
            type="text"
            placeholder="Buscar funcionário, observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)}>
            <option value="">Todos os funcionarios</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <input type="month" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} />
          {(employeeFilter || periodFilter) && (
            <button onClick={() => { setEmployeeFilter(''); setPeriodFilter(''); }} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline' }}>
              Limpar
            </button>
          )}
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('period')}>Periodo <span className="sort-indicator">{sortIndicator('period')}</span></th>
              <th className="sortable" onClick={() => handleSort('employee')}>Funcionario <span className="sort-indicator">{sortIndicator('employee')}</span></th>
              <th className="sortable" onClick={() => handleSort('amount')}>Valor <span className="sort-indicator">{sortIndicator('amount')}</span></th>
              <th className="sortable" onClick={() => handleSort('notes')}>Observacoes <span className="sort-indicator">{sortIndicator('notes')}</span></th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSalaries.length === 0 ? (
              <tr>
                <td colSpan="5" className="table-empty">Nenhum salario encontrado.</td>
              </tr>
            ) : (
              paginatedSalaries.map((salary) => (
                <tr key={salary.id}>
                  <td>{salary.period}</td>
                  <td>{salary.employee?.name || '-'}</td>
                  <td>R$ {parseFloat(salary.amount).toFixed(2)}</td>
                  <td>{salary.notes || '-'}</td>
                  <td className="action-cell">
                    <Tooltip title="Editar">
                      <IconButton onClick={() => handleOpenModal(salary)} color="primary"><EditIcon /></IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton onClick={() => handleDeleteSalary(salary.id)} color="error"><DeleteIcon /></IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={sortedSalaries.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      <EmployeeSalaryRecordModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveSalary}
        salary={editingSalary}
      />
    </div>
  );
};

export default EmployeeSalariesPage;
