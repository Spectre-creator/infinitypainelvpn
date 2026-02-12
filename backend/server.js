
const app = require('./src/app');
const config = require('./src/config/env');
const { logger } = require('./src/utils/Logger');

const PORT = config.app.port;

const server = app.listen(PORT, () => {
    // BANNER DE INICIALIZAÇÃO
    const modeLabel = config.app.isMock ? '🚧 MOCK MODE (SIMULAÇÃO)' : '🚀 PRODUCTION MODE (REAL)';
    const dbLabel = config.app.isMock ? 'Virtual (Em Memória)' : `PostgreSQL (${config.infra.dbHost})`;
    const sshLabel = config.app.isMock ? 'Virtual (Sem conexão)' : `SSH2 (${config.infra.sshHost})`;

    console.log('\n=============================================================');
    console.log(`VPN NEXUS API - SYSTEM INITIALIZED`);
    console.log('=============================================================');
    console.log(`STATUS:     ${modeLabel}`);
    console.log(`PORT:       ${PORT}`);
    console.log(`DATABASE:   ${dbLabel}`);
    console.log(`INFRA:      ${sshLabel}`);
    console.log('=============================================================\n');

    // Structured Log para sistemas de monitoramento (Loki/Datadog)
    logger.info({
        event: 'server_start',
        mode: config.app.isMock ? 'MOCK' : 'PRODUCTION',
        port: PORT,
        infra: {
            db: hasConfig(config.db.host),
            ssh: hasConfig(config.infra.sshHost)
        }
    }, '🛡️ VPN Nexus API is ready to accept connections.');
});

// Helper para evitar vazar dados sensíveis no log JSON
function hasConfig(val) {
    return val && val !== 'memory (virtual)' && val !== 'localhost (virtual)' ? 'CONFIGURED' : 'VIRTUAL';
}

// Graceful Shutdown Logic
const gracefulShutdown = (signal) => {
    logger.warn({ signal }, '🛑 Recebido sinal de desligamento.');
    
    server.close(() => {
        logger.info('✅ Servidor HTTP fechado. Conexões drenadas.');
        process.exit(0);
    });

    // Forçar exit se demorar muito (10s)
    setTimeout(() => {
        logger.error({ timeout: 10000 }, '⚠️ Forçando desligamento por timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
