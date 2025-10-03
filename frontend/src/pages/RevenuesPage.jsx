import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RevenueFormModal from '../components/RevenueFormModal';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const RevenuesPage = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState(null);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/revenues');
      setRevenues(data);
    } catch (err) {
      console.error("Falha ao carregar receitas:", err);
      alert('Falha ao carregar receitas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenues();
  }, []);

  const handleOpenModal = (revenue = null) => {
    setEditingRevenue(revenue);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRevenue(null);
  };

  const handleSaveRevenue = async (formData) => {
    try {
      if (editingRevenue) {
        await api.put(`/revenues/${editingRevenue.id}`, formData);
      } else {
        await api.post('/revenues', formData);
      }
      fetchRevenues();
      handleCloseModal();
    } catch (err) {
      console.error("Erro ao salvar receita:", err);
      alert('Erro ao salvar receita.');
    }
  };

  const handleDeleteRevenue = async (revenueId) => {
    if (window.confirm('Tem certeza que deseja excluir esta receita?')) {
      try {
        await api.delete(`/revenues/${revenueId}`);
        fetchRevenues();
      } catch (err) {
        console.error("Erro ao excluir receita:", err);
        alert('Erro ao excluir receita.');
      }
    }
  };

  if (loading) return <div>Carregando receitas...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Receitas</h1>
      <button className="btn" onClick={() => handleOpenModal()} style={{ maxWidth: '250px', marginBottom: '1rem' }}>
        Adicionar Receita
      </button>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--azul-scala)', color: 'var(--branco)' }}>
            <th style={{ padding: '0.75rem' }}>Data</th>
            <th style={{ padding: '0.75rem' }}>Descrição</th>
            <th style={{ padding: '0.75rem' }}>Veículo Associado</th>
            <th style={{ padding: '0.75rem' }}>Valor</th>
            <th style={{ padding: '0.75rem' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {revenues.map((revenue) => (
            <tr key={revenue.id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
              <td>{new Date(revenue.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
              <td>{revenue.description}</td>
              <td>{revenue.Vehicle ? `${revenue.Vehicle.plate} - ${revenue.Vehicle.model}` : 'N/A'}</td>
              <td>R$ {revenue.amount}</td>
              <td>
                <Tooltip title="Editar"><IconButton onClick={() => handleOpenModal(revenue)} color="primary"><EditIcon /></IconButton></Tooltip>
                <Tooltip title="Excluir"><IconButton onClick={() => handleDeleteRevenue(revenue.id)} color="error"><DeleteIcon /></IconButton></Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <RevenueFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRevenue}
        revenue={editingRevenue}
      />
    </div>
  );
};

export default RevenuesPage;