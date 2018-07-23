#!/usr/bin/env python

from setuptools import setup

setup(
    name='webtaste_backend',
    packages=['webtaste_backend'],
    include_package_data=True,
    install_requires=[
        'flask', 'flask_restplus', 'mysqlclient', 'xlsxwriter'
    ],
)
