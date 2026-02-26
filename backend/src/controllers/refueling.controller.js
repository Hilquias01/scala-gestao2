const { Refueling, Employee } = require('../models');
const { sendError } = require('../utils/response');

// Criar um novo abastecimento
exports.create = async (req, res) => {
  try {
    const newRefueling = await Refueling.create(req.body);
    res.status(201).json(newRefueling);
  } catch (error) {
    sendError(res, 500, 'Erro ao registrar abastecimento.', 'INTERNAL_ERROR', error, req);
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
    sendError(res, 500, 'Erro ao buscar abastecimentos.', 'INTERNAL_ERROR', error, req);
  }
};

// (Futuramente, podemos adicionar rotas para deletar/editar um abastecimento)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Refueling.update(req.body, { where: { id: id } });
    if (!updated) return sendError(res, 404, 'Registro não encontrado.', 'NOT_FOUND', null, req);
    const updatedRefueling = await Refueling.findByPk(id);
    res.status(200).json(updatedRefueling);
  } catch (error) {
    sendError(res, 500, 'Erro ao atualizar abastecimento.', 'INTERNAL_ERROR', error, req);
  }
};

// Deletar um registro de abastecimento
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Refueling.destroy({ where: { id: id } });
    if (!deleted) return sendError(res, 404, 'Registro não encontrado.', 'NOT_FOUND', null, req);
    res.status(204).send();
  } catch (error) {
    sendError(res, 500, 'Erro ao deletar abastecimento.', 'INTERNAL_ERROR', error, req);
  }
};
