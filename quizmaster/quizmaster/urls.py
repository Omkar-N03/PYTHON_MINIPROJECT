"""
URL configuration for quizmaster project.

This file routes all URLs for the QUIZMASTER application.
Static and media files are served during development.

For production deployment:
- Static files: Served by Nginx/Apache using STATIC_ROOT
- Media files: Served by Nginx/Apache using MEDIA_ROOT
- Set DEBUG=False in production environment
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.http import JsonResponse


# ==========================================
# CUSTOM ERROR HANDLERS - DISABLED FOR NOW
# ==========================================
# handler404 = 'quiz.views.custom_404'
# handler500 = 'quiz.views.custom_500'


# ==========================================
# UTILITY VIEWS
# ==========================================
def health_check(request):
    """Health check endpoint for monitoring and load balancers"""
    return JsonResponse({
        'status': 'healthy',
        'service': 'quizmaster',
        'version': '2.0.0',
        'debug': settings.DEBUG
    })


# ==========================================
# MAIN URL PATTERNS
# ==========================================
urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Health check (for deployment monitoring)
    path('health/', health_check, name='health_check'),
    
    # Home page
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    
    # Django authentication URLs (login, logout, password change, password reset)
    path('accounts/', include('django.contrib.auth.urls')),
    
    # Quiz application - ✅ CRITICAL FIX
    path('quiz/', include('quiz.urls')),
]


# ==========================================
# DEVELOPMENT-ONLY CONFIGURATIONS
# ==========================================
if settings.DEBUG:
    urlpatterns += static(
        settings.STATIC_URL, 
        document_root=settings.STATIC_ROOT
    )
    
    urlpatterns += static(
        settings.MEDIA_URL, 
        document_root=settings.MEDIA_ROOT
    )


# ==========================================
# ADMIN SITE CUSTOMIZATION
# ==========================================
admin.site.site_header = "QUIZMASTER Administration"
admin.site.site_title = "QUIZMASTER Admin Portal"
admin.site.index_title = "Welcome to QUIZMASTER Admin Panel"
admin.site.site_url = "/"
