
const Factory = require('../infra/Factory');

class SecretService {
    constructor() {
        this.secretRepo = Factory.getSecretRepository();
        this.settingsRepo = Factory.getSettingsRepository(); // Reusa para configs não sensíveis
    }

    // --- REMARKETING CONFIG ---
    // Agrega dados públicos (SettingsRepo) e privados (SecretRepo)

    async getRemarketingConfig() {
        // Recupera configurações não sensíveis (Host, User, Templates)
        // Nota: No mock atual, SettingsRepo é genérico, vamos simular storage de config estruturada aqui ou no repo
        // Para simplificar a migração, vamos assumir que o MockSecretRepo guarda o JSON da config sensível
        
        const rawConfig = await this.secretRepo.getSecret('remarketing_config_json');
        
        let config = rawConfig ? JSON.parse(rawConfig) : this._getDefaultConfig();

        // 🛡️ MASKING POLICY: Nunca retornar senhas reais para o frontend
        if (config.smtp.pass) config.smtp.pass = '********';
        if (config.whatsapp.apiToken) config.whatsapp.apiToken = '********';

        return config;
    }

    async saveRemarketingConfig(newConfig) {
        // Recupera config atual para preservar senhas se vierem mascaradas
        const currentRaw = await this.secretRepo.getSecret('remarketing_config_json');
        const currentConfig = currentRaw ? JSON.parse(rawConfig) : this._getDefaultConfig();

        // Se o frontend mandou '********', mantém a senha antiga
        if (newConfig.smtp.pass === '********') {
            newConfig.smtp.pass = currentConfig.smtp.pass;
        }
        if (newConfig.whatsapp.apiToken === '********') {
            newConfig.whatsapp.apiToken = currentConfig.whatsapp.apiToken;
        }

        // Persiste no Cofre Seguro
        await this.secretRepo.saveSecret('remarketing_config_json', JSON.stringify(newConfig));
        
        return this.getRemarketingConfig(); // Retorna mascarado
    }

    _getDefaultConfig() {
        return {
            channels: { email: true, whatsapp: true },
            smtp: { host: 'smtp.gmail.com', port: '587', user: '', pass: '', secure: true, fromName: 'VPN Nexus' },
            whatsapp: { apiUrl: 'https://api.evolution.com', apiToken: '', instanceId: '' },
            templates: { pre_2d: '', pre_1d: '', expire_day: '', post_3d: '', post_7d: '', post_15d: '', post_30d: '', post_60d: '' }
        };
    }
}

module.exports = new SecretService();
