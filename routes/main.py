"""
Main blueprint — home page and dashboard.
"""

from flask import Blueprint, render_template, redirect, url_for, flash
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
