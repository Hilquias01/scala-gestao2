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

module.exports = { sendError };
