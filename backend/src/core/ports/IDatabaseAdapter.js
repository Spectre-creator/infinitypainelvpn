
/**
 * CONTRACT: IDatabaseAdapter
 * Abstrai a execução de queries e gestão de pool de conexões.
 */
class IDatabaseAdapter {
    async query(statement, params) { throw new Error('Method not implemented'); }
    async connect() { throw new Error('Method not implemented'); }
    async close() { throw new Error('Method not implemented'); }
}

module.exports = IDatabaseAdapter;
