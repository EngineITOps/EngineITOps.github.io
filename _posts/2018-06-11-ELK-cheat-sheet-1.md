---
layout: post
title: ELK Cheat Sheet
tags: [elasticserch, kibana, logstash, elk]
category: [ELK]
author: vikrant
comments: true
--- 

After deploying the multinode ES setup, I thought of issuing the various apis to see the results. I am categorizing this article as cheat sheet for ES. 

#### Check the health of cluster. 

a) Command for checking the health is: 

~~~
$ curl localhost:9200/_cat/health?v
epoch      timestamp cluster        status node.total node.data shards pri relo init unassign pending_tasks max_task_wait_time active_shards_percent
1528727477 20:01:17  my-application green           7         3     20  10    0    0        0             0                  -                100.0%
~~~

If you want to see the output which can be parsed using json then following command can be used. 

~~~
$ curl localhost:9200/_cluster/health?pretty
{
  "cluster_name" : "my-application",
  "status" : "green",
  "timed_out" : false,
  "number_of_nodes" : 7,
  "number_of_data_nodes" : 3,
  "active_primary_shards" : 10,
  "active_shards" : 20,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 0,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 100.0
}
~~~

b) If the cluster is showing RED state, next command would be to check the shard information for particular or all indices. In this case I have checked the output for one index only. 

~~~
$ curl localhost:9200/_cluster/health/logs-2018-06-08?level=shards | python -m json.tool
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1263  100  1263    0     0   143k      0 --:--:-- --:--:-- --:--:--  154k
{
    "active_primary_shards": 5,
    "active_shards": 10,
    "active_shards_percent_as_number": 100.0,
    "cluster_name": "my-application",
    "delayed_unassigned_shards": 0,
    "indices": {
        "logs-2018-06-08": {
            "active_primary_shards": 5,
            "active_shards": 10,
            "initializing_shards": 0,
            "number_of_replicas": 1,
            "number_of_shards": 5,
            "relocating_shards": 0,
            "shards": {
                "0": {
                    "active_shards": 2,
                    "initializing_shards": 0,
                    "primary_active": true,
                    "relocating_shards": 0,
                    "status": "green",
                    "unassigned_shards": 0
                },
                "1": {
                    "active_shards": 2,
                    "initializing_shards": 0,
                    "primary_active": true,
                    "relocating_shards": 0,
                    "status": "green",
                    "unassigned_shards": 0
                },
                "2": {
                    "active_shards": 2,
                    "initializing_shards": 0,
                    "primary_active": true,
                    "relocating_shards": 0,
                    "status": "green",
                    "unassigned_shards": 0
                },
                "3": {
                    "active_shards": 2,
                    "initializing_shards": 0,
                    "primary_active": true,
                    "relocating_shards": 0,
                    "status": "green",
                    "unassigned_shards": 0
                },
                "4": {
                    "active_shards": 2,
                    "initializing_shards": 0,
                    "primary_active": true,
                    "relocating_shards": 0,
                    "status": "green",
                    "unassigned_shards": 0
                }
            },
            "status": "green",
            "unassigned_shards": 0
        }
    },
    "initializing_shards": 0,
    "number_of_data_nodes": 3,
    "number_of_in_flight_fetch": 0,
    "number_of_nodes": 7,
    "number_of_pending_tasks": 0,
    "relocating_shards": 0,
    "status": "green",
    "task_max_waiting_in_queue_millis": 0,
    "timed_out": false,
    "unassigned_shards": 0
}
~~~


c) Check the overall cluster statistics. 

