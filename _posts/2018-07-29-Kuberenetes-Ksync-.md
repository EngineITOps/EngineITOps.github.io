---
layout: post
title: Kuberenetes ksync tool
tags: [Kubernetes]
category: [Kubernetes]
author: vikrant
comments: true
--- 

Recently I was working on simple app which I wanted to deploy in K8, it was cumbersome task to write some code and then doing everything manually to ensure that it's working fine in K8 setup. I came across a wonderful tool ksync which helps to sync the changes which are doing locally directly in the K8 POD. This works in client/server architecture similar to helm. Once you dowmnload the kysnc initialize the ksync again similar to helm, it will start daemonset in the K8. 

All the instructions are available on github. 

- Download the ksync on your laptop. 

~~~
$ curl https://vapor-ware.github.io/gimme-that/gimme.sh | bash
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2763  100  2763    0     0   1736      0  0:00:01  0:00:01 --:--:--  1736
Checking GitHub for the latest release of ksync
Found release tag: 0.3.1
Downloading ksync_darwin_amd64
No previous install found. Installing ksync to /usr/local/bin/ksync
~~~

- Check the status of ksync. 

~~~
$ ksync doctor
Extra Binaries                              ✓
Cluster Config                              ✓
Cluster Connection                          ✓
Cluster Version                             ✓
Cluster Permissions                         ✓
Cluster Service                             ✘
↳	The cluster service has not been installed yet. Run init to fix.
~~~

- Initialize the ksync. 

~~~
$ ksync init
==== Preflight checks ====
Cluster Config                              ✓
Cluster Connection                          ✓
Cluster Version                             ✓
Cluster Permissions                         ✓

==== Cluster Environment ====
Adding ksync to the cluster                 ✓
Waiting for pods to be healthy              ✓

==== Postflight checks ====
Cluster Service                             ✓
Service Health                              ✓
Service Version                             ✓
Docker Version                              ✓
Docker Storage Driver                       ✓
Docker Storage Root                         ✓

==== Initialization Complete ====
HAM-VIAGGARW-02:testrepo viaggarw$ ksync doctor
Extra Binaries                              ✓
Cluster Config                              ✓
Cluster Connection                          ✓
Cluster Version                             ✓
Cluster Permissions                         ✓
Cluster Service                             ✓
Service Health                              ✓
Service Version                             ✓
Docker Version                              ✓
Docker Storage Driver                       ✓
Docker Storage Root                         ✓
Watch Running                               ✘
~~~

- Check the status using command again. 

~~~
$ ksync doctor
Extra Binaries                              ✓
Cluster Config                              ✓
Cluster Connection                          ✓
Cluster Version                             ✓
Cluster Permissions                         ✓
Cluster Service                             ✓
Service Health                              ✓
Service Version                             ✓
Docker Version                              ✓
Docker Storage Driver                       ✓
Docker Storage Root                         ✓
Watch Running                               ✘
↳	It appears that watch isn't running. You can start it with 'ksync watch'
~~~

- Start the watch so that code changes which you are doing on your laptop are reflected inside the container directly.

~~~
$ ksync watch
INFO[0000] listening                                     bind=127.0.0.1 port=40322
INFO[0003] syncthing listening                           port=8384 syncthing=localhost

$ ksync doctor
Extra Binaries                              ✓
Cluster Config                              ✓
Cluster Connection                          ✓
Cluster Version                             ✓
Cluster Permissions                         ✓
Cluster Service                             ✓
Service Health                              ✓
Service Version                             ✓
Docker Version                              ✓
Docker Storage Driver                       ✓
Docker Storage Root                         ✓
Watch Running                               ✓
Everything looks good!                      ☺
~~~

Please refer the example available on github. It works like a charm. I have never seen anything working so smoothly. 

https://github.com/vapor-ware/ksync