
/**
 * MÓDULO AI ROUTER (Orquestrador)
 * Ponto de entrada que gerencia o fluxo de uma mensagem recebida.
 */

import { Features } from '../../config/features';
import { detectKeyword } from './keywordDetector';
import { getGeminiResponse } from './geminiService';
import { logInteraction } from './logger';
import { ChatbotEngine } from '../chatbot/chatbotEngine'; // [NOVO]

const FALLBACK_MESSAGE = "Desculpe, meu sistema de inteligência está temporariamente indisponível. Por favor, tente novamente mais tarde ou entre em contato com nosso suporte humano.";

/**
 * Processa a mensagem de entrada, aciona a IA se necessário e retorna uma resposta.
 * 
 * @param message A mensagem do usuário.
 * @returns A resposta do bot ou `null` se a IA não for acionada.
 */
export async function handleMessage(message: string): Promise<string | null> {
    
    // [NOVO] 0. Interceptação pelo Chatbot V2 (Motor de Regras)
    if (Features.ENABLE_CHATBOT_V2) {
        // Usa um ID de sessão fixo para a simulação na tela, ou viria do webhook do WhatsApp
        const mockSessionId = 'web_simulator_user'; 
        const v2Response = await ChatbotEngine.processMessage(mockSessionId, message);
        
        if (v2Response) {
            console.log('[AI ROUTER] Mensagem capturada pelo Chatbot V2.');
            return v2Response;
        }
    }

    // 1. Feature Flag Check (Legacy AI)
    if (!Features.ENABLE_AI_BOT) {
        return null; // A funcionalidade está desligada, não faz nada.
    }

    // 2. Keyword Detection (Legacy)
    const detectedKeyword = detectKeyword(message);
    if (!detectedKeyword) {
        return null; // Nenhuma palavra-chave encontrada, ignora a mensagem.
    }
    
    let aiResponse: string;
    let status: 'SUCCESS' | 'FALLBACK' = 'SUCCESS';

    try {
        // 3. Call Gemini API
        aiResponse = await getGeminiResponse(message);
    } catch (error) {
        // 4. Fallback Logic
        console.error("AI Router fallback triggered:", error);
        aiResponse = FALLBACK_MESSAGE;
        status = 'FALLBACK';
    }

    // 5. Logging
    logInteraction({
        triggerMessage: message,
        detectedKeyword,
        aiResponse,
        status,
    });

    // 6. Return Response
    return aiResponse;
}