~~~
$ curl localhost:9200/_cluster/stats?pretty
{
  "_nodes" : {
    "total" : 7,
    "successful" : 7,
    "failed" : 0
  },
  "cluster_name" : "my-application",
  "timestamp" : 1528728321619,
  "status" : "green",
  "indices" : {
    "count" : 4,
    "shards" : {
      "total" : 20,
      "primaries" : 10,
      "replication" : 1.0,
      "index" : {
        "shards" : {
          "min" : 2,
          "max" : 10,
          "avg" : 5.0
        },
        "primaries" : {
          "min" : 1,
          "max" : 5,
          "avg" : 2.5
        },
        "replication" : {
          "min" : 1.0,
          "max" : 1.0,
          "avg" : 1.0
        }
      }
    },
    "docs" : {
      "count" : 522637,
      "deleted" : 1
    },
    "store" : {
      "size_in_bytes" : 247702199
    },
    "fielddata" : {
      "memory_size_in_bytes" : 0,
      "evictions" : 0
    },
    "query_cache" : {
      "memory_size_in_bytes" : 0,
      "total_count" : 0,
      "hit_count" : 0,
      "miss_count" : 0,
      "cache_size" : 0,
      "cache_count" : 0,
      "evictions" : 0
    },
    "completion" : {
      "size_in_bytes" : 0
    },
    "segments" : {
      "count" : 76,
      "memory_in_bytes" : 1830764,
      "terms_memory_in_bytes" : 1424277,
      "stored_fields_memory_in_bytes" : 150792,
      "term_vectors_memory_in_bytes" : 0,
      "norms_memory_in_bytes" : 58048,
      "points_memory_in_bytes" : 37527,
      "doc_values_memory_in_bytes" : 160120,
      "index_writer_memory_in_bytes" : 0,
      "version_map_memory_in_bytes" : 0,
      "fixed_bit_set_memory_in_bytes" : 0,
      "max_unsafe_auto_id_timestamp" : 1528614562327,
      "file_sizes" : { }
    }
  },
  "nodes" : {
    "count" : {
      "total" : 7,
      "data" : 3,
      "coordinating_only" : 0,
      "master" : 3,
      "ingest" : 4
    },
    "versions" : [
      "6.2.4"
    ],
    "os" : {
      "available_processors" : 56,
      "allocated_processors" : 56,
      "names" : [
        {
          "name" : "Mac OS X",
          "count" : 7
        }
      ],
      "mem" : {
        "total_in_bytes" : 120259084288,
        "free_in_bytes" : 1073172480,
        "used_in_bytes" : 119185911808,
        "free_percent" : 1,
        "used_percent" : 99
      }
    },
    "process" : {
      "cpu" : {
        "percent" : 0
      },
      "open_file_descriptors" : {
        "min" : 389,
        "max" : 433,
        "avg" : 407
      }
    },
    "jvm" : {
      "max_uptime_in_millis" : 4018792,
      "versions" : [
        {
          "version" : "1.8.0_162",
          "vm_name" : "Java HotSpot(TM) 64-Bit Server VM",
          "vm_version" : "25.162-b12",
          "vm_vendor" : "Oracle Corporation",
          "count" : 7
        }
      ],
      "mem" : {
        "heap_used_in_bytes" : 2716863288,
        "heap_max_in_bytes" : 7265714176
      },
      "threads" : 457
    },
    "fs" : {
      "total_in_bytes" : 499963170816,
      "free_in_bytes" : 179418669056,
      "available_in_bytes" : 172273414144
    },
    "plugins" : [
      {
        "name" : "ingest-geoip",
        "version" : "6.2.4",
        "description" : "Ingest processor that uses looksup geo data based on ip adresses using the Maxmind geo database",
        "classname" : "org.elasticsearch.ingest.geoip.IngestGeoIpPlugin",
        "extended_plugins" : [ ],
        "has_native_controller" : false,
        "requires_keystore" : false
      },
      {
        "name" : "analysis-icu",
        "version" : "6.2.4",
        "description" : "The ICU Analysis plugin integrates Lucene ICU module into elasticsearch, adding ICU relates analysis components.",
        "classname" : "org.elasticsearch.plugin.analysis.icu.AnalysisICUPlugin",
        "extended_plugins" : [ ],
        "has_native_controller" : false,
        "requires_keystore" : false
      }
    ],
    "network_types" : {
      "transport_types" : {
        "netty4" : 7
      },
      "http_types" : {
        "netty4" : 7
      }
    }
  }
}
~~~

#### Detail of indices

a) Command to check the indices present on system. 

