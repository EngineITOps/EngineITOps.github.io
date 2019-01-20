---
layout: post
title: How to create docker swarm cluster
tags: [swarm]
category: [swarm]
author: vikrant
comments: true
--- 

In this article I am going to provide the steps to create docker swarm setup using one manager and two worker nodes. This is my first article in swarm series, mainly in rest of articles I will be focusing on network part of docker swarm.

A brief introduction to docker swarm, it's orchestrator similar to kubernetes which is used to spin-up the container on multiple nodes and manage the lifecycle of those containers.

#### Setup requirements

- Windows/Linux/MAC machine
- Oracle Virtual box
- docker-machine executable

We require to issue only few commands to setup a docker swarm cluster.

#### Steps to create docker swarm cluster

Step 1 : To get the docker-machine for windows.

~~~
# curl -L https://github.com/docker/machine/releases/download/v0.13.0/docker-machine-`uname -s`-`uname -m` >/usr/local/bin/docker-machine &&  chmod +x /usr/local/bin/docker-machine
~~~

Step 2 : First spin up the manager and worker nodes. As in this case we are using one manager and two worker nodes hence we will be issuing same command three times with different machine names.

As we are using virtulbox to spin the manager and worker nodes hence driver virtualbox is used. 

~~~
$ docker-machine.exe create --driver virtualbox manager1
Running pre-create checks...
(manager1) Default Boot2Docker ISO is out-of-date, downloading the latest release...
(manager1) Latest release for github.com/boot2docker/boot2docker is v17.09.1-ce
(manager1) Downloading C:\Users\viaggarw\.docker\machine\cache\boot2docker.iso from https://github.com/boot2docker/boot2docker/releases/download/v17.09.1-ce/boot2docker.iso...
(manager1) 0%....10%....20%....30%....40%....50%....60%....70%....80%....90%....100%
Creating machine...
(manager1) Copying C:\Users\viaggarw\.docker\machine\cache\boot2docker.iso to C:\Users\viaggarw\.docker\machine\machines\manager1\boot2docker.iso...
(manager1) Creating VirtualBox VM...
(manager1) Creating SSH key...
(manager1) Starting the VM...
(manager1) Check network to re-create if needed...
(manager1) Windows might ask for the permission to configure a dhcp server. Sometimes, such confirmation window is minimized in the taskbar.
(manager1) Waiting for an IP...
Waiting for machine to be running, this may take a few minutes...
Detecting operating system of created instance...
Waiting for SSH to be available...
Detecting the provisioner...
Provisioning with boot2docker...
Copying certs to the local machine directory...
Copying certs to the remote machine...
Setting Docker configuration on the remote daemon...
Checking connection to Docker...
Docker is up and running!
To see how to connect your Docker Client to the Docker Engine running on this virtual machine, run: C:\Users\viaggarw\bin\docker-machine.exe env manager1
~~~

As indicated in the above output issue the following command to get the information on how to connect with manager node. 

~~~
$ docker-machine.exe env manager1
export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://192.168.99.100:2376"
export DOCKER_CERT_PATH="C:\Users\viaggarw\.docker\machine\machines\manager1"
export DOCKER_MACHINE_NAME="manager1"
export COMPOSE_CONVERT_WINDOWS_PATHS="true"
# Run this command to configure your shell:
# eval $("C:\Users\viaggarw\bin\docker-machine.exe" env manager1)
~~~

Similarly we need to spinup the worker nodes. Outputs are truncated for brevity. 

~~~
# docker-machine create --driver virtualbox worker1
# docker-machine create --driver virtualbox worker2
~~~

Verify that all nodes have came up successfully.

~~~
$ docker-machine.exe ls
NAME       ACTIVE   DRIVER       STATE     URL                         SWARM   DOCKER        ERRORS
manager1   -        virtualbox   Running   tcp://192.168.99.100:2376           v17.09.1-ce
worker1    -        virtualbox   Running   tcp://192.168.99.101:2376           v17.09.1-ce
worker2    -        virtualbox   Running   tcp://192.168.99.102:2376           v17.09.1-ce
~~~

Step 3 : Login into the manager1 node to initalize the swarm cluster. 

~~~
# docker-machine ssh manager1
~~~

Before directly initializing the cluster, first verify the current number of interfaces which are present on machine. 

~~~
docker@manager1:~$ ip a
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
6: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:61:2b:60:62 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 scope global docker0
       valid_lft forever preferred_lft forever
~~~

Initialized the swarm cluster. 

~~~
docker@manager1:~$ docker swarm init --advertise-addr 192.168.99.100
Swarm initialized: current node (xx648gzarpf33fruo8cqbg8dc) is now a manager.

To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-1icv5c0oj5p95syuuwiw0hh8ay4k7krrmp94u8urmis7gthylu-3y637fkgufrn3a84pnocgbug8 192.168.99.100:2377

To add a manager to this swarm, run 'docker swarm join-token manager' and follow the instructions.
~~~

After issuing above command, you may have noticed that two new interfaces `docker_gwbridge, veth903e7a7@if12` have appeared. 

