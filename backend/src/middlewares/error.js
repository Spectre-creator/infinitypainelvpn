
const { logger } = require('../utils/Logger');

module.exports = (err, req, res, next) => {
    // Log estruturado do erro
    logger.error({ 
        err, 
        req: {
            method: req.method,
            url: req.url,
            ip: req.ip || req.headers['x-forwarded-for']
        }
    }, 'Request Failed');
    
    // Tratamento de erros conhecidos
    if (err.message.includes('Login já existe') || err.message.includes('insuficientes')) {
        return res.status(400).json({ error: err.message });
    }

    // Erro Genérico (Segurança: não expor stack trace em produção no JSON response)
    res.status(500).json({ 
        error: 'Erro interno do servidor.',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};
