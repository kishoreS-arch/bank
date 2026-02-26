// Accessibility Mode Handler
// This script handles the accessibility mode switching across all pages

// Check if a mode is stored in localStorage
function initAccessibilityMode() {
    const storedMode = localStorage.getItem('smartBankAccessibilityMode') || 'normal';
    changeMode(storedMode);
    
    // If we have a mode selector on this page, update it
    const modeSelect = document.getElementById('modeSelect');
    if (modeSelect) {
        modeSelect.value = storedMode;
    }
}

// Change the accessibility mode
function changeMode(mode) {
    const body = document.body;
    
    // Remove all mode classes
    body.classList.remove("mode-normal", "mode-senior", "mode-visual");
    
    // Store the selected mode in localStorage for persistence across pages
    localStorage.setItem('smartBankAccessibilityMode', mode);
    
    // Apply the appropriate mode class
    switch (mode) {
        case "senior":
            body.classList.add("mode-senior");
            break;
        case "visual":
            body.classList.add("mode-visual");
            break;
        default: // Normal mode
            body.classList.add("mode-normal");
    }
}

// Add mode selector to the page if it doesn't exist
function addModeSelector() {
    // Check if header exists
    const header = document.querySelector('header');
    if (!header) return;
    
    // Check if mode selector already exists
    if (document.getElementById('modeSelect')) return;
    
    // Create settings container if it doesn't exist
    let settingsContainer = header.querySelector('.settings-container');
    if (!settingsContainer) {
        settingsContainer = document.createElement('div');
        settingsContainer.className = 'settings-container';
        settingsContainer.setAttribute('aria-label', 'User settings');
        header.appendChild(settingsContainer);
    }
    
    // Create label for screen readers
    const label = document.createElement('label');
    label.setAttribute('for', 'modeSelect');
    label.className = 'sr-only';
    label.textContent = 'Select Mode';
    
    // Create mode selector
    const select = document.createElement('select');
    select.id = 'modeSelect';
    select.setAttribute('aria-label', 'Select Accessibility Mode');
    select.setAttribute('title', 'Choose Accessibility Mode');
    
    // Add options
    const options = [
        { value: 'normal', text: '🟢 Normal' },
        { value: 'senior', text: '🟠 Senior' },
        { value: 'visual', text: '🔵 Visual Impairment' }
    ];
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        select.appendChild(optionElement);
    });
    
    // Add event listener
    select.addEventListener('change', (e) => {
        changeMode(e.target.value);
    });
    
    // Append elements to settings container
    settingsContainer.appendChild(label);
    settingsContainer.appendChild(select);
    
    // Set initial value based on stored mode
    const storedMode = localStorage.getItem('smartBankAccessibilityMode') || 'normal';
    select.value = storedMode;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initAccessibilityMode();
    addModeSelector();
});