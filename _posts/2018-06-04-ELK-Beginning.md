---
layout: post
title: ELK Beginning - 101
tags: [elasticsearch, logstash, kibana, elk]
category: [ELK]
author: vikrant
comments: true
---	

I recently started learning the ELK stack. Best source of information which I found is the official documentation provided by Elasticsearch.co While reading the ELK I found the new component.. okay not new but which is relatively new to existing ELK stack is beats. I covered beat also in my study notes. In this series I will be providing the setup information and various other hacks related to ELK. 

Before proceeding further first thing coming to my mind was to prepare the lab setup. I am using MAC hence I looked for various options to start with learning. 

Initially for practice purpose, I direcly started the binary files of ELK and Beats on MAC which was very helpful me to learn the basics. But I wanted to make this setup more easily reproducible hence I thought of giving a try to Centos vagrant box but after spinning couple of containers on Centos vagrant box I realized the port fowarding can be an issue for me. 

Finally I decided to use docker-toolbox for MAC which includes docker, docker-machine and vagrantbox. It's very easy to use, I have used the same earlier for docker-swarm learning but this time I was looking for something new but I finally decided to sattle with docker-toolbox again for learning ELK. 

I encourage beginners to start with running the ELK binaries directory instead of jumping to docker path. 

Here is the simply command to start a VM for ELK practice. 

~~~
$ docker-machine create elk-machine1

$ docker-machine ls
NAME           ACTIVE   DRIVER       STATE     URL                         SWARM   DOCKER        ERRORS
elk-machine1   -        virtualbox   Running   tcp://192.168.99.100:2376           v18.05.0-ce

$ docker-machine env elk-machine1
export DOCKER_TLS_VERIFY="1"
export DOCKER_HOST="tcp://192.168.99.100:2376"
export DOCKER_CERT_PATH="/Users/viaggarw/.docker/machine/machines/elk-machine1"
export DOCKER_MACHINE_NAME="elk-machine1"
# Run this command to configure your shell:
# eval $(docker-machine env elk-machine1)
~~~


Spawned machine doesn't contain docker-swam by default, it can be easily installed by using the following command: 

~~~
$ docker-machine ssh elk-machine1

$ sudo curl -L https://github.com/docker/compose/releases/download/1.21.2/docker-compose-$(uname -s)-$(uname -m) -o /usr/bin/docker-compose

$ sudo chmod +x /usr/bin/docker-compose
~~~

But if you are going to reboot the "elk-machine1" machine then you need to again issue the above commands for docker-swarm installation. 

Instead of directly using the docker-swarm I thought of giving it a try manually using docker run commands.

Created this directory on elk-machine1. Again these contents are ephemeral only which means after reboot these will vanish and you have to create directory structure again which is painful. 

~~~
docker@elk-machine1:~/BELK$ ls -lrtR
.:
total 24
drwxr-sr-x    2 docker   staff           40 Jun  4 05:58 elasticsearch/
drwxr-sr-x    2 docker   staff           60 Jun  4 05:58 beat/
drwxr-sr-x    3 docker   staff           60 Jun  4 06:06 logstash/
-rw-r--r--    1 docker   staff        24464 Jun  4 06:10 logstash-tutorial.log
drwxr-sr-x    2 docker   staff           60 Jun  4 08:50 kibana/

./elasticsearch:
total 0

./beat:
total 4
-rw-r--r--    1 docker   staff          154 Jun  4 07:59 filebeat.yml

./logstash:
total 0
drwxr-sr-x    2 docker   staff           60 Jun  4 06:06 pipeline/

./logstash/pipeline:
total 4
-rw-r--r--    1 docker   staff          336 Jun  4 08:16 logstash-apache.conf

./kibana:
total 4
-rw-r--r--    1 docker   staff          209 Jun  4 08:50 kibana.yml
~~~

Let's check the content of beat file. It's reading the content from logstash-tutorial.log file and sending the content of that file to logstash. Noticed that hostname of logstash used here logstash1 which means we need a DNS resolution to this name so that beat will be able to send the stats to logstash. 

~~~
docker@elk-machine1:~/BELK$ cat beat/filebeat.yml
filebeat.prospectors:
- type: log
  enabled: true
  paths:
    - /usr/share/filebeat/logstash-tutorial.log
output.logstash:
  hosts: ["logstash1:5044"]
~~~

Content of logstash-apache.conf file, it's accepting the input data from beats, applying the grok COMBINEDAPACHELOG, instead of using the timestamp at which the message is received, I prefer the create the ES index using timestamp on which the message is generated. 

~~~
docker@elk-machine1:~/BELK$ cat logstash/pipeline/logstash-apache.conf
input {
  beats {
    port => 5044
  }
}
filter {
  grok {
    match => { "message" => "%{COMBINEDAPACHELOG}" }
  }
  date {
    match => [ "timestamp" , "dd/MMM/yyyy:HH:mm:ss Z" ]
  }
}
output {
  elasticsearch {
    hosts => ["http://elasticsearch1:9200"]
    index => "%{[@metadata][beat]}-%{[@metadata][version]}-%{+yyyy.dd}"
  }
}
~~~

