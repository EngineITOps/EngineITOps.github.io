---
layout: post
title: Running consul on kubernetes with sync enabled
tags: [consul, kubernetes]
category: [consul, kubernetes]
author: vikrant
comments: true
--- 


I was trying to make consul sync working on minikube setup for a long time. I found this [link](https://www.consul.io/docs/guides/minikube.html) 
for deployment of consul on minikube. I have followed the exact steps from the link only change which I made was values.yaml file. 

~~~
# Choose an optional name for the datacenter
global:
  datacenter: minidc

# Enable the Consul Web UI via a NodePort
ui:
  service:
    type: "NodePort"

# Enable Connect for secure communication between nodes
connectInject:
  enabled: true

syncCatalog:
  enabled: true

client:
  enabled: true
  grpc: true

# Use only one Consul server for local development
server:
  replicas: 1
  bootstrapExpect: 1
  disruptionBudget:
    enabled: true
    maxUnavailable: 0
~~~

- Created the following deployment and service in kubernetes. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Service
metadata:
  name: my-nginx
  labels:
    run: my-nginx
spec:
  ports:
  - port: 80
    protocol: TCP
  selector:
    run: my-nginx
  type: NodePort
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-nginx
spec:
  selector:
    matchLabels:
      run: my-nginx
  replicas: 2
  template:
    metadata:
      labels:
        run: my-nginx
    spec:
      containers:
      - name: my-nginx
        image: nginx
        ports:
        - containerPort: 80
EOF
~~~

- Added the configmap for kube-dns so that DNS queries for consul can be directly resolv.

~~~
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  labels:
    addonmanager.kubernetes.io/mode: EnsureExists
  name: kube-dns
  namespace: kube-system
data:
  stubDomains: |

    {"consul": ["$(kubectl get pod consulconnect1-server-0 -o jsonpath='{.status.podIP}'):8600"]}
EOF
~~~

it should reflect the following message in kube-dns

~~~
kubectl logs kube-dns-86f4d74b45-75524 -c kubedns -n kube-system
I1125 04:32:01.815892       1 dns.go:48] version: 1.14.8
I1125 04:32:01.816823       1 server.go:71] Using configuration read from directory: /kube-dns-config with period 10s
I1125 04:32:01.816904       1 server.go:119] FLAG: --alsologtostderr="false"
I1125 04:32:01.816912       1 server.go:119] FLAG: --config-dir="/kube-dns-config"
I1125 04:32:01.816917       1 server.go:119] FLAG: --config-map=""
I1125 04:32:01.816920       1 server.go:119] FLAG: --config-map-namespace="kube-system"
I1125 04:32:01.816923       1 server.go:119] FLAG: --config-period="10s"
I1125 04:32:01.816927       1 server.go:119] FLAG: --dns-bind-address="0.0.0.0"
I1125 04:32:01.816930       1 server.go:119] FLAG: --dns-port="10053"
I1125 04:32:01.816935       1 server.go:119] FLAG: --domain="cluster.local."
I1125 04:32:01.816940       1 server.go:119] FLAG: --federations=""
I1125 04:32:01.816944       1 server.go:119] FLAG: --healthz-port="8081"
I1125 04:32:01.816947       1 server.go:119] FLAG: --initial-sync-timeout="1m0s"
I1125 04:32:01.816950       1 server.go:119] FLAG: --kube-master-url=""
I1125 04:32:01.816954       1 server.go:119] FLAG: --kubecfg-file=""
I1125 04:32:01.816956       1 server.go:119] FLAG: --log-backtrace-at=":0"
I1125 04:32:01.816962       1 server.go:119] FLAG: --log-dir=""
I1125 04:32:01.816968       1 server.go:119] FLAG: --log-flush-frequency="5s"
I1125 04:32:01.816972       1 server.go:119] FLAG: --logtostderr="true"
I1125 04:32:01.816977       1 server.go:119] FLAG: --nameservers=""
I1125 04:32:01.816981       1 server.go:119] FLAG: --stderrthreshold="2"
I1125 04:32:01.816986       1 server.go:119] FLAG: --v="2"
I1125 04:32:01.816991       1 server.go:119] FLAG: --version="false"
I1125 04:32:01.817014       1 server.go:119] FLAG: --vmodule=""
I1125 04:32:01.817398       1 server.go:201] Starting SkyDNS server (0.0.0.0:10053)
I1125 04:32:01.817601       1 server.go:220] Skydns metrics enabled (/metrics:10055)
I1125 04:32:01.817676       1 dns.go:146] Starting endpointsController
I1125 04:32:01.817684       1 dns.go:149] Starting serviceController
I1125 04:32:01.817793       1 logs.go:41] skydns: ready for queries on cluster.local. for tcp://0.0.0.0:10053 [rcache 0]
I1125 04:32:01.817807       1 logs.go:41] skydns: ready for queries on cluster.local. for udp://0.0.0.0:10053 [rcache 0]
I1125 04:32:02.318314       1 dns.go:170] Initialized services and endpoints from apiserver
I1125 04:32:02.318341       1 server.go:135] Setting up Healthz Handler (/readiness)
I1125 04:32:02.318352       1 server.go:140] Setting up cache handler (/cache)
I1125 04:32:02.318359       1 server.go:126] Status HTTP port 8081
I1125 04:53:48.461291       1 dns.go:555] Could not find endpoints for service "consulconnect-server" in namespace "default". DNS records will be created once endpoints show up.
I1125 05:57:08.402680       1 dns.go:555] Could not find endpoints for service "consulconnect1-server" in namespace "default". DNS records will be created once endpoints show up.
I1125 06:37:11.818796       1 sync.go:167] Updated stubDomains to map[consul:[172.17.0.12:8600]]
I1125 06:37:11.818902       1 dns.go:197] Configuration updated: {TypeMeta:{Kind: APIVersion:} Federations:map[] StubDomains:map[consul:[172.17.0.12:8600]] UpstreamNameservers:[]}
~~~

- To resolve the DNS names start any POD which have the dns troubleshooting tools, you should be able to see the my-nginx service present in consul UI and also resolvable using consul DNS.

~~~
/ # dig my-nginx.service.consul

; <<>> DiG 9.11.2-P1 <<>> my-nginx.service.consul
;; global options: +cmd
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 16331
;; flags: qr aa rd ra; QUERY: 1, ANSWER: 2, AUTHORITY: 0, ADDITIONAL: 3

;; OPT PSEUDOSECTION:
; EDNS: version: 0, flags:; udp: 4096
;; QUESTION SECTION:
;my-nginx.service.consul.   IN  A

;; ANSWER SECTION:
my-nginx.service.consul. 0  IN  A   172.17.0.19
my-nginx.service.consul. 0  IN  A   172.17.0.18

;; ADDITIONAL SECTION:
my-nginx.service.consul. 0  IN  TXT "consul-network-segment="
my-nginx.service.consul. 0  IN  TXT "consul-network-segment="

;; Query time: 1 msec
;; SERVER: 10.96.0.10#53(10.96.0.10)
;; WHEN: Sun Nov 25 07:13:22 UTC 2018
;; MSG SIZE  rcvd: 156
~~~
