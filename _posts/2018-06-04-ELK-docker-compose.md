---
layout: post
title: How to use persistent storage for elasticsearch in docker
tags: [elasticserch, kibana, logstash, elk]
category: [ELK]
author: vikrant
comments: true
--- 

In the previous article, we have started the docker containers using `docker run` command, and while starting the ES container we haven't used the persistent storage to save the indexes which means that if container is stop/start then all data will be lost. If you don't trust me perform the stop/start of container and you will see that indices are missing. 

#### Before stop

~~~
docker@elk-machine1:~$ curl http://localhost:9200/_cat/indices?pretty
green  open .kibana                         B_SXK0dlTweaoX0Ew4pDsA 1 0    2  1  15.2kb  15.2kb
yellow open filebeat-6.2.4-2015.04          fd_TiyJeQgyqTet5tD2Qsg 5 1  200  0   376kb   376kb
green  open .monitoring-es-6-2018.06.04     R8zh0p2lTqquUBQNAqKn8Q 1 0 2024 52   1.1mb   1.1mb
green  open .monitoring-kibana-6-2018.06.04 bOPI7v0lTQGPc9MldVgJqw 1 0  260  0 179.4kb 179.4kb
~~~

#### Perform stop/start.

~~~
docker@elk-machine1:~$ docker stop 1c1c917abcdc
1c1c917abcdc
docker@elk-machine1:~$ docker run -d --rm --name elasticsearch1 --hostname=elasticsearch1 -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/ela
sticsearch:6.2.4
df7ab84c815179dc1478ebfc63cbf04ffe182f75179e0ee43132dd1d378acd20
~~~

#### After start

~~~
docker@elk-machine1:~$ curl http://localhost:9200/_cat/indices?pretty
green open .monitoring-es-6-2018.06.04 uNdudo58Qu2FrnsESnMh3w 1 0 9 0 31.2kb 31.2kb
~~~

This is not good. To make these persistent across container stop/start we need to use volumes. 

Tip : Data will remain persistent across container reboots. 

Let's create a docker-compose file in which we will be using the persistent volumes for ES storage. If you want to know more about the docker-compose I suggest you to google about it. It basically provide the single file to create/teardown the whole stack. 

~~~
docker@elk-machine1:~/BELK$ cat docker-compose.yml
version: '3'
services:
  elasticsearch1:
    image: docker.elastic.co/elasticsearch/elasticsearch:6.2.4
    container_name: elasticsearch1
    environment:
      - "discovery.type=single-node"
      - 
    volumes:
      - esdata1:/usr/share/elasticsearch/data:rw
    ports:
      - 9200:9200
    networks:
      - elk
    restart: unless-stopped
  kibana1:
    depends_on:
    - elasticsearch1
    image: docker.elastic.co/kibana/kibana:6.2.4
    networks:
      - elk
    ports:
      - 5601:5601
    restart: unless-stopped
    volumes:
      - /home/docker/BELK/kibana/kibana.yml:/usr/share/kibana/config/kibana.yml
  logstash1:
    image: docker.elastic.co/logstash/logstash:6.2.4
    depends_on:
      - elasticsearch1
    networks:
      - elk
    restart: unless-stopped
    volumes:
      - /home/docker/BELK/logstash/pipeline/:/usr/share/logstash/pipeline/
  beat1:
    image: docker.elastic.co/beats/filebeat:6.2.4
    depends_on:
      - logstash1
    networks:
      - elk
    restart: unless-stopped
    volumes:
      - /home/docker/BELK/logstash-tutorial.log:/usr/share/filebeat/logstash-tutorial.log
      - /home/docker/BELK/beat/filebeat.yml:/usr/share/filebeat/filebeat.yml
volumes:
  esdata1:
    driver: local
networks:
  elk:
~~~

My directory structure is similar to previous article only new addition is the docker-compose file.

~~~
docker@elk-machine1:~/BELK$ ls
beat/                  kibana/                logstash-tutorial.log
docker-compose.yml     logstash/
~~~

Bring up the docker-compose, it will start all the containers in foreground use `-d` to run them in detached mode.

~~~
docker@elk-machine1:~/BELK$ docker-compose up
~~~

Stop the compose by pressing `control+c` all containers will exit and you can remove the containers, even after removing the containers volume is still present. We can run the docker-compose command again and the same container will be present. 

~~~
docker@elk-machine1:~/BELK$ docker-compose rm
Going to remove belk_beat1_1, belk_kibana1_1, belk_logstash1_1, elasticsearch1
Are you sure? [yN] y
Removing belk_beat1_1     ... done
Removing belk_kibana1_1   ... done
Removing belk_logstash1_1 ... done
Removing elasticsearch1   ... done

docker@elk-machine1:~/BELK$ docker ps -a
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES

docker@elk-machine1:~/BELK$ docker volume ls
DRIVER              VOLUME NAME
local               belk_esdata1

docker@elk-machine1:~/BELK$ docker-compose up
Creating elasticsearch1 ... done
Creating belk_logstash1_1 ... done
Creating belk_kibana1_1   ... done
Creating belk_beat1_1     ... done
Attaching to elasticsearch1, belk_logstash1_1, belk_kibana1_1, belk_beat1_1
~~~