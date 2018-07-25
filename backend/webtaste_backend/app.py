#!/usr/bin/env python

import os
from flask import Flask
from flask_restplus import Api
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager


app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS')
app.config['SQLALCHEMY_POOL_RECYCLE'] = int(os.environ.get('SQLALCHEMY_POOL_RECYCLE'))
db = SQLAlchemy(app)

login_manager = LoginManager()
login_manager.init_app(app)
api = Api(app)

from . import views
db.create_all()  # We must do this AFTER importing views.


if __name__ == '__main__':
    app.run()
