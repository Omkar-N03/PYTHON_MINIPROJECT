from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from django.utils import timezone
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.http import JsonResponse
from django.db.models import Avg
import json
import logging
from .models import Quiz, Question, QuizAttempt, StudentAnswer, Teacher, Student, Option
from django.contrib.auth.models import User


# Configure logging
logger = logging.getLogger('quiz')


# ==========================================
# CONSTANTS
# ==========================================

# Error Messages
TEACHER_PROFILE_NOT_FOUND = 'Teacher profile not found.'
STUDENT_PROFILE_NOT_FOUND = 'Student profile not found.'
TEACHER_CREATE_QUIZ_ERROR = 'You must be a teacher to create quizzes.'

# URL Names
MANAGE_QUIZZES_URL = 'quiz:manage_quizzes'
STUDENT_LOGIN_URL = 'quiz:student_login'
STUDENT_PROFILE_URL = 'quiz:student_profile'
STUDENT_DASHBOARD_URL = 'quiz:student_dashboard'
TEACHER_DASHBOARD_URL = 'quiz:teacher_dashboard'
TEACHER_LOGIN_URL = 'quiz:teacher_login'

# Template Paths
TEMPLATE_TEACHER_LOGIN = 'teacher/teacher_login.html'
TEMPLATE_TEACHER_SIGNUP = 'teacher/teacher_signup.html'
TEMPLATE_TEACHER_DASHBOARD = 'teacher/teacher_dashboard.html'
TEMPLATE_TEACHER_PROFILE = 'teacher/teacher_profile.html'
TEMPLATE_TEACHER_CREATE_QUIZ = 'teacher/create_quiz.html'
TEMPLATE_TEACHER_MANAGE_QUIZZES = 'teacher/manage_quizzes.html'
TEMPLATE_TEACHER_EDIT_QUIZ = 'teacher/edit_quiz.html'
TEMPLATE_TEACHER_MANAGE_QUESTIONS = 'teacher/manage_questions.html'
TEMPLATE_TEACHER_ADD_QUESTIONS = 'teacher/add_questions.html'
TEMPLATE_TEACHER_VIEW_RESULT = 'teacher/view_result.html'
TEMPLATE_TEACHER_ATTEMPT_DETAILS = 'teacher/attempt_details.html'
TEMPLATE_STUDENT_LOGIN = 'student/student_login.html'
TEMPLATE_STUDENT_SIGNUP = 'student/student_signup.html'
TEMPLATE_STUDENT_DASHBOARD = 'student/student_dashboard.html'
TEMPLATE_STUDENT_PROFILE = 'student/student_profile.html'
TEMPLATE_STUDENT_TAKE_QUIZ = 'student/take_quiz.html'
TEMPLATE_STUDENT_QUIZ_RESULT = 'student/quiz_result.html'

# Status Constants
QUIZ_STATUS_ACTIVE = 'active'
ATTEMPT_STATUS_COMPLETED = 'completed'
ATTEMPT_STATUS_IN_PROGRESS = 'in_progress'

# Validation Constants
MIN_PASSWORD_LENGTH = 8


# ==========================================
# HELPER FUNCTIONS
# ==========================================

def validate_signup_data(username, email, password, password2):
    """Validate signup form data"""
    if not all([username, email, password, password2]):
        return False, 'All fields are required.'
    
    if password != password2:
        return False, 'Passwords do not match.'
    
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f'Password must be at least {MIN_PASSWORD_LENGTH} characters long.'
    
    if User.objects.filter(username=username).exists():
        return False, 'Username already exists.'
    
    if User.objects.filter(email=email).exists():
        return False, 'Email already registered.'
    
    return True, None


def create_user_with_profile(username, email, password, first_name, last_name, profile_model):
    """Create user and associated profile"""
    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            profile_model.objects.create(user=user)
        return True, None
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}", exc_info=True)
        return False, str(e)


def validate_quiz_data(title, category, difficulty, total_marks, time_limit):
    """Validate quiz creation data"""
    if not all([title, category, difficulty, total_marks, time_limit]):
        return False, None, 'Please fill in all required fields.'
    
    try:
        total_marks_int = int(total_marks)
        time_limit_int = int(time_limit)
        
        if total_marks_int <= 0 or time_limit_int <= 0:
            return False, None, 'Total marks and time limit must be positive numbers.'
        
        return True, {'total_marks': total_marks_int, 'time_limit': time_limit_int}, None
    except ValueError:
        return False, None, 'Total marks and time limit must be valid numbers.'


