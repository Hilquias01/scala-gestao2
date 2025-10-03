const { GeneralExpense } = require('../models');

// CRUD Padrão
exports.create = async (req, res) => {
  try {
    const newExpense = await GeneralExpense.create(req.body);
    res.status(201).json(newExpense);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar despesa.', error: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const expenses = await GeneralExpense.findAll({ order: [['date', 'DESC']] });
    res.status(200).json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar despesas.', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await GeneralExpense.update(req.body, { where: { id: id } });
    if (!updated) return res.status(404).json({ message: 'Despesa não encontrada.' });
    const updatedExpense = await GeneralExpense.findByPk(id);
    res.status(200).json(updatedExpense);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar despesa.', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await GeneralExpense.destroy({ where: { id: id } });
    if (!deleted) return res.status(404).json({ message: 'Despesa não encontrada.' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar despesa.', error: error.message });
  }
};