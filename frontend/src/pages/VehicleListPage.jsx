import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VehicleFormModal from '../components/VehicleFormModal';
import { useNavigate } from 'react-router-dom';

// MUI Imports for styled icon buttons
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const VehicleListPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  const isAdmin = isAuthenticated && user?.role === 'administrador';

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/vehicles');
      setVehicles(data);
      setError('');
    } catch (err) {
      setError('Falha ao carregar a frota. Tente novamente mais tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleOpenModal = (e, vehicle = null) => {
    e.stopPropagation();
    setEditingVehicle(vehicle);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingVehicle(null);
  };

  const handleSaveVehicle = async (formData) => {
    try {
      if (editingVehicle) {
        await api.put(`/vehicles/${editingVehicle.id}`, formData);
      } else {
        await api.post('/vehicles', formData);
      }
      fetchVehicles();
      handleCloseModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao salvar veículo.');
      console.error(err);
    }
  };

  const handleDeleteVehicle = async (e, vehicleId) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      try {
        await api.delete(`/vehicles/${vehicleId}`);
        fetchVehicles();
      } catch (err) {
        alert('Erro ao excluir veículo.');
        console.error(err);
      }
    }
  };

  const handleRowClick = (vehicleId) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  if (loading) return <div>Carregando frota...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Gestão de Frota</h1>
      
      {isAdmin && (
        <button className="btn" onClick={(e) => handleOpenModal(e)} style={{ maxWidth: '200px', marginBottom: '1rem' }}>
          Adicionar Veículo
        </button>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--azul-scala)', color: 'var(--branco)' }}>
            <th style={{ padding: '0.75rem' }}>Placa</th>
            <th style={{ padding: '0.75rem' }}>Modelo</th>
            <th style={{ padding: '0.75rem' }}>Ano</th>
            <th style={{ padding: '0.75rem' }}>Status</th>
            {isAdmin && <th style={{ padding: '0.75rem' }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {vehicles.length > 0 ? (
            vehicles.map((vehicle) => (
              <tr 
                key={vehicle.id} 
                onClick={() => handleRowClick(vehicle.id)} 
                style={{ cursor: 'pointer', borderBottom: '1px solid #ddd', textAlign: 'center' }}
              >
                <td style={{ padding: '0.75rem' }}>{vehicle.plate}</td>
                <td style={{ padding: '0.75rem' }}>{vehicle.model}</td>
                <td style={{ padding: '0.75rem' }}>{vehicle.year}</td>
                <td style={{ padding: '0.75rem' }}>{vehicle.status}</td>
                {isAdmin && (
                  <td style={{ padding: '0.75rem' }}>
                    {/* ## CORRECTION: Replaced old buttons with MUI IconButtons ## */}
                    <Tooltip title="Editar Veículo">
                      <IconButton 
                        onClick={(e) => handleOpenModal(e, vehicle)} 
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Excluir Veículo">
                      <IconButton 
                        onClick={(e) => handleDeleteVehicle(e, vehicle.id)} 
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '1rem' }}>
                Nenhum veículo cadastrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <VehicleFormModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
      />
    </div>
  );
};

export default VehicleListPage;