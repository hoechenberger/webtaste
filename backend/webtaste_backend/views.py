#!/usr/bin/env python

import json_tricks
from datetime import datetime
from flask import request, abort, Response, make_response
from flask_restplus import Resource, marshal
from flask_login import login_required, login_user, logout_user, current_user
from psychopy.data import QuestHandler
import random

import numpy as np
import pandas as pd
from io import BytesIO
import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt

from .app import api, db, crypto_context, serializer_for_email_confirmation
from . import models
from .utils import (find_nearest, get_start_val, get_sample_number,
                    gen_concentration_steps, send_email)


@api.route('/api/')
class Api(Resource):
    def get(self):
        endpoints = {
            'links': {
                'registration': '/api/register',
                'login': '/api/login',
                'studies': '/api/studies/',
            }
        }

        return endpoints


@api.route('/api/user/register')
class Register(Resource):
    @api.expect(models.user_registration)
    def post(self):
        payload = request.json
        models.user_registration.validate(payload)

        username = payload['user']
        password = payload['password']
        email = payload['email']

        mask = models.User.name == username
        existing_user = (models.User
                         .query
                         .filter(mask)
                         .first())

        if existing_user is not None:
            return f'User {username} already exists.', 409

        password_hash = crypto_context.hash(password)
        del password
        del payload['password']

        registration_date = datetime.utcnow()
        user = models.User(name=username,
                           password=password_hash,
                           email=email,
                           registrationDateUtc=registration_date)

        db.session.add(user)
        db.session.commit()

        token = serializer_for_email_confirmation.dumps((username, email))
        send_email(user=username,
                   to_address=email,
                   message_type='confirm_address',
                   token=token)

        msg = ('User was created. To activate the account, visit the web '
               'address specified in the email sent to you.')
        return msg, 201


@api.route('/api/user/activate')
class ConfirmEmail(Resource):
    @api.param('token', 'The activation token sent via email.')
    def get(self):
        token = request.args.get('token')

        if token is None:
            return 'Query parameter missing.', 400

        valid, payload = serializer_for_email_confirmation.loads_unsafe(token)
        if not valid:
            return 'Invalid token.', 403

        username, email = payload

        mask = models.User.name == username
        user = (models.User
                .query
                .filter(mask)
                .first())

        if user.emailConfirmed:
            return 'Email address has already been verified.', 409
        else:
            user.emailConfirmed = True
            user.emailConfirmedDateUtc = datetime.utcnow()

            db.session.add(user)
            db.session.commit()
            send_email(user=username,
                       to_address=email,
                       message_type='account_activated')

            msg = ('Email address was successfully verified. Your account '
                   'has been activated.')
            return msg, 200


@api.route('/api/user/login')
class Login(Resource):
    @api.expect(models.user_login)
    def post(self):
        payload = request.json
        models.user_login.validate(payload)

        username = payload['user']
        password = payload['password']

        mask = models.User.name == username
        user = (models.User
                .query
                .filter(mask)
                .first())

        if user is None:
            return 'User does not exist.', 404
        elif not user.emailConfirmed:
            return 'User email confirmation is required for login.', 403
        else:
            valid, new_hash = crypto_context.verify_and_update(password,
                                                               user.password)
            if valid:
                if new_hash:
                    # Migrate to new hash if necessary, see
                    # http://passlib.readthedocs.io/en/stable/narr/context-tutorial.html#integrating-hash-migration
                    user.password = new_hash

                user.authenticated = True
                user.lastLoginDateUtc = datetime.utcnow()
                db.session.add(user)
                db.session.commit()

                login_user(user, remember=False)
                return f'User {username} was successfully logged in.', 200
            else:
                return 'Login failed.', 403


@api.route('/api/user/logout')
class Logout(Resource):
    @login_required
    def get(self):
        user = current_user
        username = user.name
        user.authenticated = False
        db.session.add(user)
        db.session.commit()
        logout_user()
        return f'User {username} successfully logged out.', 200


