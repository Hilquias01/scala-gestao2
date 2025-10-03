const { Vehicle } = require('../models');

// Criar um novo veículo
exports.create = async (req, res) => {
  try {
    const { plate, model, manufacturer, year, initial_km, status } = req.body;

    // Validação simples
    if (!plate || !model || !year || !initial_km) {
      return res.status(400).json({ message: 'Campos obrigatórios estão faltando.' });
    }

    const newVehicle = await Vehicle.create({ plate, model, manufacturer, year, initial_km, status });
    res.status(201).json(newVehicle);
  } catch (error) {
    // Verifica erro de placa duplicada
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: `A placa '${req.body.plate}' já está cadastrada.` });
    }
    res.status(500).json({ message: 'Erro ao criar veículo.', error: error.message });
  }
};

// Listar todos os veículos
exports.findAll = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({ order: [['model', 'ASC']] });
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar veículos.', error: error.message });
  }
};

// Encontrar um veículo por ID
exports.findOne = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByPk(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Veículo não encontrado.' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar veículo.', error: error.message });
  }
};

// Atualizar um veículo
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Vehicle.update(req.body, { where: { id: id } });

    if (!updated) {
      return res.status(404).json({ message: 'Veículo não encontrado.' });
    }
    const updatedVehicle = await Vehicle.findByPk(id);
    res.status(200).json(updatedVehicle);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar veículo.', error: error.message });
  }
};

// Deletar um veículo
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vehicle.destroy({ where: { id: id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Veículo não encontrado.' });
    }
    res.status(204).send(); // 204 No Content - sucesso sem corpo de resposta
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar veículo.', error: error.message });
  }
};