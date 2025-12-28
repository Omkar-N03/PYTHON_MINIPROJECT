from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api_views import (
    student_register_api, student_login_api, teacher_login_api, logout_api,
    QuizViewSet, QuestionViewSet, QuizAttemptViewSet, QuizResultViewSet,
    student_dashboard_api, teacher_dashboard_api
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'quizzes', QuizViewSet, basename='api_quiz')
router.register(r'questions', QuestionViewSet, basename='api_question')
router.register(r'attempts', QuizAttemptViewSet, basename='api_attempt')
router.register(r'results', QuizResultViewSet, basename='api_result')

app_name = 'api'

urlpatterns = [
    # Authentication APIs
    path('auth/student/register/', student_register_api, name='student_register'),
    path('auth/student/login/', student_login_api, name='student_login'),
    path('auth/teacher/login/', teacher_login_api, name='teacher_login'),
    path('auth/logout/', logout_api, name='logout'),
    
    # Dashboard APIs
    path('dashboard/student/', student_dashboard_api, name='student_dashboard'),
    path('dashboard/teacher/', teacher_dashboard_api, name='teacher_dashboard'),
    
    # ViewSet URLs
    path('', include(router.urls)),
]
