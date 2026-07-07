"""
Auth blueprint — login, signup, logout with Flask-Login.
"""

from flask import Blueprint, render_template, redirect, url_for, flash, request
from flask_login import login_user, logout_user
from extensions import db
from models.user import User

auth = Blueprint('auth', __name__)


@auth.route('/signup', methods=['GET', 'POST'])
def register():
    """Handle user registration."""
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = request.form['password']
        phone = request.form.get('phone', '').strip()

        if User.query.filter_by(email=email).first():
            flash('Email address already registered.', 'error')
            return render_template('signup.html')

        new_user = User(name=name, email=email, phone=phone or None)
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()

        flash('Registration successful! Please log in.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('signup.html')


@auth.route('/login', methods=['GET', 'POST'])
def login():
    """Handle user login."""
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            login_user(user)
            flash('Logged in successfully.', 'success')
            return redirect(url_for('main.dashboard'))

        flash('Invalid email or password.', 'error')
        return render_template('login.html')

    return render_template('login.html')


@auth.route('/logout')
def logout():
    """Log out the current user."""
    logout_user()
    flash('Logged out successfully.', 'info')
    return redirect(url_for('auth.login'))