~~~
$ curl localhost:9200/_cat/indices?pretty
green open packetbeat-6.2.4-2018.06.10 6UUP8wfuSvi7rA4mTfqhhQ 3 1  57187 0  35.2mb 17.6mb
green open logs-2018-06-08             FJmo1vEdTxuE57JZqPkXnQ 5 1 438154 0 192.7mb 95.7mb
green open .kibana                     Xra6Mzk6Rquxi_UEMApWDw 1 1      2 1  29.7kb 14.8kb
green open metricbeat-6.2.4-2018.06.10 yy4YaGDQQaaZ6M_tkQoUeA 1 1  27294 0   8.1mb    4m
~~~

b) Indices are divided into shards. logs-* index created with 5 shards and each shard have one replica. packetbeat created with 3 shards each with one replica. Metricbeat and kibana each one of them is created with one primary and one replica shard. 

~~~
$ curl localhost:9200/_cat/shards?pretty
logs-2018-06-08             4 r STARTED 87801 19.1mb 127.0.0.1 data-node-3
logs-2018-06-08             4 p STARTED 87801 19.1mb 127.0.0.1 data-node-2
logs-2018-06-08             2 p STARTED 87692 19.1mb 127.0.0.1 data-node-1
logs-2018-06-08             2 r STARTED 87692 19.1mb 127.0.0.1 data-node-2
logs-2018-06-08             3 r STARTED 87987 19.2mb 127.0.0.1 data-node-3
logs-2018-06-08             3 p STARTED 87987 19.2mb 127.0.0.1 data-node-1
logs-2018-06-08             1 r STARTED 87680 19.1mb 127.0.0.1 data-node-1
logs-2018-06-08             1 p STARTED 87680 19.1mb 127.0.0.1 data-node-2
logs-2018-06-08             0 p STARTED 86994   19mb 127.0.0.1 data-node-3
logs-2018-06-08             0 r STARTED 86994 20.3mb 127.0.0.1 data-node-1
packetbeat-6.2.4-2018.06.10 2 r STARTED 19139  5.9mb 127.0.0.1 data-node-3
packetbeat-6.2.4-2018.06.10 2 p STARTED 19139  5.9mb 127.0.0.1 data-node-2
packetbeat-6.2.4-2018.06.10 1 r STARTED 18975  5.8mb 127.0.0.1 data-node-1
packetbeat-6.2.4-2018.06.10 1 p STARTED 18975  5.8mb 127.0.0.1 data-node-2
packetbeat-6.2.4-2018.06.10 0 p STARTED 19073  5.8mb 127.0.0.1 data-node-3
packetbeat-6.2.4-2018.06.10 0 r STARTED 19073  5.8mb 127.0.0.1 data-node-1
metricbeat-6.2.4-2018.06.10 0 r STARTED 27294  4.1mb 127.0.0.1 data-node-3
metricbeat-6.2.4-2018.06.10 0 p STARTED 27294    4mb 127.0.0.1 data-node-2
.kibana                     0 p STARTED     2 14.8kb 127.0.0.1 data-node-3
.kibana                     0 r STARTED     2 14.8kb 127.0.0.1 data-node-2
~~~

c) Shards are further divided into the segments. 

