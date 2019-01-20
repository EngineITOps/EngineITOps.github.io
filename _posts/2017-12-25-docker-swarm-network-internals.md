---
layout: post
title: How to troubleshoot docker swarm networking issue
tags: [swarm]
category: [swarm]
author: vikrant
comments: true
--- 


Continuing the docker swarm series, in previous articles, I have discussed about the [docker swarm cluster creation](https://ervikrant06.github.io/docker-swarm-setup/) and some [basic networking of docker swarm](https://ervikrant06.github.io/docker-swarm-network/). In this article, we will dig more into the docker swarm network troubleshooting. This article is based on the awesome work done by Sreenivas (https://sreeninet.wordpress.com/2017/11/02/docker-networking-tip-troubleshooting/).

To show the network troubleshooting, I am going to start a vote application with replication count of 2 and a client container. 

Step 1 : Create overlay network which will be used to start the vote and client application.

~~~
docker@manager1:~$ docker network create -d overlay overlay1
~~~

Step 2 : Following commands are used for starting the vote and client service. I have used overlay1 network to start the services which I have created in previous step.

~~~
docker@manager1:~$ docker service create --replicas 1 --name client --network overlay1 smakam/myubuntu:v4 sleep infinity
mnaihkfak6kqpdvwmy4j95esg

docker@manager1:~$ docker service create --mode replicated --replicas 2 --name vote --network overlay1 --publish mode=ingress,target=80,published=8080 instavote/vote
2z5g8tn1ohnpnd82n41koqtvh
~~~

Step 3 : Verify that services are started succesfully. We can use the following commands to verify that on which node services are started. 

~~~
docker@manager1:~$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE                   PORTS
mnaihkfak6kq        client              replicated          1/1                 smakam/myubuntu:v4
2z5g8tn1ohnp        vote                replicated          0/2                 instavote/vote:latest   *:8080->80/tcp

docker@manager1:~$ docker service ps client
ID                  NAME                IMAGE                NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
nnieiubwgj30        client.1            smakam/myubuntu:v4   manager1            Running             Running 14 minutes ago

docker@manager1:~$ docker service ps vote
ID                  NAME                IMAGE                   NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
njrh2ofmap06        vote.1              instavote/vote:latest   worker1             Running             Running 13 minutes ago
ij6fmmcx71po        vote.2              instavote/vote:latest   manager1            Running             Running 13 minutes ago
~~~

Step 4 : Let's check the containers which are running on manager node. 

~~~
docker@manager1:~$ docker ps
CONTAINER ID        IMAGE                   COMMAND                  CREATED             STATUS              PORTS               NAMES
1c06334e3589        instavote/vote:latest   "gunicorn app:app ..."   5 hours ago         Up 5 hours          80/tcp              vote.2.ij6fmmcx71po5sjeessn9wl0j
d38975856cfd        smakam/myubuntu:v4      "sleep infinity"         5 hours ago         Up 5 hours                              client.1.nnieiubwgj30js73iwzxfleoe
~~~

Step 5 : Login into the each container to see the number of network interfaces present inside the container. Two containers (one client and one vote) are running on manager1 node and one container (vote) is running on worker1 node. 

Client container have two interfaces, eth0 interface from overlay1 and eth1 interface from docker_gwbridge network. Keep a note of the IP address (10.0.0.2/32) assigned on loopback interface of client container, this is a VIP.

~~~
docker@manager1:~$ docker exec -it d38975856cfd sh
# ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet 10.0.0.2/32 scope global lo
       valid_lft forever preferred_lft forever
23: eth0@if24: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UP group default
    link/ether 02:42:0a:00:00:03 brd ff:ff:ff:ff:ff:ff
    inet 10.0.0.3/24 scope global eth0
       valid_lft forever preferred_lft forever
25: eth1@if26: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:12:00:03 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.3/16 scope global eth1
       valid_lft forever preferred_lft forever
~~~

vote application container have three interfaces, eth0 interface with ingress network,eth1 interface from docker_gwbridge and eth2 interface from overlay network. Again make a note of the virtual IPs present on loopback interface. Two VIPs are present `10.255.0.4/32` and `10.0.0.4/32` on lo interface, one is from ingress network and other one from overlay network. 
	   
~~~
docker@manager1:~$ docker exec -it 1c06334e3589 sh
/app # ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet 10.255.0.4/32 scope global lo
       valid_lft forever preferred_lft forever
    inet 10.0.0.4/32 scope global lo
       valid_lft forever preferred_lft forever
27: eth0@if28: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1450 qdisc noqueue state UP
    link/ether 02:42:0a:ff:00:06 brd ff:ff:ff:ff:ff:ff
    inet 10.255.0.6/16 scope global eth0
       valid_lft forever preferred_lft forever
29: eth1@if30: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:12:00:04 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.4/16 scope global eth1
       valid_lft forever preferred_lft forever
31: eth2@if32: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1450 qdisc noqueue state UP
    link/ether 02:42:0a:00:00:06 brd ff:ff:ff:ff:ff:ff
    inet 10.0.0.6/24 scope global eth2
       valid_lft forever preferred_lft forever
	   
Similarly on worker1 node. 	   
	   
docker@worker1:~$ docker exec -it 3ab467754bf5 sh
/app # ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet 10.255.0.4/32 scope global lo
       valid_lft forever preferred_lft forever
    inet 10.0.0.4/32 scope global lo
       valid_lft forever preferred_lft forever
18: eth0@if19: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1450 qdisc noqueue state UP
    link/ether 02:42:0a:ff:00:05 brd ff:ff:ff:ff:ff:ff
    inet 10.255.0.5/16 scope global eth0
       valid_lft forever preferred_lft forever
20: eth1@if21: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:12:00:03 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.3/16 scope global eth1
       valid_lft forever preferred_lft forever
23: eth2@if24: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1450 qdisc noqueue state UP
    link/ether 02:42:0a:00:00:05 brd ff:ff:ff:ff:ff:ff
    inet 10.0.0.5/24 scope global eth2
       valid_lft forever preferred_lft forever
~~~

Question may arise why we have two VIPs assigned for vote service, vote service can be accessed using two methods, either from client or from the host machine. When it's accessed from the client then myoverlay network is used to access the service. If it's accessed using host machine then ingress routing mesh network is used to provide the access.

Step 6 : Performing inspect on vote service shows us the VIPs which are used to access the service. These are the same IPs which are assigned on lo interface of vote application.    
	   
~~~
docker@manager1:~$ docker service inspect vote
	   
            "VirtualIPs": [
                {
                    "NetworkID": "sh0h7as3prit3pd8nhqdbv6x3",
                    "Addr": "10.255.0.4/16"
                },
                {
                    "NetworkID": "uhtur2cqnefffagaih0q5hpbp",
                    "Addr": "10.0.0.4/24"
                }
            ]
~~~	   

Step 7 : Logged into the client container and tried to access the vote applications, if you see in the curl output, traffic is getting load balanced to two containers. Note : we haven't used the IPaddress to access the containers as swarm automatically provides the DNS discovery. 

~~~	   
docker@manager1:~$ docker exec -it d38975856cfd sh	   

# curl vote | grep "container ID"
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  3162  100  3162    0     0   151k      0 --:--:-- --:--:-- --:--:--  154k
          Processed by container ID 1c06334e3589
#  curl vote | grep "container ID"
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  3162  100  3162    0     0   266k      0 --:--:-- --:--:-- --:--:--  280k
          Processed by container ID 3ab467754bf5
~~~

Step 8 : While performing curl command, if you run the tcpdump on overlay interface then we can see the back and forth traffic, as network troubleshooting tools are not present inside the default vote application image hence I have attached netshoot container with vote application container running on manager1 node. We can see the tcpdump traffic while performing curl on vote application. 

~~~
docker@manager1:~$ docker run -it --net container:1c06334e3589 nicolaka/netshoot
/ # ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet 10.255.0.4/32 scope global lo
       valid_lft forever preferred_lft forever
    inet 10.0.0.4/32 scope global lo
       valid_lft forever preferred_lft forever
27: eth0@if28: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UP group default
    link/ether 02:42:0a:ff:00:06 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.255.0.6/16 scope global eth0
       valid_lft forever preferred_lft forever
29: eth1@if30: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:12:00:04 brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet 172.18.0.4/16 scope global eth1
       valid_lft forever preferred_lft forever
31: eth2@if32: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UP group default
    link/ether 02:42:0a:00:00:06 brd ff:ff:ff:ff:ff:ff link-netnsid 2
    inet 10.0.0.6/24 scope global eth2
       valid_lft forever preferred_lft forever


/ # tcpdump -s0 -i eth2 -n
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth2, link-type EN10MB (Ethernet), capture size 262144 bytes
14:52:47.525076 IP 10.0.0.3.48366 > 10.0.0.5.80: Flags [S], seq 3360028736, win 28200, options [mss 1410,sackOK,TS val 2853665 ecr 0,nop,wscale 7], length 0
14:52:52.112751 IP 10.0.0.3.48368 > 10.0.0.6.80: Flags [S], seq 1598409449, win 28200, options [mss 1410,sackOK,TS val 2854124 ecr 0,nop,wscale 7], length 0
14:52:52.112780 IP 10.0.0.6.80 > 10.0.0.3.48368: Flags [S.], seq 3328134166, ack 1598409450, win 27960, options [mss 1410,sackOK,TS val 2854124 ecr 2854124,nop,wscale 7], length 0
14:52:52.112806 IP 10.0.0.3.48368 > 10.0.0.6.80: Flags [.], ack 1, win 221, options [nop,nop,TS val 2854124 ecr 2854124], length 0
14:52:52.113945 IP 10.0.0.3.48368 > 10.0.0.6.80: Flags [P.], seq 1:69, ack 1, win 221, options [nop,nop,TS val 2854124 ecr 2854124], length 68: HTTP: GET / HTTP/1.1
14:52:52.114077 IP 10.0.0.6.80 > 10.0.0.3.48368: Flags [.], ack 69, win 219, options [nop,nop,TS val 2854124 ecr 2854124], length 0
14:52:52.126706 IP 10.0.0.6.80 > 10.0.0.3.48368: Flags [P.], seq 1:210, ack 69, win 219, options [nop,nop,TS val 2854125 ecr 2854124], length 209: HTTP: HTTP/1.1 200 OK
14:52:52.126766 IP 10.0.0.3.48368 > 10.0.0.6.80: Flags [.], ack 210, win 229, options [nop,nop,TS val 2854125 ecr 2854125], length 0
14:52:52.127107 IP 10.0.0.6.80 > 10.0.0.3.48368: Flags [P.], seq 210:3372, ack 69, win 219, options [nop,nop,TS val 2854125 ecr 2854125], length 3162: HTTP
14:52:52.127133 IP 10.0.0.3.48368 > 10.0.0.6.80: Flags [.], ack 3372, win 279, options [nop,nop,TS val 2854125 ecr 2854125], length 0
14:52:52.130372 IP 10.0.0.3.48368 > 10.0.0.6.80: Flags [F.], seq 69, ack 3372, win 279, options [nop,nop,TS val 2854126 ecr 2854125], length 0
14:52:52.134746 IP 10.0.0.6.80 > 10.0.0.3.48368: Flags [F.], seq 3372, ack 70, win 219, options [nop,nop,TS val 2854126 ecr 2854126], length 0
14:52:52.134799 IP 10.0.0.3.48368 > 10.0.0.6.80: Flags [.], ack 3373, win 279, options [nop,nop,TS val 2854126 ecr 2854126], length 0
~~~	  

Step 9 : Let's check how the traffic is getting redirected from the client to vote application containers. First get the sandbox ID associated with vote application container. 

~~~
docker@manager1:~$ docker container inspect d38975856cfd | grep -i sandbox
            "SandboxID": "727bc5c9f5d0099c1c119e8faead35c9eee37159eeb8017bebd31c5e0f815944",
            "SandboxKey": "/var/run/docker/netns/727bc5c9f5d0",
~~~			

Use this sandbox ID to get the internals for networking routing in docker swarm. 

~~~
root@manager1:/var/run/docker/netns# ls
1-sh0h7as3pr  1-uhtur2cqne  727bc5c9f5d0  a557f907c3f2  default       ingress_sbox
~~~

Starting netshoot container and attaching it with network namespace in privileged mode. 

~~~			
docker@manager1:~$ docker run -it --rm -v /var/run/docker/netns:/var/run/docker/netns --privileged=true nicolaka/netshoot
/ # nsenter --net=/var/run/docker/netns/727bc5c9f5d0 sh
~~~

iptables are showing the MARK which it's sets on any traffic hitting IP address 10.0.0.4 (remember this is one of the VIP assigned to vote service from myoverlay1 network) in this case it's setting HEX value of 0x103. 

~~~
/ # iptables -t mangle -nvL
Chain PREROUTING (policy ACCEPT 60 packets, 23741 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain INPUT (policy ACCEPT 60 packets, 23741 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain FORWARD (policy ACCEPT 0 packets, 0 bytes)
 pkts bytes target     prot opt in     out     source               destination

Chain OUTPUT (policy ACCEPT 105 packets, 6489 bytes)
 pkts bytes target     prot opt in     out     source               destination
    0     0 MARK       all  --  *      *       0.0.0.0/0            10.0.0.2             MARK set 0x101
   39  2484 MARK       all  --  *      *       0.0.0.0/0            10.0.0.4             MARK set 0x103

Chain POSTROUTING (policy ACCEPT 66 packets, 4005 bytes)
 pkts bytes target     prot opt in     out     source               destination
~~~ 

Converting hex value of 0x103 to decimal gives 259. Two backend IP addresses present corresponds to each vote container IP. 

~~~
/ # ipvsadm
IP Virtual Server version 1.2.1 (size=4096)
Prot LocalAddress:Port Scheduler Flags
  -> RemoteAddress:Port           Forward Weight ActiveConn InActConn
FWM  257 rr
  -> 10.0.0.3:0                   Masq    1      0          0
FWM  259 rr
  -> 10.0.0.5:0                   Masq    1      0          0
  -> 10.0.0.6:0                   Masq    1      0          0
~~~

In this article, we have covered how the vote application is accessed using client continer, in next article, we will be covering how the same application is accessed from the host machine. 