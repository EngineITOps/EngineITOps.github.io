---
layout: post
title: Understanding docker swarm service routing
tags: [swarm]
category: [swarm]
author: vikrant
comments: true
---	

In this article I am going to share some tips about accessing the service from external world. In previous articles, I have talked about accessing the service from client and host machine, explaining the network traffic workflow. While creating a service you can decide whether service should use routing mesh, host mode or external load balancer to access the service. 

#### Route mode mesh

Created the service using following command. As we haven't specified any mode while creating the service hence by-default it's using routing mesh. As soon as I have created the service two containers (tasks) are spawned on worker1 and worker2 nodes. 

~~~
docker@manager1:~$ docker service create --name my-web --publish published=8080,target=80 --replicas 2 nginx

docker@manager1:~$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
2spnybgkb7pk        my-web              replicated          2/2                 nginx:latest        *:8080->80/tcp

docker@manager1:~$ docker service ps my-web
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE           ERROR               PORTS
dz17mt27dsjx        my-web.1            nginx:latest        worker1             Running             Running 5 minutes ago
xr2p01g7da2x        my-web.2            nginx:latest        worker2             Running             Running 5 minutes ago
~~~

Even though these containers are running on worker1 and worker2 only when manager nodes are not acting like worker nodes still I am able to access the service using the IP address of manager1 on port 8080. Same is applicable for all manager nodes present in cluster. 

~~~
docker@manager1:~$ sudo iptables -t nat -L | grep 8080
DNAT       tcp  --  anywhere             anywhere             tcp dpt:webcache to:172.18.0.2:8080
docker@manager1:~$
~~~

If the service is already created, existing service can be updated to publish the port. 

#### Host mode

As we have seen in case of Host routing mode mesh ports are getting published on all nodes present in swarm cluster. But if you want to publish the ports only on those nodes on which container is running then instead of using no mode option you should have specified `mode=host` option while creating the service. Also, global mode is used which indicates that this service should get started on all the worker nodes present in swarm cluster. 

~~~
root@manager2:~# docker service create --name my-web --publish published=8080,target=80,mode=host --mode global nginx

root@manager2:~# docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
m0k3ivut1453        my-web              global              2/2                 nginx:latest

root@manager2:~# docker service ps my-web
ID                  NAME                               IMAGE               NODE                DESIRED STATE       CURRENT STATE           ERROR               PORTS
zj2wreoo2ydz        my-web.j1g6ylbezhhq6d6qwri85vkgq   nginx:latest        worker1             Running             Running 2 minutes ago                       *:8080->80/tcp
vzjt5m2zz7eo        my-web.egy0qr3u15qr8p26p3wpt6ctr   nginx:latest        worker2             Running             Running 2 minutes ago                       *:8080->80/tcp
~~~

Question may arise what's the purpose of using global option in the service creation part, as we are specifying the published and target port 53, if we are having 2 worker nodes and we are going to create service using replication mode with scale of 4, it will try to start 2 containers on each node, it may lead to conflict on port usage. To avoid this scenario, two approaches are available:

1) Skip the target port option so that swarm can chose random port for each tasks
2) Use the global mode which will help to start the container equal to the number of worker nodes avoiding the conflicting situation. 


#### Changing access mode of service from VIP (Virtual IP) to dnsrr (DNS round robin).


~~~
root@manager2:~# docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
wnor2cjt0rru        my-web              global              2/2                 nginx:latest

root@manager2:~# docker service ps my-web
ID                  NAME                               IMAGE               NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
8zlu8wlhw1f7        my-web.j1g6ylbezhhq6d6qwri85vkgq   nginx:latest        worker1             Running             Running 48 seconds ago                       *:8080->80/tcp
xyajqefq32ml        my-web.egy0qr3u15qr8p26p3wpt6ctr   nginx:latest        worker2             Running             Running 48 seconds ago                       *:8080->80/tcp

root@manager2:~# docker service inspect my-web --pretty

ID:             wnor2cjt0rru3y91bdukvwj3y
Name:           my-web
Service Mode:   Global
Placement:
UpdateConfig:
 Parallelism:   1
 On failure:    pause
 Monitoring Period: 5s
 Max failure ratio: 0
 Update order:      stop-first
RollbackConfig:
 Parallelism:   1
 On failure:    pause
 Monitoring Period: 5s
 Max failure ratio: 0
 Rollback order:    stop-first
ContainerSpec:
 Image:         nginx:latest@sha256:cf8d5726fc897486a4f628d3b93483e3f391a76ea4897de0500ef1f9abcd69a1
Resources:
Endpoint Mode:  dnsrr
Ports:
 PublishedPort = 8080
  Protocol = tcp
  TargetPort = 80
  PublishMode = host
~~~



