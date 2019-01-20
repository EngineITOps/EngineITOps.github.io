---
layout: post
title: How to create service in docker swarm
tags: [docker, swarm]
category: [swarm]
author: vikrant
comments: true
---	

In this article I am going to shed light on the service creation part in docker swarm. service consists of set of tasks basically task is just a container. 

Step 1 : As I don't want to spin up any task on the manager nodes hence I drain the manager nodes. 

~~~
docker@manager1:~$ docker node update --availability drain manager1
manager1
docker@manager1:~$ docker node update --availability drain manager2
manager2
docker@manager1:~$ docker node update --availability drain manager3
manager3
~~~

Step 2 : Started the service and once the service is created inspect the service to get the basic information about the service. 

~~~
docker@manager1:~$ docker service create --replicas 1 --name helloworld alpine ping docker.com
0dg3f4piq87pd3msg7jt3vpvg

docker@manager1:~$ docker service inspect --pretty helloworld

ID:             0dg3f4piq87pd3msg7jt3vpvg
Name:           helloworld
Service Mode:   Replicated
 Replicas:      1
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
 Image:         alpine:latest@sha256:ccba511b1d6b5f1d83825a94f9d5b05528db456d9cf14a1ea1db892c939cda64
 Args:          ping docker.com
Resources:
Endpoint Mode:  vip
~~~

Step 3 : Once the service is started, it will spin-up the tasks on various worker nodes. In this case we have started only one replica hence one container is running on worker1 node.

~~~
docker@manager1:~$ docker service ps helloworld
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE            ERROR               PORTS
i6np2a4k4m45        helloworld.1        alpine:latest       worker1             Running             Running 33 seconds ago    
~~~

Step 4 : It's very easy to scale the service by change the scale count. Checking the content shows that helloworld service is now having 3 tasks. Two of them are running on worker1 and one is running on worker2. 

~~~
docker@manager1:~$ docker service scale helloworld=3
helloworld scaled to 3

docker@manager1:~$ docker service ps helloworld
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE             ERROR               PORTS
i6np2a4k4m45        helloworld.1        alpine:latest       worker1             Running             Running 58 seconds ago    
y5hfkwjwo6a0        helloworld.2        alpine:latest       worker2             Running             Preparing 3 seconds ago   
assn4ao8wgfv        helloworld.3        alpine:latest       worker1             Running             Running 3 seconds ago     
~~~

Step 5 : I am starting another service using replica count of 3. Notably I am specifiying "--update-delay" flag it will configure the delay between updates to a service task or set of tasks. I am using set of tasks because you can specify another option i.e "--update-parallelis" flag which indicates the number of tasks which will be updated simultanesouly by default it's updating the task one by one. 

~~~
docker@manager2:~$ docker service create --replicas 3 --name redis --update-delay 10s redis:3.0.6
v55rrm1uzzf160liccdwnklhe
~~~

Step 6 : Verify the nodes on which the container is started. 

~~~
docker@manager2:~$ docker service ls
ID                  NAME                MODE                REPLICAS            IMAGE               PORTS
0dg3f4piq87p        helloworld          replicated          3/3                 alpine:latest
v55rrm1uzzf1        redis               replicated          3/3                 redis:3.0.6

docker@manager2:~$ docker service ps redis
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE                ERROR               PORTS
f17y9ss7j660        redis.1             redis:3.0.6         worker1             Running             Running about a minute ago
wsm6ve007ojw        redis.2             redis:3.0.6         worker2             Running             Running about a minute ago
zamwx5kiisvt        redis.3             redis:3.0.6         worker2             Running             Running about a minute ago
~~~

Step 7 : Update the image version. You just need to issue one command to perform the upgrade, it will automatically perform the upgrade the update in rolling manner. 

~~~
docker@manager2:~$ docker service update --image redis:3.0.7 redis
redis

docker@manager2:~$ docker service ps redis
ID                  NAME                IMAGE               NODE                DESIRED STATE       CURRENT STATE                 ERROR               PORTS
7ah6jvmw1zas        redis.1             redis:3.0.7         worker1             Running             Running about a minute ago
f17y9ss7j660         \_ redis.1         redis:3.0.6         worker1             Shutdown            Shutdown about a minute ago
x03a3zdcxrti        redis.2             redis:3.0.7         worker2             Running             Running about a minute ago
wsm6ve007ojw         \_ redis.2         redis:3.0.6         worker2             Shutdown            Shutdown about a minute ago
azrku5q6xnf6        redis.3             redis:3.0.7         worker2             Running             Running 53 seconds ago
zamwx5kiisvt         \_ redis.3         redis:3.0.6         worker2             Shutdown            Shutdown 53 seconds ago
~~~