@api.route('/api/studies/')
class StudiesWithoutIdApi(Resource):
    @login_required
    def get(self):
        """Retrieve existing studies.
        """
        studies = models.Study.query.all()
        data = marshal(studies, fields=models.study)

        for study in data:
            study_id = study['id']

            study['links'] = {
                'studies': f'/api/studies/',
                'measurements': f'/api/studies/{study_id}/measurements/',
                'self': f'/api/studies/{study_id}'
            }

        data = {
            'data': {
                'studies': data,
                'links': {'self': f'/api/studies/'}
            }
        }

        return data

    @api.doc(responses={409: 'Conflict'})
    @api.expect(models.study_new)
    @login_required
    def post(self):
        """Create a new study.
        """
        print('Creating new study …')
        payload = request.json

        models.study_new.validate(payload)

        name = payload['name']

        mask = models.Study.name == name
        existing_study = (models.Study
                          .query
                          .filter(mask)
                          .first())

        if existing_study is not None:  # This study name already exists
            return {}, 409

        user = current_user
        study = models.Study(name=name, user=user)

        db.session.add(study)
        db.session.commit()

        data = marshal(study, models.study)
        study_id = study.id

        data['links'] = {
            'measurements': f'/api/studies/{study_id}/measurements/',
            'self': f'/api/studies/{study_id}'
        }

        response = {'data': data}
        return response, 201

    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    @login_required
    def delete(self, measurement_number):
        """Delete a running staircase.
        """
        mask = models.Measurement.number == measurement_number
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)
        else:
            db.session.delete(measurement)
            db.session.commit()
            return {}


@api.route('/api/studies/<int:study_id>')
class StudiesApi(Resource):
    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    @login_required
    def get(self, study_id):
        """Retrieve information about a running staircase.
        """
        mask = models.Study.id == study_id
        study = (models.Measurement
                 .query
                 .filter(mask)
                 .first())

        if study is None:
            abort(404)
        else:
            data = marshal(study, models.study)
            data['links'] = {
                'measurements': f'/api/studies/{study_id}/measurements/',
                'self': f'/api/studies/{study_id}'
            }

            response = {'data': data}
            return response

    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    @login_required
    def delete(self, study_id):
        """Delete a running staircase.
        """
        mask = models.Study.id== study_id
        study = (models.Study
                 .query
                 .filter(mask)
                 .first())

        if study is None:
            abort(404)
        else:
            db.session.delete(study)
            db.session.commit()
            return {}


