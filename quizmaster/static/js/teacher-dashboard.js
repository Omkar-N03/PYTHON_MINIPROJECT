/**
 * QUIZMASTER - Teacher Dashboard JavaScript
 * Modern, Clean, and Production-Ready
 * Version: 3.0 | Optimized for 2025
 * SonarLint Compliant | Analytics Integration
 */

'use strict';

// ==========================================
// CSRF TOKEN HELPER (Django)
// ==========================================

/**
 * Get CSRF token from cookies for Django AJAX requests
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value
 */
function getCookie(name) {
    if (!document.cookie) {
        return null;
    }
    
    const cookies = document.cookie.split(';');
    
    for (const cookie of cookies) {
        const trimmedCookie = cookie.trim();
        const [cookieName, cookieValue] = trimmedCookie.split('=');
        
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    
    return null;
}

// Get CSRF token
const csrftoken = getCookie('csrftoken');

// ==========================================
// WELCOME OVERLAY
// ==========================================

/**
 * Close welcome overlay with smooth animation
 */
function closeWelcome() {
    const overlay = document.getElementById('welcomeOverlay');
    
    if (!overlay) {
        console.error('❌ Welcome overlay not found');
        return;
    }
    
    console.log('🎯 Closing welcome overlay...');
    
    // Add hidden class for animation
    overlay.classList.add('hidden');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
        console.log('✅ Welcome overlay closed');
    }, 650);
}

/**
 * Auto-close welcome overlay after delay
 */
function autoCloseWelcome() {
    setTimeout(() => {
        const overlay = document.getElementById('welcomeOverlay');
        if (overlay && !overlay.classList.contains('hidden')) {
            console.log('⏰ Auto-closing welcome overlay');
            closeWelcome();
        }
    }, 4000);
}

// ==========================================
// ANALYTICS CHART
// ==========================================

/**
 * Populate analytics chart with grade distribution data
 */
