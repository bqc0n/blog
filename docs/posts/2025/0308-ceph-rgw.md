---
title: ProxmoxのCephでObject Storageを使えるようにした 
date: 2025-03-08
description: ProxmoxのCephで、S3-CompatibleなRadosGWを使えるようにする
tags: [ "proxmox", "ceph" ]
---

## 構成

私の場合、pve01、pve02、pve03の3台でCephクラスタを構成している。
構成が異なる場合、コマンドは適宜読み替えてほしい。

## Install RadosGW
全てのノードに`radosgw`をインストールする。
```sh
apt install radosgw
```

## ユーザ作成

まずはCephクラスタにユーザを作成する。
このユーザはradosgwがcephクラスタへのアクセスに使うもので、S3とは関係ないので注意。
S3のユーザはこのあと作成する。

```shell
ceph-authtool --create-keyring /etc/ceph/ceph.client.rgw.keyring
```

```shell
ceph auth get-or-create client.rgw.pve01 mon 'allow rw' osd 'allow rwx' >> /etc/pve/priv/ceph/ceph.client.rgw.keyring
ceph auth get-or-create client.rgw.pve02 mon 'allow rw' osd 'allow rwx' >> /etc/pve/priv/ceph/ceph.client.rgw.keyring
ceph auth get-or-create client.rgw.pve03 mon 'allow rw' osd 'allow rwx' >> /etc/pve/priv/ceph/ceph.client.rgw.keyring
```

## RadosGW 設定

ファイルの最後に追記する。

``` [/etc/ceph/ceph.conf]
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

## RadosGW ユーザ作成

ユーザを作成すると、`access_key`と`secret_key`も同時に生成される。

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

## Misskeyで使えるようにする

ユーザ・バケットの作成は済ませてあり、バケットの名前は`misskey-files`であるとする。

### Policy設定

Misskeyは、Get操作がPublicであることを要求するので、Policyを設定する。

```json [policy.json]
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "*"
        ]
      },
      "Action": [
        "s3:GetObject"
      ],
      "Resource": [
        "arn:aws:s3:::misskey-files/*"
      ]
    }
  ]
}
```

バケットポリシーは、`radosgw-admin`ではなく普通にS3操作で設定する[^policy-setting]。

`s3cmd --configure`でプロンプトに従い設定をしたら、以下を実行する。

```shell
s3cmd setpolicy policy.json s3://misskey-files
```

### MisskeyでObject Storageの設定

`コントロールパネル > オブジェクトストレージ`から設定できます。

|    項目    |                    値                     |
|:--------:|:----------------------------------------:|
| Base URL | `http://<endpoint>:<port>/misskey-files` |
|  Bucket  |             `misskey-files`              |
|  Prefix  |                   お好みで                   |
| endpoint |           `<endpoint>:<port>`            |
|  Region  |                `default`                 |

::: warning
Base URLを名前解決した先がプライベートIPだとエラーになる。
```
INFO *	[download]	Downloading http://ceph-rgw.default.svc.cluster.local./misskey-files/misskey-files/6caeac33-2a0f-4636-8de6-01d2f6fa2a45.webp to /tmp/tmp-116-0z1wF1auUSA1 ...
ERR  *	[server]	RequestError: Blocked address: 10.233.55.230
```
今回はAPIをCloudflare tunnelでインターネットからアクセスするようにして解決した。
:::

[^policy-setting]: [Ceph Documentation | Ceph Object Gateway/Bucket Policies](https://docs.ceph.com/en/latest/radosgw/bucketpolicy/#creation-and-removal:~:text=Bucket%20policies%20are%20managed%20through%20standard%20S3%20operations%20rather%20than%20radosgw%2Dadmin.)