#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask_restplus import fields
from . import api

quest_json_response = api.model('Resource', {
    'Quest': fields.String,
})
