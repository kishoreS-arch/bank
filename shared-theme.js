/**
 * SmartBank Shared Mode Manager
 * 
 * Reads mode settings from localStorage (shared with home.html)
 * and applies them to any feature page.
 * 
 * Keys used:
 *   smartbank_mode  → 'normal' | 'senior' | 'visual'
 *   smartbank_dark  → 'true' | 'false'
 */

(function () {
    // Read saved mode from localStorage (or default to 'normal')
    const savedMode = localStorage.getItem('smartbank_mode') ||
        localStorage.getItem('selectedMode') || 'normal';
    const savedDark = localStorage.getItem('smartbank_dark') === 'true' ||
        localStorage.getItem('darkModeActive') === 'true';

    // Apply mode to body
    function applyMode(mode) {
        document.body.classList.remove('mode-normal', 'mode-senior', 'mode-visual');
        document.body.classList.add('mode-' + mode);
        localStorage.setItem('smartbank_mode', mode);
        // Also set the old key for home.html compatibility
        localStorage.setItem('selectedMode', mode);

        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });

        // Dark mode only applies to normal mode
        if (mode !== 'normal') {
            document.body.classList.remove('dark-mode-active');
        } else if (savedDark || localStorage.getItem('smartbank_dark') === 'true') {
            document.body.classList.add('dark-mode-active');
        }
    }

    function toggleDark() {
        const isDark = document.body.classList.toggle('dark-mode-active');
        localStorage.setItem('smartbank_dark', isDark);
        localStorage.setItem('darkModeActive', isDark);

        // Update dark toggle icon
        const toggle = document.querySelector('.dark-toggle');
        if (toggle) toggle.textContent = isDark ? '☀️' : '🌙';
    }

    // Apply on load
    applyMode(savedMode);
    if (savedDark && savedMode === 'normal') {
        document.body.classList.add('dark-mode-active');
    }

    // Update dark toggle icon
    document.addEventListener('DOMContentLoaded', function () {
        const toggle = document.querySelector('.dark-toggle');
        if (toggle) {
            toggle.textContent = document.body.classList.contains('dark-mode-active') ? '☀️' : '🌙';
        }
    });

    // Expose globally
    window.SmartBankTheme = {
        applyMode: applyMode,
        toggleDark: toggleDark,
        getMode: () => localStorage.getItem('smartbank_mode') || 'normal',
        isDark: () => document.body.classList.contains('dark-mode-active')
    };
})();
