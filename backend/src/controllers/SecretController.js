
const SecretService = require('../services/SecretService');

class SecretController {
    
    async getRemarketingConfig(req, res, next) {
        try {
            const config = await SecretService.getRemarketingConfig();
            res.json(config);
        } catch (error) { next(error); }
    }

    async saveRemarketingConfig(req, res, next) {
        try {
            const config = await SecretService.saveRemarketingConfig(req.body);
            res.json({ success: true, data: config });
        } catch (error) { next(error); }
    }
}

module.exports = new SecretController();
