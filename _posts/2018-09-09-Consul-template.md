---
layout: post
title: How to use consul template to configure haproxy dynamically?
tags: [consul]
category: [consul]
author: vikrant
comments: true
--- 

In previous article, I have provided the basic setup information related to consul. In this article, I am going to show the practical implementation of consul templates. Many things covered in this article can be taken care in more automatic way but I was happy to do them manually for understanding each step.

All components are running as docker containers. 

- Create four docker machines for this exercise. 

~~~
docker-machine create consulserver1
docker-machine create consulclient1
docker-machine create consulclient2
docker-machine create consulhaproxy1
~~~

We will run the following container on these machines:

consulserver1 => consulserver1 (consul server)
consulclient1 => consulagent1 (consul client), web1 (nginx container)
consulclient2 => consulagent2 (consul client), web2 (nginx container)
consulhaproxy1 => consulhaproxy1 (consul client), haproxy (haproxy container which is load balancer)


- Create the following file on all docker-machines and `/home/docker/data` directory only on consulserver1. 

~~~
cat <<EOF > /home/docker/conf.json
{
"datacenter":"labsetup",
"enable_debug":true
}
EOF
~~~

- Start the containers on respective nodes. 

~~~
docker-machine ssh consulserver1
docker run -d --net=host -v /home/docker/conf.json:/consul/config/config.json -v /home/docker/data/:/consul/data/ -e CONSUL_BIND_INTERFACE=eth1 -e CONSUL_CLIENT_INTERFACE=eth1 --name=consulserver1 -d consul agent -ui -server -bootstrap-expect=1

docker-machine ssh consulclient1
docker run -d --net=host -e 'CONSUL_LOCAL_CONFIG={"leave_on_terminate": true}' -v /home/docker/conf.json:/consul/config/config.json --name=consulagent1 consul agent --retry-join=192.168.99.101 -bind=192.168.99.102

docker-machine ssh consulclient2
docker run -d --net=host -e 'CONSUL_LOCAL_CONFIG={"leave_on_terminate": true}' -v /home/docker/conf.json:/consul/config/config.json --name=consulagent2 consul agent --retry-join=192.168.99.101 -bind=192.168.99.103

docker-machine ssh consulhaproxy1
docker run -d --net=host -e 'CONSUL_LOCAL_CONFIG={"leave_on_terminate": true}' -v /home/docker/conf.json:/consul/config/config.json --name=consulhaproxy1 consul agent --retry-join=192.168.99.101 -bind=192.168.99.104
~~~

- Check the membership of consul cluster. 

~~~
docker@consulserver1:~$ docker exec -it b82b3f464b23 consul members --http-addr=192.168.99.101:8500
Node            Address              Status  Type    Build  Protocol  DC        Segment
consulserver1   192.168.99.101:8301  alive   server  1.2.2  2         labsetup  <all>
consulclient1   192.168.99.102:8301  alive   client  1.2.2  2         labsetup  <default>
consulclient2   192.168.99.103:8301  alive   client  1.2.2  2         labsetup  <default>
consulhaproxy1  192.168.99.104:8301  alive   client  1.2.2  2         labsetup  <default>
~~~

- Start the nginx containers on consulclient1 and consulclient2. I have changed the default nginx page with simple custom html file which will show the ipaddress and hostname of node. 

~~~
docker-machine ssh consulclient1
ip=$(ifconfig eth1 | grep 'inet addr:' | awk -F: '{print $2}' | awk '{print $1}')
echo "<h1>$ip $(hostname)</h1>" > ip.html
docker run -d --name web1 -p 8080:80 --restart unless-stopped -v /home/docker/ip.html:/usr/share/nginx/html/index.html:ro nginx

ip=$(ifconfig eth1 | grep 'inet addr:' | awk -F: '{print $2}' | awk '{print $1}')
echo "<h1>$ip $(hostname)</h1>" > ip.html
docker run -d --name web2 -p 8080:80 --restart unless-stopped -v /home/docker/ip.html:/usr/share/nginx/html/index.html:ro nginx
~~~

- Created haproxy.cfg file to route the request to two nginx containers. 

~~~
cat <<EOF > haproxy.cfg
global
  maxconn 4096
defaults
  mode http
  timeout connect 5s
  timeout client 50s
  timeout server 50s
listen http-in
  bind *:80
  server web1 192.168.99.102:8080
  server web2 192.168.99.103:8080
EOF
~~~

- Start the haproxy container using the above haproxy.cfg file and verify from the browser or from CLI using curl that request is getting routed to both containers. 

~~~
docker-machine ssh consulhaproxy1
docker run -d --name haproxy -p 80:80 --restart unless-stopped -v /home/docker/haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro haproxy
~~~

#### Configure service health check

- Our haproxy request is getting routed to available nginx containers but we don't have any mechaism in-place to check the health of containers. Login into the consul client docker container. 

~~~
$ docker-machine ssh consulclient1
$ docker exec -it consulagent1 sh

$ cat <<EOF > agent1payload.json
{
  "Name": "web",
  "address": "192.168.99.102",
  "port": 8080,
  "Check": {
     "http": "http://192.168.99.102:8080",
     "interval": "5s"
  }
}
EOF
~~~

Configure the healthcheck. It's important to issue the command on a node where your service is running hence I issued this command from consul client container. 

~~~
$ curl --request PUT --data @agentpayload1.json http://127.0.0.1:8500/v1/agent/service/register
~~~

