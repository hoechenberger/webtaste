# Storage setup
## List block devices
```
lsblk
```

Example output:
```
NAME    MAJ:MIN  RM SIZE RO TYPE MOUNTPOINT
xvda    202:0     0  20G  0 disk
└─xvda1 202:1     0  20G  0 part /
xvdf    202:80    0   8G  0 disk /mnt/webtaste
xvds    202:4608  0   8G  0 disk [SWAP]
```

---

```
blkid
```

Example output:
```
/dev/xvda1: LABEL="cloudimg-rootfs" UUID="5c615711-516f-4eb1-bca9-592288a14b59" TYPE="ext4" PARTUUID="55bca5c1-01"
/dev/xvdf: LABEL="webtaste" UUID="51411222-8efb-48b3-8176-fc5b2209fc71" TYPE="ext4"
/dev/xvds: LABEL="swap" UUID="fd151f79-1a14-4bee-bb33-ea962c5fa029" TYPE="swap"
```

## Initialize main block storage
```
sudo mkfs.ext4 /dev/xvdf -L webtaste
```

## Initialize swap storage
```
sudo mkswap -L swap /dev/xvds
sudo swapon -L swap
```

## Example `/etc/fstab`
```
LABEL=cloudimg-rootfs	/	       ext4   defaults,discard	0 0
LABEL=webtaste		/mnt/webtaste  ext4   defaults,noatime	0 2
LABEL=swap              swap           swap   defaults          0 0
```

# Backup

* Install Miniconda to `~/miniconda3`
* Set up new `conda` environment:
    ```
    conda create -n backup -c conda-forge python=3 boto3
    ```
 
 * Add backup scripts to `crontab`:
     ```
     crontab -e
     ```
     
     Add the following entries:
     
     ```
     0 * * * * /mnt/webtaste/webtaste/aws_lightsail/create_block_backup.sh
     0 0 * * * /mnt/webtaste/webtaste/aws_lightsail/create_instance_backup.sh
     0 0 * * * /mnt/webtaste/webtaste/aws_lightsail/delete_old_backups.sh
     ```