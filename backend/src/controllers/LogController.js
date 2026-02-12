
const LogService = require('../services/LogService');

class LogController {
    
    async index(req, res, next) {
        try {
            const logs = await LogService.getLogs();
            res.json(logs);
        } catch (error) { next(error); }
    }

    async clear(req, res, next) {
        try {
            // Apenas Admin deveria poder limpar, validado pelo middleware de rota se necessário
            await LogService.clearLogs();
            res.json({ success: true, message: 'Logs expurgados com sucesso.' });
        } catch (error) { next(error); }
    }
}

module.exports = new LogController();
