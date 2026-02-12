
/**
 * CONTRACT: IVpnProvider
 * Define as operações obrigatórias para qualquer provedor de VPN (Seja SSH ou Mock).
 */
class IVpnProvider {
    async createAccount(user) { throw new Error('Method not implemented: createAccount'); }
    async removeAccount(username) { throw new Error('Method not implemented: removeAccount'); }
    async checkConnectivity() { throw new Error('Method not implemented: checkConnectivity'); }
}

module.exports = IVpnProvider;
