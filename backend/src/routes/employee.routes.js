const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

// Protege todas as rotas de funcionários
router.use(authMiddleware);

router.post('/', requireRole('administrador'), employeeController.create);
router.get('/', employeeController.findAll);
router.put('/:id', requireRole('administrador'), employeeController.update);
router.delete('/:id', requireRole('administrador'), employeeController.delete);

module.exports = router;