function populateChart() {
    const chartContainer = document.getElementById('chartContainer');
    
    if (!chartContainer) {
        console.warn('⚠️ Chart container not found');
        return;
    }
    
    // Check if gradeDistribution data exists from Django template
    let chartData;
    
    if (typeof gradeDistribution !== 'undefined' && gradeDistribution && gradeDistribution.length > 0) {
        chartData = gradeDistribution;
        console.log('📊 Using grade distribution data from backend:', chartData);
    } else {
        // Fallback: default empty data
        chartData = [
            { label: '90-100', count: 0 },
            { label: '80-89', count: 0 },
            { label: '70-79', count: 0 },
            { label: '60-69', count: 0 },
            { label: '50-59', count: 0 },
            { label: '0-49', count: 0 }
        ];
        console.log('📊 Using default chart data (no student attempts yet)');
    }
    
    // Preserve figcaption if it exists
    const figcaption = chartContainer.querySelector('figcaption');
    
    // Clear existing content
    chartContainer.innerHTML = '';
    
    // Re-add figcaption
    if (figcaption) {
        chartContainer.appendChild(figcaption);
    }
    
    // Calculate max count for scaling
    const maxCount = Math.max(...chartData.map(r => r.count), 1);
    
    // Create wrapper for chart bars
    const barsWrapper = document.createElement('div');
    barsWrapper.className = 'chart-bars';
    barsWrapper.style.cssText = 'display: flex; align-items: flex-end; justify-content: space-around; height: 300px; gap: 1rem; padding: 1rem;';
    
    // Create chart bars
    for (const [index, data] of chartData.entries()) {
        const barContainer = document.createElement('div');
        barContainer.style.cssText = 'flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;';
        
        // Bar wrapper
        const barWrapper = document.createElement('div');
        barWrapper.style.cssText = 'width: 100%; height: 100%; display: flex; align-items: flex-end; justify-content: center;';
        
        // Create bar
        const bar = document.createElement('div');
        const height = (data.count / maxCount) * 100;
        bar.className = 'chart-bar';
        bar.style.cssText = `
            width: 80%;
            height: ${height}%;
            background: linear-gradient(180deg, var(--color-primary), var(--color-primary-hover));
            border-radius: 8px 8px 0 0;
            position: relative;
            transition: all 0.3s ease;
            animation: barGrow 0.6s ease-out forwards;
            animation-delay: ${index * 0.1}s;
            opacity: 0;
            cursor: pointer;
        `;
        bar.title = `${data.label}: ${data.count} students`;
        
        // Value label on top of bar
        const valueLabel = document.createElement('span');
        valueLabel.className = 'chart-value';
        valueLabel.textContent = data.count;
        valueLabel.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: 600;
            color: var(--color-text);
            font-size: 0.9rem;
        `;
        
        // Add hover effect
        bar.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
            this.style.filter = 'brightness(1.1)';
        });
        
        bar.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.filter = 'brightness(1)';
        });
        
        bar.appendChild(valueLabel);
        barWrapper.appendChild(bar);
        
        // Grade range label
        const label = document.createElement('span');
        label.className = 'chart-label';
        label.textContent = data.label;
        label.style.cssText = `
            font-size: 0.85rem;
            color: var(--color-text-secondary);
            font-weight: 500;
            text-align: center;
        `;
        
        barContainer.appendChild(barWrapper);
        barContainer.appendChild(label);
        barsWrapper.appendChild(barContainer);
    }
    
    // Add bars wrapper to container
    chartContainer.appendChild(barsWrapper);
    
    // Add CSS animation if not already present
    if (!document.getElementById('chart-animations')) {
        const style = document.createElement('style');
        style.id = 'chart-animations';
        style.textContent = `
            @keyframes barGrow {
                from {
                    height: 0%;
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    console.log('📊 Chart populated with', chartData.length, 'data points');
}

// ==========================================
// QUIZ ACTIONS
// ==========================================

/**
 * Publish quiz with confirmation
 * @param {number} quizId - ID of the quiz to publish
 */
function publishQuiz(quizId) {
    if (!confirm('Are you sure you want to publish this quiz?')) {
        return;
    }
    
    fetch(`/teacher/quiz/${quizId}/publish/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('✅ Quiz published successfully!');
            globalThis.location.reload();
        } else {
            alert('❌ Failed to publish quiz: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('❌ Error publishing quiz:', error);
        alert('An error occurred while publishing the quiz.');
    });
}

/**
 * Delete quiz with confirmation
 * @param {number} quizId - ID of the quiz to delete
 */
function deleteQuiz(quizId) {
    if (!confirm('⚠️ Are you sure you want to delete this quiz? This action cannot be undone.')) {
        return;
    }
    
    fetch(`/teacher/quiz/${quizId}/delete/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        credentials: 'same-origin'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            alert('✅ Quiz deleted successfully!');
            globalThis.location.reload();
        } else {
            alert('❌ Failed to delete quiz: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('❌ Error deleting quiz:', error);
        alert('An error occurred while deleting the quiz.');
    });
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================

/**
 * Initialize search functionality
 */
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    const tableBody = document.getElementById('quizzesTableBody');
    
    if (!searchInput || !tableBody) {
        console.warn('⚠️ Search elements not found');
        return;
    }
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        const rows = tableBody.querySelectorAll('tr');
        
        let visibleCount = 0;
        
        // Use for...of instead of forEach
        for (const row of rows) {
            // Skip empty state row (colspan row)
            if (row.cells.length === 1 && row.cells[0].hasAttribute('colspan')) {
                continue;
            }
            
            const quizName = row.cells[0]?.textContent.toLowerCase() || '';
            const category = row.cells[1]?.textContent.toLowerCase() || '';
            const status = row.cells[5]?.textContent.toLowerCase() || '';
            
            const isMatch = quizName.includes(searchTerm) || 
                          category.includes(searchTerm) || 
                          status.includes(searchTerm);
            
            row.style.display = isMatch ? '' : 'none';
            
            if (isMatch) visibleCount++;
        }
        
        // Show "no results" message
        showNoResultsMessage(tableBody, visibleCount, searchTerm);
        
        console.log(`🔍 Search: "${searchTerm}" - ${visibleCount} results`);
    });
    
    console.log('✅ Search initialized');
}

/**
 * Show/hide "no results" message
 * @param {HTMLElement} tableBody - Table body element
 * @param {number} visibleCount - Number of visible rows
 * @param {string} searchTerm - Current search term
 */
function showNoResultsMessage(tableBody, visibleCount, searchTerm) {
    const existingMessage = tableBody.querySelector('.no-results-row');
    
    if (visibleCount === 0 && searchTerm) {
        if (!existingMessage) {
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'no-results-row';
            noResultsRow.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 2rem; color: #94a3b8;">
                    🔍 No quizzes found matching "${searchTerm}"
                </td>
            `;
            tableBody.appendChild(noResultsRow);
        }
    } else if (existingMessage) {
        existingMessage.remove();
    }
}

// ==========================================
// VIDEO BACKGROUND
// ==========================================

/**
 * Handle video background errors
 */
function initializeVideoBackground() {
    const video = document.querySelector('.video-background video');
    
    if (!video) {
        console.warn('⚠️ Video element not found');
        return;
    }
    
    video.addEventListener('error', function() {
        console.warn('⚠️ Video failed to load. Using gradient background.');
        const videoContainer = document.querySelector('.video-background');
        if (videoContainer) {
            videoContainer.style.display = 'none';
        }
    });
    
    // Check if video loaded successfully
    video.addEventListener('loadeddata', function() {
        console.log('✅ Background video loaded successfully');
    });
}

// ==========================================
// STATISTICS ANIMATION
// ==========================================

/**
 * Animate card values with counting effect
 */
function animateCardValues() {
    const valueElements = document.querySelectorAll('.card-value');
    
    // Use for...of instead of forEach
    for (const element of valueElements) {
        const target = Number.parseInt(element.textContent, 10) || 0;
        
        if (target === 0) continue;
        
        const duration = 1500; // 1.5 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;
        
        element.textContent = '0';
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target;
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current);
            }
        }, 16);
    }
    
    console.log('✅ Card animations started');
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

/**
 * Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape: Close welcome overlay
        if (e.key === 'Escape') {
            const overlay = document.getElementById('welcomeOverlay');
            if (overlay && !overlay.classList.contains('hidden')) {
                closeWelcome();
            }
        }
    });
    
    console.log('✅ Keyboard shortcuts initialized (Ctrl+K for search, Esc to close overlay)');
}

// ==========================================
// TABLE INTERACTIONS
// ==========================================

/**
 * Add interactive features to table rows
 */
function initializeTableInteractions() {
    const rows = document.querySelectorAll('#quizzesTableBody tr');
    
    // Use for...of instead of forEach
    for (const row of rows) {
        // Skip empty state row
        if (row.cells.length === 1) continue;
        
        row.addEventListener('click', function(e) {
            // Don't trigger if clicking on buttons
            if (e.target.classList.contains('action-btn') || 
                e.target.closest('.action-btn')) {
                return;
            }
            
            // Highlight selected row
            for (const r of rows) {
                r.classList.remove('selected');
            }
            this.classList.add('selected');
        });
    }
    
    console.log('✅ Table interactions initialized');
}

// ==========================================
// BUTTON INITIALIZATION
// ==========================================

/**
 * Initialize welcome button with event listener
 */
function initializeWelcomeButton() {
    const enterBtn = document.getElementById('enterDashboardBtn');
    
    if (!enterBtn) {
        console.warn('⚠️ Welcome button not found');
        return;
    }
    
    // Remove any existing listeners by cloning
    const newBtn = enterBtn.cloneNode(true);
    enterBtn.parentNode.replaceChild(newBtn, enterBtn);
    
    // Add click event listener
    newBtn.addEventListener('click', closeWelcome);
    
    console.log('✅ Welcome button initialized');
}

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize all dashboard features
 */
function initializeDashboard() {
    console.log('🚀 Initializing Teacher Dashboard...');
    
    // Initialize welcome button
    initializeWelcomeButton();
    
    // Initialize features
    initializeSearch();
    initializeVideoBackground();
    initializeKeyboardShortcuts();
    initializeTableInteractions();
    
    // Populate analytics chart
    populateChart();
    
    // Animate statistics cards
    setTimeout(animateCardValues, 500);
    
    // Auto-close welcome overlay
    autoCloseWelcome();
    
    console.log('✅ Teacher Dashboard initialized successfully');
}

// Make functions globally accessible using globalThis
globalThis.closeWelcome = closeWelcome;
globalThis.publishQuiz = publishQuiz;
globalThis.deleteQuiz = deleteQuiz;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
                