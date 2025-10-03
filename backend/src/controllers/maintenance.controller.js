const { Maintenance } = require('../models');

// Criar um novo registro de manutenção
exports.create = async (req, res) => {
  try {
    const newMaintenance = await Maintenance.create(req.body);
    res.status(201).json(newMaintenance);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao registrar manutenção.', error: error.message });
  }
};

// Listar todas as manutenções de um veículo específico
exports.findAllByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenances = await Maintenance.findAll({
      where: { vehicle_id: vehicleId },
      order: [['date', 'DESC']],
    });
    res.status(200).json(maintenances);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar manutenções.', error: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Maintenance.update(req.body, { where: { id: id } });
    if (!updated) return res.status(404).json({ message: 'Registro não encontrado.' });
    const updatedMaintenance = await Maintenance.findByPk(id);
    res.status(200).json(updatedMaintenance);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar manutenção.', error: error.message });
  }
};

// Deletar um registro de manutenção
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Maintenance.destroy({ where: { id: id } });
    if (!deleted) return res.status(404).json({ message: 'Registro não encontrado.' });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar manutenção.', error: error.message });
  }
};