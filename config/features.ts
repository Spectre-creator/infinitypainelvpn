
/**
 * ARQUITETURA DE FEATURE FLAGS
 * Centraliza o controle de funcionalidades experimentais ou em roll-out.
 */
export const Features = {
    // Controla a ativação do chatbot de IA para responder a palavras-chave (LEGADO / FALLBACK).
    ENABLE_AI_BOT: true, 
    
    // [NOVO] Chatbot Configurável V2 (Prioritário)
    // Permite fluxos de teste, criação de usuário e respostas customizadas.
    ENABLE_CHATBOT_V2: true,
    
    // Controla o sistema de checkout para revendedores
    ENABLE_RESELLER_CHECKOUT: true,

    // Módulo de Sub-Revenda e Afiliação Multinível
    ENABLE_SUB_RESELLING: true,
};
