---
layout: post
title: How to make haproxy template file to use the services from both DCs?
tags: [consul]
category: [consul]
author: vikrant
comments: true
--- 

This post is in contiuntion from the previous post, in this article I will be demonstrating the dynamic update of haproxy file with services located across difference DCs. In one of my [earlier post](https://ervikrant06.github.io/consul/Consul-template/) I have created haproxy image taking reference from a blog. I have started the haproxy container using the image. After starting the image, I modified the template file inside the container to look like below which is from one of the awesome course [1] which I attended on pluralsite. 

- Make the following modification in haproxy template file. 

~~~
root@55f96a396f4b:/# cat /etc/haproxy/haproxy.tmpl
global
  maxconn 4096
defaults
  mode http
  timeout connect 5s
  timeout client 50s
  timeout server 50s
listen http-in
  options allbackups
  bind *:80{{range service "web"}}
  server {{.Node}} {{.Address}}:{{.Port}}{{end}}
  {{range datacenters}}{{range service (print "web@" .) }}
  server {{ .Node}} {{.Address}}:{{.Port}} backup{{end}}
  {{end}}

  stats enable
  stats uri /haproxy
  stats refresh 5s
~~~

- Stop/start the haproxy container. 

- stop the nginx container on the lab1server consul client node and keep an eye on template file using the following command. Stop the nginx container running on lab1setup DC consul client. File will be dynamically updated with nginx service running consul client of lab2setup DC. 

~~~


root@55f96a396f4b:/# cat /etc/haproxy/haproxy.cfg
global
  maxconn 4096
defaults
  mode http
  timeout connect 5s
  timeout client 50s
  timeout server 50s
listen http-in
  options allbackups
  bind *:80
  server consulhaproxy1 192.168.99.104:8080

  server consulhaproxy1 192.168.99.104:8080 backup

  server consulclient2 192.168.99.103:8080 backup


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
  options allbackups
  bind *:80


  server consulclient2 192.168.99.103:8080 backup


  stats enable
  stats uri /haproxy
  stats refresh 5s
~~~

[1] https://github.com/g0t4/consul-getting-started/tree/master/provision  