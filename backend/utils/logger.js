
const LogService = require('../src/services/LogService');

/**
 * ADAPTER LEGADO PARA COMPATIBILIDADE
 * Redireciona chamadas do estilo antigo (pool.query) para o novo LogService
 * garantindo conformidade com LGPD (Mascaramento e Retenção).
 */
const createLog = async (userId, action, details, req) => {
    try {
        // Tenta obter o username se disponível no req.user (injetado por middleware)
        const username = req?.user?.username || 'System/Legacy';
        
        await LogService.logActivity(userId, username, action, details, req);
    } catch (error) {
        console.error('❌ Falha ao criar log (Legacy Adapter):', error);
    }
};

module.exports = { createLog };
