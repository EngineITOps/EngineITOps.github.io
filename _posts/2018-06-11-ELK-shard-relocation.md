---
layout: post
title: Understanding ELK Shard relocation
tags: [elasticserch, kibana, logstash, elk]
category: [ELK]
author: vikrant
comments: true
--- 

In this article, I will be sharing some useful ES tips. I will be keep on adding the tips to this article over the peroid of time. 

#### Relocating the shards off data node

If you have read the other articles of this series you may know that we have set the node box_type attribute ssd on two nodes and hdd on one data node. 

For logs-* indices we have 5 primary shard and among these primary shards one shard was allocated on data-node-3 which has box_type attribued hdd. I wanted to move all shards including primary and replica off data-node-3 for logs-* indices. we just need to include the box_type in exclude option. 

~~~
curl -XPUT http://localhost:9200/logs-2018-06-08/_settings -d '
{
  "index.routing.allocation.exclude.box_type": "hdd"
}'
~~~

More information about this approach can be find in the below link

https://www.elastic.co/guide/en/elasticsearch/reference/current/shard-allocation-filtering.html

If you have not added the attribute in your cluster then you need to manually reroute the shard following below link but you need to do this for each shard manually.

https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster-reroute.html

#### Avoid replica shard re-balancing on data node shutdown

When data node goes down in the ES cluster. Following steps happen to recover the shards.

~~~
Data Node 5 loses network connectivity.
The master promotes a replica shard to primary for each primary that was on Node 5.
The master allocates new replicas to other nodes in the cluster.
Each new replica makes an entire copy of the primary shard across the network.
More shards are moved to different nodes to rebalance the cluster.
Node 5 returns after a few minutes.
The master rebalances the cluster by allocating shards to Node 5. 
~~~

Movement of data from data node 5 to other available data node is an expensive resource operation. I found two methods to avoid it. First is disabling the routing and second one is delaying the reallocation. 

###### Disable the routing

a) Disable the routing allocation. It's a temporary setting which means after restart it will not persist. 

~~~
curl -XPUT http://localhost:9200/_cluster/settings -d '
{
  "transient" : {
  	"cluster.routing.allocation.enable": "none"
  }
}'
~~~

b) Stop the data node. Only action will be taken for primary shards hosted on data node, you will see that replica nodes on other available data nodes are promoted to primary replica. Replica shards available on stopped data node will not move to any other node. Replica shards remain in UNASSIGNED state. 

c) Once the activity is completed on data node and it's up still replica shards will not get assigned to that node. After changing the setting to all, replica shards will be allocated to data node. 

~~~
curl -XPUT http://localhost:9200/_cluster/settings -d '
{
  "transient" : {
  	"cluster.routing.allocation.enable": "all"
  }
}'
~~~

###### Delayed the routing

a) The allocation of replica shards which become unassigned because a node has left can be delayed with the index.unassigned.node_left.delayed_timeout dynamic setting, which defaults to 1m.

~~~
curl -XPUT  http://localhost:9200/_all/_settings -d '
{
  "settings": {
    "index.unassigned.node_left.delayed_timeout": "5m"
  }
}'
~~~

Stopped the data-node-2 and we can see that 7 replica shards are in unassigned state but the count of primary shards is intact. 

~~~
$ curl localhost:9200/_cluster/health?pretty
{
  "cluster_name" : "my-application",
  "status" : "yellow",
  "timed_out" : false,
  "number_of_nodes" : 6,
  "number_of_data_nodes" : 2,
  "active_primary_shards" : 10,
  "active_shards" : 13,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 7,
  "delayed_unassigned_shards" : 7,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 65.0
}
~~~

After 5 mins it will automatically start rebalancing the shards.

~~~
$ curl localhost:9200/_cluster/health?pretty
{
  "cluster_name" : "my-application",
  "status" : "yellow",
  "timed_out" : false,
  "number_of_nodes" : 6,
  "number_of_data_nodes" : 2,
  "active_primary_shards" : 10,
  "active_shards" : 15,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 5,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 75.0
}
~~~


b)  If the missing node rejoins the cluster, and its shards still have the same sync-id as the primary, shard relocation will be cancelled and the synced shard will be used for recovery instead. Cancelling recovery in favour of the synced shard is cheap.