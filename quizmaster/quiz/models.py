from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models import Avg
from django.urls import reverse
from django.core.exceptions import ValidationError


class UserProfile(models.Model):
    """Extended user profile for additional information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    ROLE_CHOICES = [
        ('teacher', 'Teacher'),
        ('student', 'Student'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True)
    department = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.CharField(max_length=10, default='👨‍🎓')
    
    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - {self.get_role_display()}"
    
    def __repr__(self):
        return f"<UserProfile: {self.user.username}>"


class Teacher(models.Model):
    """Teacher profile with professional information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='teacher')
    phone = models.CharField(max_length=15, blank=True)
    qualification = models.CharField(max_length=100, blank=True, help_text="e.g., M.Sc., Ph.D.")
    specialization = models.CharField(max_length=100, blank=True, help_text="e.g., Mathematics, Physics")
    years_experience = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(50)]
    )
    institution = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True, help_text="Brief description about yourself")
    subjects = models.CharField(max_length=200, blank=True, help_text="Comma-separated subjects")
    is_approved = models.BooleanField(default=True)
    
    # Preferences
    language = models.CharField(max_length=10, default='en', choices=[
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
        ('de', 'German'),
        ('hi', 'Hindi'),
    ])
    timezone_field = models.CharField(max_length=50, default='Asia/Kolkata')
    email_notifications = models.CharField(max_length=20, default='all', choices=[
        ('all', 'All Notifications'),
        ('important', 'Important Only'),
        ('none', 'None'),
    ])
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Teacher'
        verbose_name_plural = 'Teachers'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - Teacher"
    
    def __repr__(self):
        return f"<Teacher: {self.user.username}>"
    
    @property
    def total_quizzes(self):
        """Get total number of quizzes created by this teacher"""
        return self.quizzes.count()
    
    @property
    def total_students(self):
        """Get total unique students who attempted teacher's quizzes"""
        return QuizAttempt.objects.filter(
            quiz__created_by=self
        ).values('student').distinct().count()