~~~
docker@manager1:~$ ip a
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
6: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:61:2b:60:62 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 scope global docker0
       valid_lft forever preferred_lft forever
11: docker_gwbridge: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:f3:1c:75:05 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.1/16 scope global docker_gwbridge
       valid_lft forever preferred_lft forever
    inet6 fe80::42:f3ff:fe1c:7505/64 scope link
       valid_lft forever preferred_lft forever
13: veth903e7a7@if12: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker_gwbridge state UP group default
    link/ether e2:eb:2f:41:b8:34 brd ff:ff:ff:ff:ff:ff
    inet6 fe80::e0eb:2fff:fe41:b834/64 scope link
       valid_lft forever preferred_lft forever
$ exit	   
~~~
	   

Step 4 : Our manager node is configured, it's time to add the worker nodes into swarm cluster. As indicated in the output of `docker swarm init --advertise-addr 192.168.99.100` we need to issue the following command on worker node to join them into the swarm cluster. Again before directly adding them into swarm cluster just verify the interfaces which are present on worker node before and after joining the swarm cluster. 

Before joining the swarm cluster interfaces present on worker1 node. 

~~~
$ docker-machine.exe ssh worker1
                        ##         .
                  ## ## ##        ==
               ## ## ## ## ##    ===
           /"""""""""""""""""\___/ ===
      ~~~ {~~ ~~~~ ~~~ ~~~~ ~~~ ~ /  ===- ~~~
           \______ o           __/
             \    \         __/
              \____\_______/
 _                 _   ____     _            _
| |__   ___   ___ | |_|___ \ __| | ___   ___| | _____ _ __
| '_ \ / _ \ / _ \| __| __) / _` |/ _ \ / __| |/ / _ \ '__|
| |_) | (_) | (_) | |_ / __/ (_| | (_) | (__|   <  __/ |
|_.__/ \___/ \___/ \__|_____\__,_|\___/ \___|_|\_\___|_|
Boot2Docker version 17.09.1-ce, build HEAD : e7de9ae - Fri Dec  8 19:41:36 UTC 2017
Docker version 17.09.1-ce, build 19e2cf6
docker@worker1:~$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: dummy0: <BROADCAST,NOARP> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 76:08:a0:a4:04:69 brd ff:ff:ff:ff:ff:ff
3: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:eb:6b:cf brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::a00:27ff:feeb:6bcf/64 scope link
       valid_lft forever preferred_lft forever
4: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:c9:b5:11 brd ff:ff:ff:ff:ff:ff
    inet 192.168.99.101/24 brd 192.168.99.255 scope global eth1
       valid_lft forever preferred_lft forever
    inet6 fe80::a00:27ff:fec9:b511/64 scope link
       valid_lft forever preferred_lft forever
6: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:2b:ac:36:32 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 scope global docker0
       valid_lft forever preferred_lft forever
docker@worker1:~$
~~~

Issue the command to join the worker node into swarm cluster. Again two new interfaces appeared on worker node as well. Similar command need to be issued on worker2 node to make it part of swarm cluster. 

~~~
docker@worker1:~$ docker swarm join --token SWMTKN-1-1icv5c0oj5p95syuuwiw0hh8ay4k7krrmp94u8urmis7gthylu-3y637fkgufrn3a84pnocgbug8 192.168.99.100:2377
This node joined a swarm as a worker.
docker@worker1:~$ ip a
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
    inet6 ::1/128 scope host
       valid_lft forever preferred_lft forever
2: dummy0: <BROADCAST,NOARP> mtu 1500 qdisc noop state DOWN group default qlen 1000
    link/ether 76:08:a0:a4:04:69 brd ff:ff:ff:ff:ff:ff
3: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:eb:6b:cf brd ff:ff:ff:ff:ff:ff
    inet 10.0.2.15/24 brd 10.0.2.255 scope global eth0
       valid_lft forever preferred_lft forever
    inet6 fe80::a00:27ff:feeb:6bcf/64 scope link
       valid_lft forever preferred_lft forever
4: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP group default qlen 1000
    link/ether 08:00:27:c9:b5:11 brd ff:ff:ff:ff:ff:ff
    inet 192.168.99.101/24 brd 192.168.99.255 scope global eth1
       valid_lft forever preferred_lft forever
    inet6 fe80::a00:27ff:fec9:b511/64 scope link
       valid_lft forever preferred_lft forever
6: docker0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN group default
    link/ether 02:42:2b:ac:36:32 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.1/16 scope global docker0
       valid_lft forever preferred_lft forever
11: docker_gwbridge: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default
    link/ether 02:42:b7:94:7c:66 brd ff:ff:ff:ff:ff:ff
    inet 172.18.0.1/16 scope global docker_gwbridge
       valid_lft forever preferred_lft forever
    inet6 fe80::42:b7ff:fe94:7c66/64 scope link tentative
       valid_lft forever preferred_lft forever
13: veth5025aab@if12: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue master docker_gwbridge state UP group default
    link/ether 92:c6:0e:6e:75:b0 brd ff:ff:ff:ff:ff:ff
    inet6 fe80::90c6:eff:fe6e:75b0/64 scope link
       valid_lft forever preferred_lft forever
~~~


