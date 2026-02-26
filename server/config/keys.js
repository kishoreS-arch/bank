/**
 * RSA Key Pair Generation & JWT Secret
 * 
 * SECURITY: RSA-2048 provides asymmetric encryption.
 * - Public key: sent to client to encrypt MPIN before transmission
 * - Private key: kept on server to decrypt MPIN
 * - Even if traffic is intercepted, MPIN cannot be read without private key
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, '..', '.keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'public.pem');

// JWT secret - in production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'smartbank_jwt_secret_' + crypto.randomBytes(16).toString('hex');

let privateKey, publicKey;

/**
 * Generate RSA 2048-bit key pair and save to disk
 * Only generates once; reuses cached keys on subsequent runs
 */
function generateKeyPair() {
    // Create .keys directory if it doesn't exist
    if (!fs.existsSync(KEYS_DIR)) {
        fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    // Check if keys already exist
    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
        privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
        publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
        console.log('🔑 RSA keys loaded from cache');
        return;
    }

    // Generate fresh 2048-bit RSA key pair
    const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem'
        }
    });

    privateKey = keyPair.privateKey;
    publicKey = keyPair.publicKey;

    // Save to disk for persistence across restarts
    fs.writeFileSync(PRIVATE_KEY_PATH, privateKey);
    fs.writeFileSync(PUBLIC_KEY_PATH, publicKey);
    console.log('🔑 New RSA-2048 key pair generated and saved');
}

// Generate keys on module load
generateKeyPair();

module.exports = {
    getPrivateKey: () => privateKey,
    getPublicKey: () => publicKey,
    JWT_SECRET
};
