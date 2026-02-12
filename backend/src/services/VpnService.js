
class VpnService {
    constructor({ vpnProvider, userRepository }) {
        this.vpn = vpnProvider;
        this.users = userRepository;
    }

    async createClient(adminId, clientData) {
        // 1. Verificar Admin/Revendedor
        const admin = await this.users.findById(adminId);
        if (!admin) throw new Error('Usuário não encontrado');

        if (admin.role !== 'admin' && admin.credits < 1) {
            throw new Error('Saldo insuficiente');
        }

        // 2. Debitar Créditos (Se não for teste e não for admin)
        if (admin.role !== 'admin') {
            await this.users.deductCredits(adminId, 1);
        }

        // 3. Criar na Infraestrutura (Porta)
        await this.vpn.createAccount(clientData.username, clientData.password, clientData.expiryDate);

        // 4. Persistir Cliente (Mock DB Log)
        console.log(`✅ [SERVICE] Cliente ${clientData.username} criado com sucesso.`);

        return { success: true, message: 'Cliente criado (Mock)' };
    }
}

module.exports = VpnService;