~~~
$ curl localhost:9200/_cat/segments?pretty
.kibana                     0 p 127.0.0.1 _1    1     1 1    10kb  1924 true true 7.2.1 true
.kibana                     0 p 127.0.0.1 _2    2     1 0   4.4kb  1635 true true 7.2.1 true
.kibana                     0 r 127.0.0.1 _1    1     1 1    10kb  1924 true true 7.2.1 true
.kibana                     0 r 127.0.0.1 _2    2     1 0   4.4kb  1635 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _ly 790 18909 0   5.6mb 55377 true true 7.2.1 false
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _lz 791     3 0  22.4kb  9854 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _m0 792    24 0  18.6kb  4450 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _m1 793    12 0  14.4kb  4201 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _m2 794    10 0  52.3kb 18803 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _m3 795    29 0  52.4kb 18567 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _m4 796    37 0  22.5kb  5064 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _m5 797     1 0  21.6kb  9814 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _m6 798    48 0  25.6kb  5243 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _ly 790 18909 0   5.6mb 55377 true true 7.2.1 false
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _lz 791     3 0  22.4kb  9854 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _m0 792    24 0  18.6kb  4450 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _m1 793    12 0  14.4kb  4201 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _m2 794    10 0  52.3kb 18803 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _m3 795    29 0  52.4kb 18567 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _m4 796    37 0  22.5kb  5064 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _m5 797     1 0  21.6kb  9814 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _m6 798    48 0  25.6kb  5243 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 1 p 127.0.0.1 _ly 790 18885 0   5.6mb 55732 true true 7.2.1 false
packetbeat-6.2.4-2018.06.10 1 p 127.0.0.1 _lz 791     1 0  33.6kb 14101 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 1 p 127.0.0.1 _m0 792    53 0  37.6kb  9115 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 1 p 127.0.0.1 _m1 793     1 0  21.6kb  9814 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 1 p 127.0.0.1 _m2 794    35 0  41.3kb 13331 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 1 r 127.0.0.1 _ly 790 18885 0   5.6mb 55732 true true 7.2.1 false
packetbeat-6.2.4-2018.06.10 1 r 127.0.0.1 _lz 791     1 0  33.6kb 14101 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 1 r 127.0.0.1 _m0 792    53 0  37.6kb  9115 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 1 r 127.0.0.1 _m1 793     1 0  21.6kb  9814 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 1 r 127.0.0.1 _m2 794    35 0  41.3kb 13331 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _ly 790 18950 0   5.6mb 55871 true true 7.2.1 false
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _lz 791     4 0  22.7kb  9902 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _m0 792    21 0  18.1kb  4522 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _m1 793    20 0  17.5kb  4578 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _m2 794    11 0  54.5kb 20158 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _m3 795    41 0  69.4kb 23669 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _m4 796     2 0  34.6kb 14101 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _m5 797    47 0  57.8kb 17957 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 r 127.0.0.1 _m6 798    43 0  25.7kb  5211 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 p 127.0.0.1 _m8 800 18975 0   5.6mb 55875 true true 7.2.1 false
packetbeat-6.2.4-2018.06.10 2 p 127.0.0.1 _m9 801    20 0  17.5kb  4578 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 p 127.0.0.1 _ma 802     8 0  49.5kb 20118 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 p 127.0.0.1 _mb 803    43 0    70kb 22111 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 p 127.0.0.1 _mc 804     3 0  39.5kb 15764 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 p 127.0.0.1 _md 805    47 0  57.8kb 17957 true true 7.2.1 true
packetbeat-6.2.4-2018.06.10 2 p 127.0.0.1 _me 806    43 0  25.7kb  5211 true true 7.2.1 true
metricbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _pa 910 27133 0   3.9mb 24708 true true 7.2.1 false
metricbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _pb 911    32 0  32.2kb  4553 true true 7.2.1 true
metricbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _pc 912    32 0  32.2kb  4545 true true 7.2.1 true
metricbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _pd 913    32 0  32.2kb  4545 true true 7.2.1 true
metricbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _pe 914    33 0  32.5kb  4625 true true 7.2.1 true
metricbeat-6.2.4-2018.06.10 0 r 127.0.0.1 _pf 915    32 0  32.2kb  4537 true true 7.2.1 true
metricbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _pa 910 27262 0   3.9mb 24732 true true 7.2.1 false
metricbeat-6.2.4-2018.06.10 0 p 127.0.0.1 _pb 911    32 0  32.2kb  4537 true true 7.2.1 true
logs-2018-06-08             0 p 127.0.0.1 _0    0 86994 0    19mb 75067 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _1f  51 54280 0  11.6mb 51680 true true 7.2.1 false
logs-2018-06-08             0 r 127.0.0.1 _1y  70    44 0  56.6kb 21389 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _20  72  2380 0 763.1kb 24483 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _21  73  1155 0 423.8kb 23379 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _22  74 23459 0   5.4mb 41155 true true 7.2.1 false
logs-2018-06-08             0 r 127.0.0.1 _23  75   550 0 224.8kb 22426 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _24  76   410 0 180.3kb 20627 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _25  77  1308 0 480.5kb 23919 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _26  78  2174 0 723.6kb 25576 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _27  79   708 0 290.2kb 23265 true true 7.2.1 true
logs-2018-06-08             0 r 127.0.0.1 _28  80   526 0 207.4kb 20621 true true 7.2.1 true
logs-2018-06-08             1 p 127.0.0.1 _0    0 87680 0  19.1mb 75694 true true 7.2.1 true
logs-2018-06-08             1 r 127.0.0.1 _0    0 87680 0  19.1mb 75694 true true 7.2.1 true
logs-2018-06-08             2 r 127.0.0.1 _0    0 87692 0  19.1mb 76108 true true 7.2.1 true
logs-2018-06-08             2 p 127.0.0.1 _0    0 87692 0  19.1mb 76108 true true 7.2.1 true
logs-2018-06-08             3 r 127.0.0.1 _0    0 87987 0  19.2mb 76507 true true 7.2.1 true
logs-2018-06-08             3 p 127.0.0.1 _0    0 87987 0  19.2mb 76507 true true 7.2.1 true
logs-2018-06-08             4 r 127.0.0.1 _0    0 87801 0  19.1mb 76072 true true 7.2.1 true
logs-2018-06-08             4 p 127.0.0.1 _0    0 87801 0  19.1mb 76072 true true 7.2.1 true
~~~

