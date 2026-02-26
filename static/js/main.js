// Mobile Navigation
document.addEventListener('DOMContentLoaded', function() {
    // Navigation Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', function(event) {
        event.stopPropagation();
        navLinks.classList.toggle('active');
    });

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

    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.main-nav')) {
            navLinks.classList.remove('active');
        }
    });

    // Close menu when clicking a link
    navLinks.addEventListener('click', function(event) {
        if (event.target.tagName === 'A') {
            navLinks.classList.remove('active');
        }
    });

    // Close menu when window is resized above mobile breakpoint
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            navLinks.classList.remove('active');
        }
    });
});

// AI Tool Loading
function loadAITool(tool) {
    const frame = document.getElementById('ai-frame');
    const container = frame.parentElement;
    
    // Zeige Lade-Animation
    frame.style.opacity = '0.5';
    
    switch(tool) {
        case 'Qwen3-Coder':
            frame.src = 'https://qwen-qwen3-coder-webdev.hf.space';
            break;
        case 'hunyuan3d':
            frame.src = 'https://tencent-hunyuan3d-2-1.hf.space';
            break;
        case 'sparc3d':
            frame.src = 'https://ilcve21-sparc3d.hf.space';
            break;
        case 'felladrin-ai-list':
            frame.src = 'https://felladrin-awesome-ai-web-search.static.hf.space';
            break;
        case 'megatts3-voice-cloning':
            frame.src = 'https://mrfakename-megatts3-voice-cloning.hf.space';
            break;
        case 'dr.miromind.ai':
            frame.src = 'https://dr.miromind.ai/';
            break;
        case 'ithy':
            frame.src = 'https://ithy.com/';
            break;
        case 'hyper.space':
            frame.src = 'https://compute.hyper.space/';
            break;
        case 'lumina-image-2':
            frame.src = 'https://ijohn07-lumina-image-2-0.hf.space';
            break;
        case 'bolt':
            frame.src = 'https://bolt.new/';
            break;
        case 'pratikshahp-agent':
            frame.src = 'https://pratikshahp-agent-persistence.hf.space';
            break;
        case 'cultrix-V2-agents':
            frame.src = 'https://cultrix-smolagentsv2.hf.space';
            break;
        case 'langgraph-agent':
            frame.src = 'https://uzma-khatun-langgraph-ai-chatbot.hf.space';
            break;
        case 'content-hf-agent':
            frame.src = 'https://yumna7-content.hf.space';
            break;
        case 'hackathon-multi-agent':
            frame.src = 'https://agents-mcp-hackathon-multi-agent-deep-research.hf.space';
            break;
    }

    // Nach dem Laden Animation entfernen
    frame.onload = () => {
        frame.style.opacity = '1';
    };
}

// Event Listener für iframe Vollbild-Toggle
document.addEventListener('DOMContentLoaded', () => {
    const frame = document.getElementById('ai-frame');
    const container = frame.parentElement;
    
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
});

// Smooth Scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Contact Form Handling
document.getElementById('contact-form')?.addEventListener('submit', function(e) {
    e.preventDefault();
    // Add your form handling logic here
    alert('Thank you for your message. We will get back to you soon!');
    this.reset();
});

// Sprachauswahl
function changeLanguage(lang) {
    const currentPath = window.location.pathname;
    const isRatgeber = currentPath.includes('ratgeber_freiwilligenprogramm');
    
    if (isRatgeber) {
        if (lang === 'de') {
            window.location.href = '../freiwillig_transfer/ratgeber_freiwilligenprogramm.html';
        } else {
            window.location.href = `../freiwillig_transfer/ratgeber_freiwilligenprogramm_${lang}.html`;
        }
    } else {
        if (lang === 'de') {
            window.location.href = '../index.html';
        } else {
            window.location.href = `../index_${lang}.html`;
        }
    }
}

// Header Scroll Effect
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    const currentScroll = window.pageYOffset;

    if (currentScroll <= 0) {
        header.classList.remove('scroll-up');
        return;
    }

    if (currentScroll > lastScroll && !header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-up');
        header.classList.add('scroll-down');
    } else if (currentScroll < lastScroll && header.classList.contains('scroll-down')) {
        header.classList.remove('scroll-down');
        header.classList.add('scroll-up');
    }
    lastScroll = currentScroll;
});
