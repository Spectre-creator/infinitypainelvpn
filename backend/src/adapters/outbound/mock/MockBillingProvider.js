
class MockBillingProvider {
    constructor() {
        console.log('💰 [MOCK] MockBillingProvider inicializado. Pagamentos fictícios.');
    }

    async generatePix(amount, description) {
        return {
            txid: `MOCK-${Date.now()}`,
            payload: '00020126580014BR.GOV.BCB.PIX...MOCK...PAYLOAD',
            expiration: 3600
        };
    }

    async checkStatus(txid) {
        // Simula aprovação automática para testes
        return { status: 'approved', paid_at: new Date() };
    }
}

module.exports = MockBillingProvider;
