---
layout: post
title: How to setup kubernetes using minikube
tags: kubernetes
category: Kubernetes
author: vikrant
comments: true
---

After hearing too much about the kuberenetes, I thought of start learning about it. Being from the openstack background, I initially planned to use openstack for learning the kubernetes but then I decided to use minikube on MAC with virtual box provider for my initial learning and then gradually moving to use kubernetes on cloud platform like openstack. Starting the kubernetes using minikube is really a cake-walk. Once it's initialized, usually people are tempted to start the first pod or deployment, I was too but before doing that I thought of checking what is present in minikube by default. In this article, I am going to shed some light on the default resources of minikube. 

~~~
$ curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.28.0/minikube-darwin-amd64 && chmod +x minikube && sudo mv minikube /usr/local/bin/

$ minikube version
minikube version: v0.28.0
~~~

After installing the minikube, install the kubectl to communicate with minikube.

~~~
$ brew install kubernetes-cli
$ kubectl version
Client Version: version.Info{Major:"1", Minor:"9", GitVersion:"v1.9.5", GitCommit:"f01a2bf98249a4db383560443a59bed0c13575df", GitTreeState:"clean", BuildDate:"2018-03-19T15:59:24Z", GoVersion:"go1.9.3", Compiler:"gc", Platform:"darwin/amd64"}
Server Version: version.Info{Major:"1", Minor:"10", GitVersion:"v1.10.0", GitCommit:"fc32d2f3698e36b93322a3465f63a14e9f0eaead", GitTreeState:"clean", BuildDate:"2018-03-26T16:44:10Z", GoVersion:"go1.9.3", Compiler:"gc", Platform:"linux/amd64"}
~~~

I ran the kubectl get all on the minikube to see all the resources present in kubernetes. I noticed that by default lot of resources are present. All of the resources are present in kube-systems but one service is present in default namespace hence if you are going to run this command without "--all-namespace" switch you would be able to see only one service present by default. Since minikube is running both controller and minion (node) on a single node hence in production when you will be segregating the roles you may not found all of these resources present by default on single node. 


~~~
w$ kubectl get all --all-namespaces
NAMESPACE     NAME            DESIRED   CURRENT   READY     UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
kube-system   ds/kube-proxy   1         1         1         1            1           <none>          2m

NAMESPACE     NAME                              DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
kube-system   deploy/default-http-backend       1         1         1            1           2m
kube-system   deploy/kube-dns                   1         1         1            1           2m
kube-system   deploy/kubernetes-dashboard       1         1         1            1           2m
kube-system   deploy/nginx-ingress-controller   1         1         1            1           2m

NAMESPACE     NAME                                     DESIRED   CURRENT   READY     AGE
kube-system   rs/default-http-backend-59868b7dd6       1         1         1         2m
kube-system   rs/kube-dns-86f4d74b45                   1         1         1         2m
kube-system   rs/kubernetes-dashboard-5498ccf677       1         1         1         2m
kube-system   rs/nginx-ingress-controller-67956bf89d   1         1         1         2m

NAMESPACE     NAME                                           READY     STATUS    RESTARTS   AGE
kube-system   po/default-http-backend-59868b7dd6-55x77       1/1       Running   0          2m
kube-system   po/etcd-minikube                               1/1       Running   0          1m
kube-system   po/kube-addon-manager-minikube                 1/1       Running   0          1m
kube-system   po/kube-apiserver-minikube                     1/1       Running   0          1m
kube-system   po/kube-controller-manager-minikube            1/1       Running   0          2m
kube-system   po/kube-dns-86f4d74b45-wv7j6                   3/3       Running   0          2m
kube-system   po/kube-proxy-x4hhm                            1/1       Running   0          2m
kube-system   po/kube-scheduler-minikube                     1/1       Running   0          1m
kube-system   po/kubernetes-dashboard-5498ccf677-pdw4g       1/1       Running   0          2m
kube-system   po/nginx-ingress-controller-67956bf89d-2chmj   1/1       Running   0          2m
kube-system   po/storage-provisioner                         1/1       Running   0          2m

