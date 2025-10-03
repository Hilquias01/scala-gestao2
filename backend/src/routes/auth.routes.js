const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');

// @route   POST api/auth/register
// @desc    Registra um novo usuário
// @access  Public
router.post('/register', authController.register);

// @route   POST api/auth/login
// @desc    Autentica o usuário e retorna o token
// @access  Public
router.post('/login', authController.login);

// @route   GET api/auth/user
// @desc    Obtém dados do usuário logado (exemplo de rota protegida)
// @access  Private
router.get('/user', authMiddleware, (req, res) => {
  // req.user foi adicionado pelo middleware
  res.json(req.user);
});


module.exports = router;