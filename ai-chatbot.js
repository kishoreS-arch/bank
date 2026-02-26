/**
 * SmartBank AI Chatbot
 * 
 * A smart banking chatbot that responds to user queries about
 * balance, transactions, bills, loans, and banking operations.
 * Uses keyword-based NLP with contextual responses.
 */

(function () {
    // Knowledge base — pattern → response
    const INTENTS = [
        {
            patterns: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'namaste'],
            responses: ['Hello! 👋 Welcome to SmartBank. How can I help you today?', 'Hey there! What can I assist you with?', 'Namaste! 🙏 I\'m your SmartBank AI assistant. Ask me anything about banking!']
        },
        {
            patterns: ['balance', 'how much', 'money', 'account balance', 'check balance', 'kitna paisa'],
            responses: ['💰 Your current balance is ₹1,25,000. Your savings account is in great shape!', '🏦 Here\'s your balance summary:\n• Savings: ₹1,25,000\n• FD: ₹2,00,000\n• Total: ₹3,25,000']
        },
        {
            patterns: ['transfer', 'send money', 'pay', 'upi', 'bhim', 'payment'],
            responses: ['💸 To transfer money:\n1. Go to Transfer page\n2. Enter UPI ID or account\n3. Enter amount\n4. Confirm with MPIN\n\nShall I take you there?', '🔄 You can send money via UPI, NEFT, or IMPS. Go to the Transfer section from the home page!']
        },
        {
            patterns: ['transaction', 'history', 'statement', 'recent', 'spent', 'spending'],
            responses: ['📊 Your recent transactions:\n• Swiggy: -₹850.75 (Food)\n• Salary TCS: +₹45,000\n• Amazon: -₹1,200.50\n• HP Petrol: -₹2,500\n\nVisit the Transactions page for full history!', '📈 This month you\'ve spent ₹31,299 across 11 categories. Your top spending is Housing (₹15,000). Check the Transactions page for analytics!']
        },
        {
            patterns: ['bill', 'reminder', 'due', 'overdue', 'electricity', 'emi', 'payment due'],
            responses: ['🔔 Your upcoming bills:\n• Electricity (TNEB): ₹1,800 — due in 2 days\n• Credit Card: ₹12,500 — due in 5 days\n• Home Loan EMI: ₹25,000 — OVERDUE!\n\nGo to Bill Reminders to manage them.', '⚠️ You have 2 overdue bills! Please check the Reminders page to mark them as paid.']
        },
        {
            patterns: ['budget', 'limit', 'overspend', 'save', 'saving', 'how much spent'],
            responses: ['📊 Budget Overview:\n• Food: ₹4,200/₹5,000 (84% ⚠️)\n• Entertainment: ₹1,600/₹1,500 (107% 🔴)\n• Shopping: ₹1,200/₹3,000 (40% ✅)\n\nVisit Budget Manager for AI suggestions!', '💡 AI Tip: You\'re overspending on Entertainment. Consider reducing it to ₹1,200/month based on your 3-month average.']
        },
        {
            patterns: ['gold', 'silver', 'rate', 'metal', 'invest', 'price'],
            responses: ['📈 Live Metal Rates:\n• Gold 24K: ₹7,250/gram\n• Gold 22K: ₹6,650/gram\n• Silver: ₹92/gram\n• Platinum: ₹3,100/gram\n\nRates refresh every 5 minutes on the Assets page!', '🪙 Gold is currently at ₹7,250/gram. Your 10g gold holding is worth ₹72,500 (↑31.8% gain!). View details on Assets page.']
        },
        {
            patterns: ['asset', 'portfolio', 'net worth', 'wealth', 'investment'],
            responses: ['💎 Your Net Worth: ₹5,01,700\n• Bank: ₹1,25,000\n• FD: ₹2,00,000\n• Gold: ₹72,500\n• Mutual Fund: ₹35,000\n• Crypto: ₹45,000\n\nOverall gain: +₹1,84,200!', '📊 Your portfolio is well-diversified! FD (40%), Bank (25%), Gold (14%). Check the Assets page for live valuations.']
        },
        {
            patterns: ['loan', 'emi', 'home loan', 'personal loan', 'interest'],
            responses: ['🏠 Your Active Loans:\n• Home Loan (SBI): ₹25,000/month EMI\n  Remaining: ₹18,50,000\n  Rate: 8.5% p.a.\n\nNeed a new loan? Visit any SmartBank branch or apply online!', '💼 Loan tip: You\'re pre-approved for a personal loan up to ₹5,00,000 at 10.5% p.a. Would you like to explore?']
        },
        {
            patterns: ['credit card', 'card', 'reward', 'cashback', 'credit limit'],
            responses: ['💳 Credit Card Summary:\n• HDFC Card: ₹12,500 due (5 days)\n• Credit Limit: ₹2,00,000\n• Available: ₹1,87,500\n• Reward Points: 2,450\n\nPay your bill on time to maintain a good score!']
        },
        {
            patterns: ['qr', 'scan', 'qr code', 'scanner'],
            responses: ['📸 To scan a QR code:\n1. Tap "Scan" from the home page\n2. Point your camera at the QR code\n3. Enter amount\n4. Confirm payment with MPIN\n\nSmartBank supports all UPI QR codes!']
        },
        {
            patterns: ['help', 'what can you do', 'features', 'menu', 'options'],
            responses: ['🤖 I can help you with:\n• 💰 Check balance\n• 📊 View transactions\n• 💸 Transfer money\n• 📈 Gold/Silver rates\n• 📊 Budget management\n• 🔔 Bill reminders\n• 💎 Asset portfolio\n• 💳 Credit card info\n• 🏦 Loan details\n\nJust ask me anything!']
        },
        {
            patterns: ['mode', 'theme', 'dark', 'senior', 'visual', 'accessibility'],
            responses: ['🎨 SmartBank has 3 accessibility modes:\n• 👤 Normal Mode — Standard theme\n• 👴 Senior Mode — Larger text, warm colors\n• 👁️ Visual Mode — High contrast + voice assist\n\nSwitch modes from the mode selector in the header!']
        },
        {
            patterns: ['security', 'safe', 'protect', 'fraud', 'hack'],
            responses: ['🔐 SmartBank Security:\n• RSA-2048 encryption\n• SHA-512 hashing\n• JWT session tokens\n• Device fingerprinting\n• AI fraud detection\n• Rate limiting (10 req/min)\n• MPIN + OTP verification\n\nYour funds are safe with us!']
        },
        {
            patterns: ['thank', 'thanks', 'bye', 'exit', 'quit'],
            responses: ['You\'re welcome! 😊 Need anything else, just ask!', 'Happy to help! Stay safe with SmartBank. 🏦', 'Bye! Remember to check your bills and budget regularly. 👋']
        }
    ];

    const FALLBACK = [
        '🤔 I\'m not sure about that. Try asking about balance, transactions, budget, or bills!',
        'I didn\'t quite get that. You can ask me about your account, payments, gold rates, or loans.',
        'Sorry, I don\'t have info on that yet. Try: "check balance", "show transactions", or "gold rate".'
    ];

    function findResponse(userMsg) {
        const msg = userMsg.toLowerCase().trim();

        for (const intent of INTENTS) {
            for (const pattern of intent.patterns) {
                if (msg.includes(pattern)) {
                    return intent.responses[Math.floor(Math.random() * intent.responses.length)];
                }
            }
        }

        return FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
    }

    function formatTime() {
        return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    }

    function createChatWidget() {
        // Chat button
        const chatBtn = document.createElement('button');
        chatBtn.id = 'aiChatBtn';
        chatBtn.innerHTML = '🤖';
        chatBtn.title = 'AI Assistant';
        chatBtn.setAttribute('aria-label', 'Open AI Chatbot');
        Object.assign(chatBtn.style, {
            position: 'fixed', bottom: '1.5rem', right: '5rem',
            width: '52px', height: '52px', borderRadius: '50%',
            background: '#8e44ad', color: '#fff', border: 'none',
            fontSize: '1.5rem', cursor: 'pointer', zIndex: '90',
            boxShadow: '0 4px 15px rgba(142,68,173,0.5)',
            transition: 'all 0.3s', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        });
        chatBtn.onmouseenter = () => { chatBtn.style.transform = 'scale(1.1)'; };
        chatBtn.onmouseleave = () => { chatBtn.style.transform = 'scale(1)'; };

        // Chat modal
        const modal = document.createElement('div');
        modal.id = 'aiChatModal';
        Object.assign(modal.style, {
            position: 'fixed', bottom: '5.5rem', right: '1.5rem',
            width: '340px', height: '450px', borderRadius: '16px',
            display: 'none', flexDirection: 'column', zIndex: '100',
            overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            animation: 'fadeInUp 0.3s ease'
        });

        // Apply theme-aware colors
        function applyColors() {
            const isVisual = document.body.classList.contains('mode-visual');
            const isSenior = document.body.classList.contains('mode-senior');
            const isDark = document.body.classList.contains('dark-mode-active');

            if (isVisual) {
                modal.style.background = '#000'; modal.style.border = '1px solid #00ffff';
                chatBtn.style.background = '#00ffff'; chatBtn.style.color = '#000';
            } else if (isSenior) {
                modal.style.background = '#fff4e5'; modal.style.border = '1px solid #d97706';
                chatBtn.style.background = '#d97706'; chatBtn.style.color = '#fff';
            } else if (isDark) {
                modal.style.background = '#2d3748'; modal.style.border = '1px solid #4a5568';
                chatBtn.style.background = '#8e44ad'; chatBtn.style.color = '#fff';
            } else {
                modal.style.background = '#fff'; modal.style.border = 'none';
                chatBtn.style.background = '#8e44ad'; chatBtn.style.color = '#fff';
            }
        }

        modal.innerHTML = `
            <div id="chatHeader" style="padding:0.8rem 1rem;display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:0.9rem;background:#8e44ad;color:#fff">
                <span>🤖 SmartBank AI</span>
                <button id="chatClose" style="background:none;border:none;color:rgba(255,255,255,0.7);font-size:1.3rem;cursor:pointer">✕</button>
            </div>
            <div id="chatMessages" style="flex:1;overflow-y:auto;padding:0.8rem;display:flex;flex-direction:column;gap:0.5rem"></div>
            <div id="chatInputArea" style="display:flex;gap:0.5rem;padding:0.6rem;border-top:1px solid rgba(0,0,0,0.1)">
                <input id="chatInput" type="text" placeholder="Ask me anything..." style="flex:1;border:1px solid #ddd;border-radius:20px;padding:0.5rem 1rem;font-size:0.8rem;outline:none">
                <button id="chatSend" style="background:#8e44ad;color:white;border:none;border-radius:20px;padding:0.5rem 1rem;font-size:0.8rem;font-weight:600;cursor:pointer">Send</button>
            </div>
        `;

        document.body.appendChild(chatBtn);
        document.body.appendChild(modal);

        const msgArea = modal.querySelector('#chatMessages');
        const input = modal.querySelector('#chatInput');
        const sendBtn = modal.querySelector('#chatSend');
        const closeBtn = modal.querySelector('#chatClose');

        let isOpen = false;

        function toggle() {
            isOpen = !isOpen;
            modal.style.display = isOpen ? 'flex' : 'none';
            applyColors();
            if (isOpen && msgArea.children.length === 0) {
                addBotMessage('Hello! 👋 I\'m your SmartBank AI assistant. Ask me about your balance, transactions, bills, gold rates, or anything else!');
            }
            if (isOpen) input.focus();
        }

        function addBotMessage(text) {
            const isVisual = document.body.classList.contains('mode-visual');
            const isSenior = document.body.classList.contains('mode-senior');
            const isDark = document.body.classList.contains('dark-mode-active');

            let bg = '#f3e5f5', color = '#4a2c0f';
            if (isVisual) { bg = '#111'; color = '#00ffff'; }
            else if (isSenior) { bg = '#fff9db'; color = '#4a2c0f'; }
            else if (isDark) { bg = '#4a5568'; color = '#f7fafc'; }

            const bubble = document.createElement('div');
            bubble.style.cssText = `max-width:85%;padding:0.6rem 0.9rem;border-radius:14px 14px 14px 4px;font-size:0.8rem;line-height:1.5;white-space:pre-line;background:${bg};color:${color};align-self:flex-start`;
            bubble.textContent = text;
            msgArea.appendChild(bubble);
            msgArea.scrollTop = msgArea.scrollHeight;

            // Voice read in visual mode
            if (window.VoiceAssist && window.VoiceAssist.isEnabled()) {
                window.VoiceAssist.speak(text.replace(/[•📊💰🔔⚠️💡🤖💸💎📈🪙🏠💳🔐🤔👋🙏]/g, ''));
            }
        }

        function addUserMessage(text) {
            const isVisual = document.body.classList.contains('mode-visual');
            const isDark = document.body.classList.contains('dark-mode-active');

            let bg = '#e0f7fa', color = '#0d47a1';
            if (isVisual) { bg = '#003333'; color = '#00ffff'; }
            else if (isDark) { bg = '#2b6cb0'; color = '#fff'; }

            const bubble = document.createElement('div');
            bubble.style.cssText = `max-width:80%;padding:0.6rem 0.9rem;border-radius:14px 14px 4px 14px;font-size:0.8rem;line-height:1.4;background:${bg};color:${color};align-self:flex-end`;
            bubble.textContent = text;
            msgArea.appendChild(bubble);
            msgArea.scrollTop = msgArea.scrollHeight;
        }

        function sendMessage() {
            const text = input.value.trim();
            if (!text) return;
            addUserMessage(text);
            input.value = '';

            // Typing indicator
            const typing = document.createElement('div');
            typing.style.cssText = 'font-size:0.7rem;color:#666;padding:0.3rem;align-self:flex-start;';
            typing.textContent = '🤖 Typing...';
            msgArea.appendChild(typing);
            msgArea.scrollTop = msgArea.scrollHeight;

            setTimeout(() => {
                msgArea.removeChild(typing);
                const response = findResponse(text);
                addBotMessage(response);
            }, 500 + Math.random() * 800);
        }

        chatBtn.onclick = toggle;
        closeBtn.onclick = toggle;
        sendBtn.onclick = sendMessage;
        input.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };

        // Watch for mode changes
        const observer = new MutationObserver(applyColors);
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        applyColors();
    }

    // Initialize on DOMContentLoaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createChatWidget);
    } else {
        createChatWidget();
    }
})();
