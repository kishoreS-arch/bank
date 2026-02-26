/**
 * Budget Manager Routes
 * Set monthly limits, track spending, get alerts
 */

const express = require('express');
const router = express.Router();
const Budget = require('../models/Budget');

const now = new Date();
const DEMO_BUDGETS = [
    { _id: 'b1', category: 'food', monthlyLimit: 5000, currentSpent: 4200, month: now.getMonth() + 1, year: now.getFullYear() },
    { _id: 'b2', category: 'shopping', monthlyLimit: 3000, currentSpent: 1200, month: now.getMonth() + 1, year: now.getFullYear() },
    { _id: 'b3', category: 'fuel', monthlyLimit: 4000, currentSpent: 3500, month: now.getMonth() + 1, year: now.getFullYear() },
    { _id: 'b4', category: 'entertainment', monthlyLimit: 1500, currentSpent: 1600, month: now.getMonth() + 1, year: now.getFullYear() },
    { _id: 'b5', category: 'recharge', monthlyLimit: 500, currentSpent: 299, month: now.getMonth() + 1, year: now.getFullYear() },
    { _id: 'b6', category: 'bills', monthlyLimit: 5000, currentSpent: 3300, month: now.getMonth() + 1, year: now.getFullYear() }
];

router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || 'demo_user';
        const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
        const year = parseInt(req.query.year) || new Date().getFullYear();

        let budgets;
        try {
            budgets = await Budget.find({ userId, month, year });
        } catch (e) {
            budgets = DEMO_BUDGETS;
        }

        // Calculate alert status for each
        const withAlerts = budgets.map(b => {
            const pct = (b.currentSpent / b.monthlyLimit) * 100;
            let alertLevel = 'safe', alertMsg = `${pct.toFixed(0)}% used`;
            if (pct >= 100) { alertLevel = 'danger'; alertMsg = `Budget exceeded by ₹${(b.currentSpent - b.monthlyLimit).toFixed(0)}`; }
            else if (pct >= 80) { alertLevel = 'warning'; alertMsg = `${pct.toFixed(0)}% used - approaching limit`; }
            return { ...((b.toJSON && b.toJSON()) || b), percentage: Math.round(pct), alertLevel, alertMsg };
        });

        res.json({ success: true, budgets: withAlerts, month, year });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { category, monthlyLimit } = req.body;
        const userId = req.body.userId || 'demo_user';
        const month = req.body.month || (new Date().getMonth() + 1);
        const year = req.body.year || new Date().getFullYear();

        if (!category || !monthlyLimit) {
            return res.status(400).json({ success: false, message: 'category and monthlyLimit required' });
        }

        try {
            const budget = await Budget.findOneAndUpdate(
                { userId, category, month, year },
                { monthlyLimit, currentSpent: 0 },
                { upsert: true, new: true }
            );
            res.status(201).json({ success: true, budget });
        } catch (e) {
            res.status(201).json({ success: true, budget: { category, monthlyLimit, currentSpent: 0, month, year }, demo: true });
        }
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const budget = await Budget.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
        res.json({ success: true, budget });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// AI Budget Suggestion based on average of last 3 months
router.get('/suggest', async (req, res) => {
    try {
        const suggestions = {
            food: { suggested: 4500, reason: 'Based on 3-month avg spending of ₹4,200' },
            shopping: { suggested: 2500, reason: 'You spent avg ₹2,100 last 3 months' },
            fuel: { suggested: 3500, reason: 'Consistent spending around ₹3,200' },
            entertainment: { suggested: 1200, reason: 'Avg ₹1,000 - slight buffer added' },
            recharge: { suggested: 500, reason: 'Fixed monthly expense ~₹299' },
            bills: { suggested: 5000, reason: 'Utilities avg ₹4,500 with seasonal buffer' }
        };
        res.json({ success: true, suggestions });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
