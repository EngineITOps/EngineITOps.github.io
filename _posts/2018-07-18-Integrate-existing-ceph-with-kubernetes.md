---
layout: post
title: How to integrate existing ceph with kubernetes
tags: [kubernetes, ceph]
category: [Kubernetes, Ceph]
author: vikrant
comments: true
---

In [one of previous post](https://ervikrant06.github.io/kuberenetes/How%20to%20create%20ceph%20cluster%20using%20ROOK%20in%20kubernetes/) we have seen the hyperconverged implementation of ceph using ROOK on kubernetes. In this article, I am showing the integration of existing ceph cluster with kubernetes, in other words, using existing ceph as backend for POD persisten storage. 

All setup is done on my laptop using the Oracle Virtual box. 

#### Setup Information

- Centos 7 
- Ceph installed on Centos 7
- Minikube 

#### Gotchas 

- I did the installation of centos 7 without any modification in the interfaces and started with ceph installation. 
- By default minikube took the same IP address which is assigned on Centos 7 machine since I didn't want to mess up with the minikube hence I changed the Centos 7 IP address to ensure that both don't have same IPs.
- These are two interfaces present in minikube VM. 
~~~
$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:03:dc:b1 brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic eth0
       valid_lft 85683sec preferred_lft 85683sec
    inet6 fe80::a00:27ff:fe03:dcb1/64 scope link
       valid_lft forever preferred_lft forever
3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:2c:18:ec brd ff:ff:ff:ff:ff:ff
    inet 192.168.99.105/24 brd 192.168.99.255 scope global dynamic eth1
       valid_lft 1162sec preferred_lft 1162sec
    inet6 fe80::a00:27ff:fe2c:18ec/64 scope link
       valid_lft forever preferred_lft forever
~~~
- Since we want our minikube VM to communicate with Ceph which is installed on Centos hence add another interface to Centos which will be attached the network 192.168.99.0/24. After adding that interface may be you need to add the manual interface configuration file to make the IP address persisten across reboots. I like static IPs.
~~~
[root@cephcentos ~]# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:77:7d:65 brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.16/24 brd 10.0.2.255 scope global enp0s3
       valid_lft forever preferred_lft forever
3: enp0s8: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:f4:d5:ff brd ff:ff:ff:ff:ff:ff
    inet 192.168.99.104/24 brd 192.168.99.255 scope global enp0s8
       valid_lft forever preferred_lft forever
~~~
- Before starting the ceph installation. I added this entry in hosts file so that my ceph installation will use `enp0s8` interface because minikube wouldn't be able to communiate with `enp0s3` interface of Centos at-least I see this behavior in my setup.  
~~~
[root@cephcentos ~]# cat /etc/hosts
127.0.0.1   localhost localhost.localdomain localhost4 localhost4.localdomain4
::1         localhost localhost.localdomain localhost6 localhost6.localdomain6
192.168.99.104 cephcentos
~~~              

#### Ceph installation 

- Followed this [link](https://www.berrange.com/posts/2015/12/21/ceph-single-node-deployment-on-fedora-23/) for ceph installation, even though article is written for fedora but the steps will also work fine for you on Centos machine. 

Before activating the OSD make sure that ownership is change for the OSD directory.

~~~
chown ceph:ceph /srv/ceph/osd/
~~~

- After the installation ceph should show in healthy state. 

~~~
[root@cephcentos ~]# ceph -s
    cluster 7f4b17e8-ea2f-4785-af69-30e0f420b0af
     health HEALTH_OK
     monmap e1: 1 mons at {cephcentos=192.168.99.104:6789/0}
            election epoch 3, quorum 0 cephcentos
     osdmap e12: 1 osds: 1 up, 1 in
            flags sortbitwise,require_jewel_osds
      pgmap v24801: 164 pgs, 2 pools, 247 bytes data, 8 objects
            6770 MB used, 10623 MB / 17394 MB avail
                 164 active+clean
~~~    

#### [Minikue installation](https://ervikrant06.github.io/kubernetes/Kubernetes-Beginning/) already covered earlier. 

- Verify that minikube health is okay.       

~~~
$ kubectl get cs
NAME                 STATUS    MESSAGE              ERROR
scheduler            Healthy   ok
controller-manager   Healthy   ok
etcd-0               Healthy   {"health": "true"}
~~~


#### Kubernetes preparation for ceph integration

- For this part, I followed this [wonderful blog](https://akomljen.com/using-existing-ceph-cluster-for-kubernetes-persistent-storage/). I am not repeating all steps here kindly refer the blog for RBAC and deployment resource. 

- Created a pool kube for kubernetes and kube user with access to that pool. 

~~~
[root@cephcentos ~]# ceph --cluster ceph osd pool create kube 100 100                 
[root@cephcentos ~]# ceph --cluster ceph auth get-or-create client.kube mon 'allow r' osd 'allow rwx pool=kube'
[root@cephcentos ~]# 
~~~

- Create the secrets in minikube. 

~~~
[root@cephcentos ~]# ceph --cluster ceph auth get-key client.admin
AQBE2UpbmXjnBRAAI9hRnFmS6z2BVRIqSft3cw==

[root@cephcentos ~]# ceph --cluster ceph auth get-key client.kube
AQA92kpbCwXaDhAAb+BGfc1fyT792jcyVOXT3w==                 


$ kubectl create secret generic ceph-secret \
    --type="kubernetes.io/rbd" \
    --from-literal=key='AQBE2UpbmXjnBRAAI9hRnFmS6z2BVRIqSft3cw==' \
    --namespace=kube-system

$ kubectl create secret generic ceph-secret-kube \
    --type="kubernetes.io/rbd" \
    --from-literal=key='AQA92kpbCwXaDhAAb+BGfc1fyT792jcyVOXT3w==' \
    --namespace=kube-system
~~~    

- Create storage class using these secrets. You need to replace the IP address in following file with MON IP in your infra. 

~~~
$ cat storage-class.yml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: fast-rbd
provisioner: ceph.com/rbd
parameters:
  monitors: 192.168.99.104:6789
  adminId: admin
  adminSecretName: ceph-secret
  adminSecretNamespace: kube-system
  pool: kube
  userId: kube
  userSecretName: ceph-secret-kube
  userSecretNamespace: kube-system
  imageFormat: "2"
  imageFeatures: layering

$ kubectl create -f storage-class.yml
storageclass "fast-rbd" created
~~~

- Create PVC referring the storageclass which we created earlier. In ceph volume of 8GB is created. 

~~~
$ cat ceph-pvc.yml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: myclaim
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 8Gi
  storageClassName: fast-rbd

$ kubectl create -f ceph-pvc.yml
persistentvolumeclaim "myclaim" created

$ kubectl get pvc
NAME       STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS      AGE
myclaim    Bound     pvc-8f3e08cb-8a36-11e8-be45-08002703dcb1   8Gi        RWO            fast-rbd          5s

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS    CLAIM              STORAGECLASS      REASON    AGE
pvc-8f3e08cb-8a36-11e8-be45-08002703dcb1   8Gi        RWO            Delete           Bound     default/myclaim    fast-rbd                    8s

[root@cephcentos ~]# rbd -p kube ls
kubernetes-dynamic-pvc-8f7b7889-8a36-11e8-93dd-0242ac110009

[root@cephcentos ~]# rbd -p kube info kubernetes-dynamic-pvc-8f7b7889-8a36-11e8-93dd-0242ac110009
rbd image 'kubernetes-dynamic-pvc-8f7b7889-8a36-11e8-93dd-0242ac110009':
	size 8192 MB in 2048 objects
	order 22 (4096 kB objects)
	block_name_prefix: rbd_data.103d643c9869
	format: 2
	features: layering
	flags:
~~~

