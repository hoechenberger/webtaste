#!/usr/bin/env python

from flask import Flask
from flask_restplus import Api
from flask_sqlalchemy import SQLAlchemy


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:////tmp/test.db'
# app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
db = SQLAlchemy(app)

api = Api(app)

from . import views
db.create_all()  # We must do this AFTER importing views.


if __name__ == '__main__':
    app.run()
