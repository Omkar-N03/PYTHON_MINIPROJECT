/**
 * Login Page - Interactive Authentication Interface
 * Handles animations, form validation, and interactive particles
 */

// Generate floating particles
const particlesContainer = document.getElementById('particles');
for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = '-8px';
    particle.style.animationDelay = (Math.random() * 4) + 's';
    particle.style.animationDuration = (8 + Math.random() * 5) + 's';
    particlesContainer.appendChild(particle);
}

// Generate neural network nodes
const neuralNetwork = document.getElementById('neuralNetwork');
for (let i = 0; i < 15; i++) {
    const node = document.createElement('div');
    node.className = 'neural-node';
    node.style.left = Math.random() * 100 + '%';
    node.style.top = Math.random() * 100 + '%';
    node.style.animationDelay = Math.random() * 3 + 's';
    neuralNetwork.appendChild(node);
}

// Interactive particles on mouse move
const interactiveParticles = [];
const maxParticles = 15;
let mouseX = 0;
let mouseY = 0;
let lastX = 0;
let lastY = 0;

// Create interactive particles pool
for (let i = 0; i < maxParticles; i++) {
    const particle = document.createElement('div');
    particle.className = 'interactive-particle';
    particle.style.opacity = '0';
    document.body.appendChild(particle);
    interactiveParticles.push({
        element: particle,
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0
    });
}

/**
 * Mouse move handler with particle effects
 */
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    // FIXED: Use Math.hypot instead of Math.sqrt
    const velocity = Math.hypot(dx, dy);

    if (velocity > 2) {
        const inactiveParticle = interactiveParticles.find(p => !p.active);
        if (inactiveParticle) {
            inactiveParticle.active = true;
            inactiveParticle.x = mouseX;
            inactiveParticle.y = mouseY;
            inactiveParticle.vx = (Math.random() - 0.5) * 4;
            inactiveParticle.vy = (Math.random() - 0.5) * 4;
            inactiveParticle.life = 1;
            inactiveParticle.element.style.opacity = '1';
        }

        if (Math.random() > 0.7) {
            const trail = document.createElement('div');
            trail.className = 'particle-trail';
            trail.style.left = mouseX + 'px';
            trail.style.top = mouseY + 'px';
            document.body.appendChild(trail);
            setTimeout(() => trail.remove(), 1000);
        }
    }

    lastX = mouseX;
    lastY = mouseY;

    // FIXED: Use for...of instead of forEach
    const allParticles = document.querySelectorAll('.particle');
    for (const particle of allParticles) {
        const rect = particle.getBoundingClientRect();
        const particleX = rect.left + rect.width / 2;
        const particleY = rect.top + rect.height / 2;
        
        const dx = particleX - mouseX;
        const dy = particleY - mouseY;
        // FIXED: Use Math.hypot instead of Math.sqrt
        const distance = Math.hypot(dx, dy);
        
        if (distance < 150) {
            const force = (150 - distance) / 150;
            const angle = Math.atan2(dy, dx);
            const moveX = Math.cos(angle) * force * 30;
            const moveY = Math.sin(angle) * force * 30;
            
            particle.style.transform = `translate(${moveX}px, ${moveY}px)`;
        } else {
            particle.style.transform = '';
        }
    }
});

/**
 * Animate interactive particles
 */
function animateInteractiveParticles() {
    // FIXED: Use for...of instead of forEach
    for (const particle of interactiveParticles) {
        if (particle.active) {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1;
            particle.life -= 0.02;

            particle.element.style.left = particle.x + 'px';
            particle.element.style.top = particle.y + 'px';
            particle.element.style.opacity = particle.life;
            particle.element.style.transform = `scale(${particle.life})`;

            if (particle.life <= 0) {
                particle.active = false;
                particle.element.style.opacity = '0';
            }
        }
    }
    requestAnimationFrame(animateInteractiveParticles);
}
animateInteractiveParticles();

/**
 * Role Selection Handler
 */
const roleButtons = document.querySelectorAll('.role-btn');
const roleInput = document.getElementById('roleInput');

// FIXED: Use for...of instead of forEach
for (const btn of roleButtons) {
    btn.addEventListener('click', function() {
        // FIXED: Use for...of instead of forEach
        for (const b of roleButtons) {
            b.classList.remove('active');
        }
        this.classList.add('active');
        roleInput.value = this.dataset.role;
    });
}

/**
 * Toggle Password Visibility
 */
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            this.textContent = '🙈';
        } else {
            passwordInput.type = 'password';
            this.textContent = '👁️';
        }
    });
}

/**
 * Google Login Handler
 */
const googleLoginBtn = document.getElementById('googleLogin');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', () => {
        alert('Google OAuth integration coming soon!');
        // Redirect to Google OAuth endpoint
        // globalThis.location.href = '/auth/google/';
    });
}

/**
 * Form Validation
 */
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            e.preventDefault();
            alert('Please fill in all fields');
            return false;
        }

        if (password.length < 6) {
            e.preventDefault();
            alert('Password must be at least 6 characters');
            return false;
        }

        // Form will submit to Django backend
        return true;
    });
}

/**
 * Auto-dismiss alerts after 5 seconds
 */
setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    // FIXED: Use for...of instead of forEach
    for (const alert of alerts) {
        alert.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => alert.remove(), 300);
    }
}, 5000);
