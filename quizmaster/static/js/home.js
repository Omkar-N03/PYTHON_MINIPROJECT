/**
 * Home Page - Landing Page Functionality
 * Handles animations, navigation, and interactive elements
 */

// Generate floating particles
const animatedBg = document.getElementById('animatedBg');
const particleCount = globalThis.innerWidth < 768 ? 20 : 40;

for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'floating-particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (10 + Math.random() * 10) + 's';
    animatedBg.appendChild(particle);
}

/**
 * Close welcome overlay
 */
function closeWelcome() {
    const overlay = document.getElementById('welcomeOverlay');
    overlay.classList.add('hidden');
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 600);
}

/**
 * Toggle mobile menu
 */
function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
}

/**
 * Close mobile menu when clicking on a link
 */
const navLinksElements = document.querySelectorAll('.nav-links a');
for (const link of navLinksElements) {
    link.addEventListener('click', () => {
        const navLinks = document.getElementById('navLinks');
        const hamburger = document.getElementById('hamburger');
        if (navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        }
    });
}

/**
 * Navbar scroll effect
 */
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

globalThis.addEventListener('scroll', () => {
    const currentScroll = globalThis.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.style.background = 'rgba(26, 11, 46, 0.95)';
        navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.background = 'rgba(26, 11, 46, 0.75)';
        navbar.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

/**
 * Feature cards animation on scroll
 */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    for (const [index, entry] of entries.entries()) {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    }
}, observerOptions);

/**
 * Initialize feature card animations
 */
const featureCards = document.querySelectorAll('.feature-card');
for (const card of featureCards) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease-out';
    observer.observe(card);
}

/**
 * Video background fallback
 */
const video = document.querySelector('.video-background video');
if (video) {
    video.addEventListener('error', () => {
        console.log('Video failed to load. Using gradient background.');
        const videoBg = document.querySelector('.video-background');
        if (videoBg) {
            videoBg.style.display = 'none';
        }
    });
}
