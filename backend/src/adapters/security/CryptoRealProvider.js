
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const ICryptoProvider = require('../../core/ports/ICryptoProvider');
const config = require('../../config/env');

class CryptoRealProvider extends ICryptoProvider {
    constructor() {
        super();
        console.log('🔐 [SECURITY] CryptoRealProvider carregado (Bcrypt + JWT).');
    }

    /**
     * Gera um hash seguro da senha usando Bcrypt (Salt rounds = 10).
     */
    async hashPassword(password) {
        const saltRounds = 10;
        return await bcrypt.hash(password, saltRounds);
    }

    /**
     * Compara uma senha em texto plano com um hash Bcrypt.
     */
    async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Gera um Token JWT assinado com o segredo da aplicação.
     */
    generateToken(payload, expiresIn = '1h') {
        return jwt.sign(payload, config.app.secret, { expiresIn });
    }

    /**
     * Valida um Token JWT. Lança erro se inválido ou expirado.
     */
    verifyToken(token) {
        return jwt.verify(token, config.app.secret);
    }

    /**
     * Gera uma string aleatória segura (ex: para CSRF ou Salts adicionais).
     */
    generateRandom() {
        return crypto.randomBytes(32).toString('hex');
    }
}

module.exports = CryptoRealProvider;
