---
layout: post
title: How DNS discovery works in kubernetes
tags: [Kubernetes]
category: [Kubernetes]
author: vikrant
comments: true
--- 


In this article, I share the information related to DNS which I collected from official kubernetes documentation. All the examples are taken from the official kubernetes guide. DNS provides the service discovery functionality in kubernetes. minikube by default start dns server for you in kube-system namespace. 

~~~
kubectl get pod kube-dns-86f4d74b45-t8wdv -n kube-system
NAME                        READY     STATUS    RESTARTS   AGE
kube-dns-86f4d74b45-t8wdv   3/3       Running   13         2d
~~~  

Three containers are running as part of kube-dns pod. 

- kube-dns : watches the Kubernetes master for changes in Services and Endpoints, and maintains in-memory lookup structures to serve DNS requests.
- dnsmasq : adds DNS caching to improve performance.
- sidecar : provide health check endpoint to perform healthchecks on dnsmasq and kubedns. 

Since by default images which I am using in the examples are not providing the tools like dig, curl hence I started the another container containing all these tools in one terminal.

~~~
$ kubectl run --rm -it --image giantswarm/tiny-tools sh
/ # dig busyboxservice.default.svc.cluster.local +short
10.101.220.33
~~~

#### Without service

- Start container with busybox image without hostname and subdomain information. 

~~~ 
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox1
  labels:
    name: busybox
spec:
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    name: busybox
EOF
pod "busybox1" created
~~~

Manifest has started the POD. 

~~~
kubectl get pod busybox1 -o wide
NAME       READY     STATUS    RESTARTS   AGE       IP            NODE
busybox1   1/1       Running   0          1m        172.17.0.19   minikube
~~~

Go to another terminal and check the entry corresponding to POD in DNS

~~~
/ # dig 172-17-0-19.default.pod.cluster.local +short
172.17.0.19
~~~

- Start container with hostname and subdomain information. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox1
  labels:
    name: busybox
spec:
  hostname: busybox-1
  subdomain: test
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    name: busybox
EOF
pod "busybox1" created
~~~

This time you will not get any result from dig command. 

~~~
/ # dig 172-17-0-19.test.default.pod.cluster.local +short
/ #
~~~

But still the previous command is giving the expected results. 

~~~
/ # dig 172-17-0-19.default.pod.cluster.local +short
172.17.0.19
~~~

#### Create a service

- Since in the previous dig output we didn't get any result hence I thought of creating a service using the same subdomain name. But this service is a headless service. It's important to create a service with same name `test` which is used in subdomain. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Service
metadata:
  name: test
spec:
  selector:
    name: busybox
  clusterIP: None
  ports:
  - name: foo
    port: 1234
    targetPort: 1234
EOF
service "test" created

kubectl get svc test
NAME      TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)    AGE
test      ClusterIP   None         <none>        1234/TCP   7s
~~~

By default is performing the A record query which contains only the IP address not the PORT. 

~~~
/ # dig test.default.svc.cluster.local +short
172.17.0.19
~~~

Let's perform SRV query which will show us the complete result. Notice the name of POD in output, it contains busybox-1 hostname along with test subdomain in output. 

~~~
/ # dig test.default.svc.cluster.local srv

; <<>> DiG 9.12.1-P2 <<>> test.default.svc.cluster.local srv
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 23997
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;test.default.svc.cluster.local.  IN  SRV

;; ANSWER SECTION:
test.default.svc.cluster.local. 30 IN SRV 10 100 0 busybox-1.test.default.svc.cluster.local.

;; ADDITIONAL SECTION:
busybox-1.test.default.svc.cluster.local. 30 IN A 172.17.0.19

;; Query time: 0 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Wed Sep 05 16:33:04 UTC 2018
;; MSG SIZE  rcvd: 94
~~~

If you want to look for the POD ip address directly. Again important point to notice is the use of `svc` instead of `pod`. 

~~~
/ # dig busybox-1.test.default.svc.cluster.local +short
172.17.0.19
~~~

