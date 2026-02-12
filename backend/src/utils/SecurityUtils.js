
const config = require('../config/env');
const CryptoMockProvider = require('../adapters/security/CryptoMockProvider');
const CryptoRealProvider = require('../adapters/security/CryptoRealProvider');

/**
 * SECURITY FACADE
 * Gerencia a instância do provedor de criptografia correto.
 */
class SecurityUtils {
    constructor() {
        this.provider = this._getProvider();
    }

    _getProvider() {
        if (config.app.isMock) {
            return new CryptoMockProvider();
        }
        
        // Em produção, carregamos o provider real (Bcrypt/JWT)
        return new CryptoRealProvider();
    }

    async hashPassword(password) {
        return this.provider.hashPassword(password);
    }

    async comparePassword(password, hash) {
        return this.provider.comparePassword(password, hash);
    }

    generateToken(payload, expiresIn) {
        return this.provider.generateToken(payload, expiresIn);
    }

    verifyToken(token) {
        return this.provider.verifyToken(token);
    }

    generateCsrfToken() {
        return this.provider.generateRandom();
    }
}

// Singleton export
module.exports = new SecurityUtils();
