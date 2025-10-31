"""
Authentication views for accounts app
Handles user signup, login, logout and home page
"""

from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib import messages
from quiz.models import UserProfile


# Constants to avoid string duplication (fixes SonarLint S1192)
TEACHER_DASHBOARD_URL = 'quiz:teacher_dashboard'
STUDENT_DASHBOARD_URL = 'quiz:student_dashboard'
LOGIN_URL = 'login'
SIGNUP_URL = 'signup'


def _get_user_dashboard_url(user):
    """
    Helper function to get dashboard URL based on user role
    Reduces cognitive complexity (fixes SonarLint S3776)
    """
    try:
        profile = UserProfile.objects.get(user=user)
        return TEACHER_DASHBOARD_URL if profile.role == 'teacher' else STUDENT_DASHBOARD_URL
    except UserProfile.DoesNotExist:
        return STUDENT_DASHBOARD_URL


def _validate_signup_data(username, email, password, password2):
    """
    Validate signup form data
    Returns tuple: (is_valid, error_message)
    """
    if not username or not email or not password:
        return False, 'All fields are required!'
    
    if password != password2:
        return False, 'Passwords do not match!'
    
    if len(password) < 8:
        return False, 'Password must be at least 8 characters long!'
    
    if User.objects.filter(username=username).exists():
        return False, 'Username already exists!'
    
    if User.objects.filter(email=email).exists():
        return False, 'Email already registered!'
    
    return True, None


def user_signup(request):
    """
    Handle user registration/signup
    Creates new user account and associated profile
    """
    if request.user.is_authenticated:
        return redirect('quiz:home')
    
    if request.method == 'POST':
        # Get form data
        username = request.POST.get('username')
        email = request.POST.get('email')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')
        role = request.POST.get('role', 'student')
        
        # Validate input
        is_valid, error_msg = _validate_signup_data(username, email, password, password2)
        if not is_valid:
            messages.error(request, error_msg)
            return redirect(SIGNUP_URL)
        
        try:
            # Create user
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            
            # Create user profile
            UserProfile.objects.create(user=user, role=role)
            
            messages.success(request, 'Account created successfully! Please login.')
            return redirect(LOGIN_URL)
            
        except Exception as e:
            messages.error(request, f'Error creating account: {str(e)}')
            return redirect(SIGNUP_URL)
    
    return render(request, 'auth/signup.html')


def user_login(request):
    """
    Handle user login
    Redirects to appropriate dashboard based on user role
    """
    # Redirect if already logged in
    if request.user.is_authenticated:
        return redirect(_get_user_dashboard_url(request.user))
    
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        # Validate input
        if not username or not password:
            messages.error(request, 'Please provide both username and password!')
            return redirect(LOGIN_URL)
        
        # Authenticate user
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            
            # Create profile if doesn't exist
            UserProfile.objects.get_or_create(
                user=user,
                defaults={'role': 'student'}
            )
            
            messages.success(request, f'Welcome back, {user.username}!')
            return redirect(_get_user_dashboard_url(user))
        else:
            messages.error(request, 'Invalid username or password!')
            return redirect(LOGIN_URL)
    
    return render(request, 'auth/login.html')


def user_logout(request):
    """
    Handle user logout
    Clears session and redirects to login page
    """
    username = request.user.username if request.user.is_authenticated else 'User'
    logout(request)
    messages.success(request, f'Goodbye, {username}! You have been logged out successfully.')
    return redirect(LOGIN_URL)


def home(request):
    """
    Home page view
    Redirects authenticated users to their dashboard
    """
    if request.user.is_authenticated:
        return redirect(_get_user_dashboard_url(request.user))
    
    return render(request, 'home.html')
