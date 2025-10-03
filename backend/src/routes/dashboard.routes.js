const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protege a rota de dashboard
router.get('/kpis', authMiddleware, dashboardController.getKpis);
router.get('/cost-evolution', authMiddleware, dashboardController.getCostEvolution);
router.get('/spending-by-category', authMiddleware, dashboardController.getSpendingByCategory);

router.get('/revenue-vs-expenses', authMiddleware, dashboardController.getRevenueVsExpenses);
router.get('/costs-per-vehicle', authMiddleware, dashboardController.getCostsPerVehicle);
router.get('/top-5-vehicles', authMiddleware, dashboardController.getTop5ExpensiveVehicles);


module.exports = router;