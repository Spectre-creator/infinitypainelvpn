
const SettingsService = require('../services/SettingsService');

class SettingsController {
    async get(req, res, next) {
        try {
            const settings = await SettingsService.getSettings();
            res.json(settings);
        } catch (error) { next(error); }
    }

    async update(req, res, next) {
        try {
            const settings = await SettingsService.updateSettings(req.body);
            res.json({ success: true, data: settings });
        } catch (error) { next(error); }
    }
}

module.exports = new SettingsController();
