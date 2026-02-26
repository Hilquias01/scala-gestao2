const { sendError } = require('../utils/response');

const requireRole = (...allowedRoles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role) {
    return sendError(res, 401, 'Usuário não autenticado.', 'UNAUTHORIZED', null, req);
  }
  if (!allowedRoles.includes(role)) {
    return sendError(res, 403, 'Acesso negado para este perfil.', 'FORBIDDEN', null, req);
  }
  return next();
};

module.exports = requireRole;
