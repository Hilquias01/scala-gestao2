const { randomUUID } = require('crypto');

const sendError = (res, status, message, code, error, req) => {
  const traceId = randomUUID();
  if (error) {
    const route = req ? `${req.method} ${req.originalUrl}` : 'unknown-route';
    console.error(`[${traceId}] ${route}`, error);
  }
  return res.status(status).json({
    message,
    code,
    traceId,
  });
};

// Converte valores DECIMAL do Sequelize para números (não strings)
const toNumber = (value, decimalPlaces = 2) => {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value);
  return Number.isNaN(num) ? 0 : Math.round(num * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces);
};

// Converte um objeto recursivamente, convertendo strings de números para Number
const convertDecimalsToNumbers = (obj, decimalFields = []) => {
  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimalsToNumbers(item, decimalFields));
  }
  if (obj !== null && typeof obj === 'object') {
    const converted = {};
    for (const key in obj) {
      if (decimalFields.includes(key) && typeof obj[key] === 'string') {
        converted[key] = toNumber(obj[key]);
      } else if (obj[key] !== null && typeof obj[key] === 'object') {
        converted[key] = convertDecimalsToNumbers(obj[key], decimalFields);
      } else {
        converted[key] = obj[key];
      }
    }
    return converted;
  }
  return obj;
};

module.exports = { sendError, toNumber, convertDecimalsToNumbers };
