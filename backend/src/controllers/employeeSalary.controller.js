const { EmployeeSalary, Employee } = require('../models');
const { Op } = require('sequelize');
const { sendError } = require('../utils/response');

// Create salary record
exports.create = async (req, res) => {
  try {
    const { employee_id, period, amount, notes } = req.body;
    if (!employee_id || !period || !amount) {
      return sendError(res, 400, 'Funcionario, periodo e valor sao obrigatorios.', 'VALIDATION_ERROR', null, req);
    }
    const newSalary = await EmployeeSalary.create({ employee_id, period, amount, notes: notes || null });
    res.status(201).json(newSalary);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Ja existe salario para este funcionario neste periodo.', 'CONFLICT', error, req);
    }
    sendError(res, 500, 'Erro ao cadastrar salario.', 'INTERNAL_ERROR', error, req);
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
    sendError(res, 500, 'Erro ao buscar salarios.', 'INTERNAL_ERROR', error, req);
  }
};

// Update salary record
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await EmployeeSalary.update(req.body, { where: { id } });
    if (!updated) return sendError(res, 404, 'Registro nao encontrado.', 'NOT_FOUND', null, req);
    const updatedSalary = await EmployeeSalary.findByPk(id, {
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'name'] }],
    });
    res.status(200).json(updatedSalary);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, 'Ja existe salario para este funcionario neste periodo.', 'CONFLICT', error, req);
    }
    sendError(res, 500, 'Erro ao atualizar salario.', 'INTERNAL_ERROR', error, req);
  }
};

// Delete salary record
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await EmployeeSalary.destroy({ where: { id } });
    if (!deleted) return sendError(res, 404, 'Registro nao encontrado.', 'NOT_FOUND', null, req);
    res.status(204).send();
  } catch (error) {
    sendError(res, 500, 'Erro ao deletar salario.', 'INTERNAL_ERROR', error, req);
  }
};
