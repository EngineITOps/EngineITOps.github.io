---
layout: post
title: How to add K8 consul client to external consul cluster
tags: [consul, kubernetes]
category: [consul, kubernetes]
author: vikrant
comments: true
--- 

This article is bit different than the previous articles, in this case we have deployed the consul cluster on docker-machine, you may refer [this blog post](https://ervikrant06.github.io/consul/Consul/) for it. 

- After that do the following modifications in values.yaml file. IMP change is specifying the ip address of external consul cluster and disabling the consul server setup on K8. 

~~~
diff --git a/values.yaml b/values.yaml
index 55e6dfe..a2fcac4 100644
--- a/values.yaml
+++ b/values.yaml
@@ -9,7 +9,7 @@ global:
   # will enable or disable all the components within this chart by default.
   # Each component can be overridden using the component-specific "enabled"
   # value.
-  enabled: true
+  enabled: false

   # Domain to register the Consul DNS server to listen for.
   domain: consul
@@ -22,7 +22,7 @@ global:
   # as. This shouldn't be changed once the Consul cluster is up and running
   # since Consul doesn't support an automatic way to change this value
   # currently: https://github.com/hashicorp/consul/issues/1858
-  datacenter: dc1
+  datacenter: labsetup

 server:
   enabled: "-"
@@ -72,9 +72,9 @@ server:
 # within the Kube cluster. The current deployment model follows a traditional
 # DC where a single agent is deployed per node.
 client:
-  enabled: "-"
+  enabled: true
   image: null
-  join: null
+  join: ["192.168.99.101"]

   # Resource requests, limits, etc. for the client cluster placement. This
   # should map directly to the value of the resources field for a PodSpec.
@@ -103,6 +103,9 @@ client:
 dns:
   enabled: "-"

+syncCatalog:
+  enabled: true
+
 ui:
   # True if you want to enable the Consul UI. The UI will run only
   # on the server nodes. This makes UI access via the service below (if
~~~

- Deploy the helm chart. 

~~~
helm install --name consulclient2 .
NAME:   consulclient2
LAST DEPLOYED: Sat Oct  6 16:48:59 2018
NAMESPACE: default
STATUS: DEPLOYED

RESOURCES:
==> v1/Pod(related)
NAME                 READY  STATUS             RESTARTS  AGE
consulclient2-kfn6z  0/1    ContainerCreating  0         1s

==> v1/ConfigMap
NAME                         DATA  AGE
consulclient2-client-config  1     1s

==> v1/DaemonSet
NAME           DESIRED  CURRENT  READY  UP-TO-DATE  AVAILABLE  NODE SELECTOR  AGE
consulclient2  1        1        0      1           0          <none>         1s
~~~

- Check the membership of external cluster. It's showing K8 consul client as a part of consul cluster. 

~~~
docker@consul1:~$ docker exec -it 2b3648bc46b0 consul members -http-addr=192.168.99.101:8500
Node                 Address              Status  Type    Build  Protocol  DC        Segment
consul1              192.168.99.101:8301  alive   server  1.2.3  2         labsetup  <all>
consulclient2-kfn6z  172.17.0.10:8301     alive   client  1.2.2  2         labsetup  <default>
~~~

- Started nginx container on docker-machine and registered this as a service. 

~~~
docker@consul1:~$ docker run -d --rm --net=host nginx
docker@consul1:~$ curl --request PUT --data @agent1.json http://192.168.99.101:8500/v1/agent/service/register
docker@consul1:~$ cat agent1.json
{
  "Name": "nginx",
  "address": "172.17.0.2",
  "port": 80,
  "Check": {
     "http": "http://172.17.0.2",
     "interval": "5s"
  }
}
~~~

- Modify the coredns configuration file on kubernetes to add the stub zone information for the consul server. 

~~~
$ kubectl edit cm coredns -n kube-system
# Please edit the object below. Lines beginning with a '#' will be ignored,
# and an empty file will abort the edit. If an error occurs while saving this file will be
# reopened with the relevant failures.
#
apiVersion: v1
data:
  Corefile: |
    .:53 {
        errors
        log
        health
        kubernetes cluster.local in-addr.arpa ip6.arpa {
            pods insecure
            upstream
            fallthrough in-addr.arpa ip6.arpa
        }
        prometheus :9153
        proxy . /etc/resolv.conf
        cache 30
        reload
    }
    consul:53 {
        errors
        cache 30
        proxy . 192.168.99.101:8600
    }
kind: ConfigMap
metadata:
  creationTimestamp: 2018-10-05T13:58:46Z
  labels:
    addonmanager.kubernetes.io/mode: EnsureExists
  name: coredns
  namespace: kube-system
  resourceVersion: "52256"
  selfLink: /api/v1/namespaces/kube-system/configmaps/coredns
  uid: c6e21a33-c8a6-11e8-a94c-080027064203
~~~

- Start the DNS container and try to perform the DNS query for nginx service running in consul.

~~~
$ kubectl run --rm -it dnstools2 --image anubhavmishra/tiny-tools sh
/ # dig nginx.service.consul

; <<>> DiG 9.11.2-P1 <<>> nginx.service.consul
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 10098
;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 2
;; WARNING: recursion requested but not available

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;nginx.service.consul.     IN A

;; ANSWER SECTION:
nginx.service.consul.   0  IN A  172.17.0.2

;; ADDITIONAL SECTION:
nginx.service.consul.   0  IN TXT   "consul-network-segment="

;; Query time: 1 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Sun Oct 07 05:39:49 UTC 2018
;; MSG SIZE  rcvd: 141
~~~s