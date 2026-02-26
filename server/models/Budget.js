/**
 * Budget Model - MongoDB
 * 
 * Smart budget manager with alert thresholds:
 * - >80% spent = warning
 * - >100% spent = danger alert
 */

const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    category: {
        type: String,
        enum: ['food', 'shopping', 'fuel', 'entertainment', 'recharge', 'housing', 'bills', 'travel', 'medical', 'education', 'other'],
        required: true
    },
    monthlyLimit: {
        type: Number,
        required: true,
        min: 100
    },
    currentSpent: {
        type: Number,
        default: 0,
        min: 0
    },
    month: {
        type: Number,
        required: true, // 1-12
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    }
});

// One budget per category per month per user
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

/**
 * Get alert status based on spending percentage
 */
budgetSchema.methods.getAlertStatus = function () {
    const pct = (this.currentSpent / this.monthlyLimit) * 100;
    if (pct >= 100) return { level: 'danger', message: `Budget exceeded! ₹${(this.currentSpent - this.monthlyLimit).toFixed(0)} over limit`, percentage: pct };
    if (pct >= 80) return { level: 'warning', message: `${pct.toFixed(0)}% of budget used`, percentage: pct };
    return { level: 'safe', message: `${pct.toFixed(0)}% used`, percentage: pct };
};

module.exports = mongoose.model('Budget', budgetSchema);
