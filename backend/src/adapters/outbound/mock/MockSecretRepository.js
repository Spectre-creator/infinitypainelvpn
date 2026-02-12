
const ISecretRepository = require('../../../core/ports/ISecretRepository');

class MockSecretRepository extends ISecretRepository {
    constructor() {
        super();
        this.vault = new Map();
        
        // Seed inicial (Dados falsos para teste)
        this.vault.set('smtp_pass', 'mock_password_123');
        this.vault.set('whatsapp_token', 'mock_token_abc');
        
        console.log('🔐 [ADAPTER] MockSecretRepository: Cofre de senhas inicializado (Memória).');
    }

    async getSecret(key) {
        return this.vault.get(key) || null;
    }

    async saveSecret(key, value) {
        this.vault.set(key, value);
        return true;
    }

    async deleteSecret(key) {
        return this.vault.delete(key);
    }
}

module.exports = MockSecretRepository;
