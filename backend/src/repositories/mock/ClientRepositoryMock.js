class ClientRepositoryMock {
    constructor() {
        this.clients = []; // In-memory storage
        console.log('🛡️ [COMPLIANCE] ClientRepositoryMock: Soft Delete Ativo (Auditoria Fiscal Habilitada)');
    }

    async findAllByOwner(ownerId) {
        // FILTER: Apenas clientes NÃO deletados aparecem na lista operacional
        // Em auditoria fiscal, removeríamos esse filtro para ver o histórico.
        return this.clients.filter(c => c.ownerId === ownerId && !c.deletedAt);
    }

    async findById(id) {
        return this.clients.find(c => c.id === id && !c.deletedAt);
    }

    async findByLogin(login) {
        // Permite encontrar mesmo deletado para evitar reuso de login (segurança)
        return this.clients.find(c => c.login === login);
    }

    async create(clientData) {
        const newClient = { 
            ...clientData, 
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            deletedAt: null // Campo de controle de exclusão lógica
        };
        this.clients.push(newClient);
        return newClient;
    }
    
    async updateExpiry(id, newDate) {
        const idx = this.clients.findIndex(c => c.id === id);
        if (idx !== -1 && !this.clients[idx].deletedAt) {
            this.clients[idx].expiryDate = newDate;
            return true;
        }
        return false;
    }

    async delete(id) {
        /*
         TODO: PRODUCTION (PostgreSQL) - SOFT DELETE & ANONYMIZATION
         -----------------------------------------------------------
         1. Não usar DELETE FROM. Usar UPDATE:
            UPDATE clients SET 
                deleted_at = NOW(), 
                status = 'deleted',
                login = 'anon_' || id, -- Anonimização PII (LGPD - Direito ao Esquecimento)
                password = NULL        -- Remoção de credencial para impedir acesso
            WHERE id = $1;
         
         2. Garantir que Logs de Acesso (radius/activity) sejam mantidos por 5 anos (Marco Civil),
            mas desvinculados do nome real se solicitado exclusão de dados pessoais.
        */

        const idx = this.clients.findIndex(c => c.id === id);
        if (idx !== -1) {
            // SOFT DELETE: Marca timestamp, não remove do array
            this.clients[idx].deletedAt = new Date().toISOString();
            this.clients[idx].status = 'deleted'; // Atualiza status visual para relatórios históricos
            
            // LGPD: Anonimização simples para o Mock (Simulando "Direito ao Esquecimento")
            // Mantemos o ID para integridade referencial com transações financeiras (Audit Trail)
            this.clients[idx].originalLogin = this.clients[idx].login; // Audit trail interno (Somente Admin)
            this.clients[idx].login = `deleted_${id.substr(0,5)}`; 
            this.clients[idx].password = '******'; 
            
            return true;
        }
        return false;
    }
}

module.exports = ClientRepositoryMock;