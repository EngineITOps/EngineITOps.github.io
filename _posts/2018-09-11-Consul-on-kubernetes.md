---
layout: post
title: How to run consul on kubernetes
tags: [consul, kubernetes]
category: [consul, kubernetes]
author: vikrant
comments: true
--- 

In this article, I am sharing the steps to run the consul on minikube Kubernetes. For this exercise I am using the official conul helm chart for the deployment. I want to deploy 3 node consul server and a client. 

Step 1 : Make a clone of the git repo and switched to a branch which we will be using for this deployment. 

~~~
$ git clone https://github.com/hashicorp/consul-helm.git

$ git checkout v0.1.0
Note: checking out 'v0.1.0'.

You are in 'detached HEAD' state. You can look around, make experimental
changes and commit them, and you can discard any commits you make in this
state without impacting any branches by performing another checkout.

If you want to create a new branch to retain commits you create, you may
do so (now or later) by using -b with the checkout command again. Example:

  git checkout -b <new-branch-name>

HEAD is now at 78ae636 Update README
~~~

Step 2 : Start the deployment using helm chart. Among three PODs two are stuck in Pending state. 

~~~
$ helm install ./

$ kubectl get pod
NAME                              READY     STATUS              RESTARTS   AGE
zealous-tarsier-consul-j75jh      0/1       ContainerCreating   0          44s
zealous-tarsier-consul-server-0   0/1       ContainerCreating   0          44s
zealous-tarsier-consul-server-1   0/1       Pending             0          44s
zealous-tarsier-consul-server-2   0/1       Pending             0          44s
~~~

Step 3 : I found a issue which was opened in github for similar problem. Removed the anti-affinity rules so that consul server can run on same node. More elegant solution is shared the in the issue recently, you may use that approach also. 

~~~
$ diff --git a/templates/server-statefulset.yaml b/templates/server-statefulset.yaml
index 09ad457..3f29036 100644
--- a/templates/server-statefulset.yaml
+++ b/templates/server-statefulset.yaml
@@ -37,15 +37,15 @@ spec:
       annotations:
         "consul.hashicorp.com/connect-inject": "false"
     spec:
-      affinity:
-        podAntiAffinity:
-          requiredDuringSchedulingIgnoredDuringExecution:
-            - labelSelector:
-                matchLabels:
-                  app: {{ template "consul.name" . }}
-                  release: "{{ .Release.Name }}"
-                  component: server
-              topologyKey: kubernetes.io/hostname
+      #affinity:
+      #  podAntiAffinity:
+      #    requiredDuringSchedulingIgnoredDuringExecution:
+      #      - labelSelector:
+      #          matchLabels:
+      #            app: {{ template "consul.name" . }}
+      #            release: "{{ .Release.Name }}"
+      #            component: server
+      #        topologyKey: kubernetes.io/hostname
       terminationGracePeriodSeconds: 10
       securityContext:
         fsGroup: 1000
~~~

Step 4 : Delete the previous deployment and start the new one by specifying the name consul in it. 

~~~
$ helm install --name=consul .
NAME:   consul
LAST DEPLOYED: Sat Oct  6 15:15:04 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/ConfigMap
NAME                  DATA  AGE
consul-client-config  1     1s
consul-server-config  1     1s

==> v1/Service
NAME           TYPE       CLUSTER-IP      EXTERNAL-IP  PORT(S)                                                                  AGE
consul-dns     ClusterIP  10.110.20.102   <none>       53/TCP,53/UDP                                                            1s
consul-server  ClusterIP  None            <none>       8500/TCP,8301/TCP,8301/UDP,8302/TCP,8302/UDP,8300/TCP,8600/TCP,8600/UDP  1s
consul-ui      ClusterIP  10.102.196.141  <none>       80/TCP                                                                   1s

==> v1/DaemonSet
NAME    DESIRED  CURRENT  READY  UP-TO-DATE  AVAILABLE  NODE SELECTOR  AGE
consul  1        1        0      1           0          <none>         1s

==> v1/StatefulSet
NAME           DESIRED  CURRENT  AGE
consul-server  3        3        1s

==> v1beta1/PodDisruptionBudget
NAME           MIN AVAILABLE  MAX UNAVAILABLE  ALLOWED DISRUPTIONS  AGE
consul-server  N/A            0                0                    1s

==> v1/Pod(related)
NAME             READY  STATUS             RESTARTS  AGE
consul-hjqbs     0/1    ContainerCreating  0         1s
consul-server-0  0/1    ContainerCreating  0         1s
consul-server-1  0/1    ContainerCreating  0         1s
consul-server-2  0/1    Pending            0         1s
~~~

