#!/usr/bin/env python

import boto3
from datetime import datetime


lightsail = boto3.client('lightsail')

date_string = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')

instance_name = 'sensory-testing'
instance_backup_name = f'{instance_name}_{date_string}'

lightsail.create_instance_snapshot(instanceName=instance_name,
                                   instanceSnapshotName=instance_backup_name)
