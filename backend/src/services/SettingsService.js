
const Factory = require('../infra/Factory');

class SettingsService {
    constructor() {
        this.repo = Factory.getSettingsRepository();
    }

    async getSettings() {
        return await this.repo.getSettings();
    }

    async updateSettings(data) {
        return await this.repo.updateSettings(data);
    }
}

module.exports = new SettingsService();
