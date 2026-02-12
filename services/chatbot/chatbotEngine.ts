
import { Backend } from '../mockBackend';
import { ChatbotConfig, ChatbotSession } from '../../types';
import { DateRules } from '../../domain/rules.mock';

/**
 * MÁQUINA DE ESTADO DO CHATBOT V2
 * Gerencia fluxos conversacionais complexos e ações de sistema.
 */
class ChatbotEngineService {
    
    /**
     * Ponto de entrada principal.
     * Retorna a resposta (string) ou null se o chatbot não capturar a mensagem.
     */
    public async processMessage(sessionId: string, message: string): Promise<string | null> {
        const config = Backend.getChatbotConfig();
        let session = Backend.getChatbotSession(sessionId);
        
        // 1. Verificar timeout de sessão (ex: 5 minutos)
        if (session && (Date.now() - new Date(session.lastInteraction).getTime() > 5 * 60 * 1000)) {
            Backend.clearChatbotSession(sessionId);
            session = null;
        }

        const normalizedMsg = message.toLowerCase().trim();

        // 2. Se já existe uma sessão ativa, continua o fluxo
        if (session && session.state !== 'IDLE') {
            return await this.handleActiveFlow(session, normalizedMsg, config);
        }

        // 3. Se não tem sessão, verifica gatilhos (Keywords)
        return await this.checkTriggers(sessionId, normalizedMsg, config);
    }

    // --- TRIGGER CHECKER ---
    private async checkTriggers(sessionId: string, msg: string, config: ChatbotConfig): Promise<string | null> {
        // A. Fluxo de Teste
        if (config.flows.testFlow.active && config.flows.testFlow.keywords.some(k => msg.includes(k))) {
            await this.startSession(sessionId, 'TEST_WAITING_OPERATOR');
            return config.flows.testFlow.messages.askOperator;
        }

        // B. Fluxo de Criação de Usuário
        if (config.flows.userFlow.active && config.flows.userFlow.keywords.some(k => msg.includes(k))) {
            await this.startSession(sessionId, 'USER_WAITING_NAME');
            return config.flows.userFlow.messages.askName;
        }

        // C. Regras Customizadas (Resposta Simples)
        for (const rule of config.customRules) {
            if (rule.isActive && rule.keywords.some(k => msg.includes(k))) {
                return rule.response;
            }
        }

        return null; // Nenhuma regra ativada, passa para IA antiga
    }

    // --- FLOW HANDLERS ---
    private async handleActiveFlow(session: ChatbotSession, msg: string, config: ChatbotConfig): Promise<string> {
        
        // 🔹 FLUXO DE TESTE
        if (session.state === 'TEST_WAITING_OPERATOR') {
            const operator = this.detectOperator(msg);
            const duration = config.flows.testFlow.duration || 60;
            
            try {
                const login = `teste${Math.floor(Math.random()*1000)}`;
                // Business Rule: TIM must use V2Ray/Xray.
                const useV2Ray = operator === 'tim';

                const result = await Backend.createClient({
                    login,
                    password: config.flows.testFlow.defaultPassword || '12345',
                    days: duration / 1440,
                    limit: 1,
                    isTest: true,
                    category: 'PREMIUM',
                    isV2Ray: useV2Ray
                });

                Backend.clearChatbotSession(session.sessionId); // Fim do fluxo

                if (result.success && result.client) {
                    return this.replaceVars(config.flows.testFlow.messages.success, {
                        login: result.client.login,
                        password: result.client.password,
                        expiry: DateRules.formatTime(result.client.expiryDate)
                    });
                }
            } catch (e) {
                Backend.clearChatbotSession(session.sessionId);
                return config.flows.testFlow.messages.error;
            }
        }

        // 🔹 FLUXO DE CRIAÇÃO DE USUÁRIO
        if (session.state === 'USER_WAITING_NAME') {
            session.tempData = { ...session.tempData, name: msg };
            session.state = 'USER_WAITING_OPERATOR';
            Backend.saveChatbotSession(session);
            return config.flows.userFlow.messages.askOperator.replace('{{name}}', msg);
        }

        if (session.state === 'USER_WAITING_OPERATOR') {
            session.tempData = { ...session.tempData, operator: msg };
            session.state = 'USER_WAITING_PLAN';
            Backend.saveChatbotSession(session);
            return config.flows.userFlow.messages.askPlan;
        }

        if (session.state === 'USER_WAITING_PLAN') {
            // Finalizar Criação
            const planDuration = msg.includes('tri') ? 90 : 30; // Lógica simplificada de NLP
            const loginName = session.tempData.name.split(' ')[0].toLowerCase() + Math.floor(Math.random()*100);
            
            try {
                const result = await Backend.createClient({
                    login: loginName,
                    password: config.flows.userFlow.defaultPassword || '10203',
                    days: planDuration,
                    limit: 1,
                    isTest: false,
                    category: 'PREMIUM',
                    isV2Ray: true
                });

                Backend.clearChatbotSession(session.sessionId);

                if (result.success && result.client) {
                    return this.replaceVars(config.flows.userFlow.messages.success, {
                        login: result.client.login,
                        password: result.client.password,
                        expiry: DateRules.format(result.client.expiryDate)
                    });
                }
            } catch (e) {
                Backend.clearChatbotSession(session.sessionId);
                return "Erro ao criar conta. Verifique se o revendedor tem créditos.";
            }
        }

        return "Desculpe, não entendi. Vamos recomeçar?";
    }

    // --- UTILS ---
    private async startSession(sessionId: string, initialState: ChatbotSession['state']) {
        const session: ChatbotSession = {
            sessionId,
            state: initialState,
            tempData: {},
            lastInteraction: new Date().toISOString()
        };
        Backend.saveChatbotSession(session);
    }

    private detectOperator(msg: string): string {
        if (msg.includes('vivo')) return 'vivo';
        if (msg.includes('tim')) return 'tim';
        if (msg.includes('claro')) return 'claro';
        return 'geral';
    }

    private replaceVars(template: string, vars: Record<string, any>): string {
        let text = template;
        for (const key in vars) {
            text = text.replace(`{{${key}}}`, vars[key]);
        }
        return text;
    }
}

export const ChatbotEngine = new ChatbotEngineService();
