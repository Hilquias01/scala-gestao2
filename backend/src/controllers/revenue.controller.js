const { Revenue, Vehicle, Employee, sequelize } = require('../models');
const { Op } = require('sequelize');
const xlsx = require('xlsx');
const { sendError } = require('../utils/response');

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

const formatDateForExport = (value) => {
  if (!value) return '';
  const text = String(value);
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return `${pad2(parsed.getUTCDate())}/${pad2(parsed.getUTCMonth() + 1)}/${parsed.getUTCFullYear()}`;
  }
  return text;
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

const buildHeaderMap = (headers) => headers.reduce((acc, header, idx) => {
  if (header) acc[String(header).trim()] = idx;
  return acc;
}, {});

const buildDuplicateKey = (date, amount, description) => `${date}|${amount}|${String(description || '').toLowerCase()}`;

const analyzeImport = async ({ buffer, employeeId, employeeByPedido, transaction }) => {
  const toNullableId = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    return parsed;
  };

  const employeeByPedidoMap = employeeByPedido && typeof employeeByPedido === 'object' && !Array.isArray(employeeByPedido)
    ? employeeByPedido
    : null;

  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const headers = rows[0] || [];
  const headerMap = buildHeaderMap(headers);
  const isPedidosVenda = PEDIDOS_HEADERS.every((h) => headerMap[h] !== undefined);

  const importRows = [];
  const previewRows = [];
  const duplicateRows = [];
  const invalidRows = [];
  let skippedStatus = 0;
  let totalRows = 0;

  if (isPedidosVenda) {
    const existing = await Revenue.findAll({
      attributes: ['description'],
      where: { description: { [Op.like]: 'Pedido %' } },
      transaction,
    });
    const existingPedidos = new Set();
    existing.forEach((rev) => {
      const numero = extractPedidoNumberFromDescription(rev.description);
      if (numero) existingPedidos.add(numero);
    });
    const seenInFile = new Set();

    totalRows = Math.max(rows.length - 1, 0);
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      const numero = normalizePedidoNumber(row[headerMap['Número']]);
      if (!numero) {
        invalidRows.push({ row: i + 1, reason: 'Número inválido' });
        continue;
      }

      const statusVendaRaw = row[headerMap['Status']];
      const statusPagamentoRaw = row[headerMap['Status do Pagamento']];
      const statusVenda = statusVendaRaw ? String(statusVendaRaw).trim().toLowerCase() : '';
      const statusPagamento = statusPagamentoRaw ? String(statusPagamentoRaw).trim().toLowerCase() : '';

      if (statusVenda.includes('cancel') || statusPagamento.includes('cancel')) {
        skippedStatus += 1;
        continue;
      }

      const date = parseDateToISO(row[headerMap['Data Emissão']]);
      const amount = parseAmount(row[headerMap['Valor Total']]);
      if (!date || amount === null) {
        invalidRows.push({ row: i + 1, reason: 'Data ou valor inválido' });
        continue;
      }

      const cliente = row[headerMap['Cliente']] || '';
      const description = cliente ? `Pedido ${numero} - ${cliente}` : `Pedido ${numero}`;

      if (existingPedidos.has(numero)) {
        duplicateRows.push({ row: i + 1, numero, description, date, amount, reason: 'Já existe' });
        continue;
      }

      if (seenInFile.has(numero)) {
        duplicateRows.push({ row: i + 1, numero, description, date, amount, reason: 'Duplicado na planilha' });
        continue;
      }

      const perPedidoEmployeeId = employeeByPedidoMap ? toNullableId(employeeByPedidoMap[numero]) : null;

      importRows.push({
        date,
        description,
        amount,
        employee_id: perPedidoEmployeeId || employeeId || null,
        vehicle_id: null,
      });
      previewRows.push({ row: i + 1, numero, description, date, amount });
      existingPedidos.add(numero);
      seenInFile.add(numero);
    }
  } else {
    const data = xlsx.utils.sheet_to_json(sheet);
    totalRows = data.length;
    const candidateRows = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const formattedDate = parseDateToISO(row.Vencimento);
      const amount = parseAmount(row.Valor);
      const description = `${row.Conta} - Cliente: ${row.Cliente || 'Não informado'}`;

      if (formattedDate && amount !== null) {
        candidateRows.push({
          row: i + 2,
          date: formattedDate,
          amount,
          description,
        });
      } else {
        invalidRows.push({ row: i + 2, reason: 'Data ou valor inválido' });
      }
    }

    let existingKeys = new Set();
    if (candidateRows.length > 0) {
      const dates = candidateRows.map((item) => item.date).filter(Boolean).sort();
      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];
      if (minDate && maxDate) {
        const existing = await Revenue.findAll({
          attributes: ['date', 'amount', 'description'],
          where: { date: { [Op.between]: [minDate, maxDate] } },
          transaction,
        });
        existingKeys = new Set(existing.map((rev) => buildDuplicateKey(rev.date, rev.amount, rev.description)));
      }
    }

    const seenInFile = new Set();
    for (const item of candidateRows) {
      const key = buildDuplicateKey(item.date, item.amount, item.description);
      if (existingKeys.has(key)) {
        duplicateRows.push({ ...item, reason: 'Já existe' });
        continue;
      }
      if (seenInFile.has(key)) {
        duplicateRows.push({ ...item, reason: 'Duplicado na planilha' });
        continue;
      }
      importRows.push({
        date: item.date,
        description: item.description,
        amount: item.amount,
        employee_id: employeeId || null,
        vehicle_id: null,
      });
      previewRows.push(item);
      seenInFile.add(key);
    }
  }

  return {
    format: isPedidosVenda ? 'pedidos_venda' : 'generico',
    totalRows,
    importRows,
    previewRows,
    duplicateRows,
    invalidRows,
    skippedStatus,
  };
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

    // Filtro de busca por descrição, funcionário ou veículo
    if (search) {
      const term = `%${search}%`;
      where[Op.or] = [
        { description: { [Op.like]: term } },
        { '$Employee.name$': { [Op.like]: term } },
        { '$Vehicle.plate$': { [Op.like]: term } },
        { '$Vehicle.model$': { [Op.like]: term } },
      ];
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
    sendError(res, 500, 'Erro ao buscar receitas.', 'INTERNAL_ERROR', error, req);
  }
};

