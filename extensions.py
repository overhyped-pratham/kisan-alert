from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, current_user
from flask_cors import CORS
from flask_migrate import Migrate

try:
    from flask_wtf import CSRFProtect
    csrf = CSRFProtect()
except ImportError:  # Flask-WTF not installed
    csrf = None

# Initialize extensions without app context
db = SQLAlchemy()
login_manager = LoginManager()
cors = CORS()
migrate = Migrate()

login_manager.login_view = 'auth.login'
login_manager.login_message = 'Please log in to access this page.'
login_manager.session_protection = 'strong'


@login_manager.user_loader
def load_user(user_id):
    """Reload the User object from the user ID stored in the session."""
    # Imported here to avoid circular imports at module load time
    from models.user import User
    return User.query.get(int(user_id))


@login_manager.unauthorized_handler
def unauthorized():
    from flask import request, jsonify, redirect, url_for, flash
    if request.path.startswith('/api/') or request.path.startswith('/voice/'):
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401
    flash('Please log in to access this page.', 'info')
    return redirect(url_for('auth.login'))


