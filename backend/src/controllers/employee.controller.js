const { Employee } = require('../models');
const { sendError } = require('../utils/response');

// Criar um novo funcionário
exports.create = async (req, res) => {
  try {
    const { name, role, salary, status } = req.body;
    if (!name || !role) {
      return sendError(res, 400, 'Nome e Função são obrigatórios.', 'VALIDATION_ERROR', null, req);
    }
    const newEmployee = await Employee.create({ name, role, salary, status });
    res.status(201).json(newEmployee);
  } catch (error) {
    sendError(res, 500, 'Erro ao criar funcionário.', 'INTERNAL_ERROR', error, req);
  }
};

// Listar todos os funcionários
exports.findAll = async (req, res) => {
  try {
    const employees = await Employee.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(employees);
  } catch (error) {
    sendError(res, 500, 'Erro ao buscar funcionários.', 'INTERNAL_ERROR', error, req);
  }
};

// Atualizar um funcionário
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Employee.update(req.body, { where: { id: id } });

    if (!updated) {
      return sendError(res, 404, 'Funcionário não encontrado.', 'NOT_FOUND', null, req);
    }
    const updatedEmployee = await Employee.findByPk(id);
    res.status(200).json(updatedEmployee);
  } catch (error) {
    sendError(res, 500, 'Erro ao atualizar funcionário.', 'INTERNAL_ERROR', error, req);
  }
};

// Deletar um funcionário
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employee.destroy({ where: { id: id } });

    if (!deleted) {
      return sendError(res, 404, 'Funcionário não encontrado.', 'NOT_FOUND', null, req);
    }
    res.status(204).send();
  } catch (error) {
    sendError(res, 500, 'Erro ao deletar funcionário.', 'INTERNAL_ERROR', error, req);
  }
};
