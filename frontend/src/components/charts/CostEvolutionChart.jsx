import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import api from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CostEvolutionChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard/cost-evolution');
        
        // ## CORREÇÃO: Montando o gráfico com duas linhas ##
        setChartData({
          labels: data.labels,
          datasets: [
            {
              label: 'Custo Total Mensal (R$)',
              data: data.costData, // Dados de custo
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              tension: 0.1
            },
            {
              label: 'Receita Total Mensal (R$)',
              data: data.revenueData, // Dados de receita
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
              tension: 0.1
            }
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
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        // ## CORREÇÃO: Título do gráfico atualizado ##
        text: 'Evolução de Custos vs. Receitas (Últimos 6 Meses)',
      },
    },
     scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  if (loading) {
    return <p>Carregando gráfico...</p>;
  }

  return <Line options={options} data={chartData} />;
};

export default CostEvolutionChart;