const express = require('express');
const router = express.Router();
const employeeSalaryController = require('../controllers/employeeSalary.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.use(authMiddleware);

router.post('/', requireRole('administrador'), employeeSalaryController.create);
router.get('/', employeeSalaryController.findAll);
router.put('/:id', requireRole('administrador'), employeeSalaryController.update);
router.delete('/:id', requireRole('administrador'), employeeSalaryController.delete);

module.exports = router;
