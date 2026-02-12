
import { Backend } from './mockBackend';

interface JobState {
    lastRun: number;
    totalRuns: number;
    failures: number;
}

interface JobDefinition {
    name: string;
    intervalMs: number;
    handler: () => Promise<void> | void;
}

const STORAGE_KEY = 'sys_job_state_snapshot';

class JobSchedulerService {
    private jobs: JobDefinition[] = [];
    private isRunning: boolean = false;
    private timer: any = null;
    private state: Record<string, JobState> = {};

    constructor() {
        this._loadState();
    }

    private _loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                this.state = JSON.parse(raw);
                console.log('💾 [JOB RUNNER] Snapshot de estado carregado (Persistência Local).');
            }
        } catch (e) {
            console.error('❌ [JOB RUNNER] Falha ao carregar snapshot. Iniciando estado limpo.');
            this.state = {};
        }
    }

    private _saveState() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }

    public register(name: string, intervalMs: number, handler: () => Promise<void> | void) {
        this.jobs.push({ name, intervalMs, handler });
        if (!this.state[name]) {
            this.state[name] = { lastRun: Date.now(), totalRuns: 0, failures: 0 };
            this._saveState();
        }
        console.log(`⚙️ [JOB REGISTER] Job '${name}' registrado. Intervalo: ${intervalMs}ms`);
    }

    public start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('🚀 [JOB RUNNER] Agendador iniciado.');
        
        // Loop de verificação (Tickrate: 5s)
        this.timer = setInterval(() => this._tick(), 5000);
    }

    public stop() {
        this.isRunning = false;
        if (this.timer) clearInterval(this.timer);
        console.log('🛑 [JOB RUNNER] Agendador pausado.');
    }

    private async _tick() {
        const now = Date.now();

        for (const job of this.jobs) {
            const state = this.state[job.name];
            const nextScheduled = state.lastRun + job.intervalMs;
            const drift = now - nextScheduled;

            // Se drift > 0, significa que passou da hora de rodar
            if (drift >= 0) {
                
                // SRE: Detecção de Jobs Perdidos (Downtime Simulation)
                // Se o atraso for maior que 2x o intervalo, perdemos uma janela de execução
                if (drift > job.intervalMs * 2) {
                    console.warn(`⚠️ [SRE ALERT] Job Lost Detected: '${job.name}'`);
                    console.warn(`   |-- Janela perdida: ${(drift / 1000).toFixed(1)}s atrás`);
                    console.warn(`   |-- Ação: Executando rotina de recuperação (Catch-up).`);
                }

                try {
                    console.log(`🔄 [EXEC] Rodando job: ${job.name}...`);
                    await job.handler();
                    
                    state.lastRun = now;
                    state.totalRuns++;
                    console.log(`✅ [SUCCESS] ${job.name} finalizado. Próxima exec em ${(job.intervalMs / 1000).toFixed(0)}s`);
                } catch (error) {
                    state.failures++;
                    console.error(`❌ [FAILURE] Job ${job.name} falhou:`, error);
                }

                this._saveState();
            }
        }
    }
}

export const JobRunner = new JobSchedulerService();
