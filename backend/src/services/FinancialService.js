
const Factory = require('../infra/Factory');

class FinancialService {
    constructor() {
        this.finRepo = Factory.getFinancialRepository();
        this.userRepo = Factory.getUserRepository();
    }

    async getDashboard(userId) {
        const balance = await this.finRepo.getBalance(userId);
        const credits = await this.finRepo.getCredits(userId);
        return { balance, credits };
    }

    async getExtrato(userId, role) {
        // Se for admin, pode passar userId null para ver tudo
        const queryId = role === 'admin' ? null : userId;
        return await this.finRepo.getTransactions(queryId);
    }

    async buyCredits(userId, amountBrl) {
        // Regra de Negócio: Preço do crédito
        const PRICE_PER_CREDIT = 5.0;
        
        // 1. Validar Saldo
        const balance = await this.finRepo.getBalance(userId);
        if (balance < amountBrl) {
            throw new Error('Saldo insuficiente na carteira.');
        }

        // 2. Calcular Créditos
        const creditsToAdd = Math.floor(amountBrl / PRICE_PER_CREDIT);
        if (creditsToAdd <= 0) throw new Error('Valor insuficiente para 1 crédito.');

        // 3. Executar Transação Atômica (Simulada)
        await this.finRepo.addBalance(userId, -amountBrl); // Debita saldo
        await this.finRepo.addCredits(userId, creditsToAdd); // Adiciona créditos

        // 4. Log
        await this.finRepo.logTransaction({
            userId,
            amount: amountBrl,
            type: 'credit_purchase',
            gateway: 'wallet_balance',
            status: 'paid',
            description: `Compra de ${creditsToAdd} créditos`
        });

        return { success: true, creditsAdded: creditsToAdd, newBalance: balance - amountBrl };
    }
}

module.exports = new FinancialService();