- On consulclient2 do the same from consulagent2 consul client container. 

~~~
$ docker-machine ssh consulclient2
$ docker exec -it consulagent2 sh

$ cat <<EOF > agent2payload.json
{
  "Name": "web",
  "address": "192.168.99.103",
  "port": 8080,
  "Check": {
     "http": "http://192.168.99.103:8080",
     "interval": "5s"
  }
}
EOF

$ curl --request PUT --data @agentpayload2.json http://127.0.0.1:8500/v1/agent/service/register
~~~

Verify that UI is showing two services and for both services health check should return green status. 

#### Use consul template to make haproxy intelligent

NOTE: Important part of this setup is taken from the blog [1], [2]

Now if one of the nginx container is getting failed we don't have any way to let haproxy know about that failure. Instead of using haproxy to insert that intelligent in this case we will be using consul templates for configuration.  

~~~
cat <<EOF > haproxy.cfg
global
  maxconn 4096
defaults
  mode http
  timeout connect 5s
  timeout client 50s
  timeout server 50s
listen http-in
  bind *:80
  server web1 192.168.99.102:8080
  server web2 192.168.99.103:8080
EOF
~~~

Taking reference of original haproxy.cfg file following consul tempalte file is created for dynamically updating the haproxy.cfg file. web is the name of service. 

~~~
cat <<EOF > haproxy.tmpl
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

  stats enable
  stats uri /haproxy
  stats refresh 5s
EOF
~~~

- Here is the original reference file which is using the above template file and letting it know what's the location of haproxy.cfg file which it supposed to update dynamically. 

~~~
cat <<EOF > lb-consul-template.hcl
template {
  source = "/etc/haproxy/haproxy.tmpl"
  destination = "/etc/haproxy/haproxy.cfg"
  command = "/hap.sh"
}
EOF
~~~

- Way of reloading haproxy service on change of haproxy.cfg file. 

~~~
cat <<EOF > hap.sh
#!/bin/bash

haproxy -f /etc/haproxy/haproxy.cfg -p /var/run/haproxy.pid -D -st $(cat /var/run/haproxy.pid)
EOF
~~~

- Start script to run the service.  

~~~
#!/bin/bash

HAPROXY="/etc/haproxy"
PIDFILE="/var/run/haproxy.pid"
CONFIG_FILE=${HAPROXY}/haproxy.cfg

cd "$HAPROXY"

haproxy -f "$CONFIG_FILE" -p "$PIDFILE" -D -st $(cat $PIDFILE)

/usr/local/bin/consul-template -consul=${CONSUL_ADDRESS} -config=/lb-consul-template.hcl
~~~

- We will be creating custom haproxy docker image which will include the consul-template binary along with the above files. 

~~~
cat <<EOF > Dockerfile
FROM ubuntu:14.04
RUN \
  apt-get update && \
  apt-get install -y software-properties-common && \
  add-apt-repository ppa:vbernat/haproxy-1.6 && \
  apt-get install -y wget curl unzip && \
  apt-get install -y haproxy
ENV CONSUL_TEMPLATE_VERSION=0.11.1
ENV CONSUL_TEMPLATE_FILE=consul-template_${CONSUL_TEMPLATE_VERSION}_linux_amd64.zip
ENV CONSUL_TEMPLATE_URL="https://releases.hashicorp.com/consul-template/${CONSUL_TEMPLATE_VERSION}/${CONSUL_TEMPLATE_FILE}"

ADD haproxy.cfg /etc/haproxy/haproxy.cfg
ADD lb-consul-template.hcl /lb-consul-template.hcl

ADD startup.sh /startup.sh
RUN chmod u+x /startup.sh

ADD hap.sh /hap.sh
RUN chmod u+x /hap.sh

WORKDIR /tmp
RUN wget $CONSUL_TEMPLATE_URL && \
  unzip $CONSUL_TEMPLATE_FILE && \
  mv consul-template /usr/local/bin/consul-template && \
  chmod a+x /usr/local/bin/consul-template

ADD haproxy.tmpl /etc/haproxy/haproxy.tmpl
ADD lb-consul-template.hcl /lb-consul-template.hcl

WORKDIR /

CMD ["/startup.sh"]
EOF
~~~

- Build the image. 

~~~
docker@consulhaproxy1:~/haproxyimagebuild$ docker build -t haproxy:ct .
~~~

- Use the created image to start haproxy container. 

~~~
docker@consulhaproxy1:~/haproxyimagebuild$ docker run -d --name haproxy -p 80:80 -e CONSUL_ADDRESS=192.168.99.101:8500 --restart unless-stopped haproxy:ct
eded5099ee05d6ca5d030ccc6e95f195ccdc769e5713432a6ad001d09183966f

docker@consulhaproxy1:~/haproxyimagebuild$ docker exec -it eded5099ee05d6ca5d030ccc6e95f195ccdc769e5713432a6ad001d09183966f bash
~~~

- If you want to see realtime action then issue this command inside the haproxy container. 

~~~
docker@consulhaproxy1:~/haproxyimagebuild$ /usr/local/bin/consul-template -consul=192.168.99.101:8500 -config=/lb-consul-template.hcl --dry
~~~

From another terminal stop the web1 or web2 container you will see the content of haproxy.cfg dynamically updates. 

[1] http://www.smartjava.org/content/service-discovery-docker-and-consul-part-1
[2] http://www.smartjava.org/content/service-discovery-docker-and-consul-part-2