#!/usr/bin/env python

from flask_restplus.fields import String, Integer, Float, Boolean, Nested
from .app import api, db, login_manager
from .constants import SUBSTANCES


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
    'sessionName': String(description='Session',
                          required=True, example='Test'),
    'date': String(description='Date', required=True)})


trial_participant_response = api.model('Trial Response', {
    'response': String(description='The given response'),
    'responseCorrect': Boolean(description='Whether the participant gave the'
                                           'correct response',
                               required=True)})


trial_server_response = api.model('Trial', {
    'trialNumber': Integer(description='Trial number', required=True,
                           attribute='number'),
    'concentration': Float(description='The stimulus concentration to use',
                           required=True),
    'sampleNumber': Integer(description='The number of the stimulus sample',
                            required=True),
    'stimulusOrder': String(description='Stimulus order'),
    'correctResponseIndex': Integer(description='Index of the correct response'),
    'response': String(description='The given response', required=True),
    'responseCorrect': Boolean(description='Whether the participant gave the'
                                           'correct response',
                               required=True)})

trial_new = api.model('New trial', {})

report_new = api.model('New report', {})

study_new = api.model('New study', {
    'name': String(description='Name of the study', required=True)
})

# session_new = api.model('New session', {
#     'name': String(description='Name of the session', required=True)
# })

study = api.model('Study', {
    'id': Integer(description='Study ID', required=True),
    'name': String(description='Name of the study', required=True),
    'completed': Boolean(description='Whether the study has been completed',
                         default=False)
})

# session = api.model('Session', {
#     'id': Integer(description='Study ID', required=True),
#     'name': String(description='Name of the study', required=True),
# })

measurement = api.model('Measurement', {
    'number': Integer(description='Measurement Number', required=True),
    'state': String(description='State of the measurement', required=True,
                    enum=['created', 'running', 'finished', 'aborted']),
    'trialsCompletedCount': Integer(description='Number of completed trials',
                                    default=0, required=True),
    'currentTrialNumber': Integer(description='Number of the current trial',
                                  required=True),
    'trials': Nested(trial_server_response),
    'metadata': Nested(measurement_metadata, attribute='metadata_'),
    'threshold': Float(description='The estimated threshold'),
    'study': Nested(study)
})

measurement_state = api.model('Measurement', {
    'state': String(description='State of the measurement', required=True,
                    enum=['created', 'running', 'finished', 'aborted'])
})



user_registration = api.model('User Registration', {
    'user': String(description='User name', required=True),
    'email': String(description='Email address', required=True),
    'password': String(description='Password', required=True)
})

user_login = api.model('User Login', {
    'user': String(description='User name', required=True),
    'password': String(description='Password', required=True)
})


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(length=30), unique=True)
    email = db.Column(db.String(length=100), unique=True)
    password = db.Column(db.String(length=100))
    authenticated = db.Column(db.Boolean, default=False)
    registrationDateUtc = db.Column(db.DateTime)
    lastLoginDateUtc = db.Column(db.DateTime)
    emailConfirmed = db.Column(db.Boolean, default=False)
    emailConfirmedDateUtc = db.Column(db.DateTime)

    studies = db.relationship('Study',
                              back_populates='user',
                              cascade='all, delete, delete-orphan')

    def is_active(self):
        return self.emailConfirmed

    def get_id(self):
        # We MUST return a unicode object.
        return str(self.id)

    def is_authenticated(self):
        return self.authenticated

    def is_anonymous(self):
        """False, as anonymous users aren't supported."""
        return False


class Study(db.Model):
    __tablename__ = 'studies'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(length=50))
    completed = db.Column(db.Boolean, default=False)

    measurements = db.relationship('Measurement',
                                   back_populates='study',
                                   cascade='all, delete, delete-orphan')

    userId = db.Column(db.Integer, db.ForeignKey('users.id'))
    user = db.relationship('User', back_populates='studies',
                           uselist=False)


class Measurement(db.Model):
    __tablename__ = 'measurements'

    id = db.Column(db.Integer, primary_key=True)

    studyId = db.Column(db.Integer, db.ForeignKey('studies.id'))
    study = db.relationship('Study', back_populates='measurements')

    number = db.Column(db.Integer, default=1)
    state = db.Column(db.String(length='20'))
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

    threshold = db.Column(db.Float)


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
    sessionName = db.Column(db.String(length=100))
    date = db.Column(db.String(length=100))

    measurementId = db.Column(db.Integer, db.ForeignKey('measurements.id'))
    measurement = db.relationship('Measurement', back_populates='metadata_')


class Trial(db.Model):
    __tablename__ = 'trials'

    id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, default=1)
    concentration = db.Column(db.Float)
    sampleNumber = db.Column(db.Integer)
    stimulusOrder = db.Column(db.String(length=100))
    correctResponseIndex = db.Column(db.Integer)
    response = db.Column(db.String(length=30))
    responseCorrect = db.Column(db.Boolean)

    measurementId = db.Column(db.Integer, db.ForeignKey('measurements.id'))
    measurement = db.relationship('Measurement', back_populates='trials')


class StaircaseHandler(db.Model):
    __tablename__ = 'staircase_handlers'

    id = db.Column(db.Integer, primary_key=True)
    staircaseHandler = db.Column(db.Text(length=500000))

    measurementId = db.Column(db.Integer, db.ForeignKey('measurements.id'))
    measurement = db.relationship('Measurement',
                                  back_populates='staircaseHandler')


@login_manager.user_loader
def user_loader(user_id):
    user_id = int(user_id)  # It will be passed in as unicode

    mask = User.id == user_id
    user = (User
            .query
            .filter(mask)
            .first())

    return user
