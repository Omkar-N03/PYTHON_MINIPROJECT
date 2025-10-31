"""
API Views for Accounts App
Provides REST API endpoints for authentication
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from quiz.models import UserProfile


@api_view(['POST'])
@permission_classes([AllowAny])
def api_login(request):
    """
    API endpoint for user login
    
    POST /api/accounts/login/
    Body: {
        "username": "string",
        "password": "string"
    }
    
    Returns: {
        "success": true/false,
        "user_type": "teacher"/"student",
        "username": "string",
        "email": "string",
        "message": "string"
    }
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    # Validation
    if not username or not password:
        return Response({
            'success': False,
            'message': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Authenticate
    user = authenticate(username=username, password=password)
    
    if user is not None:
        # Login successful
        login(request, user)
        
        try:
            profile = UserProfile.objects.get(user=user)
            
            return Response({
                'success': True,
                'user_type': profile.role,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'message': f'Welcome back, {user.username}!'
            }, status=status.HTTP_200_OK)
            
        except UserProfile.DoesNotExist:
            # Create default profile if doesn't exist
            profile = UserProfile.objects.create(user=user, role='student')
            
            return Response({
                'success': True,
                'user_type': 'student',
                'username': user.username,
                'email': user.email,
                'message': f'Welcome, {user.username}!'
            }, status=status.HTTP_200_OK)
    else:
        # Authentication failed
        return Response({
            'success': False,
            'message': 'Invalid username or password'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def api_signup(request):
    """
    API endpoint for user registration
    
    POST /api/accounts/signup/
    Body: {
        "username": "string",
        "email": "string",
        "password": "string",
        "password2": "string",
        "first_name": "string" (optional),
        "last_name": "string" (optional),
        "role": "teacher"/"student" (optional, defaults to student)
    }
    
    Returns: {
        "success": true/false,
        "message": "string",
        "username": "string"
    }
    """
    # Get data
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    password2 = request.data.get('password2')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    role = request.data.get('role', 'student')
    
    # Validation
    if not username or not email or not password:
        return Response({
            'success': False,
            'message': 'Username, email, and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if password != password2:
        return Response({
            'success': False,
            'message': 'Passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(password) < 8:
        return Response({
            'success': False,
            'message': 'Password must be at least 8 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if username exists
    if User.objects.filter(username=username).exists():
        return Response({
            'success': False,
            'message': 'Username already exists'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email exists
    if User.objects.filter(email=email).exists():
        return Response({
            'success': False,
            'message': 'Email already registered'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate role
    if role not in ['teacher', 'student']:
        role = 'student'
    
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
        UserProfile.objects.create(
            user=user,
            role=role
        )
        
        return Response({
            'success': True,
            'message': 'Account created successfully! Please login.',
            'username': username,
            'email': email,
            'role': role
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error creating account: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_logout(request):
    """
    API endpoint for user logout
    
    POST /api/accounts/logout/
    Headers: Authorization: Token <token>
    
    Returns: {
        "success": true,
        "message": "string"
    }
    """
    username = request.user.username
    logout(request)
    
    return Response({
        'success': True,
        'message': f'Goodbye, {username}! You have been logged out successfully.'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_info(request):
    """
    API endpoint to get current user information
    
    GET /api/accounts/user-info/
    Headers: Authorization: Token <token>
    
    Returns: {
        "success": true,
        "user": {
            "username": "string",
            "email": "string",
            "first_name": "string",
            "last_name": "string",
            "role": "teacher"/"student"
        }
    }
    """
    user = request.user
    
    try:
        profile = UserProfile.objects.get(user=user)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': profile.role,
                'bio': profile.bio,
                'phone': profile.phone,
                'department': profile.department
            }
        }, status=status.HTTP_200_OK)
        
    except UserProfile.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User profile not found'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def api_update_profile(request):
    """
    API endpoint to update user profile
    
    PUT /api/accounts/update-profile/
    Headers: Authorization: Token <token>
    Body: {
        "first_name": "string" (optional),
        "last_name": "string" (optional),
        "email": "string" (optional),
        "bio": "string" (optional),
        "phone": "string" (optional),
        "department": "string" (optional)
    }
    
    Returns: {
        "success": true,
        "message": "string"
    }
    """
    user = request.user
    
    try:
        # Update User model fields
        if 'first_name' in request.data:
            user.first_name = request.data['first_name']
        if 'last_name' in request.data:
            user.last_name = request.data['last_name']
        if 'email' in request.data:
            # Check if email is already taken by another user
            if User.objects.filter(email=request.data['email']).exclude(id=user.id).exists():
                return Response({
                    'success': False,
                    'message': 'Email already in use by another account'
                }, status=status.HTTP_400_BAD_REQUEST)
            user.email = request.data['email']
        
        user.save()
        
        # Update UserProfile fields
        profile = UserProfile.objects.get(user=user)
        
        if 'bio' in request.data:
            profile.bio = request.data['bio']
        if 'phone' in request.data:
            profile.phone = request.data['phone']
        if 'department' in request.data:
            profile.department = request.data['department']
        
        profile.save()
        
        return Response({
            'success': True,
            'message': 'Profile updated successfully'
        }, status=status.HTTP_200_OK)
        
    except UserProfile.DoesNotExist:
        return Response({
            'success': False,
            'message': 'User profile not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error updating profile: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)
