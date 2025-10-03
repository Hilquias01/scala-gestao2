const express = require('express');
const router = express.Router();
const generalExpenseController = require('../controllers/generalExpense.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', generalExpenseController.create);
router.get('/', generalExpenseController.findAll);
router.put('/:id', generalExpenseController.update);
router.delete('/:id', generalExpenseController.delete);

module.exports = router;