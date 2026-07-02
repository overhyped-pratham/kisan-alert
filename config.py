import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Application configuration loaded from environment variables."""

    SECRET_KEY = os.getenv('SECRET_KEY', 'krishisaar_hackathon_secret')
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'sqlite:///' + os.path.join(basedir, 'instance', 'krishisaar.db')
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload

    # CSRF protection
    WTF_CSRF_TIME_LIMIT = None  # tokens don't expire by time

    # API Keys
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', '')
    OPEN_WEATHER_APIKEY = os.getenv('OPEN_WEATHER_APIKEY', '')
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')
    HUGGINGFACE_TOKEN = os.getenv('HUGGINGFACE_LOGIN_TOKEN', '')
    ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY', '')

    # Expert portal access control (comma-separated emails)
    EXPERT_EMAILS = [
        e.strip().lower() for e in os.getenv('EXPERT_EMAILS', '').split(',') if e.strip()
    ]

    # Frontend origin for CORS (React dev server)
    FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')

    # Session cookie config for cross-origin auth (React SPA on different port)
    _env = os.getenv('FLASK_ENV', 'development').lower()
    if _env == 'production':
        SESSION_COOKIE_SAMESITE = 'None'
        SESSION_COOKIE_SECURE = True
    else:
        SESSION_COOKIE_SAMESITE = 'Lax'  # localhost can't do SameSite=None without HTTPS
        SESSION_COOKIE_SECURE = False

    @staticmethod
    def validate():
        """Fail fast if critical config is missing in production."""
        env = os.getenv('FLASK_ENV', 'development').lower()
        if env == 'production':
            if not os.getenv('SECRET_KEY') or os.getenv('SECRET_KEY') == 'krishisaar_hackathon_secret':
                raise RuntimeError(
                    'SECRET_KEY must be set to a random value in production. '
                    'Generate one: python -c "import secrets; print(secrets.token_hex(32))"'
                )
