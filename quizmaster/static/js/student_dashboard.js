/**
 * Student Dashboard - Quiz Management Interface
 * Handles welcome overlay, filters, and navigation
 * All SonarLint errors fixed
 */

/**
 * Close welcome overlay
 */
function closeWelcome() {
    const overlay = document.getElementById('welcomeOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 600);
    }
}

/**
 * Toggle user menu with logout confirmation
 */
function toggleUserMenu() {
    if (confirm('Do you want to logout?')) {
        globalThis.location.href = globalThis.djangoData?.logoutUrl ?? '/quiz/logout/';
    }
}

/**
 * View quiz details
 * @param {number} quizId - Quiz ID
 */
function viewQuizDetails(quizId) {
    globalThis.location.href = `/quiz/student/quiz/${quizId}/take/`;
}

/**
 * View attempt result
 * @param {number} attemptId - Attempt ID
 */
function viewAttemptResult(attemptId) {
    globalThis.location.href = `/quiz/student/attempt/${attemptId}/result/`;
}

/**
 * Filter results functionality
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    if (filterButtons.length === 0) {
        console.warn('No filter buttons found');
        return;
    }

    for (const btn of filterButtons) {
        btn.addEventListener('click', function() {
            for (const b of filterButtons) {
                b.classList.remove('active');
            }
            this.classList.add('active');

            const filter = this.dataset.filter;
            const rows = document.querySelectorAll('#resultsTableBody tr');

            if (rows.length === 0) {
                console.warn('No result rows found');
                return;
            }

            for (const row of rows) {
                if (filter === 'all') {
                    row.style.display = '';
                } else {
                    row.style.display = row.dataset.status === filter ? '' : 'none';
                }
            }
        });
    }
}

/**
 * Video background fallback
 */
function initializeVideoFallback() {
    const video = document.querySelector('.video-background video');
    video?.addEventListener('error', () => {
        console.log('Video failed to load. Using gradient background.');
        const videoBg = document.querySelector('.video-background');
        videoBg?.style && (videoBg.style.display = 'none');
    });
}

/**
 * Smooth scroll for anchor links
 */
function initializeSmoothScroll() {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    for (const anchor of anchorLinks) {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            target?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    }
}

/**
 * Make functions globally accessible
 */
globalThis.closeWelcome = closeWelcome;
globalThis.toggleUserMenu = toggleUserMenu;
globalThis.viewQuizDetails = viewQuizDetails;
globalThis.viewAttemptResult = viewAttemptResult;

/**
 * Initialize dashboard when DOM is ready
 */
function initializeDashboard() {
    initializeFilters();
    initializeVideoFallback();
    initializeSmoothScroll();

    setTimeout(() => {
        const overlay = document.getElementById('welcomeOverlay');
        if (overlay?.classList && !overlay.classList.contains('hidden')) {
            closeWelcome();
        }
    }, 3000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
