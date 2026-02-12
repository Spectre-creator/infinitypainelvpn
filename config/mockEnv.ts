
/**
 * ARQUITETURA DE SEGURANÇA - AMBIENTE MOCK
 * 
 * Este arquivo simula o carregamento de variáveis de ambiente de um arquivo .env.mock.
 * Em um pipeline real, estas variáveis seriam injetadas via CI/CD e não estariam comitadas.
 * 
 * @security-level LOW (Simulação apenas)
 */

export const MockEnv = {
    // Flag mestra de ambiente
    IS_MOCK: true,
    
    // Credenciais de Simulação (Substituem admin/admin fixos)
    // Alterar aqui reflete em todo o sistema de autenticação mockado
    MOCK_AUTH_USER: 'admin_simulacao',
    MOCK_AUTH_PASS: 'senha_segura_mock_123',
    
    // Configurações de UI
    SHOW_DEV_HINTS: true, // Exibe as credenciais na tela de login apenas para facilitar testes
    WATERMARK_TEXT: 'AMBIENTE DE SIMULAÇÃO - DADOS FICTÍCIOS - NÃO INSERIR DADOS REAIS',
    
    // Feature Flags de Segurança
    BLOCK_EXTERNAL_CONNECTIONS: true, // Garante que o MockBackend nunca tente fetch real
};
