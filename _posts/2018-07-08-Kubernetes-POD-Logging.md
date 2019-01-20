---
layout: post
title: Kubernetes pod logging
tags: [kubernetes, log]
category: [Kubernetes]
author: vikrant
comments: true
---

Logging is very crucial topic for containers. By default like docker, kubernetes use the json log driver which doesn't support the multi-line log which means that it will not be able to dump the call traces in log file. Unfortunately K8 doesn't provide the option to change the logging driver for docker but we can do that while starting the container using `docker run` command. There is open feature request [1] for this. 

- One POD running on my system. Let's login into the minikube and check the logs of container. 

~~~
# docker ps -a | grep node
5396cae5d59c        wardviaene/k8s-demo                                              "/bin/sh -c 'npm sta…"   2 hours ago         Up 2 hours                                                                               k8s_k8s-demo_nodehelloworld.example.com_default_1cc28c65-8265-11e8-925f-080027ee32dc_0
781fb3aa83bf        k8s.gcr.io/pause-amd64:3.1                                       "/pause"                 2 hours ago         Up 2 hours                                                                               k8s_POD_nodehelloworld.example.com_default_1cc28c65-8265-11e8-925f-080027ee32dc_0
~~~

- Using docker command to check the logs of container. 

~~~
# docker logs 5396cae5d59c
npm info it worked if it ends with ok
npm info using npm@2.15.11
npm info using node@v4.6.2
npm info prestart myapp@0.0.1
npm info start myapp@0.0.1

> myapp@0.0.1 start /app
> node index.js

Example app listening at http://:::3000
~~~

- Or we can see the same logs using kubectl as well. 

~~~
$ kubectl log nodehelloworld.example.com
W0708 11:40:13.617300   34359 cmd.go:353] log is DEPRECATED and will be removed in a future version. Use logs instead.
npm info it worked if it ends with ok
npm info using npm@2.15.11
npm info using node@v4.6.2
npm info prestart myapp@0.0.1
npm info start myapp@0.0.1

> myapp@0.0.1 start /app
> node index.js

Example app listening at http://:::3000
~~~

- If we see the logs on minikube you will see that inside /var/log two directories are present containers and pods. 

~~~
# pwd
/var/log
# ls -lrt
total 8
drwxr-xr-x  2 root root 4096 Jul  8 05:51 containers
drwxr-xr-x 14 root root 4096 Jul  8 05:51 pods
~~~

- Containers directory contains the log file for each container. 

~~~
# cat /var/log/containers/nodehelloworld.example.com_default_k8s-demo-5396cae5d59ce5286fcdd677f499a7e739012d9bf89f7daaa72cdaa3cafe6921.log
{"log":"npm info it worked if it ends with ok\n","stream":"stderr","time":"2018-07-08T04:14:13.761132791Z"}
{"log":"npm info using npm@2.15.11\n","stream":"stderr","time":"2018-07-08T04:14:13.761441498Z"}
{"log":"npm info using node@v4.6.2\n","stream":"stderr","time":"2018-07-08T04:14:13.761653837Z"}
{"log":"npm info prestart myapp@0.0.1\n","stream":"stderr","time":"2018-07-08T04:14:13.961100668Z"}
{"log":"npm info start myapp@0.0.1\n","stream":"stderr","time":"2018-07-08T04:14:13.967090401Z"}
{"log":"\n","stream":"stdout","time":"2018-07-08T04:14:13.969178007Z"}
{"log":"\u003e myapp@0.0.1 start /app\n","stream":"stdout","time":"2018-07-08T04:14:13.969205806Z"}
{"log":"\u003e node index.js\n","stream":"stdout","time":"2018-07-08T04:14:13.969210009Z"}
{"log":"\n","stream":"stdout","time":"2018-07-08T04:14:13.969213145Z"}
{"log":"Example app listening at http://:::3000\n","stream":"stdout","time":"2018-07-08T04:14:14.15006327Z"}
~~~