@api.route('/api/studies/<int:study_id>/measurements/')
class MeasurementWithoutIdApi(Resource):
    @login_required
    def get(self, study_id):
        """Retrieve an array of running staircases.
        """
        mask = models.Study.id == study_id
        study = (models.Study
                 .query
                 .filter(mask)
                 .first())

        measurements = study.measurements
        data = marshal(measurements, fields=models.measurement)

        for measurement in data:
            measurement_number = measurement.number

            measurement['links'] = {
                'measurements': f'/api/studies/{study_id}/measurements/',
                'trials': f'/api/studies/{study_id}/measurements/'
                          f'{measurement_number}/trials/',
                'self': f'/api/studies/{study_id}/measurements/'
                        f'{measurement_number}'
            }

        data = {
            'data': data,
            'links': {'self': f'/api/studies/{study_id}/measurements/'}
        }

        return data

    @api.expect(models.measurement_metadata)
    @api.doc(responses={201: 'Created'})
    @login_required
    def post(self, study_id):
        """Create new staircase.
        """
        print('Creating new staircase …')
        payload = request.json

        # # Our schema says we expect an integer, but we would also like to
        # # accept a "null" value here, which is currently not supported in
        # # Swagger / flask-restplus, so we have to hack around this.
        # if payload['startVal'] is None:
        #     del payload['startVal']
        #     models.measurement_metadata.validate(payload)
        #     payload['startVal'] = None
        # else:
        #     models.measurement_metadata.validate(payload)
        #
        # # Only use the data we know we want to handle, and skip values that
        # # were no sent (they are optional anyway: we have already validated
        # # the payload!)
        # # The skipping of optional values currently should only apply to
        # # `startVal`.
        # models.measurement_metadata.validate(payload)

        metadata = dict()
        for k in models.measurement_metadata.keys():
            try:
                metadata[k] = payload[k]
            except KeyError:
                assert k == 'startVal'
                metadata['startVal'] = None

        if metadata['modality'] == 'gustatory':
            if metadata['algorithm'] == 'QUEST':
                staircase_handler = _init_quest_gustatory(metadata)
        elif metadata['modality'] == 'olfactory':
            if metadata['algorithm'] == 'QUEST':
                staircase_handler = _init_quest_olfactory(metadata)
            elif metadata['algorithm'] == 'Hummel':
                pass

        staircase_handler.originPath = ''
        staircase_handler.origin = ''

        mask = models.Study.id == study_id
        study = (models.Study
                 .query
                 .filter(mask)
                 .first())

        if not study.measurements:
            measurement_number = 1
        else:
            measurement_number = study.measurements[-1].number + 1

        measurement = models.Measurement()
        measurement.number = measurement_number
        measurement.study = study

        metadata_ = models.MeasurementMetadata(**metadata)
        metadata_.measurement = measurement

        staircase_handler = models.StaircaseHandler(
            staircaseHandler=json_tricks.dumps(staircase_handler))
        staircase_handler.measurement = measurement

        db.session.add_all([study, measurement, metadata_, staircase_handler])
        db.session.commit()

        data = marshal(models.Measurement
                       .query
                       .order_by(models.Measurement.number.desc())
                       .first(),
                       fields=models.measurement)

        data['links'] = {
            'measurements': f'/api/studies/{study_id}/measurements/',
            'trials': f'/api/studies/{study_id}/measurements/'
                      f'{measurement_number}/trials/',
            'self': f'/api/studies/{study_id}/measurements/'
                    f'{measurement_number}'
        }

        response = {'data': data}
        return response, 201, {'Location': data['links']['self']}


@api.route('/api/studies/<int:study_id>/measurements/<int:measurement_number>')
class MeasurementWithIdApi(Resource):
    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    @login_required
    def get(self, study_id, measurement_number):
        """Retrieve information about a running staircase.
        """
        mask = ((models.Measurement.studyId == study_id) &
                (models.Measurement.number == measurement_number))
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)
        else:
            data = marshal(measurement, models.measurement)
            data['links'] = {
                'measurements': f'/api/studies/{study_id}/measurements/',
                'trials': f'/api/studies/{study_id}/measurements/'
                          f'{measurement_number}/trials/',
                'self': f'/api/studies/{study_id}/measurements/'
                        f'{measurement_number}'
            }

            response = {'data': data}
            return response

    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    @login_required
    def delete(self, study_id, measurement_number):
        """Delete a running staircase.
        """
        mask = ((models.Measurement.study.id == study_id) &
                (models.Measurement.number == measurement_number))
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)
        else:
            db.session.delete(measurement)
            db.session.commit()
            return {}


@api.route('/api/studies/<int:study_id>'
           '/measurements/<int:measurement_number>'
           '/trials/')
