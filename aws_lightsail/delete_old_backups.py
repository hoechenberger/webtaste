#!/usr/bin/env python

import boto3
from datetime import datetime
from dateutil.tz import tzlocal

INSTANCE_SNAPSHOT_MAX_AGE = 120
BLOCK_SNAPSHOT_MAX_AGE = 120


lightsail = boto3.client('lightsail')

current_date = datetime.now(tzlocal())

instance_snapshots = lightsail.get_instance_snapshots()['instanceSnapshots']
block_snapshots = lightsail.get_disk_snapshots()['diskSnapshots']

for instance_snapshot in instance_snapshots:
    snapshot_name = instance_snapshot['name']
    snapshot_age = current_date - instance_snapshot['createdAt']

    if snapshot_age.days > INSTANCE_SNAPSHOT_MAX_AGE:
        lightsail.delete_instance_snapshot(instanceSnapshotName=snapshot_name)

for block_snapshot in block_snapshots:
    snapshot_name = block_snapshot['name']
    snapshot_age = current_date - block_snapshot['createdAt']

    if snapshot_age.days > BLOCK_SNAPSHOT_MAX_AGE:
        lightsail.delete_disk_snapshot(diskSnapshotName=snapshot_name)
