
const config = require('../config/env');
const fs = require('fs');
const path = require('path');

// Garante diretório de logs local para análise (Mock Persistence)
const LOG_DIR = path.join(__dirname, '../../logs');
if (!fs.existsSync(LOG_DIR)) {
    try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch (e) {}
}
const LOG_FILE = path.join(LOG_DIR, 'app.json.log');

// Tenta importar o pino (biblioteca real). Se não existir, usa o fallbackMock.
let pino;
try {
    pino = require('pino');
} catch (e) {
    pino = null;
}

/**
 * 📊 MOCK TRANSPORT LAYER
 * Simula o envio de logs para um sistema centralizado (Ex: Grafana Loki, Datadog, ELK).
 * Em dev/mock, apenas valida a estrutura do objeto e simula latência de rede (fire-and-forget).
 */
class LogTransportSimulator {
    static ship(logEntry) {
        // Simula envio assíncrono para um agregador de logs
        // Em produção, isso seria feito via sidecar (Promtail) ou transporte direto (pino-loki)
        if (config.app.isMock && Math.random() > 0.98) {
            // Loga ocasionalmente que o lote foi "enviado" para não poluir o console, mas confirmar funcionamento
            process.stdout.write(`📡 [MOCK LOKI] Log batch shipped to centralized storage (Latency: ${Math.floor(Math.random() * 50)}ms)\n`);
        }
    }
}

/**
 * MOCK PINO IMPLEMENTATION (ENHANCED)
 * Garante saída JSON estruturada (NDJSON), persistência em arquivo e simulação de transporte.
 * Substitui o console.log simples por algo compatível com parsers industriais.
 */
class MockPino {
    constructor(bindings = {}) {
        this.bindings = bindings;
    }

    _log(level, objOrMsg, msg) {
        const time = Date.now();
        let payload = {};
        let message = '';

        if (typeof objOrMsg === 'string') {
            message = objOrMsg;
        } else {
            payload = objOrMsg || {};
            message = msg || '';
        }

        // Serializar Error se existir (padrão Pino)
        if (payload instanceof Error) {
            payload = {
                err: {
                    type: payload.constructor.name,
                    message: payload.message,
                    stack: payload.stack
                }
            };
        }

        // Estrutura padrão de Log (ECS - Elastic Common Schema friendly)
        const logObject = {
            level,
            time,
            pid: process.pid,
            hostname: 'nexus-node-mock',
            ...this.bindings,
            ...payload,
            msg: message
        };

        const logEntry = JSON.stringify(logObject);

        // 1. STDOUT (Para Docker Logs / Portainer verem)
        console.log(logEntry);

        // 2. FILE STORAGE (Para análise local estruturada com 'jq' ou vscode extensions)
        try {
            fs.appendFileSync(LOG_FILE, logEntry + '\n');
        } catch (e) {
            console.error('Falha ao escrever log em arquivo', e);
        }

        // 3. CENTRALIZED SIMULATION (Para validar arquitetura de observabilidade)
        LogTransportSimulator.ship(logObject);
    }

    info(obj, msg) { this._log('info', obj, msg); }
    error(obj, msg) { this._log('error', obj, msg); }
    warn(obj, msg) { this._log('warn', obj, msg); }
    debug(obj, msg) { this._log('debug', obj, msg); }
    
    child(bindings) {
        return new MockPino({ ...this.bindings, ...bindings });
    }
}

/*
 TODO: PRODUCTION IMPLEMENTATION (Centralized Logging)
 -----------------------------------------------------
 1. Instalar dependências:
    npm install pino pino-loki

 2. Configurar Transporter (ex: Grafana Loki):
    const transport = pino.transport({
      target: 'pino-loki',
      options: {
        host: 'http://loki:3100', // URL interna do cluster
        labels: { application: 'vpn-nexus-backend' }
      }
    });

 3. Inicializar Logger:
    const loggerInstance = pino(transport);

 4. Alternativa (Sidecar Pattern - Recomendado para K8s/Docker):
    Apenas escreva JSON no STDOUT (como este Mock já faz).
    Configure o Docker Daemon ou um container Promtail para ler 
    o stdout e enviar para o Loki/Elasticsearch.
*/

// Configuração principal: Usa biblioteca real se disponível, senão usa Mock aprimorado
const loggerInstance = pino 
    ? pino({
        level: config.app.env === 'production' ? 'info' : 'debug',
        timestamp: pino.stdTimeFunctions.isoTime,
        formatters: {
            level: (label) => { return { level: label }; }
        }
    })
    : new MockPino({ service: 'vpn-nexus-core' });

// --- CONTEXT LOGGERS (Categorização para filtragem fácil) ---

// 1. Logs Técnicos/Infra (Default)
const sysLogger = loggerInstance;

// 2. Logs de Auditoria (Segurança: Quem, Quando, Onde, O Que)
const auditLogger = loggerInstance.child({ type: 'AUDIT', privacy: 'restricted' });

// 3. Logs de Negócio (Transações, Criação de Recursos, Vendas)
const businessLogger = loggerInstance.child({ type: 'BUSINESS', retention: '90d' });

module.exports = {
    logger: sysLogger,
    auditLogger,
    businessLogger
};
