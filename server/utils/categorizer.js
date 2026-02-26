/**
 * AI Auto-Categorization Engine
 * 
 * Classifies transactions into categories using keyword mapping.
 * In production, this can be upgraded to NLP/ML classification.
 * 
 * Flow: Transaction description → keyword match → category assignment
 */

// Keyword-to-category mapping (case-insensitive)
const CATEGORY_MAP = {
    food: [
        'swiggy', 'zomato', 'dominos', 'pizza', 'mcdonald', 'burger', 'kfc',
        'restaurant', 'cafe', 'coffee', 'starbucks', 'uber eats', 'food',
        'dining', 'biryani', 'hotel', 'bakery', 'subway', 'dunkin'
    ],
    shopping: [
        'amazon', 'flipkart', 'myntra', 'ajio', 'meesho', 'snapdeal',
        'mall', 'store', 'mart', 'bazaar', 'reliance', 'dmart', 'big basket',
        'bigbasket', 'grofers', 'blinkit', 'zepto', 'jiomart', 'shopping'
    ],
    fuel: [
        'petrol', 'diesel', 'hp', 'indian oil', 'iocl', 'bpcl', 'shell',
        'fuel', 'gas station', 'hindustan petroleum', 'bharat petroleum',
        'ev charging', 'cng'
    ],
    entertainment: [
        'netflix', 'spotify', 'amazon prime', 'hotstar', 'disney', 'youtube',
        'cinema', 'movie', 'pvr', 'inox', 'game', 'playstation', 'xbox',
        'music', 'concert', 'theatre', 'jio cinema', 'zee5'
    ],
    recharge: [
        'airtel', 'jio', 'vi', 'vodafone', 'idea', 'bsnl', 'mtnl',
        'recharge', 'prepaid', 'postpaid', 'mobile plan', 'data pack'
    ],
    housing: [
        'rent', 'house', 'apartment', 'flat', 'society', 'maintenance',
        'property', 'emi', 'home loan', 'mortgage', 'housing'
    ],
    bills: [
        'electricity', 'water', 'gas bill', 'broadband', 'internet',
        'wifi', 'eb bill', 'tneb', 'bescom', 'tata power', 'adani',
        'utility', 'municipal', 'sewage'
    ],
    salary: [
        'salary', 'payroll', 'wages', 'income', 'stipend', 'freelance',
        'commission', 'bonus', 'incentive', 'payout'
    ],
    transfer: [
        'transfer', 'upi', 'neft', 'rtgs', 'imps', 'send money',
        'payment to', 'paid to', 'received from'
    ],
    investment: [
        'mutual fund', 'sip', 'stocks', 'shares', 'demat', 'zerodha',
        'groww', 'upstox', 'coin', 'fd', 'fixed deposit', 'ppf', 'nps',
        'gold', 'silver', 'crypto', 'bitcoin', 'ethereum'
    ],
    medical: [
        'hospital', 'medical', 'pharmacy', 'medicine', 'doctor', 'clinic',
        'health', 'apollo', 'medplus', 'netmeds', 'lab test', 'diagnostic'
    ],
    travel: [
        'uber', 'ola', 'rapido', 'flight', 'train', 'irctc', 'bus',
        'makemytrip', 'goibibo', 'hotel booking', 'ticket', 'metro',
        'cab', 'taxi', 'indigo', 'air india', 'spicejet', 'vistara'
    ],
    education: [
        'school', 'college', 'university', 'tuition', 'course', 'udemy',
        'coursera', 'books', 'stationery', 'exam', 'coaching', 'fee'
    ]
};

/**
 * Auto-categorize a transaction based on its description
 * @param {string} description - Transaction description/merchant name
 * @returns {{ category: string, confidence: number, aiCategorized: boolean }}
 */
function categorize(description) {
    if (!description) return { category: 'other', confidence: 0, aiCategorized: false };

    const lower = description.toLowerCase().trim();

    for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
        for (const keyword of keywords) {
            if (lower.includes(keyword)) {
                return {
                    category,
                    confidence: 0.85, // Keyword match confidence
                    aiCategorized: true,
                    matchedKeyword: keyword
                };
            }
        }
    }

    return { category: 'other', confidence: 0, aiCategorized: false };
}

/**
 * Get all available categories with icons
 */
function getCategories() {
    return {
        food: { label: 'Food & Dining', icon: '🍕', color: '#f59e0b' },
        shopping: { label: 'Shopping', icon: '🛒', color: '#8b5cf6' },
        fuel: { label: 'Fuel', icon: '⛽', color: '#ef4444' },
        entertainment: { label: 'Entertainment', icon: '🎬', color: '#ec4899' },
        recharge: { label: 'Recharge', icon: '📱', color: '#06b6d4' },
        housing: { label: 'Housing & Rent', icon: '🏠', color: '#14b8a6' },
        bills: { label: 'Bills & Utilities', icon: '💡', color: '#f97316' },
        salary: { label: 'Salary & Income', icon: '💰', color: '#22c55e' },
        transfer: { label: 'Transfers', icon: '🔄', color: '#3b82f6' },
        investment: { label: 'Investments', icon: '📈', color: '#10b981' },
        medical: { label: 'Medical', icon: '🏥', color: '#ef4444' },
        travel: { label: 'Travel', icon: '✈️', color: '#6366f1' },
        education: { label: 'Education', icon: '📚', color: '#a855f7' },
        other: { label: 'Other', icon: '📦', color: '#64748b' }
    };
}

module.exports = { categorize, getCategories, CATEGORY_MAP };
