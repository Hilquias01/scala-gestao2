import React, { useMemo, useState, useEffect } from 'react';
import api from '../services/api';
import RevenueFormModal from '../components/RevenueFormModal';
import RevenueImportModal from '../components/RevenueImportModal';
import TablePagination from '../components/TablePagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useAuth } from '../context/AuthContext';

const RevenuesPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const isAdmin = isAuthenticated && user?.role === 'administrador';

  // Estados para os filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

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
      alert(err.response?.data?.message || 'Erro ao salvar receita.');
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

  const handleImportClick = () => {
    setIsImportModalOpen(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = {};
      if (startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }
      if (searchTerm) params.search = searchTerm;

      const response = await api.get('/revenues/export', {
        params,
        responseType: 'blob',
      });

      if (response.data.type === 'application/json') {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message);
      }

      const fileName = `receitas-${startDate || 'todas'}-a-${endDate || 'todas'}.xlsx`;
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar receitas:', err);
      alert(err.message || 'Erro ao exportar a planilha.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportResult = (result) => {
    const imported = result?.importedCount ?? 0;
    const skippedExisting = result?.skippedExisting ?? 0;
    const skippedInvalid = result?.skippedInvalid ?? 0;
    const skippedStatus = result?.skippedStatus ?? 0;
    const total = result?.totalRows ?? imported;
    alert(
      `Importação concluída.\n` +
      `Total lidos: ${total}\n` +
      `Importados: ${imported}\n` +
      `Ignorados (já existentes): ${skippedExisting}\n` +
      `Ignorados (status): ${skippedStatus}\n` +
      `Ignorados (inválidos): ${skippedInvalid}`
    );
    fetchRevenues();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
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

  const filteredRevenues = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59`) : null;
    return revenues.filter((revenue) => {
      const revenueDate = new Date(revenue.date);
      if (start && revenueDate < start) return false;
      if (end && revenueDate > end) return false;
      if (!term) return true;
      const haystack = [
        revenue.description,
        revenue.Employee?.name,
        revenue.Vehicle?.plate,
        revenue.Vehicle?.model,
        revenue.amount,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [revenues, searchTerm, startDate, endDate]);

  const sortedRevenues = useMemo(() => {
    const copy = [...filteredRevenues];
    copy.sort((a, b) => {
      let aValue;
      let bValue;
      if (sortBy === 'employee') {
        aValue = a.Employee?.name || '';
        bValue = b.Employee?.name || '';
      } else if (sortBy === 'vehicle') {
        aValue = a.Vehicle ? `${a.Vehicle.plate} ${a.Vehicle.model}` : '';
        bValue = b.Vehicle ? `${b.Vehicle.plate} ${b.Vehicle.model}` : '';
      } else if (sortBy === 'amount') {
        aValue = Number(a.amount);
        bValue = Number(b.amount);
      } else if (sortBy === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
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
  }, [filteredRevenues, sortBy, sortDir]);

  const paginatedRevenues = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRevenues.slice(start, start + pageSize);
  }, [sortedRevenues, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, startDate, endDate, pageSize, revenues.length]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Receitas</h1>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          {isAdmin && (
            <button className="btn" onClick={() => handleOpenModal()} style={{ backgroundColor: 'var(--azul-scala)', width: 'auto' }}>
              + Nova Receita
            </button>
          )}

          {isAdmin && (
            <button className="btn" onClick={handleImportClick} style={{ backgroundColor: '#28a745', display: 'flex', alignItems: 'center', gap: '5px', width: 'auto' }}>
              <CloudUploadIcon fontSize="small" /> Importar Planilha
            </button>
          )}

          <button className="btn" onClick={handleExport} disabled={isExporting} style={{ backgroundColor: '#0f6ab4', display: 'flex', alignItems: 'center', gap: '5px', width: 'auto' }}>
            <CloudDownloadIcon fontSize="small" /> {isExporting ? 'Exportando...' : 'Exportar Planilha'}
          </button>

          <div className="spacer" />

          <input
            type="text"
            placeholder="Buscar (descrição/cliente)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: '#666' }}>até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate || searchTerm) && (
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline' }}>
              Limpar
            </button>
          )}
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('date')}>Data <span className="sort-indicator">{sortIndicator('date')}</span></th>
              <th className="sortable" onClick={() => handleSort('description')}>Descrição <span className="sort-indicator">{sortIndicator('description')}</span></th>
              <th className="sortable" onClick={() => handleSort('employee')}>Responsável <span className="sort-indicator">{sortIndicator('employee')}</span></th>
              <th className="sortable" onClick={() => handleSort('vehicle')}>Veículo Associado <span className="sort-indicator">{sortIndicator('vehicle')}</span></th>
              <th className="sortable" onClick={() => handleSort('amount')}>Valor <span className="sort-indicator">{sortIndicator('amount')}</span></th>
              {isAdmin && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedRevenues.length > 0 ? (
              paginatedRevenues.map((revenue) => (
                <tr key={revenue.id}>
                  <td>{new Date(revenue.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                  <td>{revenue.description}</td>
                  <td>{revenue.Employee?.name || 'N/A'}</td>
                  <td>{revenue.Vehicle ? `${revenue.Vehicle.plate} - ${revenue.Vehicle.model}` : '-'}</td>
                  <td style={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    R$ {parseFloat(revenue.amount).toFixed(2)}
                  </td>
                  {isAdmin && (
                    <td className="action-cell">
                      <Tooltip title="Editar"><IconButton onClick={() => handleOpenModal(revenue)} color="primary"><EditIcon /></IconButton></Tooltip>
                      <Tooltip title="Excluir"><IconButton onClick={() => handleDeleteRevenue(revenue.id)} color="error"><DeleteIcon /></IconButton></Tooltip>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="table-empty">
                  Nenhuma receita encontrada para os filtros selecionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={sortedRevenues.length}
          onPageChange={setPage}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
        />
      </div>

      <RevenueFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRevenue}
        revenue={editingRevenue}
      />

      <RevenueImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImported={handleImportResult}
      />
    </div>
  );
};

export default RevenuesPage;
