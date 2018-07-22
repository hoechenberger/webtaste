#!/usr/bin/env python

import json_tricks
from datetime import datetime
from io import StringIO
from flask import request, abort, Response, make_response
from flask_restplus import Resource, marshal
from psychopy.data import QuestHandler

import numpy as np
import pandas as pd

from .app import api, db
from . import models
from .utils import (find_nearest, get_start_val, get_sample_number,
                    gen_concentration_steps)


@api.route('/api/')
class Api(Resource):
    def get(self):
        endpoints = {
            'links': {
                'measurements': '/api/measurements/',
            }
        }

        return endpoints


@api.route('/api/measurements/')
class MeasurementWithoutIdApi(Resource):
    def get(self):
        """Retrieve an array of running staircases.
        """
        measurements = models.Measurement.query.all()
        data = marshal(measurements, fields=models.measurement)

        for measurement in data:
            measurement_id = measurement['id']

            measurement['links'] = {
                'measurements': f'/api/measurements/',
                'trials': f'/api/measurements/{measurement_id}/trials/',
                'self': f'/api/measurements/{measurement_id}'
            }

        data = {
            'data': data,
            'links': {'self': f'/api/measurements/'}
        }

        return data

    @api.expect(models.measurement_metadata)
    @api.doc(responses={201: 'Created'})
    def post(self):
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
                pass
            elif metadata['algorithm'] == 'Hummel':
                pass

        staircase_handler.originPath = ''
        staircase_handler.origin = ''

        measurement = models.Measurement()
        metadata_ = models.MeasurementMetadata(**metadata)
        metadata_.measurement = measurement

        staircase_handler = models.StaircaseHandler(
            staircaseHandler=json_tricks.dumps(staircase_handler))
        staircase_handler.measurement = measurement

        db.session.add_all([measurement, metadata_,
                            staircase_handler])
        db.session.commit()

        measurement_id = measurement.id
        data = marshal(models.Measurement
                       .query
                       .order_by(models.Measurement.id.desc())
                       .first(),
                       fields=models.measurement)

        data['links'] = {
            'measurements': f'/api/measurements/',
            'trials': f'/api/measurements/{measurement_id}/trials/',
            'self': f'/api/measurements/{measurement_id}'
        }

        response = {'data': data}
        return response, 201, {'Location': data['links']['self']}


@api.route('/api/measurements/<int:measurement_id>')
class MeasurementWithIdApi(Resource):
    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    def get(self, measurement_id):
        """Retrieve information about a running staircase.
        """
        mask = models.Measurement.id == measurement_id
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)
        else:
            data = marshal(measurement, models.measurement)
            data['links'] = {
                'measurements': f'/api/measurements/',
                'trials': f'/api/measurements/{measurement_id}/trials/',
                'self': f'/api/measurements/{measurement_id}/'
            }

            response = {'data': data}
            return response

    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    def delete(self, measurement_id):
        """Delete a running staircase.
        """
        mask = models.Measurement.id == measurement_id
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

    # @api.expect(models.response_update)
    # def patch(self, measurement_id):
    #     """Update existing staircase.
    #     """
    #
    #     measurements[measurement_id].append('X')
    #     return measurements[measurement_id]
        # print(measurement_id)
        # payload = json_tricks.loads(request.get_data(as_text=True))
        # models.response_update.validate(payload)
        #
        # modality = payload['modality']
        # algorithm = payload['algorithm']
        # comment = payload['comment']
        # concentration = payload['concentration']
        # response_correct = 1 if payload['responseCorrect'] is True else 0
        #
        # if modality == 'gustatory':
        #     if algorithm == 'QUEST':
        #         q = payload['staircaseHandler']
        #         substance = q.extraInfo['Substance']
        #
        #         q.addResponse(response_correct, intensity=concentration)
        #         if comment:
        #             q.addOtherData('Comment', comment)
        #
        #         try:
        #             quest_proposed_concentration = q.__next__()
        #             finished = False
        #         except StopIteration:
        #             finished = True
        #
        #         if not finished:
        #             next_concentration, next_jar = _get_next_quest_concentration_gustatory(
        #                 quest_proposed_concentration=quest_proposed_concentration,
        #                 previous_concentration=concentration,
        #                 previous_response_correct=response_correct,
        #                 substance=substance)
        #
        #             # Data for the next trial.
        #             q.addOtherData('Concentration', next_concentration)
        #             q.addOtherData('Jar', next_jar)
        #
        #             trial = q.thisTrialN + 1
        #         else:
        #             trial = None
        #             next_concentration = None
        #             next_jar = None
        #
        #         data = json_tricks.dumps(dict(trial=trial,
        #                                       concentration=next_concentration,
        #                                       jar=next_jar,
        #                                       questHandler=q,
        #                                       finished=finished,
        #                                       threshold=round(q.mean(), 3)))
        #
        #         r = Response(data, mimetype='application/json')
        #         return r
        #
        # elif modality == 'olfactory':
        #     if algorithm == 'QUEST':
        #         pass
        #     if algorithm == 'Hummel':
        #         pass


