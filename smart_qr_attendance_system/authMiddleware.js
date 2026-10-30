const jwt = require('jsonwebtoken');
const config = require('./config');

function authenticate(req, res, next) {
    const header = req.headers['authorization'] || '';
    const [scheme, token] = header.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً.' });
    }

    try {
        req.user = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'انتهت صلاحية الجلسة. سجّل الدخول من جديد.' });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'ليست لديك صلاحية لهذا الإجراء.' });
        }
        return next();
    };
}

module.exports = { authenticate, requireRole };
