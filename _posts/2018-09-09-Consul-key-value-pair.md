---
layout: post
title: How to use consul key/value pair in configuration file?
tags: [consul]
category: [consul]
author: vikrant
comments: true
--- 

Consul key/value pair feature is similar to what we have in zookeeper or etcd. This article is in continution from the [previous one](https://ervikrant06.github.io/consul/Consul-template/). 

- I have created the following key/pairs using the consul UI. 

~~~
/ # consul kv export --http-addr=192.168.99.101:8500 testbed/
[
  {
    "key": "testbed/",
    "flags": 0,
    "value": ""
  },
  {
    "key": "testbed/haproxy/",
    "flags": 0,
    "value": ""
  },
  {
    "key": "testbed/haproxy/maxconn",
    "flags": 0,
    "value": "MTA5Ng=="
  },
  {
    "key": "testbed/haproxy/stats",
    "flags": 0,
    "value": "ZGlzYWJsZQ=="
  },
  {
    "key": "testbed/haproxy/timeout connect",
    "flags": 0,
    "value": "MTBz"
  }
]
~~~

- In the running container made the following change in haproxy.cfg file. I have just changed the value of stats to make it configurable through key/value pairs. 

~~~
root@eded5099ee05:/# cat /etc/haproxy/haproxy.tmpl
global
  maxconn 4096
defaults
  mode http
  timeout connect 5s
  timeout client 50s
  timeout server 50s
listen http-in
  bind *:80{{range service "web"}}
  server {{.Node}} {{.Address}}:{{.Port}}{{end}}

  stats {{key "testbed/haproxy/stats"}}
  stats uri /haproxy
  stats refresh 5s
~~~

- After making above change logout from docker and do the docker stop/start to bring that change into effect. 

- Issue the following command to see the live action, change the stats parameter either using API or consul UI and you will see the value of stats changed accrodingly instantaneously. 

~~~
root@eded5099ee05:/# /usr/local/bin/consul-template -consul=192.168.99.101:8500 -config=/lb-consul-template.hcl --dry
> /etc/haproxy/haproxy.cfg
global
  maxconn 4096
defaults
  mode http
  timeout connect 5s
  timeout client 50s
  timeout server 50s
listen http-in
  bind *:80
  server consulclient1 192.168.99.102:8080
  server consulclient2 192.168.99.103:8080

  stats enable
  stats uri /haproxy
  stats refresh 5s



> /etc/haproxy/haproxy.cfg
global
  maxconn 4096
defaults
  mode http
  timeout connect 5s
  timeout client 50s
  timeout server 50s
listen http-in
  bind *:80
  server consulclient1 192.168.99.102:8080
  server consulclient2 192.168.99.103:8080

  stats disable
  stats uri /haproxy
  stats refresh 5s  
~~~  