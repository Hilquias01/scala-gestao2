const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenue.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.use(authMiddleware);

router.post('/', revenueController.create);
router.get('/', revenueController.findAll);
router.put('/:id', revenueController.update);
router.delete('/:id', revenueController.delete);

module.exports = router;