- Verify that PODs are in running status. 

~~~
$ kubectl get pod -o wide | grep consul-
consul-hjqbs                     1/1       Running            0          1m        172.17.0.10   minikube
consul-server-0                  1/1       Running            0          1m        172.17.0.12   minikube
consul-server-1                  1/1       Running            0          1m        172.17.0.11   minikube
consul-server-2                  1/1       Running            0          1m        172.17.0.13   minikube

$ kubectl get ds
NAME      DESIRED   CURRENT   READY     UP-TO-DATE   AVAILABLE   NODE SELECTOR   AGE
consul    1         1         1         1            1           <none>          1m
~~~

- Following services are created by the helm chart. 

~~~
$ kubectl get svc | grep consul-
consul-dns        ClusterIP   10.110.20.102    <none>        53/TCP,53/UDP                                                             1m
consul-server     ClusterIP   None             <none>        8500/TCP,8301/TCP,8301/UDP,8302/TCP,8302/UDP,8300/TCP,8600/TCP,8600/UDP   1m
consul-ui         ClusterIP   10.102.196.141   <none>        80/TCP                                                                    1m                                                          7m
~~~

- Check the members of consul. 

~~~
$ kubectl exec -it consul-hjqbs consul members
Node             Address           Status  Type    Build  Protocol  DC   Segment
consul-server-0  172.17.0.12:8301  alive   server  1.2.2  2         dc1  <all>
consul-server-1  172.17.0.11:8301  alive   server  1.2.2  2         dc1  <all>
consul-server-2  172.17.0.13:8301  alive   server  1.2.2  2         dc1  <all>
consul-hjqbs     172.17.0.10:8301  alive   client  1.2.2  2         dc1  <default>
~~~

- To access the UI of consul from my laptop hence I modified the consul-ui service from clusterIP to NodePort. 

~~~
$ kubectl edit svc consul-ui
error: there was a problem with the editor "vi"

$ kubectl describe svc consul-ui
Name:                     consul-ui
Namespace:                default
Labels:                   app=consul
                          chart=consul-0.1.0
                          heritage=Tiller
                          release=consul
Annotations:              <none>
Selector:                 app=consul,component=server,release=consul
Type:                     NodePort
IP:                       10.102.196.141
Port:                     http  80/TCP
TargetPort:               8500/TCP
NodePort:                 http  32709/TCP
Endpoints:                172.17.0.11:8500,172.17.0.12:8500,172.17.0.13:8500
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
~~~

- Added the following section in values.yaml file to sync the kubernetes service to consul and vice-versa.

~~~
+syncCatalog:
+  enabled: true
+
 ui:
   # True if you want to enable the Consul UI. The UI will run only
   # on the server nodes. This makes UI access via the service below (if
~~~

- Upgrade the existing deployment. It started showing me the new consul client agent part of the cluster. No major change I see in the following output.

~~~
$ helm upgrade consul .
Release "consul" has been upgraded. Happy Helming!
LAST DEPLOYED: Sat Oct  6 15:21:20 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/ConfigMap
NAME                  DATA  AGE
consul-client-config  1     6m
consul-server-config  1     6m

==> v1/Service
NAME           TYPE       CLUSTER-IP      EXTERNAL-IP  PORT(S)                                                                  AGE
consul-dns     ClusterIP  10.110.20.102   <none>       53/TCP,53/UDP                                                            6m
consul-server  ClusterIP  None            <none>       8500/TCP,8301/TCP,8301/UDP,8302/TCP,8302/UDP,8300/TCP,8600/TCP,8600/UDP  6m
consul-ui      NodePort   10.102.196.141  <none>       80:32709/TCP                                                             6m

==> v1/DaemonSet
NAME    DESIRED  CURRENT  READY  UP-TO-DATE  AVAILABLE  NODE SELECTOR  AGE
consul  1        1        1      1           1          <none>         6m

==> v1/StatefulSet
NAME           DESIRED  CURRENT  AGE
consul-server  3        3        6m

==> v1beta1/PodDisruptionBudget
NAME           MIN AVAILABLE  MAX UNAVAILABLE  ALLOWED DISRUPTIONS  AGE
consul-server  N/A            0                0                    6m

==> v1/Pod(related)
NAME             READY  STATUS   RESTARTS  AGE
consul-hjqbs     1/1    Running  0         6m
consul-server-0  1/1    Running  0         6m
consul-server-1  1/1    Running  0         6m
consul-server-2  1/1    Running  0         6m
~~~
