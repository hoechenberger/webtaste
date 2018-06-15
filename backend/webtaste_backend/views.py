#!/usr/bin/env python

import json_tricks
from datetime import datetime
from io import StringIO
from flask import request, abort, Response
from flask_restplus import Resource
from psychopy.data import QuestHandler

import numpy as np
import pandas as pd

from .app import api
from . import models
from .constants import CONCENTRATION_STEPS
from .utils import find_nearest, get_start_val, get_jar_index


@api.route('/api')
class Api(Resource):
    def get(self):
        endpoints = {
            '/api/measurement': 'Run a measurement.'
        }

        return endpoints


@api.route('/api/measurement')
class MeasurementApi(Resource):
    def get(self):
        endpoints = {
            '/api/measurement/gustatory': 'A measurement of the gustatory '
                                          'modality.',
            '/api/measurement/olfactory': 'A measurement of the olfactory '
                                          'modality.'
        }

        return endpoints


@api.route('/api/measurement/gustatory')
class GustatoryMeasurementApi(Resource):
    def get(self):
        endpoints = {
            'quest': 'Use the QUEST algorithm.',
            'quest+': 'Use the QUEST+ algorithm.'
        }

        return endpoints


@api.route('/quest')
class Quest(Resource):
    @api.expect(models.exp_info)
    def post(self):
        payload = request.json
        models.exp_info.validate(payload)

        substance = payload['substance']
        age = payload['age']
        gender = payload['gender']
        session = payload['session']
        lateralization = payload['lateralization']
        participant = payload['participant']
        date = payload['date']

        q = _init_quest(participant, age, gender, session, substance,
                        lateralization, date)
        q.originPath = ''

        # Find the intensity / concentration we have actually prepared.
        concentration_steps = CONCENTRATION_STEPS[substance]
        proposed_concentration = q.__next__()

        concentration = find_nearest(concentration_steps,
                                     proposed_concentration)

        jar = int(get_jar_index(concentration_steps, concentration) + 1)

        q.addOtherData('Concentration', concentration)
        q.addOtherData('Jar', jar)

        data = json_tricks.dumps(dict(trial=q.thisTrialN + 1,
                                      concentration=concentration,
                                      jar=jar,
                                      questHandler=q,
                                      finished=False))

        print(data)
        r = Response(data, mimetype='application/json')
        return r


@api.route('/quest/update')
class QuestUpdate(Resource):
    @api.expect(models.quest_update)
    def post(self):
        payload = json_tricks.loads(request.get_data(as_text=True))
        models.quest_update.validate(payload)

        comment = payload['comment']
        concentration = payload['concentration']
        response_correct = 1 if payload['responseCorrect'] is True else 0
        q = payload['questHandler']
        substance = q.extraInfo['Substance']

        q.addResponse(response_correct, intensity=concentration)
        if comment:
            q.addOtherData('Comment', comment)

        try:
            quest_proposed_concentration = q.__next__()
            finished = False
        except StopIteration:
            finished = True

        if not finished:
            next_concentration, next_jar = _get_next_quest_concentration(
                quest_proposed_concentration=quest_proposed_concentration,
                previous_concentration=concentration,
                previous_response_correct=response_correct,
                substance=substance)

            # Data for the next trial.
            q.addOtherData('Concentration', next_concentration)
            q.addOtherData('Jar', next_jar)

            trial = q.thisTrialN + 1
        else:
            trial = None
            next_concentration = None
            next_jar = None

        data = json_tricks.dumps(dict(trial=trial,
                                      concentration=next_concentration,
                                      jar=next_jar,
                                      questHandler=q,
                                      finished=finished,
                                      threshold=round(q.mean(), 3)))

        r = Response(data, mimetype='application/json')
        return r


def _gen_quest_report(quest_handler):
    q = quest_handler
    responses = q.data

    concentrations = q.otherData['Concentration']
    concentration_unit = 'log10 mol/L'
    jars = q.otherData['Jar']
    participant = q.extraInfo['Participant']
    age = q.extraInfo['Age']
    gender = q.extraInfo['Gender']
    substance = q.extraInfo['Substance']
    lateralization = q.extraInfo['Lateralization']
    session = q.extraInfo['Session']
    trials = list(range(1, len(responses) + 1))
    modality = 'gustation'
    method = 'QUEST'
    comments = q.otherData.get('Comment', '')

    dt_utc = datetime.strptime(q.extraInfo['Date'],
                               '%a, %d %b %Y %H:%M:%S %Z')
    date_utc = dt_utc.strftime('%Y-%m-%d %H:%M:%S')
    time_zone = 'GMT'

    data = pd.DataFrame(
        dict(Participant=participant,
             Age=age,
             Gender=gender,
             Modality=modality,
             Substance=substance,
             Lateralization=lateralization,
             Method=method,
             Session=session,
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

    filename_base = (f'{participant}_'
                     f'{modality[:4]}_'
                     f'{lateralization.split(" ")[0]}_'
                     f'{method}_'
                     f'{session}')

    filename_csv = filename_base + '.csv'
    return filename_csv, f

@api.route('/quest/report')
class QuestReport(Resource):
    @api.expect(models.quest_handler)
    def post(self):
        payload = json_tricks.loads(request.get_data(as_text=True))
        models.quest_handler.validate(payload)

        filename_csv, f = _gen_quest_report(payload['questHandler'])

        print(filename_csv)
        r = Response(
            f,
            mimetype='text/csv',
            headers={'Content-Disposition': f'attachment; '
                                            f'filename={filename_csv}'})

        return r


def _init_quest(participant, age, gender, session, substance,
                lateralization, date):
    exp_info = dict(Participant=participant,
                    Age=age, Gender=gender,
                    Substance=substance, Lateralization=lateralization,
                    Session=session, Date=date)
    start_val = get_start_val(substance)
    sd = np.log10(20)
    max_trials = 20
    concentration_steps = CONCENTRATION_STEPS[substance]
    range_ = 2 * np.abs(concentration_steps.max() - concentration_steps.min())

    q = QuestHandler(startVal=start_val,
                     startValSd=sd,
                     nTrials=max_trials,
                     pThreshold=0.82,
                     beta=3.5, gamma=0.01, delta=0.01, grain=0.01,
                     range=range_,
                     extraInfo=exp_info)

    return q


def _get_next_quest_concentration(quest_proposed_concentration, previous_concentration,
    previous_response_correct, substance):
    # Find the intensity / concentration we have actually prepared
    concentration_steps = CONCENTRATION_STEPS[substance]
    next_concentration = find_nearest(concentration_steps,
                                      quest_proposed_concentration)

    # If the concentration we selected is equal to the one previously presented ...
    if next_concentration == previous_concentration:
        idx_previous_conc = get_jar_index(concentration_steps,
                                          previous_concentration)

        # ... and we got a correct response ...
        if previous_response_correct:
            # ... and we have not yet reached the lowest prepared concentration ...
            if idx_previous_conc < concentration_steps.size - 1:
                # ... move to a lower concentration!
                next_concentration = concentration_steps[idx_previous_conc + 1]
        # ... and we got an incorrect response ...
        else:
            # ... and we have not yet reached the highest prepared concentration ...
            if idx_previous_conc != 0:
                # ... more up to a higher concentration!
                next_concentration = concentration_steps[idx_previous_conc - 1]

    next_jar = int(get_jar_index(concentration_steps,
                                 next_concentration) + 1)

    return next_concentration, next_jar
