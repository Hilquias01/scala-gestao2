const { Revenue, Vehicle, Employee, sequelize } = require('../models');
const { Op } = require('sequelize');
const xlsx = require('xlsx');

const PEDIDOS_HEADERS = [
  'Número',
  'Status',
  'Status do Pagamento',
  'Cliente',
  'Data Emissão',
  'Valor Total',
];

const normalizePedidoNumber = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text) return null;
  const digits = text.match(/\d+/g);
  if (!digits) return null;
  return digits.join('');
};

const parseAmount = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const hasComma = raw.includes(',');
  const hasDot = raw.includes('.');
  let normalized = raw;
  if (hasComma && hasDot) {
    if (raw.lastIndexOf(',') > raw.lastIndexOf('.')) {
      normalized = raw.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = raw.replace(/,/g, '');
    }
  } else if (hasComma) {
    normalized = raw.replace(/\./g, '').replace(',', '.');
  }
  normalized = normalized.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isNaN(parsed) ? null : parsed;
};

const pad2 = (n) => String(n).padStart(2, '0');

const formatDateFromParts = (y, m, d) => {
  if (!y || !m || !d) return null;
  return `${y}-${pad2(m)}-${pad2(d)}`;
};

const parseDateToISO = (value) => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateFromParts(value.getFullYear(), value.getMonth() + 1, value.getDate());
  }
  if (typeof value === 'number') {
    const parsed = xlsx.SSF.parse_date_code(value);
    if (parsed) {
      return formatDateFromParts(parsed.y, parsed.m, parsed.d);
    }
    const excelEpoch = new Date(Math.round((value - 25569) * 86400 * 1000));
    if (!Number.isNaN(excelEpoch.getTime())) {
      return formatDateFromParts(excelEpoch.getFullYear(), excelEpoch.getMonth() + 1, excelEpoch.getDate());
    }
    return null;
  }
  const text = String(value).trim();
  if (!text) return null;

  const ddmmyyyy = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) return formatDateFromParts(ddmmyyyy[3], ddmmyyyy[2], ddmmyyyy[1]);

  const ddmmyyyyDash = text.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddmmyyyyDash) return formatDateFromParts(ddmmyyyyDash[3], ddmmyyyyDash[2], ddmmyyyyDash[1]);

  const yyyymmdd = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (yyyymmdd) return formatDateFromParts(yyyymmdd[1], yyyymmdd[2], yyyymmdd[3]);

  const parsedDate = new Date(text);
  if (!Number.isNaN(parsedDate.getTime())) {
    return formatDateFromParts(parsedDate.getFullYear(), parsedDate.getMonth() + 1, parsedDate.getDate());
  }

  return null;
};

const extractPedidoNumberFromDescription = (description) => {
  if (!description) return null;
  const match = description.match(/Pedido\s*#?\s*(\d+)/i);
  return match ? match[1] : null;
};

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

    const employeeId = req.body.employee_id ? parseInt(req.body.employee_id, 10) : null;

    // Lê o arquivo a partir do buffer (memória)
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const headers = rows[0] || [];
    const headerMap = headers.reduce((acc, header, idx) => {
      if (header) acc[String(header).trim()] = idx;
      return acc;
    }, {});

    const isPedidosVenda = PEDIDOS_HEADERS.every((h) => headerMap[h] !== undefined);
    const importedRevenues = [];
    let skippedExisting = 0;
    let skippedInvalid = 0;
    let skippedStatus = 0;

    if (isPedidosVenda) {
      const existing = await Revenue.findAll({
        attributes: ['description'],
        where: { description: { [Op.like]: 'Pedido %' } },
        transaction: t,
      });
      const existingPedidos = new Set();
      existing.forEach((rev) => {
        const numero = extractPedidoNumberFromDescription(rev.description);
        if (numero) existingPedidos.add(numero);
      });

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const numero = normalizePedidoNumber(row[headerMap['Número']]);
        if (!numero) {
          skippedInvalid += 1;
          continue;
        }

        const statusVendaRaw = row[headerMap['Status']];
        const statusPagamentoRaw = row[headerMap['Status do Pagamento']];
        const statusVenda = statusVendaRaw ? String(statusVendaRaw).trim().toLowerCase() : '';
        const statusPagamento = statusPagamentoRaw ? String(statusPagamentoRaw).trim().toLowerCase() : '';

        // Importa tudo que NÃO estiver cancelado
        if (statusVenda.includes('cancel')) {
          skippedStatus += 1;
          continue;
        }
        if (statusPagamento.includes('cancel')) {
          skippedStatus += 1;
          continue;
        }

        if (existingPedidos.has(numero)) {
          skippedExisting += 1;
          continue;
        }

        const date = parseDateToISO(row[headerMap['Data Emissão']]);
        const amount = parseAmount(row[headerMap['Valor Total']]);
        if (!date || amount === null) {
          skippedInvalid += 1;
          continue;
        }

        const cliente = row[headerMap['Cliente']] || '';
        importedRevenues.push({
          date,
          description: cliente ? `Pedido ${numero} - ${cliente}` : `Pedido ${numero}`,
          amount,
          employee_id: employeeId || null,
          vehicle_id: null,
        });
        existingPedidos.add(numero);
      }
    } else {
      const data = xlsx.utils.sheet_to_json(sheet);

      for (const row of data) {
        const formattedDate = parseDateToISO(row.Vencimento);
        const amount = parseAmount(row.Valor);

        if (formattedDate && amount !== null) {
          importedRevenues.push({
            date: formattedDate,
            description: `${row.Conta} - Cliente: ${row.Cliente || 'Não informado'}`,
            amount,
            employee_id: employeeId || null,
            vehicle_id: null,
          });
        } else {
          skippedInvalid += 1;
        }
      }
    }

    if (importedRevenues.length === 0) {
      await t.commit();
      return res.status(200).json({
        message: 'Nenhum registro elegível para importação.',
        importedCount: 0,
        skippedExisting,
        skippedInvalid,
        skippedStatus,
        totalRows: rows.length ? rows.length - 1 : 0,
      });
    }

    await Revenue.bulkCreate(importedRevenues, { transaction: t });

    await t.commit();
    res.status(201).json({
      message: 'Importação concluída.',
      importedCount: importedRevenues.length,
      skippedExisting,
      skippedInvalid,
      skippedStatus,
      totalRows: rows.length ? rows.length - 1 : importedRevenues.length,
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
      employee_id: employee_id || null
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
