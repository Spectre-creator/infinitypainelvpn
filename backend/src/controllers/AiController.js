
const { GoogleGenAI } = require("@google/genai");
const { logger } = require('../utils/Logger');

class AiController {
    
    async chat(req, res) {
        try {
            const { message } = req.body;
            const apiKey = process.env.GEMINI_API_KEY;

            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }

            if (!apiKey) {
                logger.warn('Tentativa de uso do Chatbot sem GEMINI_API_KEY configurada no servidor.');
                return res.status(503).json({ error: 'AI Service Unavailable (Missing Key on Server)' });
            }

            const ai = new GoogleGenAI({ apiKey });
            
            // Prompt de Sistema movido para o Backend (Segurança e Centralização)
            const systemInstruction = `Você é um assistente virtual especialista em vendas de serviços de VPN chamado 'Nexus AI'.
            Seu objetivo é responder dúvidas de clientes de forma clara, amigável e direta para fechar vendas.
            Seu tom deve ser humano e prestativo.
            
            Informações sobre o serviço:
            - Planos: Mensal (R$ 15), Trimestral (R$ 40), Semestral (R$ 70).
            - Teste grátis: Oferecemos testes de 1 a 4 horas. O cliente pode gerar na tela de testes do painel.
            - Instalação: O cliente precisa baixar nosso aplicativo 'Nexus Conecta'. É compatível com Android e iPhone (via OpenVPN).
            - Pagamento: Aceitamos PIX. A chave é enviada após a escolha do plano.
            
            Responda APENAS à pergunta do usuário. Não adicione saudações extras se não for perguntado. Mantenha as respostas curtas e focadas.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                config: {
                    systemInstruction,
                    temperature: 0.7,
                },
                contents: message,
            });

            res.json({ text: response.text });

        } catch (error) {
            logger.error({ err: error, message: req.body.message }, 'AI Chat Error');
            res.status(500).json({ error: 'Failed to process AI request' });
        }
    }
}

module.exports = new AiController();
