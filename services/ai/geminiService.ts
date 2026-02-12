
import { apiRequest } from '../api';

/**
 * Gera uma resposta contextualizada usando a API do Backend (que protege a chave do Gemini).
 * @param question A pergunta do usuário (já pré-processada).
 * @returns Uma string com a resposta da IA.
 */
export async function getGeminiResponse(question: string): Promise<string> {
    try {
        // Agora chamamos nosso próprio backend, que detém a chave secreta
        const response = await apiRequest('/ai/chat', 'POST', { message: question });
        
        if (!response || !response.text) {
            throw new Error("A resposta da IA veio vazia ou malformada.");
        }
        
        return response.text.trim();

    } catch (error) {
        console.error("Error fetching AI response from backend:", error);
        // Propaga o erro para que o `aiRouter` possa acionar o fallback.
        throw error;
    }
}
