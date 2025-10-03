import React, { useState, useEffect } from 'react';
import api from '../services/api';
import GeneralExpenseFormModal from '../components/GeneralExpenseFormModal';

// 1. Importações do Material-UI
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const GeneralExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/general-expenses');
      setExpenses(data);
    } catch (err) {
      console.error("Falha ao carregar despesas:", err);
      alert('Falha ao carregar despesas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleOpenModal = (expense = null) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const handleSaveExpense = async (formData) => {
    try {
      if (editingExpense) {
        await api.put(`/general-expenses/${editingExpense.id}`, formData);
      } else {
        await api.post('/general-expenses', formData);
      }
      fetchExpenses();
      handleCloseModal();
    } catch (err) {
      console.error("Erro ao salvar despesa:", err);
      alert('Erro ao salvar despesa.');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (window.confirm('Tem certeza que deseja excluir esta despesa?')) {
      try {
        await api.delete(`/general-expenses/${expenseId}`);
        fetchExpenses();
      } catch (err) {
        console.error("Erro ao excluir despesa:", err);
        alert('Erro ao excluir despesa.');
      }
    }
  };

  if (loading) return <div>Carregando despesas...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Despesas Gerais</h1>
      <button className="btn" onClick={() => handleOpenModal()} style={{ maxWidth: '250px', marginBottom: '1rem' }}>
        Adicionar Despesa
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--azul-scala)', color: 'var(--branco)' }}>
            <th style={{ padding: '0.75rem' }}>Data</th>
            <th style={{ padding: '0.75rem' }}>Descrição</th>
            <th style={{ padding: '0.75rem' }}>Categoria</th>
            <th style={{ padding: '0.75rem' }}>Valor</th>
            <th style={{ padding: '0.75rem' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
              <td>{new Date(expense.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
              <td>{expense.description}</td>
              <td>{expense.category}</td>
              <td>R$ {expense.amount}</td>
              <td>
                {/* 2. Botões antigos substituídos pelos IconButtons */}
                <Tooltip title="Editar Despesa">
                  <IconButton onClick={() => handleOpenModal(expense)} color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Excluir Despesa">
                  <IconButton onClick={() => handleDeleteExpense(expense.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <GeneralExpenseFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveExpense}
        expense={editingExpense}
      />
    </div>
  );
};

export default GeneralExpensesPage;