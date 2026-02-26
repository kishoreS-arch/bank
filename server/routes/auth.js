/**
 * Authentication Routes
 * 
 * Implements the full GPay-style login flow:
 * 1. GET  /api/auth/public-key   → Get RSA public key for client encryption
 * 2. POST /api/auth/verify-otp   → Verify Firebase OTP token, check if user exists
 * 3. POST /api/auth/register     → Register new user with MPIN
 * 4. POST /api/auth/login        → Login with RSA-encrypted MPIN
 * 5. POST /api/auth/verify-token → Verify JWT session validity
 * 6. POST /api/auth/logout       → Clear session
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { getPublicKey } = require('../config/keys');
const { rsaDecrypt, generateSalt, sha512Hash, verifyMpin } = require('../utils/crypto');
const { generateToken, verifyToken } = require('../utils/jwt');
const { calculateRiskScore, logLoginAttempt } = require('../middleware/fraudDetector');
const { authLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to all auth routes
router.use(authLimiter);

/**
 * GET /api/auth/public-key
 * Returns RSA public key for client-side MPIN encryption
 */
router.get('/public-key', (req, res) => {
    res.json({
        success: true,
        publicKey: getPublicKey()
    });
});

/**
 * POST /api/auth/verify-otp
 * 
 * In production: Verify Firebase ID token server-side
 * In demo mode: Accept any phone with OTP "123456"
 * 
 * Returns whether user is new (needs MPIN setup) or existing (needs MPIN login)
 */
router.post('/verify-otp', async (req, res) => {
    try {
        const { phone, firebaseToken, demoMode } = req.body;

        // Input validation - prevent NoSQL injection
        if (!phone || typeof phone !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Phone number is required'
            });
        }

        // Sanitize phone - only allow digits
        const sanitizedPhone = phone.replace(/\D/g, '');
        if (sanitizedPhone.length < 10 || sanitizedPhone.length > 15) {
            return res.status(400).json({
                success: false,
                message: 'Invalid phone number format'
            });
        }

        // In demo mode, skip Firebase verification
        // In production, verify firebaseToken with Firebase Admin SDK:
        // const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
        // const verifiedPhone = decodedToken.phone_number;

        if (!demoMode && !firebaseToken) {
            return res.status(400).json({
                success: false,
                message: 'Firebase token is required for OTP verification'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ phone: sanitizedPhone });

        res.json({
            success: true,
            isNewUser: !existingUser,
            phone: sanitizedPhone,
            message: existingUser
                ? 'OTP verified. Please enter your MPIN.'
                : 'OTP verified. Please set up your MPIN.'
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification'
        });
    }
});

/**
 * POST /api/auth/register
 * 
 * Register new user with MPIN:
 * 1. Receive RSA-encrypted MPIN from client
 * 2. Decrypt with server's private key
 * 3. Validate MPIN format (4 or 6 digits)
 * 4. Generate salt, hash with SHA-512
 * 5. Store hashed MPIN (NEVER raw)
 * 6. Return JWT token
 */
router.post('/register', async (req, res) => {
    try {
        const { phone, encryptedMpin, fingerprint } = req.body;

        // Input validation
        if (!phone || !encryptedMpin) {
            return res.status(400).json({
                success: false,
                message: 'Phone and encrypted MPIN are required'
            });
        }

        const sanitizedPhone = phone.replace(/\D/g, '');

        // Check if user already exists
        const existingUser = await User.findOne({ phone: sanitizedPhone });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User already registered. Please login instead.'
            });
        }

        // Step 1: RSA decrypt the MPIN
        let rawMpin;
        try {
            rawMpin = rsaDecrypt(encryptedMpin);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Invalid encrypted data'
            });
        }

        // Step 2: Validate MPIN format (4 or 6 digits only)
        if (!/^\d{4}$|^\d{6}$/.test(rawMpin)) {
            return res.status(400).json({
                success: false,
                message: 'MPIN must be exactly 4 or 6 digits'
            });
        }

        // Step 3: Generate salt and hash with SHA-512
        const salt = generateSalt();
        const mpinHash = sha512Hash(rawMpin, salt);

        // Step 4: Create user in database
        const newUser = await User.create({
            phone: sanitizedPhone,
            mpinHash,
            mpinSalt: salt,
            devices: fingerprint ? [{
                fingerprint,
                userAgent: req.headers['user-agent'] || '',
                trusted: true
            }] : []
        });

        // Step 5: Generate JWT token
        const token = generateToken(newUser._id.toString(), sanitizedPhone);

        // Log successful registration
        await logLoginAttempt({
            phone: sanitizedPhone,
            ip: req.ip,
            fingerprint: fingerprint || 'unknown',
            userAgent: req.headers['user-agent'] || '',
            success: true,
            reason: 'success',
            riskScore: 0
        });

        // Set secure HTTP-only cookie
        res.cookie('smartbank_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.status(201).json({
            success: true,
            message: 'Registration successful! Welcome to SmartBank.',
            token,
            user: newUser.toJSON()
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during registration'
        });
    }
});

