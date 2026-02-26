import React, { useMemo, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import VehicleFormModal from '../components/VehicleFormModal';
import { useNavigate } from 'react-router-dom';
import TablePagination from '../components/TablePagination';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('plate');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const filteredVehicles = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return vehicles.filter((vehicle) => {
      if (statusFilter && vehicle.status !== statusFilter) return false;
      if (!term) return true;
      const haystack = [
        vehicle.plate,
        vehicle.model,
        vehicle.year,
        vehicle.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [vehicles, searchTerm, statusFilter]);

  const sortedVehicles = useMemo(() => {
    const copy = [...filteredVehicles];
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
  }, [filteredVehicles, sortBy, sortDir]);

  const paginatedVehicles = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedVehicles.slice(start, start + pageSize);
  }, [sortedVehicles, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, pageSize, vehicles.length]);

  if (loading) return <div>Carregando frota...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Gestão de Frota</h1>
        {isAdmin && (
          <button className="btn" onClick={(e) => handleOpenModal(e)} style={{ maxWidth: '220px', width: 'auto' }}>
            Adicionar Veículo
          </button>
        )}
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <input
            type="text"
            placeholder="Buscar placa, modelo ou status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="manutencao">Manutenção</option>
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('plate')}>Placa <span className="sort-indicator">{sortIndicator('plate')}</span></th>
              <th className="sortable" onClick={() => handleSort('model')}>Modelo <span className="sort-indicator">{sortIndicator('model')}</span></th>
              <th className="sortable" onClick={() => handleSort('year')}>Ano <span className="sort-indicator">{sortIndicator('year')}</span></th>
              <th className="sortable" onClick={() => handleSort('status')}>Status <span className="sort-indicator">{sortIndicator('status')}</span></th>
              {isAdmin && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedVehicles.length > 0 ? (
              paginatedVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  onClick={() => handleRowClick(vehicle.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{vehicle.plate}</td>
                  <td>{vehicle.model}</td>
                  <td>{vehicle.year}</td>
                  <td>{vehicle.status}</td>
                  {isAdmin && (
                    <td className="action-cell">
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
                <td colSpan={isAdmin ? 5 : 4} className="table-empty">
                  Nenhum veículo cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={sortedVehicles.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

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
