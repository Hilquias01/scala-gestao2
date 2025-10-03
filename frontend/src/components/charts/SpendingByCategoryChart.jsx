import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, Title } from 'chart.js';
import api from '../../services/api';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

const SpendingByCategoryChart = ({ dateRange }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard/spending-by-category', {
          params: { startDate: dateRange.start, endDate: dateRange.end }
        });
        
        setChartData({
          labels: data.labels,
          datasets: [
            {
              label: 'Custo em R$',
              data: data.data,
              backgroundColor: ['rgba(42, 65, 97, 0.8)', 'rgba(212, 160, 23, 0.8)', 'rgba(108, 117, 125, 0.8)'],
              borderColor: ['rgb(42, 65, 97)', 'rgb(212, 160, 23)', 'rgb(108, 117, 125)'],
              borderWidth: 1,
            },
          ],
        });
      } catch (error) {
        console.error("Erro ao buscar dados para o gráfico de categorias", error);
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
      title: { display: true, text: 'Distribuição de Custos no Período' },
    },
  };

  if (loading) return <p>Carregando gráfico...</p>;

  return <Doughnut options={options} data={chartData} />;
};

export default SpendingByCategoryChart;