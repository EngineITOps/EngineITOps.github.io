---
layout: post
title: How to add external consul client to consul running on K8
tags: [consul, kubernetes]
category: [consul, kubernetes]
author: vikrant
comments: true
--- 

From the previous article, we already have consul setup consists of 3 consul servers and 1 consul agent running on minikube kubernetes. I thought of adding the external consul client to the consul setup. For that I created one docker-machine and start consul in agent mode on it but it didn't join with consul k8 setup. 

~~~
docker@consul1:~$ docker run -d --rm --net=host consul agent --retry-join=192.168.99.100:8500 -bind=192.168.99.101
3089289082ff67004bf42779bef3bb9f24932513006eb5cd1887fbbba8f4eb11

docker@consul1:~$ docker logs 3089289082ff
==> Starting Consul agent...
==> Consul agent running!
           Version: 'v1.2.3'
           Node ID: '466beff1-bff8-db5c-2ec6-e98a6a740d5e'
         Node name: 'consul1'
        Datacenter: 'dc1' (Segment: '')
            Server: false (Bootstrap: false)
       Client Addr: [127.0.0.1] (HTTP: 8500, HTTPS: -1, DNS: 8600)
      Cluster Addr: 192.168.99.101 (LAN: 8301, WAN: 8302)
           Encrypt: Gossip: false, TLS-Outgoing: false, TLS-Incoming: false

==> Log data will now stream in as it occurs:

    2018/10/06 08:25:08 [INFO] serf: EventMemberJoin: consul1 192.168.99.101
    2018/10/06 08:25:08 [INFO] agent: Started DNS server 127.0.0.1:8600 (udp)
    2018/10/06 08:25:08 [INFO] agent: Started DNS server 127.0.0.1:8600 (tcp)
    2018/10/06 08:25:08 [INFO] agent: Started HTTP server on 127.0.0.1:8500 (tcp)
    2018/10/06 08:25:08 [INFO] agent: started state syncer
    2018/10/06 08:25:08 [INFO] agent: Retry join LAN is supported for: aliyun aws azure digitalocean gce k8s os packet scaleway softlayer triton vsphere
    2018/10/06 08:25:08 [INFO] agent: Joining LAN cluster...
    2018/10/06 08:25:08 [INFO] agent: (LAN) joining: [192.168.99.100:8500]
    2018/10/06 08:25:08 [WARN] manager: No servers available
    2018/10/06 08:25:08 [ERR] agent: failed to sync remote state: No known Consul servers
~~~

I am using minikube ip 192.168.99.100 and the port 8500 which is exposed by consul client running on K8 to host machine. Here is the chunk from helm consul template. 

~~~
          ports:
            - containerPort: 8500
              hostPort: 8500
              name: http
            - containerPort: 8301
              name: serflan
            - containerPort: 8302
              name: serfwan
            - containerPort: 8300
              name: server
            - containerPort: 8600
              name: dns-tcp
              protocol: "TCP"
            - containerPort: 8600
              name: dns-udp
              protocol: "UDP"
~~~     

I have opened an issue [1] in github.

[1] https://github.com/hashicorp/consul-helm/issues/23 