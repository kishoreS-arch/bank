/**
 * Cryptographic Utilities
 * 
 * RSA-2048: Asymmetric encryption for MPIN transit security
 *   - Client encrypts with public key → only server can decrypt with private key
 *   - Prevents man-in-the-middle attacks even without TLS
 * 
 * SHA-512: One-way cryptographic hash for MPIN storage
 *   - Produces 128-character hex digest
 *   - Computationally infeasible to reverse
 *   - Salt prevents rainbow table attacks
 *   - Even if database is compromised, MPINs remain safe
 */

const crypto = require('crypto');
const { getPrivateKey } = require('../config/keys');

/**
 * Decrypt RSA-encrypted data using server's private key
 * @param {string} encryptedData - Base64-encoded RSA-encrypted string from client
 * @returns {string} Decrypted plaintext (the MPIN)
 */
function rsaDecrypt(encryptedData) {
    try {
        const buffer = Buffer.from(encryptedData, 'base64');
        const decrypted = crypto.privateDecrypt(
            {
                key: getPrivateKey(),
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: 'sha256' // Use SHA-256 for OAEP padding
            },
            buffer
        );
        return decrypted.toString('utf8');
    } catch (error) {
        console.error('RSA decryption failed:', error.message);
        throw new Error('Decryption failed - invalid encrypted data');
    }
}

/**
 * Generate a random salt for MPIN hashing
 * @returns {string} 32-byte hex salt
 */
function generateSalt() {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash MPIN using SHA-512 with salt
 * SHA-512 produces a 512-bit (128 hex char) digest
 * The salt prevents rainbow table / precomputed attacks
 * 
 * @param {string} mpin - Raw MPIN digits
 * @param {string} salt - Random salt string
 * @returns {string} SHA-512 hash of salted MPIN
 */
function sha512Hash(mpin, salt) {
    return crypto
        .createHash('sha512')
        .update(salt + mpin) // Prepend salt to MPIN
        .digest('hex');
}

/**
 * Verify MPIN against stored hash
 * @param {string} inputMpin - Raw MPIN from user (after RSA decryption)
 * @param {string} storedHash - SHA-512 hash from database
 * @param {string} salt - Salt from database
 * @returns {boolean} true if MPIN matches
 */
function verifyMpin(inputMpin, storedHash, salt) {
    const inputHash = sha512Hash(inputMpin, salt);
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(inputHash, 'hex'),
        Buffer.from(storedHash, 'hex')
    );
}

module.exports = {
    rsaDecrypt,
    generateSalt,
    sha512Hash,
    verifyMpin
};
