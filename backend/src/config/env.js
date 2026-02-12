
require('dotenv').config();

// --- DETECÇÃO AUTOMÁTICA DE AMBIENTE ---

// 1. Verifica se a infraestrutura crítica foi configurada
const hasDatabase = !!(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASS);
const hasVps = !!(process.env.VPS_HOST && process.env.VPS_USER && process.env.VPS_PASSWORD); // VPS é opcional para DB, mas crítico para o Core do negócio

// 2. Verifica se o usuário forçou o modo Mock explicitamente
const forceMock = process.env.MOCK_MODE === 'true';

// 3. Define o modo de operação
// Se temos DB e VPS configurados e NÃO foi forçado o mock -> PRODUÇÃO
const isMock = forceMock || (!hasDatabase || !hasVps);

const config = {
    app: {
        port: process.env.PORT || 3001,
        env: isMock ? 'development' : 'production',
        isMock: isMock,
        secret: process.env.JWT_SECRET || 'nexus_unsafe_dev_secret_change_me'
    },
    security: {
        allowRealVpn: !isMock, // Se não é mock, permite VPN real
    },
    // Configurações de infraestrutura
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        name: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT) || 5432,
    },
    infra: {
        // Para logs e debug: mostra o host real ou o placeholder do mock
        dbHost: isMock ? 'memory (virtual)' : process.env.DB_HOST,
        sshHost: isMock ? 'localhost (virtual)' : process.env.VPS_HOST
    }
};

module.exports = config;
