#!/usr/bin/env python
# -*- coding: utf-8 -*-

from flask_wtf import FlaskForm
from wtforms import StringField, SelectField
from wtforms.validators import DataRequired


class QuestForm2(FlaskForm):
    participant = StringField('Participant ID', validators=[DataRequired()])
    start = StringField('Starting concentration', validators=[DataRequired()])
    min = StringField('Minimum concentration', validators=[DataRequired()])
    max = StringField('Maximum concentration', validators=[DataRequired()])
    steps = StringField('Number of log steps (incl. min/max)',
                        validators=[DataRequired()])


class QuestForm(FlaskForm):
    participant = StringField('Participant ID',
                              validators=[DataRequired()],
                              default='000')
    substance = SelectField('Substance',
                            choices=[('sucrose', 'Sucrose'),
                                     ('sodium chloride', 'Sodium chloride'),
                                     ('quinine hydrochloride',
                                      'Quinine Hydrochloride'),
                                     ('monosodium glutamate',
                                      'Monosodium glutamate')],
                            validators=[DataRequired()])
    session = StringField('Session',
                          validators=[DataRequired()],
                          default='Test')
