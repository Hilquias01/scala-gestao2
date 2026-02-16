const express = require('express');
const router = express.Router();
const employeeSalaryController = require('../controllers/employeeSalary.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', employeeSalaryController.create);
router.get('/', employeeSalaryController.findAll);
router.put('/:id', employeeSalaryController.update);
router.delete('/:id', employeeSalaryController.delete);

module.exports = router;
