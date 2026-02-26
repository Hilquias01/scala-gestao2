const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

module.exports = function (req, res, next) {
  // Pega o token do header
  const token = req.header('x-auth-token');

  // Verifica se não há token
  if (!token) {
    return sendError(res, 401, 'Nenhum token, autorização negada.', 'UNAUTHORIZED', null, req);
  }

  // Verifica o token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    sendError(res, 401, 'Token inválido.', 'UNAUTHORIZED', err, req);
  }
};
