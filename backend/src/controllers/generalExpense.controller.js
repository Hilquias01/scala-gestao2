const { GeneralExpense } = require('../models');
const { sendError } = require('../utils/response');

// CRUD Padrão
exports.create = async (req, res) => {
  try {
    const newExpense = await GeneralExpense.create(req.body);
    res.status(201).json(newExpense);
  } catch (error) {
    sendError(res, 500, 'Erro ao criar despesa.', 'INTERNAL_ERROR', error, req);
  }
};

exports.findAll = async (req, res) => {
  try {
    const expenses = await GeneralExpense.findAll({ order: [['date', 'DESC']] });
    res.status(200).json(expenses);
  } catch (error) {
    sendError(res, 500, 'Erro ao buscar despesas.', 'INTERNAL_ERROR', error, req);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await GeneralExpense.update(req.body, { where: { id: id } });
    if (!updated) return sendError(res, 404, 'Despesa não encontrada.', 'NOT_FOUND', null, req);
    const updatedExpense = await GeneralExpense.findByPk(id);
    res.status(200).json(updatedExpense);
  } catch (error) {
    sendError(res, 500, 'Erro ao atualizar despesa.', 'INTERNAL_ERROR', error, req);
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await GeneralExpense.destroy({ where: { id: id } });
    if (!deleted) return sendError(res, 404, 'Despesa não encontrada.', 'NOT_FOUND', null, req);
    res.status(204).send();
  } catch (error) {
    sendError(res, 500, 'Erro ao deletar despesa.', 'INTERNAL_ERROR', error, req);
  }
};
