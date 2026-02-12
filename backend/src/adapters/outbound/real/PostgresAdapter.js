
const { Pool } = require('pg');
const IDatabaseAdapter = require('../../../core/ports/IDatabaseAdapter');
const config = require('../../../config/env');

class PostgresAdapter extends IDatabaseAdapter {
    constructor() {
        super();
        
        // Configuração do Pool usando variáveis de ambiente
        // As variáveis DB_HOST, DB_USER, etc devem estar no .env
        this.pool = new Pool({
            host: config.infra.dbHost || process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '5432'),
            max: 20, // Connection Pool Size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        // Error handling no nível do pool (evita crash da app se o DB cair momentaneamente)
        this.pool.on('error', (err) => {
            console.error('❌ [PG POOL] Erro inesperado no cliente PostgreSQL (Idle)', err.message);
        });
    }

    async query(statement, params) {
        try {
            return await this.pool.query(statement, params);
        } catch (error) {
            console.error(`❌ [DB ERROR] Falha na query: ${statement}`, error.message);
            throw error;
        }
    }

    async connect() {
        return await this.pool.connect();
    }

    async close() {
        await this.pool.end();
        console.log('🔌 [PG POOL] Conexões encerradas com sucesso.');
    }
}

module.exports = PostgresAdapter;