NAMESPACE     NAME                       TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE
default       svc/kubernetes             ClusterIP   10.96.0.1       <none>        443/TCP         2m
kube-system   svc/default-http-backend   NodePort    10.96.215.164   <none>        80:30001/TCP    2m
kube-system   svc/kube-dns               ClusterIP   10.96.0.10      <none>        53/UDP,53/TCP   2m
kube-system   svc/kubernetes-dashboard   NodePort    10.96.72.101    <none>        80:30000/TCP    2m
~~~

Let's first undersand the acryonms which we are seeing before "/" in NAME column.

ds = daemonset (Which means that this resource will be running on all nodes in cluster. if any new node is added, it will automatically start on it.)

kube-proxy in this case is running as daemon set. Pod (Covered later in article) corresponding to ds/kube-proxy is "kube-proxy-x4hhm"

~~~
$ kubectl describe ds/kube-proxy --namespace kube-system | tail -1
  Normal  SuccessfulCreate  7m    daemonset-controller  Created pod: kube-proxy-x4hhm
~~~

deploy = deployment (A Deployment controller provides declarative updates for Pods and ReplicaSets). I am using the kubernetes-dns in the further example because this is the only POD for which the numeber of container is 3 in po (POD) section rest all POD are having one container.. 

kube-dns deployment definition everything related to RS and POD also. RS should have one replica and POD contains three containers, we can see the image, ports, arguments, Limits, environment variable used to start the containers in a POD. 

~~~
$ kubectl describe deploy/kube-dns  --namespace kube-system
Name:                   kube-dns
Namespace:              kube-system
CreationTimestamp:      Sat, 07 Jul 2018 18:30:31 +0530
Labels:                 k8s-app=kube-dns
Annotations:            deployment.kubernetes.io/revision=1
Selector:               k8s-app=kube-dns
Replicas:               1 desired | 1 updated | 1 total | 1 available | 0 unavailable
StrategyType:           RollingUpdate
MinReadySeconds:        0
RollingUpdateStrategy:  0 max unavailable, 10% max surge
Pod Template:
  Labels:           k8s-app=kube-dns
  Service Account:  kube-dns
  Containers:
   kubedns:
    Image:  k8s.gcr.io/k8s-dns-kube-dns-amd64:1.14.8
    Ports:  10053/UDP, 10053/TCP, 10055/TCP
    Args:
      --domain=cluster.local.
      --dns-port=10053
      --config-dir=/kube-dns-config
      --v=2
    Limits:
      memory:  170Mi
    Requests:
      cpu:      100m
      memory:   70Mi
    Liveness:   http-get http://:10054/healthcheck/kubedns delay=60s timeout=5s period=10s #success=1 #failure=5
    Readiness:  http-get http://:8081/readiness delay=3s timeout=5s period=10s #success=1 #failure=3
    Environment:
      PROMETHEUS_PORT:  10055
    Mounts:
      /kube-dns-config from kube-dns-config (rw)
   dnsmasq:
    Image:  k8s.gcr.io/k8s-dns-dnsmasq-nanny-amd64:1.14.8
    Ports:  53/UDP, 53/TCP
    Args:
      -v=2
      -logtostderr
      -configDir=/etc/k8s/dns/dnsmasq-nanny
      -restartDnsmasq=true
      --
      -k
      --cache-size=1000
      --no-negcache
      --log-facility=-
      --server=/cluster.local/127.0.0.1#10053
      --server=/in-addr.arpa/127.0.0.1#10053
      --server=/ip6.arpa/127.0.0.1#10053
    Requests:
      cpu:        150m
      memory:     20Mi
    Liveness:     http-get http://:10054/healthcheck/dnsmasq delay=60s timeout=5s period=10s #success=1 #failure=5
    Environment:  <none>
    Mounts:
      /etc/k8s/dns/dnsmasq-nanny from kube-dns-config (rw)
   sidecar:
    Image:  k8s.gcr.io/k8s-dns-sidecar-amd64:1.14.8
    Port:   10054/TCP
    Args:
      --v=2
      --logtostderr
      --probe=kubedns,127.0.0.1:10053,kubernetes.default.svc.cluster.local,5,SRV
      --probe=dnsmasq,127.0.0.1:53,kubernetes.default.svc.cluster.local,5,SRV
    Requests:
      cpu:        10m
      memory:     20Mi
    Liveness:     http-get http://:10054/metrics delay=60s timeout=5s period=10s #success=1 #failure=5
    Environment:  <none>
    Mounts:       <none>
  Volumes:
   kube-dns-config:
    Type:      ConfigMap (a volume populated by a ConfigMap)
    Name:      kube-dns
    Optional:  true
