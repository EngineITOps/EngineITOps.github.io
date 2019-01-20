---
layout: post
title: Kubernetes service iptables magic
tags: [kubernetes, service]
category: [Kubernetes]
author: vikrant
comments: true
---

In the previous article, we have seen some default POD and services which are started by default. In this article, I am going to spin up a POD and check the stuff related to POD. 

- Started a simple POD using yaml definition. 

~~~
$ kubectl get pod -o wide
NAME                         READY     STATUS    RESTARTS   AGE       IP           NODE
nodehelloworld.example.com   1/1       Running   0          4m        172.17.0.6   minikube
~~~

Before and after starting the POD I have taken the output of iptables in file for comparison purpose to see what changes are coming in iptables. 

~~~
# iptables -t nat -L > /tmp/before_starting_pod.txt
# iptables -t nat -L > /tmp/after_starting_pod.txt
~~~

Note: you can use the kubectl from your laptop but for issuing OS specific commands you need to login into the minikube. We don't see any difference in the output of iptables. 

~~~
# diff /tmp/before_starting_pod.txt /tmp/after_starting_pod.txt
#
~~~

- We can reach the POD from the minikube but not from the outside world.

~~~
# ping 172.17.0.6
PING 172.17.0.6 (172.17.0.6): 56 data bytes
64 bytes from 172.17.0.6: seq=0 ttl=64 time=0.085 ms
^C
--- 172.17.0.6 ping statistics ---
1 packets transmitted, 1 packets received, 0% packet loss
round-trip min/avg/max = 0.085/0.085/0.085 ms
~~~

This IP address to POD is assigned from docker0

~~~
# ip a show dev docker0
5: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:fc:84:ae:28 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 brd 172.17.255.255 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:fcff:fe84:ae28/64 scope link
       valid_lft forever preferred_lft forever
~~~

- Since we want to reach this POD from outside world, we need to do some sort of port mapping. In this case POD is exposing the Port 3000. But this is not the right way.

~~~
$ kubectl describe pod nodehelloworld.example.com  | grep Port
    Port:           3000/TCP

$ kubectl port-forward nodehelloworld.example.com 32000:3000
Forwarding from 127.0.0.1:32000 -> 3000
Handling connection for 32000
Handling connection for 32000    
~~~    

- Using service is the right approach to provide external access the POD. If you see the service is creating two kind of ports 

1) Port          - If we need to access the service from within the kubernetes cluster. (10.106.133.16/31001)
2) Targetport    - To access the service from external world.  (10.106.133.16:31382)

~~~
$ kubectl create -f helloworld-nodeport-service.yml

$ kubectl get svc -o wide
NAME                 TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)           AGE       SELECTOR
helloworld-service   NodePort    10.106.133.16   <none>        31001:31382/TCP   28s       app=helloworld
kubernetes           ClusterIP   10.96.0.1       <none>        443/TCP           15h       <none>

$ kubectl describe svc helloworld-service
Name:                     helloworld-service
Namespace:                default
Labels:                   <none>
Annotations:              <none>
Selector:                 app=helloworld
Type:                     NodePort
IP:                       10.106.133.16
Port:                     <unset>  31001/TCP
TargetPort:               nodejs-port/TCP
NodePort:                 <unset>  31382/TCP
Endpoints:                172.17.0.6:3000
Session Affinity:         None
External Traffic Policy:  Cluster
Events:                   <none>
~~~

- After starting the service, taken the iptables output. 

~~~
# iptables -t nat -L > /tmp/after_starting_service.txt
~~~

Compare this output with existing captured iptables output.

~~~
# diff /tmp/before_starting_pod.txt /tmp/after_starting_service.txt  | grep '+'
+++ /tmp/after_starting_service.txt
@@ -30,21 +30,28 @@
+Chain KUBE-MARK-MASQ (9 references)
+KUBE-MARK-MASQ  tcp  --  anywhere             anywhere             /* default/helloworld-service: */ tcp dpt:31382
+KUBE-SVC-YLBSDKPE6MPDDRVY  tcp  --  anywhere             anywhere             /* default/helloworld-service: */ tcp dpt:31382
+KUBE-MARK-MASQ  tcp  --  anywhere             anywhere             /* kube-system/kubernetes-dashboard: */ tcp dpt:30000
+KUBE-SVC-XGLOHA7QRQ3V22RZ  tcp  --  anywhere             anywhere             /* kube-system/kubernetes-dashboard: */ tcp dpt:30000
+Chain KUBE-SEP-32ZXKBHCWGUC5KVE (1 references)
+target     prot opt source               destination
+KUBE-MARK-MASQ  all  --  172.17.0.6           anywhere             /* default/helloworld-service: */
+DNAT       tcp  --  anywhere             anywhere             /* default/helloworld-service: */ tcp to:172.17.0.6:3000
+
@@ -72,11 +79,12 @@
+KUBE-SVC-YLBSDKPE6MPDDRVY  tcp  --  anywhere             10.106.133.16        /* default/helloworld-service: cluster IP */ tcp dpt:31001
+KUBE-SVC-XGLOHA7QRQ3V22RZ  tcp  --  anywhere             10.96.72.101         /* kube-system/kubernetes-dashboard: cluster IP */ tcp dpt:www
@@ -99,3 +107,7 @@
+
+Chain KUBE-SVC-YLBSDKPE6MPDDRVY (2 references)
+target     prot opt source               destination
+KUBE-SEP-32ZXKBHCWGUC5KVE  all  --  anywhere             anywhere             /* default/helloworld-service: */
~~~

