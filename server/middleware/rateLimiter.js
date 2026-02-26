/**
 * Rate Limiter Middleware
 * 
 * Prevents brute force attacks by limiting request frequency.
 * - Auth endpoints: 10 requests per minute per IP
 * - General endpoints: 100 requests per minute per IP
 */

const rateLimit = require('express-rate-limit');

// Strict rate limiter for authentication endpoints
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 10, // Max 10 requests per window
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 1 minute.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Use IP + phone as key when available
    keyGenerator: (req) => {
        return req.body?.phone
            ? `${req.ip}_${req.body.phone}`
            : req.ip;
    }
});

// General rate limiter for all API endpoints
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: 'Too many requests. Please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = { authLimiter, generalLimiter };
