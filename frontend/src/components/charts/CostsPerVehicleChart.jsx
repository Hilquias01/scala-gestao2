import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import api from '../../services/api';

const CostsPerVehicleChart = ({ dateRange }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard/costs-per-vehicle', {
          params: { startDate: dateRange.start, endDate: dateRange.end }
        });
        setChartData({
          labels: data.labels,
          datasets: [
            { label: 'Abastecimento (R$)', data: data.refuelingData, backgroundColor: 'rgba(42, 65, 97, 0.8)' },
            { label: 'Manutenção (R$)', data: data.maintenanceData, backgroundColor: 'rgba(212, 160, 23, 0.8)' },
          ],
        });
      } catch (error) {
        console.error("Erro ao buscar dados para o gráfico", error);
      } finally {
        setLoading(false);
      }
    };
    if (dateRange.start && dateRange.end) {
      fetchChartData();
    }
  }, [dateRange]);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Custos por Veículo no Período' },
    },
    scales: { y: { beginAtZero: true, stacked: true }, x: { stacked: true } }
  };

  if (loading) return <p>Carregando gráfico...</p>;
  if (chartData.labels.length === 0) return <p>Não há dados de custos de veículos para o período.</p>;

  return <Bar options={options} data={chartData} />;
};

export default CostsPerVehicleChart;