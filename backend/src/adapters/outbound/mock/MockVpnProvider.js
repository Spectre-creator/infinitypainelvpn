
const IVpnProvider = require('../../../core/ports/IVpnProvider');

class MockVpnProvider extends IVpnProvider {
    constructor() {
        super();
        this.activeUsers = new Set(); // Simula o /etc/passwd
        console.log('🛡️ [ADAPTER] MockVpnProvider: Pronto (Simulando SSH Linux Stateful)');
    }

    async _simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, 800)); // Simula latência de rede
    }

    async createAccount(user) {
        await this._simulateDelay();
        
        if (this.activeUsers.has(user.username)) {
            console.error(`🔴 [MOCK SSH] Erro: useradd: user '${user.username}' already exists`);
            throw new Error(`Falha no SSH: Usuário ${user.username} já existe no servidor.`);
        }

        this.activeUsers.add(user.username);
        console.log(`📡 [MOCK SSH] useradd -m -s /bin/false -e ${user.expiry} ${user.username}`);
        console.log(`📡 [MOCK SSH] echo "${user.username}:${user.password}" | chpasswd`);
        
        return { success: true, method: 'MOCK_SSH' };
    }

    async removeAccount(username) {
        await this._simulateDelay();
        
        if (!this.activeUsers.has(username)) {
            console.warn(`⚠️ [MOCK SSH] Aviso: userdel: user '${username}' does not exist (Idempotência)`);
            // Linux userdel -f não falha se usuário não existe, mas logamos o aviso.
            return { success: true };
        }

        this.activeUsers.delete(username);
        console.log(`📡 [MOCK SSH] userdel -f ${username}`);
        return { success: true };
    }

    async checkConnectivity() {
        // Simula "Server Down" aleatoriamente (1% de chance) para testar Healthcheck
        if (Math.random() > 0.99) {
            throw new Error('SSH Connection Timeout');
        }
        return true; 
    }
}

module.exports = MockVpnProvider;
