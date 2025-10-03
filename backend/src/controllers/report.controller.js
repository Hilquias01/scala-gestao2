const puppeteer = require('puppeteer');
const { Op } = require('sequelize');
const { Vehicle, Refueling, Maintenance, Employee, Revenue, GeneralExpense } = require('../models');
const { format, parseISO, eachDayOfInterval, isSameDay } = require('date-fns');

/**
 * Controller para gerar um relatório completo e otimizado da frota em PDF.
 */
exports.generateReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Datas de início e fim são obrigatórias.' });
    }

    // =================================================================
    // 1. BUSCA CENTRALIZADA DE DADOS
    // =================================================================
    const revenues = await Revenue.findAll({ where: { date: { [Op.between]: [startDate, endDate] } }, include: [Employee, Vehicle], order: [['date', 'ASC']] });
    const refuelings = await Refueling.findAll({ where: { date: { [Op.between]: [startDate, endDate] } }, include: [Vehicle, Employee], order: [['date', 'ASC']] });
    const maintenances = await Maintenance.findAll({ where: { date: { [Op.between]: [startDate, endDate] } }, include: [Vehicle], order: [['date', 'ASC']] });
    const generalExpenses = await GeneralExpense.findAll({ where: { date: { [Op.between]: [startDate, endDate] } }, order: [['date', 'ASC']] });
    const employees = await Employee.findAll({ order: [['name', 'ASC']] });
    const vehicles = await Vehicle.findAll({ order: [['plate', 'ASC']] });
    
    // =================================================================
    // 2. PROCESSAMENTO E CÁLCULOS ANALÍTICOS
    // =================================================================

    // --- RESUMO FINANCEIRO GERAL ---
    const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const refuelingCost = refuelings.reduce((sum, r) => sum + parseFloat(r.total_cost), 0);
    const maintenanceCost = maintenances.reduce((sum, m) => sum + parseFloat(m.cost), 0);
    const generalExpenseCost = generalExpenses.reduce((sum, g) => sum + parseFloat(g.amount), 0);
    const totalExpenses = refuelingCost + maintenanceCost + generalExpenseCost;
    const netResult = totalRevenue - totalExpenses;

    // --- ANÁLISE DIÁRIA (PARA GRÁFICO DE LINHA) ---
    const dailyBreakdown = [];
    const interval = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
    for (const day of interval) {
        const dailyRevenue = revenues.filter(r => isSameDay(parseISO(r.date), day)).reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const dailyRefueling = refuelings.filter(r => isSameDay(parseISO(r.date), day)).reduce((sum, r) => sum + parseFloat(r.total_cost), 0);
        const dailyMaintenance = maintenances.filter(m => isSameDay(parseISO(m.date), day)).reduce((sum, m) => sum + parseFloat(m.cost), 0);
        const dailyGeneral = generalExpenses.filter(g => isSameDay(parseISO(g.date), day)).reduce((sum, g) => sum + parseFloat(g.amount), 0);
        dailyBreakdown.push({
            date: format(day, 'dd/MM'),
            revenue: dailyRevenue.toFixed(2),
            expenses: (dailyRefueling + dailyMaintenance + dailyGeneral).toFixed(2)
        });
    }

    // --- ANÁLISE DE VEÍCULOS ---
    const vehicleAnalysis = [];
    let fleetTotalKmDriven = 0;
    for (const vehicle of vehicles) {
        const vRevenues = revenues.filter(r => r.vehicle_id === vehicle.id);
        const vRefuelings = refuelings.filter(r => r.vehicle_id === vehicle.id).sort((a,b) => a.vehicle_km - b.vehicle_km);
        const vMaintenances = maintenances.filter(m => m.vehicle_id === vehicle.id);

        const kmDriven = vRefuelings.length > 1 ? parseFloat(vRefuelings[vRefuelings.length - 1].vehicle_km) - parseFloat(vRefuelings[0].vehicle_km) : 0;
        const totalLiters = vRefuelings.reduce((sum, r) => sum + parseFloat(r.liters), 0);
        const avgKmL = kmDriven > 0 && totalLiters > 0 ? (kmDriven / totalLiters) : 0;
        const vTotalRefuelingCost = vRefuelings.reduce((sum, r) => sum + parseFloat(r.total_cost), 0);
        const vTotalMaintenanceCost = vMaintenances.reduce((sum, m) => sum + parseFloat(m.cost), 0);
        const vTotalCost = vTotalRefuelingCost + vTotalMaintenanceCost;
        const vTotalRevenue = vRevenues.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        
        if (vTotalCost > 0 || vTotalRevenue > 0) {
            fleetTotalKmDriven += kmDriven;
            vehicleAnalysis.push({
                plate: vehicle.plate, model: vehicle.model,
                kmDriven: kmDriven.toFixed(2),
                avgKmL: avgKmL.toFixed(2),
                totalCost: vTotalCost.toFixed(2),
                totalRevenue: vTotalRevenue.toFixed(2),
                balance: (vTotalRevenue - vTotalCost).toFixed(2),
                costPerKm: kmDriven > 0 ? (vTotalCost / kmDriven).toFixed(2) : '0.00',
                revenuePerKm: kmDriven > 0 ? (vTotalRevenue / kmDriven).toFixed(2) : '0.00',
                maintenanceCount: vMaintenances.length,
            });
        }
    }

    // --- ANÁLISE DE FUNCIONÁRIOS ---
    const employeeAnalysis = [];
    for (const employee of employees) {
        const eRevenues = revenues.filter(r => r.employee_id === employee.id);
        const totalRevenueGenerated = eRevenues.reduce((sum, r) => sum + parseFloat(r.amount), 0);
        const tripsCount = eRevenues.length;

        const dailyRevenues = {};
        eRevenues.forEach(r => {
            const day = format(parseISO(r.date), 'dd/MM/yyyy');
            dailyRevenues[day] = (dailyRevenues[day] || 0) + parseFloat(r.amount);
        });

        if (tripsCount > 0) {
            employeeAnalysis.push({
                name: employee.name,
                totalRevenue: totalRevenueGenerated.toFixed(2),
                tripsCount,
                avgRevenuePerTrip: (totalRevenueGenerated / tripsCount).toFixed(2),
                dailyRevenues: Object.entries(dailyRevenues).map(([date, amount]) => ({date, amount: amount.toFixed(2)})).sort((a,b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')))
            });
        }
    }

    // --- RANKINGS (TOP 5) ---
    const topVehiclesCost = [...vehicleAnalysis].sort((a, b) => parseFloat(b.totalCost) - parseFloat(a.totalCost)).slice(0, 5);
    const topVehiclesRevenue = [...vehicleAnalysis].sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue)).slice(0, 5);
    const topVehiclesBalance = [...vehicleAnalysis].sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance)).slice(0, 5);
    const topVehiclesEconomy = [...vehicleAnalysis].filter(v => v.avgKmL > 0).sort((a, b) => parseFloat(b.avgKmL) - parseFloat(a.avgKmL)).slice(0, 5);
    const topEmployeesRevenue = [...employeeAnalysis].sort((a, b) => parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue)).slice(0, 5);

    // =================================================================
    // 3. MONTAGEM DO OBJETO FINAL PARA O HTML
    // =================================================================
    const reportData = {
        financialSummary: { totalRevenue: totalRevenue.toFixed(2), totalExpenses: totalExpenses.toFixed(2), netResult: netResult.toFixed(2), margin: totalRevenue > 0 ? ((netResult / totalRevenue) * 100).toFixed(2) : '0.00' },
        kpis: { fleetAvgCostPerKm: fleetTotalKmDriven > 0 ? (totalExpenses / fleetTotalKmDriven).toFixed(2) : '0.00', totalTrips: revenues.length, avgRevenuePerTrip: revenues.length > 0 ? (totalRevenue / revenues.length).toFixed(2) : '0.00' },
        chartData: { pie: [refuelingCost.toFixed(2), maintenanceCost.toFixed(2), generalExpenseCost.toFixed(2)], bar: [totalRevenue.toFixed(2), totalExpenses.toFixed(2)], line: dailyBreakdown },
        topLists: { vehiclesCost: topVehiclesCost, vehiclesRevenue: topVehiclesRevenue, vehiclesBalance: topVehiclesBalance, vehiclesEconomy: topVehiclesEconomy, employeesRevenue: topEmployeesRevenue },
        vehicleAnalysis,
        employeeAnalysis,
        detailedLists: { revenues, refuelings, maintenances, generalExpenses }
    };
    
    // =================================================================
    // 4. GERAÇÃO DO PDF OTIMIZADO
    // =================================================================
    const htmlContent = generateEnhancedHTML(reportData, startDate, endDate);
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '2cm', right: '1cm', bottom: '2cm', left: '1cm' },
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size: 10px; text-align: center; width: 100%; padding: 0 1cm;">Scala Gestão - Relatório de Desempenho da Frota</div>`,
        footerTemplate: `<div style="font-size: 10px; text-align: right; width: 100%; padding: 0 1cm;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-completo-frota-${startDate}-a-${endDate}.pdf"`);
    res.end(pdfBuffer);

  } catch (error) {
    console.error("Erro ao gerar relatório completo:", error);
    res.status(500).json({ message: 'Erro interno ao gerar o relatório.' });
  }
};

