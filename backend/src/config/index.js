
require('dotenv').config();

const config = {
    app: {
        port: process.env.PORT || 3001,
        env: process.env.NODE_ENV || 'development',
        isMock: process.env.MOCK_MODE === 'true',
        secret: process.env.JWT_SECRET || 'nexus_super_secret_key'
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'postgres',
        pass: process.env.DB_PASS || 'password',
        name: process.env.DB_NAME || 'vpn_nexus',
        port: parseInt(process.env.DB_PORT) || 5432,
    },
    vps: {
        host: process.env.VPS_HOST,
        port: parseInt(process.env.VPS_PORT) || 22,
        user: process.env.VPS_USER,
        pass: process.env.VPS_PASSWORD,
    },
    financial: {
        pixKey: process.env.PIX_KEY,
        merchantName: process.env.MERCHANT_NAME
    }
};

module.exports = config;
