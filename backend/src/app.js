
const express = require('express');
const cors = require('cors');
const routes = require('./api/routes');
const errorHandler = require('./middlewares/error');
const Factory = require('./infra/Factory');

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Parse Cookies
app.use((req, res, next) => {
    req.cookies = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            req.cookies[parts.shift().trim()] = decodeURI(parts.join('='));
        });
    }
    next();
});

// --- SRE OBSERVABILITY ENDPOINTS ---

// Liveness Probe: O processo está rodando?
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Readiness Probe: O app consegue processar tráfego? (Conexão DB ok?)
app.get('/readiness', async (req, res) => {
    try {
        // Teste simples no repositório
        await Factory.getUserRepository().findByUsername('admin');
        res.status(200).json({ status: 'READY', dependencies: { db: 'UP' } });
    } catch (e) {
        res.status(503).json({ status: 'NOT_READY', dependencies: { db: 'DOWN' } });
    }
});

app.use('/api', routes);
app.use(errorHandler);

module.exports = app;
