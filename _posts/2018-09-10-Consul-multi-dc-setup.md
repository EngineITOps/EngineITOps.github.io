---
layout: post
title: How to run multi datacenter setup using consul?
tags: [consul]
category: [consul]
author: vikrant
comments: true
--- 

In the previous articles, we have discussed about the consul deployment and consul templates. In this article, I am going to use four docker machines to create two DCs. 

~~~
DC : lab1setup

consullab1server1 - Consul server container. (192.168.99.101)
consullab1client1 - Consul client, nginx, haproxy containers (192.168.99.104)

DC : lab2setup

consullab2server1 - Consul server container (192.168.99.102)
consullab2client1 - Consul client, nginx containers (192.168.99.103)
~~~

#### lab1setup DC preparation

- Login into the consullab1server1 node to start the consul server container. 

~~~
docker-machine ssh consullab1server1

cat <<EOF > /home/docker/conf.json
{
"datacenter":"lab1setup",
"enable_debug":true
}
EOF

mkdir /home/docker/data

docker@consullab1server1:~$ docker run -d --net=host -v /home/docker/conf.json:/consul/config/config.json -v /home/docker/data/:/consul/data/ -e CONSUL_BIND_INTERFACE=eth1 -e CONSUL_CLIENT_INTERFACE=eth1 -d consul agent -ui -server -bootstrap-expect=1
923d1bac2dce796ff744cb84d434ddb7ac50eadb771ae4d3546a132ef46f62f8
~~~

-  Login into the consullab1client1 node to start the three containers 

a) consul client container
b) nginx container
c) haproxy container

~~~
docker-machine ssh consullab1client1

cat <<EOF > ip.html
<h1>192.168.99.104 lab1client1 lab1setup</h1>
EOF

docker run -d --net=host -e 'CONSUL_LOCAL_CONFIG={"leave_on_terminate": true}' -v /home/docker/conf.json:/consul/config/config.json --name=consulagent1 consul agent --retry-join=192.168.99.102 -bind=192.168.99.103

docker run -d --name web1 -p 8080:80 --restart unless-stopped -v /home/docker/ip.html:/usr/share/nginx/html/index.html:ro nginx
00735cf3d093f51b2c3ff5f9ebacedbc3aac9a7a10606208b22da24362028a93

docker run -d --name haproxy -p 80:80 -e CONSUL_ADDRESS=192.168.99.101:8500 --restart unless-stopped haproxy:ct
~~~

- Verify that consul server is showing both client and server in output. 

~~~
docker@consullab1server1:~$ docker exec -it 923d1bac2dce796ff744cb84d434ddb7ac50eadb771ae4d3546a132ef46f62f8 consul members --http-addr=192.168.99.101:8500
Node            Address              Status  Type    Build  Protocol  DC         Segment
consullab1server1   192.168.99.101:8301  alive   server  1.2.2  2         lab1setup  <all>
consullab1client1  192.168.99.104:8301  alive   client  1.2.2  2         lab1setup  <default>
~~~

#### lab2setup DC preparation:

- Login into the consullab1server1 node to start the consul server container. 

~~~
docker-machine ssh consullab2server1
cat <<EOF > conf.json
{
"datacenter":"lab2setup",
"enable_debug":true
}
EOF

docker run -d --net=host -v /home/docker/conf.json:/consul/config/config.json -v /home/docker/data/:/consul/data/ -e CONSUL_BIND_INTERFACE=eth1 -e CONSUL_CLIENT_INTERFACE=eth1 -d consul agent -ui -server -bootstrap-expect=1
~~~

- Login into the consullab2client1 to start nginx and consulclient container. Note: on lab2setup DC consul client node we didn't start the haproxy container. 

~~~
cat <<EOF > ip.html
<h1>192.168.99.103 lab2client1 lab2setup</h1>
EOF

docker run -d --net=host -e 'CONSUL_LOCAL_CONFIG={"leave_on_terminate": true}' -v /home/docker/conf.json:/consul/config/config.json --name=consulagent1 consul agent --retry-join=192.168.99.102 -bind=192.168.99.103

docker run -d --name web1 -p 8080:80 --restart unless-stopped -v /home/docker/ip.html:/usr/share/nginx/html/index.html:ro nginx
00735cf3d093f51b2c3ff5f9ebacedbc3aac9a7a10606208b22da24362028a93
~~~

