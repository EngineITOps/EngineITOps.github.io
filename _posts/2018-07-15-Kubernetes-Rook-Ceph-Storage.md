---
layout: post
title: How to create ceph cluster using ROOK in kubernetes
tags: ["rook", "kubernetes", "ceph"]
category: ["Ceph", "Kubernetes", "Rook"]
permalink: /kuberenetes/How to create ceph cluster using ROOK in kubernetes/
author: vikrant
comments: true
---	

Running a stateful application in POD is not an easy task. I worked on ceph for brief period of time. I thought of using an existing ceph setup to provide persistent storage for kubernetes. For this exercise, created single node ceph cluster. I was facing some issues in integrating existing ceph setup with minikube kubernetes. While I was searching for this issue, I came across this interesting project ROOK which is used to create ceph cluster on top of kubernetes. I really like that idea, in case of on-premise kubernetes deployment where servers are having lot of disks, and these disks can be used to create a distributed ceph cluster using ROOK. It's not only limited to ceph only other supported storage types are "CockroachDB" and "minio" as per project github page. Okay enought talking, let's start with some practical work. 

ROOK operator can be installed using helm charts or using the examples given in official link. I have used example operator.yaml for the installation, it assumed that RBAC is enabled. 

In this article, I am going to use the [examples](https://github.com/rook/rook/tree/master/cluster/examples/kubernetes/ceph
) provided in official ROOK github repository.

