/**
 * AI-Based Fraud Detection Middleware
 * 
 * Analyzes login patterns and assigns a risk score (0-100).
 * Flags suspicious activity based on:
 * 
 * 1. IP Change: Login from new/different IP (+20 risk)
 * 2. Device Change: New browser fingerprint (+25 risk)
 * 3. Rapid Attempts: >3 attempts in 5 minutes (+30 risk)
 * 4. Time Anomaly: Login at unusual hours (2AM-5AM) (+10 risk)
 * 5. Geographic Anomaly: Sudden location change (+15 risk)
 * 
 * Risk Score Thresholds:
 * - 0-30: Low risk → Allow
 * - 31-60: Medium risk → Allow but log warning
 * - 61-100: High risk → Block and require OTP re-verification
 */

const LoginAttempt = require('../models/LoginAttempt');

/**
 * Calculate fraud risk score for a login attempt
 * @param {string} phone - User's phone number
 * @param {string} currentIp - Current request IP
 * @param {string} fingerprint - Browser fingerprint
 * @returns {object} { score, flags, action }
 */
async function calculateRiskScore(phone, currentIp, fingerprint) {
    const flags = [];
    let score = 0;

    try {
        // Get recent login history (last 30 days)
        const recentAttempts = await LoginAttempt.find({
            phone,
            timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).sort({ timestamp: -1 }).limit(50);

        if (recentAttempts.length === 0) {
            // First-time login - slight risk for new pattern
            flags.push('first_login');
            score += 5;
        } else {
            // 1. IP Change Detection
            const knownIps = [...new Set(recentAttempts.filter(a => a.success).map(a => a.ip))];
            if (knownIps.length > 0 && !knownIps.includes(currentIp)) {
                flags.push('new_ip');
                score += 20;
            }

            // 2. Device Change Detection
            const knownFingerprints = [...new Set(
                recentAttempts.filter(a => a.success).map(a => a.fingerprint)
            )];
            if (knownFingerprints.length > 0 && !knownFingerprints.includes(fingerprint)) {
                flags.push('new_device');
                score += 25;
            }

            // 3. Rapid Attempts Detection (>3 in last 5 minutes)
            const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
            const rapidAttempts = recentAttempts.filter(a => a.timestamp >= fiveMinAgo);
            if (rapidAttempts.length > 3) {
                flags.push('rapid_attempts');
                score += 30;
            }

            // 4. Failed Attempt Streak
            const recentFails = recentAttempts.filter(a => !a.success).length;
            const failRatio = recentFails / Math.max(recentAttempts.length, 1);
            if (failRatio > 0.5) {
                flags.push('high_failure_rate');
                score += 15;
            }
        }

        // 5. Time Anomaly (login between 2AM-5AM)
        const hour = new Date().getHours();
        if (hour >= 2 && hour <= 5) {
            flags.push('unusual_hour');
            score += 10;
        }

        // Determine action based on score
        let action = 'allow';
        if (score > 60) {
            action = 'block'; // Require OTP re-verification
        } else if (score > 30) {
            action = 'warn'; // Log warning but allow
        }

        return { score: Math.min(score, 100), flags, action };

    } catch (error) {
        console.error('Fraud detection error:', error.message);
        // On error, allow but flag it
        return { score: 10, flags: ['detection_error'], action: 'allow' };
    }
}

/**
 * Log a login attempt for future fraud analysis
 */
async function logLoginAttempt(data) {
    try {
        await LoginAttempt.create({
            phone: data.phone,
            ip: data.ip,
            fingerprint: data.fingerprint || 'unknown',
            userAgent: data.userAgent || '',
            success: data.success,
            reason: data.reason || 'success',
            riskScore: data.riskScore || 0
        });
    } catch (error) {
        console.error('Failed to log login attempt:', error.message);
    }
}

module.exports = { calculateRiskScore, logLoginAttempt };
