// Quiz Application - Main Script
let quizData = null;
let currentQuestionIndex = 0;
let answers = {};
let flaggedQuestions = new Set();
let timeRemaining = 0;
let timerInterval = null;
let isSubmitting = false;


/**
 * Get CSRF token from cookies or meta tag
 */
function getCookie(name) {
    // First try to get from cookies
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const trimmedCookie = cookie.trim();
            if (trimmedCookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(trimmedCookie.substring(name.length + 1));
                break;
            }
        }
    }
    
    // If not in cookies, try meta tag
    if (!cookieValue && name === 'csrftoken') {
        const csrfElement = document.querySelector('meta[name="csrf-token"]');
        if (csrfElement) {
            cookieValue = csrfElement.getAttribute('content');
        }
    }
    
    return cookieValue;
}


/**
 * Initialize quiz data and start
 */
function initializeQuiz() {
    const questionsElement = document.getElementById('questions-data');
    if (!questionsElement) {
        console.error('No questions data element found');
        alert('Error: Quiz data not found. Please refresh the page.');
        return;
    }

    try {
        const questionsData = JSON.parse(questionsElement.textContent);
        
        if (!globalThis.quizDataFromDjango) {
            console.error('Quiz metadata not found');
            alert('Error: Quiz configuration missing. Please refresh the page.');
            return;
        }

        quizData = {
            ...globalThis.quizDataFromDjango,
            questions: questionsData
        };

        console.log('Quiz data loaded:', {
            title: quizData.title,
            questionCount: quizData.questions.length,
            duration: quizData.duration
        });

        if (!quizData.questions || quizData.questions.length === 0) {
            alert('This quiz has no questions yet.');
            return;
        }

        startQuiz();
    } catch (error) {
        console.error('Error parsing quiz data:', error);
        alert('Error loading quiz data. Please refresh the page.');
    }
}


/**
 * Start the quiz
 */
function startQuiz() {
    timeRemaining = quizData.duration * 60;
    document.getElementById('quizTitle').textContent = quizData.title;
    initializeQuestionGrid();
    loadQuestion(currentQuestionIndex);
    startTimer();
}


/**
 * Initialize question navigation grid
 */
function initializeQuestionGrid() {
    const grid = document.getElementById('questionGrid');
    if (!grid) {
        console.error('Question grid element not found');
        return;
    }

    grid.innerHTML = '';
    
    for (let i = 0; i < quizData.questions.length; i++) {
        const button = document.createElement('button');
        button.className = 'question-dot';
        button.textContent = i + 1;
        button.onclick = () => goToQuestion(i);
        button.setAttribute('aria-label', `Question ${i + 1}`);
        button.setAttribute('type', 'button');
        grid.appendChild(button);
    }
}


/**
 * Render question options
 */
function renderOptions(question, container) {
    if (!question.options || question.options.length === 0) {
        container.innerHTML = '<p style="color: #ef4444; font-weight: 600;">⚠️ No options available for this question</p>';
        return;
    }

    for (const [optIndex, option] of question.options.entries()) {
        const optionText = typeof option === 'string' ? option : (option.text || '');
        const optionId = typeof option === 'object' ? option.id : optIndex;

        const optDiv = document.createElement('div');
        optDiv.className = 'option';
        optDiv.setAttribute('role', 'radio');
        optDiv.setAttribute('aria-checked', answers[question.id] === optionId ? 'true' : 'false');

        if (answers[question.id] === optionId) {
            optDiv.classList.add('selected');
        }

        optDiv.onclick = (e) => selectOption(question.id, optionId, e);
        
        optDiv.innerHTML = `
            <div class="option-radio"></div>
            <span class="option-label">${String.fromCodePoint(65 + optIndex)})</span>
            <span class="option-text">${optionText}</span>
        `;
        
        container.appendChild(optDiv);
    }
}


/**
 * Update navigation buttons
 */
function updateNavigationButtons(index) {
    const btnPrevious = document.getElementById('btnPrevious');
    const btnNext = document.getElementById('btnNext');
    
    if (btnPrevious) {
        btnPrevious.disabled = index === 0;
    }

    if (btnNext) {
        if (index === quizData.questions.length - 1) {
            btnNext.innerHTML = '<span>Finish →</span>';
        } else {
            btnNext.innerHTML = '<span>Next →</span>';
        }
    }
}


/**
 * Update flag button state
 */