class TrialsWithoutNumber(Resource):
    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    @login_required
    def get(self, study_id, measurement_number):
        """Retrieve all trials in a measurement.
        """
        mask = ((models.Trial.measurement.study.id == study_id) &
                (models.Trial.measurement.number == measurement_number))
        trials = (models.Trial
                  .query
                  .filter(mask)
                  .first())

        if trials is None:
            abort(404)
        else:
            # mask = models.Trial.measurementId == measurement_id
            # trials = (models.Trial
            #           .query
            #           .filter(mask)
            #           .all())

            data = marshal(trials, models.trial_server_response)

            for trial in data:
                trial_number = trial.number

                trial['links'] = {
                    'measurement': f'/api/studies/{study_id}/measurements/'
                                   f'{measurement_number}',
                    'measurements': f'/api/studies/{study_id}/measurements/',
                    'trials': f'/api/studies/{study_id}/measurements/'
                              f'{measurement_number}/trials/',
                    'self': f'/api/studies/{study_id}/measurements/'
                            f'{measurement_number}/{trial_number}'
                }

            response = {
                'data': {
                    'trials': data,
                    'links': {
                        'measurement': f'/api/studies/{study_id}/'
                                       f'measurements/{measurement_number}',
                        'measurements': f'/api/studies/{study_id}/'
                                        f'measurements/',
                        'self': f'/api/studies/{study_id}/'
                                f'measurements/{measurement_number}/trials/'
                    }
                }
            }

            return response

    @api.expect(models.trial_new)
    @api.doc(responses={201: 'Created',
                        204: 'No content',
                        404: 'Resource not found',
                        412: 'Precondition failed'})
    @login_required
    def post(self, study_id, measurement_number):
        """Create a new trial.
        """
        mask = ((models.Measurement.studyId == study_id) &
                (models.Measurement.number == measurement_number))
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)

        staircase_handler = measurement.staircaseHandler
        modality = measurement.metadata_.modality
        substance = measurement.metadata_.substance
        staircase_handler_ = json_tricks.loads(staircase_handler.staircaseHandler)

        if not measurement.trials:
            trial_number = 1
        else:
            previous_trial = measurement.trials[-1]

            if previous_trial.response is None:
                # Trial has not been updated with a response to far
                abort(412)

            trial_number = previous_trial.number + 1

        # Find the intensity / concentration we have actually prepared.
        concentration_steps = gen_concentration_steps(modality, substance)

        try:
            proposed_concentration = staircase_handler_.__next__()
            finished = False
        except StopIteration:
            finished = True
            threshold = staircase_handler_.mean()

        if not finished:
            concentration = find_nearest(concentration_steps,
                                         proposed_concentration)
            sample_number = get_sample_number(concentration_steps, concentration)

            if (modality == 'gustatory'):
                stimulus_order = []
                correct_response_index = None

                # If the concentration we selected is equal to the one previously presented ...
                if ((trial_number > 1) and
                        (sample_number == previous_trial.sampleNumber)):

                    # ... and we got a correct response ...
                    if previous_trial.responseCorrect:
                        # ... and we have not yet reached the lowest prepared concentration ...
                        if previous_trial.sampleNumber < len(concentration_steps):
                            # ... move to a lower concentration!
                            concentration = concentration_steps[previous_trial.sampleNumber]
                            sample_number = get_sample_number(concentration_steps,
                                                              concentration)
                    # ... and we got an incorrect response ...
                    else:
                        # ... and we have not yet reached the highest prepared concentration ...
                        if previous_trial.sampleNumber > 1:
                            # ... more up to a higher concentration!
                            concentration = concentration_steps[previous_trial.sampleNumber - 1]
                            sample_number = get_sample_number(concentration_steps,
                                                              concentration)
            elif modality == 'olfactory':
                stimulus_order = ['red', 'green', 'blue']
                random.shuffle(stimulus_order)
                correct_response_index = stimulus_order.index('red')

                if ((trial_number > 2) and
                        (sample_number == measurement.trials[-1].sampleNumber) and
                        (sample_number == measurement.trials[-2].sampleNumber)):
                    if (measurement.trials[-1].responseCorrect and
                            measurement.trials[-2].responseCorrect and
                            sample_number < 16):
                        sample_number += 1
                        concentration = concentration_steps[sample_number - 1]
                    if (not measurement.trials[-1].responseCorrect and
                            not measurement.trials[-2].responseCorrect and
                            sample_number > 1):
                        sample_number -= 1
                        concentration = concentration_steps[sample_number - 1]

            trial = models.Trial(number=trial_number,
                                 concentration=concentration,
                                 sampleNumber=sample_number,
                                 stimulusOrder=json_tricks.dumps(stimulus_order),
                                 correctResponseIndex=correct_response_index)

            trial.measurement = measurement

            staircase_handler_.addOtherData('Concentration', concentration)
            staircase_handler_.addOtherData('Sample_Number', sample_number)
            staircase_handler_.addOtherData('Stimulus_Order', stimulus_order)


            staircase_handler.staircaseHandler = json_tricks.dumps(staircase_handler_)
            measurement.currentTrialNumber = trial_number

            db.session.add_all([measurement, trial, staircase_handler])
            db.session.commit()

            data = marshal(trial, models.trial_server_response)
            data['stimulusOrder'] = json_tricks.loads(data['stimulusOrder'])

            data['links'] = {
                'measurements': f'/api/studies/{study_id}/measurements/',
                'measurement': f'/api/studies/{study_id}/measurements/'
                               f'{measurement_number}/',
                'trials': f'/api/studies/{study_id}/measurements/'
                          f'{measurement_number}/trials/',
                'self': f'/api/studies/{study_id}/measurements/'
                        f'{measurement_number}/trials/{trial_number}'
            }

            response = {'data': data}
            return response, 201, {'Location': data['links']['self']}
        else:
            measurement.threshold = threshold
            measurement.finished = True
            db.session.add(measurement)
            db.session.commit()

            response = make_response('', 204)
            return response