- Verify that lab2setup consul server is showing both members present in cluster. 

~~~
docker@consullab2server1:~$ docker exec -it 69e7b8627e73 consul members --http-addr=192.168.99.102:8500
Node           Address              Status  Type    Build  Protocol  DC         Segment
consullab2server1  192.168.99.102:8301  alive   server  1.2.2  2         lab2setup  <all>
consullab2client1  192.168.99.103:8301  alive   client  1.2.2  2         lab2setup  <default>
~~~

#### Register nginx service running on client of both DC.

- Registering web service along with health check by logging into the consullab1client1 lab1setup DC.

~~~
docker-machine ssh consullab1client1
docker exec -it <consul client container id> sh

cat <<EOF > agent1payload.json
{
  "Name": "web",
  "address": "192.168.99.104",
  "port": 8080,
  "Check": {
     "http": "http://192.168.99.104:8080",
     "interval": "5s"
  }
}
EOF

/ # curl --request PUT --data @agent1payload.json http://127.0.0.1:8500/v1/agent/service/register
~~~

- Registering web service along with health check by logging into the consullab2client1 lab2setup DC.

~~~
docker-machine ssh consullab2client1
docker exec -it <consul client container id> sh
cat <<EOF > agent2payload.sh
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

curl --request PUT --data @agent2payload.sh http://127.0.0.1:8500/v1/agent/service/register
~~~

#### Add lab2setup into lab1setup DC:

- Use the following command to add the lab2setup into the lab1setup. 

~~~
docker@consullab1server1:~$ docker exec -it 923d1bac2dce796ff744cb84d434ddb7ac50eadb771ae4d3546a132ef46f62f8 consul join -wan --http-addr=192.168.99.101:8500 192.168.99.102:8302
Successfully joined cluster by contacting 1 nodes.
~~~

- Verify that both DCs are shown while hitting the datacenters API endpoint using consul server of lab1setup DC. 

~~~
docker@consullab1server1:~$ curl http://192.168.99.101:8500/v1/catalog/datacenters?pretty
[
    "lab1setup",
    "lab2setup"
]
~~~

- Check the list of nodes present in each datacenter. 

~~~
docker@consullab1server1:~$ curl http://192.168.99.101:8500/v1/catalog/nodes?dc=lab1setup'&'pretty
[
    {
        "ID": "43725e27-41c0-7372-842a-408a0470898d",
        "Node": "consullab1client1",
        "Address": "192.168.99.104",
        "Datacenter": "lab1setup",
        "TaggedAddresses": {
            "lan": "192.168.99.104",
            "wan": "192.168.99.104"
        },
        "Meta": {
            "consul-network-segment": ""
        },
        "CreateIndex": 6242,
        "ModifyIndex": 6243
    },
    {
        "ID": "c78a09c0-5cf1-268c-5d2b-567a752dde3a",
        "Node": "consullab1server1",
        "Address": "192.168.99.101",
        "Datacenter": "lab1setup",
        "TaggedAddresses": {
            "lan": "192.168.99.101",
            "wan": "192.168.99.101"
        },
        "Meta": {
            "consul-network-segment": ""
        },
        "CreateIndex": 5,
        "ModifyIndex": 6220
    }
]

docker@consullab1server1:~$ curl http://192.168.99.101:8500/v1/catalog/nodes?dc=lab2setup'&'pretty
[
    {
        "ID": "9777daf7-71c3-f25a-5673-d25635a04ac7",
        "Node": "consullab2server1",
        "Address": "192.168.99.102",
        "Datacenter": "lab2setup",
        "TaggedAddresses": {
            "lan": "192.168.99.102",
            "wan": "192.168.99.102"
        },
        "Meta": {
            "consul-network-segment": ""
        },
        "CreateIndex": 5,
        "ModifyIndex": 6
    },
    {
        "ID": "a5d1896b-5b3b-c137-5cdc-bbdb200c26af",
        "Node": "consullab2client1",
        "Address": "192.168.99.103",
        "Datacenter": "lab2setup",
        "TaggedAddresses": {
            "lan": "192.168.99.103",
            "wan": "192.168.99.103"
        },
        "Meta": {
            "consul-network-segment": ""
        },
        "CreateIndex": 16,
        "ModifyIndex": 17
    }
]
~~~


Conclusion: We have configured two DCs and then connected both DCs. 