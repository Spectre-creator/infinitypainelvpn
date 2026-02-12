
const ISessionStore = require('../../../core/ports/ISessionStore');

class RedisSessionStore extends ISessionStore {
    constructor() {
        super();
        // Em um cenário real, iniciaria o cliente Redis aqui
        throw new Error('FATAL: RedisSessionStore não configurado para este ambiente.');
    }
}

module.exports = RedisSessionStore;
