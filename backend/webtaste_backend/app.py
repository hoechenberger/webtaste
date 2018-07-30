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
    SQLALCHEMY_TRACK_MODIFICATIONS=os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS'),
    SQLALCHEMY_POOL_RECYCLE=int(os.environ.get('SQLALCHEMY_POOL_RECYCLE')),
    # Email settings
    SMTP_SERVER=os.environ.get('SMTP_SERVER'),
    SMTP_USER=os.environ.get('SMTP_USER'),
    SMTP_PASSWORD=os.environ.get('SMTP_PASSWORD'),
    SENSORY_TESTING_MAIL_FROM=os.environ.get('SENSORY_TESTING_MAIL_FROM'),
    # Flask-Login settings
    REMEMBER_COOKIE_SECURE=os.environ.get('REMEMBER_COOKIE_SECURE'),
    REMEMBER_COOKIE_HTTPONLY=os.environ.get('REMEMBER_COOKIE_HTTPONLY'),
    SESSION_PROTECTION=os.environ.get('SESSION_PROTECTION'),
    # Flask cookie settings, see
    # http://flask.pocoo.org/docs/0.12/config/#builtin-configuration-values
    SESSION_COOKIE_SAMESITE=os.environ.get('SESSION_COOKIE_SAMESITE'),
    SESSION_COOKIE_SECURE=os.environ.get('SESSION_COOKIE_SECURE'),
    SESSION_COOKIE_HTTPONLY=os.environ.get('SESSION_COOKIE_HTTPONLY')
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

if __name__ == '__main__':
    app.run()
