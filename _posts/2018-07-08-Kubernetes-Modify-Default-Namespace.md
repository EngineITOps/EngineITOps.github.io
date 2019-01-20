---
layout: post
title: How to change kubernetes default namespace for issuing commands
tags: kubernetes
category: Kubernetes
author: vikrant
comments: true
---

How to change the default namespace for issuing the kubernetes command?

- Check the current config view, t's showing current-context as minikube. 

~~~
$ kubectl config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: REDACTED
    server: https://172.17.1.101:6443
  name: cluster.local
- cluster:
    certificate-authority: /Users/viaggarw/.minikube/ca.crt
    server: https://192.168.99.101:8443
  name: minikube
contexts:
- context:
    cluster: cluster.local
    user: admin-cluster.local
  name: admin-cluster.local
- context:
    cluster: minikube
    user: minikube
  name: minikube
current-context: minikube
kind: Config
preferences: {}
users:
- name: admin-cluster.local
  user:
    client-certificate-data: REDACTED
    client-key-data: REDACTED
- name: minikube
  user:
    client-certificate: /Users/viaggarw/.minikube/client.crt
    client-key: /Users/viaggarw/.minikube/client.key
~~~    

- Export the current context into variable.

~~~
$ export CURRENT_CONTEXT=$(kubectl config view|awk '/current-context/ {print $2}')
$ echo $CURRENT_CONTEXT
~~~    

- Modify the current "default" namespace context to "kube-system" namespace. 

~~~
$ kubectl config set-context $CURRENT_CONTEXT --namespace=kube-system
Context "minikube" modified.
~~~

- Check the output of the command again, it's still showing minikube.

~~~
$ kubectl config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: REDACTED
    server: https://172.17.1.101:6443
  name: cluster.local
- cluster:
    certificate-authority: /Users/viaggarw/.minikube/ca.crt
    server: https://192.168.99.101:8443
  name: minikube
contexts:
- context:
    cluster: cluster.local
    user: admin-cluster.local
  name: admin-cluster.local
- context:
    cluster: minikube
    namespace: kube-system
    user: minikube
  name: minikube
current-context: minikube
kind: Config
preferences: {}
users:
- name: admin-cluster.local
  user:
    client-certificate-data: REDACTED
    client-key-data: REDACTED
- name: minikube
  user:
    client-certificate: /Users/viaggarw/.minikube/client.crt
    client-key: /Users/viaggarw/.minikube/client.key
~~~

- Now issuing any command without specifying the namespace will issue the command in kube-system namespace instead of default namespace. 

~~~
$ kubectl get pod
NAME                                        READY     STATUS    RESTARTS   AGE
default-http-backend-59868b7dd6-55x77       1/1       Running   2          2d
etcd-minikube                               1/1       Running   0          11h
heapster-l6g7t                              1/1       Running   0          11h
influxdb-grafana-jq6mp                      2/2       Running   0          11h
kube-addon-manager-minikube                 1/1       Running   2          2d
kube-apiserver-minikube                     1/1       Running   0          11h
kube-controller-manager-minikube            1/1       Running   0          11h
kube-dns-79f5cdddc5-qq62q                   3/3       Running   0          11h
kube-proxy-854rs                            1/1       Running   0          11h
kube-scheduler-minikube                     1/1       Running   1          1d
kubernetes-dashboard-5498ccf677-pdw4g       1/1       Running   6          2d
metrics-server-85c979995f-wm5br             1/1       Running   0          11h
nginx-ingress-controller-67956bf89d-2chmj   1/1       Running   7          2d
storage-provisioner                         1/1       Running   6          2d
~~~    
