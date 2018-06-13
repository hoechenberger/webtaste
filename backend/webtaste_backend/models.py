#!/usr/bin/env python

from flask_restplus import fields
from .app import api
from .constants import SUBSTANCES


quest_handler = api.model('QuestHandler', {
    # 'questHandler': fields.Raw(description='QuestHandler Object',
    #                            required=True)
})


quest_update = api.model('Quest Update', {
    # 'questHandler': fields.Raw(description='QuestHandler Object',
    #                            required=True),
    'concentration': fields.Float(description='Intensity', required=True),
    'responseCorrect': fields.Boolean(description='Response Correct',
                                      required=True),
    'comment': fields.String(description='Comment', required=False)
})


exp_info = api.model('Experiment Info', {
    'participant': fields.String(description='Participant ID',
                                 required=True),
    'age': fields.String(description='Age in years', required=True),
    'gender': fields.String(description='Gender', required=True,
                            enum=['undisclosed / other', 'male',
                                  'female']),
    'substance': fields.String(description='Substance', required=True,
                               enum=SUBSTANCES),
    'lateralization': fields.String(description='Lateralization',
                                    required=True,
                                    enum=['left side', 'right side',
                                          'both sides']),
    'session': fields.String(description='Session',
                             required=True),
    'date': fields.String(description='Date', required=True)})
