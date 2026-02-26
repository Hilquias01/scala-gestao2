import React, { useMemo, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmployeeFormModal from '../components/EmployeeFormModal';
import TablePagination from '../components/TablePagination';

// 1. Importações do Material-UI
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const EmployeeListPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const isAdmin = isAuthenticated && user?.role === 'administrador';

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (err) {
      console.error("Falha ao carregar funcionários:", err);
      alert('Falha ao carregar a lista de funcionários.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenModal = (employee = null) => {
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
  };

  const handleSaveEmployee = async (formData) => {
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      fetchEmployees();
      handleCloseModal();
    } catch (err) {
      console.error("Falha ao salvar funcionário:", err);
      alert('Erro ao salvar funcionário.');
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
      try {
        await api.delete(`/employees/${employeeId}`);
        fetchEmployees();
      } catch (err) {
        console.error("Falha ao excluir funcionário:", err);
        alert('Erro ao excluir funcionário.');
      }
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

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      if (statusFilter && employee.status !== statusFilter) return false;
      if (!term) return true;
      const haystack = [
        employee.name,
        employee.role,
        employee.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [employees, searchTerm, statusFilter]);

  const sortedEmployees = useMemo(() => {
    const copy = [...filteredEmployees];
    copy.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const aComparable = typeof aValue === 'number' ? aValue : String(aValue ?? '').toLowerCase();
      const bComparable = typeof bValue === 'number' ? bValue : String(bValue ?? '').toLowerCase();
      if (aComparable < bComparable) return sortDir === 'asc' ? -1 : 1;
      if (aComparable > bComparable) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredEmployees, sortBy, sortDir]);

  const paginatedEmployees = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedEmployees.slice(start, start + pageSize);
  }, [sortedEmployees, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize, employees.length]);

  if (loading) return <div>Carregando pessoal...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Gestão de Pessoal</h1>
        {isAdmin && (
          <button className="btn" onClick={() => handleOpenModal()} style={{ maxWidth: '250px', width: 'auto' }}>
            Adicionar Funcionário
          </button>
        )}
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Buscar nome, função ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('name')}>Nome <span className="sort-indicator">{sortIndicator('name')}</span></th>
              <th className="sortable" onClick={() => handleSort('role')}>Função <span className="sort-indicator">{sortIndicator('role')}</span></th>
              <th className="sortable" onClick={() => handleSort('salary')}>Salário <span className="sort-indicator">{sortIndicator('salary')}</span></th>
              <th className="sortable" onClick={() => handleSort('status')}>Status <span className="sort-indicator">{sortIndicator('status')}</span></th>
              {isAdmin && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedEmployees.length > 0 ? (
              paginatedEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td>{employee.name}</td>
                  <td>{employee.role}</td>
                  <td>{employee.salary ? `R$ ${employee.salary}` : 'N/A'}</td>
                  <td>{employee.status}</td>
                  {isAdmin && (
                    <td className="action-cell">
                      <Tooltip title="Editar Funcionário">
                        <IconButton onClick={() => handleOpenModal(employee)} color="primary">
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir Funcionário">
                        <IconButton onClick={() => handleDeleteEmployee(employee.id)} color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="table-empty">
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={sortedEmployees.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      <EmployeeFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEmployee}
        employee={editingEmployee}
      />
    </div>
  );
};

export default EmployeeListPage;
