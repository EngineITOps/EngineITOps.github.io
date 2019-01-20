---
layout: post
title: How to run multiple minikubes on a single machine?
tags: [Kubernetes]
category: [Kubernetes]
author: vikrant
comments: true
--- 

For a long time I was looking for a way to run the multiple minikube VMs on a single machine for testing out federation working. I came to know about the profile feature of minikube and eagerly tried but it was failing for me. I filed a bug for this issue. 

I noticed new version of minikube rolledout hence I thought of testing that feature again with that version and luckily it worked this time...

Note : At the time of writing, following was the latest version of minikube. 

~~~
$ minikube version
minikube version: v0.28.2
~~~

One minikube with default profile was already running on my machine. 

~~~
$ minikube profile default
minikube profile was successfully set to minikube

$ minikube status
minikube: Running
cluster: Running
kubectl: Correctly Configured: pointing to minikube-vm at 192.168.99.102
~~~

Started another minikube instance using 

~~~
$ minikube start -p minikubea
~~~

If you want to issue any command into this minikube change your current context.

~~~
$ kubectl config current-context
$ kubectl config get-contexts
$ kubectl config set-context minikubea
$ kubectl config current-context
~~~


[1] https://github.com/kubernetes/minikube/issues/3007#issuecomment-407227024
