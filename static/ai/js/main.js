// ################################################################ #

// Mobile Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Navigation Menu Toggle
    const menuIcon = document.querySelector('.menu-icon');

    if (menuIcon) {
        menuIcon.addEventListener('click', function(event) {
            event.stopPropagation();
            menuIcon.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.main-nav')) {
                menuIcon.classList.remove('active');
            }
        });
    }

    // AI Dropdown Menu
    const aiDropdownButton = document.querySelector('.ai-dropdown-button');
    const aiDropdownContent = document.querySelector('.ai-dropdown-content');

    if (aiDropdownButton && aiDropdownContent) {
        aiDropdownButton.addEventListener('click', function(event) {
            event.stopPropagation();
            aiDropdownButton.classList.toggle('active');
            aiDropdownContent.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.ai-dropdown')) {
                aiDropdownButton.classList.remove('active');
                aiDropdownContent.classList.remove('active');
            }
        });
    }
});

// ################################################################ #


// ################################################################ #

// Event Listener für iframe Vollbild-Toggle
document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('ai-frame');
    const container = document.querySelector('.ai-frame-container');

    if (frame && container) {
        // Doppelklick auf iframe für Vollbild
        frame.addEventListener('dblclick', () => {
            container.classList.toggle('fullscreen');
        });

        // ESC-Taste zum Verlassen des Vollbild-Modus
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && container.classList.contains('fullscreen')) {
                container.classList.remove('fullscreen');
            }
        });
    }
});
