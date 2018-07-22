#!/usr/bin/env python

import os
from flask import Flask
from flask_restplus import Api
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = os.environ.get('SQLALCHEMY_TRACK_MODIFICATIONS', False)
app.config['SQLALCHEMY_POOL_RECYCLE'] = os.environ.get('SQLALCHEMY_POOL_RECYCLE', 500)
db = SQLAlchemy(app)

api = Api(app)

from . import views
db.create_all()  # We must do this AFTER importing views.


if __name__ == '__main__':
    app.run()
