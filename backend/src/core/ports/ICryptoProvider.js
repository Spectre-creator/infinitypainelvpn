
/**
 * 🔐 CONTRACT: ICryptoProvider
 * Define a interface obrigatória para qualquer provedor de criptografia do sistema.
 * 
 * @security CRITICAL: Não alterar assinaturas sem revisão de segurança.
 */
class ICryptoProvider {
    /**
     * Gera um hash irreversível (ou verificável) da senha.
     * @param {string} password 
     * @returns {Promise<string>}
     */
    async hashPassword(password) { throw new Error('Method not implemented'); }

    /**
     * Verifica se a senha corresponde ao hash armazenado.
     * @param {string} password 
     * @param {string} hash 
     * @returns {Promise<boolean>}
     */
    async comparePassword(password, hash) { throw new Error('Method not implemented'); }

    /**
     * Gera um token de acesso (JWT ou similar).
     * @param {object} payload 
     * @param {string} expiresIn 
     * @returns {string}
     */
    generateToken(payload, expiresIn) { throw new Error('Method not implemented'); }

    /**
     * Valida um token e extrai o payload.
     * @param {string} token 
     * @returns {object}
     */
    verifyToken(token) { throw new Error('Method not implemented'); }

    /**
     * Gera uma string aleatória (token CSRF, salt, etc).
     * @returns {string}
     */
    generateRandom() { throw new Error('Method not implemented'); }
}

module.exports = ICryptoProvider;