function updateFlagButton(questionId) {
    const flagBtn = document.getElementById('btnFlag');
    if (flagBtn) {
        if (flaggedQuestions.has(questionId)) {
            flagBtn.classList.add('flagged');
        } else {
            flagBtn.classList.remove('flagged');
        }
    }
}


/**
 * Load and display a specific question
 */
function loadQuestion(index) {
    if (!quizData?.questions?.[index]) {
        console.error('Invalid question index:', index);
        return;
    }

    const question = quizData.questions[index];

    document.getElementById('questionNumber').textContent = `Question ${index + 1}`;
    document.getElementById('questionMarks').textContent = `${question.marks || 1} Marks`;
    document.getElementById('questionText').textContent = question.text || 'No question text';

    document.getElementById('progressCount').textContent = `${index + 1} of ${quizData.questions.length}`;
    const progressPercent = ((index + 1) / quizData.questions.length) * 100;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;

    const container = document.getElementById('optionsContainer');
    container.innerHTML = '';
    renderOptions(question, container);

    updateNavigationButtons(index);
    updateFlagButton(question.id);
    updateQuestionGrid();
}


/**
 * Select an option
 */
function selectOption(questionId, optionId, event) {
    answers[questionId] = optionId;
    
    const options = document.querySelectorAll('.option');
    for (const opt of options) {
        opt.classList.remove('selected');
        opt.setAttribute('aria-checked', 'false');
    }
    
    event.currentTarget.classList.add('selected');
    event.currentTarget.setAttribute('aria-checked', 'true');
    
    updateQuestionGrid();
}


/**
 * Update question grid status
 */
function updateQuestionGrid() {
    const dots = document.querySelectorAll('.question-dot');
    
    for (const [index, dot] of dots.entries()) {
        const question = quizData.questions[index];
        dot.className = 'question-dot';

        if (index === currentQuestionIndex) {
            dot.classList.add('current');
        } else if (answers[question.id] !== undefined) {
            dot.classList.add('answered');
        }

        if (flaggedQuestions.has(question.id)) {
            dot.classList.add('flagged');
        }
    }
}


/**
 * Navigate to previous question
 */
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion(currentQuestionIndex);
    }
}


/**
 * Navigate to next question
 */
function nextQuestion() {
    if (currentQuestionIndex < quizData.questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion(currentQuestionIndex);
    } else {
        openSubmitModal();
    }
}


/**
 * Go to specific question
 */
function goToQuestion(index) {
    if (index >= 0 && index < quizData.questions.length) {
        currentQuestionIndex = index;
        loadQuestion(currentQuestionIndex);
    }
}


/**
 * Toggle flag
 */
function toggleFlag() {
    const questionId = quizData.questions[currentQuestionIndex].id;
    
    if (flaggedQuestions.has(questionId)) {
        flaggedQuestions.delete(questionId);
    } else {
        flaggedQuestions.add(questionId);
    }
    
    const flagBtn = document.getElementById('btnFlag');
    if (flagBtn) {
        flagBtn.classList.toggle('flagged');
    }
    
    updateQuestionGrid();
}


/**
 * Start timer
 */
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining === 300) {
            const timerContainer = document.getElementById('timerContainer');
            if (timerContainer) {
                timerContainer.classList.add('warning');
            }
            alert('⚠️ Warning: Only 5 minutes remaining!');
        }
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('⏰ Time is up! Auto-submitting your quiz...');
            confirmSubmit();
        }
    }, 1000);
}


/**
 * Update timer display
 */
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    const timerElement = document.getElementById('timer');
    if (timerElement) {
        timerElement.textContent = display;
        
        if (timeRemaining <= 300) {
            timerElement.style.color = '#ef4444';
        }
    }
}


/**
 * Open submit modal
 */
function openSubmitModal() {
    const answered = Object.keys(answers).length;
    const unanswered = quizData.questions.length - answered;
    const flagged = flaggedQuestions.size;
    
    document.getElementById('modalAnswered').textContent = answered;
    document.getElementById('modalUnanswered').textContent = unanswered;
    document.getElementById('modalFlagged').textContent = flagged;
    
    const modal = document.getElementById('submitModal');
    if (modal) {
        modal.showModal();
    }
}


/**
 * Close submit modal
 */
function closeSubmitModal() {
    const modal = document.getElementById('submitModal');
    if (modal) {
        modal.close();
    }
}


/**
 * Confirm and submit quiz
 */
