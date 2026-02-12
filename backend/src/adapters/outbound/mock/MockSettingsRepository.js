const ISettingsRepository = require('../../../core/ports/ISettingsRepository');

class MockSettingsRepository extends ISettingsRepository {
    constructor() {
        super();
        this.settings = this._getDefaults();
        console.log('💾 [ADAPTER] MockSettingsRepository: Configurações em memória.');
    }

    _getDefaults() {
        return {
            app_name: 'VPN Nexus',
            primary_color: '#4f46e5',
            secondary_color: '#7c3aed',
            background_color: '#0f172a',
            card_color: '#1e293b',
            text_color: '#f8fafc',
            sidebar_text_color: '#94a3b8',
            chatbot_config: {
                flows: {
                    testFlow: { active: true, keywords: ['teste'], messages: { success: 'Teste gerado: {{login}}' } },
                    userFlow: { active: false, keywords: [] }
                },
                customRules: []
            }
        };
    }

    async getSettings() {
        // Retorna uma cópia para evitar mutação direta do objeto em memória
        return JSON.parse(JSON.stringify(this.settings));
    }

    async updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        return this.getSettings();
    }
}

module.exports = MockSettingsRepository;
