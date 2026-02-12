
// [DEPRECATED] - MIGRATED TO src/repositories
// Arquivo mantido apenas para evitar crash caso algo legado o importe.
module.exports = {
    query: async () => { throw new Error('LEGACY DATABASE.JS ACCESSED. USE REPOSITORIES.'); },
    connect: async () => { throw new Error('LEGACY DATABASE.JS ACCESSED. USE REPOSITORIES.'); }
};
