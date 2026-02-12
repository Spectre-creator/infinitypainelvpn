
/**
 * CONTRACT: IUserRepository
 * Define operações de banco de dados para usuários.
 */
class IUserRepository {
    async findById(id) { throw new Error('Method not implemented'); }
    async findByUsername(username) { throw new Error('Method not implemented'); }
    async create(user) { throw new Error('Method not implemented'); }
    async updateCredits(userId, credits) { throw new Error('Method not implemented'); }
}

module.exports = IUserRepository;
