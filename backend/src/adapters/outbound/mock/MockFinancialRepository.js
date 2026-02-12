
const IFinancialRepository = require('../../../core/ports/IFinancialRepository');

class MockFinancialRepository extends IFinancialRepository {
    constructor() {
        super();
        // Simula tabelas em memória
        this.balances = new Map(); // userId -> number
        this.credits = new Map();  // userId -> number
        this.transactions = [];
        
        // Simula Row Locks (Mutex por UserId)
        this.locks = new Set();

        // Seed inicial
        this.credits.set('1', 9999); // Admin
        this.balances.set('1', 0.0);
        console.log('💰 [ADAPTER] MockFinancialRepository: Sistema Financeiro em Memória (Com Simulação de Locks)');
    }

    async _acquireLock(userId) {
        if (this.locks.has(userId)) {
            // Simula espera de banco de dados (DB Wait)
            await new Promise(r => setTimeout(r, 100));
            if (this.locks.has(userId)) throw new Error('Deadlock detected / Transaction timeout');
        }
        this.locks.add(userId);
    }

    _releaseLock(userId) {
        this.locks.delete(userId);
    }

    async getBalance(userId) {
        return this.balances.get(userId) || 0.0;
    }

    async getCredits(userId) {
        return this.credits.get(userId) || 0;
    }

    async addCredits(userId, amount) {
        try {
            await this._acquireLock(userId);
            const current = await this.getCredits(userId);
            this.credits.set(userId, current + amount);
            return true;
        } finally {
            this._releaseLock(userId);
        }
    }

    async deductCredits(userId, amount) {
        try {
            await this._acquireLock(userId);
            // Simula delay de I/O para expor race conditions em testes de carga
            await new Promise(r => setTimeout(r, 50)); 
            
            const current = await this.getCredits(userId);
            if (current < amount) return false;
            
            this.credits.set(userId, current - amount);
            return true;
        } finally {
            this._releaseLock(userId);
        }
    }

    async addBalance(userId, amount) {
        try {
            await this._acquireLock(userId);
            const current = await this.getBalance(userId);
            this.balances.set(userId, current + amount);
            return true;
        } finally {
            this._releaseLock(userId);
        }
    }

    async logTransaction(transaction) {
        const newTx = { ...transaction, id: Date.now().toString(), date: new Date().toISOString() };
        this.transactions.unshift(newTx); // Adiciona no topo
        return newTx;
    }

    async getTransactions(userId) {
        if (!userId) return this.transactions; // Admin vê tudo
        return this.transactions.filter(t => t.userId === userId);
    }
}

module.exports = MockFinancialRepository;
