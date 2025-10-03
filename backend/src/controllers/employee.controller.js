const { Employee } = require('../models');

// Criar um novo funcionário
exports.create = async (req, res) => {
  try {
    const { name, role, salary, status } = req.body;
    if (!name || !role) {
      return res.status(400).json({ message: 'Nome e Função são obrigatórios.' });
    }
    const newEmployee = await Employee.create({ name, role, salary, status });
    res.status(201).json(newEmployee);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar funcionário.', error: error.message });
  }
};

// Listar todos os funcionários
exports.findAll = async (req, res) => {
  try {
    const employees = await Employee.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar funcionários.', error: error.message });
  }
};

// Atualizar um funcionário
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Employee.update(req.body, { where: { id: id } });

    if (!updated) {
      return res.status(404).json({ message: 'Funcionário não encontrado.' });
    }
    const updatedEmployee = await Employee.findByPk(id);
    res.status(200).json(updatedEmployee);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar funcionário.', error: error.message });
  }
};

// Deletar um funcionário
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employee.destroy({ where: { id: id } });

    if (!deleted) {
      return res.status(404).json({ message: 'Funcionário não encontrado.' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar funcionário.', error: error.message });
  }
};