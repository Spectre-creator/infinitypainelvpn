
const Factory = require('../infra/Factory');
const ChatbotService = require('../services/ChatbotService');
const { logger } = require('../utils/Logger');

/**
 * WEBHOOK CONTROLLER
 * Responsável por receber callbacks de serviços externos (Gateways, APIs).
 */
class WebhookController {

    /**
     * Endpoint: POST /api/webhooks/whatsapp
     * Recebe eventos da API de WhatsApp (Ex: Evolution API).
     */
    async handleWhatsapp(req, res) {
        try {
            const payload = req.body;
            const instanceId = payload.instance;
            const messageData = payload.data;

            // Ignora eventos que não são de mensagem ou são de nós mesmos
            if (payload.event !== 'messages.upsert' || !messageData || messageData.key.fromMe) {
                return res.sendStatus(200);
            }
            
            const sender = messageData.key.remoteJid;
            // A mensagem pode estar em 'conversation' ou 'extendedTextMessage.text'
            const text = messageData.message?.conversation || messageData.message?.extendedTextMessage?.text;

            if (!text || !sender) {
                return res.sendStatus(200);
            }
            
            logger.info({ from: sender, instanceId, text }, 'Webhook de WhatsApp Recebido.');

            // Processa a mensagem no motor do chatbot
            const reply = await ChatbotService.processMessage(sender, text);

            // Se o motor gerou uma resposta, envia de volta
            if (reply) {
                const waProvider = Factory.getWhatsappProvider();
                // O primeiro parâmetro do sendWhatsApp é o instanceId
                await waProvider.sendWhatsApp(instanceId, sender, reply);
            }

            // Responde 200 OK para o provedor da API saber que recebemos
            res.sendStatus(200);

        } catch (error) {
            logger.error({ err: error }, 'Erro fatal no processamento do webhook de WhatsApp.');
            // Responde 500 para que a API possa tentar reenviar (se configurado)
            res.sendStatus(500);
        }
    }
}

module.exports = new WebhookController();
