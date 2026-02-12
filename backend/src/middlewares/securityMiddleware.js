
const SecurityUtils = require('../utils/SecurityUtils');

// Memória volátil para Rate Limit (Em prod usar Redis)
const rateLimitStore = new Map();

const rateLimiter = (windowMs, maxRequests) => {
    return (req, res, next) => {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const now = Date.now();

        if (!rateLimitStore.has(ip)) {
            rateLimitStore.set(ip, { count: 1, startTime: now });
            return next();
        }

        const data = rateLimitStore.get(ip);
        
        if (now - data.startTime > windowMs) {
            // Reset window
            data.count = 1;
            data.startTime = now;
            return next();
        }

        if (data.count >= maxRequests) {
            console.warn(`🛡️ [SECURITY] Rate Limit Triggered for IP: ${ip}`);
            return res.status(429).json({ error: 'Muitas requisições. Tente novamente mais tarde.' });
        }

        data.count++;
        next();
    };
};

const csrfProtection = (req, res, next) => {
    // Ignorar métodos seguros e rotas públicas
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    if (req.path === '/api/login' || req.path === '/api/csrf-token') return next();

    const token = req.headers['x-csrf-token'];
    const cookieToken = getCookie(req, '_csrf');

    if (!token || !cookieToken || token !== cookieToken) {
        console.warn('🛡️ [SECURITY] CSRF Attack Blocked');
        return res.status(403).json({ error: 'CSRF Token Mismatch' });
    }
    next();
};

// Helper simples para ler cookie
function getCookie(req, name) {
    const rawCookies = req.headers.cookie;
    if (!rawCookies) return null;
    const match = rawCookies.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

module.exports = {
    apiLimiter: rateLimiter(15 * 60 * 1000, 100), // 100 reqs por 15min
    loginLimiter: rateLimiter(60 * 1000, 5), // 5 tentativas por minuto
    csrfProtection
};
