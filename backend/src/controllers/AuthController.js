
const AuthService = require('../services/AuthService');
const SecurityUtils = require('../utils/SecurityUtils');
const config = require('../config/env');

class AuthController {
    
    async login(req, res, next) {
        try {
            const { username, password } = req.body;
            const { user, accessToken, refreshToken } = await AuthService.login(username, password);

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: config.app.env === 'production',
                sameSite: 'Strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            const csrfToken = SecurityUtils.generateCsrfToken();
            res.cookie('_csrf', csrfToken, {
                httpOnly: false,
                secure: config.app.env === 'production',
                sameSite: 'Strict'
            });

            res.json({ success: true, user, accessToken, csrfToken });
        } catch (error) {
            const status = error.message === 'Credenciais inválidas' ? 401 : 500;
            res.status(status).json({ error: error.message });
        }
    }

    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (!refreshToken) return res.status(401).json({ error: 'Refresh Token Missing' });

            const { accessToken } = await AuthService.refresh(refreshToken);
            res.json({ success: true, accessToken });
        } catch (error) {
            res.status(403).json({ error: 'Invalid Refresh Token' });
        }
    }

    async logout(req, res) {
        try {
            const refreshToken = req.cookies?.refreshToken;
            if (refreshToken) {
                await AuthService.logout(refreshToken);
            }
        } catch (e) {
            console.error('Erro no logout', e);
        } finally {
            res.clearCookie('refreshToken');
            res.clearCookie('_csrf');
            res.json({ success: true });
        }
    }

    async getCsrf(req, res) {
        const csrfToken = SecurityUtils.generateCsrfToken();
        res.cookie('_csrf', csrfToken, {
            httpOnly: false,
            secure: config.app.env === 'production',
            sameSite: 'Strict'
        });
        res.json({ csrfToken });
    }
}

module.exports = new AuthController();
