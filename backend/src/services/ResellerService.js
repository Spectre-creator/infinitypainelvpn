
const Factory = require('../infra/Factory');

class ResellerService {
    constructor() {
        this.userRepo = Factory.getUserRepository();
    }

    async listResellers() {
        return await this.userRepo.findAllResellers();
    }

    async createReseller(data) {
        const exists = await this.userRepo.findByUsername(data.username);
        if (exists) throw new Error('Usuário já existe');

        const newReseller = {
            username: data.username,
            password: data.password, // Em prod, usar bcrypt aqui ou no repo
            credits: data.credits || 0,
            role: 'reseller',
            status: 'active'
        };

        return await this.userRepo.create(newReseller);
    }

    async addCredits(resellerId, amount) {
        return await this.userRepo.updateCredits(resellerId, amount);
    }

    async deleteReseller(resellerId) {
        return await this.userRepo.deleteUser(resellerId);
    }
}

module.exports = new ResellerService();
