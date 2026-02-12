
const FinancialService = require('../services/FinancialService');

class FinancialController {
    
    async getDashboard(req, res, next) {
        try {
            // Mock Auth: userId vem do body ou header em ambiente de dev
            const userId = req.headers['x-user-id'] || '1';
            const data = await FinancialService.getDashboard(userId);
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getTransactions(req, res, next) {
        try {
            const userId = req.headers['x-user-id'] || '1';
            const role = req.headers['x-user-role'] || 'admin';
            const txs = await FinancialService.getExtrato(userId, role);
            res.json(txs);
        } catch (error) {
            next(error);
        }
    }

    async buyCredits(req, res, next) {
        try {
            const userId = req.headers['x-user-id'] || '1';
            const { amount } = req.body;
            const result = await FinancialService.buyCredits(userId, amount);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new FinancialController();
