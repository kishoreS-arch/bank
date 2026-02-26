/**
 * SmartBank Express Server
 * 
 * Production-level backend for the secure authentication system.
 * Features:
 * - CORS for frontend communication
 * - Helmet for security headers
 * - Rate limiting
 * - MongoDB connection
 * - Cookie-based JWT sessions
 * - Static file serving for the frontend
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smartbank';

// ============================================
// MIDDLEWARE SETUP
// ============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for dev (Tailwind CDN)
    crossOriginEmbedderPolicy: false
}));

// CORS - allow frontend origin
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Parse JSON bodies (limit 1MB to prevent payload attacks)
app.use(express.json({ limit: '1mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies for JWT session
app.use(cookieParser());

// Serve static files from the parent 'bank' directory
app.use(express.static(path.join(__dirname, '..')));

// ============================================
// API ROUTES
// ============================================

const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const assetRoutes = require('./routes/assets');
const ratesRoutes = require('./routes/rates');
const budgetRoutes = require('./routes/budget');
const reminderRoutes = require('./routes/reminders');
const { generalLimiter } = require('./middleware/rateLimiter');

// Apply general rate limiting to all API calls
app.use('/api', generalLimiter);

// Register all routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        server: 'SmartBank API',
        timestamp: new Date().toISOString(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// ============================================
// SERVE FRONTEND
// ============================================

// Serve login page as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'login.html'));
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

async function startServer() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            // Modern Mongoose doesn't need these options but keeping for safety
        });
        console.log('✅ Connected to MongoDB');

        // Start Express server
        app.listen(PORT, () => {
            console.log(`\n🏦 SmartBank Server running at http://localhost:${PORT}`);
            console.log(`📱 Login page: http://localhost:${PORT}/login.html`);
            console.log(`🏠 Home page:  http://localhost:${PORT}/home.html`);
            console.log(`🔑 API:        http://localhost:${PORT}/api/health`);
            console.log(`\n🔐 Security: RSA-2048 + SHA-512 + JWT + Rate Limiting + Fraud Detection`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        console.log('\n💡 Make sure MongoDB is running:');
        console.log('   - Windows: net start MongoDB');
        console.log('   - macOS/Linux: sudo systemctl start mongod');
        console.log('   - Or use MongoDB Atlas (set MONGODB_URI env variable)\n');

        // Still start server even without MongoDB (for demo mode)
        app.listen(PORT, () => {
            console.log(`\n🏦 SmartBank Server running in DEMO MODE at http://localhost:${PORT}`);
            console.log(`⚠️  Database not connected - only demo features available\n`);
        });
    }
}

startServer();