#### Node level

a) Command shows all the API requests served by a node. In this case we are having client sitting in-front of master nodes hence only the client node with ID "swt2X8GqSdCkwUC745e4NQ" showing all usage information. 

~~~
$ curl localhost:9200/_nodes/usage?pretty
{
  "_nodes" : {
    "total" : 7,
    "successful" : 7,
    "failed" : 0
  },
  "cluster_name" : "my-application",
  "nodes" : {
    "X94nB2PdQUy-EyBiELInqA" : {
      "timestamp" : 1528728658482,
      "since" : 1528724323913,
      "rest_actions" : { }
    },
    "swt2X8GqSdCkwUC745e4NQ" : {
      "timestamp" : 1528728658482,
      "since" : 1528724323110,
      "rest_actions" : {
        "nodes_usage_action" : 3,
        "nodes_info_action" : 17,
        "remote_cluster_info_action" : 1,
        "cat_count_action" : 1,
        "nodes_stats_action" : 20,
        "cat_segments_action" : 1,
        "cat_health_action" : 1,
        "cat_fielddata_action" : 1,
        "document_get_action" : 1,
        "cluster_allocation_explain_action" : 2,
        "cluster_health_action" : 25,
        "main_action" : 8,
        "cluster_get_settings_action" : 1,
        "cat_shards_action" : 4,
        "cat_repositories_action" : 1,
        "cat_indices_action" : 3,
        "indices_stats_action" : 14,
        "cat_nodes_action" : 2,
        "cluster_state_action" : 20,
        "cluster_stats_action" : 1,
        "search_action" : 1,
        "cat_allocation_action" : 1,
        "cat_master_action" : 1,
        "list_tasks_action" : 2,
        "cat_threadpool_action" : 2,
        "cat_node_attrs_action" : 1
      }
    },
    "us0mhDnfRoqUpdpkbXGwUQ" : {
      "timestamp" : 1528728658482,
      "since" : 1528725100628,
      "rest_actions" : { }
    },
    "22JL9LkUQlm37e32ANB39A" : {
      "timestamp" : 1528728658482,
      "since" : 1528724322958,
      "rest_actions" : { }
    },
    "_dneR0H-Rr-yI5DsiO51_Q" : {
      "timestamp" : 1528728658482,
      "since" : 1528724322977,
      "rest_actions" : { }
    },
    "A7pzev_mR2W5n680Ump1Vg" : {
      "timestamp" : 1528728658482,
      "since" : 1528724323487,
      "rest_actions" : { }
    },
    "rUvTc-kUTyiT6wecuckC_w" : {
      "timestamp" : 1528728658482,
      "since" : 1528724323578,
      "rest_actions" : { }
    }
  }
}
~~~

