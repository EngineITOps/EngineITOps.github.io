---
layout: post
title: How networking works in multi-node docker swarm cluster
tags: [swarm]
category: [swarm]
author: vikrant
comments: true
--- 

In this article I am going to shed some light on the multi-node docker networking in context of docker swarm. In the previous [article](https://ervikrant06.github.io/docker-swarm-setup/) I have provided the setps to create docker swarm article, in this we will be focusing on networking part. 

As you may have noticed that after initializing the swarm manager node two new interfaces `docker_gwbridge, veth903e7a7@if12` were appearted in `ip a` output. These two interfaces are corresponding to two new docker networks `docker_gwbridge, ingress` which are appearing in following output. 

~~~
docker@manager1:~$ docker network ls
NETWORK ID          NAME                DRIVER              SCOPE
7b26301a39ae        bridge              bridge              local
689d9c67a71e        docker_gwbridge     bridge              local
61b3deedf21d        host                host                local
sh0h7as3prit        ingress             overlay             swarm
c6e3be0b1751        none                null                local
~~~

Let's understand the usage of each of the network present in above output. 

1) *Name : bridge, Driver : bridge* - When we are spinning up the container on a single node this is the default bridge which is used to provide the IP address to container. This is the docker0 interface present corresponding to this network. 

~~~
docker@manager1:~$ ip a show dev docker0
6: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:61:2b:60:62 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 scope global docker0
       valid_lft forever preferred_lft forever
~~~

If I simply spin up the container using `docker run` command then it will take the ipaddress from docker0 subnet range. 

~~~
/ # ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
20: eth0@if21: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 172.17.0.2/16 scope global eth0
       valid_lft forever preferred_lft forever
~~~

2) *Name : docker_gwbridge Driver : bridge* - This network doesn't present in default configuration, it appears after initializing the swarm cluster. This bridge network that connects overlay networks (including the ingress network) to an individual Docker daemon’s physical network.

~~~
docker@manager1:~$ ip a show dev docker_gwbridge
11: docker_gwbridge: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:f3:1c:75:05 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.1/16 scope global docker_gwbridge
       valid_lft forever preferred_lft forever
    inet6 fe80::42:f3ff:fe1c:7505/64 scope link
       valid_lft forever preferred_lft forever
~~~

Creating service using `docker service` command and check on which nodes containers are running corresponding to this service. Note : I have given replica count of 2 before running this service. 

~~~
docker@manager1:~$ docker service create --replicas 2 --publish mode=ingress,target=80,published=8080 nginx
n61t0fc7hyxh5aypahwhy4159

docker@manager1:~$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
n61t0fc7hyxh        frosty_jepsen       replicated          2/2                 nginx:latest        *:8080->80/tcp

docker@manager1:~$ docker service ps frosty_jepsen
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
7mw7m5xvh660        frosty_jepsen.1     nginx:latest        worker1             Running             Running 9 seconds ago
rp6wmkcq5liv        frosty_jepsen.2     nginx:latest        manager1            Running             Running 26 seconds ago
~~~

Let's check the IP addresses which are present on container running on manager1 node. It has taken two IP addresses one from the docker_gwbridge and another from ingress range which we have not discussed yet. 

~~~
/ # ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet 10.255.0.4/32 scope global lo
       valid_lft forever preferred_lft forever
16: eth0@if17: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1450 qdisc noqueue state UP group default
    link/ether 02:42:0a:ff:00:06 brd ff:ff:ff:ff:ff:ff link-netnsid 0
    inet 10.255.0.6/16 scope global eth0
       valid_lft forever preferred_lft forever
18: eth1@if19: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:ac:12:00:03 brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet 172.18.0.3/16 scope global eth1
       valid_lft forever preferred_lft forever
~~~ 

3) *Name : host Driver : host* - This is used to provide host machine IP address to the container. It's not of much use but taking an example let's say you don't want to install the network troubleshooting related packages on your host machine and wants to spin-up a container which can provide those packages, in that scenario we can map the container containing network related packages with host machine network. 

On manager1 node I don't have tcpdump package present.

~~~
docker@manager1:~$ tcpdu
~~~

Spin-up container using host network map. All the interfaces which were present on manager1 are now present inside the netshoot container. 

~~~
docker@manager1:~$ docker run -it --net host nicolaka/netshoot
/ # ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: dummy0: <BROADCAST,NOARP> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 0a:12:9b:d5:e3:17 brd ff:ff:ff:ff:ff:ff
3: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:91:de:a2 brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::a00:27ff:fe91:dea2/64 scope link
       valid_lft forever preferred_lft forever
4: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:28:f2:f8 brd ff:ff:ff:ff:ff:ff
    inet 192.168.99.100/24 brd 192.168.99.255 scope global eth1
       valid_lft forever preferred_lft forever
    inet6 fe80::a00:27ff:fe28:f2f8/64 scope link
       valid_lft forever preferred_lft forever
6: docker0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:61:2b:60:62 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 scope global docker0
       valid_lft forever preferred_lft forever
    inet6 fe80::42:61ff:fe2b:6062/64 scope link
       valid_lft forever preferred_lft forever
11: docker_gwbridge: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:f3:1c:75:05 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.1/16 scope global docker_gwbridge
       valid_lft forever preferred_lft forever
    inet6 fe80::42:f3ff:fe1c:7505/64 scope link
       valid_lft forever preferred_lft forever
13: veth903e7a7@if12: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker_gwbridge state UP group default
    link/ether e2:eb:2f:41:b8:34 brd ff:ff:ff:ff:ff:ff link-netnsid 1
    inet6 fe80::e0eb:2fff:fe41:b834/64 scope link
       valid_lft forever preferred_lft forever
19: veth8d2dc83@if18: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker_gwbridge state UP group default
    link/ether 62:d8:e3:98:00:a2 brd ff:ff:ff:ff:ff:ff link-netnsid 2
    inet6 fe80::60d8:e3ff:fe98:a2/64 scope link
       valid_lft forever preferred_lft forever
21: veth9d7aff1@if20: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker0 state UP group default
    link/ether 1e:71:40:d0:ed:55 brd ff:ff:ff:ff:ff:ff link-netnsid 3
    inet6 fe80::1c71:40ff:fed0:ed55/64 scope link
       valid_lft forever preferred_lft forever
~~~

We can use the network related tools present inside the container. 

~~~
/ # tcpdump
~~~

Once troubleshooting is completed then we can destroy the container. Our host machine remains prisitne. 

4) *Name: ingress Driver: overlay* - This is used for multi-node communication. We have already seen in step 2, IP address provided by the overlay network to container along with IPaddress from dockergw_bridge network. Basically dockergw_bridge is used to provide the external connectivity to containers and overlay is used to provide connectivity between the containers. 

5) *Name: none Driver: null* - When we don't want to attach any IPaddress or network to container then we use none driver to spin-up the container. 

