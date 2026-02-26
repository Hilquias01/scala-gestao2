import React, { useEffect, useState } from 'react';
import api from '../services/api';

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '95%', maxWidth: '960px' },
};

const RevenueImportModal = ({ isOpen, onClose, onImported }) => {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('import');

  useEffect(() => {
    if (!isOpen) return;
    setEmployeeId('');
    setFile(null);
    setError('');
    setPreview(null);
    setActiveTab('import');

    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/employees');
        setEmployees(data);
      } catch (err) {
        console.error('Falha ao carregar funcionários', err);
        setError('Falha ao carregar a lista de funcionários.');
      }
    };
    fetchEmployees();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatDate = (value) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }
    return String(value);
  };

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return value;
    return `R$ ${parsed.toFixed(2)}`;
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Selecione o arquivo para pré-visualizar.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (employeeId) {
      formData.append('employee_id', employeeId);
    }

    try {
      setPreviewLoading(true);
      const response = await api.post('/revenues/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreview(response.data);
      setActiveTab('import');
    } catch (err) {
      console.error('Erro na pré-visualização:', err);
      setError(err.response?.data?.message || 'Erro ao pré-visualizar a planilha.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Selecione o arquivo para importação.');
      return;
    }

    if (!preview) {
      setError('Faça a pré-visualização antes de importar.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    if (employeeId) {
      formData.append('employee_id', employeeId);
    }

    try {
      setLoading(true);
      const response = await api.post('/revenues/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (onImported) onImported(response.data);
      onClose();
    } catch (err) {
      console.error('Erro na importação:', err);
      setError(err.response?.data?.message || 'Erro ao importar a planilha.');
    } finally {
      setLoading(false);
    }
  };

  const formatLabel = preview?.format === 'pedidos_venda' ? 'Pedidos de Venda' : 'Planilha Genérica';
  const previewRows = preview?.preview || [];
  const duplicateRows = preview?.duplicates || [];

  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.content} onClick={(e) => e.stopPropagation()}>
        <h2 className="form-title">Importar Planilha de Receitas</h2>
        <p style={{ color: '#6c757d', marginTop: 0 }}>
          Selecione o arquivo do outro sistema. O funcionário é opcional.
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Funcionário Responsável (Opcional)</label>
            <select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Nenhum</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Arquivo</label>
            <input
              type="file"
              accept=".xls,.xlsx,.csv"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setPreview(null);
              }}
              required
            />
          </div>
          {preview && (
            <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '8px', background: '#f8fafc' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Pré-visualização ({formatLabel})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem' }}>
                <div>Total de linhas: {preview.totalRows}</div>
                <div>Prontos para importar: {preview.importCount}</div>
                <div>Duplicados: {preview.duplicateCount}</div>
                <div>Cancelados: {preview.skippedStatus}</div>
                <div>Inválidos: {preview.invalidCount}</div>
              </div>
              {preview.duplicateCount > 0 && (
                <p style={{ color: '#b45309', marginTop: '0.75rem' }}>
                  Aviso: existem duplicados. Eles serão ignorados na importação.
                </p>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('import')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'import' ? 700 : 400 }}
                >
                  Itens para importar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('duplicates')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'duplicates' ? 700 : 400 }}
                >
                  Duplicados
                </button>
              </div>
              <div style={{ marginTop: '0.75rem', maxHeight: '280px', overflow: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Linha</th>
                      {preview?.format === 'pedidos_venda' && <th>Pedido</th>}
                      <th>Descrição</th>
                      <th>Data</th>
                      <th>Valor</th>
                      {activeTab === 'duplicates' && <th>Motivo</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'duplicates' ? duplicateRows : previewRows).map((row, idx) => (
                      <tr key={`${row.row || idx}-${activeTab}`}>
                        <td>{row.row || '-'}</td>
                        {preview?.format === 'pedidos_venda' && <td>{row.numero || '-'}</td>}
                        <td>{row.description || '-'}</td>
                        <td>{formatDate(row.date)}</td>
                        <td>{formatAmount(row.amount)}</td>
                        {activeTab === 'duplicates' && <td>{row.reason || '-'}</td>}
                      </tr>
                    ))}
                    {(activeTab === 'duplicates' ? duplicateRows.length === 0 : previewRows.length === 0) && (
                      <tr>
                        <td colSpan={activeTab === 'duplicates' ? (preview?.format === 'pedidos_venda' ? 6 : 5) : (preview?.format === 'pedidos_venda' ? 5 : 4)} style={{ textAlign: 'center', padding: '1rem' }}>
                          Nenhum item para exibir.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {error && <p className="error-message">{error}</p>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#6c757d' }} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="button" className="btn" style={{ backgroundColor: '#0f6ab4' }} onClick={handlePreview} disabled={previewLoading || loading}>
              {previewLoading ? 'Pré-visualizando...' : 'Pré-visualizar'}
            </button>
            <button type="submit" className="btn" disabled={loading || !preview || (preview?.importCount ?? 0) === 0}>
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RevenueImportModal;
