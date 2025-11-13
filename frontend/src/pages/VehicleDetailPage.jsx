import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RefuelingFormModal from '../components/RefuelingFormModal';
import MaintenanceFormModal from '../components/MaintenanceFormModal';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const VehicleDetailPage = () => {
  const { id } = useParams();
  const { isAuthenticated, user } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [refuelings, setRefuelings] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefuelingModalOpen, setIsRefuelingModalOpen] = useState(false);
  const [editingRefueling, setEditingRefueling] = useState(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);

  const isAdmin = isAuthenticated && user?.role === 'administrador';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [vehicleRes, refuelingsRes, maintenancesRes] = await Promise.all([
        api.get(`/vehicles/${id}`),
        api.get(`/refuelings/vehicle/${id}`),
        api.get(`/maintenances/vehicle/${id}`)
      ]);
      setVehicle(vehicleRes.data);
      setRefuelings(refuelingsRes.data);
      setMaintenances(maintenancesRes.data);
    } catch (error) {
      console.error('Falha ao carregar dados do veículo', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Lógica para Abastecimentos
  const handleOpenRefuelingModal = (refueling = null) => {
    setEditingRefueling(refueling);
    setIsRefuelingModalOpen(true);
  };

  const handleSaveRefueling = async (formData) => {
    try {
      if (editingRefueling) {
        await api.put(`/refuelings/${editingRefueling.id}`, formData);
      } else {
        await api.post('/refuelings', formData);
      }
      setIsRefuelingModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar abastecimento:", error);
      alert('Erro ao salvar abastecimento.');
    }
  };

  const handleDeleteRefueling = async (refuelingId) => {
    if (window.confirm('Excluir este lançamento de abastecimento?')) {
      try {
        await api.delete(`/refuelings/${refuelingId}`);
        fetchData();
      } catch (error) {
        console.error("Erro ao excluir abastecimento:", error);
        alert('Erro ao excluir abastecimento.');
      }
    }
  };

  // Lógica para Manutenções
  const handleOpenMaintenanceModal = (maintenance = null) => {
    setEditingMaintenance(maintenance);
    setIsMaintenanceModalOpen(true);
  };

  const handleSaveMaintenance = async (formData) => {
    try {
      if (editingMaintenance) {
        await api.put(`/maintenances/${editingMaintenance.id}`, formData);
      } else {
        await api.post('/maintenances', formData);
      }
      setIsMaintenanceModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Erro ao salvar manutenção:", error);
      alert('Erro ao salvar manutenção.');
    }
  };
  
  const handleDeleteMaintenance = async (maintenanceId) => {
    if (window.confirm('Excluir este lançamento de manutenção?')) {
      try {
        await api.delete(`/maintenances/${maintenanceId}`);
        fetchData();
      } catch (error) {
        console.error("Erro ao excluir manutenção:", error);
        alert('Erro ao excluir manutenção.');
      }
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (!vehicle) return <div>Veículo não encontrado. <Link to="/fleet">Voltar</Link></div>;

  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/fleet">← Voltar para a frota</Link>
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px', margin: '1rem 0' }}>
        <h1>{vehicle.model} - {vehicle.plate}</h1>
        <p><strong>Fabricante:</strong> {vehicle.manufacturer} | <strong>Ano:</strong> {vehicle.year} | <strong>KM Inicial:</strong> {vehicle.initial_km}</p>
        <p><strong>Renavam:</strong> {vehicle.renavam || 'Não cadastrado'}</p>
      </div>

      {isAdmin && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button className="btn" onClick={() => handleOpenRefuelingModal()} style={{ maxWidth: '250px' }}>Lançar Abastecimento</button>
          <button className="btn" onClick={() => handleOpenMaintenanceModal()} style={{ maxWidth: '250px' }}>Lançar Manutenção</button>
        </div>
      )}

      {/* Tabela de Abastecimentos com Ações */}
      <div style={{ marginBottom: '2rem' }}>
        <h2>Histórico de Abastecimentos</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--azul-scala)', color: 'var(--branco)' }}>
              <th style={{ padding: '0.75rem' }}>Data</th>
              <th style={{ padding: '0.75rem' }}>Motorista</th>
              <th style={{ padding: '0.75rem' }}>Litros</th>
              <th style={{ padding: '0.75rem' }}>Custo Total</th>
              <th style={{ padding: '0.75rem' }}>KM no Veículo</th>
              {isAdmin && <th style={{ padding: '0.75rem' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {refuelings.map((refueling) => (
              <tr key={refueling.id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                <td>{new Date(refueling.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td>{refueling.Employee?.name || 'N/A'}</td>
                <td>{refueling.liters} L</td>
                <td>R$ {refueling.total_cost}</td>
                <td>{refueling.vehicle_km} KM</td>
                {isAdmin && (
                  <td>
                    <Tooltip title="Editar"><IconButton onClick={() => handleOpenRefuelingModal(refueling)} color="primary"><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton onClick={() => handleDeleteRefueling(refueling.id)} color="error"><DeleteIcon /></IconButton></Tooltip>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tabela de Manutenções com Ações */}
      <div>
        <h2>Histórico de Manutenções</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--azul-scala)', color: 'var(--branco)' }}>
              <th style={{ padding: '0.75rem' }}>Data</th>
              <th style={{ padding: '0.75rem' }}>Descrição</th>
              <th style={{ padding: '0.75rem' }}>Custo</th>
              {isAdmin && <th style={{ padding: '0.75rem' }}>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {maintenances.map((maint) => (
              <tr key={maint.id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                <td>{new Date(maint.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td>{maint.description}</td>
                <td>R$ {maint.cost}</td>
                {isAdmin && (
                  <td>
                    <Tooltip title="Editar"><IconButton onClick={() => handleOpenMaintenanceModal(maint)} color="primary"><EditIcon /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton onClick={() => handleDeleteMaintenance(maint.id)} color="error"><DeleteIcon /></IconButton></Tooltip>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modais */}
      <RefuelingFormModal isOpen={isRefuelingModalOpen} onClose={() => setIsRefuelingModalOpen(false)} onSave={handleSaveRefueling} vehicleId={id} refueling={editingRefueling} />
      <MaintenanceFormModal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} onSave={handleSaveMaintenance} vehicleId={id} maintenance={editingMaintenance} />
    </div>
  );
};

export default VehicleDetailPage;