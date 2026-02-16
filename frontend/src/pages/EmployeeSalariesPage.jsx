import React, { useEffect, useState } from 'react';
import api from '../services/api';
import EmployeeSalaryRecordModal from '../components/EmployeeSalaryRecordModal';
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
      const params = {};
      if (periodFilter) params.period = periodFilter;
      if (employeeFilter) params.employee_id = employeeFilter;
      const { data } = await api.get('/employee-salaries', { params });
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

  useEffect(() => {
    fetchSalaries();
  }, [periodFilter, employeeFilter]);

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

  if (loading) return <div>Carregando salarios...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Salarios</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
        <button className="btn" onClick={() => handleOpenModal()} style={{ maxWidth: '250px' }}>
          Lancar Salario
        </button>
        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto', alignItems: 'center' }}>
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}>
            <option value="">Todos os funcionarios</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <input type="month" value={periodFilter} onChange={(e) => setPeriodFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }} />
          {(employeeFilter || periodFilter) && (
            <button onClick={() => { setEmployeeFilter(''); setPeriodFilter(''); }} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline' }}>
              Limpar
            </button>
          )}
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--azul-scala)', color: 'var(--branco)' }}>
            <th style={{ padding: '0.75rem' }}>Periodo</th>
            <th style={{ padding: '0.75rem' }}>Funcionario</th>
            <th style={{ padding: '0.75rem' }}>Valor</th>
            <th style={{ padding: '0.75rem' }}>Observacoes</th>
            <th style={{ padding: '0.75rem' }}>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {salaries.length === 0 && (
            <tr>
              <td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>Nenhum salario encontrado.</td>
            </tr>
          )}
          {salaries.map((salary) => (
            <tr key={salary.id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
              <td>{salary.period}</td>
              <td>{salary.employee?.name || '-'}</td>
              <td>R$ {parseFloat(salary.amount).toFixed(2)}</td>
              <td>{salary.notes || '-'}</td>
              <td>
                <Tooltip title="Editar">
                  <IconButton onClick={() => handleOpenModal(salary)} color="primary"><EditIcon /></IconButton>
                </Tooltip>
                <Tooltip title="Excluir">
                  <IconButton onClick={() => handleDeleteSalary(salary.id)} color="error"><DeleteIcon /></IconButton>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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