Conditions:
  Type           Status  Reason
  ----           ------  ------
  Available      True    MinimumReplicasAvailable
  Progressing    True    NewReplicaSetAvailable
OldReplicaSets:  <none>
NewReplicaSet:   kube-dns-86f4d74b45 (1/1 replicas created)
Events:
  Type    Reason             Age   From                   Message
  ----    ------             ----  ----                   -------
  Normal  ScalingReplicaSet  13m   deployment-controller  Scaled up replica set kube-dns-86f4d74b45 to 1
~~~

rs = replica set controller (Decides how many replicas for POD should be running)

For the brevity I am truncating the container section from the following output which we have seen in the previous output. 

~~~
$ kubectl describe rs/kube-dns-86f4d74b45 --namespace kube-system
Name:           kube-dns-86f4d74b45
Namespace:      kube-system
Selector:       k8s-app=kube-dns,pod-template-hash=4290830601
Labels:         k8s-app=kube-dns
                pod-template-hash=4290830601
Annotations:    deployment.kubernetes.io/desired-replicas=1
                deployment.kubernetes.io/max-replicas=2
                deployment.kubernetes.io/revision=1
Controlled By:  Deployment/kube-dns
Replicas:       1 current / 1 desired
Pods Status:    1 Running / 0 Waiting / 0 Succeeded / 0 Failed
Pod Template:
  Labels:           k8s-app=kube-dns
                    pod-template-hash=4290830601
  Service Account:  kube-dns
~~~

service (To access the pod dns service is created)

~~~
$ kubectl describe svc/kube-dns  --namespace kube-system
Name:              kube-dns
Namespace:         kube-system
Labels:            k8s-app=kube-dns
                   kubernetes.io/cluster-service=true
                   kubernetes.io/name=KubeDNS
Annotations:       <none>
Selector:          k8s-app=kube-dns
Type:              ClusterIP
IP:                10.96.0.10
Port:              dns  53/UDP
TargetPort:        53/UDP
Endpoints:         172.17.0.2:53
Port:              dns-tcp  53/TCP
TargetPort:        53/TCP
Endpoints:         172.17.0.2:53
Session Affinity:  None
Events:            <none>
~~~


pod (Finally smallest unit in kubernetes is POD). We can see that further POD is using the volumes to provide the secrets and configmaps. 

~~~
$ kubectl describe po/kube-dns-86f4d74b45-wv7j6  --namespace kube-system
Name:           kube-dns-86f4d74b45-wv7j6
Namespace:      kube-system
Node:           minikube/10.0.2.15
Start Time:     Sat, 07 Jul 2018 18:30:37 +0530
Labels:         k8s-app=kube-dns
                pod-template-hash=4290830601
Annotations:    <none>
Status:         Running
IP:             172.17.0.2
Controlled By:  ReplicaSet/kube-dns-86f4d74b45


SKIPPING THE CONTAINER OUTPUT.

Conditions:
  Type           Status
  Initialized    True
  Ready          True
  PodScheduled   True
Volumes:
  kube-dns-config:
    Type:      ConfigMap (a volume populated by a ConfigMap)
    Name:      kube-dns
    Optional:  true
  kube-dns-token-nfcdr:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  kube-dns-token-nfcdr
    Optional:    false
QoS Class:       Burstable
Node-Selectors:  <none>
Tolerations:     CriticalAddonsOnly
                 node-role.kubernetes.io/master:NoSchedule
                 node.kubernetes.io/not-ready:NoExecute for 300s
                 node.kubernetes.io/unreachable:NoExecute for 300s
Events:          <none>
~~~

Let's check the configmap and secrets present on system because these were not listed in all the resource output which dumped initially to see all resources on system. 

~~~
$ kubectl get configmap --namespace kube-system
NAME                                 DATA      AGE
extension-apiserver-authentication   6         14h
ingress-controller-leader-nginx      0         14h
kube-proxy                           2         14h
kubeadm-config                       1         14h
nginx-load-balancer-conf             2         14h

