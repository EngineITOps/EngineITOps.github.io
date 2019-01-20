---
layout: post
title: Kubernetes Cluster related Tips
tags: [Kubernetes]
category: [Kubernetes]
author: vikrant
comments: true
--- 

Recently I deployed the multinode K8 setup using kops on my Mac with vagran and virtual box as a driver. It was very easy to complete this setup I only issued one command. 

#### Setup information. 

- Two master nodes.
- Three worker nodes (Including two master which are also worker nodes).

List all the nodes and the roles assigned on the nodes after the installation. 

~~~
$ kubectl get node
NAME      STATUS    ROLES         AGE       VERSION
k8s-01    Ready     master,node   18h       v1.10.4
k8s-02    Ready     master,node   18h       v1.10.4
k8s-03    Ready     node          18h       v1.10.4
~~~

#### Make the node unschedulable.

###### Cordon

- It's very common to take the node out of the cluster to verify some issues with it. I am from openstack background for me it's like disable the scheduling of new instances on compute node until we fix the issue with that compute node but the running instances will keep on running on it. 

~~~
$ kubectl cordon k8s-03
node "k8s-03" cordoned

$ kubectl get node
NAME      STATUS                     ROLES         AGE       VERSION
k8s-01    Ready                      master,node   18h       v1.10.4
k8s-02    Ready                      master,node   18h       v1.10.4
k8s-03    Ready,SchedulingDisabled   node          18h       v1.10.4
~~~

- Once you fixed the issue then enable the scheduling again on node and verify that it's re-enabled. 

~~~
$ kubectl uncordon k8s-03
node "k8s-03" uncordoned

$ kubectl get node
NAME      STATUS    ROLES         AGE       VERSION
k8s-01    Ready     master,node   18h       v1.10.4
k8s-02    Ready     master,node   18h       v1.10.4
k8s-03    Ready     node          18h       v1.10.4
~~~

###### Drain

- If you want to perform the reboot of worker node on which PODs are running then you should first move these PODs to other nodes before initiating the reboot. 

~~~
$ kubectl drain k8s-03
$ kubectl get node
NAME      STATUS                     ROLES         AGE       VERSION
k8s-01    Ready                      master,node   19h       v1.10.4
k8s-02    Ready                      master,node   19h       v1.10.4
k8s-03    Ready,SchedulingDisabled   node          19h       v1.10.4
~~~

#### POD and Node Affinity

- If you want a POD to particular node or only one node from the particular set then use K8 wonderful feature labels. Check the labels present on node after the default installation. All the nodes have same labels except only worker node which is missing this `master=true` label. 

~~~
$ kubectl get nodes --show-labels
NAME      STATUS    ROLES         AGE       VERSION   LABELS
k8s-01    Ready     master,node   18h       v1.10.4   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=k8s-01,node-role.kubernetes.io/master=true,node-role.kubernetes.io/node=true
k8s-02    Ready     master,node   18h       v1.10.4   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=k8s-02,node-role.kubernetes.io/master=true,node-role.kubernetes.io/node=true
k8s-03    Ready     node          18h       v1.10.4   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=k8s-03,node-role.kubernetes.io/node=true
~~~

- Add a new label on worker node. Assuming that this node contains the disk of ssd types and verify that label is added successfully on `k8s-03` node. 
 
~~~
$ kubectl label nodes k8s-03 disktype=ssd
node "k8s-03" labeled

$ kubectl get nodes --show-labels
NAME      STATUS    ROLES         AGE       VERSION   LABELS
k8s-01    Ready     master,node   18h       v1.10.4   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=k8s-01,node-role.kubernetes.io/master=true,node-role.kubernetes.io/node=true
k8s-02    Ready     master,node   18h       v1.10.4   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,kubernetes.io/hostname=k8s-02,node-role.kubernetes.io/master=true,node-role.kubernetes.io/node=true
k8s-03    Ready     node          18h       v1.10.4   beta.kubernetes.io/arch=amd64,beta.kubernetes.io/os=linux,disktype=ssd,kubernetes.io/hostname=k8s-03,node-role.kubernetes.io/node=true
~~~