This container file is linked to another file in pods directory which correspond to POD ID. 

~~~
# ls -lrt /var/log/containers/nodehelloworld.example.com_default_k8s-demo-5396cae5d59ce5286fcdd677f499a7e739012d9bf89f7daaa72cdaa3cafe6921.log
lrwxrwxrwx 1 root root 65 Jul  8 04:14 /var/log/containers/nodehelloworld.example.com_default_k8s-demo-5396cae5d59ce5286fcdd677f499a7e739012d9bf89f7daaa72cdaa3cafe6921.log -> /var/log/pods/1cc28c65-8265-11e8-925f-080027ee32dc/k8s-demo/0.log
~~~

- You may run another POD like beat/logstash/fluentd which can read files from this POD and send those logs to Elasticsearch for centralized logging.

- Taking an example of scenario in which application is logging the logs in multiple files in that case no log will be available in STDOUT hence we need to run the sidecar container/s which can read from these files and then redirect the output to its STDOUT.

Following example taken from the K8 official guide showing the POD which is sending the logs to two files "/var/log/1.log" and "/var/log/2.log"

~~~
apiVersion: v1
kind: Pod
metadata:
  name: counter
spec:
  containers:
  - name: count
    image: busybox
    args:
    - /bin/sh
    - -c
    - >
      i=0;
      while true;
      do
        echo "$i: $(date)" >> /var/log/1.log;
        echo "$(date) INFO $i" >> /var/log/2.log;
        i=$((i+1));
        sleep 1;
      done
    volumeMounts:
    - name: varlog
      mountPath: /var/log
  volumes:
  - name: varlog
    emptyDir: {}
~~~

Once I created POD using above defintion I am not able to see anything in `kubectl logs` or `docker logs` because it's not sending anything to STDOUT or STDERR.

~~~
$ kubectl logs counter
$
~~~

After logging into minikube node 

~~~
# cat /var/log/containers/counter_default_count-7a590d58067c85ef4cbef025dc6dfcec4be94a8c1d0f6cb837133123b54205e9.log
#
~~~

Let's modify the above defintion to start sidecar containers so that those containers can read these log files and then redirect the logs to their STDOUT.

~~~
apiVersion: v1
kind: Pod
metadata:
  name: counter
spec:
  containers:
  - name: count
    image: busybox
    args:
    - /bin/sh
    - -c
    - >
      i=0;
      while true;
      do
        echo "$i: $(date)" >> /var/log/1.log;
        echo "$(date) INFO $i" >> /var/log/2.log;
        i=$((i+1));
        sleep 1;
      done
    volumeMounts:
    - name: varlog
      mountPath: /var/log
  - name: count-log-1
    image: busybox
    args: [/bin/sh, -c, 'tail -n+1 -f /var/log/1.log']
    volumeMounts:
    - name: varlog
      mountPath: /var/log
  - name: count-log-2
    image: busybox
    args: [/bin/sh, -c, 'tail -n+1 -f /var/log/2.log']
    volumeMounts:
    - name: varlog
      mountPath: /var/log
  volumes:
  - name: varlog
    emptyDir: {}
~~~

Now we can access the logs which were redirected to `/var/log/1.log` and `/var/log/2.log` by using `kubectl logs count-log-1` and `kubectl logs count-log-2` respectively.  

~~~
$ kubectl logs counter -c count-log-1
0: Sun Jul  8 06:43:46 UTC 2018
1: Sun Jul  8 06:43:47 UTC 2018

$ kubectl logs counter -c count-log-2 | head
Sun Jul  8 06:43:46 UTC 2018 INFO 0
Sun Jul  8 06:43:47 UTC 2018 INFO 1
~~~

Again we can use the another POD to read the files from `/var/log/containers/` for count-log-1 and count-log-2 to process them using logstash/beat/fluent. 

[1] https://github.com/kubernetes/kubernetes/issues/15478