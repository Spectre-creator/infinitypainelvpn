
const Factory = require('../infra/Factory');
const ClientService = require('./ClientService');

/**
 * MÁQUINA DE ESTADO DO CHATBOT V2 (BACKEND)
 * Gerencia fluxos conversacionais complexos e ações de sistema.
 */
class ChatbotEngineService {
    
    constructor() {
        this.settingsRepo = Factory.getSettingsRepository();
        this.sessionStore = Factory.getSessionStore();
    }
    
    async _getConfig() {
        // Busca a configuração completa e extrai a parte do chatbot
        const allSettings = await this.settingsRepo.getSettings();
        return allSettings.chatbot_config || {};
    }

    /**
     * Ponto de entrada principal.
     * Retorna a resposta (string) ou null se o chatbot não capturar a mensagem.
     */
    async processMessage(sessionId, message) {
        const config = await this._getConfig();
        if (!config.flows) return null; // Aborta se config não existe
        
        let session = await this.sessionStore.get(`chatbot:${sessionId}`);
        
        if (session && (Date.now() - new Date(session.lastInteraction).getTime() > 5 * 60 * 1000)) {
            await this.sessionStore.del(`chatbot:${sessionId}`);
            session = null;
        }

        const normalizedMsg = message.toLowerCase().trim();

        if (session && session.state !== 'IDLE') {
            return await this.handleActiveFlow(session, normalizedMsg, config);
        }

        return await this.checkTriggers(sessionId, normalizedMsg, config);
    }

    private async checkTriggers(sessionId, msg, config) {
        if (config.flows.testFlow.active && config.flows.testFlow.keywords.some(k => msg.includes(k))) {
            await this.startSession(sessionId, 'TEST_WAITING_OPERATOR');
            return config.flows.testFlow.messages.askOperator;
        }

        if (config.flows.userFlow.active && config.flows.userFlow.keywords.some(k => msg.includes(k))) {
            await this.startSession(sessionId, 'USER_WAITING_NAME');
            return config.flows.userFlow.messages.askName;
        }

        for (const rule of (config.customRules || [])) {
            if (rule.isActive && rule.keywords.some(k => msg.includes(k))) {
                return rule.response;
            }
        }

        return null;
    }

    private async handleActiveFlow(session, msg, config) {
        
        if (session.state === 'TEST_WAITING_OPERATOR') {
            const duration = config.flows.testFlow.duration || 60; // Duração em minutos
            
            // Business Rule: TIM must use V2Ray/Xray
            const useV2Ray = msg.toLowerCase().includes('tim');

            try {
                // Mock owner para o ClientService
                const mockOwner = { id: '1', role: 'admin' };
                const login = `teste${Math.floor(Math.random()*1000)}`;

                const result = await ClientService.createClient({
                    login,
                    password: config.flows.testFlow.defaultPassword || '12345',
                    days: duration, 
                    limit: 1,
                    isTest: true,
                    isV2Ray: useV2Ray
                }, mockOwner);

                await this.sessionStore.del(session.sessionId);

                const expiryDate = new Date(result.expiryDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                return this.replaceVars(config.flows.testFlow.messages.success, {
                    login: result.login,
                    password: result.password,
                    expiry: expiryDate
                });
            } catch (e) {
                await this.sessionStore.del(session.sessionId);
                return config.flows.testFlow.messages.error;
            }
        }
        
        // Outros fluxos...
        await this.sessionStore.del(session.sessionId);
        return "Desculpe, não entendi. Vamos recomeçar?";
    }

    private async startSession(sessionId, initialState) {
        const session = {
            sessionId: `chatbot:${sessionId}`,
            state: initialState,
            tempData: {},
            lastInteraction: new Date().toISOString()
        };
        // TTL de 5 minutos
        await this.sessionStore.set(`chatbot:${sessionId}`, session, 300);
    }

    private replaceVars(template, vars) {
        let text = template;
        for (const key in vars) {
            text = text.replace(new RegExp(`{{${key}}}`, 'g'), vars[key]);
        }
        return text;
    }
}

module.exports = new ChatbotEngineService();
