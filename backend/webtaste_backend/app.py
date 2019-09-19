#!/usr/bin/env python

import os
from flask import Flask
from flask_restplus import Api
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from passlib.context import CryptContext
from itsdangerous import URLSafeSerializer


app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY')
app.config.update(
    # SQLAlchemy settings
    SQLALCHEMY_DATABASE_URI=os.environ.get('SQLALCHEMY_DATABASE_URI'),
    SQLALCHEMY_TRACK_MODIFICATIONS=os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS') == 'True',
    SQLALCHEMY_POOL_RECYCLE=int(os.environ.get('SQLALCHEMY_POOL_RECYCLE')),
    # Email settings
    SMTP_SERVER=os.environ.get('SMTP_SERVER'),
    SMTP_USER=os.environ.get('SMTP_USER'),
    SMTP_PASSWORD=os.environ.get('SMTP_PASSWORD'),
    SENSORY_TESTING_MAIL_FROM=os.environ.get('SENSORY_TESTING_MAIL_FROM'),
    # Flask-Login settings
    REMEMBER_COOKIE_SECURE=os.environ.get('REMEMBER_COOKIE_SECURE') == 'True',
    REMEMBER_COOKIE_HTTPONLY=os.environ.get('REMEMBER_COOKIE_HTTPONLY') == 'True',
    SESSION_PROTECTION=os.environ.get('SESSION_PROTECTION'),
    # Flask cookie settings, see
    # http://flask.pocoo.org/docs/0.12/config/#builtin-configuration-values
    SESSION_COOKIE_SAMESITE=os.environ.get('SESSION_COOKIE_SAMESITE') == 'True',
    SESSION_COOKIE_SECURE=os.environ.get('SESSION_COOKIE_SECURE') == 'True',
    SESSION_COOKIE_HTTPONLY=os.environ.get('SESSION_COOKIE_HTTPONLY') == 'True'
)

db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
api = Api(app)

crypto_context = CryptContext(schemes=['pbkdf2_sha256'])
serializer_for_email_confirmation = URLSafeSerializer(
    secret_key=app.secret_key,
    salt='email-confirmation'
)

from . import views
db.create_all()  # We must do this AFTER importing views.

# In development mode, make sure we can log in!
if app.config['ENV'] == 'development':
    from datetime import datetime
    from .models import User

    app.config.update(
        SENSORY_TESTING_DEFAULT_USER=os.environ.get('SENSORY_TESTING_DEFAULT_USER'),
        SENSORY_TESTING_DEFAULT_PASSWORD=os.environ.get('SENSORY_TESTING_DEFAULT_PASSWORD'),
        SENSORY_TESTING_DEFAULT_EMAIL=os.environ.get('SENSORY_TESTING_DEFAULT_EMAIL')
    )

    user_name = app.config['SENSORY_TESTING_DEFAULT_USER']
    email = app.config['SENSORY_TESTING_DEFAULT_EMAIL']
    password_hash = crypto_context.hash(app.config['SENSORY_TESTING_DEFAULT_PASSWORD'])
    date = datetime.utcnow()

    mask = User.name == user_name
    existing_user = (User
                     .query
                     .filter(mask)
                     .first())

    # Only create user if it doesn't exist already.
    if existing_user is None:
        user = User(name=user_name,
                    password=password_hash,
                    email=email,
                    emailConfirmed=True,
                    emailConfirmedDateUtc=date,
                    registrationDateUtc=date)

        db.session.add(user)
        db.session.commit()


if __name__ == '__main__':
    app.run()