Clear the above mess and try out a simple configuration.

~~~
kubectl delete svc test
~~~

Try to create the service using different name `test1` than subdomain `test` which we have mentioned in POD manifest. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Service
metadata:
  name: test1
spec:
  selector:
    name: busybox
  clusterIP: None
  ports:
  - name: foo
    port: 1234
    targetPort: 1234
EOF
~~~

While checking the SRV records now, we can see some random number instead of pod hostname which saw while using same subdomain and svc name. I am not able to figure out from where this random number is coming. 

~~~
/ # dig test1.default.svc.cluster.local srv

; <<>> DiG 9.12.1-P2 <<>> test1.default.svc.cluster.local srv
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 26445
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;test1.default.svc.cluster.local. IN  SRV

;; ANSWER SECTION:
test1.default.svc.cluster.local. 30 IN  SRV 10 100 0 6564323331363837.test1.default.svc.cluster.local.

;; ADDITIONAL SECTION:
6564323331363837.test1.default.svc.cluster.local. 30 IN A 172.17.0.19

;; Query time: 0 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Wed Sep 05 16:48:43 UTC 2018
;; MSG SIZE  rcvd: 102
~~~

To confirm my theory, I have created another POD but this time using the subdomain test1 instead of test to see whether service is showing right hostname for it. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox2
  labels:
    name: busybox
spec:
  hostname: busybox-2
  subdomain: test1
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    name: busybox
EOF
~~~

Again checking the SRV record showing right hostname for POD.

~~~
/ # dig test1.default.svc.cluster.local srv

; <<>> DiG 9.12.1-P2 <<>> test1.default.svc.cluster.local srv
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 48620
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 2

;; QUESTION SECTION:
;test1.default.svc.cluster.local. IN  SRV

;; ANSWER SECTION:
test1.default.svc.cluster.local. 30 IN  SRV 10 50 0 6564323331363837.test1.default.svc.cluster.local.
test1.default.svc.cluster.local. 30 IN  SRV 10 50 0 busybox-2.test1.default.svc.cluster.local.

;; ADDITIONAL SECTION:
6564323331363837.test1.default.svc.cluster.local. 30 IN A 172.17.0.19
busybox-2.test1.default.svc.cluster.local. 30 IN A 172.17.0.21

;; Query time: 1 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Wed Sep 05 16:53:36 UTC 2018
;; MSG SIZE  rcvd: 148
~~~

Before I delete the PODs and test service, I just want to emphasis on one point that /etc/resolv.conf contents remain same whatevery hostname of subdomain you use in manifest however /etc/hosts shows the right hostname and subdomain used. 

~~~
$ kubectl exec -it busybox1 cat /etc/resolv.conf
nameserver 10.96.0.10
search default.svc.cluster.local svc.cluster.local cluster.local
options ndots:5

kubectl exec -it busybox1 grep busybox /etc/hosts
172.17.0.19 busybox-1.test.default.svc.cluster.local  busybox-1
~~~

Delete the PODs and services.

~~~
kubectl delete pod busybox1
kubectl delete pod busybox2
kubectl delete svc test1
kubectl delete svc test
~~~

Used the following manifest to create two PODs and a service. Note: This service is not a headless service. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox1
  labels:
    name: busybox
spec:
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    name: busybox
---
apiVersion: v1
kind: Pod
metadata:
  name: busybox2
  labels:
    name: busybox
spec:
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    name: busybox
---
apiVersion: v1
kind: Service
metadata:
  name: test
spec:
  selector:
    name: busybox
  ports:
  - name: foo
    port: 1234
    targetPort: 1234
EOF
~~~

SRV record is showing only entry for service itself not for the endpoints. 

~~~
/ # dig test.default.svc.cluster.local srv

; <<>> DiG 9.12.1-P2 <<>> test.default.svc.cluster.local srv
;; global options: +cmd
;; Got answer:
;; WARNING: .local is reserved for Multicast DNS
;; You are currently testing what happens when an mDNS query is leaked to DNS
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 7437
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 1

