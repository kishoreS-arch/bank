/**
 * SmartBank Voice Assist
 * 
 * For Visual Impairment mode — reads out element text on
 * touch/hover/focus using Web Speech API.
 * Also reads page announcements on navigation.
 */
(function () {
    let enabled = false;
    let synth = window.speechSynthesis;
    let currentUtterance = null;
    let lastSpoken = '';
    let lastSpokeTime = 0;

    function speak(text, priority = false) {
        if (!enabled || !synth || !text) return;
        // Debounce — don't repeat within 500ms
        if (text === lastSpoken && Date.now() - lastSpokeTime < 500 && !priority) return;

        if (currentUtterance) synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-IN';
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Use an Indian English voice if available
        const voices = synth.getVoices();
        const indianVoice = voices.find(v => v.lang === 'en-IN') ||
            voices.find(v => v.lang.startsWith('en'));
        if (indianVoice) utterance.voice = indianVoice;

        currentUtterance = utterance;
        lastSpoken = text;
        lastSpokeTime = Date.now();
        synth.speak(utterance);
    }

    function getReadableText(el) {
        // Try aria-label first
        if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
        // Try title
        if (el.title) return el.title;
        // Try placeholder for inputs
        if (el.placeholder) return el.tagName === 'INPUT' ? 'Input field: ' + el.placeholder : el.placeholder;
        // Try alt for images  
        if (el.alt) return el.alt;
        // Get visible text, cleaning up
        let text = el.innerText || el.textContent || '';
        text = text.replace(/\s+/g, ' ').trim();
        if (text.length > 150) text = text.substring(0, 150) + '...';

        // Add context based on element type
        if (el.tagName === 'BUTTON' || el.role === 'button') text = 'Button: ' + text;
        else if (el.tagName === 'A') text = 'Link: ' + text;
        else if (el.tagName === 'SELECT') text = 'Dropdown: ' + (el.options[el.selectedIndex]?.text || text);
        else if (el.tagName === 'INPUT') {
            const type = el.type || 'text';
            if (type === 'password') text = 'Password field';
            else text = 'Input: ' + (el.value || el.placeholder || type + ' field');
        }

        return text;
    }

    function handleInteraction(e) {
        if (!enabled) return;
        const el = e.target.closest('button, a, input, select, textarea, [role="button"], .sb-list-item, .stat-card, .sb-card, .sb-section-title, .sb-item-title, h1, h2, h3, label, .mode-btn, .dark-toggle, .back-btn, .numpad-btn, .bank-card, .btn-primary, .btn-signup, .btn-login-alt, .otp-box');
        if (!el) return;

        const text = getReadableText(el);
        if (text) speak(text);
    }

    function announcePageLoad() {
        if (!enabled) return;
        const h1 = document.querySelector('h1');
        const title = document.title || 'SmartBank';
        const pageText = h1 ? h1.innerText : title;
        setTimeout(() => speak('Welcome to ' + pageText + '. Voice assist is active. Touch any element to hear its description.', true), 500);
    }

    function enable() {
        enabled = true;
        document.body.classList.add('voice-assist-active');

        // Add listeners
        document.addEventListener('mouseover', handleInteraction, true);
        document.addEventListener('focus', handleInteraction, true);
        document.addEventListener('touchstart', handleInteraction, true);
        document.addEventListener('click', handleInteraction, true);

        announcePageLoad();
    }

    function disable() {
        enabled = false;
        document.body.classList.remove('voice-assist-active');
        if (synth) synth.cancel();

        // Remove listeners
        document.removeEventListener('mouseover', handleInteraction, true);
        document.removeEventListener('focus', handleInteraction, true);
        document.removeEventListener('touchstart', handleInteraction, true);
        document.removeEventListener('click', handleInteraction, true);
    }

    // Auto-enable in visual mode
    function checkMode() {
        const isVisual = document.body.classList.contains('mode-visual');
        if (isVisual && !enabled) enable();
        else if (!isVisual && enabled) disable();
    }

    // Watch for mode changes
    const observer = new MutationObserver(() => checkMode());
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Load voices
    if (synth) {
        synth.onvoiceschanged = () => { };
        synth.getVoices();
    }

    // Initial check
    document.addEventListener('DOMContentLoaded', checkMode);
    // Fallback for late load
    setTimeout(checkMode, 100);

    // Expose globally
    window.VoiceAssist = {
        speak: speak,
        enable: enable,
        disable: disable,
        isEnabled: () => enabled
    };
})();
