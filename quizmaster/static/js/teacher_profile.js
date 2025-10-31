/**
 * Teacher Profile - Profile Management Interface
 * Handles edit mode, avatar changes, and form validation
 */

let isEditMode = false;

/**
 * Toggle edit mode for profile form
 */
function toggleEditMode() {
    isEditMode = !isEditMode;
    const editBtn = document.getElementById('editBtn');
    const actionButtons = document.getElementById('actionButtons');

    // Get all form inputs
    const inputs = document.querySelectorAll('input:not([type="file"]), textarea, select');

    if (isEditMode) {
        // Enable edit mode
        editBtn.innerHTML = '<span>👁️</span><span>View Mode</span>';
        editBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        actionButtons.style.display = 'flex';

        for (const input of inputs) {
            if (input.id !== 'email') {
                input.disabled = false;
            }
        }
    } else {
        // Disable edit mode
        editBtn.innerHTML = '<span>✏️</span><span>Edit Profile</span>';
        editBtn.style.background = 'linear-gradient(135deg, #3b82f6, #06b6d4)';
        actionButtons.style.display = 'none';

        for (const input of inputs) {
            input.disabled = true;
        }
    }
}

/**
 * Cancel edit and reload page
 */
function cancelEdit() {
    if (confirm('Are you sure? All unsaved changes will be lost.')) {
        globalThis.location.reload();
    }
}

/**
 * Change profile avatar to random emoji
 */
function changeAvatar() {
    const emojis = ['👨‍🏫', '👨‍💼', '👨‍🔬', '👨‍💻', '🧑‍🏫', '👩‍🏫', '👩‍💼', '👩‍🔬'];
    const currentAvatar = document.getElementById('profileAvatar').textContent;
    let randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    // Make sure we get a different emoji
    while (randomEmoji === currentAvatar) {
        randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    }
    
    document.getElementById('profileAvatar').textContent = randomEmoji;
    
    alert('🎨 Avatar changed! In production, you can upload your own image.');
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
        alert.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => alert.remove(), 300);
    }
}, 5000);
