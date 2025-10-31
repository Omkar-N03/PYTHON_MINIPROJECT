/**
 * Create Quiz - Teacher Quiz Creation Interface
 * Handles multi-step form, question management, AI generation, and validation
 * Enhanced with modern features and better UX
 */

let currentStep = 1;
let questionCount = 0;
const totalSteps = 3;

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeVideo();
    initializeForm();
});

/**
 * Initialize video background with fallback
 */
function initializeVideo() {
    const video = document.querySelector('.video-background video');
    if (video) {
        video.addEventListener('error', () => {
            console.warn('Video failed to load. Using gradient background.');
            const videoBg = document.querySelector('.video-background');
            if (videoBg) {
                videoBg.style.opacity = '0';
                videoBg.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    videoBg.style.display = 'none';
                }, 500);
            }
        });

        // Ensure video plays
        video.play().catch(e => {
            console.warn('Video autoplay failed:', e);
        });
    }
}

/**
 * Initialize form
 */
function initializeForm() {
    // Add form submission handler
    const form = document.getElementById('createQuizForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }

    // Update progress line initially
    updateProgressLine();
}

/**
 * Navigate to next step
 */
function nextStep() {
    if (!validateStep(currentStep)) {
        return;
    }

    if (currentStep < totalSteps) {
        // Hide current step
        const currentFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const currentProgressStep = document.querySelector(`.step[data-step="${currentStep}"]`);
        
        if (currentFormStep) currentFormStep.classList.remove('active');
        if (currentProgressStep) {
            currentProgressStep.classList.remove('active');
            currentProgressStep.classList.add('completed');
        }

        currentStep++;

        // Show next step
        const nextFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const nextProgressStep = document.querySelector(`.step[data-step="${currentStep}"]`);
        
        if (nextFormStep) nextFormStep.classList.add('active');
        if (nextProgressStep) nextProgressStep.classList.add('active');

        updateProgressLine();

        // Populate review on step 3
        if (currentStep === 3) {
            populateReview();
        }

        // Smooth scroll to top
        globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Navigate to previous step
 */
function prevStep() {
    if (currentStep > 1) {
        // Hide current step
        const currentFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const currentProgressStep = document.querySelector(`.step[data-step="${currentStep}"]`);
        
        if (currentFormStep) currentFormStep.classList.remove('active');
        if (currentProgressStep) currentProgressStep.classList.remove('active');

        currentStep--;

        // Show previous step
        const prevFormStep = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        const prevProgressStep = document.querySelector(`.step[data-step="${currentStep}"]`);
        
        if (prevFormStep) prevFormStep.classList.add('active');
        if (prevProgressStep) {
            prevProgressStep.classList.add('active');
            prevProgressStep.classList.remove('completed');
        }

        updateProgressLine();

        // Smooth scroll to top
        globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Update progress line based on current step
 */
function updateProgressLine() {
    const progressLine = document.getElementById('progressLine');
    if (progressLine) {
        const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
        progressLine.style.width = `${percentage}%`;
    }
}

/**
 * Validate step based on step number
 */
function validateStep(step) {
    switch(step) {
        case 1:
            return validateStepOne();
        case 2:
            return validateStepTwo();
        case 3:
            return true; // Review step doesn't need validation
        default:
            return true;
    }
}

/**
 * Validate step 1 (Basic Info)
 */
function validateStepOne() {
    const title = document.getElementById('title')?.value.trim();
    const category = document.getElementById('category')?.value;
    const difficulty = document.getElementById('difficulty')?.value;
    const marks = document.getElementById('total_marks')?.value;
    const duration = document.getElementById('time_limit')?.value;

    if (!title) {
        showNotification('⚠️ Please enter a quiz title', 'warning');
        document.getElementById('title')?.focus();
        return false;
    }

    if (!category) {
        showNotification('⚠️ Please select a subject', 'warning');
        document.getElementById('category')?.focus();
        return false;
    }

    if (!difficulty) {
        showNotification('⚠️ Please select difficulty level', 'warning');
        document.getElementById('difficulty')?.focus();
        return false;
    }

    // FIXED: Use Number.parseInt instead of parseInt
    if (!marks || Number.parseInt(marks, 10) <= 0) {
        showNotification('⚠️ Please enter valid total marks', 'warning');
        document.getElementById('total_marks')?.focus();
        return false;
    }

    // FIXED: Use Number.parseInt instead of parseInt
    if (!duration || Number.parseInt(duration, 10) <= 0) {
        showNotification('⚠️ Please enter valid duration', 'warning');
        document.getElementById('time_limit')?.focus();
        return false;
    }

    return true;
}

/**
 * Validate step 2 (Questions)
 */
function validateStepTwo() {
    const questions = document.querySelectorAll('.question-block');
    
    if (questions.length === 0) {
        showNotification('⚠️ Please add at least one question', 'warning');
        return false;
    }

    // Validate each question
    for (const [index, question] of [...questions].entries()) {
        if (!validateSingleQuestion(question, index + 1)) {
            return false;
        }
    }

    return true;
}

/**
 * Validate a single question
 */
function validateSingleQuestion(question, questionNum) {
    const questionText = question.querySelector('textarea[name*="[text]"]')?.value.trim();
    const options = question.querySelectorAll('input[name*="[options][]"]');
    const correctAnswer = question.querySelector('input[type="radio"][name*="[correct]"]:checked');

    if (!questionText) {
        showNotification(`⚠️ Please enter text for Question ${questionNum}`, 'warning');
        question.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    // Check if all options are filled
    let emptyOption = false;
    for (const option of options) {
        if (!option.value.trim()) {
            emptyOption = true;
            break;
        }
    }

    if (emptyOption) {
        showNotification(`⚠️ Please fill in all options for Question ${questionNum}`, 'warning');
        question.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    if (!correctAnswer) {
        showNotification(`⚠️ Please select the correct answer for Question ${questionNum}`, 'warning');
        question.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }

    return true;
}

/**
 * Add a new question manually
 */
function addQuestion() {
    questionCount++;
    const container = document.getElementById('questionsContainer');
    
    const questionHTML = `
        <div class="question-block" data-question="${questionCount}">
            <div class="question-header">
                <h4>Question ${questionCount}</h4>
                <button type="button" class="remove-question-btn" onclick="removeQuestion(this)" title="Remove question">✕</button>
            </div>
            
            <div class="form-group">
                <label>Question Text *</label>
                <textarea name="questions[${questionCount}][text]" required rows="3" placeholder="Enter your question here..."></textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Question Type</label>
                    <select name="questions[${questionCount}][type]" onchange="toggleQuestionType(this)" required>
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True/False</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Marks *</label>
                    <input type="number" name="questions[${questionCount}][marks]" value="1" min="1" required>
                </div>
            </div>
            
            <div class="options-container">
                ${generateOptionsHTML(questionCount, 'multiple_choice')}
            </div>
            
            <div class="form-group" style="margin-top: 20px;">
                <label>Explanation (Optional)</label>
                <textarea name="questions[${questionCount}][explanation]" rows="2" placeholder="Explain why this answer is correct..."></textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
    updateQuestionsSummary();
    
    // Scroll to new question
    setTimeout(() => {
        const newQuestion = container.lastElementChild;
        newQuestion.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

/**
 * Generate options HTML based on question type
 */
function generateOptionsHTML(questionNum, type) {
    if (type === 'true_false') {
        return `
            <div class="option-group">
                <input type="text" name="questions[${questionNum}][options][]" value="True" readonly required>
                <input type="radio" name="questions[${questionNum}][correct]" value="0" required>
                <label>Correct</label>
            </div>
            <div class="option-group">
                <input type="text" name="questions[${questionNum}][options][]" value="False" readonly required>
                <input type="radio" name="questions[${questionNum}][correct]" value="1">
                <label>Correct</label>
            </div>
        `;
    }
    
    return ['A', 'B', 'C', 'D'].map((letter, idx) => `
        <div class="option-group">
            <input type="text" name="questions[${questionNum}][options][]" placeholder="Option ${letter}" required>
            <input type="radio" name="questions[${questionNum}][correct]" value="${idx}" ${idx === 0 ? 'required' : ''}>
            <label>Correct</label>
        </div>
    `).join('');
}

/**
 * Toggle question type (Multiple Choice vs True/False)
 */
function toggleQuestionType(select) {
    const optionsContainer = select.closest('.question-block').querySelector('.options-container');
    const type = select.value;
    const questionNum = select.closest('.question-block').dataset.question;
    
    optionsContainer.innerHTML = generateOptionsHTML(questionNum, type);
}

/**
 * Remove question
 */
function removeQuestion(btn) {
    if (confirm('Are you sure you want to remove this question?')) {
        const questionBlock = btn.closest('.question-block');
        questionBlock.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            questionBlock.remove();
            updateQuestionsSummary();
            renumberQuestions();
        }, 300);
    }
}

/**
 * Renumber questions after removal
 */
function renumberQuestions() {
    const questions = document.querySelectorAll('.question-block');
    
    for (const [index, question] of [...questions].entries()) {
        const newNum = index + 1;
        question.dataset.question = newNum;
        question.querySelector('h4').textContent = `Question ${newNum}`;
    }
    
    questionCount = questions.length;
}

/**
 * Update questions summary
 */
function updateQuestionsSummary() {
    const count = document.querySelectorAll('.question-block').length;
    const summary = document.getElementById('questionsSummary');
    const countElement = document.getElementById('questionsCount');
    
    if (countElement) countElement.textContent = count;
    if (summary) summary.style.display = count > 0 ? 'block' : 'none';
}

/**
 * Add generated question from AI
 */
function addGeneratedQuestion(questionData) {
    questionCount++;
    const container = document.getElementById('questionsContainer');
    
    const questionHTML = `
        <div class="question-block" data-question="${questionCount}">
            <div class="question-header">
                <h4>Question ${questionCount}</h4>
                <button type="button" class="remove-question-btn" onclick="removeQuestion(this)" title="Remove question">✕</button>
            </div>
            
            <div class="form-group">
                <label>Question Text *</label>
                <textarea name="questions[${questionCount}][text]" required rows="3">${questionData.text}</textarea>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label>Question Type</label>
                    <select name="questions[${questionCount}][type]" onchange="toggleQuestionType(this)" required>
                        <option value="multiple_choice" ${questionData.type === 'multiple_choice' ? 'selected' : ''}>Multiple Choice</option>
                        <option value="true_false" ${questionData.type === 'true_false' ? 'selected' : ''}>True/False</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>Marks *</label>
                    <input type="number" name="questions[${questionCount}][marks]" value="${questionData.marks}" min="1" required>
                </div>
            </div>
            
            <div class="options-container">
                ${questionData.options.map((option, idx) => `
                    <div class="option-group">
                        <input type="text" name="questions[${questionCount}][options][]" value="${option}" placeholder="Option ${idx + 1}" required>
                        <input type="radio" name="questions[${questionCount}][correct]" value="${idx}" ${idx === questionData.correctAnswer ? 'checked' : ''} ${idx === 0 ? 'required' : ''}>
                        <label>Correct</label>
                    </div>
                `).join('')}
            </div>
            
            <div class="form-group" style="margin-top: 20px;">
                <label>Explanation (Optional)</label>
                <textarea name="questions[${questionCount}][explanation]" rows="2" placeholder="Explain why this answer is correct...">${questionData.explanation || ''}</textarea>
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', questionHTML);
}

/**
 * Generate questions using AI (Simulated)
 */
function generateQuestionsAI() {
    const topic = document.getElementById('aiTopic')?.value.trim();
    // FIXED: Use Number.parseInt instead of parseInt
    const numQuestions = Number.parseInt(document.getElementById('aiNumQuestions')?.value || '10', 10);
    const difficulty = document.getElementById('aiDifficulty')?.value || 'medium';
    const questionType = document.getElementById('aiQuestionType')?.value || 'multiple_choice';
    
    // Validation
    if (!topic) {
        showNotification('⚠️ Please enter a topic for the questions', 'warning');
        document.getElementById('aiTopic')?.focus();
        return;
    }
    
    // Show loading
    showAILoading(true);
    
    // Simulate AI generation
    setTimeout(() => {
        const questions = generateSampleQuestions(topic, numQuestions, difficulty, questionType);
        
        // Clear existing questions
        document.getElementById('questionsContainer').innerHTML = '';
        questionCount = 0;
        
        // Add generated questions
        for (const q of questions) {
            addGeneratedQuestion(q);
        }
        
        // Hide loading
        showAILoading(false);
        
        // Update summary
        updateQuestionsSummary();
        
        // Success notification
        showNotification(`✅ Successfully generated ${numQuestions} questions about "${topic}"!`, 'success');
        
        // Scroll to questions
        document.getElementById('questionsContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
    }, 2500);
}

/**
 * Generate sample questions (AI simulation)
 */
function generateSampleQuestions(topic, num, difficulty, type) {
    const questions = [];
    const difficultyMarks = { easy: 1, medium: 2, hard: 3 };
    
    for (let i = 0; i < num; i++) {
        const isTrueFalse = type === 'true_false' || (type === 'mixed' && i % 2 === 1);
        
        const question = {
            text: `Question ${i + 1}: What is an important concept in ${topic}?`,
            type: isTrueFalse ? 'true_false' : 'multiple_choice',
            options: isTrueFalse 
                ? ['True', 'False']
                : [
                    `Correct answer about ${topic}`,
                    `Incorrect option A`,
                    `Incorrect option B`,
                    `Incorrect option C`
                ],
            correctAnswer: 0,
            marks: difficultyMarks[difficulty] || 1,
            explanation: `This answer is correct because it accurately describes the fundamental principle of ${topic}.`
        };
        
        questions.push(question);
    }
    
    return questions;
}

/**
 * Show/hide AI loading
 */
function showAILoading(show) {
    const loading = document.getElementById('aiLoading');
    const btn = document.querySelector('.btn-ai');
    const btnText = document.getElementById('generateBtnText');
    
    if (loading && btn && btnText) {
        if (show) {
            loading.style.display = 'block';
            btn.disabled = true;
            btnText.textContent = 'Generating...';
        } else {
            loading.style.display = 'none';
            btn.disabled = false;
            btnText.textContent = 'Generate Questions with AI';
        }
    }
}

/**
 * Populate review step
 */
function populateReview() {
    const reviewContent = document.getElementById('reviewContent');
    if (!reviewContent) return;
    
    const title = document.getElementById('title')?.value || '';
    const category = document.getElementById('category')?.value || '';
    const difficulty = document.getElementById('difficulty')?.value || '';
    const marks = document.getElementById('total_marks')?.value || '';
    const duration = document.getElementById('time_limit')?.value || '';
    const description = document.getElementById('description')?.value || '';

    const questions = document.querySelectorAll('.question-block');
    let questionsHTML = '';

    for (const [index, q] of [...questions].entries()) {
        const questionText = q.querySelector('textarea[name*="[text]"]')?.value || '';
        const questionMarks = q.querySelector('input[name*="[marks]"]')?.value || '1';
        const options = [...q.querySelectorAll('input[name*="[options][]"]')].map(o => o.value);
        const correctRadio = q.querySelector('input[type="radio"]:checked');
        const correctIndex = correctRadio ? correctRadio.value : '0';

        questionsHTML += `
            <div class="review-question">
                <h4>Question ${index + 1} (${questionMarks} marks)</h4>
                <p>${questionText}</p>
                <div class="review-options">
                    ${options.map((opt, i) => {
                        const isCorrect = String(i) === String(correctIndex);
                        const icon = isCorrect ? '✅' : '○';
                        const className = isCorrect ? 'correct' : '';
                        return `<div class="review-option ${className}">${icon} ${opt}</div>`;
                    }).join('')}
                </div>
            </div>
        `;
    }

    // FIXED: Extract nested ternary into separate function
    const capitalizedDifficulty = getCapitalizedDifficulty(difficulty);

    reviewContent.innerHTML = `
        <div class="review-section">
            <h3>📝 Quiz Details</h3>
            <div class="review-details">
                <div class="review-item"><strong>Title:</strong> ${title}</div>
                <div class="review-item"><strong>Subject:</strong> ${category}</div>
                <div class="review-item"><strong>Difficulty:</strong> ${capitalizedDifficulty}</div>
                <div class="review-item"><strong>Total Marks:</strong> ${marks}</div>
                <div class="review-item"><strong>Duration:</strong> ${duration} minutes</div>
                ${description ? `<div class="review-item"><strong>Description:</strong> ${description}</div>` : ''}
                <div class="review-item"><strong>Total Questions:</strong> ${questions.length}</div>
            </div>
        </div>
        
        <div class="review-section">
            <h3>❓ Questions Preview</h3>
            ${questionsHTML}
        </div>
    `;
}

/**
 * Get capitalized difficulty level
 * FIXED: Extracted from nested ternary
 */
function getCapitalizedDifficulty(difficulty) {
    if (!difficulty) return '';
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
    // Final validation
    if (!validateStepTwo()) {
        e.preventDefault();
        showNotification('❌ Please fix validation errors before submitting', 'error');
        return false;
    }

    // Add hidden field for total questions
    const totalQuestionsInput = document.createElement('input');
    totalQuestionsInput.type = 'hidden';
    totalQuestionsInput.name = 'total_questions';
    totalQuestionsInput.value = document.querySelectorAll('.question-block').length;
    e.target.appendChild(totalQuestionsInput);

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span>⏳</span><span>Creating Quiz...</span>';
    }

    return true;
}

/**
 * Show notification
 * FIXED: Extracted nested ternary for background color
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // FIXED: Use helper function instead of nested ternary
    const backgroundColor = getNotificationBackgroundColor(type);
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${backgroundColor};
        color: white;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
        max-width: 400px;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * Get notification background color based on type
 * FIXED: Extracted from nested ternary
 */
function getNotificationBackgroundColor(type) {
    switch(type) {
        case 'success':
            return '#4caf50';
        case 'warning':
            return '#ff9800';
        case 'error':
            return '#f44336';
        default:
            return '#2196f3';
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: scale(0.95);
        }
    }
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    @keyframes slideOutRight {
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
    .review-section {
        background: rgba(15, 10, 30, 0.6);
        border: 2px solid rgba(59, 130, 246, 0.2);
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 2rem;
    }
    .review-section h3 {
        color: #3b82f6;
        margin-bottom: 1rem;
    }
    .review-details {
        display: grid;
        gap: 0.75rem;
        color: #cbd5e1;
    }
    .review-item strong {
        color: #3b82f6;
    }
    .review-question {
        background: rgba(15, 10, 30, 0.6);
        border: 2px solid rgba(59, 130, 246, 0.2);
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 1rem;
    }
    .review-question h4 {
        color: #3b82f6;
        margin-bottom: 1rem;
    }
    .review-question p {
        color: #cbd5e1;
        margin-bottom: 1rem;
    }
    .review-options {
        display: grid;
        gap: 0.5rem;
    }
    .review-option {
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-radius: 5px;
        background: rgba(0,0,0,0.2);
    }
    .review-option.correct {
        color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
        font-weight: 600;
    }
`;
document.head.appendChild(style);

// Export functions for global access
globalThis.nextStep = nextStep;
globalThis.prevStep = prevStep;
globalThis.addQuestion = addQuestion;
globalThis.removeQuestion = removeQuestion;
globalThis.toggleQuestionType = toggleQuestionType;
globalThis.generateQuestionsAI = generateQuestionsAI;
