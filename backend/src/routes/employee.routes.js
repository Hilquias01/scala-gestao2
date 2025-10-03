const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employee.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protege todas as rotas de funcionários
router.use(authMiddleware);

router.post('/', employeeController.create);
router.get('/', employeeController.findAll);
router.put('/:id', employeeController.update);
router.delete('/:id', employeeController.delete);

module.exports = router;