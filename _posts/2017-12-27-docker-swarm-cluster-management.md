---
layout: post
title: Useful docker swarm cluster administration commands
tags: [swarm]
category: [swarm]
author: vikrant
comments: true
---	


In the previous articles I have shown the procedure to create swarm cluster and run the services. In this article I am going to provide some tips for docker swarm cluster admins which they can use in daily life. 

*Q : After creating the cluster initially if we want to join the nodes later how can we do it?*

A : We can see the token while initializing creating the cluster but how to join the manager and worker nodes later on in the same cluster just in case if you didn't make the note of terminal output while creating the cluster.

To get the token for joining node as worker or manager node. 

~~~
$ docker swarm join-token worker
$ docker swarm join-token manager
~~~

Example outputs:

~~~
docker@manager1:~$ docker swarm join-token worker
To add a worker to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-1icv5c0oj5p95syuuwiw0hh8ay4k7krrmp94u8urmis7gthylu-3y637fkgufrn3a84pnocgbug8 192.168.99.100:2377

docker@manager1:~$ docker swarm join-token manager
To add a manager to this swarm, run the following command:

    docker swarm join --token SWMTKN-1-1icv5c0oj5p95syuuwiw0hh8ay4k7krrmp94u8urmis7gthylu-a5ycxnd5wf4bivzzkyifopf36 192.168.99.100:2377
~~~

We can use these commands to join the worker or manager node. Like if I want to add worker node into the cluster. 

~~~
docker@worker2:~$ docker swarm join --token SWMTKN-1-1icv5c0oj5p95syuuwiw0hh8ay4k7krrmp94u8urmis7gthylu-3y637fkgufrn3a84pnocgbug8 192.168.99.100:2
377
This node joined a swarm as a worker.

docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Leader
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Active
~~~

Similarly to join the manager node into the cluster. In following ouptut we can see that one of the manager node is acting like Leader and other nodes are just showing reachable state. 

~~~
docker@manager2:~$ docker swarm join --token SWMTKN-1-1icv5c0oj5p95syuuwiw0hh8ay4k7krrmp94u8urmis7gthylu-a5ycxnd5wf4bivzzkyifopf36 192.168.99.100:2377
This node joined a swarm as a manager.

docker@manager3:~$ docker swarm join --token SWMTKN-1-1icv5c0oj5p95syuuwiw0hh8ay4k7krrmp94u8urmis7gthylu-a5ycxnd5wf4bivzzkyifopf36 192.168.99.100:2377
This node joined a swarm as a manager.

docker@manager3:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc     manager1            Ready               Active              Leader
9w5zd1lnxab8sin6tbozu0vm3     manager2            Ready               Active              Reachable
z0shyispea9f19j9u2oti89u5 *   manager3            Ready               Active              Reachable
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Active
~~~

*Q : How can we remove the node from cluster?*

A : First you need to know which node you are planning to leave from the cluster whether it's worker or manager node. If it's manager node then first change the node from manager to worker node, you can also directly remove the manager node from the cluster but this will not reconfigure the swarm cluster to maintain quorum in the cluster. In case of worker node, direct command can be issued to take it out from cluster. 

Demoted the manager node and now node is not showing in Reachable state. Basically the node has turned into a worker node. 

~~~
docker@manager2:~$ docker node demote manager2
Manager manager2 demoted in the swarm.

docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Leader
9w5zd1lnxab8sin6tbozu0vm3     manager2            Ready               Active
z0shyispea9f19j9u2oti89u5     manager3            Ready               Active              Reachable
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Active
~~~

Once I issued the command on manager2 node to leave the cluster. Node is in down status now. 

~~~
docker@manager2:~$ docker swarm leave
Node left the swarm.

docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Leader
9w5zd1lnxab8sin6tbozu0vm3     manager2            Down                Active
z0shyispea9f19j9u2oti89u5     manager3            Ready               Active              Reachable
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Active
~~~

