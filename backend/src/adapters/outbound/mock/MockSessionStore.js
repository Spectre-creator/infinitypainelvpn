
const ISessionStore = require('../../../core/ports/ISessionStore');

/**
 * 🧠 MOCK SESSION STORE (In-Memory Redis Simulator)
 * 
 * Simula o comportamento do Redis armazenando sessões e tokens na memória RAM (Heap).
 * Implementa verificação de TTL (Time To Live) para expirar sessões automaticamente.
 * 
 * NOTA: Ao reiniciar o backend, todas as sessões deste mock são perdidas (logout geral).
 */
class MockSessionStore extends ISessionStore {
    constructor() {
        super();
        // Estrutura: key -> { value: any, expiresAt: number (timestamp) }
        this.store = new Map();
        console.log('🧠 [ADAPTER] MockSessionStore: Sessões ativas em memória (TTL Habilitado).');
    }

    /**
     * Salva um valor com tempo de expiração.
     * @param {string} key Chave (ex: refresh:xyz)
     * @param {any} value Objeto de sessão
     * @param {number} ttlSeconds Tempo de vida em segundos
     */
    async set(key, value, ttlSeconds) {
        /*
         TODO: PRODUCTION IMPLEMENTATION (Redis)
         ---------------------------------------
         const Redis = require('ioredis');
         const redis = new Redis(process.env.REDIS_URL);
         
         // Redis armazena apenas strings, necessário serializar
         const stringValue = JSON.stringify(value);
         await redis.set(key, stringValue, 'EX', ttlSeconds);
         return true;
        */

        // MOCK IMPLEMENTATION
        const expiresAt = Date.now() + (ttlSeconds * 1000);
        this.store.set(key, { value, expiresAt });
        return true;
    }

    /**
     * Recupera um valor, verificando se expirou.
     * @param {string} key 
     */
    async get(key) {
        /*
         TODO: PRODUCTION IMPLEMENTATION (Redis)
         ---------------------------------------
         const data = await redis.get(key);
         return data ? JSON.parse(data) : null;
        */

        // MOCK IMPLEMENTATION
        const entry = this.store.get(key);
        
        if (!entry) return null;

        // Verifica expiração (Lazy Expiration)
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }

        return entry.value;
    }

    /**
     * Remove uma chave explicitamente (Logout).
     * @param {string} key 
     */
    async del(key) {
        /*
         TODO: PRODUCTION IMPLEMENTATION (Redis)
         ---------------------------------------
         await redis.del(key);
         return true;
        */

        // MOCK IMPLEMENTATION
        return this.store.delete(key);
    }

    async exists(key) {
        /*
         TODO: PRODUCTION IMPLEMENTATION (Redis)
         ---------------------------------------
         return await redis.exists(key) === 1;
        */

        // MOCK IMPLEMENTATION
        return this.get(key) !== null; // Reusa get para validar expiração
    }
}

module.exports = MockSessionStore;
