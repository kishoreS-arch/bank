/**
 * Asset Model - MongoDB
 * 
 * Tracks user's asset portfolio:
 * Bank balance, cash, gold, silver, property, crypto
 */

const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    assetType: {
        type: String,
        enum: ['bank', 'cash', 'gold', 'silver', 'property', 'crypto', 'stocks', 'fd', 'mutual_fund'],
        required: true
    },
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    quantity: {
        type: Number,
        default: 1,
        min: 0
    },
    unit: {
        type: String,
        default: 'units' // grams for gold/silver, units for crypto, sqft for property
    },
    currentValue: {
        type: Number,
        required: true,
        min: 0
    },
    purchaseValue: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Asset', assetSchema);
