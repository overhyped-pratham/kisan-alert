"""
ArogyaKrishi (KrishiSaar AI) — Flask App Factory

Modular agricultural advisory platform for Indian farmers.
Features: Crop recommendation, disease detection, fertilizer advice,
weather alerts, IoT sensor simulation, voice assistant, SMS advisory,
and RSK expert portal.
"""

import os

# --- Set Keras backend to JAX BEFORE any keras import ---
os.environ.setdefault("KERAS_BACKEND", "jax")

from flask import Flask
from config import Config
from extensions import db, login_manager, cors, migrate, csrf
from routes import register_blueprints


def create_app(config_class=Config):
    """Application factory — creates and configures the Flask app."""

    app = Flask(__name__, static_folder='static', instance_relative_config=True)
    app.config.from_object(config_class)

    # --- Validate production config ---
    config_class.validate()

    # --- Ensure required directories exist ---
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    os.makedirs(os.path.join(app.instance_path), exist_ok=True)

    # --- Initialize extensions ---
    db.init_app(app)
    login_manager.init_app(app)
    cors.init_app(app, supports_credentials=True, origins=[config_class.FRONTEND_ORIGIN])
    migrate.init_app(app, db)
    if csrf:
        csrf.init_app(app)
    else:
        @app.context_processor
        def inject_csrf_token():
            return dict(csrf_token=lambda: "")

    # --- Register all route blueprints ---
    register_blueprints(app)

    # --- Create database tables (within app context) ---
    with app.app_context():
        # Import models so db.create_all detects them
        import models  # noqa: F401
        db.create_all()
        # Schema migration fallback: dynamically add columns to User table if they do not exist
        try:
            db.session.execute(db.text("ALTER TABLE user ADD COLUMN farm_size VARCHAR(50) DEFAULT '5 Acres'"))
            db.session.commit()
        except Exception:
            db.session.rollback()

        try:
            db.session.execute(db.text("ALTER TABLE user ADD COLUMN crop_type VARCHAR(100) DEFAULT 'Wheat'"))
            db.session.commit()
        except Exception:
            db.session.rollback()

    # --- Load ML models and services at startup ---
    _load_services(app)

    return app


def _load_services(app):
    """Load ML models and external services after app context is ready."""
    with app.app_context():
        from services.crop_service import load_crop_models
        from services.disease_service import load_disease_pipeline
        from services.soil_service import load_soil_models

        load_crop_models()
        load_disease_pipeline()
        load_soil_models()

        # Start automatic alert scheduler (weather every 6h, morning advisory at 7 AM IST)
        from services.alert_scheduler import start_scheduler
        start_scheduler(app)

        # Print startup status
        print("\n" + "=" * 50)
        print("  KrishiSaar AI -- ArogyaKrishi Backend")
        print("  All services loaded. Ready to serve.")
        print("=" * 50 + "\n")


# --- Run directly (development) ---
if __name__ == '__main__':
    app = create_app()
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=debug, host='0.0.0.0', port=port)