In case of worker node just issue the docker swarm leave command to take that node out of the cluster.

*Q : By default while creating service containers are getting started on manager node as well which is not an ideal sceanrio because it can choke up the manager node and leads to other issues. How can stop scheduling containers on manager node?*

A : You need to drain the manager node to avoid the scheduling of containers on the manager node. Issuing above command will move the containers to other available nodes. 

~~~
docker@manager1:~$ docker node update --availability drain manager1
~~~

*Q : How to promote a worker node to act like a manager node?*

A : As we left with two manager node after performing the drain operation on manager node, we can promot the worker node to act like a manager node. As soon as you promote a worker node to act like a manager node it's showing reachable status. 

~~~
docker@manager1:~$ docker node promote worker1
Node worker1 promoted to a manager in the swarm.
docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Reachable
9w5zd1lnxab8sin6tbozu0vm3     manager2            Down                Active
z0shyispea9f19j9u2oti89u5     manager3            Ready               Active              Leader
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active              Reachable
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Active
~~~

*Q : How to move all the containers running on the worker node to other available nodes?*

A : Just drain the worker node so that all running containers can be moved to other available nodes. 

~~~
docker@manager1:~$ docker node update --availability drain worker2
worker2
docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Reachable
9w5zd1lnxab8sin6tbozu0vm3     manager2            Down                Active
z0shyispea9f19j9u2oti89u5     manager3            Ready               Active              Leader
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active              Reachable
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Drain
~~~

You may switch it back to active once the activity is completed on worker2. 

~~~
docker@manager1:~$ docker node update --availability active worker2
worker2
docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Reachable
9w5zd1lnxab8sin6tbozu0vm3     manager2            Down                Active
z0shyispea9f19j9u2oti89u5     manager3            Ready               Active              Leader
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active              Reachable
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Active
~~~

*Q : How to disable the scheduling of new containers on worker node but want to keep the existing containers running?*

A : Put the node in pause mode so that new scheduling will not happen on worker2 node. 

~~~
docker@manager1:~$ docker node update --availability pause worker2
worker2

docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Reachable
9w5zd1lnxab8sin6tbozu0vm3     manager2            Down                Active
z0shyispea9f19j9u2oti89u5     manager3            Ready               Active              Leader
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active              Reachable
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Pause
~~~

*Q : How to remove the node from the list of nodes shown in `docker node ls` output?*

A : Once the swarm worker node is removed from the cluster, it's showing the DOWN status in output of `docker node ls` output. 

Like my manager node was removed from the swarm cluster and again I issued the swarm join command on that node. Now I am seeing two instances of the manager2 node one which is in DOWN status and another one which is in Ready/Active status. 

~~~
docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Reachable
9w5zd1lnxab8sin6tbozu0vm3     manager2            Down                Active
i87iw5cs98vmbxxn6umu4zh72     manager2            Ready               Active              Reachable
z0shyispea9f19j9u2oti89u5     manager3            Ready               Active              Leader
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Active
~~~

To get rid of the manager2 Down node. Note: I have used the node ID as HOSTNAME

~~~
docker@manager1:~$ docker node rm 9w5zd1lnxab8sin6tbozu0vm3
9w5zd1lnxab8sin6tbozu0vm3

docker@manager1:~$ docker node ls
ID                            HOSTNAME            STATUS              AVAILABILITY        MANAGER STATUS
xx648gzarpf33fruo8cqbg8dc *   manager1            Ready               Active              Reachable
i87iw5cs98vmbxxn6umu4zh72     manager2            Ready               Active              Reachable
z0shyispea9f19j9u2oti89u5     manager3            Ready               Active              Leader
j1g6ylbezhhq6d6qwri85vkgq     worker1             Ready               Active
egy0qr3u15qr8p26p3wpt6ctr     worker2             Ready               Active
~~~

*Q : How to add or remove the label metadata from the node?* 

A : Node label provides a flexible method of node organization. You can also use node labels in service constraints.

~~~
 