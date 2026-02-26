/**
 * Login Attempt Schema - MongoDB
 * 
 * Logs every login attempt for:
 * - Fraud detection (unusual patterns)
 * - Security auditing
 * - Rate limiting analysis
 */

const mongoose = require('mongoose');

const loginAttemptSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        index: true
    },
    ip: {
        type: String,
        required: true
    },
    fingerprint: {
        type: String,
        default: 'unknown'
    },
    userAgent: {
        type: String,
        default: ''
    },
    success: {
        type: Boolean,
        required: true
    },
    reason: {
        type: String,
        enum: ['success', 'wrong_mpin', 'account_locked', 'fraud_detected', 'otp_failed', 'invalid_data'],
        default: 'success'
    },
    riskScore: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Auto-expire old records after 90 days to manage storage
loginAttemptSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('LoginAttempt', loginAttemptSchema);
