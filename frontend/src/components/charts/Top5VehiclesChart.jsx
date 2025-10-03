import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import api from '../../services/api';

const Top5VehiclesChart = ({ dateRange }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard/top-5-vehicles', {
          params: { startDate: dateRange.start, endDate: dateRange.end }
        });
        setChartData({
          labels: data.labels,
          datasets: [
            { label: 'Custo Total (R$)', data: data.data, backgroundColor: 'rgba(255, 99, 132, 0.6)' },
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
    indexAxis: 'y',
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Top 5 Veículos Mais Caros no Período' },
    },
    scales: { x: { beginAtZero: true } }
  };

  if (loading) return <p>Carregando gráfico...</p>;
  if (chartData.labels.length === 0) return <p>Não há dados de custos de veículos para o período.</p>;

  return <Bar options={options} data={chartData} />;
};

export default Top5VehiclesChart;