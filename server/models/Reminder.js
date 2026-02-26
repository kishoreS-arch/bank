/**
 * Reminder Model - MongoDB
 * 
 * Bill reminder system with:
 * - Due date tracking
 * - Auto-overdue detection
 * - 3-day advance warning
 */

const mongoose = require('mongoose');

const reminderSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    dueDate: {
        type: Date,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'overdue'],
        default: 'pending'
    },
    category: {
        type: String,
        enum: ['electricity', 'credit_card', 'mobile', 'subscription', 'insurance', 'loan_emi', 'water', 'gas', 'internet', 'other'],
        default: 'other'
    },
    isRecurring: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Reminder', reminderSchema);
