---
layout: post
title: How to import existing DOCKERFILE into ansible-container
tags: [docker]
category: [docker]
author: vikrant
comments: true
--- 

In this post I am showing the procedure to import existing DOCKERFILE into the ansible-container. 

Step 1 : Created directory `/root/ANSIBLE-CONTAINER-PROJECTS/project1/DOCKERFILE` and added the following files into that directory. 

~~~
[root@devops DOCKERFILE]# cat Dockerfile
FROM centos:7
MAINTAINER The CentOS Project <cloud-ops@centos.org>
LABEL Vendor="CentOS" \
      License=GPLv2 \
      Version=2.4.6-40


RUN yum -y --setopt=tsflags=nodocs update && \
    yum -y --setopt=tsflags=nodocs install httpd && \
    yum clean all

EXPOSE 80

# Simple startup script to avoid some issues observed with container restart
ADD run-httpd.sh /run-httpd.sh
RUN chmod -v +x /run-httpd.sh

CMD ["/run-httpd.sh"]


[root@devops DOCKERFILE]# cat run-httpd.sh
#!/bin/bash

# Make sure we're not confused by old, incompletely-shutdown httpd
# context after restarting the container.  httpd won't start correctly
# if it thinks it is already running.
rm -rf /run/httpd/* /tmp/httpd*

exec /usr/sbin/apachectl -DFOREGROUND
~~~

I downloaded this from [1].

Step 2 : Start importing the project into the ansible-container. We just need to give the name of directory in which Dockerfile and script is present.

~~~
[root@devops ANSIBLE-CONTAINER-PROJECTS]# cd project1/
[root@devops project1]# ls
DOCKERFILE
[root@devops project1]# ansible-container import DOCKERFILE
Project successfully imported. You can find the results in:
/root/ANSIBLE-CONTAINER-PROJECTS/project1
A brief description of what you will find...


container.yml
-------------

The container.yml file is your orchestration file that expresses what services you have and how to build/run them.

settings:
  conductor_base: centos:7
services:
  DOCKERFILE:
    roles:
    - DOCKERFILE


I added a single service named DOCKERFILE for your imported Dockerfile.
As you can see, I made an Ansible role for your service, which you can find in:
`/root/ANSIBLE-CONTAINER-PROJECTS/project1/roles/DOCKERFILE`

project1/roles/DOCKERFILE/tasks/main.yml
----------------------------------------

The tasks/main.yml file has your RUN/ADD/COPY instructions.

- shell: yum -y --setopt=tsflags=nodocs update
- shell: yum -y --setopt=tsflags=nodocs install httpd
- shell: yum clean all
- name: Ensure / exists
  file:
    path: /
    state: directory
- name: Simple startup script to avoid some issues observed with container restart
    (run-httpd.sh)
  copy:
    src: run-httpd.sh
    dest: /run-httpd.sh
- shell: chmod -v +x /run-httpd.sh


I tried to preserve comments as task names, but you probably want to make
sure each task has a human readable name.

project1/roles/DOCKERFILE/meta/container.yml
--------------------------------------------

Metadata from your Dockerfile went into meta/container.yml in your role.
These will be used as build/run defaults for your role.

from: centos:7
maintainer: The CentOS Project <cloud-ops@centos.org>
labels:
  Vendor: CentOS
  License: GPLv2
  Version: 2.4.6-40
ports:
- '80'
command:
- /run-httpd.sh


I also stored ARG directives in the role's defaults/main.yml which will used as
variables by Ansible in your build and run operations.

Good luck!
Project imported.
~~~

Step 3 : Our project is imported, after importing the project here is the directory structure. 

~~~
[root@devops project1]# ls
container.yml  DOCKERFILE  roles  run-httpd.sh

It contains container.yaml file, roles directory and run-httpd.sh script. 

container.yaml is using centos7 as base image and calling role DOCKERFILE. 

[root@devops project1]# cat container.yml
settings:
  conductor_base: centos:7
services:
  DOCKERFILE:
    roles:
    - DOCKERFILE
~~~

roles directory contains DOCKERFILE role. It shows all the tasks which it will run when the build process is triggered. 

~~~
[root@devops project1]# cd roles/
[root@devops roles]# ls
DOCKERFILE
[root@devops roles]# cd DOCKERFILE/
[root@devops DOCKERFILE]# ls
defaults  meta  README.md  tasks  test
[root@devops DOCKERFILE]# cat tasks/main.yml
- shell: yum -y --setopt=tsflags=nodocs update
- shell: yum -y --setopt=tsflags=nodocs install httpd
- shell: yum clean all
- name: Ensure / exists
  file:
    path: /
    state: directory
- name: Simple startup script to avoid some issues observed with container restart
    (run-httpd.sh)
  copy:
    src: run-httpd.sh
    dest: /run-httpd.sh
- shell: chmod -v +x /run-httpd.sh
[root@devops DOCKERFILE]# cat meta/
container.yml  main.yml
[root@devops DOCKERFILE]# cat meta/
container.yml  main.yml
[root@devops DOCKERFILE]# cat meta/container.yml
from: centos:7
maintainer: The CentOS Project <cloud-ops@centos.org>
labels:
  Vendor: CentOS
  License: GPLv2
  Version: 2.4.6-40
ports:
- '80'
command:
- /run-httpd.sh
~~~	

Step 4 : Initiating the ansible-container build will show all the tasks it's running which is present in role. 

~~~
[root@devops project1]# ansible-container build
Building Docker Engine context...
Starting Docker build of Ansible Container Conductor image (please be patient)...
Parsing conductor CLI args.
Docker™ daemon integration engine loaded. Build starting.       project=project1
Building service...     project=project1 service=DOCKERFILE
PLAY [DOCKERFILE] **************************************************************
TASK [Gathering Facts] *********************************************************
ok: [DOCKERFILE]
TASK [DOCKERFILE : command] ****************************************************
 [WARNING]: Consider using yum module rather than running yum
changed: [DOCKERFILE]
TASK [DOCKERFILE : command] ****************************************************
changed: [DOCKERFILE]
TASK [DOCKERFILE : command] ****************************************************
changed: [DOCKERFILE]
TASK [DOCKERFILE : Ensure / exists] ********************************************
ok: [DOCKERFILE]
TASK [DOCKERFILE : Simple startup script to avoid some issues observed with container restart (run-httpd.sh)] ***
changed: [DOCKERFILE]
TASK [DOCKERFILE : command] ****************************************************
 [WARNING]: Consider using file module with mode rather than running chmod
changed: [DOCKERFILE]
PLAY RECAP *********************************************************************
DOCKERFILE                 : ok=7    changed=5    unreachable=0    failed=0
Applied role to service role=DOCKERFILE service=DOCKERFILE
Committed layer as image        image=sha256:9200752cbe499023de2c755e7ee790a51e36cca3b8b11c48a3609b2e7436d429 service=DOCKERFILE
Build complete. service=DOCKERFILE
All images successfully built.
Conductor terminated. Cleaning up.      command_rc=0 conductor_id=841adaf51d887a1f2abc56a9f01996573c7074c8b217ae3113ae4fbc693a1c0e save_container=False
~~~

Build will create a new directory inside the directory. 

~~~
[root@devops project1]# ls
ansible-deployment  container.yml  DOCKERFILE  roles  run-httpd.sh
~~~

Step 5 : Following are the images present after the build complete.

~~~
[root@devops project1]# docker images
REPOSITORY            TAG                 IMAGE ID            CREATED             SIZE
project1-dockerfile   20170826195807      9200752cbe49        3 minutes ago       244.9 MB
project1-dockerfile   latest              9200752cbe49        3 minutes ago       244.9 MB
project1-conductor    latest              e499184e44d8        5 minutes ago       549.1 MB
docker.io/centos      7                   328edcd84f1b        3 weeks ago         192.5 MB
~~~

Checking the history of images created during build process. centos:7 is the base image which is used for build process.

All the tasks ran on conductor image. 

~~~
[root@devops DOCKERFILE]# docker history project1-conductor:latest
IMAGE               CREATED             CREATED BY                                      SIZE                COMMENT
e499184e44d8        20 minutes ago      /bin/sh -c #(nop)  VOLUME [/usr]                0 B
012c53305347        20 minutes ago      /bin/sh -c ( test -f /_ansible/build/ansible-   0 B
8068be3c5409        20 minutes ago      /bin/sh -c #(nop) COPY dir:9695e7c3619885b00d   0 B
d6dca564d2ae        20 minutes ago      /bin/sh -c cd /_ansible &&     pip install -r   109.1 MB
382321fc6a20        23 minutes ago      /bin/sh -c #(nop) COPY dir:44abffe3306d203510   3.645 MB
d4031cbc2a95        23 minutes ago      /bin/sh -c python /get-pip.py &&     mkdir -p   93.07 MB
b9ad4b07a63b        23 minutes ago      /bin/sh -c #(nop) COPY file:7d575017b1192e86d   1.595 MB
fc8a7163d23f        24 minutes ago      /bin/sh -c #(nop) ADD tarsum.v1+sha256:ee0f28   26.51 MB
1b7d7763d224        24 minutes ago      /bin/sh -c yum update -y &&     yum install -   122.7 MB
392230f5245d        26 minutes ago      /bin/sh -c #(nop)  ENV ANSIBLE_CONTAINER=1      0 B
328edcd84f1b        3 weeks ago         /bin/sh -c #(nop)  CMD ["/bin/bash"]            0 B
<missing>           3 weeks ago         /bin/sh -c #(nop)  LABEL name=CentOS Base Ima   0 B
<missing>           3 weeks ago         /bin/sh -c #(nop) ADD file:63492ba809361c51e7   192.5 MB

[root@devops DOCKERFILE]# docker history project1-dockerfile:latest
IMAGE               CREATED             CREATED BY                                      SIZE                COMMENT
9200752cbe49        18 minutes ago      sh -c while true; do sleep 1; done              52.36 MB            Built with Ansible Container (https://github.com/ansible/ansible-container)
328edcd84f1b        3 weeks ago         /bin/sh -c #(nop)  CMD ["/bin/bash"]            0 B
<missing>           3 weeks ago         /bin/sh -c #(nop)  LABEL name=CentOS Base Ima   0 B
<missing>           3 weeks ago         /bin/sh -c #(nop) ADD file:63492ba809361c51e7   192.5 MB

[root@devops DOCKERFILE]# docker history project1-dockerfile:20170826195807
IMAGE               CREATED             CREATED BY                                      SIZE                COMMENT
9200752cbe49        18 minutes ago      sh -c while true; do sleep 1; done              52.36 MB            Built with Ansible Container (https://github.com/ansible/ansible-container)
328edcd84f1b        3 weeks ago         /bin/sh -c #(nop)  CMD ["/bin/bash"]            0 B
<missing>           3 weeks ago         /bin/sh -c #(nop)  LABEL name=CentOS Base Ima   0 B
<missing>           3 weeks ago         /bin/sh -c #(nop) ADD file:63492ba809361c51e7   192.5 MB
~~~

Step 6 : Running ansible-container.

~~~
[root@devops project1]# ansible-container run
Parsing conductor CLI args.
Engine integration loaded. Preparing run.       engine=Docker™ daemon
Verifying service image service=DOCKERFILE
PLAY [localhost] ***************************************************************
TASK [docker_service] **********************************************************
changed: [localhost]
PLAY RECAP *********************************************************************
localhost                  : ok=1    changed=1    unreachable=0    failed=0
All services running.   playbook_rc=0
Conductor terminated. Cleaning up.      command_rc=0 conductor_id=947b2b03ead6fc6981b8ff5f2b8b0364c76d665dae041c1dedc61b0e6f159462 save_container=False
~~~

Step 7 : A new container we can see which is having port 80 mapped to the host port 32769

~~~
[root@devops project1]# docker ps -a --no-trunc
CONTAINER ID                                                       IMAGE                                COMMAND             CREATED             STATUS              PORTS                   NAMES
a897fc299fcdce5904dcbebf75bce565681c6155253c317613a96374edec2b32   project1-dockerfile:20170826195807   "/run-httpd.sh"     43 seconds ago      Up 42 seconds       0.0.0.0:32769->80/tcp   project1_DOCKERFILE_1
~~~

Using the host ip address and port number 32769, we can access the apache web page. 

[1] https://github.com/CentOS/CentOS-Dockerfiles/blob/master/httpd/centos7/run-httpd.sh
