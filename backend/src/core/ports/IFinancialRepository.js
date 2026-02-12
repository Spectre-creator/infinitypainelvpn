
/**
 * CONTRACT: IFinancialRepository
 * Define operações de saldo, créditos e transações.
 */
class IFinancialRepository {
    async getBalance(userId) { throw new Error('Method not implemented'); }
    async getCredits(userId) { throw new Error('Method not implemented'); }
    async addCredits(userId, amount) { throw new Error('Method not implemented'); }
    async deductCredits(userId, amount) { throw new Error('Method not implemented'); }
    async addBalance(userId, amount) { throw new Error('Method not implemented'); }
    async logTransaction(transaction) { throw new Error('Method not implemented'); }
    async getTransactions(userId) { throw new Error('Method not implemented'); }
}

module.exports = IFinancialRepository;
