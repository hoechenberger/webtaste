#!/usr/bin/env python

from flask_restplus.fields import String, Integer, Float, Boolean, DateTime, Nested
from .app import api, db
from .constants import SUBSTANCES


# quest_handler = api.model('QuestHandler', {
#     # 'staircaseHandler': fields.Raw(description='QuestHandler Object',
#     #                            required=True)
# })


# response_update = api.model('Response Update', {
#     # 'staircaseHandler': fields.Raw(description='QuestHandler Object',
#     #                            required=True),
#     'modality': String(description='Modality', required=True,
#                        enum=['gustatory', 'olfactory']),
#     'algorithm': String(description='Algorithm', required=True,
#                         enum=['QUEST', 'Hummel']),
#     'concentration': Float(description='Intensity', required=True),
#     'responseCorrect': Boolean(description='Response Correct',
#                                required=True),
#     'comment': String(description='Comment', required=False)
# })


measurement_metadata = api.model('Measurement Metadata', {
    'participant': String(description='Participant ID',
                          required=True, example='subj-123'),
    'age': Integer(description='Age in years', required=True, example=31),
    'gender': String(description='Gender', required=True,
                     enum=['undisclosed / other', 'male',
                           'female']),
    'modality': String(description='Modality', required=True,
                       enum=['gustatory', 'olfactory']),
    'algorithm': String(description='Algorithm', required=True,
                        enum=['QUEST', 'Hummel']),
    'substance': String(description='Substance', required=True,
                        enum=SUBSTANCES),
    'lateralization': String(description='Lateralization',
                             required=True,
                             enum=['left side', 'right side',
                                   'both sides']),
    'startVal': Integer(description='Starting concentration',
                        enum=[15, 16], example=15),
    'session': String(description='Session',
                      required=True, example='Test'),
    'date': DateTime(description='Date', required=True)})

trial = api.model('Trial', {
    'id': Integer(description='Trial number', required=True),
    'trialNumber': Integer(description='Trial number', required=True),
    'concentration': Float(description='The stimulus concentration to use',
                           required=True),
    'responseCorrect': Boolean(description='Whether the participant gave the'
                                           'correct response')})

trial_participant_response = api.model('Trial Response', {
    'response': String(description='The given response'),
    'responseCorrect': Boolean(description='Whether the participant gave the'
                                           'correct response',
                               required=True)})

trial_server_response = api.model('Trial', {
    'trialNumber': Integer(description='Trial number', required=True),
    'concentration': Float(description='The stimulus concentration to use',
                           required=True),
    'sampleNumber': Integer(description='The number of the stimulus sample',
                            required=True),
    'response': String(description='The given response', required=True),
    'responseCorrect': Boolean(description='Whether the participant gave the'
                                           'correct response',
                               required=True)})

trial_new = api.model('New trial', {})


measurement = api.model('Measurement', {
    'id': Integer(description='Measurement ID', required=True),
    'started': Boolean(description='Staircase started', default=False,
                       required=True),
    'finished': Boolean(description='Staircase finished', default=False,
                        required=True),
    'trialsCompletedCount': Integer(description='Number of completed trials',
                                    default=0, required=True),
    'currentTrialNumber': Integer(description='Number of the current trial',
                                  required=True),
    'trials': Nested(trial),
    'metadata': Nested(measurement_metadata, attribute='metadata_')
})


class Measurement(db.Model):
    __tablename__ = 'measurements'

    id = db.Column(db.Integer, primary_key=True)
    finished = db.Column(db.Boolean)
    trialsCompletedCount = db.Column(db.Integer)
    currentTrialNumber = db.Column(db.Integer)

    trials = db.relationship('Trial',
                             back_populates='measurement',
                             cascade='all, delete, delete-orphan')

    staircaseHandler = db.relationship('StaircaseHandler',
                                       uselist=False,  # one-to-one
                                       back_populates='measurement',
                                       cascade='all, delete, delete-orphan')

    # 'metadata' is reserved.
    metadata_ = db.relationship('MeasurementMetadata',
                                uselist=False,  # one-to-one
                                back_populates='measurement',
                                cascade='all, delete, delete-orphan')

    def __repr__(self):
        return (f'Measurement(participant={self.participant}, '
                f'age={self.age}, gender={self.gender})')


class MeasurementMetadata(db.Model):
    __tablename__ = 'measurement_metadata'

    id = db.Column(db.Integer, primary_key=True)
    participant = db.Column(db.String(length=20))
    age = db.Column(db.Integer)
    gender = db.Column(db.String(length=30))
    modality = db.Column(db.String(length=30))
    algorithm = db.Column(db.String(length=100))
    substance = db.Column(db.String(length=100))
    lateralization = db.Column(db.String(length=30))
    startVal = db.Column(db.Float)
    session = db.Column(db.String(length=100))
    date = db.Column(db.String(length=100))

    measurementId = db.Column(db.Integer, db.ForeignKey('measurements.id'))
    measurement = db.relationship('Measurement', back_populates='metadata_')


class Trial(db.Model):
    __tablename__ = 'trials'

    id = db.Column(db.Integer, primary_key=True)
    trialNumber = db.Column(db.Integer, default=1)
    concentration = db.Column(db.Float)
    sampleNumber = db.Column(db.Integer)
    response = db.Column(db.String(length=30))
    responseCorrect = db.Column(db.Boolean)

    measurementId = db.Column(db.Integer, db.ForeignKey('measurements.id'))
    measurement = db.relationship('Measurement', back_populates='trials')

    # def __repr__(self):
    #     return (f'Trial(trialNumber={self.trialNumber}, '
    #             f'concentration={self.concentration}, '
    #             f'jar={self.jar}, '
    #             f'responseCorrect={self.responseCorrect})')


class StaircaseHandler(db.Model):
    __tablename__ = 'staircase_handlers'

    id = db.Column(db.Integer, primary_key=True)
    staircaseHandler = db.Column(db.Text(length=500000))

    measurementId = db.Column(db.Integer, db.ForeignKey('measurements.id'))
    measurement = db.relationship('Measurement',
                                  back_populates='staircaseHandler')

