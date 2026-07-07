import os
from flask import Blueprint, render_template, redirect, url_for, flash, send_from_directory, current_app
from flask_login import login_required, current_user

main = Blueprint('main', __name__)


@main.route('/')
@main.route('/home')
def index():
    """Landing page."""
    return render_template('index.html')


@main.route('/dashboard')
@login_required
def dashboard():
    """Main dashboard — requires login."""
    return render_template('dashboard.html', user=current_user)


# ---------------------------------------------------------------------------
# Serve built React SPA in production/deployments
# ---------------------------------------------------------------------------

@main.route('/app')
@main.route('/app/')
@main.route('/app/<path:path>')
def serve_react_spa(path=None):
    """Serve the modern React SPA entry point."""
    dist_dir = os.path.join(current_app.root_path, 'frontend', 'dist')
    return send_from_directory(dist_dir, 'index.html')


@main.route('/assets/<path:filename>')
def serve_react_assets(filename):
    """Serve built JS/CSS bundle assets for the React SPA."""
    assets_dir = os.path.join(current_app.root_path, 'frontend', 'dist', 'assets')
    return send_from_directory(assets_dir, filename)


@main.route('/designs/<path:filename>')
def serve_react_designs(filename):
    """Serve public assets (mockups, screenshots, icons) for the React SPA."""
    designs_dir = os.path.join(current_app.root_path, 'frontend', 'dist', 'designs')
    return send_from_directory(designs_dir, filename)