class Student(models.Model):
    """Student profile with academic information"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student')
    phone = models.CharField(max_length=15, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    grade = models.CharField(max_length=20, blank=True, help_text="e.g., Grade 10, Year 12")
    school = models.CharField(max_length=200, blank=True)
    bio = models.TextField(blank=True, help_text="Tell us about yourself")
    
    # Academic tracking
    enrollment_date = models.DateField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Student'
        verbose_name_plural = 'Students'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} - Student"
    
    def __repr__(self):
        return f"<Student: {self.user.username}>"
    
    @property
    def total_quizzes_attempted(self):
        """Get total number of quizzes attempted"""
        return QuizAttempt.objects.filter(student=self.user).count()
    
    @property
    def average_score(self):
        """Calculate average score across all completed quizzes"""
        avg = QuizAttempt.objects.filter(
            student=self.user,
            status='completed',
            percentage__isnull=False
        ).aggregate(Avg('percentage'))['percentage__avg']
        return round(avg, 2) if avg else 0


class Quiz(models.Model):
    """Quiz model with comprehensive settings"""
    # Creator information
    created_by = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='quizzes')
    
    # Basic information
    title = models.CharField(max_length=200, db_index=True)
    category = models.CharField(max_length=100, db_index=True, help_text="Subject category")
    description = models.TextField(blank=True)
    
    # Difficulty and settings
    DIFFICULTY_CHOICES = [
        ('easy', 'Easy'),
        ('medium', 'Medium'),
        ('hard', 'Hard'),
    ]
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES, default='medium')
    
    # Timing
    time_limit = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(300)],
        help_text="Time limit in minutes"
    )
    
    # Scoring
    total_marks = models.IntegerField(
        validators=[MinValueValidator(1)],
        help_text="Total marks for the quiz"
    )
    passing_marks = models.IntegerField(
        validators=[MinValueValidator(0)],
        help_text="Minimum marks to pass",
        null=True,
        blank=True
    )
    
    # Status
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('archived', 'Archived'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', db_index=True)
    
    # Additional settings
    allow_retake = models.BooleanField(default=True, help_text="Allow students to retake quiz")
    max_attempts = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(10)],
        help_text="Maximum attempts allowed"
    )
    shuffle_questions = models.BooleanField(default=False, help_text="Randomize question order")
    shuffle_options = models.BooleanField(default=False, help_text="Randomize option order")
    show_correct_answers = models.BooleanField(default=True, help_text="Show correct answers after completion")
    
    created_at = models.DateTimeField(default=timezone.now, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Quiz'
        verbose_name_plural = 'Quizzes'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['-created_at', 'status']),
            models.Index(fields=['category', 'difficulty']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.get_difficulty_display()}"
    
    def __repr__(self):
        return f"<Quiz: {self.id} - {self.title}>"
    
    def get_absolute_url(self):
        """Get absolute URL for admin"""
        return reverse('quiz:quiz-detail', kwargs={'quiz_id': self.id})
    
    def save(self, *args, **kwargs):
        # Auto-calculate passing marks if not set (60% of total)
        if not self.passing_marks:
            self.passing_marks = int(self.total_marks * 0.6)
        super().save(*args, **kwargs)
    
    @property
    def question_count(self):
        """Get total number of questions"""
        return self.questions.count()
    
    @property
    def attempt_count(self):
        """Get total number of attempts"""
        return self.attempts.count()
    
    @property
    def average_score(self):
        """Calculate average score across all attempts"""
        avg = self.attempts.filter(
            status='completed',
            percentage__isnull=False
        ).aggregate(Avg('percentage'))['percentage__avg']
        return round(avg, 2) if avg else 0
    
    @property
    def completion_rate(self):
        """Calculate percentage of completed attempts"""
        total = self.attempts.count()
        if total == 0:
            return 0
        completed = self.attempts.filter(status='completed').count()
        return round((completed / total) * 100, 2)


class Question(models.Model):
    """Question model with multiple choice options"""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField(help_text="The question to ask")
    
    # Question type
    QUESTION_TYPE_CHOICES = [
        ('multiple_choice', 'Multiple Choice'),
        ('true_false', 'True/False'),
    ]
    question_type = models.CharField(max_length=20, choices=QUESTION_TYPE_CHOICES, default='multiple_choice')
    
    # Scoring
    marks = models.IntegerField(
        default=1,
        validators=[MinValueValidator(1), MaxValueValidator(100)]
    )
    
    # Options (kept for backward compatibility)
    option_a = models.CharField(max_length=500, blank=True, default='')
    option_b = models.CharField(max_length=500, blank=True, default='')
    option_c = models.CharField(max_length=500, blank=True, default='')
    option_d = models.CharField(max_length=500, blank=True, default='')
    
    # Correct answer (0=A, 1=B, 2=C, 3=D)
    correct_answer = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        help_text="0=Option A, 1=Option B, 2=Option C, 3=Option D"
    )
    
    # Additional information
    explanation = models.TextField(blank=True, help_text="Explanation for the correct answer")
    order = models.IntegerField(default=0, help_text="Display order in quiz")
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Question'
        verbose_name_plural = 'Questions'
        ordering = ['order', 'id']
        indexes = [
            models.Index(fields=['quiz', 'order']),
        ]
    
    def __str__(self):
        return f"{self.quiz.title} - Q{self.order + 1}"
    
    def __repr__(self):
        return f"<Question: {self.id} - {self.quiz.title}>"
    
    @property
    def options(self):
        """Return list of non-empty options"""
        opts = []
        if self.option_a:
            opts.append(self.option_a)
        if self.option_b:
            opts.append(self.option_b)
        if self.option_c:
            opts.append(self.option_c)
        if self.option_d:
            opts.append(self.option_d)
        return opts
    
    @property
    def correct_option_text(self):
        """Get the text of the correct option"""
        options = self.options
        if 0 <= self.correct_answer < len(options):
            return options[self.correct_answer]
        return None


class Option(models.Model):
    """Separate model for question options (New flexible approach)"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='option_set')
    option_text = models.CharField(max_length=500)
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Option'
        verbose_name_plural = 'Options'
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.question.quiz.title} - Q{self.question.order + 1} - Option {self.order + 1}"
    
    def __repr__(self):
        return f"<Option: {self.id} - {self.question.id}>"