async function confirmSubmit() {
    if (isSubmitting) {
        console.warn('Already submitting quiz, ignoring duplicate request');
        return;
    }
    
    isSubmitting = true;
    console.log('========== QUIZ SUBMISSION STARTED ==========');

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    closeSubmitModal();

    const submitBtn = document.getElementById('btnConfirmSubmit');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = '⏳ Submitting...';
    }

    const csrftoken = getCookie('csrftoken');
    if (!csrftoken) {
        console.error('❌ CSRF token not found!');
        alert('⚠️ Security Error: CSRF token missing.\n\nPlease refresh the page and try again.');
        isSubmitting = false;
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Now';
        }
        return;
    }

    console.log('✅ CSRF token found');
    
    const submissionData = {
        answers: answers,
        time_spent: quizData.duration * 60 - timeRemaining
    };

    console.log('📋 Submission Data:', {
        quiz_id: quizData.id,
        answersCount: Object.keys(answers).length,
        time_spent: submissionData.time_spent,
        csrf_token: 'Present'
    });

    try {
        const submitUrl = `/quiz/student/quiz/${quizData.id}/submit/`;
        console.log('🌐 Fetch URL:', submitUrl);
        console.log('📦 Request Body:', JSON.stringify(submissionData));

        const response = await fetch(submitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify(submissionData),
            credentials: 'same-origin',
            keepalive: true
        });

        console.log('📬 Response Status:', response.status);
        console.log('📬 Response Headers:', {
            'content-type': response.headers.get('content-type'),
            'content-length': response.headers.get('content-length')
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ HTTP Error Response:', errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Non-JSON Response:', text);
            throw new Error(`Expected JSON but got: ${contentType || 'unknown'}`);
        }

        const result = await response.json();
        console.log('✅ Response JSON:', result);

        if (!result.success) {
            console.error('❌ Server returned success=false:', result.error);
            throw new Error(result.error || 'Server returned error');
        }

        console.log('🎉 QUIZ SUBMITTED SUCCESSFULLY');
        console.log('📊 Final Stats:', {
            score: result.score,
            max_score: result.max_score,
            percentage: result.percentage,
            passed: result.passed,
            attempt_id: result.attempt_id
        });

        const scoreMessage = `✅ Quiz submitted successfully!\n\nScore: ${result.score}/${result.max_score}\nPercentage: ${result.percentage.toFixed(2)}%\n\nRedirecting to results...`;
        alert(scoreMessage);
        
        setTimeout(() => {
            const resultUrl = `/quiz/student/attempt/${result.attempt_id}/result/`;
            console.log('🔗 Redirecting to:', resultUrl);
            globalThis.location.href = resultUrl;
        }, 1500);

    } catch (error) {
        console.error('❌ SUBMISSION ERROR:', error);
        console.error('📋 Error Stack:', error.stack);
        
        isSubmitting = false;
        
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Now';
        }

        const errorMessage = `❌ Failed to submit quiz!\n\nError: ${error.message}\n\nPlease check your connection and try again.`;
        alert(errorMessage);

        if (timeRemaining > 0 && !timerInterval) {
            console.log('🔄 Restarting timer...');
            startTimer();
        }
        
        console.log('========== QUIZ SUBMISSION FAILED ==========');
    }
}


/**
 * Update modal stats
 */
function updateModalStats() {
    const answered = Object.keys(answers).length;
    const unanswered = quizData.questions.length - answered;
    const flagged = flaggedQuestions.size;
    
    document.getElementById('modalAnswered').textContent = answered;
    document.getElementById('modalUnanswered').textContent = unanswered;
    document.getElementById('modalFlagged').textContent = flagged;
}


// Prevent page refresh during quiz
globalThis.addEventListener('beforeunload', (e) => {
    if (quizData && timeRemaining > 0 && !isSubmitting) {
        e.preventDefault();
        return '';
    }
});


// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeQuiz);
} else {
    initializeQuiz();
}


// Make functions globally accessible
globalThis.previousQuestion = previousQuestion;
globalThis.nextQuestion = nextQuestion;
globalThis.toggleFlag = toggleFlag;
globalThis.openSubmitModal = openSubmitModal;
globalThis.closeSubmitModal = closeSubmitModal;
globalThis.confirmSubmit = confirmSubmit;
globalThis.goToQuestion = goToQuestion;
globalThis.updateModalStats = updateModalStats;
