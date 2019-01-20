---
layout: post
title: Helm first step - 101
tags: [kubernetes, helm]
category: [Kubernetes, Helm]
author: vikrant
comments: true
---


Helm is the package manager for kubernetes, similar to dnf or yum in linux. It's very to start with helm, if you have followed my previous articles, you may already know that I am using minikube for kubernetes learning which is running on Mac using Oracle virtualbox provider. Helm is based on client/server architecture, it has two components helm itself which is command to talk to kube-api server in my case helm is installed on Mac and tiller which installed on kubernetes nodes i.e minikube. 

- Install helm using brew.

~~~
$ brew install kubernetes-helm
~~~

- Initialize helm. It has installed the service side component Tiller. 

~~~
$ helm init
$HELM_HOME has been configured at /Users/viaggarw/.helm.

Tiller (the Helm server-side component) has been installed into your Kubernetes Cluster.

Please note: by default, Tiller is deployed with an insecure 'allow unauthenticated users' policy.
For more information on securing your installation see: https://docs.helm.sh/using_helm/#securing-your-helm-installation
Happy Helming!
~~~

- Check the version of client and server.

~~~
$ helm version
Client: &version.Version{SemVer:"v2.9.1", GitCommit:"20adb27c7c5868466912eebdf6664e7390ebe710", GitTreeState:"clean"}
Server: &version.Version{SemVer:"v2.9.1", GitCommit:"20adb27c7c5868466912eebdf6664e7390ebe710", GitTreeState:"clean"}
~~~

- Tiller is installed in kube-system namespace. 

~~~
$ kubectl get all --namespace=kube-system | grep -i tiller

deploy/tiller-deploy              1         1         1            1           16m

rs/tiller-deploy-f9b8476d                1         1         1         16m

po/tiller-deploy-f9b8476d-qn26w                1/1       Running   0          16m


svc/tiller-deploy          ClusterIP   10.103.164.110   <none>        44134/TCP           16m
~~~

- By default it's registered with these repos. stable is the one containing production level charts. 

~~~
$ helm repo list
NAME  	URL
stable	https://kubernetes-charts.storage.googleapis.com
local 	http://127.0.0.1:8879/charts
~~~

- Performing `helm search` will return all the available charts in stable repo. output is truncated for brevity.

~~~
$ helm search
NAME                                 	CHART VERSION	APP VERSION                 	DESCRIPTION
stable/acs-engine-autoscaler         	2.2.0        	2.1.1                       	Scales worker nodes within agent pools
stable/aerospike                     	0.1.7        	v3.14.1.2                   	A Helm chart for Aerospike in Kubernetes
stable/anchore-engine                	0.1.7        	0.1.10                      	Anchore container analysis and policy evaluatio...
stable/apm-server                    	0.1.0        	6.2.4                       	The server receives data from the Elastic APM a...
stable/ark                           	1.0.1        	0.8.2                       	A Helm chart for ark
stable/artifactory                   	7.2.1        	6.0.0                       	Universal Repository Manager supporting all maj...
~~~

- Randomly I chose the redis chart for the installation. All the information to access redis is printed on terminal. 

~~~
$ helm install stable/redis
NAME:   guilded-bird
LAST DEPLOYED: Sun Jul 15 12:34:10 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/Pod(related)
NAME                                       READY  STATUS             RESTARTS  AGE
guilded-bird-redis-slave-78bdf547cb-jxv6d  0/1    ContainerCreating  0         0s
guilded-bird-redis-master-0                0/1    Pending            0         0s

==> v1/Secret
NAME                TYPE    DATA  AGE
guilded-bird-redis  Opaque  1     0s

==> v1/Service
NAME                       TYPE       CLUSTER-IP      EXTERNAL-IP  PORT(S)   AGE
guilded-bird-redis-master  ClusterIP  10.109.130.245  <none>       6379/TCP  0s
guilded-bird-redis-slave   ClusterIP  10.96.29.85     <none>       6379/TCP  0s

==> v1beta1/Deployment
NAME                      DESIRED  CURRENT  UP-TO-DATE  AVAILABLE  AGE
guilded-bird-redis-slave  1        1        1           0          0s

==> v1beta2/StatefulSet
NAME                       DESIRED  CURRENT  AGE
guilded-bird-redis-master  1        1        0s


NOTES:
** Please be patient while the chart is being deployed **
Redis can be accessed via port 6379 on the following DNS names from within your cluster:

guilded-bird-redis-master.default.svc.cluster.local for read/write operations
guilded-bird-redis-slave.default.svc.cluster.local for read-only operations


To get your password run:

    export REDIS_PASSWORD=$(kubectl get secret --namespace default guilded-bird-redis -o jsonpath="{.data.redis-password}" | base64 --decode)

To connect to your Redis server:

1. Run a Redis pod that you can use as a client:

   kubectl run --namespace default guilded-bird-redis-client --rm --tty -i \
    --env REDIS_PASSWORD=$REDIS_PASSWORD \
   --image docker.io/bitnami/redis:4.0.10-debian-9 -- bash

2. Connect using the Redis CLI:
   redis-cli -h guilded-bird-redis-master -a $REDIS_PASSWORD
   redis-cli -h guilded-bird-redis-slave -a $REDIS_PASSWORD

To connect to your database from outside the cluster execute the following commands:

    export POD_NAME=$(kubectl get pods --namespace default -l "app=redis" -o jsonpath="{.items[0].metadata.name}")
    kubectl port-forward --namespace default $POD_NAME 6379:6379
    redis-cli -h 127.0.0.1 -p 6379 -a $REDIS_PASSWORD
~~~

- Two PODs are running.

~~~
$ kubectl get pod
NAME                                        READY     STATUS    RESTARTS   AGE
guilded-bird-redis-master-0                 1/1       Running   0          1m
guilded-bird-redis-slave-78bdf547cb-jxv6d   1/1       Running   0          1m
~~~

- Client POD as indicated in printed output can be start to connect with redis.

~~~
$ kubectl run --namespace default guilded-bird-redis-client --rm --tty -i \
>     --env REDIS_PASSWORD=$REDIS_PASSWORD \
>    --image docker.io/bitnami/redis:4.0.10-debian-9 -- bash
If you don't see a command prompt, try pressing enter.
I have no name!@guilded-bird-redis-client-7b55d8876c-dw5qn:/$ redis-c
redis-check-aof  redis-check-rdb  redis-cli
I have no name!@guilded-bird-redis-client-7b55d8876c-dw5qn:/$ redis-c
redis-check-aof  redis-check-rdb  redis-cli
I have no name!@guilded-bird-redis-client-7b55d8876c-dw5qn:/$ redis-cli -h guilded-bird-redis-master -a IvWtA7pVdi
Warning: Using a password with '-a' option on the command line interface may not be safe.
guilded-bird-redis-master:6379>
guilded-bird-redis-master:6379>
guilded-bird-redis-master:6379> quit
I have no name!@guilded-bird-redis-client-7b55d8876c-dw5qn:/$ exit
exit
~~~

- 

~~~
$ helm list
NAME        	REVISION	UPDATED                 	STATUS  	CHART      	NAMESPACE
guilded-bird	1       	Sun Jul 15 12:34:10 2018	DEPLOYED	redis-3.6.4	default

$ helm delete guilded-bird
release "guilded-bird" deleted

$ helm list
$

$ helm list --all
NAME        	REVISION	UPDATED                 	STATUS 	CHART      	NAMESPACE
guilded-bird	1       	Sun Jul 15 12:34:10 2018	DELETED	redis-3.6.4	default
~~~

