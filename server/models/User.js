/**
 * User Schema - MongoDB
 * 
 * Stores user credentials securely:
 * - phone: unique identifier (like GPay uses phone number)
 * - mpinHash: SHA-512 hash of MPIN (raw MPIN is NEVER stored)
 * - mpinSalt: random salt used in hashing
 * - devices: array of trusted device fingerprints
 * - failedAttempts: tracks failed MPIN entries
 * - lockedUntil: account lock timestamp (after 5 failures)
 */

const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
    fingerprint: { type: String, required: true },
    userAgent: { type: String },
    lastUsed: { type: Date, default: Date.now },
    trusted: { type: Boolean, default: false }
}, { _id: false });

const userSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true,
        unique: true,
        match: [/^\d{10,15}$/, 'Invalid phone number format'],
        index: true
    },
    name: {
        type: String,
        default: 'SmartBank User'
    },
    mpinHash: {
        type: String,
        required: true,
        minlength: 128, // SHA-512 produces 128 hex chars
        maxlength: 128
    },
    mpinSalt: {
        type: String,
        required: true
    },
    devices: [deviceSchema],
    failedAttempts: {
        type: Number,
        default: 0,
        max: 5
    },
    lockedUntil: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    }
});

/**
 * Check if account is currently locked
 */
userSchema.methods.isLocked = function () {
    if (!this.lockedUntil) return false;
    return new Date() < this.lockedUntil;
};

/**
 * Increment failed attempts and lock if threshold reached
 */
userSchema.methods.incrementFailedAttempts = async function () {
    this.failedAttempts += 1;
    if (this.failedAttempts >= 5) {
        // Lock account for 30 minutes after 5 failed attempts
        this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        this.failedAttempts = 0;
    }
    await this.save();
};

/**
 * Reset failed attempts on successful login
 */
userSchema.methods.resetFailedAttempts = async function () {
    this.failedAttempts = 0;
    this.lockedUntil = null;
    this.lastLogin = new Date();
    await this.save();
};

// Prevent returning sensitive fields in JSON responses
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.mpinHash;
    delete user.mpinSalt;
    delete user.__v;
    return user;
};

module.exports = mongoose.model('User', userSchema);
