import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { startOfMonth, endOfMonth, format } from 'date-fns';

// Importações dos gráficos
import CostEvolutionChart from '../components/charts/CostEvolutionChart';
import SpendingByCategoryChart from '../components/charts/SpendingByCategoryChart';
import RevenueVsExpensesChart from '../components/charts/RevenueVsExpensesChart';
import CostsPerVehicleChart from '../components/charts/CostsPerVehicleChart';
import Top5VehiclesChart from '../components/charts/Top5VehiclesChart';

const kpiCardStyles = {
  backgroundColor: "white",
  padding: "1.5rem",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  textAlign: "center",
};
const kpiValueStyles = {
  fontSize: "2.5rem",
  fontWeight: "bold",
  color: "var(--azul-scala)",
  margin: "0 0 0.5rem 0",
};
const kpiLabelStyles = {
  fontSize: "1rem",
  color: "#6c757d",
  margin: 0,
};
const chartContainerStyles = {
  backgroundColor: "white",
  padding: "1.5rem",
  borderRadius: "8px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  height: '100%' // Garante que todos os cards na mesma linha tenham a mesma altura
};

const DashboardPage = () => {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);

  // State para o filtro de data, inicializado com o mês atual
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  // Função para buscar os KPIs baseada no filtro
  const fetchKpis = async (dates) => {
    try {
      const { data } = await api.get('/dashboard/kpis', { 
        params: { startDate: dates.start, endDate: dates.end }
      });
      setKpis(data);
    } catch (error) {
      console.error("Erro ao buscar KPIs", error);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchKpis(dateRange).finally(() => setLoading(false));
  }, [dateRange]);

  const handleDateChange = (e) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem" }}>Carregando dados do dashboard...</div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      {/* CABEÇALHO E FILTRO DE DATA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'white', padding: '0.5rem 1rem', borderRadius: '8px' }}>
          <label htmlFor="start">Período:</label>
          <input type="date" name="start" value={dateRange.start} onChange={handleDateChange} style={{border: '1px solid #ccc', borderRadius: '4px', padding: '0.25rem'}}/>
          <span>até</span>
          <input type="date" name="end" value={dateRange.end} onChange={handleDateChange} style={{border: '1px solid #ccc', borderRadius: '4px', padding: '0.25rem'}}/>
        </div>
      </div>
      
      {/* LINHA 1: KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <div style={kpiCardStyles}><p style={kpiValueStyles}>R$ {kpis?.totalMonthRevenue || "0.00"}</p><h3 style={kpiLabelStyles}>Receita no Período</h3></div>
        <div style={kpiCardStyles}><p style={kpiValueStyles}>R$ {kpis?.totalMonthCost || "0.00"}</p><h3 style={kpiLabelStyles}>Custo no Período</h3></div>
        <div style={kpiCardStyles}><p style={kpiValueStyles}>{kpis?.totalVehicles || 0}</p><h3 style={kpiLabelStyles}>Veículos Ativos</h3></div>
        <div style={kpiCardStyles}><p style={kpiValueStyles}>{kpis?.totalEmployees || 0}</p><h3 style={kpiLabelStyles}>Funcionários Ativos</h3></div>
      </div>

      {/* LINHA 2: Gráficos Principais */}
      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={chartContainerStyles}>
          <CostEvolutionChart />
        </div>
        <div style={chartContainerStyles}>
          <RevenueVsExpensesChart />
        </div>
      </div>

      {/* LINHA 3: Gráficos Secundários */}
      <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        <div style={chartContainerStyles}>
          <SpendingByCategoryChart dateRange={dateRange} />
        </div>
        <div style={chartContainerStyles}>
          <CostsPerVehicleChart dateRange={dateRange} />
        </div>
        <div style={chartContainerStyles}>
          <Top5VehiclesChart dateRange={dateRange} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;