@api.route('/api/studies/<int:study_id>/'
           'measurements/<int:measurement_number>/'
           'trials/<int:trial_number>')
class TrialsWithNumber(Resource):
    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    @login_required
    def get(self, study_id, measurement_number, trial_number):
        """Retrieve a specific trial.
        """
        mask = ((models.Trial.measurement.study.id == study_id) &
                (models.Trial.measurement.number == measurement_number) &
                (models.Trial.number == trial_number))
        trial = (models.Trial
                 .query
                 .filter(mask)
                 .first())

        if trial is None:
            abort(404)
        else:
            data = marshal(trial, models.trial_server_response)
            data['stimulusOrder'] = json_tricks.loads(data['stimulusOrder'])

            data['links'] = {
                'measurements': f'/api/studies/{study_id}/measurements/',
                'measurement': f'/api/studies/{study_id}/measurements/'
                               f'{measurement_number}/',
                'trials': f'/api/studies/{study_id}/measurements/'
                          f'{measurement_number}/trials/',
                'self': f'/api/studies/{study_id}/measurements/'
                        f'{measurement_number}/trials/{trial_number}'
            }

            response = {'data': data}
            return response

    @api.expect(models.trial_participant_response)
    @api.doc(responses={200: 'Success',
                        405: 'Method Not Allowed',
                        404: 'Resource not found'})
    @login_required
    def put(self, study_id, measurement_number, trial_number):
        """Add a response.
        """
        payload = request.json
        models.trial_participant_response.validate(payload)

        mask = ((models.Measurement.studyId == study_id) &
                (models.Measurement.number == measurement_number))
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)

        mask = ((models.Trial.measurementId == measurement.id) &
                (models.Trial.number == trial_number))
        trial = (models.Trial
                 .query
                 .filter(mask)
                 .first())

        if trial is None:
            abort(404)

        # Only allow updating of the current trial, and only if it hasn't
        # been updated already.
        staircase_handler = trial.measurement.staircaseHandler
        staircase_handler_ = json_tricks.loads(staircase_handler.staircaseHandler)

        if ((trial.number != trial.measurement.currentTrialNumber) or
                (len(staircase_handler_.data) >= trial.number)):
            return {}, 405, {'Allow': 'GET'}

        trial.responseCorrect = payload['responseCorrect']
        trial.response = payload['response']

        staircase_handler_.addResponse(int(payload['responseCorrect']),
                                       intensity=trial.concentration)
        staircase_handler_.addOtherData('Response', payload['response'])
        staircase_handler.staircaseHandler = json_tricks.dumps(staircase_handler_)

        db.session.add_all([trial, staircase_handler])
        db.session.commit()

        data = marshal(trial, models.trial_server_response)
        data['stimulusOrder'] = json_tricks.loads(data['stimulusOrder'])

        data['links'] = {
            'measurements': f'/api/studies/{study_id}/measurements/',
            'measurement': f'/api/studies/{study_id}/measurements/'
                           f'{measurement_number}/',
            'trials': f'/api/studies/{study_id}/measurements/'
                      f'{measurement_number}/trials/',
            'self': f'/api/studies/{study_id}/measurements/'
                    f'{measurement_number}/trials/{trial_number}'
        }

        response = {'data': data}
        return response