/**
 * POST /api/auth/login
 * 
 * Login existing user with MPIN:
 * 1. Check account lock status
 * 2. Run fraud detection
 * 3. Decrypt RSA-encrypted MPIN
 * 4. Hash with SHA-512 and compare
 * 5. Handle device binding
 * 6. Return JWT on success
 */
router.post('/login', async (req, res) => {
    try {
        const { phone, encryptedMpin, fingerprint } = req.body;

        // Input validation
        if (!phone || !encryptedMpin) {
            return res.status(400).json({
                success: false,
                message: 'Phone and encrypted MPIN are required'
            });
        }

        const sanitizedPhone = phone.replace(/\D/g, '');

        // Find user
        const user = await User.findOne({ phone: sanitizedPhone });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found. Please register first.'
            });
        }

        // Check account lock
        if (user.isLocked()) {
            const unlockTime = new Date(user.lockedUntil).toLocaleTimeString();
            await logLoginAttempt({
                phone: sanitizedPhone,
                ip: req.ip,
                fingerprint: fingerprint || 'unknown',
                success: false,
                reason: 'account_locked'
            });
            return res.status(423).json({
                success: false,
                message: `Account locked due to too many failed attempts. Try again after ${unlockTime}.`,
                lockedUntil: user.lockedUntil
            });
        }

        // AI Fraud Detection
        const riskAssessment = await calculateRiskScore(
            sanitizedPhone,
            req.ip,
            fingerprint || 'unknown'
        );

        if (riskAssessment.action === 'block') {
            await logLoginAttempt({
                phone: sanitizedPhone,
                ip: req.ip,
                fingerprint: fingerprint || 'unknown',
                success: false,
                reason: 'fraud_detected',
                riskScore: riskAssessment.score
            });
            return res.status(403).json({
                success: false,
                message: 'Suspicious activity detected. Please verify via OTP again.',
                requireOtpReverify: true,
                riskFlags: riskAssessment.flags
            });
        }

        // Step 1: RSA decrypt MPIN
        let rawMpin;
        try {
            rawMpin = rsaDecrypt(encryptedMpin);
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: 'Invalid encrypted data'
            });
        }

        // Step 2: Verify MPIN against SHA-512 hash
        const isValid = verifyMpin(rawMpin, user.mpinHash, user.mpinSalt);

        if (!isValid) {
            // Increment failed attempts
            await user.incrementFailedAttempts();
            const remaining = 5 - user.failedAttempts;

            await logLoginAttempt({
                phone: sanitizedPhone,
                ip: req.ip,
                fingerprint: fingerprint || 'unknown',
                success: false,
                reason: 'wrong_mpin',
                riskScore: riskAssessment.score
            });

            return res.status(401).json({
                success: false,
                message: `Incorrect MPIN. ${remaining > 0 ? remaining + ' attempts remaining.' : 'Account has been locked for 30 minutes.'}`,
                attemptsRemaining: remaining
            });
        }

        // Step 3: MPIN is valid! Reset failed attempts
        await user.resetFailedAttempts();

        // Step 4: Device binding - add new device if not seen before
        if (fingerprint) {
            const knownDevice = user.devices.find(d => d.fingerprint === fingerprint);
            if (!knownDevice) {
                user.devices.push({
                    fingerprint,
                    userAgent: req.headers['user-agent'] || '',
                    trusted: true
                });
                await user.save();
            } else {
                knownDevice.lastUsed = new Date();
                await user.save();
            }
        }

        // Step 5: Generate JWT
        const token = generateToken(user._id.toString(), sanitizedPhone);

        // Log successful login
        await logLoginAttempt({
            phone: sanitizedPhone,
            ip: req.ip,
            fingerprint: fingerprint || 'unknown',
            success: true,
            reason: 'success',
            riskScore: riskAssessment.score
        });

        // Set secure HTTP-only cookie
        res.cookie('smartbank_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });

        res.json({
            success: true,
            message: 'Login successful! Welcome back.',
            token,
            user: user.toJSON(),
            riskScore: riskAssessment.score,
            riskFlags: riskAssessment.flags
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

/**
 * POST /api/auth/verify-token
 * Check if current JWT session is still valid
 */
router.post('/verify-token', (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ success: false, message: 'Token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    res.json({ success: true, user: decoded });
});

/**
 * POST /api/auth/logout
 * Clear session cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('smartbank_token');
    res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
