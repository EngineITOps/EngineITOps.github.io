---
layout: post
title: How to prepare the elasticsearch clustered setup on a single machine
tags: [elasticserch, kibana, logstash, elk]
category: [ELK]
author: vikrant
comments: true
--- 

In the previous articles, we have seen the ELK setup using docker container. I wanted to try the elasticsearch using clustered based setup but I was facing some issues while running the elasticsearch in clustered mode hence I started exploring other options. Finally I decided to run the ES as a process on MAC but point of worry for me whether it will allow me to run the multiple ES processes on a single machine since each process of ES will try to use the port 9200 but then I read the official doc and found that default port range for ES is 9200-9300 this means it will be using any available port from this range hence if 9200 is already used by one process of ES then second will use next one which could be 9201.

Since by default people are using the port 9200 to communicate with ES hence I used this port for client and consecutive ports for master and data nodes.  

Created this simple bash script to spawn the multiple ES processes in single go. Note: Sequence matter here we are supposed to start client as the first process so that it can use the port 9200. We will be hitting all API requests on client which will then use the master node to decide which datanode should serve the request. 

~~~
#!/bin/bash

### Client node

$HOME/Documents/ELK/ELASTIC/clientnode/elasticsearch-6.2.4/bin/elasticsearch &

### Master nodes
$HOME/Documents/ELK/ELASTIC/masternode/node1/elasticsearch-6.2.4/bin/elasticsearch &
$HOME/Documents/ELK/ELASTIC/masternode/node2/elasticsearch-6.2.4/bin/elasticsearch &
$HOME/Documents/ELK/ELASTIC/masternode/node3/elasticsearch-6.2.4/bin/elasticsearch &

### Data nodes

$HOME/Documents/ELK/ELASTIC/datanode/node1/elasticsearch-6.2.4/bin/elasticsearch &
$HOME/Documents/ELK/ELASTIC/datanode/node2/elasticsearch-6.2.4/bin/elasticsearch &
$HOME/Documents/ELK/ELASTIC/datanode/node3/elasticsearch-6.2.4/bin/elasticsearch &
~~~

Let's check the configuraion file content for each type of node. 

#### Client node.

~~~
$ for i in $HOME/Documents/ELK/ELASTIC/clientnode/elasticsearch-6.2.4/config/elasticsearch.yml ;do echo "****$i****" ; cat $i | grep -v "#"; done
****/Users/viaggarw/Documents/ELK/ELASTIC/clientnode/elasticsearch-6.2.4/config/elasticsearch.yml****
cluster.name: my-application
node.name: client-node-1
node.master: false
node.data: false
~~~

#### Master node. 

~~~
$ for i in $HOME/Documents/ELK/ELASTIC/masternode/node{1,2,3}/elasticsearch-6.2.4/config/elasticsearch.yml ;do echo "****$i****" ; cat $i | grep -v "#"; done
****/Users/viaggarw/Documents/ELK/ELASTIC/masternode/node1/elasticsearch-6.2.4/config/elasticsearch.yml****
cluster.name: my-application
node.name: master-node-1
node.master: true
node.data: false
node.ingest: false
search.remote.connect: false
discovery.zen.minimum_master_nodes: 2
****/Users/viaggarw/Documents/ELK/ELASTIC/masternode/node2/elasticsearch-6.2.4/config/elasticsearch.yml****
cluster.name: my-application
node.name: master-node-2
node.master: true
node.data: false
node.ingest: false
search.remote.connect: false
discovery.zen.minimum_master_nodes: 2
****/Users/viaggarw/Documents/ELK/ELASTIC/masternode/node3/elasticsearch-6.2.4/config/elasticsearch.yml****
cluster.name: my-application
node.name: master-node-3
node.master: true
node.data: false
node.ingest: false
search.remote.connect: false
discovery.zen.minimum_master_nodes: 2
~~~

#### Data node : Notably in the data node I am using box_type attribute which is require for further exercises which I am going to do using this setup. 

~~~
$ for i in $HOME/Documents/ELK/ELASTIC/datanode/node{1,2,3}/elasticsearch-6.2.4/config/elasticsearch.yml ;do echo "****$i****" ; cat $i | grep -v "#"; done
****/Users/viaggarw/Documents/ELK/ELASTIC/datanode/node1/elasticsearch-6.2.4/config/elasticsearch.yml****
cluster.name: my-application
node.name: data-node-1
node.master: false
node.data: true
node.attr.boxtype: ssd
****/Users/viaggarw/Documents/ELK/ELASTIC/datanode/node2/elasticsearch-6.2.4/config/elasticsearch.yml****
cluster.name: my-application
node.name: data-node-2
node.master: false
node.data: true
node.attr.box_type: ssd
****/Users/viaggarw/Documents/ELK/ELASTIC/datanode/node3/elasticsearch-6.2.4/config/elasticsearch.yml****
cluster.name: my-application
node.name: data-node-3
node.master: false
node.data: true
node.attr.box_type: hdd
~~~

If while starting the processes you are hitting any error for the conflicting node ID then you need to delete the node ID :

~~~
rm -rf HOME/Documents/ELK/ELASTIC/<type of node>/elasticsearch-6.2.4/data/nodes/
~~~

After that try to start the process again, if failed for specific node then for that node only by copying the command from script. This should work now and it will create new unique node ID. 