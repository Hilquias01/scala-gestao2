const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { Op } = require('sequelize');
const { Vehicle, Refueling, Maintenance, Employee, Revenue, GeneralExpense } = require('../models');
const { format, parseISO, eachDayOfInterval, isSameDay } = require('date-fns');

const COMPANY_INFO = {
  name: 'Scala Gestao',
  nameHtml: 'Scala Gest&atilde;o',
  cnpj: '26.236.212/0001-66',
  addressLine: 'Avenida Praia do Amapa, 3355',
  addressLineHtml: 'Avenida Praia do Amap&aacute;, 3355',
  cityLine: 'CEP 69906640 - Rio Branco - AC',
  cityLineHtml: 'CEP 69906640 - Rio Branco - AC',
  phone: '(68) 99229-3111',
};

const LOGO_PATH = path.resolve(__dirname, '..', '..', '..', 'frontend', 'public', 'Logo_scala_corrigido.png');
let cachedLogoDataUri;
const getLogoDataUri = () => {
  if (cachedLogoDataUri !== undefined) return cachedLogoDataUri;
  try {
    const file = fs.readFileSync(LOGO_PATH);
    cachedLogoDataUri = `data:image/png;base64,${file.toString('base64')}`;
  } catch (error) {
    cachedLogoDataUri = null;
  }
  return cachedLogoDataUri;
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const numberFormatter = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integerFormatter = new Intl.NumberFormat('pt-BR');

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => currencyFormatter.format(toNumber(value));
const formatNumber = (value) => numberFormatter.format(toNumber(value));
const formatInteger = (value) => integerFormatter.format(Math.trunc(toNumber(value)));
const formatPercent = (value) => `${formatNumber(toNumber(value) * 100)}%`;

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
    const totalRevenue = revenues.reduce((sum, r) => sum + toNumber(r.amount), 0);
    const refuelingCost = refuelings.reduce((sum, r) => sum + toNumber(r.total_cost), 0);
    const maintenanceCost = maintenances.reduce((sum, m) => sum + toNumber(m.cost), 0);
    const generalExpenseCost = generalExpenses.reduce((sum, g) => sum + toNumber(g.amount), 0);
    const totalExpenses = refuelingCost + maintenanceCost + generalExpenseCost;
    const netResult = totalRevenue - totalExpenses;

    // --- ANÁLISE DIÁRIA (PARA GRÁFICO DE LINHA) ---
    const dailyBreakdown = [];
    const interval = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
    for (const day of interval) {
        const dailyRevenue = revenues.filter(r => isSameDay(parseISO(r.date), day)).reduce((sum, r) => sum + toNumber(r.amount), 0);
        const dailyRefueling = refuelings.filter(r => isSameDay(parseISO(r.date), day)).reduce((sum, r) => sum + toNumber(r.total_cost), 0);
        const dailyMaintenance = maintenances.filter(m => isSameDay(parseISO(m.date), day)).reduce((sum, m) => sum + toNumber(m.cost), 0);
        const dailyGeneral = generalExpenses.filter(g => isSameDay(parseISO(g.date), day)).reduce((sum, g) => sum + toNumber(g.amount), 0);
        dailyBreakdown.push({
            date: format(day, 'dd/MM'),
            revenue: dailyRevenue,
            expenses: (dailyRefueling + dailyMaintenance + dailyGeneral)
        });
    }

    // --- ANÁLISE DE VEÍCULOS ---
    const vehicleAnalysis = [];
    let fleetTotalKmDriven = 0;
    for (const vehicle of vehicles) {
        const vRevenues = revenues.filter(r => r.vehicle_id === vehicle.id);
        const vRefuelings = refuelings.filter(r => r.vehicle_id === vehicle.id).sort((a,b) => a.vehicle_km - b.vehicle_km);
        const vMaintenances = maintenances.filter(m => m.vehicle_id === vehicle.id);

        const kmDriven = vRefuelings.length > 1 ? toNumber(vRefuelings[vRefuelings.length - 1].vehicle_km) - toNumber(vRefuelings[0].vehicle_km) : 0;
        const totalLiters = vRefuelings.reduce((sum, r) => sum + toNumber(r.liters), 0);
        const avgKmL = kmDriven > 0 && totalLiters > 0 ? (kmDriven / totalLiters) : 0;
        const vTotalRefuelingCost = vRefuelings.reduce((sum, r) => sum + toNumber(r.total_cost), 0);
        const vTotalMaintenanceCost = vMaintenances.reduce((sum, m) => sum + toNumber(m.cost), 0);
        const vTotalCost = vTotalRefuelingCost + vTotalMaintenanceCost;
        const vTotalRevenue = vRevenues.reduce((sum, r) => sum + toNumber(r.amount), 0);
        
        if (vTotalCost > 0 || vTotalRevenue > 0) {
            fleetTotalKmDriven += kmDriven;
            vehicleAnalysis.push({
                plate: vehicle.plate, model: vehicle.model,
                kmDriven,
                avgKmL,
                totalCost: vTotalCost,
                totalRevenue: vTotalRevenue,
                balance: (vTotalRevenue - vTotalCost),
                costPerKm: kmDriven > 0 ? (vTotalCost / kmDriven) : 0,
                revenuePerKm: kmDriven > 0 ? (vTotalRevenue / kmDriven) : 0,
                maintenanceCount: vMaintenances.length,
            });
        }
    }

    // --- ANÁLISE DE FUNCIONÁRIOS ---
    const employeeAnalysis = [];
    for (const employee of employees) {
        const eRevenues = revenues.filter(r => r.employee_id === employee.id);
        const totalRevenueGenerated = eRevenues.reduce((sum, r) => sum + toNumber(r.amount), 0);
        const tripsCount = eRevenues.length;

        const dailyRevenues = {};
        eRevenues.forEach(r => {
            const day = format(parseISO(r.date), 'dd/MM/yyyy');
            dailyRevenues[day] = (dailyRevenues[day] || 0) + toNumber(r.amount);
        });

        if (tripsCount > 0) {
            employeeAnalysis.push({
                name: employee.name,
                totalRevenue: totalRevenueGenerated,
                tripsCount,
                avgRevenuePerTrip: (totalRevenueGenerated / tripsCount),
                dailyRevenues: Object.entries(dailyRevenues).map(([date, amount]) => ({date, amount})).sort((a,b) => new Date(a.date.split('/').reverse().join('-')) - new Date(b.date.split('/').reverse().join('-')))
            });
        }
    }

    // --- RANKINGS (TOP 5) ---
    const topVehiclesCost = [...vehicleAnalysis].sort((a, b) => b.totalCost - a.totalCost).slice(0, 5);
    const topVehiclesRevenue = [...vehicleAnalysis].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);
    const topVehiclesBalance = [...vehicleAnalysis].sort((a, b) => b.balance - a.balance).slice(0, 5);
    const topVehiclesEconomy = [...vehicleAnalysis].filter(v => v.avgKmL > 0).sort((a, b) => b.avgKmL - a.avgKmL).slice(0, 5);
    const topEmployeesRevenue = [...employeeAnalysis].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 5);

    const expenseCategories = [
      { label: 'Combust&iacute;vel', value: refuelingCost },
      { label: 'Manuten&ccedil;&atilde;o', value: maintenanceCost },
      { label: 'Despesas Gerais', value: generalExpenseCost },
    ];
    const topExpenseCategory = expenseCategories.reduce((max, current) => {
      return current.value > max.value ? current : max;
    }, expenseCategories[0]);

    // =================================================================
    // 3. MONTAGEM DO OBJETO FINAL PARA O HTML
    // =================================================================
    const reportData = {
        company: {
            ...COMPANY_INFO,
            logoDataUri: getLogoDataUri(),
        },
        financialSummary: {
            totalRevenue,
            totalExpenses,
            netResult,
            margin: totalRevenue > 0 ? (netResult / totalRevenue) : 0
        },
        kpis: {
            fleetAvgCostPerKm: fleetTotalKmDriven > 0 ? (totalExpenses / fleetTotalKmDriven) : 0,
            totalTrips: revenues.length,
            avgRevenuePerTrip: revenues.length > 0 ? (totalRevenue / revenues.length) : 0
        },
        recordSummary: {
            revenues: revenues.length,
            refuelings: refuelings.length,
            maintenances: maintenances.length,
            generalExpenses: generalExpenses.length,
            vehicles: vehicles.length,
            employees: employees.length
        },
        insights: {
            topVehicleCost: topVehiclesCost[0] || null,
            topVehicleRevenue: topVehiclesRevenue[0] || null,
            topVehicleBalance: topVehiclesBalance[0] || null,
            topEmployeeRevenue: topEmployeesRevenue[0] || null,
            topExpenseCategory
        },
        chartData: {
            pie: [refuelingCost, maintenanceCost, generalExpenseCost],
            bar: [totalRevenue, totalExpenses],
            line: dailyBreakdown
        },
        topLists: { vehiclesCost: topVehiclesCost, vehiclesRevenue: topVehiclesRevenue, vehiclesBalance: topVehiclesBalance, vehiclesEconomy: topVehiclesEconomy, employeesRevenue: topEmployeesRevenue },
        vehicleAnalysis,
        employeeAnalysis,
        detailedLists: { revenues, refuelings, maintenances, generalExpenses }
    };
    
    // =================================================================
    // 4. GERAÇÃO DO PDF OTIMIZADO
    // =================================================================
    const headerStartDate = format(parseISO(startDate), 'dd/MM/yyyy');
    const headerEndDate = format(parseISO(endDate), 'dd/MM/yyyy');
    const headerText = `${COMPANY_INFO.nameHtml} - Relat&oacute;rio de Desempenho da Frota (${headerStartDate} a ${headerEndDate})`;
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
        headerTemplate: `<div style="font-size: 10px; text-align: center; width: 100%; padding: 0 1cm;">${headerText}</div>`,
        footerTemplate: `<div style=\"font-size: 10px; text-align: right; width: 100%; padding: 0 1cm;\">Pagina <span class=\"pageNumber\"></span> de <span class=\"totalPages\"></span></div>`,
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
    const { company, financialSummary, kpis, recordSummary, insights, chartData, topLists, vehicleAnalysis, employeeAnalysis, detailedLists } = data;
    const formattedStartDate = format(parseISO(startDate), 'dd/MM/yyyy');
    const formattedEndDate = format(parseISO(endDate), 'dd/MM/yyyy');

    const renderTable = (headers, rows) => {
        if (!rows || rows.length === 0) return `<p class=\"no-data\">Nenhum dado disponivel para este periodo.</p>`;
        return `<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
    };

    const logoHtml = company?.logoDataUri
        ? `<img src=\"${company.logoDataUri}\" class=\"cover-logo\" />`
        : `<div class=\"cover-name\">${company?.nameHtml || company?.name || 'Empresa'}</div>`;

    const watermarkHtml = company?.logoDataUri
        ? `<div class=\"watermark\" style=\"background-image: url('${company.logoDataUri}');\"></div>`
        : '';

    const insightRows = [
        `<tr><td>Ve&iacute;culo com maior custo</td><td>${insights.topVehicleCost ? `${insights.topVehicleCost.plate} - ${formatCurrency(insights.topVehicleCost.totalCost)}` : '-'}</td></tr>`,
        `<tr><td>Ve&iacute;culo com maior receita</td><td>${insights.topVehicleRevenue ? `${insights.topVehicleRevenue.plate} - ${formatCurrency(insights.topVehicleRevenue.totalRevenue)}` : '-'}</td></tr>`,
        `<tr><td>Ve&iacute;culo mais lucrativo</td><td>${insights.topVehicleBalance ? `${insights.topVehicleBalance.plate} - ${formatCurrency(insights.topVehicleBalance.balance)}` : '-'}</td></tr>`,
        `<tr><td>Funcion&aacute;rio com maior faturamento</td><td>${insights.topEmployeeRevenue ? `${insights.topEmployeeRevenue.name} - ${formatCurrency(insights.topEmployeeRevenue.totalRevenue)}` : '-'}</td></tr>`,
        `<tr><td>Maior categoria de custo</td><td>${insights.topExpenseCategory ? `${insights.topExpenseCategory.label} - ${formatCurrency(insights.topExpenseCategory.value)}` : '-'}</td></tr>`
    ];

    return `
      <html>
        <head>
          <meta charset=\"UTF-8\">
          <script src=\"https://cdn.jsdelivr.net/npm/chart.js\"></script>
          <style>
            :root {
              --brand-primary: #1f2c3a;
              --brand-accent: #d4a017;
              --brand-soft: #f8f9fb;
              --brand-ink: #2a4161;
              --brand-muted: #6c757d;
            }
            @page { size: A4 landscape; margin: 2cm 1cm; }
            body { font-family: Arial, sans-serif; font-size: 15px; color: #333; }
            h1, h2, h3, h4 { color: var(--brand-ink); margin-bottom: 0.5em; page-break-after: avoid; }
            h1 { text-align: center; font-size: 28px; }
            h2 { border-bottom: 2px solid var(--brand-accent); padding-bottom: 5px; margin-top: 32px; font-size: 22px; }
            h3 { border-bottom: 1px solid #ccc; padding-bottom: 3px; margin-top: 24px; font-size: 18px; }
            h4 { font-size: 16px; margin-top: 20px; margin-bottom: 8px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; page-break-inside: avoid; }
            table thead { display: table-header-group; }
            table tr { page-break-inside: avoid; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #f2f2f2; font-weight: bold; }
            tbody tr:nth-child(odd) { background-color: #f9f9f9; }
            .header-info { text-align: center; margin-bottom: 24px; font-size: 15px; }
            .profit { color: #28a745; font-weight: bold; }
            .loss { color: #dc3545; font-weight: bold; }
            .no-data { text-align: center; color: #888; padding: 20px; font-style: italic; }
            .page-break { page-break-before: always; }
            .kpi-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; text-align: center; background: var(--brand-soft); padding: 16px; border-radius: 6px; margin-top: 15px; }
            .kpi-box { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .kpi-title { font-size: 13px; color: var(--brand-muted); text-transform: uppercase; letter-spacing: 0.03em; }
            .kpi-value { font-size: 20px; font-weight: bold; color: var(--brand-ink); margin-top: 6px; }
            .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 12px 0; }
            .summary-card { background: var(--brand-soft); border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
            .summary-label { font-size: 12px; color: var(--brand-muted); text-transform: uppercase; letter-spacing: 0.04em; }
            .summary-value { font-size: 20px; font-weight: 700; color: var(--brand-ink); margin-top: 4px; }
            .chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 20px; }
            .chart-full { margin-top: 28px; }
            .rankings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px 32px; }
            .vehicle-analysis-container { display: grid; grid-template-columns: 45% 55%; gap: 20px; page-break-inside: avoid; margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee; }
            canvas { max-width: 100%; height: 260px !important; }
            .muted { color: var(--brand-muted); }

            .cover { min-height: 0; display: flex; flex-direction: column; gap: 12px; border-radius: 16px; padding: 18px 24px; background: linear-gradient(140deg, #f6f8fb 0%, #ffffff 35%, #f4f6fb 100%); border: 2px solid #e5e7eb; box-sizing: border-box; page-break-inside: avoid; break-inside: avoid; }
            .cover-brand { text-align: center; }
            .cover-logo { max-width: 180px; width: auto; height: auto; margin: 0 auto 8px; display: block; object-fit: contain; }
            .cover-name { font-size: 24px; font-weight: 700; color: var(--brand-ink); }
            .cover-title { text-align: center; font-size: 22px; font-weight: 700; color: var(--brand-ink); margin-top: 6px; }
            .cover-period { text-align: center; font-size: 13px; color: var(--brand-muted); margin-top: 4px; }
            .cover-box { margin-top: 12px; border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #ffffff; box-shadow: 0 6px 16px rgba(31, 44, 58, 0.05); }
            .cover-box div { margin: 3px 0; font-size: 12px; }
            .cover-footer { text-align: center; color: var(--brand-muted); font-size: 12px; margin-top: 6px; }
            .cover-bar { height: 4px; width: 80px; background: var(--brand-accent); margin: 8px auto 0; border-radius: 999px; }

            .toc { padding: 20px 10px; }
            .toc ol { margin: 0; padding-left: 24px; }
            .toc li { margin: 10px 0; font-size: 16px; }

            .watermark { position: fixed; top: 50%; left: 50%; width: 100%; height: 100%; transform: translate(-50%, -50%); opacity: 0.1; background-repeat: no-repeat; background-position: center; background-size: 70% auto; pointer-events: none; z-index: 0; }
            .content-layer { position: relative; z-index: 1; }
          </style>
        </head>
        <body>
          ${watermarkHtml}
          <div class=\"content-layer\">
            <div class=\"cover\">
              <div>
                <div class=\"cover-brand\">
                  ${logoHtml}
                  <div class=\"cover-title\">Relat&oacute;rio de Desempenho da Frota</div>
                  <div class=\"cover-bar\"></div>
                  <div class=\"cover-period\">Per&iacute;odo: ${formattedStartDate} a ${formattedEndDate}</div>
                </div>
                <div class=\"cover-box\">
                  <div><strong>Empresa:</strong> ${company?.nameHtml || company?.name || '-'}</div>
                  <div><strong>CNPJ:</strong> ${company?.cnpj || '-'}</div>
                  <div><strong>Endere&ccedil;o:</strong> ${company?.addressLineHtml || company?.addressLine || '-'}</div>
                  <div><strong>Cidade:</strong> ${company?.cityLineHtml || company?.cityLine || '-'}</div>
                  <div><strong>Telefone:</strong> ${company?.phone || '-'}</div>
                </div>
              </div>
              <div class=\"cover-footer\">Gerado em: ${new Date().toLocaleString('pt-BR')}</div>
            </div>

            <div class=\"page-break\"></div>

            <div class=\"toc\">
              <h2>Sum&aacute;rio</h2>
              <ol>
                <li>Painel Geral</li>
                <li>Rankings e Destaques</li>
                <li>An&aacute;lise Detalhada</li>
                <li>Registros Completos do Per&iacute;odo</li>
              </ol>
              <p class=\"muted\">Observa&ccedil;&atilde;o: todas as tabelas estao completas e sem limites.</p>
            </div>

            <div class=\"page-break\"></div>

            <div class=\"header-info\">
              <h1>Relat&oacute;rio de Desempenho da Frota</h1>
              <p>Per&iacute;odo: ${formattedStartDate} a ${formattedEndDate}</p>
              <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
  
            <h2>Painel Geral</h2>
            <h3>Vis&atilde;o Executiva</h3>
            <div class=\"summary-grid\">
              <div class=\"summary-card\"><div class=\"summary-label\">Receita Total</div><div class=\"summary-value profit\">${formatCurrency(financialSummary.totalRevenue)}</div></div>
              <div class=\"summary-card\"><div class=\"summary-label\">Despesas Totais</div><div class=\"summary-value loss\">${formatCurrency(financialSummary.totalExpenses)}</div></div>
              <div class=\"summary-card\"><div class=\"summary-label\">Resultado L&iacute;quido</div><div class=\"summary-value ${financialSummary.netResult >= 0 ? 'profit' : 'loss'}\">${formatCurrency(financialSummary.netResult)}</div></div>
              <div class=\"summary-card\"><div class=\"summary-label\">Margem</div><div class=\"summary-value\">${formatPercent(financialSummary.margin)}</div></div>
            </div>
            <h3>Resumo Financeiro</h3>
            ${renderTable( ['Receita Total', 'Despesas Totais', 'Resultado L&iacute;quido', 'Margem de Lucro'], [`<tr><td class=\"profit\">${formatCurrency(financialSummary.totalRevenue)}</td><td class=\"loss\">${formatCurrency(financialSummary.totalExpenses)}</td><td class=\"${financialSummary.netResult >= 0 ? 'profit' : 'loss'}\">${formatCurrency(financialSummary.netResult)}</td><td>${formatPercent(financialSummary.margin)}</td></tr>`])}
            <h3>Indicadores Chave de Desempenho (KPIs)</h3>
            <div class=\"kpi-container\">
              <div class=\"kpi-box\"><div class=\"kpi-title\">Custo M&eacute;dio / KM (Frota)</div><div class=\"kpi-value\">${formatCurrency(kpis.fleetAvgCostPerKm)}</div></div>
              <div class=\"kpi-box\"><div class=\"kpi-title\">Total de Viagens</div><div class=\"kpi-value\">${formatInteger(kpis.totalTrips)}</div></div>
              <div class=\"kpi-box\"><div class=\"kpi-title\">Receita M&eacute;dia / Viagem</div><div class=\"kpi-value\">${formatCurrency(kpis.avgRevenuePerTrip)}</div></div>
            </div>
            <h3>Insights R&aacute;pidos</h3>
            ${renderTable(['Indicador', 'Destaque'], insightRows)}
            <h3>Volume de Registros</h3>
            ${renderTable(['Indicador', 'Quantidade'], [
              `<tr><td>Receitas</td><td>${formatInteger(recordSummary.revenues)}</td></tr>`,
              `<tr><td>Abastecimentos</td><td>${formatInteger(recordSummary.refuelings)}</td></tr>`,
              `<tr><td>Manuten&ccedil;&otilde;es</td><td>${formatInteger(recordSummary.maintenances)}</td></tr>`,
              `<tr><td>Despesas Gerais</td><td>${formatInteger(recordSummary.generalExpenses)}</td></tr>`,
              `<tr><td>Ve&iacute;culos</td><td>${formatInteger(recordSummary.vehicles)}</td></tr>`,
              `<tr><td>Funcion&aacute;rios</td><td>${formatInteger(recordSummary.employees)}</td></tr>`
            ])}

            <h3>Visualizacao Grafica</h3>
            <div class=\"chart-grid\">
                <canvas id=\"expensesChart\"></canvas>
                <canvas id=\"revenueChart\"></canvas>
            </div>
            <div class=\"chart-full\"><canvas id=\"dailyTrendChart\"></canvas></div>
            
            <div class=\"page-break\"></div>
            <h2>Rankings e Destaques (Top 5)</h2>
            <div class=\"rankings-grid\">
                <div><h3>Ve&iacute;culos com Maior Custo</h3>${renderTable(['Placa', 'Modelo', 'Custo Total'], topLists.vehiclesCost.map(v => `<tr><td>${v.plate}</td><td>${v.model}</td><td class=\"loss\">${formatCurrency(v.totalCost)}</td></tr>`))}</div>
                <div><h3>Ve&iacute;culos com Maior Receita</h3>${renderTable(['Placa', 'Modelo', 'Receita Total'], topLists.vehiclesRevenue.map(v => `<tr><td>${v.plate}</td><td>${v.model}</td><td class=\"profit\">${formatCurrency(v.totalRevenue)}</td></tr>`))}</div>
                <div><h3>Ve&iacute;culos Mais Lucrativos</h3>${renderTable(['Placa', 'Modelo', 'Saldo Final'], topLists.vehiclesBalance.map(v => `<tr><td>${v.plate}</td><td>${v.model}</td><td class=\"${v.balance >= 0 ? 'profit' : 'loss'}\">${formatCurrency(v.balance)}</td></tr>`))}</div>
                <div><h3>Ve&iacute;culos Mais Econ&ocirc;micos</h3>${renderTable(['Placa', 'Modelo', 'M&eacute;dia (KM/L)'], topLists.vehiclesEconomy.map(v => `<tr><td>${v.plate}</td><td>${v.model}</td><td>${formatNumber(v.avgKmL)}</td></tr>`))}</div>
            </div>
            <h3>Funcion&aacute;rios com Maior Faturamento</h3>
            ${renderTable(['Nome', 'Receita Gerada', 'No. de Viagens'], topLists.employeesRevenue.map(e => `<tr><td>${e.name}</td><td class=\"profit\">${formatCurrency(e.totalRevenue)}</td><td>${formatInteger(e.tripsCount)}</td></tr>`))}
            
            <div class=\"page-break\"></div>
            <h2>An&aacute;lise Detalhada</h2>

            <h3>Desempenho por Ve&iacute;culo</h3>
            ${vehicleAnalysis.map(v => `
              <div>
                <h4>Ve&iacute;culo: ${v.plate} - ${v.model}</h4>
                <div class=\"vehicle-analysis-container\">
                  <div>
                    ${renderTable(
                      ['KM Rodado', 'M&eacute;dia (KM/L)', 'No. Manuten&ccedil;&otilde;es'],
                      [`<tr><td>${formatNumber(v.kmDriven)}</td><td>${formatNumber(v.avgKmL)}</td><td>${formatInteger(v.maintenanceCount)}</td></tr>`]
                    )}
                  </div>
                  <div>
                    ${renderTable(
                      ['Receita', 'Custo', 'Saldo', 'Receita/KM', 'Custo/KM'],
                      [`<tr>
                        <td class=\"profit\">${formatCurrency(v.totalRevenue)}</td>
                        <td class=\"loss\">${formatCurrency(v.totalCost)}</td>
                        <td class=\"${v.balance >= 0 ? 'profit' : 'loss'}\">${formatCurrency(v.balance)}</td>
                        <td>${formatCurrency(v.revenuePerKm)}</td>
                        <td>${formatCurrency(v.costPerKm)}</td>
                      </tr>`]
                    )}
                  </div>
                </div>
              </div>
            `).join('')}
            
            <h3>Desempenho por Funcion&aacute;rio</h3>
            ${renderTable(['Nome', 'Receita Total', 'No. Viagens', 'Receita M&eacute;dia/Viagem'], employeeAnalysis.map(e => `<tr><td>${e.name}</td><td class=\"profit\">${formatCurrency(e.totalRevenue)}</td><td>${formatInteger(e.tripsCount)}</td><td>${formatCurrency(e.avgRevenuePerTrip)}</td></tr>`))}
            
            <h3>Receitas Di&aacute;rias por Funcion&aacute;rio</h3>
            ${employeeAnalysis.map(e => `<div><h4>${e.name}</h4>${renderTable(['Data', 'Valor da Receita'], e.dailyRevenues.map(dr => `<tr><td>${dr.date}</td><td class=\"profit\">${formatCurrency(dr.amount)}</td></tr>`))}</div>`).join('')}

            <div class=\"page-break\"></div>
            <h2>Registros Completos do Per&iacute;odo</h2>
            <h3>Historico de Receitas (${formatInteger(detailedLists.revenues.length)} registros)</h3>
            ${renderTable(['Data', 'Funcion&aacute;rio', 'Ve&iacute;culo', 'Descri&ccedil;&atilde;o', 'Valor'], detailedLists.revenues.map(i => `<tr><td>${format(parseISO(i.date), 'dd/MM/yyyy')}</td><td>${i.Employee?.name || '-'}</td><td>${i.Vehicle?.plate || '-'}</td><td>${i.description}</td><td class=\"profit\">${formatCurrency(i.amount)}</td></tr>`))}
            <div class=\"page-break\"></div>
            <h3>Historico de Abastecimentos (${formatInteger(detailedLists.refuelings.length)} registros)</h3>
            ${renderTable(['Data', 'Ve&iacute;culo', 'Litros', 'Pre&ccedil;o/Litro', 'Custo Total', 'KM Ve&iacute;culo'], detailedLists.refuelings.map(i => `<tr><td>${format(parseISO(i.date), 'dd/MM/yyyy')}</td><td>${i.Vehicle?.plate || '-'}</td><td>${formatNumber(i.liters)}</td><td>${formatCurrency(i.price_per_liter)}</td><td class=\"loss\">${formatCurrency(i.total_cost)}</td><td>${formatNumber(i.vehicle_km)}</td></tr>`))}
            <div class=\"page-break\"></div>
            <h3>Historico de Manuten&ccedil;&otilde;es (${formatInteger(detailedLists.maintenances.length)} registros)</h3>
            ${renderTable(['Data', 'Ve&iacute;culo', 'Tipo', 'Descri&ccedil;&atilde;o', 'Custo'], detailedLists.maintenances.map(i => `<tr><td>${format(parseISO(i.date), 'dd/MM/yyyy')}</td><td>${i.Vehicle?.plate || '-'}</td><td>${i.type}</td><td>${i.description}</td><td class=\"loss\">${formatCurrency(i.cost)}</td></tr>`))}
            <h3>Historico de Despesas Gerais (${formatInteger(detailedLists.generalExpenses.length)} registros)</h3>
            ${renderTable(['Data', 'Categoria', 'Descri&ccedil;&atilde;o', 'Valor'], detailedLists.generalExpenses.map(i => `<tr><td>${format(parseISO(i.date), 'dd/MM/yyyy')}</td><td>${i.category}</td><td>${i.description}</td><td class=\"loss\">${formatCurrency(i.amount)}</td></tr>`))}
  
            <script>
              new Chart(document.getElementById('expensesChart').getContext('2d'), { type: 'pie', data: { labels: ['Combust&iacute;vel', 'Manuten&ccedil;&atilde;o', 'Despesas Gerais'], datasets: [{ data: [${chartData.pie.join(',')}], backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] }] }, options: { responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Composi&ccedil;&atilde;o das Despesas' } } } });
              new Chart(document.getElementById('revenueChart').getContext('2d'), { type: 'bar', data: { labels: ['Receita', 'Despesas'], datasets: [{ label: 'Valores (R$)', data: [${chartData.bar.join(',')}], backgroundColor: ['#4CAF50', '#F44336'] }] }, options: { responsive: true, plugins: { legend: { display: false }, title: { display: true, text: 'Receita vs. Despesas' } }, scales: { y: { beginAtZero: true } } } });
              new Chart(document.getElementById('dailyTrendChart').getContext('2d'), { type: 'line', data: { labels: [${chartData.line.map(d => `'${d.date}'`).join(',')}], datasets: [ { label: 'Receita Di&aacute;ria', data: [${chartData.line.map(d => d.revenue).join(',')}], borderColor: '#4CAF50', backgroundColor: 'rgba(76, 175, 80, 0.1)', fill: true, tension: 0.1 }, { label: 'Despesa Di&aacute;ria', data: [${chartData.line.map(d => d.expenses).join(',')}], borderColor: '#F44336', backgroundColor: 'rgba(244, 67, 54, 0.1)', fill: true, tension: 0.1 } ] }, options: { responsive: true, plugins: { title: { display: true, text: 'Evolucao Di&aacute;ria de Receitas e Despesas' } }, scales: { y: { beginAtZero: true } } } });
            </script>
          </div>
        </body>
      </html>
    `;
}
