#!/usr/bin/env python

from flask import Flask, request, abort, Response
from flask_restplus import Api, Resource, fields

app = Flask(__name__)
api = Api(app)

from . import views


if __name__ == '__main__':
    app.run()
