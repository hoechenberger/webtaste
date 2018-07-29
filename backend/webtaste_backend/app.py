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
    SQLALCHEMY_DATABASE_URI=os.environ.get('SQLALCHEMY_DATABASE_URI'),
    SQLALCHEMY_TRACK_MODIFICATIONS=os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS'),
    SQLALCHEMY_POOL_RECYCLE=int(os.environ.get('SQLALCHEMY_POOL_RECYCLE')),
    SMTP_SERVER=os.environ.get('SMTP_SERVER'),
    SMTP_USER=os.environ.get('SMTP_USER'),
    SMTP_PASSWORD=os.environ.get('SMTP_PASSWORD'),
    SENSORY_TESTING_MAIL_FROM=os.environ.get('SENSORY_TESTING_MAIL_FROM'),
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