# def _create_trial():
#     return

@api.route('/api/measurements/<int:measurement_id>/trials/')
class TrialsWithoutNumber(Resource):
    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    def get(self, measurement_id):
        """Retrieve all trials in a measurement.
        """
        mask = models.Measurement.id == measurement_id
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)
        else:
            mask = models.Trial.measurementId == measurement_id
            trials = (models.Trial
                      .query
                      .filter(mask)
                      .all())

            data = marshal(trials, models.trial_server_response)

            for trial in data:
                trial_number = trial['trialNumber']

                trial['links'] = {
                    'measurement': f'/api/measurements/{measurement_id}',
                    'measurements': f'/api/measurements/',
                    'trials': f'/api/measurements/{measurement_id}/trials/',
                    'self': f'/api/measurements/{measurement_id}/{trial_number}'
                }

            response = {
                'data': {
                    'trials': data,
                    'links': {
                        'measurement': f'/api/measurements/{measurement_id}',
                        'measurements': f'/api/measurements/',
                        'self': f'/api/measurements/{measurement_id}/trials/'
                    }
                }
            }

            return response

    @api.expect(models.trial_new)
    @api.doc(responses={201: 'Created',
                        204: 'No content',
                        404: 'Resource not found',
                        412: 'Precondition failed'})
    def post(self, measurement_id):
        """Create a new trial.
        """
        mask = models.Measurement.id == measurement_id
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
                abort(412)

            trial_number = previous_trial.trialNumber + 1

        # Find the intensity / concentration we have actually prepared.
        concentration_steps = gen_concentration_steps(modality)[substance]

        try:
            proposed_concentration = staircase_handler_.__next__()
            finished = False
        except StopIteration:
            finished = True

        if not finished:
            concentration = find_nearest(concentration_steps,
                                         proposed_concentration)
            sample_number = get_sample_number(concentration_steps, concentration)

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

            trial = models.Trial(trialNumber=trial_number,
                                 concentration=concentration,
                                 sampleNumber=sample_number)
            trial.measurement = measurement

            staircase_handler_.addOtherData('Concentration', concentration)
            staircase_handler_.addOtherData('Sample_Number', sample_number)

            staircase_handler.staircaseHandler = json_tricks.dumps(staircase_handler_)
            measurement.currentTrialNumber = trial_number

            db.session.add_all([measurement, trial, staircase_handler])
            db.session.commit()

            data = marshal(trial, models.trial_server_response)
            data['links'] = {
                'measurements': f'/api/measurements/',
                'measurement': f'/api/measurements/{measurement_id}/',
                'trials': f'/api/measurements/{measurement_id}/trials/',
                'self': f'/api/measurements/{measurement_id}/trials/{trial_number}'
            }

            response = {'data': data}
            return response, 201, {'Location': data['links']['self']}
        else:
            measurement.finished = True
            db.session.add(measurement)
            db.session.commit()

            response = make_response('', 204)
            return response


@api.route('/api/measurements/'
           '<int:measurement_id>/trials/<int:trial_number>')
class TrialsWithNumber(Resource):
    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    def get(self, measurement_id, trial_number):
        """Retrieve a specific trial.
        """
        trial = (models.Trial
                 .query
                 .filter((models.Trial.measurementId == measurement_id) &
                         (models.Trial.trialNumber == trial_number))
                 .first())

        if trial is None:
            abort(404)
        else:
            data = marshal(trial, models.trial_server_response)

            data['links'] = {
                'measurements': f'/api/measurements/',
                'measurement': f'/api/measurements/{measurement_id}/',
                'trials': f'/api/measurements/{measurement_id}/trials/',
                'self': f'/api/measurements/{measurement_id}/trials/{trial_number}'
            }

            response = {'data': data}
            return response

    @api.expect(models.trial_participant_response)
    @api.doc(responses={200: 'Success',
                        405: 'Method Not Allowed',
                        404: 'Resource not found'})
    def put(self, measurement_id, trial_number):
        """Add a response.
        """
        payload = request.json
        models.trial_participant_response.validate(payload)

        trial = (models.Trial
                 .query
                 .filter((models.Trial.measurementId == measurement_id) &
                         (models.Trial.trialNumber == trial_number))
                 .first())

        staircase_handler = (models.Measurement
                             .query
                             .filter(models.Measurement.id == measurement_id)
                             .first()
                             .staircaseHandler)

        if trial is None:
            abort(404)
        else:
            # Only allow updating of the current trial, and only if it hasn't
            # been updated already.
            staircase_handler_ = json_tricks.loads(staircase_handler.staircaseHandler)

            if ((trial.trialNumber != trial.measurement.currentTrialNumber) or
                    (len(staircase_handler_.data) >= trial.trialNumber)):
                return {}, 405, {'Allow': 'GET'}

            trial.responseCorrect = payload['responseCorrect']
            trial.response = payload['response']

            staircase_handler_.addResponse(int(payload['responseCorrect']))
            staircase_handler_.addOtherData('Response', payload['response'])
            staircase_handler.staircaseHandler = json_tricks.dumps(staircase_handler_)

            db.session.add_all([trial, staircase_handler])
            db.session.commit()

            data = marshal(trial, models.trial_server_response)

            data['links'] = {
                'measurements': f'/api/measurements/',
                'measurement': f'/api/measurements/{measurement_id}/',
                'trials': f'/api/measurements/{measurement_id}/trials/',
                'self': f'/api/measurements/{measurement_id}/trials/{trial_number}'
            }

            response = {'data': data}
            return response


