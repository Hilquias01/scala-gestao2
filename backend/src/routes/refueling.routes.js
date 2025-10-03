const express = require('express');
const router = express.Router();
const refuelingController = require('../controllers/refueling.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protege todas as rotas
router.use(authMiddleware);

// Rota para criar um novo abastecimento
router.post('/', refuelingController.create);

// Rota para buscar todos os abastecimentos de um veículo específico
// Ex: GET /api/refuelings/vehicle/5
router.get('/vehicle/:vehicleId', refuelingController.findAllByVehicle);

router.put('/:id', refuelingController.update);
router.delete('/:id', refuelingController.delete);


module.exports = router;