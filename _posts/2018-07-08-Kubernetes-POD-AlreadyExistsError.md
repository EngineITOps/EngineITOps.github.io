---
layout: post
title: Kubernetes pods already exists error
tags: [kubernetes]
category: [Kubernetes]
author: vikrant
comments: true
---

Getting the following error while trying to start the kubernetes POD. 

~~~
$ kubectl run -i --tty busybox --image=busybox --restart=Never -- sh
Error from server (AlreadyExists): pods "busybox" already exists
~~~

However I don't see any POD with busybox name running inside the default or any other namespace. 

~~~
$ kubectl get pod
NAME                         READY     STATUS    RESTARTS   AGE
nodehelloworld.example.com   1/1       Running   0          1h

$ kubectl get pods --all-namespaces
NAMESPACE     NAME                                        READY     STATUS    RESTARTS   AGE
default       nodehelloworld.example.com                  1/1       Running   0          1h
kube-system   default-http-backend-59868b7dd6-55x77       1/1       Running   0          16h
kube-system   etcd-minikube                               1/1       Running   0          16h
kube-system   kube-addon-manager-minikube                 1/1       Running   0          16h
kube-system   kube-apiserver-minikube                     1/1       Running   0          16h
kube-system   kube-controller-manager-minikube            1/1       Running   0          16h
kube-system   kube-dns-86f4d74b45-wv7j6                   3/3       Running   0          16h
kube-system   kube-proxy-x4hhm                            1/1       Running   0          16h
kube-system   kube-scheduler-minikube                     1/1       Running   0          16h
kube-system   kubernetes-dashboard-5498ccf677-pdw4g       1/1       Running   0          16h
kube-system   nginx-ingress-controller-67956bf89d-2chmj   1/1       Running   0          16h
kube-system   storage-provisioner                         1/1       Running   0          16h
~~~

- Issue the following command to see the POD with any status. Without `--show-all` it will only show the POD in running status. 

~~~
$ kubectl get pods --show-all
NAME                         READY     STATUS    RESTARTS   AGE
busybox                      0/1       Error     0          31m
nodehelloworld.example.com   1/1       Running   0          1h

$ kubectl delete pod/busybox
pod "busybox" deleted
~~~

- After deleting the Error container you may run the same command to start the POD.

- It's better to use "--rm" flag which is available in docker also while starting POD using kubectl run command. It will automatically delete the POD. 

~~~
$ kubectl run --rm -i --tty busybox --image=busybox --restart=Never -- sh
If you don't see a command prompt, try pressing enter.
/ # exit
~~~
