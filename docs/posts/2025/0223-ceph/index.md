---
title: ProxmoxでCephを試す
date: 2025-02-23
description: ProxmoxにCephを入れて、VM Diskにしたりk8sから使えるようにする
tags: [ "proxmox", "ceph" ]
---

[[toc]]

## Cephのインストール

### Setup

現時点での最新バージョン(squid 19.2)を使います。RepositoryはNo-Subscriptionにします。
![setup-1](0223-ceph-install-1.png)

以下のパッケージが入るようです。
```
  ceph ceph-base ceph-mds ceph-mgr ceph-mgr-modules-core ceph-mon ceph-osd
  ceph-volume cryptsetup-bin libnvme1 libparted2 libsqlite3-mod-ceph nvme-cli
  parted python3-autocommand python3-bcrypt python3-cffi-backend
  python3-cheroot python3-cherrypy3 python3-cryptography python3-inflect
  python3-jaraco.classes python3-jaraco.collections python3-jaraco.context
  python3-jaraco.functools python3-jaraco.text python3-logutils python3-mako
  python3-more-itertools python3-natsort python3-openssl python3-paste
  python3-pastedeploy python3-pastedeploy-tpl python3-pecan python3-portend
  python3-simplegeneric python3-singledispatch python3-tempita python3-tempora
  python3-waitress python3-webob python3-webtest python3-werkzeug
  python3-zc.lockfile sudo uuid-runtime
```

### ネットワークとレプリケーションの設定

NetworkとReplicationの設定を書きます。
Public/Cluster Networkは今回同じでいきます。

