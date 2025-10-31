from django.contrib import admin
from .models import (
    UserProfile, Teacher, Student, Quiz, Question, 
    QuizAttempt, StudentAnswer, Option
)

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'phone', 'department']
    list_filter = ['role']
    search_fields = ['user__username', 'user__email', 'phone']

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'qualification', 'years_experience', 'is_approved', 'created_at']
    list_filter = ['is_approved', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone', 'qualification']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'grade', 'school', 'created_at']
    list_filter = ['grade', 'is_active', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone', 'school']
    readonly_fields = ['created_at', 'updated_at']

@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    # FIXED: Changed 'teacher' to 'created_by', 'subject' to 'category', 'duration' to 'time_limit'
    list_display = ['title', 'created_by', 'category', 'difficulty', 'time_limit', 'total_marks', 'status', 'created_at']
    list_filter = ['status', 'difficulty', 'category', 'created_at']
    search_fields = ['title', 'category', 'description']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('created_by', 'title', 'category', 'description')
        }),
        ('Settings', {
            'fields': ('difficulty', 'time_limit', 'total_marks', 'passing_marks', 'status')
        }),
        ('Advanced Options', {
            'fields': ('allow_retake', 'max_attempts', 'shuffle_questions', 'shuffle_options', 'show_correct_answers'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['quiz', 'question_text_preview', 'question_type', 'marks', 'order', 'created_at']
    list_filter = ['question_type', 'quiz', 'created_at']
    search_fields = ['question_text', 'quiz__title']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['quiz', 'order']
    
    def question_text_preview(self, obj):
        return obj.question_text[:50] + '...' if len(obj.question_text) > 50 else obj.question_text
    question_text_preview.short_description = 'Question'

@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ['question', 'option_text_preview', 'is_correct', 'order', 'created_at']
    list_filter = ['is_correct', 'created_at']
    search_fields = ['option_text', 'question__question_text']
    readonly_fields = ['created_at']
    
    def option_text_preview(self, obj):
        return obj.option_text[:50] + '...' if len(obj.option_text) > 50 else obj.option_text
    option_text_preview.short_description = 'Option Text'

@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ['student', 'quiz', 'status', 'score', 'percentage', 'passed', 'start_time', 'end_time']
    list_filter = ['status', 'passed', 'start_time']
    search_fields = ['student__username', 'quiz__title']
    readonly_fields = ['start_time', 'created_at', 'updated_at']
    date_hierarchy = 'start_time'
    
    fieldsets = (
        ('Attempt Information', {
            'fields': ('student', 'quiz', 'status')
        }),
        ('Timing', {
            'fields': ('start_time', 'end_time', 'time_spent')
        }),
        ('Scoring', {
            'fields': ('score', 'total_marks', 'percentage', 'passed')
        }),
        ('Analytics', {
            'fields': ('correct_answers', 'incorrect_answers', 'unanswered'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ['attempt', 'question', 'selected_option', 'is_correct', 'is_flagged', 'time_taken', 'created_at']
    list_filter = ['is_correct', 'is_flagged', 'created_at']
    search_fields = ['attempt__student__username', 'question__question_text']
    readonly_fields = ['created_at']

# Customize admin site headers
admin.site.site_header = 'QUIZMASTER Admin'
admin.site.site_title = 'QUIZMASTER Admin Portal'
admin.site.index_title = 'Welcome to QUIZMASTER Administration'
