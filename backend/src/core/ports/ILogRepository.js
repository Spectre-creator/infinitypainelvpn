
/**
 * 🛡️ CONTRACT: ILogRepository (LGPD COMPLIANCE)
 * Define as operações para auditoria com foco em privacidade.
 */
class ILogRepository {
    /**
     * Registra uma atividade. Deve anonimizar dados sensíveis (IP).
     */
    async create(userId, username, action, details, ip, success) { throw new Error('Method not implemented'); }
    
    /**
     * Recupera logs. Deve respeitar janelas de retenção.
     */
    async findAll() { throw new Error('Method not implemented'); }
    
    /**
     * LGPD: Direito ao Esquecimento / Expurgo de Dados
     */
    async clearAll() { throw new Error('Method not implemented'); }
}

module.exports = ILogRepository;
