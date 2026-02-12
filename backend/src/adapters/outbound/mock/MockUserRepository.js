
const IUserRepository = require('../../../core/ports/IUserRepository');

// MOCK HASH ALGORITHM: $mock$ + Base64(Reverse(password))
// 'admin' -> nimda -> bmltZGE= -> $mock$bmltZGE=
// 'reseller' -> relleser -> cmVsbGVzZXI= -> $mock$cmVsbGVzZXI=

class MockUserRepository extends IUserRepository {
    constructor() {
        super();
        this.users = [
            { 
                id: '1', 
                username: 'admin', 
                // Hash compatível com CryptoMockProvider
                password_hash: '$mock$bmltZGE=', // 'admin' reverso base64
                role: 'admin', 
                credits: 9999 
            },
            {
                id: '2',
                username: 'reseller',
                // Hash compatível com CryptoMockProvider
                password_hash: '$mock$cmVsbGVzZXI=', // 'reseller' reverso base64
                role: 'reseller',
                credits: 50
            },
            // Backdoor explícito para a senha da UI do frontend
            {
                id: '3',
                username: 'admin_simulacao',
                password_hash: '$mock$admin$bypass', // CryptoMockProvider aceita isso explicitamente
                role: 'admin',
                credits: 9999
            }
        ];
        this.clients = [];
        console.log('💾 [ADAPTER] MockUserRepository: Seeds carregadas com MockCryptoHashes.');
    }

    async findById(id) {
        return this.users.find(u => u.id === id);
    }

    async findByUsername(username) {
        return this.users.find(u => u.username === username);
    }

    // --- Métodos de Client/Reseller mantidos iguais ---
    async findAllClients(ownerId) {
        if (ownerId === '1') return this.clients; 
        return this.clients.filter(c => c.ownerId === ownerId);
    }
    async findClientById(id) { return this.clients.find(c => c.id === id); }
    async createClient(clientData) {
        const newClient = { ...clientData, id: Date.now().toString() };
        this.clients.push(newClient);
        return newClient;
    }
    async updateClient(id, data) {
        const index = this.clients.findIndex(c => c.id === id);
        if (index !== -1) {
            this.clients[index] = { ...this.clients[index], ...data };
            return this.clients[index];
        }
        return null;
    }
    async deleteClient(id) {
        const initialLength = this.clients.length;
        this.clients = this.clients.filter(c => c.id !== id);
        return this.clients.length < initialLength;
    }
    async findAllResellers() { return this.users.filter(u => u.role === 'reseller'); }
    async create(user) {
        const newUser = { ...user, id: Date.now().toString() };
        this.users.push(newUser);
        return newUser;
    }
    async deleteUser(id) {
        this.users = this.users.filter(u => u.id !== id);
        return true;
    }
    async updateCredits(userId, amount) {
        const user = this.users.find(u => u.id === userId);
        if (user) {
            user.credits = (user.credits || 0) + amount;
            return true;
        }
        return false;
    }
}

module.exports = MockUserRepository;
