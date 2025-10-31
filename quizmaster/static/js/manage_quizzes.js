/**
 * Manage Quizzes - Teacher Quiz Management Interface
 * Handles filtering, searching, and deletion of quizzes
 */

let currentFilter = 'all';
let quizToDelete = null;

/**
 * Filter button click handlers
 */
const filterButtons = document.querySelectorAll('.filter-btn');
for (const btn of filterButtons) {
    btn.addEventListener('click', function() {
        currentFilter = this.dataset.filter;
        
        // Update active button
        for (const b of filterButtons) {
            b.classList.remove('active');
        }
        this.classList.add('active');

        // Filter cards
        filterQuizCards();
    });
}

/**
 * Search functionality
 */
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', () => {
        filterQuizCards();
    });
}

/**
 * Filter quiz cards based on search and filter criteria
 */
function filterQuizCards() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const cards = document.querySelectorAll('.quiz-card');

    for (const card of cards) {
        const status = card.dataset.status;
        const title = card.dataset.title;
        const subject = card.dataset.subject;

        // Check filter
        const matchesFilter = currentFilter === 'all' || status === currentFilter;

        // Check search
        const matchesSearch = !searchTerm || 
            title.includes(searchTerm) || 
            subject.includes(searchTerm);

        // Show/hide card
        if (matchesFilter && matchesSearch) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    }
}

/**
 * Open delete confirmation modal
 * @param {number} quizId - Quiz ID to delete
 * @param {string} quizTitle - Quiz title for display
 */
function openDeleteModal(quizId, quizTitle) {
    quizToDelete = quizId;
    document.getElementById('modalQuizName').textContent = quizTitle;
    document.getElementById('deleteModal').classList.add('show');
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('show');
    quizToDelete = null;
}

/**
 * Confirm and execute quiz deletion
 */
function confirmDelete() {
    if (quizToDelete !== null) {
        // Make DELETE request to Django backend
        const deleteUrl = djangoData.deleteUrl.replace('{id}', quizToDelete);
        
        fetch(deleteUrl, {
            method: 'POST',
            headers: {
                'X-CSRFToken': djangoData.csrfToken,
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                // Reload page to show updated list
                globalThis.location.reload();
            } else {
                alert('Error deleting quiz. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error deleting quiz. Please try again.');
        });
    }
}

/**
 * Close modal when clicking outside
 */
const deleteModal = document.getElementById('deleteModal');
if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
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

/**
 * Auto-dismiss messages after 5 seconds
 */
setTimeout(() => {
    const alerts = document.querySelectorAll('.alert');
    for (const alert of alerts) {
        alert.style.animation = 'slideOut 0.3s ease-out forwards';
        setTimeout(() => alert.remove(), 300);
    }
}, 5000);