$ kubectl get secrets --namespace kube-system
NAME                                             TYPE                                  DATA      AGE
attachdetach-controller-token-xzvzr              kubernetes.io/service-account-token   3         14h
bootstrap-signer-token-pz8m9                     kubernetes.io/service-account-token   3         14h
bootstrap-token-cgd2by                           bootstrap.kubernetes.io/token         7         14h
certificate-controller-token-4fcjb               kubernetes.io/service-account-token   3         14h
clusterrole-aggregation-controller-token-fr29l   kubernetes.io/service-account-token   3         14h
cronjob-controller-token-4zd24                   kubernetes.io/service-account-token   3         14h
daemon-set-controller-token-k92hf                kubernetes.io/service-account-token   3         14h
default-token-k68bf                              kubernetes.io/service-account-token   3         14h
deployment-controller-token-jbc7z                kubernetes.io/service-account-token   3         14h
disruption-controller-token-7dwqt                kubernetes.io/service-account-token   3         14h
endpoint-controller-token-vcfhj                  kubernetes.io/service-account-token   3         14h
generic-garbage-collector-token-lk2m5            kubernetes.io/service-account-token   3         14h
horizontal-pod-autoscaler-token-fnvnd            kubernetes.io/service-account-token   3         14h
job-controller-token-nmkcq                       kubernetes.io/service-account-token   3         14h
kube-dns-token-nfcdr                             kubernetes.io/service-account-token   3         14h
kube-proxy-token-t7sjn                           kubernetes.io/service-account-token   3         14h
kubernetes-dashboard-key-holder                  Opaque                                2         14h
namespace-controller-token-l4gj7                 kubernetes.io/service-account-token   3         14h
node-controller-token-g7czq                      kubernetes.io/service-account-token   3         14h
persistent-volume-binder-token-slsv6             kubernetes.io/service-account-token   3         14h
pod-garbage-collector-token-ljt2j                kubernetes.io/service-account-token   3         14h
pv-protection-controller-token-j5sst             kubernetes.io/service-account-token   3         14h
pvc-protection-controller-token-c4hgm            kubernetes.io/service-account-token   3         14h
replicaset-controller-token-7gkdt                kubernetes.io/service-account-token   3         14h
replication-controller-token-gcfhk               kubernetes.io/service-account-token   3         14h
resourcequota-controller-token-7chh8             kubernetes.io/service-account-token   3         14h
service-account-controller-token-q4z2z           kubernetes.io/service-account-token   3         14h
service-controller-token-qcjsh                   kubernetes.io/service-account-token   3         14h
statefulset-controller-token-w547r               kubernetes.io/service-account-token   3         14h
storage-provisioner-token-d48tx                  kubernetes.io/service-account-token   3         14h
token-cleaner-token-vh9c2                        kubernetes.io/service-account-token   3         14h
ttl-controller-token-89vvh                       kubernetes.io/service-account-token   3         14h
~~~

I didn't see kube-dns in config map which was defined in POD output then I read it carefully, it's an optional component. Just to verify that it's not present in any namespace. 

~~~
$ kubectl get configmap --all-namespaces
NAMESPACE     NAME                                 DATA      AGE
kube-public   cluster-info                         2         14h
kube-system   extension-apiserver-authentication   6         14h
kube-system   ingress-controller-leader-nginx      0         14h
kube-system   kube-proxy                           2         14h
kube-system   kubeadm-config                       1         14h
kube-system   nginx-load-balancer-conf             2         14h
~~~

Since kubernetes is based on plugin architecture. If you want to see the provided 

~~~
# pwd
/etc/kubernetes/addons
# ls -lrt
total 28
-rw-r----- 1 root root  273 Jul  7 12:59 storageclass.yaml
-rw-r----- 1 root root 1161 Jul  7 12:59 ingress-configmap.yaml
-rw-r----- 1 root root 3714 Jul  7 12:59 ingress-dp.yaml
-rw-r----- 1 root root 1011 Jul  7 12:59 ingress-svc.yaml
-rw-r----- 1 root root 1709 Jul  7 12:59 storage-provisioner.yaml
-rw-r----- 1 root root 1510 Jul  7 12:59 dashboard-dp.yaml
-rw-r----- 1 root root 1016 Jul  7 12:59 dashboard-svc.yaml
~~~