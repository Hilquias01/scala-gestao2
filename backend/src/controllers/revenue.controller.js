const { Revenue, Vehicle, Employee } = require('../models');

// Criar uma nova receita
exports.create = async (req, res) => {
  try {
    const { date, description, amount, vehicle_id, employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({ message: 'O funcionário responsável é obrigatório.' });
    }
    const revenueData = { date, description, amount, vehicle_id: vehicle_id || null, employee_id };
    const newRevenue = await Revenue.create(revenueData);
    res.status(201).json(newRevenue);
  } catch (error) {
    console.error("Erro ao criar receita:", error);
    res.status(500).json({ message: 'Erro ao criar receita.', error: error.message });
  }
};

// Listar todas as receitas
exports.findAll = async (req, res) => {
  try {
    const revenues = await Revenue.findAll({
      order: [['date', 'DESC']],
      include: [
        { model: Vehicle, attributes: ['plate', 'model'] },
        { model: Employee, attributes: ['name'] }
      ]
    });
    res.status(200).json(revenues);
  } catch (error) {
    console.error("Erro ao buscar receitas:", error);
    res.status(500).json({ message: 'Erro ao buscar receitas.', error: error.message });
  }
};

// Atualizar uma receita
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, amount, vehicle_id, employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({ message: 'O funcionário responsável é obrigatório.' });
    }
    const revenueData = { date, description, amount, vehicle_id: vehicle_id || null, employee_id };
    const [updated] = await Revenue.update(revenueData, { where: { id: id } });
    if (!updated) return res.status(404).json({ message: 'Receita não encontrada.' });
    const updatedRevenue = await Revenue.findByPk(id);
    res.status(200).json(updatedRevenue);
  } catch (error) {
    console.error("Erro ao atualizar receita:", error);
    res.status(500).json({ message: 'Erro ao atualizar receita.', error: error.message });
  }
};

// Deletar uma receita
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Revenue.destroy({ where: { id: id } });
    if (!deleted) return res.status(404).json({ message: 'Receita não encontrada.' });
    res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar receita:", error);
    res.status(500).json({ message: 'Erro ao deletar receita.', error: error.message });
  }
};