/**
 * Reminder Routes - Bill Reminder System
 * CRUD + upcoming/overdue detection
 */

const express = require('express');
const router = express.Router();
const Reminder = require('../models/Reminder');

const DEMO_REMINDERS = [
    { _id: 'r1', title: 'Electricity Bill - TNEB', amount: 1800, dueDate: new Date(Date.now() + 2 * 86400000), status: 'pending', category: 'electricity' },
    { _id: 'r2', title: 'Credit Card - HDFC', amount: 12500, dueDate: new Date(Date.now() + 5 * 86400000), status: 'pending', category: 'credit_card' },
    { _id: 'r3', title: 'Mobile Recharge - Jio', amount: 299, dueDate: new Date(Date.now() + 8 * 86400000), status: 'pending', category: 'mobile' },
    { _id: 'r4', title: 'Netflix Subscription', amount: 649, dueDate: new Date(Date.now() + 12 * 86400000), status: 'pending', category: 'subscription' },
    { _id: 'r5', title: 'Home Loan EMI - SBI', amount: 25000, dueDate: new Date(Date.now() - 1 * 86400000), status: 'overdue', category: 'loan_emi' },
    { _id: 'r6', title: 'Internet Bill - Airtel', amount: 999, dueDate: new Date(Date.now() + 15 * 86400000), status: 'pending', category: 'internet' },
    { _id: 'r7', title: 'Water Bill', amount: 350, dueDate: new Date(Date.now() - 3 * 86400000), status: 'overdue', category: 'water' },
    { _id: 'r8', title: 'LIC Premium', amount: 5000, dueDate: new Date(Date.now() + 20 * 86400000), status: 'pending', category: 'insurance' }
];

router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || 'demo_user';
        let reminders;
        try {
            reminders = await Reminder.find({ userId }).sort({ dueDate: 1 });
            // Auto-mark overdue
            const now = new Date();
            for (let r of reminders) {
                if (r.status === 'pending' && r.dueDate < now) {
                    r.status = 'overdue'; await r.save();
                }
            }
        } catch (e) {
            reminders = DEMO_REMINDERS.map(r => ({
                ...r,
                status: r.dueDate < new Date() && r.status === 'pending' ? 'overdue' : r.status
            }));
        }
        res.json({ success: true, reminders });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { title, amount, dueDate, category, isRecurring } = req.body;
        const userId = req.body.userId || 'demo_user';
        if (!title || !amount || !dueDate) {
            return res.status(400).json({ success: false, message: 'title, amount, and dueDate required' });
        }
        try {
            const reminder = await Reminder.create({ userId, title, amount, dueDate: new Date(dueDate), category: category || 'other', isRecurring: isRecurring || false });
            res.status(201).json({ success: true, reminder });
        } catch (e) {
            res.status(201).json({ success: true, reminder: { title, amount, dueDate, category }, demo: true });
        }
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id/pay', async (req, res) => {
    try {
        try {
            const reminder = await Reminder.findByIdAndUpdate(req.params.id, { status: 'paid' }, { new: true });
            if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
            res.json({ success: true, reminder });
        } catch (e) {
            res.json({ success: true, message: 'Marked as paid', demo: true });
        }
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await Reminder.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Reminder deleted' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

// Upcoming reminders (next 3 days)
router.get('/upcoming', async (req, res) => {
    try {
        const userId = req.query.userId || 'demo_user';
        const threeDays = new Date(Date.now() + 3 * 86400000);
        let upcoming;
        try {
            upcoming = await Reminder.find({ userId, status: 'pending', dueDate: { $lte: threeDays, $gte: new Date() } }).sort({ dueDate: 1 });
        } catch (e) {
            upcoming = DEMO_REMINDERS.filter(r => r.status === 'pending' && r.dueDate <= threeDays && r.dueDate >= new Date());
        }
        res.json({ success: true, upcoming, count: upcoming.length });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
