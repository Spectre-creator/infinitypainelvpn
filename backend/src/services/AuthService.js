
const Factory = require('../infra/Factory');
const SecurityUtils = require('../utils/SecurityUtils');
const { auditLogger } = require('../utils/Logger');

class AuthService {
    constructor() {
        this.userRepo = Factory.getUserRepository();
        this.sessionStore = Factory.getSessionStore();
    }

    async login(username, password) {
        const user = await this.userRepo.findByUsername(username);
        
        if (!user) {
            await SecurityUtils.hashPassword('dummy');
            auditLogger.warn({ event: 'login_failed', username, reason: 'user_not_found' }, 'Tentativa de login falhou');
            throw new Error('Credenciais inválidas');
        }

        const isValid = await SecurityUtils.comparePassword(password, user.password_hash);
        if (!isValid) {
            auditLogger.warn({ event: 'login_failed', username, userId: user.id, reason: 'bad_password' }, 'Senha incorreta');
            throw new Error('Credenciais inválidas');
        }

        // Tokens
        const accessToken = SecurityUtils.generateToken({ id: user.id, role: user.role }, '15m');
        const refreshToken = SecurityUtils.generateToken({ id: user.id, type: 'refresh' }, '7d');

        await this.sessionStore.set(
            `refresh:${refreshToken}`, 
            { userId: user.id, valid: true }, 
            7 * 24 * 60 * 60 
        );

        auditLogger.info({ event: 'login_success', userId: user.id, role: user.role }, 'Usuário autenticado');

        const { password_hash, ...safeUser } = user;
        return { user: safeUser, accessToken, refreshToken };
    }

    async refresh(refreshToken) {
        let payload;
        try {
            payload = SecurityUtils.verifyToken(refreshToken);
        } catch (e) {
            throw new Error('Sessão expirada (Token Inválido)');
        }

        if (payload.type !== 'refresh') throw new Error('Invalid Token Type');

        const session = await this.sessionStore.get(`refresh:${refreshToken}`);
        if (!session || !session.valid) {
            auditLogger.warn({ event: 'refresh_denied', tokenExcerpt: refreshToken.substring(0, 10) }, 'Tentativa de uso de token revogado');
            throw new Error('Sessão revogada ou não encontrada');
        }

        const user = await this.userRepo.findById(payload.id);
        if (!user) throw new Error('User not found');

        const newAccessToken = SecurityUtils.generateToken({ id: user.id, role: user.role }, '15m');
        
        return { accessToken: newAccessToken };
    }

    async logout(refreshToken) {
        if (refreshToken) {
            await this.sessionStore.del(`refresh:${refreshToken}`);
            auditLogger.info({ event: 'logout', tokenExcerpt: refreshToken.substring(0, 10) }, 'Sessão encerrada');
        }
    }
}

module.exports = new AuthService();
