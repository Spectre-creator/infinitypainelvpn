const Factory = require('../infra/Factory');
const ClientService = require('../services/ClientService');
const SecurityUtils = require('../utils/SecurityUtils');

class AppConfigController {

    /**
     * GET /api/public/config
     * Retorna o JSON completo para o aplicativo Android/iOS
     */
    async getConfig(req, res) {
        try {
            // Em produção real, buscaríamos do banco via Repository
            // Aqui estamos usando dados mockados ou do adapter para simplificar a integração imediata
            const db = Factory.getDatabaseAdapter();
            
            // Simulação de busca no banco (Adapte para seus Repositories reais)
            const configQuery = await db.query('SELECT * FROM app_config LIMIT 1');
            const proxiesQuery = await db.query('SELECT * FROM app_proxies WHERE status = \'online\'');
            const payloadsQuery = await db.query('SELECT * FROM app_payloads WHERE is_active = TRUE');

            const appConfig = configQuery.rows[0] || { update_url: '', update_message: '' };
            
            // Estrutura Padrão de Mercado (Compatível com DTunnel/Conecta4G)
            const jsonResponse = {
                version: appConfig.version_code || 1,
                releaseNotes: appConfig.update_message,
                urlUpdate: appConfig.update_url,
                isMaintenance: appConfig.maintenance_mode,
                sms: "",
                urlTermos: "https://seusite.com/termos",
                checkUser: `${req.protocol}://${req.get('host')}/api/public/check-user`,
                proxies: proxiesQuery.rows.map(p => ({
                    id: p.id,
                    name: p.name,
                    ip: p.ip,
                    port: p.port,
                    isPublic: p.is_public
                })),
                payloads: payloadsQuery.rows.map(p => ({
                    name: p.name,
                    operator: p.operator,
                    type: p.type,
                    payload: p.payload,
                    sni: p.sni,
                    color: p.color
                }))
            };

            res.json(jsonResponse);
        } catch (error) {
            console.error('Erro ao gerar config do app:', error);
            res.status(500).json({ error: 'Falha ao gerar configuração.' });
        }
    }

    /**
     * POST /api/public/check-user
     * Valida se o cliente pode se conectar (Login no App VPN)
     */
    async checkUser(req, res) {
        try {
            const { username, password } = req.body;
            
            // Usa o repositório de clientes para buscar
            const clientRepo = Factory.getClientRepository();
            const client = await clientRepo.findByLogin(username);

            if (!client) {
                return res.status(403).json({ error: 'Usuário não encontrado', is_active: false });
            }

            // Validação de Senha Segura (Compatível com Mock e Produção)
            const isPasswordValid = await SecurityUtils.comparePassword(password, client.password);

            if (!isPasswordValid) {
                return res.status(403).json({ error: 'Senha incorreta', is_active: false });
            }

            const now = new Date();
            const expiry = new Date(client.expiryDate);

            if (expiry < now) {
                return res.status(403).json({ 
                    error: 'Conta Vencida', 
                    is_active: false, 
                    expiration_date: client.expiryDate 
                });
            }

            if (client.status !== 'active') {
                return res.status(403).json({ error: 'Conta Bloqueada', is_active: false });
            }

            // Sucesso -> Gerar JWT para o cliente
            const accessToken = SecurityUtils.generateToken({ clientId: client.id, role: 'client' }, '24h');

            res.json({
                is_active: true,
                accessToken,
                expiration_date: client.expiryDate,
                limit: client.limit,
                uuid: client.uuid // Para V2Ray
            });

        } catch (error) {
            res.status(500).json({ error: 'Erro interno' });
        }
    }
}

module.exports = new AppConfigController();