
const { Pool } = require('pg');
const config = require('./index');

let pool;

if (!config.app.isMock) {
    pool = new Pool({
        user: config.db.user,
        host: config.db.host,
        database: config.db.name,
        password: config.db.pass,
        port: config.db.port,
    });

    pool.on('error', (err) => {
        console.error('❌ Erro inesperado no PostgreSQL', err);
    });
} else {
    // Mock Pool para evitar erros se chamar sem querer
    pool = {
        query: async () => { console.warn('[DB MOCK] Query executada no vácuo'); return { rows: [] }; },
        on: () => {}
    };
}

module.exports = pool;