def calculate_average_score(attempts):
    """Calculate average score from quiz attempts"""
    if not attempts.exists():
        return 0
    avg = attempts.aggregate(Avg('score'))['score__avg']
    return round(avg, 2) if avg else 0


def calculate_grade_distribution(teacher):
    """
    Calculate grade distribution for teacher's quizzes
    Returns list of grade ranges with student counts
    """
    all_attempts = QuizAttempt.objects.filter(
        quiz__created_by=teacher,
        status=ATTEMPT_STATUS_COMPLETED
    ).values_list('percentage', flat=True)
    
    grade_ranges = [
        {'label': '90-100', 'count': 0, 'min': 90, 'max': 100},
        {'label': '80-89', 'count': 0, 'min': 80, 'max': 89},
        {'label': '70-79', 'count': 0, 'min': 70, 'max': 79},
        {'label': '60-69', 'count': 0, 'min': 60, 'max': 69},
        {'label': '50-59', 'count': 0, 'min': 50, 'max': 59},
        {'label': '0-49', 'count': 0, 'min': 0, 'max': 49},
    ]
    
    for percentage in all_attempts:
        if percentage is None:
            continue
        
        for grade_range in grade_ranges:
            if grade_range['min'] <= percentage <= grade_range['max']:
                grade_range['count'] += 1
                break
    
    return [{'label': r['label'], 'count': r['count']} for r in grade_ranges]


def calculate_student_grade_distribution(user):
    """
    Calculate grade distribution for a specific student
    Shows their performance across all attempts
    """
    student_attempts = QuizAttempt.objects.filter(
        student=user,
        status=ATTEMPT_STATUS_COMPLETED
    ).values_list('percentage', flat=True)
    
    grade_ranges = [
        {'label': '90-100', 'count': 0, 'min': 90, 'max': 100},
        {'label': '80-89', 'count': 0, 'min': 80, 'max': 89},
        {'label': '70-79', 'count': 0, 'min': 70, 'max': 79},
        {'label': '60-69', 'count': 0, 'min': 60, 'max': 69},
        {'label': '50-59', 'count': 0, 'min': 50, 'max': 59},
        {'label': '0-49', 'count': 0, 'min': 0, 'max': 49},
    ]
    
    for percentage in student_attempts:
        if percentage is None:
            continue
        
        for grade_range in grade_ranges:
            if grade_range['min'] <= percentage <= grade_range['max']:
                grade_range['count'] += 1
                break
    
    return [{'label': r['label'], 'count': r['count']} for r in grade_ranges]


def calculate_student_performance_stats(user):
    """
    Calculate detailed performance statistics for a student
    """
    completed_attempts = QuizAttempt.objects.filter(
        student=user,
        status=ATTEMPT_STATUS_COMPLETED
    )
    
    if not completed_attempts.exists():
        return {
            'total_quizzes': 0,
            'passed_quizzes': 0,
            'failed_quizzes': 0,
            'avg_score': 0,
            'best_score': 0,
            'worst_score': 0,
            'pass_rate': 0,
        }
    
    scores = [attempt.score for attempt in completed_attempts if attempt.score is not None]
    passed_count = completed_attempts.filter(passed=True).count()
    failed_count = completed_attempts.filter(passed=False).count()
    total_count = completed_attempts.count()
    
    return {
        'total_quizzes': total_count,
        'passed_quizzes': passed_count,
        'failed_quizzes': failed_count,
        'avg_score': round(sum(scores) / len(scores), 2) if scores else 0,
        'best_score': max(scores) if scores else 0,
        'worst_score': min(scores) if scores else 0,
        'pass_rate': round((passed_count / total_count) * 100, 1) if total_count > 0 else 0,
    }


def serialize_questions_for_json(questions):
    """Serialize questions with options for JSON output"""
    questions_data = []
    
    for question in questions:
        options = Option.objects.filter(question=question).order_by('id')
        
        question_dict = {
            'id': question.id,
            'text': question.question_text,
            'marks': question.marks,
            'options': []
        }
        
        for opt in options:
            question_dict['options'].append({
                'id': opt.id,
                'text': opt.option_text
            })
        
        questions_data.append(question_dict)
    
    return questions_data


# ==========================================
# AUTHENTICATION VIEWS
# ==========================================

