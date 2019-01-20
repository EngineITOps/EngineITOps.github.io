---
layout: post
title: How to use consul DNS in kubernetes
tags: [consul, kubernetes]
category: [consul, kubernetes]
author: vikrant
comments: true
--- 

In the previous article, we have seen the installation of consul on Kubernetes using helm chart. In this article, I am going to do the modification in coredns of minikube setup to add the stub zone so that DNS queries related to consul can go to consul DNS. 

Step 1 : Since consul images doesn't provide the dns troubleshooting tools like dig hence I started another POD using the image which provides the DNS troubleshooting commands. 

~~~
$ kubectl run -it --rm --image anubhavmishra/tiny-tools dnstools
~~~

Step 2 : Running the dig against headless consul server service. This is fetching the DNS information from coredns. 

~~~
/ # dig consul-server.default.svc.cluster.local

; <<>> DiG 9.11.2-P1 <<>> consul-server.default.svc.cluster.local
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 64452
;; flags: qr rd ra; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 1

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
; COOKIE: 9e25372df1e5f9e3 (echoed)
;; QUESTION SECTION:
;consul-server.default.svc.cluster.local. IN A

;; ANSWER SECTION:
consul-server.default.svc.cluster.local. 1 IN A	172.17.0.11
consul-server.default.svc.cluster.local. 1 IN A	172.17.0.12
consul-server.default.svc.cluster.local. 1 IN A	172.17.0.13

;; Query time: 12 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Sat Oct 06 10:00:58 UTC 2018
;; MSG SIZE  rcvd: 245
~~~

Step 3 : Running the same query to get the list of consul server against consul DNS. 

~~~
/ # dig @consul-server.default.svc.cluster.local -p 8600 consul.service.consul

; <<>> DiG 9.11.2-P1 <<>> @consul-server.default.svc.cluster.local -p 8600 consul.service.consul
; (3 servers found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10721
;; flags: qr aa rd; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 4
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;consul.service.consul.		IN	A

;; ANSWER SECTION:
consul.service.consul.	0	IN	A	172.17.0.13
consul.service.consul.	0	IN	A	172.17.0.11
consul.service.consul.	0	IN	A	172.17.0.12

;; ADDITIONAL SECTION:
consul.service.consul.	0	IN	TXT	"consul-network-segment="
consul.service.consul.	0	IN	TXT	"consul-network-segment="
consul.service.consul.	0	IN	TXT	"consul-network-segment="

;; Query time: 10 msec
;; SERVER: 172.17.0.11#8600(172.17.0.11)
;; WHEN: Sat Oct 06 10:03:16 UTC 2018
;; MSG SIZE  rcvd: 206
~~~

Step 4 : To make the dig query work against consul.service.consul without specifying the consul DNS in dig command, we need to add the stub zone information in core-dns config map. 

a) Get the ip address of consul DNS.

~~~
kubectl get svc | grep consul-dns
consul-dns        ClusterIP   10.110.20.102    <none>        53/TCP,53/UDP                                                             23m
~~~

b) Edit the coredns file to add the consul-dns information. 
	
~~~
$ kubectl edit cm coredns -n kube-system
# Please edit the object below. Lines beginning with a '#' will be ignored,
# and an empty file will abort the edit. If an error occurs while saving this file will be
# reopened with the relevant failures.
#
apiVersion: v1
data:
  Corefile: |
    .:53 {
        errors
        log
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
            pods insecure
            upstream
            fallthrough in-addr.arpa ip6.arpa
        }
        prometheus :9153
        proxy . /etc/resolv.conf
        cache 30
        reload
    }
    consul:53 {
        errors
        cache 30
        proxy . 10.110.20.102
    }
kind: ConfigMap
metadata:
  creationTimestamp: 2018-10-05T13:58:46Z
  labels:
    addonmanager.kubernetes.io/mode: EnsureExists
  name: coredns
  namespace: kube-system
  resourceVersion: "13756"
  selfLink: /api/v1/namespaces/kube-system/configmaps/coredns
  uid: c6e21a33-c8a6-11e8-a94c-080027064203
~~~

Save after making the changes. 

c) Create new POD using tiny-tools image so that it can reflect the stub zone settings. Bingo!! Now we are able to perform the DNS query for consul services without specifying the DNS server in dig command.

~~~
kubectl run -it --rm --image anubhavmishra/tiny-tools dnstools10
If you don't see a command prompt, try pressing enter.
/ # dig consul.service.consul

; <<>> DiG 9.11.2-P1 <<>> consul.service.consul
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 13449
;; flags: qr aa rd; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 4
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;consul.service.consul.		IN	A

;; ANSWER SECTION:
consul.service.consul.	0	IN	A	172.17.0.13
consul.service.consul.	0	IN	A	172.17.0.12
consul.service.consul.	0	IN	A	172.17.0.11

;; ADDITIONAL SECTION:
consul.service.consul.	0	IN	TXT	"consul-network-segment="
consul.service.consul.	0	IN	TXT	"consul-network-segment="
consul.service.consul.	0	IN	TXT	"consul-network-segment="

;; Query time: 19 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Sat Oct 06 10:16:07 UTC 2018
;; MSG SIZE  rcvd: 332
~~~

