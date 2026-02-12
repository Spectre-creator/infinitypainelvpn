
const express = require('express');
const cors = require('cors');
const settings = require('./src/config/settings');
const routes = require('./src/api/routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.listen(settings.app.port, () => {
    console.log(`
    ################################################
    🛡️  VPN Nexus (Architecture Refactor)
    🔒  MODE: ${settings.app.mockMode ? 'STRICT MOCK' : 'PRODUCTION'}
    🚀  PORT: ${settings.app.port}
    ################################################
    `);
});
