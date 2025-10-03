const { Vehicle, Employee, Refueling, Maintenance, GeneralExpense, Revenue } = require('../models');
const { Op } = require('sequelize');
const { subMonths, format, startOfMonth, endOfMonth } = require('date-fns');

// This helper function now works with date strings, avoiding timezone issues.
const getPeriod = (req) => {
  let { startDate, endDate } = req.query;

  if (startDate && endDate) {
    return { start: startDate, end: endDate }; // Simply returns the strings
  } else {
    // Default: current month
    const today = new Date();
    const start = format(startOfMonth(today), 'yyyy-MM-dd');
    const end = format(endOfMonth(today), 'yyyy-MM-dd');
    return { start, end };
  }
};

exports.getKpis = async (req, res) => {
  try {
    const { start, end } = getPeriod(req);

    const totalVehicles = await Vehicle.count({ where: { status: 'ativo' } });
    const totalEmployees = await Employee.count({ where: { status: 'ativo' } });

    const refuelingCost = await Refueling.sum('total_cost', { where: { date: { [Op.between]: [start, end] } } });
    const maintenanceCost = await Maintenance.sum('cost', { where: { date: { [Op.between]: [start, end] } } });
    const generalExpenseAmount = await GeneralExpense.sum('amount', { where: { date: { [Op.between]: [start, end] } } });
    const totalRevenue = await Revenue.sum('amount', { where: { date: { [Op.between]: [start, end] } } });
    
    const totalMonthCost = (refuelingCost || 0) + (maintenanceCost || 0) + (generalExpenseAmount || 0);

    res.json({
      totalVehicles,
      totalEmployees,
      totalMonthCost: parseFloat(totalMonthCost).toFixed(2),
      totalMonthRevenue: parseFloat(totalRevenue || 0).toFixed(2),
    });
  } catch (error) { 
    console.error("Erro ao buscar KPIs:", error);
    res.status(500).json({ message: 'Erro ao buscar KPIs.' }); 
  }
};

// This function is independent of the date filter and shows the last 6 months.
exports.getCostEvolution = async (req, res) => {
  try {
    const labels = [];
    const costData = []; // Renomeado de 'data' para clareza
    const revenueData = []; // Novo array para as receitas

    for (let i = 5; i >= 0; i--) {
      const targetDate = subMonths(new Date(), i);
      const monthLabel = format(targetDate, 'MM/yyyy');
      labels.push(monthLabel);

      const start = startOfMonth(targetDate);
      const end = endOfMonth(targetDate);

      // Lógica de Custos (existente)
      const refuelingCost = await Refueling.sum('total_cost', { where: { date: { [Op.between]: [start, end] } } });
      const maintenanceCost = await Maintenance.sum('cost', { where: { date: { [Op.between]: [start, end] } } });
      const generalExpenseAmount = await GeneralExpense.sum('amount', { where: { date: { [Op.between]: [start, end] } } });
      const totalCost = (refuelingCost || 0) + (maintenanceCost || 0) + (generalExpenseAmount || 0);
      costData.push(totalCost);

      // ## NOVA LÓGICA: Adiciona o cálculo de Receitas ##
      const totalRevenue = await Revenue.sum('amount', { where: { date: { [Op.between]: [start, end] } } });
      revenueData.push(totalRevenue || 0);
    }

    // Retorna os dados de custos e receitas
    res.json({ labels, costData, revenueData });

  } catch (error) {
    console.error("Erro ao buscar dados de evolução de custos:", error);
    res.status(500).json({ message: 'Erro ao buscar dados do gráfico.' });
  }
};

// This function is also independent of the date filter.
exports.getRevenueVsExpenses = async (req, res) => {
  try {
    const labels = [];
    const revenueData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      labels.push(format(date, 'MM/yyyy'));
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const revenue = await Revenue.sum('amount', { where: { date: { [Op.between]: [start, end] } } });
      const refueling = await Refueling.sum('total_cost', { where: { date: { [Op.between]: [start, end] } } });
      const maintenance = await Maintenance.sum('cost', { where: { date: { [Op.between]: [start, end] } } });
      const general = await GeneralExpense.sum('amount', { where: { date: { [Op.between]: [start, end] } } });

      revenueData.push(revenue || 0);
      expenseData.push((refueling || 0) + (maintenance || 0) + (general || 0));
    }
    res.json({ labels, revenueData, expenseData });
  } catch (error) {
    console.error("Erro ao buscar dados de receitas vs. despesas:", error);
    res.status(500).json({ message: 'Erro ao buscar dados.' });
  }
};


// This function now uses the date filter.
exports.getSpendingByCategory = async (req, res) => {
  try {
    const { start, end } = getPeriod(req);
    const refuelingTotal = await Refueling.sum('total_cost', { where: { date: { [Op.between]: [start, end] } } });
    const maintenanceTotal = await Maintenance.sum('cost', { where: { date: { [Op.between]: [start, end] } } });
    const generalExpenseTotal = await GeneralExpense.sum('amount', { where: { date: { [Op.between]: [start, end] } } });
    const data = [refuelingTotal || 0, maintenanceTotal || 0, generalExpenseTotal || 0];
    const labels = ['Abastecimentos', 'Manutenções', 'Despesas Gerais'];
    res.json({ labels, data });
  } catch (error) { 
    console.error("Erro ao buscar gastos por categoria:", error);
    res.status(500).json({ message: 'Erro ao buscar dados do gráfico.' }); 
  }
};

// This function now uses the date filter.
exports.getCostsPerVehicle = async (req, res) => {
  try {
    const { start, end } = getPeriod(req);
    const vehicles = await Vehicle.findAll({ where: { status: 'ativo' } });
    const labels = [];
    const refuelingData = [];
    const maintenanceData = [];
    for (const vehicle of vehicles) {
      labels.push(vehicle.plate);
      const refueling = await Refueling.sum('total_cost', { where: { vehicle_id: vehicle.id, date: { [Op.between]: [start, end] } } });
      const maintenance = await Maintenance.sum('cost', { where: { vehicle_id: vehicle.id, date: { [Op.between]: [start, end] } } });
      refuelingData.push(refueling || 0);
      maintenanceData.push(maintenance || 0);
    }
    res.json({ labels, refuelingData, maintenanceData });
  } catch (error) { 
    console.error("Erro ao buscar custos por veículo:", error);
    res.status(500).json({ message: 'Erro ao buscar custos por veículo.' }); 
  }
};

// This function now uses the date filter.
exports.getTop5ExpensiveVehicles = async (req, res) => {
  try {
    const { start, end } = getPeriod(req);
    const vehicles = await Vehicle.findAll();
    const vehicleCosts = [];
    for (const vehicle of vehicles) {
      const refueling = await Refueling.sum('total_cost', { where: { vehicle_id: vehicle.id, date: { [Op.between]: [start, end] } } });
      const maintenance = await Maintenance.sum('cost', { where: { vehicle_id: vehicle.id, date: { [Op.between]: [start, end] } } });
      const totalCost = (refueling || 0) + (maintenance || 0);
      if (totalCost > 0) {
        vehicleCosts.push({ plate: vehicle.plate, totalCost });
      }
    }
    const top5 = vehicleCosts.sort((a, b) => b.totalCost - a.totalCost).slice(0, 5);
    const labels = top5.map(v => v.plate);
    const data = top5.map(v => v.totalCost);
    res.json({ labels, data });
  } catch (error) { 
    console.error("Erro ao buscar top 5 veículos:", error);
    res.status(500).json({ message: 'Erro ao buscar top 5 veículos.' }); 
  }
};