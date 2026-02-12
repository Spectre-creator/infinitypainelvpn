
const EventEmitter = require('events');

class MockQueue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.isProcessing = false;
        console.log('📨 [INFRA] MockQueue (InMemory) inicializado.');
    }

    /**
     * Producer: Adiciona uma tarefa na fila
     */
    async add(jobName, data) {
        console.log(`📥 [QUEUE] Job recebido: ${jobName}`);
        this.queue.push({ jobName, data, timestamp: Date.now() });
        this.emit('new_job'); // Notifica worker
    }

    /**
     * Consumer: Processa a fila
     */
    process(jobName, handler) {
        this.on('new_job', async () => {
            if (this.isProcessing) return;
            
            // Pega jobs do tipo específico
            const jobIndex = this.queue.findIndex(j => j.jobName === jobName);
            if (jobIndex === -1) return;

            this.isProcessing = true;
            const job = this.queue.splice(jobIndex, 1)[0];

            try {
                console.log(`⚙️ [WORKER] Processando ${job.jobName}...`);
                await handler(job.data);
                console.log(`✅ [WORKER] ${job.jobName} finalizado.`);
            } catch (error) {
                console.error(`❌ [WORKER] Falha em ${job.jobName}:`, error);
                // Dead Letter Queue (DLQ) logic would go here
            } finally {
                this.isProcessing = false;
                // Se ainda tiver jobs, emite evento para continuar processando loop
                if (this.queue.length > 0) this.emit('new_job');
            }
        });
    }

    shutdown() {
        console.log('🛑 [QUEUE] Pausando consumo de filas...');
        this.removeAllListeners();
    }
}

// Singleton para simular um Broker compartilhado (em memória)
module.exports = new MockQueue();
