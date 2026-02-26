const express = require('express');
const router = express.Router();
const generalExpenseController = require('../controllers/generalExpense.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');

router.use(authMiddleware);

router.post('/', requireRole('administrador'), generalExpenseController.create);
router.get('/', generalExpenseController.findAll);
router.put('/:id', requireRole('administrador'), generalExpenseController.update);
router.delete('/:id', requireRole('administrador'), generalExpenseController.delete);

module.exports = router;