class QuizAttempt(models.Model):
    """Quiz attempt tracking with detailed analytics"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    
    # Timing
    start_time = models.DateTimeField(default=timezone.now, db_index=True)
    end_time = models.DateTimeField(null=True, blank=True)
    time_spent = models.IntegerField(default=0, help_text="Time spent in seconds")
    
    # Scoring
    score = models.IntegerField(null=True, blank=True, help_text="Marks obtained")
    max_score = models.IntegerField(default=0, help_text="Maximum possible marks for this attempt")
    total_marks = models.IntegerField(default=0, help_text="Total marks for this attempt (deprecated, use max_score)")
    percentage = models.FloatField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Status
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('abandoned', 'Abandoned'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress', db_index=True)
    
    # Analytics
    correct_answers = models.IntegerField(default=0)
    incorrect_answers = models.IntegerField(default=0)
    unanswered = models.IntegerField(default=0)
    
    # Result
    passed = models.BooleanField(null=True, blank=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=255, blank=True)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Quiz Attempt'
        verbose_name_plural = 'Quiz Attempts'
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['-start_time', 'status']),
            models.Index(fields=['student', 'quiz']),
        ]
    
    def __str__(self):
        student_name = self.student.get_full_name() or self.student.username
        return f"{student_name} - {self.quiz.title} ({self.get_status_display()})"
    
    def __repr__(self):
        return f"<QuizAttempt: {self.id} - {self.student.username}>"
    
    def clean(self):
        """Validate attempt data"""
        if self.end_time and self.end_time < self.start_time:
            raise ValidationError('End time cannot be before start time')
    
    def save(self, *args, **kwargs):
        # Sync max_score with total_marks for backward compatibility
        if self.max_score and not self.total_marks:
            self.total_marks = self.max_score
        elif self.total_marks and not self.max_score:
            self.max_score = self.total_marks
        
        # Calculate percentage if score is available
        if self.score is not None and self.max_score > 0:
            self.percentage = (self.score / self.max_score) * 100
            
            # Determine pass/fail
            if self.quiz.passing_marks:
                self.passed = self.score >= self.quiz.passing_marks
        
        # Calculate time spent if end_time is set
        if self.end_time and self.start_time:
            self.time_spent = int((self.end_time - self.start_time).total_seconds())
        
        super().save(*args, **kwargs)
    
    @property
    def time_spent_formatted(self):
        """Get formatted time spent (HH:MM:SS)"""
        hours, remainder = divmod(self.time_spent, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    @property
    def is_passed(self):
        """Check if student passed the quiz"""
        if self.passed is not None:
            return self.passed
        if self.score and self.quiz.passing_marks:
            return self.score >= self.quiz.passing_marks
        return False
    
    @classmethod
    def get_attempt_details(cls, attempt_id):
        """Optimized query for attempt details"""
        return cls.objects.filter(id=attempt_id).select_related(
            'student', 'quiz', 'quiz__created_by'
        ).prefetch_related('answers__question').first()


class StudentAnswer(models.Model):
    """Individual answer for each question in an attempt"""
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    # Changed to ForeignKey to Option model for new approach
    selected_option = models.ForeignKey(
        Option, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Selected option (new approach)"
    )
    
    # Kept for backward compatibility with old integer-based approach
    selected_option_index = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(3)],
        help_text="Selected option index (0-3) - deprecated"
    )
    
    is_correct = models.BooleanField(default=False)
    is_flagged = models.BooleanField(default=False, help_text="Question flagged for review")
    time_taken = models.IntegerField(default=0, help_text="Time taken to answer in seconds")
    
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        verbose_name = 'Student Answer'
        verbose_name_plural = 'Student Answers'
        unique_together = ['attempt', 'question']
        indexes = [
            models.Index(fields=['attempt', 'question']),
        ]
    
    def __str__(self):
        student_name = self.attempt.student.get_full_name() or self.attempt.student.username
        return f"{student_name} - Q{self.question.order + 1} ({'✓' if self.is_correct else '✗'})"
    
    def __repr__(self):
        return f"<StudentAnswer: {self.id} - {self.attempt.id}>"
    
    def save(self, *args, **kwargs):
        # Auto-check if answer is correct (new approach)
        if self.selected_option:
            self.is_correct = self.selected_option.is_correct
        # Backward compatibility with old index approach
        elif self.selected_option_index is not None:
            self.is_correct = (self.selected_option_index == self.question.correct_answer)
        
        super().save(*args, **kwargs)
    
    @property
    def selected_option_text(self):
        """Get the text of the selected option"""
        # New approach
        if self.selected_option:
            return self.selected_option.option_text
        
        # Backward compatibility with old approach
        options = self.question.options
        if 0 <= self.selected_option_index < len(options):
            return options[self.selected_option_index]
        return None
    
    @classmethod
    def get_attempt_answers(cls, attempt_id):
        """Optimized query for attempt answers"""
        return cls.objects.filter(
            attempt_id=attempt_id
        ).select_related('question', 'selected_option')