def teacher_login(request):
    """Teacher login view"""
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        
        if not username or not password:
            messages.error(request, 'Please provide both username and password.')
            return render(request, TEMPLATE_TEACHER_LOGIN)
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            if hasattr(user, 'teacher'):
                login(request, user)
                full_name = user.get_full_name() or user.username
                messages.success(request, f'Welcome back, {full_name}!')
                return redirect(TEACHER_DASHBOARD_URL)
            messages.error(request, 'You do not have teacher access.')
        else:
            messages.error(request, 'Invalid username or password.')
    
    return render(request, TEMPLATE_TEACHER_LOGIN)


def teacher_signup(request):
    """Teacher signup view"""
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        password2 = request.POST.get('password2', '')
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        
        is_valid, error_message = validate_signup_data(username, email, password, password2)
        if not is_valid:
            messages.error(request, error_message)
            return render(request, TEMPLATE_TEACHER_SIGNUP)
        
        success, error = create_user_with_profile(username, email, password, first_name, last_name, Teacher)
        if success:
            messages.success(request, 'Account created successfully! Please login.')
            return redirect(TEACHER_LOGIN_URL)
        
        messages.error(request, f'Error creating account: {error}')
    
    return render(request, TEMPLATE_TEACHER_SIGNUP)


def student_login(request):
    """Student login view"""
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '')
        
        if not username or not password:
            messages.error(request, 'Please provide both username and password.')
            return render(request, TEMPLATE_STUDENT_LOGIN)
        
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            if hasattr(user, 'student'):
                login(request, user)
                full_name = user.get_full_name() or user.username
                messages.success(request, f'Welcome back, {full_name}!')
                return redirect(STUDENT_DASHBOARD_URL)
            messages.error(request, 'You do not have student access.')
        else:
            messages.error(request, 'Invalid username or password.')
    
    return render(request, TEMPLATE_STUDENT_LOGIN)


def student_signup(request):
    """Student signup view"""
    if request.method == 'POST':
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip()
        password = request.POST.get('password', '')
        password2 = request.POST.get('password2', '')
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        
        is_valid, error_message = validate_signup_data(username, email, password, password2)
        if not is_valid:
            messages.error(request, error_message)
            return render(request, TEMPLATE_STUDENT_SIGNUP)
        
        success, error = create_user_with_profile(username, email, password, first_name, last_name, Student)
        if success:
            messages.success(request, 'Account created successfully! Please login.')
            return redirect(STUDENT_LOGIN_URL)
        
        messages.error(request, f'Error creating account: {error}')
    
    return render(request, TEMPLATE_STUDENT_SIGNUP)


def logout_view(request):
    """Logout view"""
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('home')


# ==========================================
# TEACHER VIEWS
# ==========================================

@login_required
def teacher_dashboard(request):
    """Teacher dashboard view with analytics"""
    try:
        teacher = request.user.teacher
        quizzes = Quiz.objects.filter(created_by=teacher)
        
        # Calculate grade distribution
        grade_distribution = calculate_grade_distribution(teacher)
        
        # Get unique students who attempted this teacher's quizzes
        total_students = QuizAttempt.objects.filter(
            quiz__created_by=teacher
        ).values('student').distinct().count()
        
        context = {
            'teacher': teacher,
            'quizzes': quizzes.order_by('-created_at')[:5],
            'total_quizzes': quizzes.count(),
            'total_students': total_students,
            'total_attempts': QuizAttempt.objects.filter(quiz__created_by=teacher).count(),
            'active_quizzes': quizzes.filter(status=QUIZ_STATUS_ACTIVE).count(),
            'grade_distribution': json.dumps(grade_distribution),
        }
        
        logger.info(f"Dashboard loaded for {teacher.user.username} - Grade distribution: {grade_distribution}")
        
        return render(request, TEMPLATE_TEACHER_DASHBOARD, context)
    except (ObjectDoesNotExist, AttributeError) as e:
        logger.error(f"Error loading teacher dashboard: {str(e)}", exc_info=True)
        messages.error(request, TEACHER_PROFILE_NOT_FOUND)
        return redirect('home')


@login_required
def teacher_profile(request):
    """Teacher profile view"""
    try:
        teacher = request.user.teacher
        context = {
            'teacher': teacher,
            'total_quizzes': Quiz.objects.filter(created_by=teacher).count(),
        }
        return render(request, TEMPLATE_TEACHER_PROFILE, context)
    except (ObjectDoesNotExist, AttributeError):
        messages.error(request, TEACHER_PROFILE_NOT_FOUND)
        return redirect('home')


