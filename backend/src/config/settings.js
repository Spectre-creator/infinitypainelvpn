
require('dotenv').config();

const settings = {
    app: {
        port: process.env.PORT || 3001,
        env: 'development',
        mockMode: true, // 🔒 TRAVA DE SEGURANÇA: MOCK ATIVO
        secret: 'mock_secret_dev_only'
    },
    // Definições de infraestrutura anuladas
    db: { active: false },
    ssh: { active: false }
};

module.exports = settings;
