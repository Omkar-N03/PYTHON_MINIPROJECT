"""
URL configuration for accounts app.

Handles user authentication and user-specific dashboards:
- Teacher Dashboard & Profile Management
- Student Dashboard & Profile Management  
- Login/Signup/Logout functionality
"""

from django.urls import path
from . import views

# App name for namespacing
app_name = 'accounts'

urlpatterns = [
    # ============================================
    # Authentication URLs
    # ============================================
    
    # User Login
    # URL: /login/
    path('login/', views.user_login, name='login'),
    
    # User Signup/Registration
    # URL: /signup/
    path('signup/', views.user_signup, name='signup'),
    
    # User Logout
    # URL: /logout/
    path('logout/', views.user_logout, name='logout'),
    
    # ============================================
    # Teacher URLs
    # ============================================
    
    # Teacher Dashboard
    # URL: /teacher/dashboard/
    path('teacher/dashboard/', views.teacher_dashboard, name='teacher_dashboard'),
    
    # Teacher Profile View
    # URL: /teacher/profile/
    path('teacher/profile/', views.teacher_profile, name='teacher_profile'),
    
    # Teacher Profile Edit
    # URL: /teacher/profile/edit/
    path('teacher/profile/edit/', views.teacher_profile_edit, name='teacher_profile_edit'),
    
    # ============================================
    # Student URLs (Add these if needed)
    # ============================================
    
    # Uncomment when you create student dashboard views
    # path('student/dashboard/', views.student_dashboard, name='student_dashboard'),
    # path('student/profile/', views.student_profile, name='student_profile'),
    # path('student/profile/edit/', views.student_profile_edit, name='student_profile_edit'),
]
