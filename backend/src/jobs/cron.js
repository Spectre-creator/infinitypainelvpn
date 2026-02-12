
const cron = require('node-cron');
const MockQueue = require('../infra/MockQueue');

class CronManager {
    constructor() {
        this.tasks = [];
    }

    start() {
        console.log('⏰ [CRON] Agendador iniciado.');

        // Job 1: Verificação de Expiração
        // Roda a cada hora. O Cron APENAS despacha a mensagem, não processa lógica pesada.
        const expirationTask = cron.schedule('0 * * * *', () => {
            console.log('⏰ [CRON] Trigger: check_expiration');
            MockQueue.add('check_expiration', { source: 'cron_scheduler' });
        });

        this.tasks.push(expirationTask);
    }

    stop() {
        console.log('🛑 [CRON] Parando agendadores...');
        this.tasks.forEach(task => task.stop());
    }
}

module.exports = new CronManager();
