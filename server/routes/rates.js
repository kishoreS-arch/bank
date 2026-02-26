/**
 * Live Metal Rates Route
 * Gold & Silver price tracker with auto-calculation
 * Uses demo rates as fallback when API is unavailable
 */

const express = require('express');
const router = express.Router();

// Cache rates to avoid excessive API calls (5 min cache)
let rateCache = { gold: 0, silver: 0, timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Demo rates (realistic INR prices per gram)
const DEMO_RATES = {
    gold: 7250,    // ₹7,250 per gram (approx)
    silver: 92,    // ₹92 per gram (approx)
    gold_24k: 7250,
    gold_22k: 6650,
    gold_18k: 5440,
    platinum: 3100
};

/**
 * GET /api/rates/metals
 * Returns live gold & silver rates
 */
router.get('/metals', async (req, res) => {
    try {
        const now = Date.now();

        // Check cache
        if (rateCache.timestamp && (now - rateCache.timestamp) < CACHE_DURATION) {
            return res.json({
                success: true,
                rates: rateCache,
                cached: true,
                nextUpdate: new Date(rateCache.timestamp + CACHE_DURATION).toISOString()
            });
        }

        // Try fetching live rates
        let rates;
        try {
            // Using a free metal price API
            const response = await fetch('https://api.metalpriceapi.com/v1/latest?api_key=demo&base=INR&currencies=XAU,XAG');
            if (response.ok) {
                const data = await response.json();
                // Convert troy ounce to grams (1 troy oz = 31.1035 grams)
                rates = {
                    gold: Math.round((1 / data.rates.XAU) / 31.1035),
                    silver: Math.round((1 / data.rates.XAG) / 31.1035),
                    timestamp: now,
                    source: 'live'
                };
            } else {
                throw new Error('API unavailable');
            }
        } catch (apiErr) {
            // Use demo rates with slight random variation for realism
            const variation = () => (0.98 + Math.random() * 0.04); // ±2%
            rates = {
                gold: Math.round(DEMO_RATES.gold * variation()),
                gold_24k: Math.round(DEMO_RATES.gold_24k * variation()),
                gold_22k: Math.round(DEMO_RATES.gold_22k * variation()),
                gold_18k: Math.round(DEMO_RATES.gold_18k * variation()),
                silver: Math.round(DEMO_RATES.silver * variation()),
                platinum: Math.round(DEMO_RATES.platinum * variation()),
                timestamp: now,
                source: 'demo'
            };
        }

        // Update cache
        rateCache = rates;

        res.json({
            success: true,
            rates,
            cached: false,
            nextUpdate: new Date(now + CACHE_DURATION).toISOString()
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/rates/calculate
 * Calculate value: quantity × live rate
 */
router.get('/calculate', async (req, res) => {
    try {
        const { metal, quantity } = req.query;
        if (!metal || !quantity) {
            return res.status(400).json({ success: false, message: 'metal and quantity required' });
        }

        const rate = rateCache[metal] || DEMO_RATES[metal] || 0;
        const totalValue = rate * parseFloat(quantity);

        res.json({
            success: true,
            metal,
            quantity: parseFloat(quantity),
            ratePerGram: rate,
            totalValue: Math.round(totalValue * 100) / 100,
            currency: 'INR'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