@login_required
def teacher_profile_edit(request):
    """Edit teacher profile"""
    if request.method == 'POST':
        try:
            request.user.first_name = request.POST.get('first_name', '').strip()
            request.user.last_name = request.POST.get('last_name', '').strip()
            request.user.email = request.POST.get('email', '').strip()
            request.user.save()
            
            teacher = request.user.teacher
            if hasattr(teacher, 'phone'):
                teacher.phone = request.POST.get('phone', '').strip()
            if hasattr(teacher, 'bio'):
                teacher.bio = request.POST.get('bio', '').strip()
            teacher.save()
            
            messages.success(request, 'Profile updated successfully!')
        except Exception as e:
            logger.error(f"Error updating teacher profile: {str(e)}", exc_info=True)
            messages.error(request, f'Error updating profile: {str(e)}')
        
        return redirect('quiz:teacher_profile')
    
    return redirect('quiz:teacher_profile')


@login_required
def create_quiz(request):
    """Create a new quiz with questions"""
    try:
        teacher = request.user.teacher
    except AttributeError:
        messages.error(request, TEACHER_CREATE_QUIZ_ERROR)
        return redirect(TEACHER_LOGIN_URL)
    
    if request.method == 'POST':
        return handle_quiz_creation(request, teacher)
    
    return render(request, TEMPLATE_TEACHER_CREATE_QUIZ)


def handle_quiz_creation(request, teacher):
    """Handle quiz creation POST request"""
    title = request.POST.get('title', '').strip()
    category = request.POST.get('category', '').strip()
    difficulty = request.POST.get('difficulty', '').strip()
    total_marks = request.POST.get('total_marks', '').strip()
    time_limit = request.POST.get('time_limit', '').strip()
    description = request.POST.get('description', '').strip()
    
    is_valid, validated_data, error = validate_quiz_data(title, category, difficulty, total_marks, time_limit)
    if not is_valid:
        messages.error(request, error)
        return render(request, TEMPLATE_TEACHER_CREATE_QUIZ)
    
    try:
        with transaction.atomic():
            quiz = create_quiz_object(teacher, title, category, difficulty, validated_data, description)
            questions_data = parse_questions_from_post(request.POST)
            
            if not questions_data:
                raise ValueError('No questions found. Please add at least one question.')
            
            create_questions_and_options(quiz, questions_data)
            
        messages.success(request, f'Quiz "{title}" created successfully with {len(questions_data)} questions!')
        return redirect(MANAGE_QUIZZES_URL)
        
    except ValueError as e:
        messages.error(request, str(e))
    except Exception as e:
        logger.error(f"Error creating quiz: {str(e)}", exc_info=True)
        messages.error(request, f'Error creating quiz: {str(e)}')
    
    return render(request, TEMPLATE_TEACHER_CREATE_QUIZ)


def create_quiz_object(teacher, title, category, difficulty, validated_data, description):
    """Create Quiz object"""
    return Quiz.objects.create(
        created_by=teacher,
        title=title,
        category=category,
        difficulty=difficulty,
        total_marks=validated_data['total_marks'],
        time_limit=validated_data['time_limit'],
        description=description,
        status=QUIZ_STATUS_ACTIVE
    )


def create_questions_and_options(quiz, questions_data):
    """Create questions and options for a quiz"""
    for order, q_data in enumerate(questions_data, start=1):
        question = Question.objects.create(
            quiz=quiz,
            question_text=q_data['text'],
            question_type=q_data.get('type', 'multiple_choice'),
            marks=int(q_data.get('marks', 1)),
            explanation=q_data.get('explanation', ''),
            order=order
        )
        
        correct_index = int(q_data.get('correct', 0))
        for idx, option_text in enumerate(q_data['options']):
            if option_text.strip():
                Option.objects.create(
                    question=question,
                    option_text=option_text.strip(),
                    is_correct=(idx == correct_index)
                )


def parse_questions_from_post(post_data):
    """Parse questions from POST data"""
    questions = []
    question_numbers = set()
    
    for key in post_data.keys():
        if key.startswith('questions['):
            try:
                q_num = key.split('[')[1].split(']')[0]
                question_numbers.add(q_num)
            except IndexError:
                continue
    
    for q_num in sorted(question_numbers, key=lambda x: int(x) if x.isdigit() else 0):
        question_data = extract_question_data(post_data, q_num)
        if question_data:
            questions.append(question_data)
    
    return questions


