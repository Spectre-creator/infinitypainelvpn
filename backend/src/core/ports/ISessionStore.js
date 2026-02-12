
/**
 * CONTRACT: ISessionStore
 * Define operações para gestão de sessões e tokens efêmeros.
 * Futuramente será conectado ao Redis.
 */
class ISessionStore {
    async set(key, value, ttlSeconds) { throw new Error('Method not implemented'); }
    async get(key) { throw new Error('Method not implemented'); }
    async del(key) { throw new Error('Method not implemented'); }
    async exists(key) { throw new Error('Method not implemented'); }
}

module.exports = ISessionStore;
