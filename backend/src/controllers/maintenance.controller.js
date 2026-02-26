const { Maintenance } = require('../models');
const { sendError } = require('../utils/response');

// Criar um novo registro de manutenção
exports.create = async (req, res) => {
  try {
    const newMaintenance = await Maintenance.create(req.body);
    res.status(201).json(newMaintenance);
  } catch (error) {
    sendError(res, 500, 'Erro ao registrar manutenção.', 'INTERNAL_ERROR', error, req);
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
    sendError(res, 500, 'Erro ao buscar manutenções.', 'INTERNAL_ERROR', error, req);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Maintenance.update(req.body, { where: { id: id } });
    if (!updated) return sendError(res, 404, 'Registro não encontrado.', 'NOT_FOUND', null, req);
    const updatedMaintenance = await Maintenance.findByPk(id);
    res.status(200).json(updatedMaintenance);
  } catch (error) {
    sendError(res, 500, 'Erro ao atualizar manutenção.', 'INTERNAL_ERROR', error, req);
  }
};

// Deletar um registro de manutenção
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Maintenance.destroy({ where: { id: id } });
    if (!deleted) return sendError(res, 404, 'Registro não encontrado.', 'NOT_FOUND', null, req);
    res.status(204).send();
  } catch (error) {
    sendError(res, 500, 'Erro ao deletar manutenção.', 'INTERNAL_ERROR', error, req);
  }
};