def extract_question_data(post_data, q_num):
    """Extract single question data from POST"""
    try:
        question_text = post_data.get(f'questions[{q_num}][text]', '').strip()
        
        if not question_text:
            return None
        
        question_data = {
            'text': question_text,
            'type': post_data.get(f'questions[{q_num}][type]', 'multiple_choice'),
            'marks': post_data.get(f'questions[{q_num}][marks]', '1'),
            'explanation': post_data.get(f'questions[{q_num}][explanation]', '').strip(),
            'correct': post_data.get(f'questions[{q_num}][correct]', '0'),
            'options': post_data.getlist(f'questions[{q_num}][options][]')
        }
        
        if question_data['options'] and any(opt.strip() for opt in question_data['options']):
            return question_data
        
        return None
    except Exception as e:
        logger.error(f"Error extracting question data: {str(e)}", exc_info=True)
        return None


@login_required
def manage_quizzes(request):
    """Manage quizzes view"""
    try:
        teacher = request.user.teacher
        quizzes = Quiz.objects.filter(created_by=teacher).order_by('-created_at')
        
        for quiz in quizzes:
            quiz.question_count = Question.objects.filter(quiz=quiz).count()
            quiz.attempt_count = QuizAttempt.objects.filter(quiz=quiz).count()
        
        context = {'quizzes': quizzes}
        return render(request, TEMPLATE_TEACHER_MANAGE_QUIZZES, context)
    except (ObjectDoesNotExist, AttributeError):
        messages.error(request, TEACHER_PROFILE_NOT_FOUND)
        return redirect('home')


@login_required
def edit_quiz(request, quiz_id):
    """Edit quiz view"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    
    if quiz.created_by.user != request.user:
        messages.error(request, 'You do not have permission to edit this quiz.')
        return redirect(MANAGE_QUIZZES_URL)
    
    if request.method == 'POST':
        try:
            quiz.title = request.POST.get('title', '').strip()
            quiz.category = request.POST.get('category', '').strip()
            quiz.difficulty = request.POST.get('difficulty', '').strip()
            quiz.total_marks = int(request.POST.get('total_marks', 0))
            quiz.time_limit = int(request.POST.get('time_limit', 0))
            quiz.description = request.POST.get('description', '').strip()
            quiz.save()
            
            messages.success(request, 'Quiz updated successfully!')
            return redirect(MANAGE_QUIZZES_URL)
        except Exception as e:
            logger.error(f"Error updating quiz: {str(e)}", exc_info=True)
            messages.error(request, f'Error updating quiz: {str(e)}')
    
    context = {'quiz': quiz}
    return render(request, TEMPLATE_TEACHER_EDIT_QUIZ, context)


@login_required
@require_http_methods(["POST"])
def delete_quiz(request, quiz_id):
    """Delete quiz"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    
    if quiz.created_by.user == request.user:
        quiz_title = quiz.title
        quiz.delete()
        messages.success(request, f'Quiz "{quiz_title}" deleted successfully!')
    else:
        messages.error(request, 'You do not have permission to delete this quiz.')
    
    return redirect(MANAGE_QUIZZES_URL)


@login_required
def manage_questions(request, quiz_id):
    """Manage questions for a quiz"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    
    if quiz.created_by.user != request.user:
        messages.error(request, 'You do not have permission to manage this quiz.')
        return redirect(MANAGE_QUIZZES_URL)
    
    questions = Question.objects.filter(quiz=quiz).order_by('order')
    
    context = {'quiz': quiz, 'questions': questions}
    return render(request, TEMPLATE_TEACHER_MANAGE_QUESTIONS, context)


@login_required
def add_questions(request, quiz_id):
    """Add questions to quiz"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    
    if quiz.created_by.user != request.user:
        messages.error(request, 'You do not have permission to modify this quiz.')
        return redirect(MANAGE_QUIZZES_URL)
    
    context = {'quiz': quiz}
    return render(request, TEMPLATE_TEACHER_ADD_QUESTIONS, context)


@login_required
@require_http_methods(["POST"])
def delete_question(request, question_id):
    """Delete a question"""
    question = get_object_or_404(Question, id=question_id)
    quiz = question.quiz
    
    if quiz.created_by.user != request.user:
        messages.error(request, 'You do not have permission to delete this question.')
        return redirect(MANAGE_QUIZZES_URL)
    
    question.delete()
    messages.success(request, 'Question deleted successfully!')
    
    return redirect('quiz:manage_questions', quiz_id=quiz.id)


