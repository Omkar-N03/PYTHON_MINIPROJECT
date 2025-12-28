
let currentStep = 1;
const totalSteps = 3;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Video Background
    const video = document.querySelector('.video-background video');
    if (video) {
        video.addEventListener('error', () => {
            const bg = document.querySelector('.video-background');
            if (bg) {
                bg.style.opacity = '0';
                setTimeout(() => bg.style.display = 'none', 500);
            }
        });
        video.play().catch(() => { /* Autoplay prevented */ });
    }

    // 2. Initialize Form Submission
    const form = document.getElementById('createQuizForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // 3. Initialize AI Generation Button
    // Note: We use the ID 'ai-generate-btn' which matches your HTML update
    const aiBtn = document.getElementById('ai-generate-btn');
    if (aiBtn) {
        aiBtn.addEventListener('click', (e) => {
            e.preventDefault();
            generateQuestionsAI();
        });
    }

    // 4. Initial Setup
    updateProgressLine();
    renumberQuestions(); 
});

/* ==========================================================================
   NAVIGATION FUNCTIONS
   ========================================================================== */
function nextStep() {
    if (!validateStep(currentStep)) return;

    if (currentStep < totalSteps) {
        toggleStepClasses(currentStep, false);
        currentStep++;
        toggleStepClasses(currentStep, true);
        updateProgressLine();

        if (currentStep === 3) {
            populateReview();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function prevStep() {
    if (currentStep > 1) {
        toggleStepClasses(currentStep, false);
        currentStep--;
        toggleStepClasses(currentStep, true);
        updateProgressLine();
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function toggleStepClasses(step, isActive) {
    const formStep = document.querySelector(`.form-step[data-step="${step}"]`);
    const progressStep = document.querySelector(`.step[data-step="${step}"]`);
    
    if (isActive) {
        if (formStep) formStep.classList.add('active');
        if (progressStep) {
            progressStep.classList.add('active');
            progressStep.classList.remove('completed');
        }
    } else {
        if (formStep) formStep.classList.remove('active');
        if (progressStep) {
            progressStep.classList.remove('active');
            if (step < currentStep) progressStep.classList.add('completed');
        }
    }
}

function updateProgressLine() {
    const progressLine = document.getElementById('progressLine');
    if (progressLine) {
        const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressLine.style.width = `${percentage}%`;
    }
}

/* ==========================================================================
   VALIDATION LOGIC
   ========================================================================== */
function validateStep(step) {
    switch(step) {
        case 1: return validateStepOne();
        case 2: return validateStepTwo();
        case 3: return true;
        default: return true;
    }
}

function validateStepOne() {
    const ids = ['title', 'category', 'difficulty', 'total_marks', 'time_limit'];
    for (const id of ids) {
        const el = document.getElementById(id);
        if (!el || !el.value.trim() || (el.type === 'number' && parseInt(el.value) <= 0)) {
            showNotification(`⚠️ Please check the ${id.replace('_', ' ')} field`, 'warning');
            el?.focus();
            return false;
        }
    }
    return true;
}

function validateStepTwo() {
    const questions = document.querySelectorAll('.question-block');
    if (questions.length === 0) {
        showNotification('⚠️ Please add at least one question', 'warning');
        return false;
    }

    for (let i = 0; i < questions.length; i++) {
        if (!validateSingleQuestion(questions[i], i + 1)) return false;
    }
    return true;
}

function validateSingleQuestion(question, num) {
    const text = question.querySelector('textarea[name*="[text]"]')?.value.trim();
    if (!text) {
        showNotification(`⚠️ Question ${num} text is missing`, 'warning');
        question.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    const options = question.querySelectorAll('input[name*="[options][]"]');
    for (const opt of options) {
        if (!opt.value.trim()) {
            showNotification(`⚠️ Question ${num} has empty options`, 'warning');
            question.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return false;
        }
    }

    const correct = question.querySelector('input[type="radio"][name*="[correct]"]:checked');
    if (!correct) {
        showNotification(`⚠️ Select a correct answer for Question ${num}`, 'warning');
        question.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    return true;
}

/* ==========================================================================
   QUESTION MANAGEMENT
   ========================================================================== */

function addQuestion(data = null) {
    const isManual = !data || data instanceof Event;
    
    // Default empty structure
    const q = isManual ? { 
        text: '', 
        type: 'multiple_choice', 
        marks: 1, 
        explanation: '', 
        options: ['', '', '', ''], 
        correct: 0 
    } : data;

    const tempId = document.querySelectorAll('.question-block').length + 1;
    
    const html = `
        <div class="question-block" data-question="${tempId}">
            <div class="question-header">
                <h4>Question ${tempId}</h4>
                <button type="button" class="remove-question-btn" onclick="removeQuestion(this)" title="Remove">✕</button>
            </div>
            
            <div class="form-group">
                <label>Question Text *</label>
                <textarea name="questions[${tempId}][text]" required rows="3" placeholder="Enter your question...">${q.text}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Question Type</label>
                    <select name="questions[${tempId}][type]" onchange="toggleQuestionType(this)" required>
                        <option value="multiple_choice" ${q.type === 'multiple_choice' ? 'selected' : ''}>Multiple Choice</option>
                        <option value="true_false" ${q.type === 'true_false' ? 'selected' : ''}>True/False</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Marks *</label>
                    <input type="number" name="questions[${tempId}][marks]" value="${q.marks}" min="1" required>
                </div>
            </div>
            
            <div class="options-container">
                ${generateOptionsHTML(tempId, q.type, q.options, q.correct)}
            </div>
            
            <div class="form-group" style="margin-top: 20px;">
                <label>Explanation (Optional)</label>
                <textarea name="questions[${tempId}][explanation]" rows="2" placeholder="Explain the answer...">${q.explanation || ''}</textarea>
            </div>
        </div>
    `;
    
    document.getElementById('questionsContainer').insertAdjacentHTML('beforeend', html);
    
    // CRITICAL: Force renumbering to prevent ID conflicts
    renumberQuestions(); 
    
    if (isManual) {
        setTimeout(() => {
            const all = document.querySelectorAll('.question-block');
            all[all.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
    }
}

function generateOptionsHTML(id, type, vals = [], correct = 0) {
    if (type === 'true_false') {
        return `
            <div class="option-group">
                <input type="text" name="questions[${id}][options][]" value="True" readonly required>
                <input type="radio" name="questions[${id}][correct]" value="0" ${correct == 0 ? 'checked' : ''} required>
                <label>Correct</label>
            </div>
            <div class="option-group">
                <input type="text" name="questions[${id}][options][]" value="False" readonly required>
                <input type="radio" name="questions[${id}][correct]" value="1" ${correct == 1 ? 'checked' : ''}>
                <label>Correct</label>
            </div>
        `;
    }
    
    const labels = ['A', 'B', 'C', 'D'];
    const options = (vals && vals.length) ? vals : ['', '', '', ''];
    
    return options.map((val, i) => `
        <div class="option-group">
            <input type="text" name="questions[${id}][options][]" value="${val}" placeholder="Option ${labels[i]}" required>
            <input type="radio" name="questions[${id}][correct]" value="${i}" ${i === parseInt(correct) ? 'checked' : ''} ${i === 0 ? 'required' : ''}>
            <label>Correct</label>
        </div>
    `).join('');
}

function toggleQuestionType(select) {
    const block = select.closest('.question-block');
    const id = block.dataset.question;
    block.querySelector('.options-container').innerHTML = generateOptionsHTML(id, select.value);
}

function removeQuestion(btn) {
    if (confirm('Are you sure you want to remove this question?')) {
        const block = btn.closest('.question-block');
        block.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            block.remove();
            renumberQuestions();
        }, 300);
    }
}

function renumberQuestions() {
    const questions = document.querySelectorAll('.question-block');
    questions.forEach((q, index) => {
        const newNum = index + 1;
        q.dataset.question = newNum;
        q.querySelector('h4').textContent = `Question ${newNum}`;
        
        // Regex replaces "questions[OLD_NUM]" with "questions[NEW_NUM]"
        q.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.name) {
                input.name = input.name.replace(/questions\[.*?\]/, `questions[${newNum}]`);
            }
        });
    });
    updateQuestionsSummary();
}

function updateQuestionsSummary() {
    const count = document.querySelectorAll('.question-block').length;
    const summary = document.getElementById('questionsSummary');
    const countEl = document.getElementById('questionsCount');
    
    if (countEl) countEl.textContent = count;
    if (summary) summary.style.display = count > 0 ? 'block' : 'none';
}

/* ==========================================================================
   AI GENERATION LOGIC (UPDATED)
   ========================================================================== */
async function generateQuestionsAI() {
    const topic = document.getElementById('aiTopic')?.value.trim();
    const num = document.getElementById('aiNumQuestions')?.value || '5';
    const diff = document.getElementById('aiDifficulty')?.value || 'medium';
    // Get the new Instructions field
    const instructions = document.getElementById('aiInstructions')?.value.trim();

    // ERROR FIX: Removed the quizId check completely
    if (!topic) return showNotification('⚠️ Please enter a topic', 'warning');

    showAILoading(true);

    try {
        // Use the URL from Django Data if available, fallback to hardcoded
        const url = (typeof djangoData !== 'undefined' && djangoData.generateQuestionsUrl) 
            ? djangoData.generateQuestionsUrl 
            : '/quiz/api/generate-questions/';

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ 
                topic: topic, 
                num_questions: num, 
                difficulty: diff, 
                instructions: instructions // Send instructions to backend
                // No quiz_id needed here
            })
        });

        const data = await response.json();

        if (data.status === 'success') {
            const count = data.questions ? data.questions.length : 0;
            showNotification(`✅ Generated ${count} questions!`, 'success');
            
            // Loop through questions and add them WITHOUT reloading
            if (data.questions && Array.isArray(data.questions)) {
                data.questions.forEach(q => addQuestion(q));
            }
            
            showAILoading(false);
            
            // Optional: scroll to the new questions
            const container = document.getElementById('questionsContainer');
            if (container.lastElementChild) {
                container.lastElementChild.scrollIntoView({ behavior: 'smooth' });
            }

        } else {
            showNotification(`❌ Error: ${data.message}`, 'error');
            showAILoading(false);
        }

    } catch (error) {
        console.error('Error generating questions:', error);
        showNotification('❌ Server connection failed.', 'error');
        showAILoading(false);
    }
}

function showAILoading(show) {
    const loading = document.getElementById('aiLoading');
    const btn = document.getElementById('ai-generate-btn');
    
    if (loading) loading.style.display = show ? 'block' : 'none';
    if (btn) {
        btn.disabled = show;
        btn.innerHTML = show ? 'Generating... <i class="fas fa-spinner fa-spin"></i>' : '✨ Generate Questions with AI';
    }
}

/* ==========================================================================
   REVIEW & SUBMISSION
   ========================================================================== */
function populateReview() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;
    
    const getVal = (id) => document.getElementById(id)?.value || '-';
    
    const questionsHTML = [...document.querySelectorAll('.question-block')].map((q, i) => {
        const text = q.querySelector('textarea[name*="[text]"]')?.value;
        const marks = q.querySelector('input[name*="[marks]"]')?.value;
        const options = [...q.querySelectorAll('input[name*="[options][]"]')].map(o => o.value);
        const correctVal = q.querySelector('input[type="radio"][name*="[correct]"]:checked')?.value || 0;
        
        return `
            <div class="review-question">
                <h4>Question ${i + 1} (${marks} marks)</h4>
                <p>${text}</p>
                <div class="review-options">
                    ${options.map((opt, idx) => `
                        <div class="review-option ${idx == correctVal ? 'correct' : ''}">
                            ${idx == correctVal ? '✅' : '○'} ${opt}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    reviewContent.innerHTML = `
        <div class="review-section">
            <h3>📝 Quiz Details</h3>
            <div class="review-details">
                <div class="review-item"><strong>Title:</strong> ${getVal('title')}</div>
                <div class="review-item"><strong>Subject:</strong> ${getVal('category')}</div>
                <div class="review-item"><strong>Difficulty:</strong> ${getVal('difficulty')}</div>
                <div class="review-item"><strong>Total Marks:</strong> ${getVal('total_marks')}</div>
            </div>
        </div>
        <div class="review-section">
            <h3>❓ Questions</h3>
            ${questionsHTML}
        </div>
    `;
}

function handleFormSubmit(e) {
    if (!validateStepTwo()) {
        e.preventDefault();
        return false;
    }

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span>⏳</span><span>Creating Quiz...</span>';
    }

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'total_questions';
    input.value = document.querySelectorAll('.question-block').length;
    e.target.appendChild(input);
    
    return true;
}

/* ==========================================================================
   UTILITIES
   ========================================================================== */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = { success: '#4caf50', warning: '#ff9800', error: '#f44336', info: '#2196f3' };
    
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 25px;
        background: ${colors[type] || colors.info}; color: white;
        border-radius: 10px; z-index: 10000; box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

function getCookie(name) {
    if (!document.cookie) return null;
    const cookie = document.cookie.split('; ').find(row => row.startsWith(name + '='));
    return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}

/* ==========================================================================
   STYLES
   ========================================================================== */
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut { to { opacity: 0; transform: scale(0.95); } }
    .review-section { background: rgba(15, 10, 30, 0.6); border: 2px solid rgba(59, 130, 246, 0.2); border-radius: 15px; padding: 1.5rem; margin-bottom: 2rem; }
    .review-section h3 { color: #3b82f6; margin-bottom: 1rem; }
    .review-details { display: grid; gap: 0.75rem; color: #cbd5e1; }
    .review-question { background: rgba(15, 10, 30, 0.6); border: 2px solid rgba(59, 130, 246, 0.2); border-radius: 15px; padding: 1.5rem; margin-bottom: 1rem; }
    .review-option { color: #94a3b8; padding: 8px; border-radius: 5px; background: rgba(0,0,0,0.2); margin-top: 5px; }
    .review-option.correct { color: #22c55e; background: rgba(34, 197, 94, 0.1); font-weight: 600; }
`;
document.head.appendChild(style);

Object.assign(globalThis, { 
    nextStep, prevStep, addQuestion, removeQuestion, 
    toggleQuestionType, generateQuestionsAI 
});
