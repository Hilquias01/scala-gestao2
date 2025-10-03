import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmployeeFormModal from '../components/EmployeeFormModal';

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

  if (loading) return <div>Carregando pessoal...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Gestão de Pessoal</h1>
      
      {isAdmin && (
        <button className="btn" onClick={() => handleOpenModal()} style={{ maxWidth: '250px', marginBottom: '1rem' }}>
          Adicionar Funcionário
        </button>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--azul-scala)', color: 'var(--branco)' }}>
            <th style={{ padding: '0.75rem' }}>Nome</th>
            <th style={{ padding: '0.75rem' }}>Função</th>
            <th style={{ padding: '0.75rem' }}>Salário</th>
            <th style={{ padding: '0.75rem' }}>Status</th>
            {isAdmin && <th style={{ padding: '0.75rem' }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr key={employee.id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
              <td>{employee.name}</td>
              <td>{employee.role}</td>
              <td>{employee.salary ? `R$ ${employee.salary}` : 'N/A'}</td>
              <td>{employee.status}</td>
              {isAdmin && (
                <td>
                  {/* 2. Botões antigos substituídos pelos IconButtons */}
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
          ))}
        </tbody>
      </table>

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