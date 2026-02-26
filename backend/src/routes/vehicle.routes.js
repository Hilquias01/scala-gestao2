// backend/src/routes/vehicle.routes.js

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicle.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// Protege todas as rotas
router.use(authMiddleware);

// ROTAS DE CONSULTA
router.get('/', vehicleController.findAll);
router.get('/:id', vehicleController.findOne);

// ROTAS ADMIN
router.post('/', requireRole('administrador'), vehicleController.create);
router.put('/:id', requireRole('administrador'), vehicleController.update);
router.delete('/:id', requireRole('administrador'), vehicleController.delete);

module.exports = router;