- Create a replicaset with `disktype=ssd` selector so that it will get spawn on `k8s-03`.

- Great it's spawned on desired node. 

~~~
$ kubectl get pod -o wide
NAME          READY     STATUS    RESTARTS   AGE       IP            NODE
nginx-rvsct   1/1       Running   0          11h       10.233.65.9   k8s-03
~~~

#### Combining Node Affinity + Drain ;)

- Now in this case only node k8s-03 is having the label assigned to it. Try to drain this node and you will the see the following message: 

~~~
$ kubectl drain k8s-03
node "k8s-03" cordoned
error: unable to drain node "k8s-03", aborting command...

There are pending nodes to be drained:
 k8s-03
error: pods not managed by ReplicationController, ReplicaSet, Job, DaemonSet or StatefulSet (use --force to override): kube-proxy-k8s-03, nginx-proxy-k8s-03; DaemonSet-managed pods (use --ignore-daemonsets to ignore): kube-flannel-9xpsz
~~~

- I followed the instruction of adding the the "--force" flag in the command. 

~~~
$ kubectl drain k8s-03 --force
node "k8s-03" already cordoned
error: unable to drain node "k8s-03", aborting command...

There are pending nodes to be drained:
 k8s-03
error: DaemonSet-managed pods (use --ignore-daemonsets to ignore): kube-flannel-9xpsz
~~~

Okay so it's failing because of daemon set. Add that flag also. 


~~~
$ kubectl drain k8s-03 --force --ignore-daemonsets
node "k8s-03" already cordoned
WARNING: Ignoring DaemonSet-managed pods: kube-flannel-9xpsz; Deleting pods not managed by ReplicationController, ReplicaSet, Job, DaemonSet or StatefulSet: kube-proxy-k8s-03, nginx-proxy-k8s-03
pod "nginx-rvsct" evicted
pod "kube-dns-7bd4d5fbb6-4f8lv" evicted
pod "kube-dns-7bd4d5fbb6-7dv9b" evicted
node "k8s-03" drained
~~~

Check the status of node. It's similar to cordon. 

~~~
$ kubectl get node
NAME      STATUS                     ROLES         AGE       VERSION
k8s-01    Ready                      master,node   19h       v1.10.4
k8s-02    Ready                      master,node   19h       v1.10.4
k8s-03    Ready,SchedulingDisabled   node          19h       v1.10.4
~~~


POD is stuck in Pending state, any guess why? remember, we used node selector in POD definition, according to that node selector no other node is satisfying the crieteria of starting this POD hence it got stuck in this state. 

~~~
$ kubectl get pod
NAME          READY     STATUS    RESTARTS   AGE
nginx-cqnz6   0/1       Pending   0          11h
~~~

Same can be verified from k8 events. 

~~~
$ kubectl get events | head -4
LAST SEEN   FIRST SEEN   COUNT     NAME                           KIND                    SUBOBJECT                TYPE      REASON                  SOURCE                   MESSAGE
11h         12h          4         k8s-03.154594063fc2f6ea        Node                                             Normal    NodeNotSchedulable      kubelet, k8s-03          Node k8s-03 status is now: NodeNotSchedulable
11h         12h          3         k8s-03.1545940aead1ae66        Node                                             Normal    NodeSchedulable         kubelet, k8s-03          Node k8s-03 status is now: NodeSchedulable
11h         11h          26        nginx-cqnz6.154598cea28dc43b   Pod                                              Warning   FailedScheduling        default-scheduler        0/3 nodes are available: 1 node(s) were unschedulable, 2 node(s) didn't match node selector.
~~~

- Add the label which we added on k8s-03 also on k8s-02.

~~~
$ kubectl label nodes k8s-02 disktype=ssd
node "k8s-02" labeled
~~~

- As soon as you add the label, POD will get schedule on this node and start running. 

~~~
$ kubectl get pod -o wide
NAME          READY     STATUS    RESTARTS   AGE       IP            NODE
nginx-cqnz6   1/1       Running   0          11h       10.233.66.4   k8s-02
~~~

TIP : If you want to remove a label on node. 

~~~
$ kubectl label node k8s-02 disktype-
node "k8s-02" labeled
~~~