/**
 * Função auxiliar para gerar o HTML do relatório, com FONTES SIGNIFICATIVAMENTE MAIORES e layout simplificado.
 * @param {object} data - O objeto com todos os dados processados para o relatório.
 * @param {string} startDate - A data de início do relatório.
 * @param {string} endDate - A data de fim do relatório.
 * @returns {string} A string HTML completa para ser renderizada.
 */
function generateEnhancedHTML(data, startDate, endDate) {
    const { financialSummary, kpis, chartData, topLists, vehicleAnalysis, employeeAnalysis, detailedLists } = data;
    const formattedStartDate = format(parseISO(startDate), 'dd/MM/yyyy');
    const formattedEndDate = format(parseISO(endDate), 'dd/MM/yyyy');
  
    const renderTable = (headers, rows) => {
        if (!rows || rows.length === 0) return `<p class="no-data">Nenhum dado disponível para este período.</p>`;
        return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
    };
    
    return `
      <html>
        <head>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            /* ========================================= */
            /* FONTES SIGNIFICATIVAMENTE MAIORES (VERSÃO FINAL) */
            /* ========================================= */
            body { font-family: Arial, sans-serif; font-size: 16px; color: #333; }
            h1, h2, h3, h4 { color: #2A4161; margin-bottom: 0.5em; page-break-after: avoid; }
            h1 { text-align: center; font-size: 28px; }
            h2 { border-bottom: 2px solid #D4A017; padding-bottom: 5px; margin-top: 35px; font-size: 24px; }
            h3 { border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 30px; font-size: 20px; }
            h4 { font-size: 17px; margin-top: 25px; margin-bottom: 10px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 15px; page-break-inside: avoid; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tbody tr:nth-child(odd) { background-color: #f9f9f9; }
            .header-info { text-align: center; margin-bottom: 35px; font-size: 16px; }
            .profit { color: #28a745; font-weight: bold; } .loss { color: #dc3545; font-weight: bold; }
            .no-data { text-align: center; color: #888; padding: 20px; font-style: italic; }
            .page-break { page-break-before: always; }
            .kpi-container { display: flex; justify-content: space-around; text-align: center; background: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 20px; }
            .kpi-box { flex: 1; }
            .kpi-title { font-size: 16px; color: #6c757d; } .kpi-value { font-size: 24px; font-weight: bold; color: #2A4161; }
            .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 25px; }
            .chart-full { margin-top: 35px; }
            .rankings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px 40px; }
            
            /* ========================================= */
            /* LAYOUT SIMPLIFICADO PARA VEÍCULOS         */
            /* ========================================= */
            .vehicle-analysis-container {
                display: grid;
                grid-template-columns: 45% 55%; /* Colunas de tamanhos diferentes para melhor encaixe */
                gap: 25px;
                page-break-inside: avoid;
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="header-info">
            <h1>Relatório de Desempenho da Frota</h1>
            <p>Período: ${formattedStartDate} a ${formattedEndDate}</p>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>
  
          <h2>Painel Geral</h2>
          <h3>Resumo Financeiro</h3>
          ${renderTable( ['Receita Total', 'Despesas Totais', 'Resultado Líquido', 'Margem de Lucro'], [`<tr><td class="profit">R$ ${financialSummary.totalRevenue}</td><td class="loss">R$ ${financialSummary.totalExpenses}</td><td class="${financialSummary.netResult >= 0 ? 'profit' : 'loss'}">R$ ${financialSummary.netResult}</td><td>${financialSummary.margin}%</td></tr>`])}
          <h3>Indicadores Chave de Desempenho (KPIs)</h3>
          <div class="kpi-container">
            <div class="kpi-box"><div class="kpi-title">Custo Médio / KM (Frota)</div><div class="kpi-value">R$ ${kpis.fleetAvgCostPerKm}</div></div>
            <div class="kpi-box"><div class="kpi-title">Total de Viagens</div><div class="kpi-value">${kpis.totalTrips}</div></div>
            <div class="kpi-box"><div class="kpi-title">Receita Média / Viagem</div><div class="kpi-value">R$ ${kpis.avgRevenuePerTrip}</div></div>
          </div>
          <h3>Visualização Gráfica</h3>
          <div class="chart-grid">
              <canvas id="expensesChart"></canvas>
              <canvas id="revenueChart"></canvas>
          </div>
          <div class="chart-full"><canvas id="dailyTrendChart"></canvas></div>
          
          <div class="page-break"></div>
          <h2>Rankings e Destaques (Top 5)</h2>
          <div class="rankings-grid">
              <div><h3>Veículos com Maior Custo</h3>${renderTable(['Placa', 'Modelo', 'Custo Total'], topLists.vehiclesCost.map(v => `<tr><td>${v.plate}</td><td>${v.model}</td><td class="loss">R$ ${v.totalCost}</td></tr>`))}</div>
              <div><h3>Veículos com Maior Receita</h3>${renderTable(['Placa', 'Modelo', 'Receita Total'], topLists.vehiclesRevenue.map(v => `<tr><td>${v.plate}</td><td>${v.model}</td><td class="profit">R$ ${v.totalRevenue}</td></tr>`))}</div>
              <div><h3>Veículos Mais Lucrativos</h3>${renderTable(['Placa', 'Modelo', 'Saldo Final'], topLists.vehiclesBalance.map(v => `<tr><td>${v.plate}</td><td>${v.model}</td><td class="${v.balance >= 0 ? 'profit' : 'loss'}">R$ ${v.balance}</td></tr>`))}</div>
              <div><h3>Veículos Mais Econômicos</h3>${renderTable(['Placa', 'Modelo', 'Média (KM/L)'], topLists.vehiclesEconomy.map(v => `<tr><td>${v.plate}</td><td>${v.model}</td><td>${v.avgKmL}</td></tr>`))}</div>
          </div>
          <h3>Funcionários com Maior Faturamento</h3>
          ${renderTable(['Nome', 'Receita Gerada', 'Nº de Viagens'], topLists.employeesRevenue.map(e => `<tr><td>${e.name}</td><td class="profit">R$ ${e.totalRevenue}</td><td>${e.tripsCount}</td></tr>`))}
          
          <div class="page-break"></div>
          <h2>Análise Detalhada</h2>

          <h3>Desempenho por Veículo</h3>
          ${vehicleAnalysis.map(v => `
            <div>
              <h4>Veículo: ${v.plate} - ${v.model}</h4>
              <div class="vehicle-analysis-container">
                <div>
                  ${renderTable(
                    ['KM Rodado', 'Média (KM/L)', 'Nº Manutenções'],
                    [`<tr><td>${v.kmDriven}</td><td>${v.avgKmL}</td><td>${v.maintenanceCount}</td></tr>`]
                  )}
                </div>
                <div>
                  ${renderTable(
                    ['Receita', 'Custo', 'Saldo', 'Receita/KM', 'Custo/KM'],
                    [`<tr>
                      <td class="profit">R$ ${v.totalRevenue}</td>
                      <td class="loss">R$ ${v.totalCost}</td>
                      <td class="${v.balance >= 0 ? 'profit' : 'loss'}">R$ ${v.balance}</td>
                      <td>R$ ${v.revenuePerKm}</td>
                      <td>R$ ${v.costPerKm}</td>
                    </tr>`]
                  )}
                </div>
              </div>
            </div>
          `).join('')}
          
          <h3>Desempenho por Funcionário</h3>
          ${renderTable(['Nome', 'Receita Total', 'Nº Viagens', 'Receita Média/Viagem'], employeeAnalysis.map(e => `<tr><td>${e.name}</td><td class="profit">R$ ${e.totalRevenue}</td><td>${e.tripsCount}</td><td>R$ ${e.avgRevenuePerTrip}</td></tr>`))}
          
          <h3>Receitas Diárias por Funcionário</h3>
          ${employeeAnalysis.map(e => `<div><h4>${e.name}</h4>${renderTable(['Data', 'Valor da Receita'], e.dailyRevenues.map(dr => `<tr><td>${dr.date}</td><td class="profit">R$ ${dr.amount}</td></tr>`))}</div>`).join('')}

          <div class="page-break"></div>
          <h2>Registros Completos do Período</h2>
          <h3>Histórico de Receitas (${detailedLists.revenues.length} registros)</h3>
          ${renderTable(['Data', 'Funcionário', 'Veículo', 'Descrição', 'Valor'], detailedLists.revenues.map(i => `<tr><td>${format(parseISO(i.date), 'dd/MM/yy')}</td><td>${i.Employee?.name || '-'}</td><td>${i.Vehicle?.plate || '-'}</td><td>${i.description}</td><td class="profit">R$ ${parseFloat(i.amount).toFixed(2)}</td></tr>`))}
          <div class="page-break"></div>
          <h3>Histórico de Abastecimentos (${detailedLists.refuelings.length} registros)</h3>
          ${renderTable(['Data', 'Veículo', 'Litros', 'Preço/Litro', 'Custo Total', 'KM Veículo'], detailedLists.refuelings.map(i => `<tr><td>${format(parseISO(i.date), 'dd/MM/yy')}</td><td>${i.Vehicle?.plate || '-'}</td><td>${i.liters}</td><td>R$ ${i.price_per_liter}</td><td class="loss">R$ ${parseFloat(i.total_cost).toFixed(2)}</td><td>${i.vehicle_km}</td></tr>`))}
          <div class="page-break"></div>
          <h3>Histórico de Manutenções (${detailedLists.maintenances.length} registros)</h3>
          ${renderTable(['Data', 'Veículo', 'Tipo', 'Descrição', 'Custo'], detailedLists.maintenances.map(i => `<tr><td>${format(parseISO(i.date), 'dd/MM/yy')}</td><td>${i.Vehicle?.plate || '-'}</td><td>${i.type}</td><td>${i.description}</td><td class="loss">R$ ${parseFloat(i.cost).toFixed(2)}</td></tr>`))}
          <h3>Histórico de Despesas Gerais (${detailedLists.generalExpenses.length} registros)</h3>
          ${renderTable(['Data', 'Categoria', 'Descrição', 'Valor'], detailedLists.generalExpenses.map(i => `<tr><td>${format(parseISO(i.date), 'dd/MM/yy')}</td><td>${i.category}</td><td>${i.description}</td><td class="loss">R$ ${parseFloat(i.amount).toFixed(2)}</td></tr>`))}
  
          <script>
            new Chart(document.getElementById('expensesChart').getContext('2d'), { type: 'pie', data: { labels: ['Combustível', 'Manutenção', 'Despesas Gerais'], datasets: [{ data: [${chartData.pie.join(',')}], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }] }, options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Composição das Despesas' } } } });
            new Chart(document.getElementById('revenueChart').getContext('2d'), { type: 'bar', data: { labels: ['Receita', 'Despesas'], datasets: [{ label: 'Valores (R$)', data: [${chartData.bar.join(',')}], backgroundColor: ['#4CAF50', '#F44336'] }] }, options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Receita vs. Despesas' } }, scales: { y: { beginAtZero: true } } } });
            new Chart(document.getElementById('dailyTrendChart').getContext('2d'), { type: 'line', data: { labels: [${chartData.line.map(d => `'${d.date}'`).join(',')}], datasets: [ { label: 'Receita Diária', data: [${chartData.line.map(d => d.revenue).join(',')}], borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)', fill: true, tension: 0.1 }, { label: 'Despesa Diária', data: [${chartData.line.map(d => d.expenses).join(',')}], borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.1)', fill: true, tension: 0.1 } ] }, options: { responsive: true, plugins: { title: { display: true, text: 'Evolução Diária de Receitas e Despesas' } }, scales: { y: { beginAtZero: true } } } });
          </script>
        </body>
      </html>
    `;
}