For kibana following yaml is created in which elasticsearch URL is changed.

~~~
$ cat kibana/kibana.yml
server.name: kibana
server.host: "0"
elasticsearch.url: http://elasticsearch1:9200
#elasticsearch.username: elastic
#elasticsearch.password: changeme
xpack.monitoring.ui.container.elasticsearch.enabled: false
~~~

Before running the docker containers, I prefer the pull the image manually. It's just a matter of choice, no compulsion.

~~~
docker@elk-machine1:~/BELK$ docker pull docker.elastic.co/kibana/kibana:6.2.4
docker@elk-machine1:~/BELK$ docker pull docker.elastic.co/logstash/logstash:6.2.4
docker@elk-machine1:~/BELK$ docker pull docker.elastic.co/elasticsearch/elasticsearch:6.2.4
docker@elk-machine1:~/BELK$ docker pull docker.elastic.co/beats/filebeat:6.2.4
~~~

Create network so that docker containers can do the DNS resolution.

~~~
root@elk-machine1:~# docker network create elk
~~~

Time to do some action by running the dockers I preferred to create script I know that docker-swarm is the right way to do it. We will cover that in next post. 

~~~
#!/bin/sh
docker run -d --rm --name elasticsearch1 --hostname=elasticsearch1 --network=elk -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:6.2.4
sleep 5
docker run -d --rm --name kibana1 --hostname kibana1 --network=elk -p 5601:5601 -v ~/BELK/kibana/kibana.yml:/usr/share/kibana/config/kibana.yml docker.elastic.co/kibana/kibana:6.2.4  
sleep 5
docker run -d --rm --name logstash1 --hostname=logstash1 --network=elk -v ~/BELK/logstash/pipeline/:/usr/share/logstash/pipeline/  docker.elastic.co/logstash/logstash:6.2.4
sleep 5
docker run -d --rm --name filebeat1 --hostname=filebeat1 --network=elk -v ~/BELK/logstash-tutorial.log:/usr/share/filebeat/logstash-tutorial.log -v ~/BELK/beat/filebeat.yml:/usr/share/filebeat/filebeat.yml docker.elastic.co/beats/filebeat:6.2.4
~~~

Okay.. Finally let's check the content of log file, I am going to show the few lines instead of whole log file. 

~~~
docker@elk-machine1:~/BELK$ head logstash-tutorial.log
83.149.9.216 - - [04/Jan/2015:05:13:42 +0000] "GET /presentations/logstash-monitorama-2013/images/kibana-search.png HTTP/1.1" 200 203023 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:42 +0000] "GET /presentations/logstash-monitorama-2013/images/kibana-dashboard3.png HTTP/1.1" 200 171717 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:44 +0000] "GET /presentations/logstash-monitorama-2013/plugin/highlight/highlight.js HTTP/1.1" 200 26185 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:44 +0000] "GET /presentations/logstash-monitorama-2013/plugin/zoom-js/zoom.js HTTP/1.1" 200 7697 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:45 +0000] "GET /presentations/logstash-monitorama-2013/plugin/notes/notes.js HTTP/1.1" 200 2892 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:42 +0000] "GET /presentations/logstash-monitorama-2013/images/sad-medic.png HTTP/1.1" 200 430406 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:45 +0000] "GET /presentations/logstash-monitorama-2013/css/fonts/Roboto-Bold.ttf HTTP/1.1" 200 38720 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:45 +0000] "GET /presentations/logstash-monitorama-2013/css/fonts/Roboto-Regular.ttf HTTP/1.1" 200 41820 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:45 +0000] "GET /presentations/logstash-monitorama-2013/images/frontend-response-codes.png HTTP/1.1" 200 52878 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
83.149.9.216 - - [04/Jan/2015:05:13:43 +0000] "GET /presentations/logstash-monitorama-2013/images/kibana-dashboard.png HTTP/1.1" 200 321631 "http://semicomplete.com/presentations/logstash-monitorama-2013/" "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1700.77 Safari/537.36"
~~~

After that you can see that elasticsearch index is created. 

~~~
docker@elk-machine1:~$ curl http://localhost:9200/_cat/indices?pretty
green  open .kibana                         B_SXK0dlTweaoX0Ew4pDsA 1 0    2  1  15.2kb  15.2kb
yellow open filebeat-6.2.4-2015.04          fd_TiyJeQgyqTet5tD2Qsg 5 1  200  0   376kb   376kb. <<< 
green  open .monitoring-es-6-2018.06.04     R8zh0p2lTqquUBQNAqKn8Q 1 0 1296 26 706.5kb 706.5kb
green  open .monitoring-kibana-6-2018.06.04 bOPI7v0lTQGPc9MldVgJqw 1 0  169  0 145.1kb 145.1kb
~~~

Add this index in kibana so that data can be displayed in UI, following ip address can be used to access the kibana. 

~~~
http://192.168.99.100:5601/
~~~
