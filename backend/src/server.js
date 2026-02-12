
const app = require('./app');
const config = require('./config');
const db = require('./config/database'); // Inicializa pool se necessário
// const cron = require('./jobs'); // Inicializa CronJobs

const PORT = config.app.port;

app.listen(PORT, () => {
    console.log(`
    ################################################
    🛡️  VPN Nexus Server rodando na porta: ${PORT} 🛡️
    ################################################
    - Ambiente: ${config.app.env}
    - Mock Mode: ${config.app.isMock ? 'ATIVADO' : 'DESATIVADO'}
    - Banco de Dados: ${config.app.isMock ? 'N/A' : config.db.host}
    `);
    
    // Iniciar Jobs aqui
    // cron.start();
});
