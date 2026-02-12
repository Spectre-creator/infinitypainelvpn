
const ResellerService = require('../services/ResellerService');

class ResellerController {
    async index(req, res, next) {
        try {
            const list = await ResellerService.listResellers();
            res.json(list);
        } catch (e) { next(e); }
    }

    async create(req, res, next) {
        try {
            const result = await ResellerService.createReseller(req.body);
            res.json({ success: true, data: result });
        } catch (e) { next(e); }
    }

    async addCredits(req, res, next) {
        try {
            const { userId, amount } = req.body;
            await ResellerService.addCredits(userId, amount);
            res.json({ success: true });
        } catch (e) { next(e); }
    }

    async delete(req, res, next) {
        try {
            const { id } = req.params;
            await ResellerService.deleteReseller(id);
            res.json({ success: true });
        } catch (e) { next(e); }
    }
}

module.exports = new ResellerController();