- First create a [ceph operator](https://github.com/rook/rook/blob/master/cluster/examples/kubernetes/ceph/operator.yaml) role. 

~~~
$ kubectl create -f ceph-operator.yml
namespace "rook-ceph-system" created
customresourcedefinition "clusters.ceph.rook.io" created
customresourcedefinition "filesystems.ceph.rook.io" created
customresourcedefinition "objectstores.ceph.rook.io" created
customresourcedefinition "pools.ceph.rook.io" created
customresourcedefinition "volumes.rook.io" created
clusterrole "rook-ceph-cluster-mgmt" created
role "rook-ceph-system" created
clusterrole "rook-ceph-global" created
serviceaccount "rook-ceph-system" created
rolebinding "rook-ceph-system" created
clusterrolebinding "rook-ceph-global" created
deployment "rook-ceph-operator" created
~~~

- List all the resources created in rook-ceph-system namespace. It has two created two daemonsets and one deployment. 

~~~
$ kubectl get all -n rook-ceph-system
NAME                 DESIRED   CURRENT   READY     UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
ds/rook-ceph-agent   1         1         1         1            1           <none>          1m
ds/rook-discover     1         1         1         1            1           <none>          1m

NAME                        DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/rook-ceph-operator   1         1         1            1           2m

NAME                               DESIRED   CURRENT   READY     AGE
rs/rook-ceph-operator-86776bbc44   1         1         1         2m

NAME                                     READY     STATUS    RESTARTS   AGE
po/rook-ceph-agent-wq7f7                 1/1       Running   0          1m
po/rook-ceph-operator-86776bbc44-t6lpg   1/1       Running   0          2m
po/rook-discover-929cv                   1/1       Running   0          1m
~~~

- Create ceph cluster using [cluster.yml](https://github.com/rook/rook/blob/master/cluster/examples/kubernetes/ceph/cluster.yaml), only two changes which I made were to change the mon `count` from 3 to 1 and changing `dataDirHostPath` from `/var/lib/rook` to `/data/rook`. 

~~~
$ kubectl create -f cluster.yml
namespace "rook-ceph" created
serviceaccount "rook-ceph-cluster" created
role "rook-ceph-cluster" created
rolebinding "rook-ceph-cluster-mgmt" created
rolebinding "rook-ceph-cluster" created
cluster "rook-ceph" created
~~~

If you are going to run the above command without changing the `dataDirHostPath`. It will get failed with following error in minikube. In case of minikube, it's mandatory to change the path. 

~~~
2018-07-15 11:04:54.456354 I | exec: Running command: ceph-mon --foreground --name=mon.rook-ceph-mon0 --cluster=rook-ceph --mon-data=/var/lib/rook/rook-ceph-mon0/data --conf=/var/lib/rook/rook-ceph-mon0/rook-ceph.config --keyring=/var/lib/rook/rook-ceph-mon0/keyring --public-addr=10.99.145.45:6790 --public-bind-addr=172.17.0.14:6790
2018-07-15 11:04:54.479849 I | rook-ceph-mon0: 2018-07-15 11:04:54.479521 7f247919bec0  0 ceph version 12.2.5 (cad919881333ac92274171586c827e01f554a70a) luminous (stable), process (unknown), pid 17
2018-07-15 11:04:54.479878 I | rook-ceph-mon0: 2018-07-15 11:04:54.479581 7f247919bec0 -1 error: monitor data filesystem reached concerning levels of available storage space (available: -2147483648%!b(MISSING)ytes)
2018-07-15 11:04:54.479882 I | rook-ceph-mon0: you may adjust 'mon data avail crit' to a lower value to make this go away (default: 5%!)(MISSING)
2018-07-15 11:04:54.479885 I | rook-ceph-mon0:
2018-07-15 11:04:54.481396 I | rook-ceph-mon0: 2018-07-15 11:04:54.479581 7f247919bec0 -1 error: monitor data filesystem reached concerning levels of available storage space (available: -2147483648%!b(MISSING)ytes)
2018-07-15 11:04:54.481416 I | rook-ceph-mon0: you may adjust 'mon data avail crit' to a lower value to make this go away (default: 5%!)(MISSING)
2018-07-15 11:04:54.481420 I | rook-ceph-mon0:
failed to run mon. failed to start mon: Failed to complete 'rook-ceph-mon0': exit status 28.
~~~

- Check all the resources created in `rook-ceph` namespace. Two deploymentss are created. 

~~~
$ kubectl get all -n rook-ceph
NAME                        DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/rook-ceph-mgr-a      1         1         1            1           1m
deploy/rook-ceph-osd-id-0   1         1         1            1           1m

NAME                               DESIRED   CURRENT   READY     AGE
rs/rook-ceph-mgr-a-75cc4ccbf4      1         1         1         1m
rs/rook-ceph-mon0                  1         1         1         1m
rs/rook-ceph-osd-id-0-77df9d59c5   1         1         1         1m

NAME                                  DESIRED   SUCCESSFUL   AGE
jobs/rook-ceph-osd-prepare-minikube   1         1            1m

NAME                                     READY     STATUS    RESTARTS   AGE
po/rook-ceph-mgr-a-75cc4ccbf4-5ns2l      1/1       Running   0          1m
po/rook-ceph-mon0-r48g6                  1/1       Running   0          1m
po/rook-ceph-osd-id-0-77df9d59c5-ckhvt   1/1       Running   0          1m

NAME                          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
svc/rook-ceph-mgr             ClusterIP   10.108.199.19   <none>        9283/TCP   1m
svc/rook-ceph-mgr-dashboard   ClusterIP   10.102.88.239   <none>        7000/TCP   1m
svc/rook-ceph-mon0            ClusterIP   10.108.81.241   <none>        6790/TCP   1m
~~~

- To check the health of ceph cluster and for other ceph related troubleshooting commands, start [rook toolbox](https://github.com/rook/rook/blob/master/cluster/examples/kubernetes/ceph/toolbox.yaml) POD in rook-ceph namespace. 

~~~
$ kubectl create -f toolbox.yml

$ kubectl get all -n rook-ceph
NAME                        DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/rook-ceph-mgr-a      1         1         1            1           2m
deploy/rook-ceph-osd-id-0   1         1         1            1           2m

NAME                               DESIRED   CURRENT   READY     AGE
rs/rook-ceph-mgr-a-75cc4ccbf4      1         1         1         2m
rs/rook-ceph-mon0                  1         1         1         2m
rs/rook-ceph-osd-id-0-77df9d59c5   1         1         1         2m

NAME                                  DESIRED   SUCCESSFUL   AGE
jobs/rook-ceph-osd-prepare-minikube   1         1            2m

NAME                                     READY     STATUS    RESTARTS   AGE
po/rook-ceph-mgr-a-75cc4ccbf4-5ns2l      1/1       Running   0          2m
po/rook-ceph-mon0-r48g6                  1/1       Running   0          2m
po/rook-ceph-osd-id-0-77df9d59c5-ckhvt   1/1       Running   0          2m
po/rook-ceph-tools                       1/1       Running   0          35s

NAME                          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
svc/rook-ceph-mgr             ClusterIP   10.108.199.19   <none>        9283/TCP   2m
svc/rook-ceph-mgr-dashboard   ClusterIP   10.102.88.239   <none>        7000/TCP   2m
svc/rook-ceph-mon0            ClusterIP   10.108.81.241   <none>        6790/TCP   2m
~~~

- Check the health of ceph cluster issuing the bash command from toolbox POD. Ceph is in healthy state. 

~~~
$ kubectl exec -it po/rook-ceph-tools bash
error: invalid resource name "po/rook-ceph-tools": [may not contain '/']
HAM-VIAGGARW-02:CEPH viaggarw$ kubectl -n rook-ceph exec -it rook-ceph-tools bash
bash: warning: setlocale: LC_CTYPE: cannot change locale (en_US.UTF-8): No such file or directory
bash: warning: setlocale: LC_COLLATE: cannot change locale (en_US.UTF-8): No such file or directory
bash: warning: setlocale: LC_MESSAGES: cannot change locale (en_US.UTF-8): No such file or directory
bash: warning: setlocale: LC_NUMERIC: cannot change locale (en_US.UTF-8): No such file or directory
bash: warning: setlocale: LC_TIME: cannot change locale (en_US.UTF-8): No such file or directory

[root@rook-ceph-tools /]# ceph -s
  cluster:
    id:     7dcd3cd9-e00c-45d9-a6b2-67c2d1d87252
    health: HEALTH_OK

  services:
    mon: 1 daemons, quorum rook-ceph-mon0
    mgr: a(active)
    osd: 1 osds: 1 up, 1 in

  data:
    pools:   0 pools, 0 pgs
    objects: 0 objects, 0 bytes
    usage:   4194 MB used, 12298 MB / 16492 MB avail
    pgs:
~~~

- Creat a ceph [storageclass](https://github.com/rook/rook/blob/master/cluster/examples/kubernetes/ceph/storageclass.yaml) and one ceph pool. 

~~~
$ kubectl create -f storageclass.yml
pool "replicapool" created
storageclass "rook-ceph-block" created
~~~

- Verify that pool is created successfully in ceph. 

~~~
[root@rook-ceph-tools /]# ceph osd lspools
1 replicapool,
~~~

- Create a volume inside the ceph using PVC (Persistent Volume claim). 

~~~
$ cat helloworld-pvc.yml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: myvolume
  annotations:
    volume.beta.kubernetes.io/storage-class: "rook-ceph-block"
spec:
  accessModes: [ "ReadWriteOnce" ]
  resources:
    requests:
      storage: 1Gi

$ kubectl get pvc
NAME       STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS      AGE
myvolume   Bound     pvc-8feed0aa-8830-11e8-b365-08002703dcb1   1Gi        RWO            rook-ceph-block   1m

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS    CLAIM              STORAGECLASS      REASON    AGE
pvc-8feed0aa-8830-11e8-b365-08002703dcb1   1Gi        RWO            Delete           Bound     default/myvolume   rook-ceph-block             0s
~~~

- Verify that object is created in ceph pool. 

~~~
[root@rook-ceph-tools /]# rbd -p replicapool ls
pvc-8feed0aa-8830-11e8-b365-08002703dcb1

[root@rook-ceph-tools /]# rbd -p replicapool info pvc-8feed0aa-8830-11e8-b365-08
rbd image 'pvc-8feed0aa-8830-11e8-b365-08002703dcb1':
	size 1024 MB in 256 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.109774b0dc51
	format: 2
	features: layering
	flags:
	create_timestamp: Sun Jul 15 13:11:20 2018  
~~~

- Start the POD which will use the PVC and mount it on `/tmp`. Create some files in the `/tmp` filesystem. 

~~~	
$ kubectl exec -it helloworld-7989d67bdb-nz9sc bash
root@helloworld-7989d67bdb-nz9sc:/app# df -Ph
Filesystem      Size  Used Avail Use% Mounted on
overlay          17G  3.9G   12G  26% /
tmpfs            64M     0   64M   0% /dev
tmpfs           3.1G     0  3.1G   0% /sys/fs/cgroup
/dev/rbd0       976M  2.6M  907M   1% /tmp
/dev/sda1        17G  3.9G   12G  26% /etc/hosts
shm              64M     0   64M   0% /dev/shm
tmpfs           3.1G   12K  3.1G   1% /run/secrets/kubernetes.io/serviceaccount
tmpfs           3.1G     0  3.1G   0% /proc/scsi
tmpfs           3.1G     0  3.1G   0% /sys/firmware

root@helloworld-7989d67bdb-nz9sc:/tmp# touch testfile{1..5}
root@helloworld-7989d67bdb-nz9sc:/tmp# ls
lost+found  testfile1  testfile2  testfile3  testfile4	testfile5
~~~

- Delete the deployment which we have created. Start the new deployment and verify that same files are present in the /tmp filesystem which indicates that persistence is working fine. 

~~~
$ kubectl get all
NAME                DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/helloworld   1         1         1            1           3m

NAME                       DESIRED   CURRENT   READY     AGE
rs/helloworld-7989d67bdb   1         1         1         3m

NAME                             READY     STATUS    RESTARTS   AGE
po/helloworld-7989d67bdb-nz9sc   1/1       Running   0          3m

NAME             TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
svc/kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   1h

$ kubectl delete deploy/helloworld
deployment "helloworld" deleted

$ kubectl create -f helloworld-with-volume.yml
deployment "helloworld" created

$ kubectl exec -it helloworld-7989d67bdb-4kcbl bash
root@helloworld-7989d67bdb-4kcbl:/app# df -Ph
Filesystem      Size  Used Avail Use% Mounted on
overlay          17G  3.9G   12G  26% /
tmpfs            64M     0   64M   0% /dev
tmpfs           3.1G     0  3.1G   0% /sys/fs/cgroup
/dev/rbd0       976M  2.6M  907M   1% /tmp
/dev/sda1        17G  3.9G   12G  26% /etc/hosts
shm              64M     0   64M   0% /dev/shm
tmpfs           3.1G   12K  3.1G   1% /run/secrets/kubernetes.io/serviceaccount
tmpfs           3.1G     0  3.1G   0% /proc/scsi
tmpfs           3.1G     0  3.1G   0% /sys/firmware
root@helloworld-7989d67bdb-4kcbl:/app# cd /tmp/
root@helloworld-7989d67bdb-4kcbl:/tmp# ls
lost+found  testfile1  testfile2  testfile3  testfile4	testfile5
~~~

- Try to start another, I just modify the deployment name ;) but that POD will not start because our volume is of type `ReadWriteOnce` which means it can be mount in RW mode only in one POD hence another POD which is trying to use this volume is stuck in ContainerCreating, and reason can be confirmed from the events in `kubectl describe pod/helloworld1-7989d67bdb-dv7qs` command. 

~~~
$ kubectl get pod
NAME                           READY     STATUS              RESTARTS   AGE
helloworld-7989d67bdb-4kcbl    1/1       Running             0          6m
helloworld1-7989d67bdb-dv7qs   0/1       ContainerCreating   0          4m

Events:
  Type     Reason                 Age              From               Message
  ----     ------                 ----             ----               -------
  Normal   Scheduled              3m               default-scheduler  Successfully assigned helloworld1-7989d67bdb-dv7qs to minikube
  Normal   SuccessfulMountVolume  3m               kubelet, minikube  MountVolume.SetUp succeeded for volume "default-token-w5vbd"
  Warning  FailedMount            1m               kubelet, minikube  Unable to mount volumes for pod "helloworld1-7989d67bdb-dv7qs_default(0c6184c1-8832-11e8-b365-08002703dcb1)": timeout expired waiting for volumes to attach or mount for pod "default"/"helloworld1-7989d67bdb-dv7qs". list of unmounted volumes=[myvolume]. list of unattached volumes=[myvolume default-token-w5vbd]
  Warning  FailedMount            1m (x9 over 3m)  kubelet, minikube  MountVolume.SetUp failed for volume "pvc-8feed0aa-8830-11e8-b365-08002703dcb1" : mount command failed, status: Failure, reason: Rook: Mount volume failed: failed to attach volume pvc-8feed0aa-8830-11e8-b365-08002703dcb1 for pod default/helloworld1-7989d67bdb-dv7qs. Volume is already attached by pod default/helloworld-7989d67bdb-4kcbl. Status Running
~~~

- As soon as you delete the original POD, we can see that POD which was stuck in ContainerCreating state is now started. 

~~~
$ kubectl delete deploy helloworld
deployment "helloworld" deleted

$ kubectl get pod
NAME                           READY     STATUS    RESTARTS   AGE
helloworld1-7989d67bdb-dv7qs   1/1       Running   0          11m
~~~


#### Installing operator using hook.

- If you are planning to use helm for operator installatin then after adding the repository you may see two available charts.

~~~
$ helm repo add rook-master https://charts.rook.io/master

$ helm search rook
NAME                 	CHART VERSION      	APP VERSION	DESCRIPTION
rook-master/rook     	v0.7.0-136.gd13bc83	           	File, Block, and Object Storage Services for yo...
rook-master/rook-ceph	v0.7.0-284.g863c10f	           	File, Block, and Object Storage Services for yo...
~~~ 

If you are wondering about the difference in rook and rook-ceph then this is the info which I got from community. 

~~~
For 0.8 with the mulitple storage backends introduced a split has happened in `master` which moves from "one" Rook operator to multiple Rook operator (e.g. when a chart for CockroachDB has been created, a chart probably named `rook-master/rook-cockroachdb` will/should be available).
`rook-master/rook` will become obsolete with release of `v0.8`
~~~