@login_required
def view_quiz_results(request, quiz_id):
    """View quiz results with grade distribution"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    
    if quiz.created_by.user != request.user:
        messages.error(request, 'You do not have permission to view these results.')
        return redirect(MANAGE_QUIZZES_URL)
    
    attempts = QuizAttempt.objects.filter(
        quiz=quiz,
        status=ATTEMPT_STATUS_COMPLETED
    ).select_related('student').order_by('-end_time')
    
    stats = calculate_attempt_stats(attempts)
    quiz_grade_distribution = calculate_quiz_specific_grade_distribution(attempts)
    
    context = {
        'quiz': quiz,
        'attempts': attempts,
        'total_attempts': attempts.count(),
        'avg_score': stats['avg_score'],
        'max_score': stats['max_score'],
        'min_score': stats['min_score'],
        'grade_distribution': json.dumps(quiz_grade_distribution),
    }
    return render(request, TEMPLATE_TEACHER_VIEW_RESULT, context)


def calculate_quiz_specific_grade_distribution(attempts):
    """Calculate grade distribution for a specific quiz"""
    percentages = attempts.values_list('percentage', flat=True)
    
    grade_ranges = [
        {'label': '90-100', 'count': 0, 'min': 90, 'max': 100},
        {'label': '80-89', 'count': 0, 'min': 80, 'max': 89},
        {'label': '70-79', 'count': 0, 'min': 70, 'max': 79},
        {'label': '60-69', 'count': 0, 'min': 60, 'max': 69},
        {'label': '50-59', 'count': 0, 'min': 50, 'max': 59},
        {'label': '0-49', 'count': 0, 'min': 0, 'max': 49},
    ]
    
    for percentage in percentages:
        if percentage is None:
            continue
        
        for grade_range in grade_ranges:
            if grade_range['min'] <= percentage <= grade_range['max']:
                grade_range['count'] += 1
                break
    
    return [{'label': r['label'], 'count': r['count']} for r in grade_ranges]


def calculate_attempt_stats(attempts):
    """Calculate statistics from quiz attempts"""
    if not attempts.exists():
        return {'avg_score': 0, 'max_score': 0, 'min_score': 0}
    
    scores = [attempt.score for attempt in attempts if attempt.score is not None]
    return {
        'avg_score': round(sum(scores) / len(scores), 2) if scores else 0,
        'max_score': max(scores) if scores else 0,
        'min_score': min(scores) if scores else 0
    }


@login_required
def view_attempt_details(request, attempt_id):
    """View attempt details"""
    attempt = get_object_or_404(QuizAttempt, id=attempt_id)
    
    if attempt.quiz.created_by.user != request.user:
        messages.error(request, 'You do not have permission to view this attempt.')
        return redirect(MANAGE_QUIZZES_URL)
    
    answers = StudentAnswer.objects.filter(attempt=attempt).select_related('question', 'selected_option')
    
    context = {'attempt': attempt, 'answers': answers}
    return render(request, TEMPLATE_TEACHER_ATTEMPT_DETAILS, context)


# ==========================================
# STUDENT VIEWS
# ==========================================

@login_required
def student_dashboard(request):
    """Student dashboard showing available quizzes and recent attempts with analytics"""
    try:
        student = Student.objects.get(user=request.user)
    except Student.DoesNotExist:
        messages.error(request, STUDENT_PROFILE_NOT_FOUND)
        return redirect(STUDENT_LOGIN_URL)
    
    # Get available quizzes
    available_quizzes = Quiz.objects.filter(
        status=QUIZ_STATUS_ACTIVE
    ).select_related('created_by').order_by('-created_at')[:6]
    
    # Get recent attempts
    recent_attempts = QuizAttempt.objects.filter(
        student=request.user
    ).select_related('quiz', 'quiz__created_by').order_by('-start_time')[:10]
    
    # Calculate statistics
    total_attempts = QuizAttempt.objects.filter(student=request.user).count()
    completed_attempts = QuizAttempt.objects.filter(
        student=request.user,
        status=ATTEMPT_STATUS_COMPLETED
    )
    
    avg_score = calculate_average_score(completed_attempts)
    
    # ✅ NEW: Calculate student's grade distribution
    student_grade_distribution = calculate_student_grade_distribution(request.user)
    
    # ✅ NEW: Calculate performance metrics
    performance_stats = calculate_student_performance_stats(request.user)
    
    context = {
        'student': student,
        'available_quizzes': available_quizzes,
        'recent_attempts': recent_attempts,
        'total_attempts': total_attempts,
        'completed_attempts': completed_attempts.count(),
        'avg_score': round(avg_score, 2),
        'grade_distribution': json.dumps(student_grade_distribution),  # ✅ NEW
        'performance_stats': json.dumps(performance_stats),  # ✅ NEW
    }
    
    logger.info(f"Student dashboard loaded for {request.user.username} - Stats: {performance_stats}")
    
    return render(request, TEMPLATE_STUDENT_DASHBOARD, context)


@login_required
def student_profile(request):
    """Student profile view"""
    try:
        student = request.user.student
        
        total_quizzes = QuizAttempt.objects.filter(student=request.user).count()
        completed_quizzes = QuizAttempt.objects.filter(
            student=request.user,
            status=ATTEMPT_STATUS_COMPLETED
        ).count()
        
        completed_attempts = QuizAttempt.objects.filter(
            student=request.user,
            status=ATTEMPT_STATUS_COMPLETED
        )
        
        avg_score = calculate_average_score(completed_attempts)
        
        recent_attempts = QuizAttempt.objects.filter(
            student=request.user
        ).select_related('quiz').order_by('-start_time')[:10]
        
        context = {
            'student': student,
            'total_quizzes': total_quizzes,
            'completed_quizzes': completed_quizzes,
            'avg_score': round(avg_score, 2),
            'recent_attempts': recent_attempts,
        }
        
        return render(request, TEMPLATE_STUDENT_PROFILE, context)
        
    except (ObjectDoesNotExist, AttributeError):
        messages.error(request, STUDENT_PROFILE_NOT_FOUND)
        return redirect(STUDENT_LOGIN_URL)


@login_required
def student_profile_edit(request):
    """Edit student profile"""
    if request.method == 'POST':
        try:
            request.user.first_name = request.POST.get('first_name', '').strip()
            request.user.last_name = request.POST.get('last_name', '').strip()
            request.user.email = request.POST.get('email', '').strip()
            request.user.save()
            
            messages.success(request, 'Profile updated successfully!')
        except Exception as e:
            logger.error(f"Error updating student profile: {str(e)}", exc_info=True)
            messages.error(request, f'Error updating profile: {str(e)}')
        
        return redirect(STUDENT_PROFILE_URL)
    
    return redirect(STUDENT_PROFILE_URL)


@login_required
@ensure_csrf_cookie
def take_quiz(request, quiz_id):
    """Take/Attempt quiz view - handles both starting and continuing a quiz"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    
    if quiz.status != QUIZ_STATUS_ACTIVE:
        messages.error(request, 'This quiz is not available.')
        return redirect(STUDENT_DASHBOARD_URL)
    
    # Check if already completed
    existing_attempt = QuizAttempt.objects.filter(
        student=request.user,
        quiz=quiz,
        status=ATTEMPT_STATUS_COMPLETED
    ).first()
    
    if existing_attempt:
        messages.info(request, 'You have already completed this quiz.')
        return redirect('quiz:quiz_result', attempt_id=existing_attempt.id)
    
    # Get or create in-progress attempt
    attempt, _ = QuizAttempt.objects.get_or_create(
        student=request.user,
        quiz=quiz,
        status=ATTEMPT_STATUS_IN_PROGRESS,
        defaults={'start_time': timezone.now()}
    )
    
    questions = Question.objects.filter(quiz=quiz).prefetch_related('option_set').order_by('order')
    
    if not questions.exists():
        messages.error(request, 'This quiz has no questions yet.')
        return redirect(STUDENT_DASHBOARD_URL)
    
    questions_data = serialize_questions_for_json(questions)
    
    context = {
        'quiz': quiz,
        'questions': questions_data,
        'attempt': attempt,
        'total_questions': len(questions_data),
    }
    
    return render(request, TEMPLATE_STUDENT_TAKE_QUIZ, context)


