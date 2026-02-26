const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenance.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// Protege todas as rotas
router.use(authMiddleware);

// Rota para criar um novo registro de manutenção
router.post('/', requireRole('administrador'), maintenanceController.create);

// Rota para buscar todas as manutenções de um veículo
router.get('/vehicle/:vehicleId', maintenanceController.findAllByVehicle);

router.put('/:id', requireRole('administrador'), maintenanceController.update);
router.delete('/:id', requireRole('administrador'), maintenanceController.delete);

module.exports = router;
