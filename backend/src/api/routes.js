const router = require('express').Router();
const AuthController = require('../controllers/AuthController');
const ClientController = require('../controllers/ClientController');
const FinancialController = require('../controllers/FinancialController');
const SettingsController = require('../controllers/SettingsController');
const ResellerController = require('../controllers/ResellerController');
const SecretController = require('../controllers/SecretController');
const LogController = require('../controllers/LogController');
const MockWebhookController = require('../controllers/MockWebhookController');
const WebhookController = require('../controllers/WebhookController'); // [NOVO]
const ChatbotController = require('../controllers/ChatbotController'); // [NOVO]
const AppConfigController = require('../controllers/AppConfigController');
const AiController = require('../controllers/AiController');
const config = require('../config/env');
const { apiLimiter, loginLimiter, csrfProtection } = require('../middlewares/securityMiddleware');

// Middleware Global de Autenticação (JWT)
const SecurityUtils = require('../utils/SecurityUtils');
const requireAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const payload = SecurityUtils.verifyToken(token);
        req.user = payload;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

const requireClientAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'Unauthorized' });
        const payload = SecurityUtils.verifyToken(token);
        if (payload.role !== 'client' || !payload.clientId) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        req.client = payload; // Attach { clientId, role } to request
        next();
    } catch (e) {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

router.get('/status', apiLimiter, (req, res) => {
    res.json({ system: 'VPN Nexus', mode: config.app.isMock ? 'MOCK' : 'PROD', secure: true });
});

// --- PUBLIC APP INTEGRATION (VPN CLIENT) ---
router.get('/public/config', AppConfigController.getConfig);
router.post('/public/check-user', AppConfigController.checkUser);

// --- AUTH (Public) ---
router.post('/login', loginLimiter, AuthController.login);
router.post('/refresh', apiLimiter, AuthController.refresh);
router.get('/csrf-token', apiLimiter, AuthController.getCsrf);
router.post('/logout', AuthController.logout);

// --- WEBHOOKS (Public / Callback) ---
router.post('/webhooks/pix/simulate', MockWebhookController.simulatePix);
router.post('/webhooks/whatsapp', WebhookController.handleWhatsapp); // [NOVO]

// Aplica Proteção CSRF em rotas de mutação do painel
// router.use(csrfProtection); // Desativado temporariamente para facilitar testes

// --- ROTAS PROTEGIDAS PARA CLIENTES (APP) ---
router.get('/v1/me/details', requireClientAuth, ClientController.getOwnDetails);


// --- ROTAS PROTEGIDAS PARA PAINEL (ADMIN/RESELLER) ---
router.use(requireAuth);

// AI Chat (Seguro)
router.post('/ai/chat', AiController.chat);

// Chatbot Config
router.get('/chatbot/config', ChatbotController.getConfig); // [NOVO]
router.post('/chatbot/config', ChatbotController.saveConfig); // [NOVO]

// Clientes
router.get('/clients', ClientController.index);
router.post('/clients', ClientController.create);
router.post('/clients/renew', ClientController.renew);
router.post('/clients/toggle', ClientController.toggleStatus);
router.delete('/clients/:id', ClientController.delete);

// Revendedores
router.get('/resellers', ResellerController.index);
router.post('/resellers', ResellerController.create);
router.post('/resellers/credits', ResellerController.addCredits);
router.delete('/resellers/:id', ResellerController.delete);

// Financeiro
router.get('/financial/dashboard', FinancialController.getDashboard);
router.get('/financial/transactions', FinancialController.getTransactions);
router.post('/financial/buy-credits', FinancialController.buyCredits);

// Configurações
router.get('/settings', SettingsController.get);
router.put('/settings', SettingsController.update);

// Segredos
router.get('/secrets/remarketing', SecretController.getRemarketingConfig);
router.post('/secrets/remarketing', SecretController.saveRemarketingConfig);

// Logs (LGPD)
router.get('/logs', LogController.index);
router.delete('/logs', LogController.clear);

module.exports = router;