;; QUESTION SECTION:
;test.default.svc.cluster.local.  IN  SRV

;; ANSWER SECTION:
test.default.svc.cluster.local. 30 IN SRV 10 100 0 3630393838626232.test.default.svc.cluster.local.

;; ADDITIONAL SECTION:
3630393838626232.test.default.svc.cluster.local. 30 IN A 10.109.101.187

;; Query time: 0 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Wed Sep 05 17:03:45 UTC 2018
;; MSG SIZE  rcvd: 101

/ # dig test.default.svc.cluster.local +short
10.109.101.187
~~~

Delete the service and create the headless service to see what POD IPs we are getting. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Service
metadata:
  name: test
spec:
  selector:
    name: busybox
  clusterIP: None
  ports:
  - name: foo
    port: 1234
    targetPort: 1234
EOF

/ # dig test.default.svc.cluster.local +short
172.17.0.19
172.17.0.21
~~~

#### Modify the search order. 

Create the following config map in which you are adding a stub and upstream nameservers. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: kube-dns
  namespace: kube-system
data:
  stubDomains: |
    {"acme.local": ["1.2.3.4"]}
  upstreamNameservers: |
    ["8.8.8.8", "8.8.4.4"]
EOF
~~~    

Wait for few mins, you should see changes getting reflected by monitoring the kube-dns logs. 

~~~
$ kubectl log -n kube-system kube-dns-86f4d74b45-t8wdv kubedns
~~~

You need to change the `dnsPolicy` to `ClusterFirst` from `Default` or `None` so that it can start respecting the new configuration instead of using default.

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox1
  labels:
    name: busybox
spec:
  dnsPolicy: ClusterFirst
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    name: busybox
---
apiVersion: v1
kind: Pod
metadata:
  name: busybox2
  labels:
    name: busybox
spec:
  dnsPolicy: ClusterFirst
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    name: busybox
---
apiVersion: v1
kind: Service
metadata:
  name: test
spec:
  selector:
    name: busybox
  ports:
  - name: foo
    port: 1234
    targetPort: 1234
EOF
~~~

But still it's showing the default content of /etc/resolv.conf file instead of showing the stubdomain modification. 

- More flexible approach is to provide the nameserver and search per POD. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  namespace: default
  name: dns-example
spec:
  containers:
    - name: test
      image: busybox
  dnsPolicy: "None"
  dnsConfig:
    nameservers:
      - 1.2.3.4
    searches:
      - ns1.svc.cluster.local
      - my.dns.search.suffix
    options:
      - name: ndots
        value: "2"
      - name: edns0
EOF
~~~

Check the content of /etc/resolv.conf file to verify the content. 

~~~
kubectl exec -it dns-example cat /etc/resolv.conf
nameserver 1.2.3.4
search ns1.svc.cluster.local my.dns.search.suffix
options edns0 ndots:2
~~~

- If you are spinning up the pod using hostnetwork and want to use the DNS capabilities from the kubelet properties then use the `dnsPolicy: ClusterFirstWithHostNet` property in manifest. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  namespace: default
spec:
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    imagePullPolicy: IfNotPresent
    name: busybox
  restartPolicy: Always
  hostNetwork: true
  dnsPolicy: ClusterFirstWithHostNet
EOF
~~~  

Check the content of resolv.conf file to verify the content. 

~~~
kubectl exec -it busybox cat /etc/resolv.conf
nameserver 10.96.0.10
search default.svc.cluster.local svc.cluster.local cluster.local
options ndots:5
~~~

Delete this POD and try to start the POD without specifying the mentioned property.

~~~
kubectl delete pod busybox
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: busybox
  namespace: default
spec:
  containers:
  - image: busybox
    command:
      - sleep
      - "3600"
    imagePullPolicy: IfNotPresent
    name: busybox
  restartPolicy: Always
  hostNetwork: true
EOF
~~~

This time it has inherited the DNS settings from host machine.

~~~
kubectl exec -it busybox cat /etc/resolv.conf
nameserver 10.0.2.3
~~~