import React, { useState } from 'react';
import api from '../services/api';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const ReportsPage = () => {
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDateChange = (e) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/reports/generate', {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end,
        },
        responseType: 'blob',
      });

      if (response.data.type === 'application/json') {
        const errorText = await response.data.text();
        const errorJson = JSON.parse(errorText);
        setError(`Erro no servidor: ${errorJson.message}`);
        throw new Error(errorJson.message);
      }
      
      const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-gerencial-scala-${dateRange.start}-a-${dateRange.end}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      if (!error) {
        setError('Erro ao gerar o relatório. Verifique a conexão e se há dados suficientes no período.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Relatórios Gerenciais</h1>
      <div style={{ maxWidth: '800px', margin: 'auto' }}>
        <div style={{ backgroundColor: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h2>Relatório de Desempenho da Frota</h2>
          <p style={{ color: '#6c757d', marginTop: 0 }}>
            Selecione um período para gerar um relatório completo em PDF com o resumo financeiro, análise de desempenho de veículos e de funcionários.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '1.5rem 0', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label htmlFor="start">De:</label>
              <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}/>
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label htmlFor="end">Até:</label>
              <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} style={{ width: '100%', padding: '0.5rem', border: '1px solid #ccc', borderRadius: '4px' }}/>
            </div>
          </div>

          <button className="btn" onClick={handleGenerateReport} disabled={loading} style={{ width: '100%', fontSize: '1rem' }}>
            {loading ? 'Gerando Relatório...' : 'Baixar Relatório em PDF'}
          </button>

          {error && <p style={{ color: 'red', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;

