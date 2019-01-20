---
layout: post
title: How to run DNS queries into the multi datacenter setup using consul?
tags: [consul]
category: [consul]
author: vikrant
comments: true
--- 

In the previous article we have configured the multi DC setup. In this article, we will see how we can perform the DNS queries to get the necessary information and also to check the failover functionality. 

- Before jumping into the DNS directly - you can use the following command to check the RTT between sites, I have issued the command from consullab1server1 for consul client present in lab2setup DC.

~~~
/ # consul rtt --http-addr=192.168.99.101:8500 -wan consulclient1.lab2setup
Estimated consulclient1.lab2setup <-> consulserver1.lab1setup rtt: 0.862 ms (using WAN coordinates)
~~~

- if we need to perform the DNS lookup in lab1setup DC then we can simply use the service name and it's returning A record for the service. 

~~~
dig @192.168.99.101 -p 8600 web.service.consul

; <<>> DiG 9.10.6 <<>> @192.168.99.101 -p 8600 web.service.consul
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 37896
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 2
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;web.service.consul.		IN	A

;; ANSWER SECTION:
web.service.consul.	0	IN	A	192.168.99.104

;; ADDITIONAL SECTION:
web.service.consul.	0	IN	TXT	"consul-network-segment="

;; Query time: 85 msec
;; SERVER: 192.168.99.101#8600(192.168.99.101)
;; WHEN: Mon Sep 10 15:29:34 IST 2018
;; MSG SIZE  rcvd: 99
~~~

- Using the ip address of `consulserver1` only we can perform a DNS lookup on service running in another DC i.e lab2setup. Note: In this case we are providing the DC name in service URL. 

~~~
dig @192.168.99.101 -p 8600 web.service.lab2setup.consul

; <<>> DiG 9.10.6 <<>> @192.168.99.101 -p 8600 web0.service.lab2setup.consul
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 15371
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 2
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;web.service.lab2setup.consul.	IN	A

;; ANSWER SECTION:
web.service.lab2setup.consul. 0 IN	A	192.168.99.103

;; ADDITIONAL SECTION:
web.service.lab2setup.consul. 0 IN	TXT	"consul-network-segment="

;; Query time: 83 msec
;; SERVER: 192.168.99.101#8600(192.168.99.101)
;; WHEN: Mon Sep 10 15:31:32 IST 2018
;; MSG SIZE  rcvd: 110
~~~

We are getting same result in above query which we got while performing DNS lookup for service running in lab2setup directly using lab2setup IP.  

~~~
dig @192.168.99.102 -p 8600 web.service.consul

; <<>> DiG 9.10.6 <<>> @192.168.99.102 -p 8600 web.service.consul
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 19979
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 2
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;web.service.consul.		IN	A

;; ANSWER SECTION:
web.service.consul.	0	IN	A	192.168.99.103

;; ADDITIONAL SECTION:
web.service.consul.	0	IN	TXT	"consul-network-segment="

;; Query time: 175 msec
;; SERVER: 192.168.99.102#8600(192.168.99.102)
;; WHEN: Mon Sep 10 15:34:05 IST 2018
;; MSG SIZE  rcvd: 99
~~~

- To test the failover of service across DCs we need to perform the following query to add the lab2setup as a failover DC into the lab1setup DC. 

~~~
curl -XPOST http://192.168.99.101:8500/v1/query -d '
{
        "Name": "failover",
        "Service": {
          "Service": "web",
          "Failover": {
            "Datacenters": ["lab2setup"]
          }
        }
}'
{"ID":"17f46740-4b28-4f8d-41a3-4846c7f6babd"}
~~~

- After that DNS query should be performed using "failover" keyword which we have used as the value for key "Name" in previous command. Following query is performed using lab1setup consul server DNS address and it's returning the service present only in that DC. 

~~~
dig @192.168.99.101 -p 8600 failover.query.consul

; <<>> DiG 9.10.6 <<>> @192.168.99.101 -p 8600 failover.query.consul
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 31067
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 2
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;failover.query.consul.		IN	A

;; ANSWER SECTION:
failover.query.consul.	0	IN	A	192.168.99.104

;; ADDITIONAL SECTION:
failover.query.consul.	0	IN	TXT	"consul-network-segment="

;; Query time: 127 msec
;; SERVER: 192.168.99.101#8600(192.168.99.101)
;; WHEN: Mon Sep 10 15:48:03 IST 2018
;; MSG SIZE  rcvd: 102
~~~

- Let's stop the nginx service present in lab1setup DC. 

~~~
docker@consulhaproxy1:~$ docker stop 00735cf3d093
00735cf3d093
~~~

- Perform another DNS query this time it as returned the service which is present in failover lab2setup DC. 

~~~
dig @192.168.99.101 -p 8600 failover.query.consul

; <<>> DiG 9.10.6 <<>> @192.168.99.101 -p 8600 failover.query.consul
; (1 server found)
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 24817
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 2
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;failover.query.consul.		IN	A

;; ANSWER SECTION:
failover.query.consul.	0	IN	A	192.168.99.103

;; ADDITIONAL SECTION:
failover.query.consul.	0	IN	TXT	"consul-network-segment="

;; Query time: 107 msec
;; SERVER: 192.168.99.101#8600(192.168.99.101)
;; WHEN: Mon Sep 10 15:49:42 IST 2018
;; MSG SIZE  rcvd: 102
~~~