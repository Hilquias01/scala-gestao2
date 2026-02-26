const { Vehicle } = require('../models');
const { sendError } = require('../utils/response');

// Criar um novo veículo
exports.create = async (req, res) => {
  try {
    const { plate, model, manufacturer, year, initial_km, status } = req.body;

    // Validação simples
    if (!plate || !model || !year || !initial_km) {
      return sendError(res, 400, 'Campos obrigatórios estão faltando.', 'VALIDATION_ERROR', null, req);
    }

    const newVehicle = await Vehicle.create({ plate, model, manufacturer, year, initial_km, status });
    res.status(201).json(newVehicle);
  } catch (error) {
    // Verifica erro de placa duplicada
    if (error.name === 'SequelizeUniqueConstraintError') {
      return sendError(res, 409, `A placa '${req.body.plate}' já está cadastrada.`, 'CONFLICT', error, req);
    }
    sendError(res, 500, 'Erro ao criar veículo.', 'INTERNAL_ERROR', error, req);
  }
};

// Listar todos os veículos
exports.findAll = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({ order: [['model', 'ASC']] });
    res.status(200).json(vehicles);
  } catch (error) {
    sendError(res, 500, 'Erro ao buscar veículos.', 'INTERNAL_ERROR', error, req);
  }
};

// Encontrar um veículo por ID
exports.findOne = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return sendError(res, 404, 'Veículo não encontrado.', 'NOT_FOUND', null, req);
    }
    res.status(200).json(vehicle);
  } catch (error) {
    sendError(res, 500, 'Erro ao buscar veículo.', 'INTERNAL_ERROR', error, req);
  }
};

// Atualizar um veículo
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Vehicle.update(req.body, { where: { id: id } });

    if (!updated) {
      return sendError(res, 404, 'Veículo não encontrado.', 'NOT_FOUND', null, req);
    }
    const updatedVehicle = await Vehicle.findByPk(id);
    res.status(200).json(updatedVehicle);
  } catch (error) {
    sendError(res, 500, 'Erro ao atualizar veículo.', 'INTERNAL_ERROR', error, req);
  }
};

// Deletar um veículo
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vehicle.destroy({ where: { id: id } });

    if (!deleted) {
      return sendError(res, 404, 'Veículo não encontrado.', 'NOT_FOUND', null, req);
    }
    res.status(204).send(); // 204 No Content - sucesso sem corpo de resposta
  } catch (error) {
    sendError(res, 500, 'Erro ao deletar veículo.', 'INTERNAL_ERROR', error, req);
  }
};
