/**
 * Transaction Model - MongoDB
 * 
 * Tracks all user transactions with:
 * - Credit/debit type
 * - AI auto-categorization
 * - Date filtering support
 * - Fraud flagging
 */

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    category: {
        type: String,
        enum: ['food', 'shopping', 'fuel', 'entertainment', 'recharge', 'housing', 'bills', 'salary', 'transfer', 'investment', 'medical', 'travel', 'education', 'other'],
        default: 'other'
    },
    description: {
        type: String,
        required: true,
        maxlength: 200
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    status: {
        type: String,
        enum: ['completed', 'pending', 'failed', 'flagged'],
        default: 'completed'
    },
    aiCategorized: {
        type: Boolean,
        default: false
    },
    merchantName: {
        type: String,
        default: ''
    }
});

// Compound index for efficient date + category queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
