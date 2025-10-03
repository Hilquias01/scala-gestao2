import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const RevenueVsExpensesChart = () => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const { data } = await api.get('/dashboard/revenue-vs-expenses');
        setChartData({
          labels: data.labels,
          datasets: [
            {
              label: 'Receitas (R$)',
              data: data.revenueData,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgb(75, 192, 192)',
              borderWidth: 1,
            },
            {
              label: 'Despesas (R$)',
              data: data.expenseData,
              backgroundColor: 'rgba(255, 99, 132, 0.6)',
              borderColor: 'rgb(255, 99, 132)',
              borderWidth: 1,
            },
          ],
        });
      } catch (error) {
        console.error("Erro ao buscar dados para o gráfico", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Receitas vs. Despesas (Últimos 6 Meses)' },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (loading) return <p>Carregando gráfico...</p>;

  return <Bar options={options} data={chartData} />;
};

export default RevenueVsExpensesChart;