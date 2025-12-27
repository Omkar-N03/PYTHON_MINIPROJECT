from django.urls import path
from . import views

app_name = 'quiz'

urlpatterns = [

    path('teacher/login/', views.teacher_login, name='teacher_login'),
    path('teacher/signup/', views.teacher_signup, name='teacher_signup'),
    path('student/login/', views.student_login, name='student_login'),
    path('student/signup/', views.student_signup, name='student_signup'),
    path('logout/', views.logout_view, name='logout'),
    
    path('teacher/dashboard/', views.teacher_dashboard, name='teacher_dashboard'),
    path('teacher/profile/', views.teacher_profile, name='teacher_profile'),
    path('teacher/profile/edit/', views.teacher_profile_edit, name='teacher_profile_edit'),
    
    path('teacher/quiz/create/', views.create_quiz, name='create_quiz'),
    path('teacher/quiz/manage/', views.manage_quizzes, name='manage_quizzes'),
    path('teacher/quiz/<int:quiz_id>/edit/', views.edit_quiz, name='edit_quiz'),
    path('teacher/quiz/<int:quiz_id>/delete/', views.delete_quiz, name='delete_quiz'),
    path('teacher/quiz/<int:quiz_id>/questions/', views.manage_questions, name='manage_questions'),
    path('teacher/quiz/<int:quiz_id>/questions/add/', views.add_questions, name='add_questions'),
    path('teacher/quiz/<int:quiz_id>/results/', views.view_quiz_results, name='view_quiz_results'),
    path('teacher/attempt/<int:attempt_id>/details/', views.view_attempt_details, name='view_attempt_details'),
    path('teacher/question/<int:question_id>/delete/', views.delete_question, name='delete_question'),
    
    path('api/generate-questions/', views.generate_questions_api, name='generate_questions'),

    path('student/dashboard/', views.student_dashboard, name='student_dashboard'),
    path('student/profile/', views.student_profile, name='student_profile'),
    path('student/profile/edit/', views.student_profile_edit, name='student_profile_edit'),
    
    path('student/quiz/<int:quiz_id>/take/', views.take_quiz, name='take_quiz'),
    path('student/quiz/<int:quiz_id>/submit/', views.submit_quiz, name='submit_quiz'),
    path('student/attempt/<int:attempt_id>/result/', views.quiz_result, name='quiz_result'),
    
    path('about/', views.about, name='about'),
    path('contact/', views.contact, name='contact'),
]
