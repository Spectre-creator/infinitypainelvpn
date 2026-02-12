
const ICryptoProvider = require('../../core/ports/ICryptoProvider');
const config = require('../../config/env');
const crypto = require('crypto');

/**
 * 🛡️ CRYPTO MOCK PROVIDER (ENHANCED)
 * 
 * Simula um ambiente seguro utilizando hashing unidirecional com Salt (PBKDF2).
 * Mantém compatibilidade com hashes legados para não quebrar seeds iniciais.
 * 
 * Formato V2: $mock$v2$<iterations>$<salt>$<hash>
 */
class CryptoMockProvider extends ICryptoProvider {
    constructor() {
        super();
        this._enforceMockEnvironment();
        console.log('🔐 [SECURITY] CryptoMockProvider V2 carregado (PBKDF2 Simulation).');
        console.warn('⚠️ [SECURITY AUDIT] Este provider NÃO deve ser usado em produção. Migre para bcrypt/argon2.');
    }

    _enforceMockEnvironment() {
        if (!config.app.isMock) {
            throw new Error(
                '🚨 FATAL SECURITY ERROR: CryptoMockProvider proibido em PRODUÇÃO. ' +
                'Instale e configure "bcrypt" ou "argon2" imediatamente.'
            );
        }
    }

    /**
     * Gera um hash seguro simulado (PBKDF2).
     * Em produção, substitua por bcrypt.hash(password, 10).
     */
    async hashPassword(password) {
        // MOCK IMPLEMENTATION (PBKDF2)
        return new Promise((resolve, reject) => {
            const salt = crypto.randomBytes(16).toString('hex');
            const iterations = 1000; // Baixo custo para testes rápidos
            
            crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
                if (err) reject(err);
                // Formato estilo PHC (Password Hashing Competition)
                const hash = `$mock$v2$${iterations}$${salt}$${derivedKey.toString('hex')}`;
                resolve(hash);
            });
        });
    }

    /**
     * Compara a senha com o hash armazenado.
     * Suporta V1 (Legacy Base64) e V2 (PBKDF2).
     */
    async comparePassword(password, storedHash) {
        if (!storedHash) return false;

        // 1. Backdoor para testes de UI (Mantido por conveniência em DEV)
        if (storedHash === '$mock$admin$bypass') {
            return (password === 'admin' || password === 'senha_segura_mock_123');
        }

        // 2. Hash V2 (PBKDF2 - Simulação Segura)
        if (storedHash.startsWith('$mock$v2$')) {
            const parts = storedHash.split('$');
            const iterations = parseInt(parts[3]);
            const salt = parts[4];
            const originalHash = parts[5];

            return new Promise((resolve) => {
                crypto.pbkdf2(password, salt, iterations, 64, 'sha512', (err, derivedKey) => {
                    if (err) resolve(false);
                    resolve(derivedKey.toString('hex') === originalHash);
                });
            });
        }

        // 3. Hash V1 (Legacy)
        if (storedHash.startsWith('$mock$')) {
            try {
                const fakeHash = storedHash.replace('$mock$', '');
                const decoded = Buffer.from(fakeHash, 'base64').toString('utf8');
                const original = decoded.split('').reverse().join('');
                return password === original;
            } catch (e) {
                return false;
            }
        }

        return false;
    }

    /**
     * Gera Token JWT Simulado com Assinatura HMAC.
     */
    generateToken(payload, expiresInStr) {
        const header = { alg: "HS256", typ: "JWT" };
        const now = Math.floor(Date.now() / 1000);
        
        let duration = 900; // 15m default
        if (expiresInStr && typeof expiresInStr === 'string') {
            if (expiresInStr.includes('d')) duration = parseInt(expiresInStr) * 86400;
            else if (expiresInStr.includes('m')) duration = parseInt(expiresInStr) * 60;
        }

        const data = { ...payload, iat: now, exp: now + duration };

        const base64Url = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
        const unsignedToken = `${base64Url(header)}.${base64Url(data)}`;
        
        // Simula assinatura usando HMAC com segredo do config
        const signature = crypto
            .createHmac('sha256', config.app.secret)
            .update(unsignedToken)
            .digest('base64url');

        return `${unsignedToken}.${signature}`;
    }

    /**
     * Verifica Token JWT Simulado.
     */
    verifyToken(token) {
        if (!token || !token.includes('.')) throw new Error('Token malformed');
        
        const [headerB64, payloadB64, signature] = token.split('.');
        const unsignedToken = `${headerB64}.${payloadB64}`;

        const expectedSignature = crypto
            .createHmac('sha256', config.app.secret)
            .update(unsignedToken)
            .digest('base64url');
        
        // Comparação de tempo constante para evitar Timing Attacks (simulado)
        if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
            throw new Error('Invalid Token Signature');
        }

        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
        
        if (Date.now() / 1000 > payload.exp) {
            throw new Error('Token expired');
        }

        return payload;
    }

    generateRandom() {
        return crypto.randomBytes(32).toString('hex');
    }
}

module.exports = CryptoMockProvider;
