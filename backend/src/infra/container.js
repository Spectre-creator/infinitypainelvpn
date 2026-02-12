
const settings = require('../config/settings');
const MockVpnProvider = require('../adapters/outbound/mock/MockVpnProvider');
const MockUserRepository = require('../adapters/outbound/mock/MockUserRepository');

class Container {
    constructor() {
        this.deps = {};
    }

    init() {
        if (settings.app.mockMode) {
            this.deps.vpnProvider = new MockVpnProvider();
            this.deps.userRepository = new MockUserRepository();
            // Adicionar BillingProvider aqui
        } else {
            throw new Error('Produção proibida pelo arquiteto.');
        }
        return this.deps;
    }
}

module.exports = new Container();
