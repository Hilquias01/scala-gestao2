import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import RevenueFormModal from '../components/RevenueFormModal';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const RevenuesPage = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState(null);

  // Estados para os filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Ref para o input de arquivo oculto
  const fileInputRef = useRef(null);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      // Envia os filtros como parâmetros da requisição GET
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm) params.search = searchTerm;

      const { data } = await api.get('/revenues', { params });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Função para lidar com a seleção do arquivo
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const response = await api.post('/revenues/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert(response.data.message || 'Importação realizada com sucesso!');
      fetchRevenues(); // Atualiza a lista após importar
    } catch (error) {
      console.error("Erro na importação:", error);
      alert('Erro ao importar planilha. Verifique o formato do arquivo.');
    } finally {
      setLoading(false);
      // Limpa o input para permitir selecionar o mesmo arquivo novamente se necessário
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    // O useEffect ou uma chamada manual pode ser necessária dependendo de como você quer o comportamento
    // Aqui chamaremos fetchRevenues manualmente após limpar os estados, mas como o setState é assíncrono,
    // o ideal é passar os valores vazios diretamente para a função.
    fetchRevenuesWithParams('', '', '');
  };

  // Helper para forçar busca com parâmetros limpos
  const fetchRevenuesWithParams = async (start, end, search) => {
    try {
      setLoading(true);
      const { data } = await api.get('/revenues', { params: { startDate: start, endDate: end, search: search } });
      setRevenues(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Receitas</h1>

      {/* --- BARRA DE AÇÕES E FILTROS --- */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        padding: '1rem',
        borderRadius: '8px'
      }}>
        {/* Botões de Ação */}
        <button className="btn" onClick={() => handleOpenModal()} style={{ backgroundColor: 'var(--azul-scala)' }}>
          + Nova Receita
        </button>

        <button className="btn" onClick={handleImportClick} style={{ backgroundColor: '#28a745', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <CloudUploadIcon fontSize="small" /> Importar Planilha
        </button>
        {/* Input oculto para o arquivo */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileChange}
        />

        {/* Inputs de Filtro */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginLeft: 'auto' }}>
          <input
            type="text"
            placeholder="Buscar (descrição/cliente)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />
          <span style={{ color: '#666' }}>até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          />

          <Tooltip title="Aplicar Filtros">
            <IconButton onClick={() => fetchRevenues()} color="primary" style={{ backgroundColor: '#e0e0e0' }}>
              <FilterListIcon />
            </IconButton>
          </Tooltip>
          {(startDate || endDate || searchTerm) && (
            <button onClick={clearFilters} style={{ background: 'none', border: 'none', color: '#d32f2f', cursor: 'pointer', textDecoration: 'underline' }}>
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* TABELA */}
      <table style={{ width: '100%', borderCollapse: 'collapse', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--azul-scala)', color: 'var(--branco)' }}>
            <th style={{ padding: '0.75rem' }}>Data</th>
            <th style={{ padding: '0.75rem' }}>Descrição</th>
            <th style={{ padding: '0.75rem' }}>Responsável</th>
            <th style={{ padding: '0.75rem' }}>Veículo Associado</th>
            <th style={{ padding: '0.75rem' }}>Valor</th>
            <th style={{ padding: '0.75rem' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {revenues.length > 0 ? (
            revenues.map((revenue) => (
              <tr key={revenue.id} style={{ borderBottom: '1px solid #ddd', textAlign: 'center', backgroundColor: '#fff' }}>
                <td style={{ padding: '0.75rem' }}>{new Date(revenue.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                <td style={{ padding: '0.75rem' }}>{revenue.description}</td>
                <td style={{ padding: '0.75rem' }}>{revenue.Employee?.name || 'N/A'}</td>
                <td style={{ padding: '0.75rem' }}>{revenue.Vehicle ? `${revenue.Vehicle.plate} - ${revenue.Vehicle.model}` : '-'}</td>
                <td style={{ padding: '0.75rem', fontWeight: 'bold', color: '#2e7d32' }}>
                  R$ {parseFloat(revenue.amount).toFixed(2)}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <Tooltip title="Editar"><IconButton onClick={() => handleOpenModal(revenue)} color="primary"><EditIcon /></IconButton></Tooltip>
                  <Tooltip title="Excluir"><IconButton onClick={() => handleDeleteRevenue(revenue.id)} color="error"><DeleteIcon /></IconButton></Tooltip>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
                Nenhuma receita encontrada para os filtros selecionados.
              </td>
            </tr>
          )}
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