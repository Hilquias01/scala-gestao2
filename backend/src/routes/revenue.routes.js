const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenue.controller');
const authMiddleware = require('../middleware/auth.middleware');
const requireRole = require('../middleware/role.middleware');
const multer = require('multer'); // Importação do Multer

// Configuração do Multer para processar o arquivo em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Protege todas as rotas com autenticação
router.use(authMiddleware);

// --- Rota de Importação (Nova) ---
// Deve vir ANTES de rotas genéricas como /:id
router.post('/import/preview', requireRole('administrador'), upload.single('file'), revenueController.previewImport);
router.post('/import', requireRole('administrador'), upload.single('file'), revenueController.importRevenues);
router.get('/export', revenueController.exportRevenues);

// Rotas Padrão
router.post('/', requireRole('administrador'), revenueController.create);
router.get('/', revenueController.findAll); // Agora suporta ?startDate=...&search=...
router.put('/:id', requireRole('administrador'), revenueController.update);
router.delete('/:id', requireRole('administrador'), revenueController.delete);

module.exports = router;
