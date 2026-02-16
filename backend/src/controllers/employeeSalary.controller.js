const { EmployeeSalary, Employee } = require('../models');
const { Op } = require('sequelize');

// Create salary record
exports.create = async (req, res) => {
  try {
    const { employee_id, period, amount, notes } = req.body;
    if (!employee_id || !period || !amount) {
      return res.status(400).json({ message: 'Funcionario, periodo e valor sao obrigatorios.' });
    }
    const newSalary = await EmployeeSalary.create({ employee_id, period, amount, notes: notes || null });
    res.status(201).json(newSalary);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Ja existe salario para este funcionario neste periodo.' });
    }
    res.status(500).json({ message: 'Erro ao cadastrar salario.', error: error.message });
  }
};

// List salary records with optional filters
exports.findAll = async (req, res) => {
  try {
    const { employee_id, period, startPeriod, endPeriod } = req.query;
    const where = {};

    if (employee_id) {
      where.employee_id = employee_id;
    }

    if (period) {
      where.period = period;
    } else if (startPeriod && endPeriod) {
      where.period = { [Op.between]: [startPeriod, endPeriod] };
    }

    const salaries = await EmployeeSalary.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name'] }],
      order: [['period', 'DESC'], ['createdAt', 'DESC']],
    });
    res.status(200).json(salaries);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar salarios.', error: error.message });
  }
};

// Update salary record
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await EmployeeSalary.update(req.body, { where: { id } });
    if (!updated) return res.status(404).json({ message: 'Registro nao encontrado.' });
    const updatedSalary = await EmployeeSalary.findByPk(id, {
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name'] }],
    });
    res.status(200).json(updatedSalary);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Ja existe salario para este funcionario neste periodo.' });
    }
    res.status(500).json({ message: 'Erro ao atualizar salario.', error: error.message });
  }
};

// Delete salary record
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await EmployeeSalary.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Registro nao encontrado.' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar salario.', error: error.message });
  }
};
