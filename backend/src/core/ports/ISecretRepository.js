
/**
 * CONTRACT: ISecretRepository
 * Define operações para armazenamento seguro de credenciais.
 * Em produção, isso se conectará a um Vault ou AWS Secrets Manager.
 */
class ISecretRepository {
    async getSecret(key) { throw new Error('Method not implemented'); }
    async saveSecret(key, value) { throw new Error('Method not implemented'); }
    async deleteSecret(key) { throw new Error('Method not implemented'); }
}

module.exports = ISecretRepository;