def _gen_quest_plot_gustatory(participant, modality, substance, lateralization,
                              method, session, concentrations, responses,
                              threshold):
    fig = plt.figure(figsize=(7, 6))
    ax = fig.add_subplot(111)

    concentrations = np.array(concentrations)
    responses = np.array(responses)
    responses_yes_idx = np.where(responses == 'Yes')[0]
    responses_no_idx = np.where(responses == 'No')[0]

    ax.plot(np.arange(1, len(concentrations) + 1), concentrations, '--', lw=1,
            dashes=(5, 10), color='black')
    ax.plot(responses_yes_idx + 1, concentrations[responses_yes_idx], 'gv',
            markersize=10, label='"yes" response')
    ax.plot(responses_no_idx + 1, concentrations[responses_no_idx], 'r^',
            markersize=10, label='"no" response')
    ax.axhline(threshold, color='blue', lw=1.5, label='threshold estimate')
    ax.set_xticks(np.arange(1, len(responses) + 1))
    ax.set_xlim((0.5, len(responses) + 0.5))
    ax.set_xlabel('Trial', fontsize=14)
    ax.set_ylabel('Concentration in $\log_{10}}$ mol/L', fontsize=14)
    ax.legend(loc='best')

    t = (f'Threshold Estimation, Participant {participant}\n'
         f'modality: {modality}, '
         f'substance: {substance},\n'
         f'lateralization: {lateralization}, '
         f'method: {method}, '
         f'session: {session}')

    ax.set_title(t, fontsize=14)

    f = BytesIO()
    plt.savefig(f, format='png')
    f.seek(0)
    return f


def _gen_quest_plot_olfactory(participant, modality, substance, lateralization,
                              method, session, concentrations, responses,
                              threshold):
    fig = plt.figure(figsize=(7, 6))
    ax = fig.add_subplot(111)

    concentrations = np.array(concentrations)
    responses = np.array(responses)
    responses_correct_idx = np.where(responses == True)[0]
    responses_incorrect_idx = np.where(responses == False)[0]

    ax.plot(np.arange(1, len(concentrations) + 1), concentrations, '--', lw=1,
            dashes=(5, 10), color='black')
    ax.plot(responses_correct_idx + 1, concentrations[responses_correct_idx], 'gv',
            markersize=10, label='correct response')
    ax.plot(responses_incorrect_idx + 1, concentrations[responses_incorrect_idx], 'r^',
            markersize=10, label='incorrect response')
    ax.axhline(threshold, color='blue', lw=1.5, label='threshold estimate')
    ax.set_xticks(np.arange(1, len(responses) + 1))
    ax.set_xlim((0.5, len(responses) + 0.5))
    ax.set_xlabel('Trial', fontsize=14)
    ax.set_ylabel('Concentration in $\log_{10}}$ %', fontsize=14)
    ax.legend(loc='best')

    t = (f'Threshold Estimation, Participant {participant}\n'
         f'modality: {modality}, '
         f'substance: {substance},\n'
         f'lateralization: {lateralization}, '
         f'method: {method}, '
         f'session: {session}')

    ax.set_title(t, fontsize=14)

    f = BytesIO()
    plt.savefig(f, format='png')
    f.seek(0)
    return f


