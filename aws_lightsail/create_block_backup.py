#!/usr/bin/env python

import boto3
from datetime import datetime


lightsail = boto3.client('lightsail')

date_string = datetime.utcnow().strftime('%Y-%m-%d-%H-%M-%S')

block_name = 'sensory-testing-block-storage-1'
block_backup_name = f'{block_name}_{date_string}'

lightsail.create_disk_snapshot(diskName=block_name,
                               diskSnapshotName=block_backup_name)
