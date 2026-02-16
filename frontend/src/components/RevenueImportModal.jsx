import React, { useEffect, useState } from 'react';
import api from '../services/api';

const modalStyles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  content: { backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '90%', maxWidth: '520px' },
};

const RevenueImportModal = ({ isOpen, onClose, onImported }) => {
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setEmployeeId('');
    setFile(null);
    setError('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Selecione o arquivo para importação.');
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
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn" style={{ backgroundColor: '#6c757d' }} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Importando...' : 'Importar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RevenueImportModal;