def _gen_quest_report_gustation(measurement):
    staircase_handler = json_tricks.loads(measurement.staircaseHandler.staircaseHandler)

    q = staircase_handler
    responses = q.data

    concentrations = q.otherData['Concentration']
    concentration_unit = 'log10 mol/L'
    jars = q.otherData['Sample_Number']
    participant = measurement.metadata_.participant,
    age = measurement.metadata_.age
    gender = measurement.metadata_.gender,
    substance =measurement.metadata_.substance,
    lateralization = measurement.metadata_.lateralization,
    session = measurement.metadata_.session,
    trials = list(range(1, len(responses) + 1))
    modality = 'gustatory'
    method = 'QUEST'
    comments = q.otherData.get('Comment', '')

    dt_utc = datetime.strptime(measurement.metadata_.date,
                               '%a, %d %b %Y %H:%M:%S %Z')
    date_utc = dt_utc.strftime('%Y-%m-%d %H:%M:%S')
    time_zone = 'GMT'

    threshold = q.mean()
    data_threshold = pd.DataFrame(
        dict(
            Participant=participant[0],
            Age=age,
            Gender=gender[0],
            Modality=modality,
            Substance=substance[0],
            Lateralization=lateralization[0],
            Method=method,
            Session=session[0],
            Threshold=threshold,
            Threshold_Unit=concentration_unit,
            Date=date_utc,
            Time_Zone=time_zone),
        index=[0])

    data_log = pd.DataFrame(
        dict(Participant=participant[0],
             Age=age,
             Gender=gender[0],
             Modality=modality,
             Substance=substance[0],
             Lateralization=lateralization[0],
             Method=method,
             Session=session[0],
             Trial=trials,
             Jar=jars,
             Concentration=concentrations,
             Concentration_Unit=concentration_unit,
             Response=responses,
             Comment=comments,
             Date=date_utc,
             Time_Zone=time_zone))

    data_log.loc[data_log['Response'] == 0, 'Response'] = 'No'
    data_log.loc[data_log['Response'] == 1, 'Response'] = 'Yes'

    figure = _gen_quest_plot_gustatory(participant=participant[0],
                                       modality=modality,
                                       substance=substance[0],
                                       lateralization=lateralization[0],
                                       method=method,
                                       session=session[0],
                                       concentrations=concentrations,
                                       responses=data_log['Response'].values,
                                       threshold=threshold)

    f = BytesIO()
    writer = pd.ExcelWriter(f, engine='xlsxwriter')
    data_threshold.to_excel(writer, sheet_name='Threshold', index=False)
    data_log.to_excel(writer, sheet_name='Log', index=False)

    s = writer.sheets['Threshold']
    s.insert_image('B7', 'Threshold_Plot.png', {'image_data': figure})

    writer.save()
    f.seek(0)

    filename_base = (f'{participant[0]}_'
                     f'{modality[:4]}_'
                     f'{substance[0].replace(" " , "-")}_'
                     f'{lateralization[0].split(" ")[0]}_'
                     f'{method}_'
                     f'{session[0]}')

    filename_xlsx = filename_base + '.xlsx'
    return filename_xlsx, f