@login_required
@require_http_methods(["POST"])
@csrf_protect
def submit_quiz(request, quiz_id):
    """Handle quiz submission via AJAX"""
    logger.info("========== QUIZ SUBMISSION STARTED ==========")
    logger.info(f"Quiz ID: {quiz_id}, User: {request.user.username}")
    
    try:
        data = parse_submission_data(request)
        if not data:
            return JsonResponse({'success': False, 'error': 'Invalid request'}, status=400)
        
        quiz = get_object_or_404(Quiz, id=quiz_id)
        logger.info(f"Quiz found: {quiz.title}")
        
        attempt = get_quiz_attempt(request.user, quiz)
        if not attempt:
            logger.error("No in-progress attempt found")
            return JsonResponse({
                'success': False,
                'error': 'Quiz attempt not found'
            }, status=400)
        
        logger.info(f"Attempt found: ID={attempt.id}")
        
        result = process_quiz_submission(attempt, quiz, data)
        
        logger.info("QUIZ SUBMITTED SUCCESSFULLY")
        logger.info("========== QUIZ SUBMISSION COMPLETED ==========")
        
        return JsonResponse(result, status=200)
        
    except Exception as e:
        logger.error(f"CRITICAL ERROR submitting quiz: {str(e)}", exc_info=True)
        logger.info("========== QUIZ SUBMISSION FAILED ==========")
        
        return JsonResponse({
            'success': False,
            'error': f'An error occurred: {str(e)}'
        }, status=500)


