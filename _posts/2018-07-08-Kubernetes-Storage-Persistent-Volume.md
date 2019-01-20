---
layout: post
title: How to use nfs as a storage backend with kubernetes
tags: [kubernetes, nfs]
category: Kubernetes
author: vikrant
comments: true
---

In this article, I am covering the kubernetes storage options for stateful containers. To persist the container data we need to attach the volume with container. Kubernetes has evolved  a lot to provide the various storage options to create the volumes required by POD.

I am using the minikube setup for my learning, by default storageclass is present in minikube which allows us to create storage volumes from the HostPath. 

~~~
# cat /etc/kubernetes/addons/storageclass.yaml
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  namespace: kube-system
  name: standard
  annotations:
    storageclass.beta.kubernetes.io/is-default-class: "true"
  labels:
    addonmanager.kubernetes.io/mode: Reconcile
~~~

- This the small definition of PersistentVolumeClaim to verify that it's able to successfully create the volume using storage class. 

~~~
$ cat helloworld-pvc.yml
kind: PersistentVolumeClaim
apiVersion: v1
metadata:
  name: myvolume
spec:
  accessModes: [ "ReadWriteOnce" ]
  storageClassName: standard
  resources:
    requests:
      storage: 8Gi
~~~

- Once we created resource using kubectl command. We can see that PV (Physical volume of 8GB) is created automatically. 

~~~
$ kubectl create -f helloworld-pvc.yml
persistentvolumeclaim "myvolume" created

$ kubectl get pvc
NAME       STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
myvolume   Bound     pvc-995a4eb8-829c-11e8-850e-080027ee32dc   8Gi        RWO            standard       3s

$ kubectl get pv
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS    CLAIM              STORAGECLASS   REASON    AGE
pvc-995a4eb8-829c-11e8-850e-080027ee32dc   8Gi        RWO            Delete           Bound     default/myvolume   standard                 7s      
~~~

- If you describe the pvc we can see that type 

~~~
$ kubectl describe pv/pvc-995a4eb8-829c-11e8-850e-080027ee32dc
Name:            pvc-995a4eb8-829c-11e8-850e-080027ee32dc
Labels:          <none>
Annotations:     hostPathProvisionerIdentity=ecc37120-8297-11e8-af51-080027ee32dc
                 pv.kubernetes.io/provisioned-by=k8s.io/minikube-hostpath
StorageClass:    standard
Status:          Bound
Claim:           default/myvolume
Reclaim Policy:  Delete
Access Modes:    RWO
Capacity:        8Gi
Message:
Source:
    Type:          HostPath (bare host directory volume)
    Path:          /tmp/hostpath-provisioner/pvc-995a4eb8-829c-11e8-850e-080027ee32dc
    HostPathType:
Events:            <none>
~~~

Log into the minikube and check the content of the directory "/tmp/hostpath-provisioner/pvc-995a4eb8-829c-11e8-850e-080027ee32dc"

~~~
# cd pvc-995a4eb8-829c-11e8-850e-080027ee32dc/
# ls
commitlog  data  hints  saved_caches
~~~

- Let's try to run a POD which is using the same PVC. Before that I cleared the previously created PVC and gave it a new name for fresh start. 

~~~
$ kubectl get pvc
NAME       STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
myvolume   Bound     pvc-5ba5d98d-82af-11e8-850e-080027ee32dc   8Gi        RWO            standard       4m
~~~

- Configuring NFS as backend for volumes instead of default host (minikube directory). I have issued this command on Mac to export the NFS share. 

~~~
$ echo "/Users -alldirs -mapall="$(id -u)":"$(id -g)" 192.168.99.100"| sudo tee -a /etc/exports
~~~

- Use the following yaml definition to create NFS volume. We can see that it has created Volume using NFS path which we exported from Mac. 

~~~
$ cat nfsvolume.yml
apiVersion: v1
kind: PersistentVolume
metadata:
  name: test-nfs-volume1
spec:
  capacity:
    storage: 8Gi
  accessModes:
  - ReadWriteMany
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  nfs:
    server: 192.168.99.1
    path: /Users/Shared/Sites/

$ kubectl get pv -o wide
NAME               CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS      CLAIM     STORAGECLASS   REASON    AGE
test-nfs-volume1   8Gi        RWX            Retain           Available             standard                 1h    

$ kubectl describe pv test-nfs-volume1
Name:            test-nfs-volume1
Labels:          <none>
Annotations:     <none>
StorageClass:    standard
Status:          Available
Claim:
Reclaim Policy:  Retain
Access Modes:    RWX
Capacity:        8Gi
Message:
Source:
    Type:      NFS (an NFS mount that lasts the lifetime of a pod)
    Server:    192.168.99.1
    Path:      /Users/Shared/Sites/
    ReadOnly:  false
Events:        <none> 
~~~   