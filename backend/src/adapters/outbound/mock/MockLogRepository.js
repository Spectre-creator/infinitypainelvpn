
const ILogRepository = require('../../../core/ports/ILogRepository');
const { MOCK_LOGS } = require('../../../../../services/mockData'); // Fallback data

class MockLogRepository extends ILogRepository {
    constructor() {
        super();
        // Inicializa com logs mockados, mas aplica sanitização neles também se necessário
        this.logs = [];
        this.RETENTION_DAYS = 7;
        
        console.log(`🛡️ [LGPD] MockLogRepository iniciado. Política de retenção: ${this.RETENTION_DAYS} dias.`);
        console.log('🛡️ [LGPD] Mascaramento de IP: ATIVO');
    }

    /**
     * LGPD: Data Minimization
     * Mascara o último octeto de IPs IPv4 ou segmentos de IPv6.
     */
    _maskIp(ip) {
        if (!ip || ip === 'SYSTEM' || ip === '::1') return ip;
        // IPv4: 192.168.0.1 -> 192.168.0.xxx
        if (ip.includes('.')) {
            return ip.replace(/\.\d{1,3}$/, '.xxx');
        }
        // IPv6: simplificado
        return ip.substring(0, 8) + ':xxxx:xxxx';
    }

    /**
     * LGPD: Storage Limitation
     * Remove logs mais antigos que a política de retenção permitida.
     */
    _enforceRetention() {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - this.RETENTION_DAYS);
        
        const initialSize = this.logs.length;
        this.logs = this.logs.filter(log => new Date(log.timestamp) > cutoff);
        
        if (this.logs.length < initialSize) {
            console.log(`🧹 [LGPD] Auto-expurgo: ${initialSize - this.logs.length} logs antigos removidos.`);
        }
    }

    async create(userId, username, action, details, rawIp, success = true) {
        this._enforceRetention();

        const log = {
            id: Date.now().toString(),
            userId,
            username,
            action,
            message: details, // Mapeando 'details' para 'message' conforme frontend
            ip: this._maskIp(rawIp), // Anonimização na entrada
            timestamp: new Date().toISOString(),
            timeAgo: 'Agora',
            success
        };

        this.logs.unshift(log);
        
        // Limite hard para memória no mock
        if (this.logs.length > 1000) this.logs.pop();

        return log;
    }

    async findAll() {
        // Em um cenário real, filtraria por permissão aqui.
        // No mock, retorna tudo (mas já anonimizado).
        return this.logs.length > 0 ? this.logs : []; 
    }

    async clearAll() {
        this.logs = [];
        console.log('🗑️ [LGPD] Logs excluídos manualmente (Direito de Exclusão).');
        return true;
    }
}

module.exports = MockLogRepository;
