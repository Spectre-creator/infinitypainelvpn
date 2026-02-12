
const router = require('express').Router();
const ClientController = require('../controllers/ClientController');

// Health Check
router.get('/health', (req, res) => res.json({ status: 'ok' }));

// Clientes
router.get('/clients', ClientController.index);
router.post('/clients', ClientController.create);

// Adicionar outras rotas (Resellers, Financial, etc)
// router.use('/resellers', resellerRoutes);

module.exports = router;