def _gen_quest_report_olfactory(measurement):
    staircase_handler = json_tricks.loads(measurement.staircaseHandler.staircaseHandler)

    q = staircase_handler
    responses_correct = q.data
    responses = q.otherData['Response']

    concentrations = q.otherData['Concentration']
    concentration_unit = 'log10 %'
    triade_no = q.otherData['Sample_Number']
    stimulus_order = q.otherData['Stimulus_Order']
    participant = measurement.metadata_.participant,
    age = measurement.metadata_.age
    gender = measurement.metadata_.gender,
    substance = measurement.metadata_.substance,
    lateralization = measurement.metadata_.lateralization,
    session = measurement.metadata_.session,
    trials = list(range(1, len(responses) + 1))
    modality = 'olfactory'
    method = 'QUEST'
    comments = q.otherData.get('Comment', '')

    dt_utc = datetime.strptime(measurement.metadata_.date,
                               '%a, %d %b %Y %H:%M:%S %Z')
    date_utc = dt_utc.strftime('%Y-%m-%d %H:%M:%S')
    time_zone = 'GMT'

    threshold = q.mean()
    data_threshold = pd.DataFrame(
        dict(
            Participant=participant[0],
            Age=age,
            Gender=gender[0],
            Modality=modality,
            Substance=substance[0],
            Lateralization=lateralization[0],
            Method=method,
            Session=session[0],
            Threshold=threshold,
            Threshold_Unit=concentration_unit,
            Date=date_utc,
            Time_Zone=time_zone),
        index=[0])

    data_log = pd.DataFrame(
        dict(Participant=participant[0],
             Age=age,
             Gender=gender[0],
             Modality=modality,
             Substance=substance[0],
             Lateralization=lateralization[0],
             Method=method,
             Session=session[0],
             Trial=trials,
             Triade_Number=triade_no,
             Stimulus_Order=stimulus_order,
             Concentration=concentrations,
             Concentration_Unit=concentration_unit,
             Response=responses,
             Response_Correct=responses_correct,
             Comment=comments,
             Date=date_utc,
             Time_Zone=time_zone))

    data_log['Response'] = data_log['Response'].astype('int')
    data_log['Response'] += 1
    data_log.loc[data_log['Response_Correct'] == 0, 'Response_Correct'] = False
    data_log.loc[data_log['Response_Correct'] == 1, 'Response_Correct'] = True

    figure = _gen_quest_plot_olfactory(participant=participant[0],
                                       modality=modality,
                                       substance=substance[0],
                                       lateralization=lateralization[0],
                                       method=method,
                                       session=session[0],
                                       concentrations=concentrations,
                                       responses=data_log['Response_Correct'].values,
                                       threshold=threshold)

    f = BytesIO()
    writer = pd.ExcelWriter(f, engine='xlsxwriter')
    data_threshold.to_excel(writer, sheet_name='Threshold', index=False)
    data_log.to_excel(writer, sheet_name='Log', index=False)

    s = writer.sheets['Threshold']
    s.insert_image('B7', 'Threshold_Plot.png', {'image_data': figure})

    writer.save()
    f.seek(0)

    filename_base = (f'{participant[0]}_'
                     f'{modality[:4]}_'
                     f'{substance[0].replace(" " , "-")}_'
                     f'{lateralization[0].split(" ")[0]}_'
                     f'{method}_'
                     f'{session[0]}')

    filename_xlsx = filename_base + '.xlsx'
    return filename_xlsx, f


@api.route('/api/measurements/<int:measurement_number>/report')
class Report(Resource):
    def get(self, measurement_number):
        """Retrieve reports and logfiles of an experimental run.
        """
        mask = models.Measurement.number == measurement_number
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)
        else:
            modality = measurement.metadata_.modality
            if modality == 'gustatory':
                filename_xlsx, f = _gen_quest_report_gustation(measurement)
            elif modality == 'olfactory':
                filename_xlsx, f = _gen_quest_report_olfactory(measurement)
            else:
                raise ValueError('Invalid modality specified.')


            print(filename_xlsx)
            r = Response(
                f,
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment; '
                                                f'filename={filename_xlsx}'})

            return r


def _init_quest_gustatory(metadata):
    modality = 'gustatory'
    substance = metadata['substance']

    start_val = get_start_val(modality=modality, substance=substance)

    sd = np.log10(20)
    max_trials = 20
    concentration_steps = gen_concentration_steps(modality, substance)
    range_ = 2 * np.abs(concentration_steps.max() - concentration_steps.min())

    q = QuestHandler(startVal=start_val,
                     startValSd=sd,
                     nTrials=max_trials,
                     pThreshold=0.82,
                     beta=3.5, gamma=0.01, delta=0.01, grain=0.01,
                     range=range_,
                     extraInfo=metadata)

    return q


def _init_quest_olfactory(metadata):
    modality = 'olfactory'
    substance = metadata['substance']

    start_val = get_start_val(modality=modality, substance=substance)
    sd = np.log10(20)
    max_trials = 20
    range_ = 20

    q = QuestHandler(startVal=start_val,
                     startValSd=sd,
                     pThreshold=0.8035,
                     beta=3.5, gamma=1.0/3, delta=0.01, grain=0.01,
                     nTrials=max_trials,
                     range=range_,
                     extraInfo=metadata)

    return q

