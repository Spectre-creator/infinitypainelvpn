
const IFinancialRepository = require('../../../core/ports/IFinancialRepository');

class RealFinancialRepository extends IFinancialRepository {
    constructor(dbAdapter) {
        super();
        this.db = dbAdapter;
    }

    async getBalance(userId) {
        const res = await this.db.query('SELECT balance FROM users WHERE id = $1', [userId]);
        // Garante retorno float, default 0.00
        return parseFloat(res.rows[0]?.balance || 0);
    }

    async getCredits(userId) {
        const res = await this.db.query('SELECT credits FROM users WHERE id = $1', [userId]);
        // Garante retorno int, default 0
        return parseInt(res.rows[0]?.credits || 0);
    }

    async addCredits(userId, amount) {
        await this.db.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, userId]);
        return true;
    }

    async deductCredits(userId, amount) {
        // Transação atômica para evitar Race Conditions (concorrência)
        const client = await this.db.connect();
        try {
            await client.query('BEGIN');
            
            // Bloqueia a linha do usuário para leitura (FOR UPDATE)
            const res = await client.query('SELECT credits FROM users WHERE id = $1 FOR UPDATE', [userId]);
            const current = parseInt(res.rows[0]?.credits || 0);
            
            if (current < amount) {
                await client.query('ROLLBACK');
                return false;
            }
            
            await client.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [amount, userId]);
            await client.query('COMMIT');
            return true;
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    }

    async addBalance(userId, amount) {
        // Assume que a coluna 'balance' existe na tabela 'users' (adicionar migration se necessário)
        // Se a coluna não existir no schema inicial, o DB lançará erro, alertando para ajuste do schema.sql
        await this.db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);
        return true;
    }

    async logTransaction(transaction) {
        const { userId, amount, type, gateway, status, description } = transaction;
        
        const res = await this.db.query(
            `INSERT INTO transactions 
            (user_id, amount, type, gateway, status, description, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW()) 
             RETURNING id, created_at as date`,
            [userId, amount, type, gateway, status, description]
        );
        
        // Retorna o objeto com o ID gerado pelo banco
        return { 
            ...transaction, 
            id: res.rows[0].id, 
            date: res.rows[0].date 
        };
    }

    async getTransactions(userId) {
        let query = 'SELECT id, user_id as "userId", amount, type, gateway, status, description, created_at as date FROM transactions';
        let params = [];
        
        if (userId) {
            query += ' WHERE user_id = $1';
            params.push(userId);
        }
        
        query += ' ORDER BY created_at DESC LIMIT 100';
        
        const res = await this.db.query(query, params);
        return res.rows.map(row => ({
            ...row,
            amount: parseFloat(row.amount) // Postgres retorna numeric como string
        }));
    }
}

module.exports = RealFinancialRepository;