@api.route('/api/measurements/'
           '<int:measurement_id>/trials/current')
class TrialsWithNumber(Resource):
    @api.doc(responses={200: 'Success',
                        404: 'Resource not found'})
    def get(self, measurement_id):
        """Retrieve the current trial.
        """
        current_trial = (models.Trial
                         .query
                         .filter(models.Trial.measurementId == measurement_id)
                         .order_by(models.Trial.id.desc())
                         .first())

        if not current_trial:
            abort(404)
        else:
            trial_number = current_trial['trialNumber']
            data = marshal(current_trial, models.trial_server_response)

            data['links'] = {
                'measurements': f'/api/measurements/',
                'measurement': f'/api/measurements/{measurement_id}/',
                'trials': f'/api/measurements/{measurement_id}/trials/',
                'self': f'/api/measurements/{measurement_id}/trials/'
                        f'{trial_number}'
            }

            response = {'data': data}
            return response


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

    data = pd.DataFrame(
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

    f = StringIO()
    data.to_csv(f, index=False)
    print(data)
    f.seek(0)

    filename_base = (f'{participant[0]}_'
                     f'{modality[:4]}_'
                     f'{lateralization[0].split(" ")[0]}_'
                     f'{method}_'
                     f'{session[0]}')

    filename_csv = filename_base + '.csv'
    return filename_csv, f


@api.route('/api/measurements/<int:measurement_id>/report')
class Report(Resource):
    def get(self, measurement_id):
        """Retrieve reports and logfiles of an experimental run.
        """
        mask = models.Measurement.id == measurement_id
        measurement = (models.Measurement
                       .query
                       .filter(mask)
                       .first())

        if measurement is None:
            abort(404)
        else:
            filename_csv, f = _gen_quest_report_gustation(measurement)

            print(filename_csv)
            r = Response(
                f,
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment; '
                                                f'filename={filename_csv}'})

            return r


def _init_quest_gustatory(exp_info):
    modality = 'gustatory'
    substance = exp_info['substance']

    start_val = get_start_val(modality=modality, substance=substance)

    sd = np.log10(20)
    max_trials = 20
    concentration_steps = gen_concentration_steps(modality)[substance]
    range_ = 2 * np.abs(concentration_steps.max() - concentration_steps.min())

    q = QuestHandler(startVal=start_val,
                     startValSd=sd,
                     nTrials=max_trials,
                     pThreshold=0.82,
                     beta=3.5, gamma=0.01, delta=0.01, grain=0.01,
                     range=range_,
                     extraInfo=exp_info)

    return q


# def _get_next_quest_concentration_gustatory(quest_proposed_concentration,
#                                             previous_concentration,
#                                             previous_response_correct,
#                                             modality,
#                                             substance):
#     # Find the intensity / concentration we have actually prepared
#     concentration_steps = gen_concentration_steps(modality)[substance]
#     next_concentration = find_nearest(concentration_steps,
#                                       quest_proposed_concentration)
#
#     # If the concentration we selected is equal to the one previously presented ...
#     if next_concentration == previous_concentration:
#         idx_previous_conc = get_sample_number(concentration_steps,
#                                               previous_concentration)
#
#         # ... and we got a correct response ...
#         if previous_response_correct:
#             # ... and we have not yet reached the lowest prepared concentration ...
#             if idx_previous_conc < concentration_steps.size - 1:
#                 # ... move to a lower concentration!
#                 next_concentration = concentration_steps[idx_previous_conc + 1]
#         # ... and we got an incorrect response ...
#         else:
#             # ... and we have not yet reached the highest prepared concentration ...
#             if idx_previous_conc != 0:
#                 # ... more up to a higher concentration!
#                 next_concentration = concentration_steps[idx_previous_conc - 1]
#
#     next_jar = int(get_sample_number(concentration_steps,
#                                      next_concentration) + 1)
#
#     return next_concentration, next_jar