def parse_submission_data(request):
    """Parse submission data from request"""
    try:
        data = json.loads(request.body)
        logger.info("Request body parsed successfully")
        return {
            'answers': data.get('answers', {}),
            'time_spent': data.get('time_spent', 0)
        }
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return None


def get_quiz_attempt(user, quiz):
    """Get in-progress quiz attempt"""
    return QuizAttempt.objects.filter(
        student=user,
        quiz=quiz,
        status=ATTEMPT_STATUS_IN_PROGRESS
    ).first()


def process_quiz_submission(attempt, quiz, data):
    """Process quiz submission and return results"""
    answers = data['answers']
    time_spent = data['time_spent']
    
    logger.info(f"Processing {len(answers)} answers")
    
    total_score = 0
    max_score = 0
    correct_count = 0
    incorrect_count = 0
    
    with transaction.atomic():
        for question_id_str, option_id in answers.items():
            try:
                result = process_single_answer(attempt, quiz, question_id_str, option_id)
                if result:
                    total_score += result['score']
                    max_score += result['max_score']
                    if result['correct']:
                        correct_count += 1
                    else:
                        incorrect_count += 1
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid data for Q{question_id_str}: {str(e)}")
                continue
            except (Question.DoesNotExist, Option.DoesNotExist) as e:
                logger.warning(f"Database error for Q{question_id_str}: {str(e)}")
                continue
        
        return finalize_attempt(
            attempt, quiz, total_score, max_score,
            correct_count, incorrect_count, time_spent
        )


def process_single_answer(attempt, quiz, question_id_str, option_id):
    """Process a single answer"""
    question = Question.objects.get(id=int(question_id_str), quiz=quiz)
    selected_option = Option.objects.get(id=int(option_id), question=question)
    
    StudentAnswer.objects.update_or_create(
        attempt=attempt,
        question=question,
        defaults={
            'selected_option': selected_option,
            'is_correct': selected_option.is_correct
        }
    )
    
    return {
        'score': question.marks if selected_option.is_correct else 0,
        'max_score': question.marks,
        'correct': selected_option.is_correct
    }


def finalize_attempt(attempt, quiz, total_score, max_score, correct_count, incorrect_count, time_spent):
    """Finalize attempt and return results"""
    attempt.score = total_score
    attempt.max_score = max_score
    attempt.total_marks = max_score
    attempt.correct_answers = correct_count
    attempt.incorrect_answers = incorrect_count
    attempt.end_time = timezone.now()
    attempt.time_spent = int(time_spent)
    
    if max_score > 0:
        attempt.percentage = (total_score / max_score) * 100
        attempt.passed = total_score >= quiz.passing_marks
    else:
        attempt.percentage = 0
        attempt.passed = False
    
    attempt.status = ATTEMPT_STATUS_COMPLETED
    attempt.save()
    
    return {
        'success': True,
        'attempt_id': attempt.id,
        'score': attempt.score,
        'max_score': attempt.max_score,
        'percentage': round(attempt.percentage, 2),
        'passed': attempt.passed,
        'message': 'Quiz submitted successfully!'
    }


@login_required
def quiz_result(request, attempt_id):
    """View quiz result"""
    attempt = get_object_or_404(QuizAttempt, id=attempt_id, student=request.user)
    
    answers = StudentAnswer.objects.filter(
        attempt=attempt
    ).select_related('question', 'selected_option').prefetch_related('question__option_set')
    
    total_questions = answers.count()
    correct_answers = answers.filter(is_correct=True).count()
    
    context = {
        'attempt': attempt,
        'answers': answers,
        'quiz': attempt.quiz,
        'total_questions': total_questions,
        'correct_answers': correct_answers,
    }
    return render(request, TEMPLATE_STUDENT_QUIZ_RESULT, context)


# ==========================================
# ADDITIONAL PAGES
# ==========================================

def about(request):
    """About page"""
    return render(request, 'about.html')


def contact(request):
    """Contact page"""
    return render(request, 'contact.html')
