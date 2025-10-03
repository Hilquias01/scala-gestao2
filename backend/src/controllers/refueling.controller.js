const { Refueling, Employee } = require('../models');

// Criar um novo abastecimento
exports.create = async (req, res) => {
  try {
    const newRefueling = await Refueling.create(req.body);
    res.status(201).json(newRefueling);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar abastecimento.', error: error.message });
  }
};

// Listar todos os abastecimentos de um veículo específico
exports.findAllByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const refuelings = await Refueling.findAll({
      where: { vehicle_id: vehicleId },
      // Inclui os dados do funcionário em cada registro de abastecimento
      include: [{ model: Employee, attributes: ['name'] }],
      order: [['date', 'DESC']],
    });
    res.status(200).json(refuelings);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar abastecimentos.', error: error.message });
  }
};

// (Futuramente, podemos adicionar rotas para deletar/editar um abastecimento)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Refueling.update(req.body, { where: { id: id } });
    if (!updated) return res.status(404).json({ message: 'Registro não encontrado.' });
    const updatedRefueling = await Refueling.findByPk(id);
    res.status(200).json(updatedRefueling);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar abastecimento.', error: error.message });
  }
};

// Deletar um registro de abastecimento
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Refueling.destroy({ where: { id: id } });
    if (!deleted) return res.status(404).json({ message: 'Registro não encontrado.' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar abastecimento.', error: error.message });
  }
};