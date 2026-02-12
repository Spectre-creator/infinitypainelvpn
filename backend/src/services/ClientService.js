const Factory = require('../infra/Factory');
const { businessLogger, logger, auditLogger } = require('../utils/Logger');
const SecurityUtils = require('../utils/SecurityUtils');

class ClientService {
    constructor() {
        this.vpnProvider = Factory.getVpnProvider();
        this.userRepo = Factory.getUserRepository(); 
        this.clientRepo = Factory.getClientRepository(); 
        this.finRepo = Factory.getFinancialRepository();
    }

    async listAll(ownerId) {
        // Retorna apenas ativos (Soft Deleted filtrados no repo)
        return await this.clientRepo.findAllByOwner(ownerId);
    }

    async findById(clientId) {
        return await this.clientRepo.findById(clientId);
    }

    async createClient(clientData, owner) {
        let creditsDeducted = false;
        let sshCreated = false;
        const plainPassword = clientData.password;

        try {
            const now = new Date();
            const duration = parseInt(clientData.days) || 30;
            let expiryDate;
            
            if (clientData.isTest) {
                expiryDate = new Date(now.getTime() + duration * 60000); 
            } else {
                expiryDate = new Date();
                expiryDate.setDate(now.getDate() + duration);
            }

            const newClientPayload = {
                username: clientData.login,
                password: plainPassword,
                expiry: expiryDate.toISOString().split('T')[0],
                isV2Ray: clientData.isV2Ray
            };

            if (owner.role !== 'admin' && !clientData.isTest) {
                const hasCredits = await this.finRepo.deductCredits(owner.id, 1);
                if (!hasCredits) {
                    businessLogger.warn({ event: 'credit_reject', userId: owner.id }, 'Tentativa de criação sem saldo');
                    throw new Error('Créditos insuficientes para criar conta.');
                }
                creditsDeducted = true;
            }

            // Provisionamento na Infra (Mock ou Real)
            await this.vpnProvider.createAccount(newClientPayload);
            sshCreated = true;
            
            // Hash da senha antes de salvar no banco
            const hashedPassword = await SecurityUtils.hashPassword(plainPassword);

            const savedClient = await this.clientRepo.create({
                ...clientData,
                password: hashedPassword, // Salva a senha hasheada
                expiryDate: expiryDate.toISOString(),
                ownerId: owner.id,
                status: clientData.isTest ? 'test' : 'active'
            });

            // Retorna o cliente com a senha original para a UI (criação)
            savedClient.password = plainPassword;

            businessLogger.info({
                event: 'client_created',
                ownerId: owner.id,
                clientId: savedClient.id,
                isTest: clientData.isTest,
                login: savedClient.login
            }, `Novo cliente ${savedClient.login} criado.`);

            return savedClient;

        } catch (error) {
            logger.error({ err: error, step: 'create_client_transaction' }, 'Falha na criação de cliente. Iniciando Rollback.');

            if (sshCreated) {
                await this.vpnProvider.removeAccount(clientData.login).catch(e => console.error('Erro no rollback SSH', e));
            }

            if (creditsDeducted) {
                await this.finRepo.addCredits(owner.id, 1).catch(e => console.error('Erro no estorno', e));
            }

            throw error;
        }
    }

    async renewClient(clientId, days, owner) {
        let creditsDeducted = false;

        try {
            const clients = await this.listAll(owner.id); 
            const targetClient = clients.find(c => c.id === clientId);

            if (!targetClient) throw new Error('Cliente não encontrado ou excluído');

            if (owner.role !== 'admin') {
                const hasCredits = await this.finRepo.deductCredits(owner.id, 1);
                if (!hasCredits) throw new Error('Créditos insuficientes');
                creditsDeducted = true;
            }

            const currentExpiry = new Date(targetClient.expiryDate);
            const now = new Date();
            let newExpiry = currentExpiry < now ? now : currentExpiry;
            newExpiry.setDate(newExpiry.getDate() + days);

            // Atualiza no Servidor SSH (Mock/Real)
            await this.vpnProvider.createAccount({
                username: targetClient.login,
                password: targetClient.password,
                expiry: newExpiry.toISOString().split('T')[0]
            });

            const result = await this.clientRepo.updateExpiry(clientId, newExpiry.toISOString());

            businessLogger.info({
                event: 'client_renewed',
                ownerId: owner.id,
                clientId,
                daysAdded: days
            }, `Cliente ${targetClient.login} renovado.`);

            return result;

        } catch (error) {
            logger.error({ err: error }, 'Falha na renovação.');
            if (creditsDeducted) await this.finRepo.addCredits(owner.id, 1);
            throw error;
        }
    }

    async deleteClient(clientId) {
        try {
            // Em produção real, você buscaria o cliente aqui para pegar o login e remover do servidor SSH
            // const client = await this.clientRepo.findById(clientId);
            // await this.vpnProvider.removeAccount(client.login);

            // Executa Soft Delete no Banco
            const res = await this.clientRepo.delete(clientId);
            
            if (res) {
                // Auditoria: Registra quem deletou e quando
                auditLogger.info({ 
                    event: 'client_soft_deleted', 
                    clientId, 
                    compliance: 'LGPD_ANONYMIZED',
                    retention: 'FISCAL_ONLY' 
                }, 'Cliente marcado como deletado (Soft Delete). Dados PII anonimizados.');
                return true;
            }
            return false;
        } catch (e) {
            logger.error({ err: e }, 'Erro ao deletar cliente');
            return false;
        }
    }

    async toggleStatus(clientId) {
        // Implementação simplificada para Mock
        return { success: true, message: 'Status alterado (Mock)' };
    }
}

module.exports = new ClientService();