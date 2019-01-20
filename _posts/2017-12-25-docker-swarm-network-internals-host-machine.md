---
layout: post
title: How to access the docker 
tags: [swarm]
category: [swarm]
author: vikrant
comments: true
--- 

In the previous [article](https://ervikrant06.github.io/docker-swarm-network-internals/), we have seen a way to access the vote application using client container, in this article we will be accessing the same application using the host machine IP address. 

When we are running a application using host mode then container port is getting exposed to host machine, irrespective of on which node container is running, iptable rule for host to container port mapping is added on all the nodes present in cluster. All is referring the general situation in which manager nodes also acts like worker nodes.

Step 1 : Let's check what iptable rule is added corresponding to service creation. 

Remember the command which we have used for service creation. 

~~~
docker@manager1:~$ docker service create --mode replicated --replicas 2 --name vote --network overlay1 --publish mode=ingress,target=80,published=8080 instavote/vote
~~~

Corresponding to above command, two containers were spinned, one of manager1 and other one on worker1 node. iptable rule is inserted on all the nodes present in cluster. 

~~~
docker@manager1:~$ sudo iptables -t nat -L | grep 8080
DNAT       tcp  --  anywhere             anywhere             tcp dpt:webcache to:172.18.0.2:8080

root@worker1:~# iptables -t nat -L | grep 8080
DNAT       tcp  --  anywhere             anywhere             tcp dpt:webcache to:172.18.0.2:8080

root@worker2:~# iptables -t nat -L | grep 8080
DNAT       tcp  --  anywhere             anywhere             tcp dpt:webcache to:172.18.0.2:8080
~~~

Step 2 : Let's start a container using `ingress_sbox` namespace. 

~~~
docker@manager1:~$ docker run -it --rm -v /var/run/docker/netns:/var/run/docker/netns --privileged=true nicolaka/netshoot
/ # nsenter --net=/var/run/docker/netns/ingress_sbox sh
/ # ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
9: eth0@if10: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UP group default
    link/ether 02:42:0a:ff:00:02 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.255.0.2/16 scope global eth0
       valid_lft forever preferred_lft forever
12: eth1@if13: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:12:00:02 brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet 172.18.0.2/16 scope global eth1
       valid_lft forever preferred_lft forever
~~~
	   
Checking the iptable and mangle rules shows that any traffic which is meant for "10.255.0.4" is getting marked with "0x102" again which when converted to decimal gives 258. ipvs redirects the traffic to container on ip addresses from ingress network. 

~~~	   
/ # iptables -t nat -L
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination

Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
DOCKER_OUTPUT  all  --  anywhere             127.0.0.11
DNAT       icmp --  anywhere             10.255.0.4           icmp echo-request to:127.0.0.1

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination
DOCKER_POSTROUTING  all  --  anywhere             127.0.0.11
SNAT       all  --  anywhere             10.255.0.0/16        ipvs to:10.255.0.2

Chain DOCKER_OUTPUT (1 references)
target     prot opt source               destination
DNAT       tcp  --  anywhere             127.0.0.11           tcp dpt:domain to:127.0.0.11:42792
DNAT       udp  --  anywhere             127.0.0.11           udp dpt:domain to:127.0.0.11:40831

Chain DOCKER_POSTROUTING (1 references)
target     prot opt source               destination
SNAT       tcp  --  127.0.0.11           anywhere             tcp spt:42792 to::53
SNAT       udp  --  127.0.0.11           anywhere             udp spt:40831 to::53
	   
	   
/ # iptables -t mangle -L
Chain PREROUTING (policy ACCEPT)
target     prot opt source               destination
MARK       tcp  --  anywhere             anywhere             tcp dpt:http-alt MARK set 0x102

Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
MARK       all  --  anywhere             10.255.0.4           MARK set 0x102

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination

/ # ipvsadm
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
FWM  258 rr
  -> 10.255.0.5:0                 Masq    1      0          0
  -> 10.255.0.6:0                 Masq    1      0          0	   
~~~

Step 3 : We can take the tcpdump on interface of vote application container to prove the same while performing curl from host machine.

~~~
docker@worker1:~$ curl localhost:8080

docker@manager1:~$ docker run -it --net container:1c06334e3589 nicolaka/netshoot
/ # tcpdump -s0 -i eth0
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
08:50:25.616481 IP 10.255.0.3.56472 > 10.255.0.6.8080: Flags [S], seq 3646612060, win 43690, options [mss 65495,sackOK,TS val 3733770 ecr 0,nop,wscale 7], length 0
08:50:25.616528 ARP, Request who-has 10.255.0.3 tell 10.255.0.6, length 28
08:50:25.616543 ARP, Reply 10.255.0.3 is-at 02:42:0a:ff:00:03 (oui Unknown), length 28
08:50:25.616546 IP 10.255.0.6.8080 > 10.255.0.3.56472: Flags [S.], seq 3177214998, ack 3646612061, win 27960, options [mss 1410,sackOK,TS val 3745357 ecr 3733770,nop,wscale 7], length 0
08:50:25.617022 IP 10.255.0.3.56472 > 10.255.0.6.8080: Flags [.], ack 1, win 342, options [nop,nop,TS val 3733770 ecr 3745357], length 0
08:50:25.617338 IP 10.255.0.3.56472 > 10.255.0.6.8080: Flags [P.], seq 1:79, ack 1, win 342, options [nop,nop,TS val 3733770 ecr 3745357], length 78: HTTP: GET / HTTP/1.1
08:50:25.617354 IP 10.255.0.6.8080 > 10.255.0.3.56472: Flags [.], ack 79, win 219, options [nop,nop,TS val 3745357 ecr 3733770], length 0
~~~