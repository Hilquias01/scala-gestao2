const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models'); // Importa o User a partir do index.js
const { sendError } = require('../utils/response');

// backend/src/controllers/auth.controller.js

exports.register = async (req, res) => {
  // 1. Remova 'role' da desestruturação. Não vamos mais aceitá-lo do formulário.
  const { name, email, password } = req.body;

  try {
    // 2. Ajuste a validação.
    if (!name || !email || !password) {
      return sendError(res, 400, 'Nome, e-mail e senha são obrigatórios.', 'VALIDATION_ERROR', null, req);
    }

    // Verifica se o usuário já existe
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return sendError(res, 409, 'Este e-mail já está cadastrado.', 'CONFLICT', null, req);
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 3. Cria o usuário FORÇANDO o perfil 'visitante'.
    const newUser = await User.create({
      name,
      email,
      password_hash,
      role: 'visitante', // <<--- MUDANÇA CRUCIAL AQUI
    });

    const userResponse = newUser.toJSON();
    delete userResponse.password_hash;

    res.status(201).json({ message: 'Usuário cadastrado com sucesso!', user: userResponse });
  } catch (error) {
    sendError(res, 500, 'Erro interno do servidor.', 'INTERNAL_ERROR', error, req);
  }
};

// Função para login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validação de entrada
    if (!email || !password) {
      return sendError(res, 400, 'E-mail e senha são obrigatórios.', 'VALIDATION_ERROR', null, req);
    }

    // Procura o usuário pelo e-mail
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return sendError(res, 404, 'Usuário não encontrado.', 'NOT_FOUND', null, req);
    }

    // Compara a senha enviada com o hash salvo no banco
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendError(res, 401, 'Credenciais inválidas.', 'UNAUTHORIZED', null, req);
    }

    // Cria o payload do token
    const payload = {
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    };

    // Gera o token JWT
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }, // Token expira em 8 horas
      (err, token) => {
        if (err) {
          return sendError(res, 500, 'Erro ao gerar token.', 'INTERNAL_ERROR', err, req);
        }
        res.json({
          message: 'Login bem-sucedido!',
          token,
          user: payload.user,
        });
      }
    );
  } catch (error) {
    sendError(res, 500, 'Erro interno do servidor.', 'INTERNAL_ERROR', error, req);
  }
};
