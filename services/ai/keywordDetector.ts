/**
 * MÓDULO DETECTOR DE PALAVRAS-CHAVE
 * Analisa a mensagem do usuário em busca de termos gatilho para acionar a IA.
 */

// Lista de palavras-chave que disparam o bot de IA.
const KEYWORDS = [
    'teste', 'valor', 'como funciona', 'pix', 'chave pix', 'instalar', 
    'iphone', 'app', 'plano', 'renovar', 'internet'
];

/**
 * Verifica se a mensagem contém alguma das palavras-chave definidas.
 * A verificação é case-insensitive e ignora pontuações básicas.
 * 
 * @param message A mensagem de entrada do usuário.
 * @returns A primeira palavra-chave encontrada ou `null` se nenhuma for encontrada.
 */
export function detectKeyword(message: string): string | null {
    // 1. Normaliza a mensagem: minúsculas e remove pontuação simples.
    const normalizedMessage = message.toLowerCase().replace(/[.,!?]/g, '');
    
    // 2. Itera sobre as palavras-chave para encontrar uma correspondência.
    for (const keyword of KEYWORDS) {
        // Para garantir que correspondências parciais não sejam acionadas
        // (ex: 'app' em 'happy'), usamos word boundaries `\b` para palavras únicas
        // e tratamos palavras compostas como uma busca de substring.
        if (keyword.includes(' ')) {
            if (normalizedMessage.includes(keyword)) {
                return keyword;
            }
        } else {
            const regex = new RegExp(`\\b${keyword}\\b`);
            if (regex.test(normalizedMessage)) {
                return keyword;
            }
        }
    }

    // 3. Se nenhum gatilho for encontrado, retorna nulo.
    return null;
}
