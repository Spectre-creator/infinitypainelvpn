
const IDatabaseAdapter = require('../../../core/ports/IDatabaseAdapter');

class MockDbAdapter extends IDatabaseAdapter {
    constructor() {
        super();
        console.log('💾 [ADAPTER] MockDbAdapter: Camada de persistência virtual ativa (Smart Mock).');
    }

    async query(statement, params) {
        // Simula latência de rede/disco do banco de dados
        await new Promise(r => setTimeout(r, 15));
        
        const sql = statement.toLowerCase().trim();

        // 1. Interceptação: Tabela APP_CONFIG (Versão e Mensagens)
        if (sql.includes('from app_config')) {
            console.log('[DB MOCK] Retornando configuração simulada do app.');
            return {
                rowCount: 1,
                rows: [{
                    id: 1,
                    version_code: 1,
                    update_message: 'Bem-vindo ao VPN Nexus! Esta é uma configuração simulada pelo MockDbAdapter.',
                    update_url: 'https://exemplo.com/app.apk',
                    maintenance_mode: false
                }]
            };
        }

        // 2. Interceptação: Tabela APP_PROXIES (Servidores de Conexão)
        if (sql.includes('from app_proxies')) {
            console.log('[DB MOCK] Retornando lista de proxies simulados.');
            return {
                rowCount: 2,
                rows: [
                    { 
                        id: 1, 
                        name: 'BR Premium 01 (Mock)', 
                        ip: '127.0.0.1', 
                        port: 80, 
                        is_public: true, 
                        status: 'online' 
                    },
                    { 
                        id: 2, 
                        name: 'US Gamer (Mock)', 
                        ip: '192.168.1.100', 
                        port: 443, 
                        is_public: true, 
                        status: 'online' 
                    }
                ]
            };
        }

        // 3. Interceptação: Tabela APP_PAYLOADS (Métodos de Conexão)
        if (sql.includes('from app_payloads')) {
            console.log('[DB MOCK] Retornando payloads simulados.');
            return {
                rowCount: 3,
                rows: [
                    { 
                        id: 1, 
                        name: 'Vivo SSL', 
                        operator: 'vivo', 
                        type: 'ssl', 
                        payload: 'GET / HTTP/1.1[crlf]Host: portal.vivo.com.br[crlf][crlf]', 
                        sni: 'portal.vivo.com.br', 
                        color: '#8b5cf6', 
                        is_active: true 
                    },
                    { 
                        id: 2, 
                        name: 'Tim Direct', 
                        operator: 'tim', 
                        type: 'inject', 
                        payload: 'CONNECT / HTTP/1.1[crlf]Host: tim.com.br[crlf][crlf]', 
                        sni: '', 
                        color: '#3b82f6', 
                        is_active: true 
                    },
                    { 
                        id: 3, 
                        name: 'Claro V2Ray', 
                        operator: 'claro', 
                        type: 'v2ray', 
                        payload: '{}', 
                        sni: 'claro.com.br', 
                        color: '#ef4444', 
                        is_active: true 
                    }
                ]
            };
        }

        // Fallback: Retorna vazio para queries não mapeadas ou de escrita simulada
        // Isso evita crash no backend, mas loga para depuração
        if (!sql.startsWith('insert') && !sql.startsWith('update') && !sql.startsWith('delete')) {
            console.log(`[DB MOCK] Query de leitura ignorada (Retornando vazio): ${statement.substring(0, 60)}...`);
        } else {
            console.log(`[DB MOCK] Query de escrita ignorada (Sucesso simulado): ${statement.substring(0, 60)}...`);
        }

        return { rows: [], rowCount: 0 };
    }

    async connect() { return true; }
    async close() { return true; }
}

module.exports = MockDbAdapter;
