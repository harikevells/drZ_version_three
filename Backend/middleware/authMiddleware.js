const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET || 'supersecret123', (err, user) => {
        if (err) {
            console.error('JWT Verification failed:', err.message);
            return res.status(403).json({ error: 'Token expired or invalid: ' + err.message });
        }
        req.user = user;
        next();
    });
};

module.exports = authenticateToken;