// Exportar receitas para planilha
exports.exportRevenues = async (req, res) => {
  try {
    const { startDate, endDate, search } = req.query;
    const where = {};

    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }

    if (search) {
      const term = `%${search}%`;
      where[Op.or] = [
        { description: { [Op.like]: term } },
        { '$Employee.name$': { [Op.like]: term } },
        { '$Vehicle.plate$': { [Op.like]: term } },
        { '$Vehicle.model$': { [Op.like]: term } },
      ];
    }

    const revenues = await Revenue.findAll({
      where,
      order: [['date', 'DESC']],
      include: [
        { model: Vehicle, attributes: ['plate', 'model'] },
        { model: Employee, attributes: ['name'] }
      ]
    });

    const rows = revenues.map((revenue) => ({
      Data: formatDateForExport(revenue.date),
      Descricao: revenue.description,
      Funcionario: revenue.Employee?.name || '',
      Veiculo: revenue.Vehicle ? `${revenue.Vehicle.plate} - ${revenue.Vehicle.model}` : '',
      Valor: Number(revenue.amount) || 0,
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(rows, {
      header: ['Data', 'Descricao', 'Funcionario', 'Veiculo', 'Valor'],
    });
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Receitas');

    const buffer = xlsx.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const fileName = `receitas-${startDate || 'todas'}-a-${endDate || 'todas'}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  } catch (error) {
    sendError(res, 500, 'Erro ao exportar planilha.', 'INTERNAL_ERROR', error, req);
  }
};

// Pré-visualizar importação
exports.previewImport = async (req, res) => {
  try {
    if (!req.file) {
      return sendError(res, 400, 'Nenhum arquivo enviado.', 'VALIDATION_ERROR', null, req);
    }

    const employeeId = req.body.employee_id ? parseInt(req.body.employee_id, 10) : null;
    let employeeByPedido = null;
    if (req.body.employee_by_pedido) {
      try {
        const parsed = JSON.parse(req.body.employee_by_pedido);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          employeeByPedido = parsed;
        }
      } catch (error) {
        employeeByPedido = null;
      }
    }
    const result = await analyzeImport({ buffer: req.file.buffer, employeeId, employeeByPedido });

    res.status(200).json({
      message: 'Pré-visualização gerada.',
      format: result.format,
      totalRows: result.totalRows,
      importCount: result.importRows.length,
      duplicateCount: result.duplicateRows.length,
      invalidCount: result.invalidRows.length,
      skippedStatus: result.skippedStatus,
      preview: result.previewRows,
      duplicates: result.duplicateRows,
      invalidRows: result.invalidRows,
    });
  } catch (error) {
    sendError(res, 500, 'Erro ao pré-visualizar planilha.', 'INTERNAL_ERROR', error, req);
  }
};

// Importar receitas a partir de planilha Excel/CSV
exports.importRevenues = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    if (!req.file) {
      return sendError(res, 400, 'Nenhum arquivo enviado.', 'VALIDATION_ERROR', null, req);
    }

    const employeeId = req.body.employee_id ? parseInt(req.body.employee_id, 10) : null;
    let employeeByPedido = null;
    if (req.body.employee_by_pedido) {
      try {
        const parsed = JSON.parse(req.body.employee_by_pedido);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          employeeByPedido = parsed;
        }
      } catch (error) {
        employeeByPedido = null;
      }
    }
    const result = await analyzeImport({ buffer: req.file.buffer, employeeId, employeeByPedido, transaction: t });

    if (result.importRows.length === 0) {
      await t.commit();
      return res.status(200).json({
        message: 'Nenhum registro elegível para importação.',
        importedCount: 0,
        skippedExisting: result.duplicateRows.length,
        skippedInvalid: result.invalidRows.length,
        skippedStatus: result.skippedStatus,
        totalRows: result.totalRows,
      });
    }

    await Revenue.bulkCreate(result.importRows, { transaction: t });

    await t.commit();
    res.status(201).json({
      message: 'Importação concluída.',
      importedCount: result.importRows.length,
      skippedExisting: result.duplicateRows.length,
      skippedInvalid: result.invalidRows.length,
      skippedStatus: result.skippedStatus,
      totalRows: result.totalRows,
    });
  } catch (error) {
    await t.rollback();
    sendError(res, 500, 'Erro ao processar planilha.', 'INTERNAL_ERROR', error, req);
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
    sendError(res, 500, 'Erro ao criar receita.', 'INTERNAL_ERROR', error, req);
  }
};

// Atualizar uma receita
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const toNullableId = (value) => {
      if (value === null || value === undefined || value === '') return null;
      const parsed = parseInt(value, 10);
      if (Number.isNaN(parsed) || parsed <= 0) return null;
      return parsed;
    };

    const { date, description, amount, vehicle_id, employee_id } = req.body;
    const updateData = {
      ...(date !== undefined ? { date } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(vehicle_id !== undefined ? { vehicle_id: toNullableId(vehicle_id) } : {}),
      ...(employee_id !== undefined ? { employee_id: toNullableId(employee_id) } : {}),
    };

    const [updated] = await Revenue.update(updateData, { where: { id: id } });
    if (!updated) return sendError(res, 404, 'Receita não encontrada.', 'NOT_FOUND', null, req);
    const updatedRevenue = await Revenue.findByPk(id);
    res.status(200).json(updatedRevenue);
  } catch (error) {
    sendError(res, 500, 'Erro ao atualizar receita.', 'INTERNAL_ERROR', error, req);
  }
};

// Deletar uma receita
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Revenue.destroy({ where: { id: id } });
    if (!deleted) return sendError(res, 404, 'Receita não encontrada.', 'NOT_FOUND', null, req);
    res.status(204).send();
  } catch (error) {
    sendError(res, 500, 'Erro ao deletar receita.', 'INTERNAL_ERROR', error, req);
  }
};
