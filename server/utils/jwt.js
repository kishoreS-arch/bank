/**
 * JWT Token Management
 * 
 * JWT (JSON Web Token) provides stateless authentication:
 * - Server generates a signed token on successful login
 * - Client stores token and sends with each request
 * - Server verifies signature without database lookup
 * - 15-minute expiry limits exposure window if token is stolen
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/keys');

/**
 * Generate JWT token for authenticated user
 * @param {string} userId - MongoDB user ID
 * @param {string} phone - User's phone number
 * @returns {string} Signed JWT token
 */
function generateToken(userId, phone) {
    return jwt.sign(
        {
            userId,
            phone,
            iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        {
            expiresIn: '15m', // Token expires in 15 minutes
            issuer: 'SmartBank',
            audience: 'smartbank-app'
        }
    );
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token string
 * @returns {object|null} Decoded payload or null if invalid
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET, {
            issuer: 'SmartBank',
            audience: 'smartbank-app'
        });
    } catch (error) {
        return null;
    }
}

module.exports = { generateToken, verifyToken };
