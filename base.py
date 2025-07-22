"""
Base settings for the Lux API project.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from .env file
load_dotenv(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-default-key-for-development')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

# Application definition
DJANGO_APPS = [
    'grappelli',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework.authtoken',
    'drf_yasg',
    'corsheaders',
    'django_filters',
    'widget_tweaks',
    # 'unfold',  # Temporarily disabled to troubleshoot admin access
    # 'background_task',  # Temporarily disabled due to compatibility issues
]

LOCAL_APPS = [
    'apps.core',
    'apps.users',
    'apps.bio',
    'apps.jobmanagement',
    'apps.holidays',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'lux_db',
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '3306'),
        'OPTIONS': {
            'init_command': "SET time_zone = '+00:00'",
            'charset': 'utf8mb4',
            'sql_mode': 'STRICT_TRANS_TABLES',
        },
        'TIME_ZONE': 'Europe/London',
    }
}

# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'en-gb'

TIME_ZONE = 'Europe/London'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, "static"),
]

# Media files
MEDIA_URL = '/media/'
# Always use project-relative media directory to avoid permission issues
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Azure Storage Configuration
# Only use Azure storage if credentials are provided
if os.environ.get('AZURE_ACCOUNT_NAME') and os.environ.get('AZURE_ACCOUNT_KEY'):
    DEFAULT_FILE_STORAGE = 'storages.backends.azure_storage.AzureStorage'
    
    # Azure credentials
    AZURE_ACCOUNT_NAME = os.environ.get('AZURE_ACCOUNT_NAME')
    AZURE_ACCOUNT_KEY = os.environ.get('AZURE_ACCOUNT_KEY')
    AZURE_CONTAINER = os.environ.get('AZURE_CONTAINER', 'images')
    
    # Use CDN if configured
    AZURE_CUSTOM_DOMAIN = os.environ.get('AZURE_CUSTOM_DOMAIN')
    
    # Optional: Control file overwriting
    AZURE_OVERWRITE_FILES = os.environ.get('AZURE_OVERWRITE_FILES', 'True') == 'True'
    
    # Optional: Set default permissions
    AZURE_OBJECT_PARAMETERS = {
        'cache_control': 'max-age=86400',  # Cache for 1 day
        'content_disposition': 'inline',
    }

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Django REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Allow all origins in development
CORS_ALLOWED_ORIGINS = os.environ.get('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Swagger settings
SWAGGER_SETTINGS = {
    'SECURITY_DEFINITIONS': {
        'Token': {
            'type': 'apiKey',
            'name': 'Authorization',
            'in': 'header'
        }
    },
    'USE_SESSION_AUTH': True,
    'LOGIN_URL': 'rest_framework:login',
    'LOGOUT_URL': 'rest_framework:logout',
}

# Email Configuration for testing
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Use console backend for testing
EMAIL_HOST = 'smtp.office365.com'  # Microsoft's SMTP server
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'noreply@ashadegreener.co.uk'
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')  # Get from environment variable for security
DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

# Caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'my_cache_table',
    }
}

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,  # Disable existing loggers
    'formatters': {
        'minimal': {
            'format': '[{levelname}] {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'ERROR',  # Only show ERROR and above
            'class': 'logging.StreamHandler',
            'formatter': 'minimal',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'ERROR',  # Only show ERROR and above
            'propagate': False,  # Don't propagate to other loggers
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'CRITICAL',  # Only show CRITICAL issues
            'propagate': False,
        },
        'apps': {
            'handlers': ['console'],
            'level': 'ERROR',  # Only show ERROR and above
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'ERROR',
    }
}

# Connection max age
CONN_MAX_AGE = 600

# API base URL
API_BASE_URL = os.environ.get('API_BASE_URL', 'http://localhost:8000/')

# Frontend URL for links in emails and notifications
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

# MFA Settings
MFA_ENABLED = True
MFA_TEST_MODE = False  # Set to True only for testing
# MFA_TEST_CODE = '123456'  # Only used when MFA_TEST_MODE is True
MFA_ENFORCE_FOR_ALL = True  # Enforce MFA for all users

# CORS Settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Twilio Configuration
TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID')
TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
TWILIO_PHONE_NUMBER = os.environ.get('TWILIO_PHONE_NUMBER')
TWILIO_WEBHOOK_BASE_URL = os.environ.get('TWILIO_WEBHOOK_BASE_URL')
TWILIO_MESSAGING_SERVICE_SID = os.environ.get('TWILIO_MESSAGING_SERVICE_SID', None)
TWILIO_VERIFY_SERVICE_SID = os.environ.get('TWILIO_VERIFY_SERVICE_SID', None)

# Job Automation Settings
JOB_AUTOMATION = {
    'NO_COMS': {
        'enabled': True,
        'days_threshold': 3,  # No readings for X days
        'job_type_name': 'No Communication',
        'check_duplicate': True
    },
    'ZERO_READS': {
        'enabled': True,
        'days_to_check': 4,  # Check last X days
        'readings_to_compare': 3,  # Compare last X readings
        'job_type_name': 'Zero Generation',
        'check_duplicate': True
    }
}
