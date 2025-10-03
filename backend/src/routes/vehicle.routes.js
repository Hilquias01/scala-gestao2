// backend/src/routes/vehicle.routes.js

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middleware/auth.middleware');

// ROTAS PÚBLICAS (GET) - Não precisam de autenticação
router.get('/', vehicleController.findAll);
router.get('/:id', vehicleController.findOne);

// ROTAS PRIVADAS (POST, PUT, DELETE) - Protegidas pelo middleware
router.post('/', authMiddleware, vehicleController.create);
router.put('/:id', authMiddleware, vehicleController.update);
router.delete('/:id', authMiddleware, vehicleController.delete);

module.exports = router;