
const config = require('../config');

// Implementações
const ClientRepositoryPostgres = require('./impl/ClientRepositoryPostgres');
const ClientRepositoryMock = require('./mock/ClientRepositoryMock');
// Importar outros repositórios aqui (Reseller, Server, etc)

class RepositoryFactory {
    
    static getClientRepository() {
        if (config.app.isMock) {
            console.log('[FACTORY] Injetando ClientRepositoryMock');
            return new ClientRepositoryMock();
        }
        return new ClientRepositoryPostgres();
    }

    // Adicionar métodos para outros repositórios
    // static getResellerRepository() { ... }
}

module.exports = RepositoryFactory;