::: details Public NetworkとCluster Network
[wiki](https://pve.proxmox.com/wiki/Deploy_Hyper-Converged_Ceph_Cluster)から引用します。
- **Public Network**:
  This network will be used for public storage communication (e.g., for virtual machines using a Ceph RBD backed disk, or a CephFS mount), and communication between the different Ceph services. This setting is required.
  Separating your Ceph traffic from the Proxmox VE cluster communication (corosync), and possible the front-facing (public) networks of your virtual guests, is highly recommended. Otherwise, Ceph’s high-bandwidth IO-traffic could cause interference with other low-latency dependent services.
- **Cluster Network**:
  Specify to separate the OSD replication and heartbeat traffic as well. This setting is optional.
  Using a physically separated network is recommended, as it will relieve the Ceph public and the virtual guests network, while also providing a significant Ceph performance improvements.
  The Ceph cluster network can be configured and moved to another physically separated network at a later time.

PublicはCeph Service同士の通信とか、普通のRWに使われるっぽい？
ClusterはReplicationとHeartbeatに使われるみたいです。

CorosyncとPublicは分けたほうがいいでしょう。
:::

Replicationはデフォルトのままでいいでしょう。
![setup-network](0223-ceph-install-network.png)

### Success

完了したらこんな感じになります。
![setup-success](0223-ceph-success.png)

## Monitorを増やす

Ceph Monitorを増やします。
それぞれ別のノードで作ります。普通にインストールするとすでに1つだけあるはず。
3つ以上はいらないらしい。
![monitor](0223-ceph-monitor.png)

## Managerも増やす

Monitorと同じようにManagerを増やします。
増やしたやつはStandbyになるはずです。
![manager](0223-ceph-manager.png)

## OSDをつくる

OSDのメニューでCreate OSDからOSDを作ります。

![create-osd](0223-ceph-osd.png)

## CephFSの作成

### MDS (MetaData Server)の作成

全ノードで作っておきます。
![create-ceph-mds](0223-ceph-mds.png)

ここまでやるとクラスタのCeph/Servicesの項目がAll Greenになります。綺麗。
![all-green](0223-ceph-cluster-services.png)

### CephFSの作成

左上のCreate CephFSから作れます。
値はデフォルトでいいと思います。
![create-cephfs](0223-ceph-create-cephfs.png)
できてます。
![cephfsls](0223-ceph-fsls.png)
CephFSをつくると、データとメタデータ用のPoolが自動で作られるようです。
![cephfs-pools](0223-cephfs-pools.png)
ProxmoxのStorageとしても見えています。
![cephfs-proxmox-storage](0223-ceph-proxmox-storage.png)

### 試しにISOファイルを入れてみる

試しにUbuntu ServerのISOを入れてみましょう。
https://ftp.udx.icscoe.jp/Linux/ubuntu-releases/24.04.2/ から落とせる、`ubuntu-24.04.2-live-server-amd64.iso`を使います。

![ceph-iso-download](0223-ceph-try-iso.png)

いい具合にReplicationされていそうです。
![ceph-replication](0223-ceph-replication.png)

## VMを作れるようにする

### Poolの作成

RBD Poolを作成します。名前は適当に`vm`で。

![ceph-vm-rbd](0223-ceph-vm-rbd.png)

### VMの作成

普通にVMを作りつつ、Disksの設定をします。
Storageに、作ったRBDを指定します。
![ceph-create-vm-with-rbd](0223-ceph-create-vm-rbd.png)

## k8sから使えるようにする

[Rook](https://rook.io)を使って、ProxmoxのCephクラスタをk8sから見えるようにします。

幸いなことに、[External Storage Clusterについてのドキュメント](https://rook.io/docs/rook/latest-release/CRDs/Cluster/external-cluster/external-cluster/)
があるので、この通りにすれば良さそうです。


### Pythonスクリプトの実行

[ここ](https://github.com/rook/rook/blob/master/deploy/examples/create-external-cluster-resources-tests.py)にあるPythonスクリプトを落としておきます。ドキュメントに書いてあるパスより1階層上に移ったようです。

```shell
python3 create-external-cluster-resources.py --rbd-data-pool-name k8s --namespace rook-ceph --skip-monitoring-endpoint --format bash
```

出力をコピーしておきます。

### HelmでOperatorをインストール

#### Git clone

```shell
git clone https://github.com/rook/rook.git
cd rook/deploy/chars/rook-ceph-cluster
```

#### インストール

```shell
clusterNamespace=rook-ceph
operatorNamespace=rook-ceph
cd deploy/examples/charts/rook-ceph-cluster
helm repo add rook-release https://charts.rook.io/release
helm install --create-namespace --namespace $clusterNamespace rook-ceph rook-release/rook-ceph -f values.yaml
helm install --create-namespace --namespace $clusterNamespace rook-ceph-cluster \
--set operatorNamespace=$operatorNamespace rook-release/rook-ceph-cluster -f values-external.yaml
```

[`values-external`](https://github.com/rook/rook/blob/master/deploy/charts/rook-ceph-cluster/values-external.yaml)を用意します。

#### Import External Cluster

[ここ](https://github.com/rook/rook/blob/master/deploy/examples/import-external-cluster.sh)にあるPythonスクリプトを落としておきます。
これもドキュメントに書いてあるパスより1階層上に移っています。

```shell
sh import-external-cluster.sh
```

これで、k8sからCephのクラスタが見えるようになります。

### 別の方法

Rookを使った方法も普通に動きます。
ただ、クラスタを破壊して再構築したときが少し面倒で、個別のPVCごとにbackupからrestoreしてくる必要があります。
さらに、k8upだとsnapshotがresticにあってもCRDに自動でしてくれず、fetchするようなコマンドも特にないようで、少々厳しい。

`nfs-subdir-external-provisioner`を使っていた時は、ファイル構造からPVの名前を排除していることで解決していましたが、
ブロックデバイスを使用する場合はもちろん、CephFSを使う場合でもそういったオプションはなさそうです。

::: details Cluster Migration
クラスタを破壊して再構築しても状態を保持する、というようなことは**Cluster Migration**というものらしいです。
PVCのデータだけをバックアップするのではなく、etcdに入っているリソースを含めてクラスタ全体のバックアップをとることで実現できます。

これをやってくれるツールに[Velero](https://velero.io)というのがあるようです。
:::

というわけで、CephFSをNFS Exportして`nfs-subdir-external-provisioner`で使うことにします。
~~Exportしてるノードが落ちたら死にます。~~

#### パッケージのインストール

```shell
apt install nfs-ganesha nfs-ganesha-ceph
```

#### 設定

exportするディレクトリと、k8sが利用するディレクトリを作ります。

```shell [on the PVE node]
cd /mnt/pve/cephfs
mkdir nfs-export
cd nfs-export
mkdir k8s
```

`/etc/ganesha/ganesha.conf`を編集します。


Secret Access Keyは`ceph auth get-key client.admin`で取得できます。
ClientsのCIDRは適宜変更してください。

``` [/etc/ganesha/ganesha.conf]
EXPORT
{
    Export_ID = 1;
    Protocols = 4;
    Transports = TCP;
    Path = "/nfs-export";
    Pseudo = "/";
    Access_Type = RW;
    Squash = No_Root_Squash;
    Attr_Expiration_Time = 0;
    FSAL {
        Name = CEPH;
        User_Id = "admin";
        Secret_Access_Key = "XXXXXXXX====";
        Ceph_Cluster = "ceph";
    }
    CLIENT {
        Clients = 192.168.1.0/24;
        Access_Type = RW;
    }
}
```

#### nfs-subdir-ext-provisionerのインストール

ArgoCDを使っているので、以下のようなManifestを作ります。

```yaml [nfs-ceph.yaml]
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: nfs-provisioner-ceph
  namespace: argocd
spec:
  destination:
    namespace: nfs-provisioner-ceph
    server: https://kubernetes.default.svc
  source:
    repoURL: https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
    targetRevision: 4.0.18
    chart: nfs-subdir-external-provisioner
    helm:
      releaseName: nfs-provisioner-ceph
      parameters:
        - name: nfs.server
          value: 192.168.1.12
        - name: nfs.path
          value: /k8s
        - name: storageClass.name
          value: nfs-ceph
        - name: storageClass.provisionerName
          value: k8s-sigs.io/nfs-ceph
        - name: storageClass.reclaimPolicy
          value: Retain
        - name: storageClass.pathPattern
          value: "$${.PVC.namespace}/$${.PVC.name}"
        - name: storageClass.onDelete
          value: retain
  project: default
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

これでうまくいくはずです。

```shell
k get pvc -A
NAMESPACE    NAME                   STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
mc-vanilla   mc-vanilla-data        Bound    pvc-958b6c71-1527-40af-a9e6-1469dcb5af5b   10Gi       RWO            nfs-ceph       <unset>                 2d3h
```

## 参考

- 【2024年7月版】Ubuntu で Cephクラスタの構築、NFSからの利用メモ【分散ストレージ, CephFS, NFS, Ganesha】: https://qiita.com/nouernet/items/5fb01c928da5546539f1
- kubernetesからProxmoxのCephを使う : https://www.tunamaguro.dev/articles/20240318-kubernetes%E3%81%8B%E3%82%89Proxmox%E3%81%AECeph%E3%82%92%E4%BD%BF%E3%81%86/