const express = require('express');
const router = express.Router();
const revenueController = require('../controllers/revenue.controller');
const authMiddleware = require('../middleware/auth.middleware');
const multer = require('multer'); // Importação do Multer

// Configuração do Multer para processar o arquivo em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Protege todas as rotas com autenticação
router.use(authMiddleware);

// --- Rota de Importação (Nova) ---
// Deve vir ANTES de rotas genéricas como /:id
router.post('/import', upload.single('file'), revenueController.importRevenues);

// Rotas Padrão
router.post('/', revenueController.create);
router.get('/', revenueController.findAll); // Agora suporta ?startDate=...&search=...
router.put('/:id', revenueController.update);
router.delete('/:id', revenueController.delete);

module.exports = router;