Let's start digging up these chains in an organized manner. KUBE-SERVICES is a chain in which kubernetes service related rules are getting inserted. Since our service is exposing 31001 for internal access within cluster and NODEPORT for providing external access hence we will be looking into it "KUBE-SVC-YLBSDKPE6MPDDRVY" and "KUBE-NODEPORTS" respectively. 

~~~
# iptables -t nat -L KUBE-SERVICES
Chain KUBE-SERVICES (2 references)
target     prot opt source               destination
KUBE-SVC-TCOU7JCQXEZGVUNU  udp  --  anywhere             10.96.0.10           /* kube-system/kube-dns:dns cluster IP */ udp dpt:domain
KUBE-SVC-ERIFXISQEP7F7OF4  tcp  --  anywhere             10.96.0.10           /* kube-system/kube-dns:dns-tcp cluster IP */ tcp dpt:domain
KUBE-SVC-YLBSDKPE6MPDDRVY  tcp  --  anywhere             10.106.133.16        /* default/helloworld-service: cluster IP */ tcp dpt:31001
KUBE-SVC-XGLOHA7QRQ3V22RZ  tcp  --  anywhere             10.96.72.101         /* kube-system/kubernetes-dashboard: cluster IP */ tcp dpt:www
KUBE-SVC-2QFLXPI3464HMUTA  tcp  --  anywhere             10.96.215.164        /* kube-system/default-http-backend: cluster IP */ tcp dpt:www
KUBE-SVC-NPX46M4PTMTKRN6Y  tcp  --  anywhere             10.96.0.1            /* default/kubernetes:https cluster IP */ tcp dpt:https
KUBE-NODEPORTS  all  --  anywhere             anywhere             /* kubernetes service nodeports; NOTE: this must be the last rule in this chain */ ADDRTYPE match dst-type LOCAL
~~~

First chain "KUBE-SVC-YLBSDKPE6MPDDRVY" is redirecting the traffic to another chain "KUBE-SEP-32ZXKBHCWGUC5KVE". In second chain, SNAT and DNAT rules is present to redirect the traffic TO and FROM the pod. 

~~~
# iptables -t nat -L KUBE-SVC-YLBSDKPE6MPDDRVY
Chain KUBE-SVC-YLBSDKPE6MPDDRVY (2 references)
target     prot opt source               destination
KUBE-SEP-32ZXKBHCWGUC5KVE  all  --  anywhere             anywhere             /* default/helloworld-service: */

# iptables -t nat -L KUBE-SEP-32ZXKBHCWGUC5KVE
Chain KUBE-SEP-32ZXKBHCWGUC5KVE (1 references)
target     prot opt source               destination
KUBE-MARK-MASQ  all  --  172.17.0.6           anywhere             /* default/helloworld-service: */
DNAT       tcp  --  anywhere             anywhere             /* default/helloworld-service: */ tcp to:172.17.0.6:3000
~~~

Lets check the KUBE-NODEPORTS now which is reponsible for redirecting the traffic from external world to POD. Last and second-to-last rule in this chain showing the port 31382 which is exposed by our service. 

~~~
# iptables -t nat -L KUBE-NODEPORTS
Chain KUBE-NODEPORTS (1 references)
target     prot opt source               destination
KUBE-MARK-MASQ  tcp  --  anywhere             anywhere             /* kube-system/kubernetes-dashboard: */ tcp dpt:30000
KUBE-SVC-XGLOHA7QRQ3V22RZ  tcp  --  anywhere             anywhere             /* kube-system/kubernetes-dashboard: */ tcp dpt:30000
KUBE-MARK-MASQ  tcp  --  anywhere             anywhere             /* kube-system/default-http-backend: */ tcp dpt:30001
KUBE-SVC-2QFLXPI3464HMUTA  tcp  --  anywhere             anywhere             /* kube-system/default-http-backend: */ tcp dpt:30001
KUBE-MARK-MASQ  tcp  --  anywhere             anywhere             /* default/helloworld-service: */ tcp dpt:31382
KUBE-SVC-YLBSDKPE6MPDDRVY  tcp  --  anywhere             anywhere             /* default/helloworld-service: */ tcp dpt:31382
~~~

Check the rules present in KUBE-SVC-YLBSDKPE6MPDDRVY, and it's pointing to another chain which is the same chain which we checked while seeing the traffic within K8 setup. 

~~~
# iptables -t nat -L KUBE-MARK-MASQ
Chain KUBE-MARK-MASQ (9 references)
target     prot opt source               destination
MARK       all  --  anywhere             anywhere             MARK or 0x4000

# iptables -t nat -L KUBE-SVC-YLBSDKPE6MPDDRVY
Chain KUBE-SVC-YLBSDKPE6MPDDRVY (2 references)
target     prot opt source               destination
KUBE-SEP-32ZXKBHCWGUC5KVE  all  --  anywhere             anywhere             /* default/helloworld-service: */
~~~