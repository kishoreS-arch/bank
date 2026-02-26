/**
 * Asset Routes - Portfolio Management
 * CRUD operations + net worth calculation
 */

const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');

const DEMO_ASSETS = [
    { _id: 'a1', assetType: 'bank', name: 'SBI Savings', quantity: 1, unit: 'account', currentValue: 125000, purchaseValue: 0 },
    { _id: 'a2', assetType: 'gold', name: 'Physical Gold', quantity: 10, unit: 'grams', currentValue: 72500, purchaseValue: 55000 },
    { _id: 'a3', assetType: 'silver', name: 'Silver Coins', quantity: 100, unit: 'grams', currentValue: 9200, purchaseValue: 7500 },
    { _id: 'a4', assetType: 'fd', name: 'HDFC FD', quantity: 1, unit: 'units', currentValue: 200000, purchaseValue: 180000 },
    { _id: 'a5', assetType: 'mutual_fund', name: 'Axis Bluechip', quantity: 500, unit: 'units', currentValue: 35000, purchaseValue: 30000 },
    { _id: 'a6', assetType: 'crypto', name: 'Bitcoin', quantity: 0.005, unit: 'BTC', currentValue: 45000, purchaseValue: 30000 },
    { _id: 'a7', assetType: 'cash', name: 'Cash in Hand', quantity: 1, unit: 'units', currentValue: 15000, purchaseValue: 15000 }
];

router.get('/', async (req, res) => {
    try {
        const userId = req.query.userId || 'demo_user';
        try {
            const assets = await Asset.find({ userId }).sort({ currentValue: -1 });
            res.json({ success: true, assets });
        } catch (e) {
            res.json({ success: true, assets: DEMO_ASSETS, demo: true });
        }
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.post('/', async (req, res) => {
    try {
        const { assetType, name, quantity, unit, currentValue, purchaseValue } = req.body;
        const userId = req.body.userId || 'demo_user';
        if (!assetType || !name || currentValue === undefined) {
            return res.status(400).json({ success: false, message: 'assetType, name, and currentValue required' });
        }
        try {
            const asset = await Asset.create({ userId, assetType, name, quantity: quantity || 1, unit: unit || 'units', currentValue, purchaseValue: purchaseValue || 0 });
            res.status(201).json({ success: true, asset });
        } catch (e) {
            res.status(201).json({ success: true, asset: { assetType, name, quantity, currentValue }, demo: true });
        }
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.put('/:id', async (req, res) => {
    try {
        const asset = await Asset.findByIdAndUpdate(req.params.id, { ...req.body, lastUpdated: new Date() }, { new: true });
        if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });
        res.json({ success: true, asset });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.delete('/:id', async (req, res) => {
    try {
        await Asset.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Asset deleted' });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

router.get('/total', async (req, res) => {
    try {
        const userId = req.query.userId || 'demo_user';
        let assets;
        try { assets = await Asset.find({ userId }); } catch (e) { assets = DEMO_ASSETS; }

        const totalValue = assets.reduce((sum, a) => sum + a.currentValue, 0);
        const totalInvested = assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);
        const byType = {};
        assets.forEach(a => { byType[a.assetType] = (byType[a.assetType] || 0) + a.currentValue; });

        res.json({ success: true, totalValue, totalInvested, profit: totalValue - totalInvested, byType });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
});

module.exports = router;
