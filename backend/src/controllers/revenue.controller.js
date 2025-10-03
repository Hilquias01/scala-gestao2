const { Revenue, Vehicle } = require('../models');

// CRUD Padrão
exports.create = async (req, res) => {
  try {
    const { date, description, amount, vehicle_id } = req.body;
    const revenueData = { date, description, amount, vehicle_id: vehicle_id || null };
    const newRevenue = await Revenue.create(revenueData);
    res.status(201).json(newRevenue);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar receita.', error: error.message });
  }
};

exports.findAll = async (req, res) => {
  try {
    const revenues = await Revenue.findAll({
      order: [['date', 'DESC']],
      include: [{ // Inclui os dados do veículo associado
        model: Vehicle,
        attributes: ['plate', 'model']
      }]
    });
    res.status(200).json(revenues);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar receitas.', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount, vehicle_id } = req.body;
    const revenueData = { date, description, amount, vehicle_id: vehicle_id || null };
    const [updated] = await Revenue.update(revenueData, { where: { id: id } });
    if (!updated) return res.status(404).json({ message: 'Receita não encontrada.' });
    const updatedRevenue = await Revenue.findByPk(id);
    res.status(200).json(updatedRevenue);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar receita.', error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Revenue.destroy({ where: { id: id } });
    if (!deleted) return res.status(404).json({ message: 'Receita não encontrada.' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar receita.', error: error.message });
  }
};