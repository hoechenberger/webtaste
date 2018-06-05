#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask import Response, request, abort, render_template, redirect
import flask.json
import json_tricks
from flask_restplus import Resource
from tempfile import mkdtemp
from zipfile import ZipFile
import os
from psychopy.data import QuestHandler

from . import api, models, forms


@api.route('/start')
class Login(Resource):
    @staticmethod
    def get():
        form = forms.QuestForm()
        return Response(render_template('start.html', form=form))


@api.route('/start/quest/'
           'participant=<string:participant>&'
           'substance=<string:substance>&'
           'session=<string:session>')
@api.route('/start/quest')
class QuestCreate(Resource):
    @staticmethod
    def post(participant, substance, session):
        if substance not in ['sodium chloride', 'sucrose',
                             'quinine hydrochloride', 'citric acid',
                             'monosodium glutamate']:
            abort(400)

        exp_info = dict(participant=participant,
                        session=session,
                        substance=substance)

        if substance == 'sodium chloride':
            start = 0
            sd = 10
            min = -10
            max = 10
            max_trials = 20
            stop_interval = 0.5
        elif substance == 'sucrose':
            start = 5
            sd = 10
            min = -10
            max = 10
            max_trials = 20
            stop_interval = 0.5
        else:
            abort(500)

        quest = QuestHandler(start, startValSd=sd, minVal=min, maxVal=max,
                             stopInterval=stop_interval, nTrials=max_trials,
                             extraInfo=exp_info)
        quest.__next__()
        r = Response(quest.saveAsJson(), mimetype='application/json')
        # print(quest)
        return r


@api.route('/quest/create/'
           'start=<string:start>&'
           'sd=<string:sd>&'
           'min=<string:min>&'
           'max=<string:max>&'
           'stop_inverval=<string:stop_interval>&'
           'max_trials=<string:max_trials>&'
           'exp_info=<string:exp_info>')
@api.param('start', 'Starting intensity')
@api.param('sd', 'Standard deviation of initial guess')
@api.param('min', 'Maximum value')
@api.param('max', 'Minimum value')
@api.param('stop_interval', '5–95% CI at which staircase can terminate')
@api.param('max_trials', 'Number of trials after which staircase can terminate')
@api.param('exp_info', 'Extra experimental info, like participant ID and age')
class QuestCreate2(Resource):
    @staticmethod
    def get(start, sd, min, max, stop_interval, max_trials, exp_info):
        try:
            start = float(start)
            sd = float(sd)
            min = float(min)
            max = float(max)
            stop_interval = float(stop_interval)
            max_trials = float(max_trials)
        except ValueError:
            abort(404)

        quest = QuestHandler(start, startValSd=sd, minVal=min, maxVal=max,
                             stopInterval=stop_interval, nTrials=max_trials,
                             extraInfo=flask.json.loads(exp_info))
        quest.__next__()
        r = Response(quest.saveAsJson(), mimetype='application/json')
        return r


@api.route('/quest/update/'
           'intensity=<string:intensity>&'
           'response=<int:response>')
@api.param('intensity', 'The current intensity level')
@api.param('response', 'The response to a stimulus of the current intensity')
class QuestUpdate(Resource):
    @staticmethod
    @api.expect(models.quest_json_response)
    def post(intensity, response):
        try:
            intensity = float(intensity)
        except ValueError:
            abort(404)

        quest = request.get_data(as_text=True)  # Return unicode, not bytes.
        quest = json_tricks.np.loads(quest)
        quest.addResponse(response, intensity)

        try:
            quest.__next__()
        except StopIteration:
            pass

        r = Response(quest.saveAsJson(), mimetype='application/json')
        return r


@api.route('/quest/download_report')
class QuestDownloadReport(Resource):
    @staticmethod
    @api.expect(models.quest_json_response)
    def post(request):
        quest = request.get_data(as_text=True)  # Return unicode, not bytes.
        quest = json_tricks.np.loads(quest)

        temp_dir = mkdtemp()
        exp_run_filename = ('%s - %s - %s - Run.csv' %
                            (quest.extraInfo['participant'],
                             quest.extraInfo['substance'],
                             quest.extraInfo['session']))

        exp_summary_filename = ('%s - %s - %s - Summary.csv' %
                                (quest.extraInfo['participant'],
                                 quest.extraInfo['substance'],
                                 quest.extraInfo['session']))

        quest.saveAsText(os.path.join(temp_dir, exp_run_filename))
        quest.saveAsText(os.path.join(temp_dir, exp_summary_filename))

        with ZipFile(os.path.join(temp_dir, 'Report.zip'), 'w') as f:
            f.write(os.path.join(temp_dir, exp_run_filename))
            f.write(os.path.join(temp_dir, exp_summary_filename))

        print('Download report...')

        # r = Response(quest.saveAsText(), mimetype='application/json')
        r = Response(os.path.join(temp_dir, 'Report.zip'),
                     mimetype='application/zip')
        os.rmdir(temp_dir)
        return r



