---
layout: post
title: Kubernetes POD reachability from another POD
tags: kubernetes
category: Kubernetes
author: vikrant
comments: true
---

In previous article, we have created POD and service. 

Service was created with IP address "10.106.133.16" and it was exposing PORT 31001 for with-in kubernetes access and NODEPORT 31382 for access outside K8. 

Now let's try to access the service from another POD. This time used busybox container and spawned it directly using run instead of using any yaml. 

- First I tried to access the service using SERVICEIP:PORT. Note: I am using the PORT which is internally exposed, you would not be able to access the service using NODEPORT from another container. 

~~~
$ kubectl run -i --tty busybox --image=busybox --restart=Never -- sh

/ # telnet 10.106.133.16 31001
GET /

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 12
ETag: W/"c-7Qdih1MuhjZehB6Sv8UNjA"
Date: Sun, 08 Jul 2018 05:09:32 GMT
Connection: close

Hello World!Connection closed by foreign host

/ # telnet helloworld-service 31382
GET /
telnet: can't connect to remote host (10.106.133.16): Network is unreachable
~~~

- Even though accessing the POD using service is right approach, I thought of accessing the POD directly from another POD using original port of the service i.e 3000. 

~~~
/ # telnet 172.17.0.6 3000
GET /

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 12
ETag: W/"c-7Qdih1MuhjZehB6Sv8UNjA"
Date: Sun, 08 Jul 2018 05:09:56 GMT
Connection: close

Hello World!Connection closed by foreign host
~~~

- To check the functionality of DNS working. Let's try to access the service using the service name instead of the service IP address and it's working fine. 

~~~
/ # nslookup helloworld-service
Server:    10.96.0.10
Address 1: 10.96.0.10 kube-dns.kube-system.svc.cluster.local

Name:      helloworld-service
Address 1: 10.106.133.16 helloworld-service.default.svc.cluster.local

/ # telnet helloworld-service 31001
GET /

HTTP/1.1 200 OK
X-Powered-By: Express
Content-Type: text/html; charset=utf-8
Content-Length: 12
ETag: W/"c-7Qdih1MuhjZehB6Sv8UNjA"
Date: Sun, 08 Jul 2018 05:23:05 GMT
Connection: close

Hello World!Connection closed by foreign host
~~~

- You may remember about the kube-dns service which was running in kube-system namespace that service is responsible for providing the DNS service. 

~~~
/ # cat /etc/resolv.conf
nameserver 10.96.0.10
search default.svc.cluster.local svc.cluster.local cluster.local
options ndots:5

$ kubectl describe svc kube-dns --namespace kube-system
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



