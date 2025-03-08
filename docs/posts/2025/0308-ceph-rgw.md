---
title: ProxmoxのCephでObject Storageを使えるようにした 
date: 2025-03-08
description: ProxmoxのCephで、S3-CompatibleなRadosGWを使えるようにする
tags: [ "proxmox", "ceph" ]
---

## 構成

\<put kousei here\>

## Install RadosGW

```sh
apt install radosgw
systemctl enable radosgw
systemctl start radosgw
```

##

Ceph Object Storageは、Cephクラスタ(gateway daemonやstorage cluster)とのやりとりにはCeph Storage Cluster userを使うが、
Object Storage自体に別でUser Authの仕組みがある。

```mermaid
Client -- Object Storage user --> Ceph Object Storage -- Storage Cluster user --> Ceph Storage Cluster
```

### ユーザ作成

```shell
ceph-authtool --create-keyring /etc/ceph/ceph.client.rgw.keyring
```

```shell
ceph auth get-or-create client.rgw.pve01 mon 'allow rw' osd 'allow rwx' >> /etc/pve/priv/ceph/ceph.client.rgw.keyring
ceph auth get-or-create client.rgw.pve02 mon 'allow rw' osd 'allow rwx' >> /etc/pve/priv/ceph/ceph.client.rgw.keyring
ceph auth get-or-create client.rgw.pve03 mon 'allow rw' osd 'allow rwx' >> /etc/pve/priv/ceph/ceph.client.rgw.keyring
```

## RadosGW 設定

```
[client.rgw.pve01]
  log file = /var/log/radosgw/client.rgw.$host.log
  keyring = /etc/pve/priv/ceph/ceph.client.rgw.keyring
[client.rgw.pve02]
  log file = /var/log/radosgw/client.rgw.$host.log
  keyring = /etc/pve/priv/ceph/ceph.client.rgw.keyring
[client.rgw.pve03]
  log file = /var/log/radosgw/client.rgw.$host.log
  keyring = /etc/pve/priv/ceph/ceph.client.rgw.keyring
```

### Port
デフォルトではポート7480で動作する。
変更したい場合はそれぞれのインスタンス設定の下に`rgw_frontends`を追加する。
```
[client.rgw.pve01]
  log file = /var/log/radosgw/client.rgw.$host.log
  keyring = /etc/pve/priv/ceph/ceph.client.rgw.keyring
  rgw_frontends = "beast port=8080"
```


## RadosGW 起動

それぞれのノードで対応するinstanceを起動する。

```shell
# pve01
systemctl start ceph-radosgw@rgw.pve01
# pve02
systemctl start ceph-radosgw@rgw.pve02
# pve01
systemctl start ceph-radosgw@rgw.pve03
```

## Pool
ここで気づいたのだが、Poolは自動で作られるらしい。
```shell
root@pve01:/var/log/ceph# ceph osd pool ls
...(略)...
.rgw.root
default.rgw.log
default.rgw.control
default.rgw.meta
```

## RadosGW ユーザ作成

`access_key`と`secret_key`メモしておく。

```shell
radosgw-admin user create --uid="test" --display-name="Test User"
{
    "user_id": "test",
    "display_name": "Test User",
    "email": "",
    "suspended": 0,
    "max_buckets": 1000,
    "subusers": [],
    "keys": [
        {
            "user": "test",
            "access_key": "<access_key>",
            "secret_key": "<secret_key>",
            "active": true,
            "create_date": "2025-03-08T03:38:40.836850Z"
        }
    ],
    "swift_keys": [],
    "caps": [],
    "op_mask": "read, write, delete",
    "default_placement": "",
    "default_storage_class": "",
    "placement_tags": [],
    "bucket_quota": {
        "enabled": false,
        "check_on_raw": false,
        "max_size": -1,
        "max_size_kb": 0,
        "max_objects": -1
    },
    "user_quota": {
        "enabled": false,
        "check_on_raw": false,
        "max_size": -1,
        "max_size_kb": 0,
        "max_objects": -1
    },
    "temp_url_keys": [],
    "type": "rgw",
    "mfa_ids": [],
    "account_id": "",
    "path": "/",
    "create_date": "2025-03-08T03:38:40.836566Z",
    "tags": [],
    "group_ids": []
}
```

## Bucketの作成

`aws cli`を使ってBucketを作成する。

```shell
aws configure --profile ceph-test
AWS Access Key ID [None]: <access_key>
AWS Secret Access Key [None]: <secret_key>
Default region name [None]: default
Default output format [None]: json
```

```shell
aws aws s3 mb s3://test-bucket --profile ceph-test --endpoint-url "http://192.168.1.10:7480"
make_bucket: test-bucket
```

```shell
aws s3 ls --profile ceph-test --endpoint-url "http://192.168.1.10:7480"
2025-03-08 13:34:01 test-bucket
```

### オブジェクトを入れてみる

```shell
echo "aaaaaa" >> test.txt
aws s3 mv test.txt s3://test-bucket/test.txt --profile ceph-test --endpoint-url "http://192.168.1.10:7480"
aws s3 ls s3://test-bucket --profile ceph-test --endpoint-url "http://192.168.1.10:7480"
2025-03-08 13:38:58          6 test.txt
```

```shell
aws s3 mv s3://test-bucket/test.txt download-test.txt --profile ceph-test --endpoint-url "http://192.168.1.10:7480"
cat download-test.txt
aaaaaa 
```
