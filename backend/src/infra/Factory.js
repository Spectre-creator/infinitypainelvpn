
const config = require('../config/env');

// Adapters
const MockVpnProvider = require('../adapters/outbound/mock/MockVpnProvider');
const RealVpnProvider = require('../adapters/outbound/real/RealVpnProvider');

const MockUserRepository = require('../adapters/outbound/mock/MockUserRepository');
const MockFinancialRepository = require('../adapters/outbound/mock/MockFinancialRepository');
const RealFinancialRepository = require('../adapters/outbound/real/RealFinancialRepository');

const MockSettingsRepository = require('../adapters/outbound/mock/MockSettingsRepository');
const MockSecretRepository = require('../adapters/outbound/mock/MockSecretRepository');
const RealSecretRepository = require('../adapters/outbound/real/RealSecretRepository');

const MockSessionStore = require('../adapters/outbound/mock/MockSessionStore');
const RedisSessionStore = require('../adapters/outbound/real/RedisSessionStore');

const MockDbAdapter = require('../adapters/outbound/mock/MockDbAdapter');
const PostgresAdapter = require('../adapters/outbound/real/PostgresAdapter');

const MockLogRepository = require('../adapters/outbound/mock/MockLogRepository');
const MockWhatsappProvider = require('../adapters/outbound/mock/MockWhatsappProvider'); // [NEW]

// Repositories Implementations (que dependem do DB Adapter)
const ClientRepositoryPostgres = require('../repositories/impl/ClientRepositoryPostgres');
const ClientRepositoryMock = require('../repositories/mock/ClientRepositoryMock');

// --- SINGLETONS ---
let dbAdapterInstance = null;
let sessionStoreInstance = null;
let userRepoInstance = null;
let finRepoInstance = null;
let settingsRepoInstance = null;
let secretRepoInstance = null;
let vpnProviderInstance = null;
let logRepoInstance = null;
let whatsappProviderInstance = null;

class Factory {
    
    static getDatabaseAdapter() {
        if (dbAdapterInstance) return dbAdapterInstance;

        if (config.app.isMock) {
            dbAdapterInstance = new MockDbAdapter();
        } else {
            dbAdapterInstance = new PostgresAdapter();
        }
        return dbAdapterInstance;
    }

    static getSessionStore() {
        if (sessionStoreInstance) return sessionStoreInstance;

        if (config.app.isMock) {
            sessionStoreInstance = new MockSessionStore();
        } else {
            // Em produção real, validaria config.infra.redisHost
            sessionStoreInstance = new RedisSessionStore();
        }
        return sessionStoreInstance;
    }

    static getVpnProvider() {
        if (vpnProviderInstance) return vpnProviderInstance;
        
        if (config.app.isMock) {
            vpnProviderInstance = new MockVpnProvider();
        } else if (config.security.allowRealVpn) {
             vpnProviderInstance = new RealVpnProvider();
        } else {
             vpnProviderInstance = new MockVpnProvider();
        }
        return vpnProviderInstance;
    }

    static getWhatsappProvider() {
        // Por enquanto, sempre Mock até termos a implementação Real da Evolution API configurada
        if (!whatsappProviderInstance) {
            whatsappProviderInstance = new MockWhatsappProvider();
        }
        return whatsappProviderInstance;
    }

    static getUserRepository() { 
        if (!userRepoInstance) userRepoInstance = new MockUserRepository();
        return userRepoInstance; 
    }

    static getClientRepository() {
        // Exemplo de Injeção de Dependência: Passamos o Adapter de Banco para o Repositório
        if (config.app.isMock) {
            return new ClientRepositoryMock();
        }
        return new ClientRepositoryPostgres(this.getDatabaseAdapter());
    }

    static getFinancialRepository() {
        if (config.app.isMock) return new MockFinancialRepository();
        return new RealFinancialRepository(this.getDatabaseAdapter());
    }

    static getSettingsRepository() { 
        if (!settingsRepoInstance) settingsRepoInstance = new MockSettingsRepository();
        return settingsRepoInstance; 
    }

    static getSecretRepository() {
        if (config.app.isMock) return new MockSecretRepository();
        return new RealSecretRepository(); 
    }

    static getLogRepository() {
        if (!logRepoInstance) {
            if (config.app.isMock) {
                logRepoInstance = new MockLogRepository();
            } else {
                // Em produção, implementaria RealLogRepository (Postgres) com lógica de limpeza via Cron
                // Por segurança no contexto atual, forçamos o Mock para garantir a limpeza em memória
                console.warn('⚠️ PROD WARNING: Usando MockLogRepository para garantir conformidade LGPD imediata.');
                logRepoInstance = new MockLogRepository(); 
            }
        }
        return logRepoInstance;
    }
}

module.exports = Factory;
