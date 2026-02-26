/**
 * Transaction Routes
 * 
 * CRUD + filtering + analytics for transactions.
 * Auto-categorizes via AI on creation.
 */

const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const { categorize, getCategories } = require('../utils/categorizer');

// Demo transactions for when MongoDB is not connected
const DEMO_TRANSACTIONS = [
    { _id: 'd1', amount: 850.75, type: 'debit', category: 'food', description: 'Swiggy Order', date: new Date('2025-05-20'), status: 'completed', aiCategorized: true },
    { _id: 'd2', amount: 45000, type: 'credit', category: 'salary', description: 'Salary Deposit - TCS', date: new Date('2025-05-15'), status: 'completed', aiCategorized: true },
    { _id: 'd3', amount: 1200.50, type: 'debit', category: 'shopping', description: 'Amazon Purchase', date: new Date('2025-05-12'), status: 'completed', aiCategorized: true },
    { _id: 'd4', amount: 2500, type: 'debit', category: 'fuel', description: 'HP Petrol Pump', date: new Date('2025-05-10'), status: 'completed', aiCategorized: true },
    { _id: 'd5', amount: 299, type: 'debit', category: 'recharge', description: 'Jio Recharge', date: new Date('2025-05-08'), status: 'completed', aiCategorized: true },
    { _id: 'd6', amount: 700, type: 'debit', category: 'food', description: 'Zomato Restaurant', date: new Date('2025-05-05'), status: 'completed', aiCategorized: true },
    { _id: 'd7', amount: 5000, type: 'debit', category: 'transfer', description: 'UPI Transfer to Rahul', date: new Date('2025-04-28'), status: 'completed', aiCategorized: false },
    { _id: 'd8', amount: 1500, type: 'credit', category: 'investment', description: 'Groww Returns', date: new Date('2025-04-25'), status: 'completed', aiCategorized: true },
    { _id: 'd9', amount: 1800, type: 'debit', category: 'bills', description: 'TNEB Electricity Bill', date: new Date('2025-04-22'), status: 'completed', aiCategorized: true },
    { _id: 'd10', amount: 350, type: 'debit', category: 'travel', description: 'Uber Ride', date: new Date('2025-04-18'), status: 'completed', aiCategorized: true },
    { _id: 'd11', amount: 199, type: 'debit', category: 'entertainment', description: 'Netflix Subscription', date: new Date('2025-04-15'), status: 'completed', aiCategorized: true },
    { _id: 'd12', amount: 15000, type: 'debit', category: 'housing', description: 'Apartment Rent', date: new Date('2025-04-01'), status: 'completed', aiCategorized: true },
    { _id: 'd13', amount: 10000, type: 'credit', category: 'salary', description: 'Freelance Payment', date: new Date('2025-03-20'), status: 'completed', aiCategorized: true },
    { _id: 'd14', amount: 400, type: 'debit', category: 'education', description: 'Udemy Course', date: new Date('2025-03-10'), status: 'completed', aiCategorized: true },
    { _id: 'd15', amount: 3000, type: 'debit', category: 'medical', description: 'Apollo Pharmacy', date: new Date('2025-03-05'), status: 'completed', aiCategorized: true }
];

/**
 * GET /api/transactions
 * List transactions with filters
 * Query params: type, category, startDate, endDate, search, limit, skip
 */
router.get('/', async (req, res) => {
    try {
        const { type, category, startDate, endDate, search, limit = 50, skip = 0 } = req.query;
        const userId = req.query.userId || 'demo_user';

        // Build filter
        let filter = { userId };
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (startDate || endDate) {
            filter.date = {};
            if (startDate) filter.date.$gte = new Date(startDate);
            if (endDate) filter.date.$lte = new Date(endDate);
        }
        if (search) {
            filter.description = { $regex: search, $options: 'i' };
        }

        try {
            const transactions = await Transaction.find(filter)
                .sort({ date: -1 })
                .limit(parseInt(limit))
                .skip(parseInt(skip));
            const total = await Transaction.countDocuments(filter);
            res.json({ success: true, transactions, total });
        } catch (dbErr) {
            // Fallback to demo data
            let filtered = [...DEMO_TRANSACTIONS];
            if (type) filtered = filtered.filter(t => t.type === type);
            if (category) filtered = filtered.filter(t => t.category === category);
            if (search) filtered = filtered.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
            res.json({ success: true, transactions: filtered, total: filtered.length, demo: true });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * POST /api/transactions
 * Create transaction with AI auto-categorization
 */
router.post('/', async (req, res) => {
    try {
        const { amount, type, description, date, category } = req.body;
        const userId = req.body.userId || 'demo_user';

        if (!amount || !type || !description) {
            return res.status(400).json({ success: false, message: 'Amount, type, and description required' });
        }

        // AI Auto-categorize if no category provided
        let finalCategory = category;
        let aiCategorized = false;
        if (!category || category === 'other') {
            const result = categorize(description);
            finalCategory = result.category;
            aiCategorized = result.aiCategorized;
        }

        try {
            const tx = await Transaction.create({
                userId, amount, type, category: finalCategory,
                description, date: date || new Date(),
                aiCategorized
            });

            // Update budget spending if debit
            if (type === 'debit') {
                const now = new Date();
                await Budget.findOneAndUpdate(
                    { userId, category: finalCategory, month: now.getMonth() + 1, year: now.getFullYear() },
                    { $inc: { currentSpent: amount } }
                );
            }

            res.status(201).json({ success: true, transaction: tx, aiCategory: finalCategory, aiCategorized });
        } catch (dbErr) {
            // Demo response
            res.status(201).json({
                success: true, demo: true,
                transaction: { amount, type, category: finalCategory, description, date: date || new Date() },
                aiCategory: finalCategory, aiCategorized
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/transactions/summary
 * Monthly spending analytics with category breakdown
 */
router.get('/summary', async (req, res) => {
    try {
        const userId = req.query.userId || 'demo_user';
        const months = parseInt(req.query.months) || 3;
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        let transactions;
        try {
            transactions = await Transaction.find({ userId, date: { $gte: startDate } });
        } catch (e) {
            transactions = DEMO_TRANSACTIONS;
        }

        // Calculate summary
        const categoryTotals = {};
        let totalCredit = 0, totalDebit = 0;

        transactions.forEach(tx => {
            if (tx.type === 'credit') totalCredit += tx.amount;
            else totalDebit += tx.amount;

            if (tx.type === 'debit') {
                categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + tx.amount;
            }
        });

        const categories = getCategories();
        const breakdown = Object.entries(categoryTotals)
            .map(([cat, total]) => ({
                category: cat,
                label: categories[cat]?.label || cat,
                icon: categories[cat]?.icon || '📦',
                color: categories[cat]?.color || '#64748b',
                total: Math.round(total * 100) / 100
            }))
            .sort((a, b) => b.total - a.total);

        res.json({
            success: true,
            summary: { totalCredit, totalDebit, netFlow: totalCredit - totalDebit, transactionCount: transactions.length },
            breakdown,
            categories: categories
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/transactions/categories
 * Get all available categories with metadata
 */
router.get('/categories', (req, res) => {
    res.json({ success: true, categories: getCategories() });
});

module.exports = router;
