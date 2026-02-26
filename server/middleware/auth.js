/**
 * JWT Authentication Middleware
 * 
 * Protects routes by verifying the JWT token.
 * Token can be sent via:
 * - Authorization header: Bearer <token>
 * - HTTP-only cookie: smartbank_token
 */

const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
    // Check Authorization header first, then cookie
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.smartbank_token) {
        token = req.cookies.smartbank_token;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please login.'
        });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token. Please login again.'
        });
    }

    // Attach user info to request for downstream use
    req.user = decoded;
    next();
}

module.exports = authMiddleware;
