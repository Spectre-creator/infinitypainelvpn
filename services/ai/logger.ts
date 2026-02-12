/**
 * MÓDULO DE LOGGING - ATENDIMENTO IA
 * Registra as interações do chatbot para fins de auditoria e melhoria.
 */

interface AILog {
    timestamp: string;
    triggerMessage: string;
    detectedKeyword: string;
    aiResponse: string;
    status: 'SUCCESS' | 'FALLBACK';
}

/**
 * Loga uma interação completa com o chatbot.
 * Em um sistema real, isso enviaria os dados para um serviço de logging (Datadog, Sentry) ou banco de dados.
 * 
 * @param logData O objeto contendo os dados da interação.
 */
export function logInteraction(logData: Omit<AILog, 'timestamp'>) {
    const logEntry: AILog = {
        ...logData,
        timestamp: new Date().toISOString(),
    };

    // Para a simulação, vamos apenas imprimir no console de forma estruturada e colorida.
    console.log('%c--- 🤖 AI Chatbot Interaction Log ---', 'color: #8b5cf6; font-weight: bold;');
    console.log(`[${logEntry.timestamp}] Status: ${logEntry.status}`);
    console.log(`> User: "${logEntry.triggerMessage}"`);
    console.log(`> Keyword: "${logEntry.detectedKeyword}"`);
    console.log(`> AI: "${logEntry.aiResponse.substring(0, 100)}..."`);
    console.log('%c------------------------------------', 'color: #8b5cf6; font-weight: bold;');
}