b) If you recall from previous article, we have specified boxtype ssd for a two node and hdd for single node. We can check the attributes for all data nodes using this command. 
~~~
$ curl localhost:9200/_cat/nodeattrs?v
node        host      ip        attr     value
data-node-3 127.0.0.1 127.0.0.1 box_type hdd
data-node-2 127.0.0.1 127.0.0.1 box_type ssd
data-node-1 127.0.0.1 127.0.0.1 box_type  ssd
~~~

c) To get the CPU, memory and swap information from all nodes. 

~~~
$ curl localhost:9200/_nodes/stats/os?pretty
{
  "_nodes" : {
    "total" : 7,
    "successful" : 7,
    "failed" : 0
  },
  "cluster_name" : "my-application",
  "nodes" : {
    "X94nB2PdQUy-EyBiELInqA" : {
      "timestamp" : 1528728611241,
      "name" : "data-node-3",
      "transport_address" : "127.0.0.1:9306",
      "host" : "127.0.0.1",
      "ip" : "127.0.0.1:9306",
      "roles" : [
        "data",
        "ingest"
      ],
      "attributes" : {
        "box_type" : "hdd"
      },
      "os" : {
        "timestamp" : 1528728611241,
        "cpu" : {
          "percent" : 10,
          "load_average" : {
            "1m" : 4.15673828125
          }
        },
        "mem" : {
          "total_in_bytes" : 17179869184,
          "free_in_bytes" : 240017408,
          "used_in_bytes" : 16939851776,
          "free_percent" : 1,
          "used_percent" : 99
        },
        "swap" : {
          "total_in_bytes" : 5368709120,
          "free_in_bytes" : 1210318848,
          "used_in_bytes" : 4158390272
        }
      }
    },
    "swt2X8GqSdCkwUC745e4NQ" : {
      "timestamp" : 1528728611241,
      "name" : "master-node-3",
      "transport_address" : "127.0.0.1:9303",
      "host" : "127.0.0.1",
      "ip" : "127.0.0.1:9303",
      "roles" : [
        "master"
      ],
      "os" : {
        "timestamp" : 1528728611241,
        "cpu" : {
          "percent" : 10,
          "load_average" : {
            "1m" : 4.15673828125
          }
        },
        "mem" : {
          "total_in_bytes" : 17179869184,
          "free_in_bytes" : 240017408,
          "used_in_bytes" : 16939851776,
          "free_percent" : 1,
          "used_percent" : 99
        },
        "swap" : {
          "total_in_bytes" : 5368709120,
          "free_in_bytes" : 1210318848,
          "used_in_bytes" : 4158390272
        }
      }
    },
    "us0mhDnfRoqUpdpkbXGwUQ" : {
      "timestamp" : 1528728611241,
      "name" : "data-node-1",
      "transport_address" : "127.0.0.1:9305",
      "host" : "127.0.0.1",
      "ip" : "127.0.0.1:9305",
      "roles" : [
        "data",
        "ingest"
      ],
      "attributes" : {
        "boxtype" : "ssd"
      },
      "os" : {
        "timestamp" : 1528728611241,
        "cpu" : {
          "percent" : 10,
          "load_average" : {
            "1m" : 4.15673828125
          }
        },
        "mem" : {
          "total_in_bytes" : 17179869184,
          "free_in_bytes" : 240017408,
          "used_in_bytes" : 16939851776,
          "free_percent" : 1,
          "used_percent" : 99
        },
        "swap" : {
          "total_in_bytes" : 5368709120,
          "free_in_bytes" : 1210318848,
          "used_in_bytes" : 4158390272
        }
      }
    },
    "22JL9LkUQlm37e32ANB39A" : {
      "timestamp" : 1528728611241,
      "name" : "master-node-2",
      "transport_address" : "127.0.0.1:9302",
      "host" : "127.0.0.1",
      "ip" : "127.0.0.1:9302",
      "roles" : [
        "master"
      ],
      "os" : {
        "timestamp" : 1528728611241,
        "cpu" : {
          "percent" : 10,
          "load_average" : {
            "1m" : 4.15673828125
          }
        },
        "mem" : {
          "total_in_bytes" : 17179869184,
          "free_in_bytes" : 240017408,
          "used_in_bytes" : 16939851776,
          "free_percent" : 1,
          "used_percent" : 99
        },
        "swap" : {
          "total_in_bytes" : 5368709120,
          "free_in_bytes" : 1210318848,
          "used_in_bytes" : 4158390272
        }
      }
    },
    "_dneR0H-Rr-yI5DsiO51_Q" : {
      "timestamp" : 1528728611241,
      "name" : "master-node-1",
      "transport_address" : "127.0.0.1:9301",
      "host" : "127.0.0.1",
      "ip" : "127.0.0.1:9301",
      "roles" : [
        "master"
      ],
      "os" : {
        "timestamp" : 1528728611241,
        "cpu" : {
          "percent" : 10,
          "load_average" : {
            "1m" : 4.15673828125
          }
        },
        "mem" : {
          "total_in_bytes" : 17179869184,
          "free_in_bytes" : 240017408,
          "used_in_bytes" : 16939851776,
          "free_percent" : 1,
          "used_percent" : 99
        },
        "swap" : {
          "total_in_bytes" : 5368709120,
          "free_in_bytes" : 1210318848,
          "used_in_bytes" : 4158390272
        }
      }
    },
    "A7pzev_mR2W5n680Ump1Vg" : {
      "timestamp" : 1528728611241,
      "name" : "data-node-2",
      "transport_address" : "127.0.0.1:9304",
      "host" : "127.0.0.1",
      "ip" : "127.0.0.1:9304",
      "roles" : [
        "data",
        "ingest"
      ],
      "attributes" : {
        "box_type" : "ssd"
      },
      "os" : {
        "timestamp" : 1528728611241,
        "cpu" : {
          "percent" : 10,
          "load_average" : {
            "1m" : 4.15673828125
          }
        },
        "mem" : {
          "total_in_bytes" : 17179869184,
          "free_in_bytes" : 240017408,
          "used_in_bytes" : 16939851776,
          "free_percent" : 1,
          "used_percent" : 99
        },
        "swap" : {
          "total_in_bytes" : 5368709120,
          "free_in_bytes" : 1210318848,
          "used_in_bytes" : 4158390272
        }
      }
    },
    "rUvTc-kUTyiT6wecuckC_w" : {
      "timestamp" : 1528728611241,
      "name" : "client-node-1",
      "transport_address" : "127.0.0.1:9300",
      "host" : "127.0.0.1",
      "ip" : "127.0.0.1:9300",
      "roles" : [
        "ingest"
      ],
      "os" : {
        "timestamp" : 1528728611241,
        "cpu" : {
          "percent" : 10,
          "load_average" : {
            "1m" : 4.15673828125
          }
        },
        "mem" : {
          "total_in_bytes" : 17179869184,
          "free_in_bytes" : 240017408,
          "used_in_bytes" : 16939851776,
          "free_percent" : 1,
          "used_percent" : 99
        },
        "swap" : {
          "total_in_bytes" : 5368709120,
          "free_in_bytes" : 1210318848,
          "used_in_bytes" : 4158390272
        }
      }
    }
  }
}
~~~

d) To summarize the disk information from all data nodes. 

~~~
$ curl localhost:9200/_cat/allocation?v
shards disk.indices disk.used disk.avail disk.total disk.percent host      ip        node
     6       89.5mb   305.3gb    160.2gb    465.6gb           65 127.0.0.1 127.0.0.1 data-node-1
     7       73.4mb   305.3gb    160.2gb    465.6gb           65 127.0.0.1 127.0.0.1 data-node-3
     7       73.2mb   305.3gb    160.2gb    465.6gb           65 127.0.0.1 127.0.0.1 data-node-2
~~~
