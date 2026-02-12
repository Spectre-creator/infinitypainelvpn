
const config = require('./src/config/env');
const MockQueue = require('./src/infra/MockQueue');
const CronManager = require('./src/jobs/cron');
const Factory = require('./src/infra/Factory');
const { logger, businessLogger } = require('./src/utils/Logger');

logger.info({ 
    service: 'worker', 
    mode: config.app.isMock ? 'MOCK' : 'PROD' 
}, '👷 VPN Nexus WORKER Initialized');

// 1. Iniciar Producer (Cron Triggers)
CronManager.start();

// 2. Registrar Consumers (Lógica de Negócio)
MockQueue.process('check_expiration', async (data) => {
    const userRepo = Factory.getUserRepository();
    const allClients = await userRepo.findAllClients('1'); // Admin ID
    const now = new Date();
    let count = 0;

    for (const client of allClients) {
        if (client.status === 'active' && new Date(client.expiryDate) < now) {
            await userRepo.updateClient(client.id, { status: 'expired' });
            count++;
            
            businessLogger.info({
                event: 'client_expired',
                clientId: client.id,
                username: client.login
            }, `Cliente ${client.login} expirado automaticamente.`);
        }
    }
    
    if(count > 0) {
        logger.info({ processed: count }, 'Job check_expiration finalizado.');
    }
});

// 3. Graceful Shutdown
const shutdown = (signal) => {
    logger.warn({ signal }, '🛑 Worker desligando...');
    
    CronManager.stop();
    MockQueue.shutdown();

    logger.info('👋 Worker finalizado.');
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
