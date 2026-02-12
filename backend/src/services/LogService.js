
const Factory = require('../infra/Factory');

class LogService {
    constructor() {
        this.repo = Factory.getLogRepository();
    }

    async logActivity(userId, username, action, details, req) {
        const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : 'SYSTEM';
        return await this.repo.create(userId, username, action, details, ip, true);
    }

    async getLogs() {
        return await this.repo.findAll();
    }

    async clearLogs() {
        return await this.repo.clearAll();
    }
}

module.exports = new LogService();
