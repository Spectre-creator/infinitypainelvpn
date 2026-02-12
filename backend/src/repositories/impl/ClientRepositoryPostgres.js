
class ClientRepositoryPostgres {
    
    constructor(dbAdapter) {
        this.db = dbAdapter;
    }

    // Mapper auxiliar DB -> Entidade
    _mapRow(row) {
        if (!row) return null;
        return {
            id: row.id.toString(),
            ownerId: row.owner_id?.toString(),
            login: row.login,
            password: row.password,
            status: row.status,
            expiryDate: row.expiry_date,
            isTest: row.is_test,
            planName: row.plan_name,
            maxConnections: row.max_connections,
            createdAt: row.created_at
        };
    }

    async findAllByOwner(ownerId) {
        const res = await this.db.query('SELECT * FROM clients WHERE owner_id = $1 ORDER BY created_at DESC', [ownerId]);
        return res.rows.map(this._mapRow);
    }

    async findByLogin(login) {
        const res = await this.db.query('SELECT * FROM clients WHERE login = $1', [login]);
        return this._mapRow(res.rows[0]);
    }

    async create(data) {
        const { ownerId, login, password, status, expiryDate, isTest, planName, maxConnections } = data;
        
        const res = await this.db.query(
            `INSERT INTO clients 
            (owner_id, login, password, status, expiry_date, is_test, plan_name, max_connections) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *`,
            [ownerId, login, password, status, expiryDate, isTest, planName, maxConnections]
        );
        
        return this._mapRow(res.rows[0]);
    }
    
    async updateExpiry(id, newDate) {
        const res = await this.db.query('UPDATE clients SET expiry_date = $1, status = \'active\' WHERE id = $2', [newDate, id]);
        return res.rowCount > 0;
    }

    async delete(id) {
        // Implementação de Hard Delete para MVP. 
        // Em produção enterprise, mudar para Soft Delete (update deleted_at)
        const res = await this.db.query('DELETE FROM clients WHERE id = $1', [id]);
        return res.rowCount > 0;
    }
}

module.exports = ClientRepositoryPostgres;
