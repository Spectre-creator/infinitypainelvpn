
const INotificationProvider = require('../../../core/ports/INotificationProvider');
const { logger } = require('../../../utils/Logger');

/**
 * 📱 MOCK WHATSAPP PROVIDER (Multi-Device Simulator)
 * 
 * Simula uma API de WhatsApp (como Evolution API, Baileys ou Z-API) em memória.
 * 
 * CAPACIDADES:
 * 1. Gestão de Instâncias: Cria, conecta e desconecta sessões virtuais.
 * 2. Envio de Mensagens: Simula latência de rede e status de entrega (SENT).
 * 3. Simulação de Webhook: Gera payloads de entrada para testar o ChatbotEngine.
 * 4. Persistência Volátil: Mantém histórico enquanto o processo roda.
 */
class MockWhatsappProvider extends INotificationProvider {
    constructor() {
        super();
        // Armazena estado das instâncias: { instanceId: { status, qrCode, messages: [], config: {} } }
        this.instances = new Map();
        
        // Inicializa uma instância padrão para facilitar testes imediatos
        this._initInstance('default', 'CONNECTED', { name: 'Instância Principal' });
        
        console.log('📱 [ADAPTER] MockWhatsappProvider: Gateway de mensagens virtual ativo.');
    }

    _initInstance(instanceId, status = 'DISCONNECTED', config = {}) {
        this.instances.set(instanceId, {
            id: instanceId,
            status,
            qrCode: status === 'DISCONNECTED' ? 'mock-qr-code-base64' : null,
            messages: [], // Histórico de mensagens da sessão (Volátil)
            config,
            updatedAt: new Date().toISOString()
        });
    }

    /**
     * Envia uma mensagem de texto (Simulação de Saída).
     * @param {string} instanceId ID da instância remetente
     * @param {string} phone Telefone destino (com DDI/DDD)
     * @param {string} message Conteúdo da mensagem
     */
    async sendWhatsApp(instanceId, phone, message) {
        /*
         TODO: PRODUCTION INTEGRATION (EVOLUTION API EXAMPLE)
         ----------------------------------------------------
         const axios = require('axios');
         const url = `${process.env.WA_API_URL}/message/sendText/${instanceId}`;
         
         try {
            await axios.post(url, {
                number: phone,
                options: { delay: 1200, presence: 'composing' },
                textMessage: { text: message }
            }, {
                headers: { 'apikey': process.env.WA_API_KEY }
            });
            return true;
         } catch (e) {
            logger.error({ err: e }, 'Falha no envio Evolution API');
            return false;
         }
        */

        // --- MOCK IMPLEMENTATION ---
        // Recupera ou cria instância (Auto-create para facilitar testes)
        let instance = this.instances.get(instanceId);
        if (!instance) {
            logger.warn({ instanceId }, '⚠️ Tentativa de envio em instância inexistente (Mock). Criando automaticamente...');
            this._initInstance(instanceId, 'CONNECTED');
            instance = this.instances.get(instanceId);
        }

        // Simula delay de rede e status "digitando..."
        await new Promise(resolve => setTimeout(resolve, 800));

        // Registra a mensagem no histórico interno
        const msgObj = {
            id: `msg_out_${Date.now()}`,
            from: 'me',
            to: phone,
            content: message,
            timestamp: new Date().toISOString(),
            status: 'SENT'
        };
        instance.messages.push(msgObj);

        logger.info({ 
            service: 'whatsapp_mock', 
            instanceId, 
            to: phone, 
            preview: message.substring(0, 50) + '...' 
        }, '📤 Mensagem enviada (Simulação)');

        return true;
    }

    /**
     * Helper para Testes: Simula o recebimento de uma mensagem de um cliente.
     * Deve ser chamado pelo Controller de Testes ou Webhook Mock para disparar o Chatbot.
     * 
     * @param {string} instanceId 
     * @param {string} fromNumber 
     * @param {string} text 
     * @returns {object} Payload compatível com Evolution API/Baileys
     */
    async simulateIncomingMessage(instanceId, fromNumber, text) {
        const instance = this.instances.get(instanceId);
        if (!instance) this._initInstance(instanceId, 'CONNECTED');

        const msgObj = {
            id: `msg_in_${Date.now()}`,
            from: fromNumber,
            to: 'me',
            content: text,
            timestamp: new Date().toISOString(),
            status: 'RECEIVED'
        };

        this.instances.get(instanceId).messages.push(msgObj);

        logger.info({ 
            service: 'whatsapp_mock', 
            from: fromNumber, 
            text 
        }, '📥 Mensagem recebida (Simulação). Preparando Webhook Payload...');

        // Gera o payload exato que a Evolution API enviaria no Webhook
        // Isso permite testar o parser do ChatbotEngine sem alterar o código dele
        const webhookPayload = {
            event: 'messages.upsert',
            instance: instanceId,
            data: {
                key: {
                    remoteJid: `${fromNumber}@s.whatsapp.net`,
                    fromMe: false,
                    id: msgObj.id
                },
                pushName: `Cliente Mock ${fromNumber.slice(-4)}`,
                message: { conversation: text },
                messageType: 'conversation',
                messageTimestamp: Math.floor(Date.now() / 1000)
            }
        };

        return webhookPayload;
    }

    /**
     * Retorna o status da conexão da instância.
     */
    async getConnectionStatus(instanceId) {
        /*
         TODO: PRODUCTION - Consultar API Real
         const res = await axios.get(`${url}/instance/connectionState/${instanceId}`);
         return res.data.instance.state; // 'open', 'close', 'connecting'
        */
        const instance = this.instances.get(instanceId);
        return instance ? instance.status : 'NOT_FOUND';
    }

    /**
     * Simula a conexão bem-sucedida via leitura de QR Code.
     */
    async connectInstance(instanceId) {
        const instance = this.instances.get(instanceId);
        if (instance) {
            instance.status = 'CONNECTED';
            instance.qrCode = null;
            return { status: 'CONNECTED', message: 'Instância conectada com sucesso (Mock).' };
        }
        return { status: 'ERROR', message: 'Instância não encontrada.' };
    }
    
    /**
     * Recupera histórico de mensagens (Apenas Mock)
     */
    getHistory(instanceId) {
        return this.instances.get(instanceId)?.messages || [];
    }
}

module.exports = MockWhatsappProvider;
