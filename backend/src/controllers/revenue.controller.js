const { Revenue, Vehicle, Employee, sequelize } = require('../models');
const { Op } = require('sequelize');
const xlsx = require('xlsx');

// Listar todas as receitas com suporte a filtros
exports.findAll = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const where = {};

    // Filtro por período de data
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    // Filtro de busca por descrição ou cliente (através da descrição)
    if (search) {
      where.description = { [Op.like]: `%${search}%` };
    }

    const revenues = await Revenue.findAll({
      where,
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

// Importar receitas a partir de planilha Excel/CSV
exports.importRevenues = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    }

    // Lê o arquivo a partir do buffer (memória)
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const importedRevenues = [];

    for (const row of data) {
      // Mapeamento baseado na sua planilha: Vencimento, Conta, Cliente, Valor
      // Converte data DD/MM/YYYY para YYYY-MM-DD
      const dateParts = row.Vencimento ? row.Vencimento.split('/') : null;
      const formattedDate = dateParts ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : null;

      if (formattedDate && row.Valor) {
        importedRevenues.push({
          date: formattedDate,
          description: `${row.Conta} - Cliente: ${row.Cliente || 'Não informado'}`,
          amount: parseFloat(row.Valor),
          employee_id: req.user.id, // Define o usuário logado como responsável
          vehicle_id: null // Na planilha não há veículo direto, fica opcional
        });
      }
    }

    if (importedRevenues.length === 0) {
      throw new Error('Nenhum dado válido encontrado na planilha.');
    }

    // Inserção em massa (Bulk Create) para performance
    await Revenue.bulkCreate(importedRevenues, { transaction: t });

    await t.commit();
    res.status(201).json({
      message: `${importedRevenues.length} receitas importadas com sucesso!`,
      count: importedRevenues.length
    });
  } catch (error) {
    await t.rollback();
    console.error("Erro na importação:", error);
    res.status(500).json({ message: 'Erro ao processar planilha.', error: error.message });
  }
};

// Criar uma nova receita manualmente
exports.create = async (req, res) => {
  try {
    const { date, description, amount, vehicle_id, employee_id } = req.body;
    const revenueData = {
      date,
      description,
      amount,
      vehicle_id: vehicle_id || null,
      employee_id: employee_id || req.user.id
    };
    const newRevenue = await Revenue.create(revenueData);
    res.status(201).json(newRevenue);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar receita.', error: error.message });
  }
};

// Atualizar uma receita
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await Revenue.update(req.body, { where: { id: id } });
    if (!updated) return res.status(404).json({ message: 'Receita não encontrada.' });
    const updatedRevenue = await Revenue.findByPk(id);
    res.status(200).json(updatedRevenue);
  } catch (error) {
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
    res.status(500).json({ message: 'Erro ao deletar receita.', error: error.message });
  }
};