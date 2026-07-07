"""
Routes package — register all blueprints with the Flask app.
"""


def register_blueprints(app):
    """Register all route blueprints on the given Flask app."""
    from routes.auth import auth
    from routes.main import main
    from routes.crop import crop
    from routes.fertilizer import fertilizer
    from routes.disease import disease
    from routes.weather import weather
    from routes.voice import voice
    from routes.sms import sms
    from routes.expert import expert
    from routes.api import api
    from routes.api_spa import api_spa
    from routes.alerts import alerts_bp

    app.register_blueprint(auth)
    app.register_blueprint(main)
    app.register_blueprint(crop)
    app.register_blueprint(fertilizer)
    app.register_blueprint(disease)
    app.register_blueprint(weather)
    app.register_blueprint(voice)
    app.register_blueprint(sms)
    app.register_blueprint(expert)
    app.register_blueprint(api)
    app.register_blueprint(api_spa, url_prefix='/api')
    app.register_blueprint(alerts_bp)

    from extensions import csrf
    if csrf:
        csrf.exempt(weather)
        csrf.exempt(voice)
        csrf.exempt(sms)
        csrf.exempt(api)
        csrf.exempt(api_spa)
        csrf.exempt(alerts_bp)
