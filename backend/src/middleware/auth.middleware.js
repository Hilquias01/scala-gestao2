const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Pega o token do header
  const token = req.header('x-auth-token');

  // Verifica se não há token
  if (!token) {
    return res.status(401).json({ message: 'Nenhum token, autorização negada.' });
  }

  // Verifica o token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido.' });
  }
};