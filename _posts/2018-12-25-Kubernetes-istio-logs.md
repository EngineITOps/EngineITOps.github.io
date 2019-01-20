---
layout: post
title: Digging up the Istio logs
tags: [istio, kubernetes]
category: [istio, kubernetes]
author: vikrant
comments: true
--- 

In the previous [post](https://ervikrant06.github.io/istio/kubernetes/Kubernetes-istio-servicemesh/), I have run through the basic exercise with minimal installation of Istio. In this article, I am going to share information on architecture of Istio. 

Like I said in previous post, Istio is a control plane for envoy proxy. This control plane consists of multiple services, in minimal install only `istio-pilot` is installed which is responsible for pushing the configuration to envoy proxies running as a sidecar along with your POD. 

I am monitoring the logs of `discovery` container present in istio-pilot for whole of this exercise. 

$ kubectl logs -f istio-pilot-7847c99564-2vj6x -n istio-system -c discovery

Let's take a step by step approach to understand what magic Istio is doing in background. 

- If we start the deployment with injecting the sidecar only message reported in log. istio-pilot is getting this information from service discovery. 

~~~
2018-12-24T15:38:10.268577Z	info	Handling event update for pod helloworld-v1-7c45d5f8c4-bwvdb in namespace default -> 172.17.0.3
~~~

- After creating pod with sidecar following logs are reported. You may need to read [this](https://www.envoyproxy.io/docs/envoy/latest/) envoy for understanding the proxy configuration file. 

Welcome back:

Let's see what Istio-pilot is pushing to sidecar container in this case: 

~~~
2018-12-24T15:48:37.949085Z	info	Handling event update for pod helloworld-v1-575d9d9fcd-bjjj8 in namespace default -> 172.17.0.3
2018-12-24T15:48:45.929503Z	info	ads	ADS:CDS: REQ 172.17.0.3:59200 sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 3.993012266s raw: node:<id:"sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local" cluster:"helloworld" metadata:<fields:<key:"INTERCEPTION_MODE" value:<string_value:"REDIRECT" > > fields:<key:"ISTIO_PROXY_SHA" value:<string_value:"istio-proxy:930841ca88b15365737acb7eddeea6733d4f98b9" > > fields:<key:"ISTIO_PROXY_VERSION" value:<string_value:"1.0.2" > > fields:<key:"ISTIO_VERSION" value:<string_value:"1.0.5" > > fields:<key:"POD_NAME" value:<string_value:"helloworld-v1-575d9d9fcd-bjjj8" > > fields:<key:"app" value:<string_value:"helloworld" > > fields:<key:"istio" value:<string_value:"sidecar" > > fields:<key:"version" value:<string_value:"v1" > > > build_version:"0/1.8.0-dev//RELEASE" > type_url:"type.googleapis.com/envoy.api.v2.Cluster"
2018-12-24T15:48:45.929875Z	info	ads	CDS: PUSH 2018-12-24T15:35:09Z/16 for helloworld-v1-575d9d9fcd-bjjj8.default "172.17.0.3:59200", Clusters: 16, Services 11
2018-12-24T15:48:45.952134Z	info	ads	EDS: PUSH for sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 clusters 15 endpoints 15 empty 0
2018-12-24T15:48:45.963934Z	info	ads	LDS: PUSH for node:helloworld-v1-575d9d9fcd-bjjj8.default addr:"172.17.0.3:59200" listeners:16 11253
2018-12-24T15:48:45.980973Z	info	ads	ADS: RDS: PUSH for node: helloworld-v1-575d9d9fcd-bjjj8.default addr:172.17.0.3:59200 routes:4 ver:2018-12-24T15:35:09Z/16
~~~

It's sending the metadata information related to cluster and then pushing the cluster information. 

~~~
Output from `/etc/istio/proxy/envoy-rev0.json` inside the sidecar container. 

  "node": {
    "id": "sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local",
    "cluster": "helloworld",

    "metadata": {"INTERCEPTION_MODE":"REDIRECT","ISTIO_PROXY_SHA":"istio-proxy:930841ca88b15365737acb7eddeea6733
d4f98b9","ISTIO_PROXY_VERSION":"1.0.2","ISTIO_VERSION":"1.0.5","POD_NAME":"helloworld-v1-575d9d9fcd-bjjj8","app"
:"helloworld","istio":"sidecar","version":"v1"}
    }
~~~

After pushing the cluster configuration, istio-pilot pushing EDS (Endpoint discovery service), LDS (Link Discovery service) and RDS (Route Discover service).

So this is the section which is telling the envoy to seek the information from istio-pilot.

~~~
    "hosts": [
    {
    "socket_address": {"address": "istio-pilot.istio-system", "port_value": 15010}
    }    
~~~

- Before creating the helloworld v2 version, I thought of creating the helloworld service. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Service
metadata:
  name: helloworld
  labels:
    app: helloworld
spec:
  ports:
  - port: 5000
    name: http
  selector:
    app: helloworld
EOF
service "helloworld" created
~~~

Following chunk of logs is reported 

~~~
2018-12-24T16:27:52.163519Z	info	Handle service helloworld in namespace default
2018-12-24T16:27:52.185734Z	info	Handle EDS endpoint helloworld in namespace default -> [{[{172.17.0.3  0xc420a33620 &ObjectReference{Kind:Pod,Namespace:default,Name:helloworld-v1-575d9d9fcd-bjjj8,UID:5f0597a9-0793-11e9-9f03-0800274a2878,APIVersion:,ResourceVersion:29313,FieldPath:,}}] [] [{http 5000 TCP}]}] [0xc420d1e9c0]
2018-12-24T16:27:52.464702Z	info	Push debounce stable 55: 278.709937ms since last change, 29.590140214s since last push, full=true
2018-12-24T16:27:52.468643Z	info	ads	XDS: Pushing 2018-12-24T16:27:52Z/20 Services: 12, VirtualServices: 0, ConnectedEndpoints: 1
2018-12-24T16:27:52.469170Z	info	ads	Cluster init time 386.974µs 2018-12-24T16:27:52Z/20
2018-12-24T16:27:52.469230Z	info	ads	PushAll done 2018-12-24T16:27:52Z/20 9.594µs
2018-12-24T16:27:52.469488Z	info	ads	CDS: PUSH 2018-12-24T16:27:52Z/20 for helloworld-v1-575d9d9fcd-bjjj8.default "172.17.0.3:59200", Clusters: 18, Services 12
2018-12-24T16:27:52.471589Z	info	ads	EDS: PUSH for sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 clusters 15 endpoints 15 empty 0
2018-12-24T16:27:52.478487Z	info	ads	ADS: RDS: PUSH for node: helloworld-v1-575d9d9fcd-bjjj8.default addr:172.17.0.3:59200 routes:5 ver:2018-12-24T16:27:52Z/20
2018-12-24T16:27:52.478979Z	info	Uses TLS multiplexing for helloworld.default.svc.cluster.local {http 5000 HTTP}

2018-12-24T16:27:52.513024Z	info	ads	LDS: PUSH for node:helloworld-v1-575d9d9fcd-bjjj8.default addr:"172.17.0.3:59200" listeners:18 16667
2018-12-24T16:27:52.513175Z	info	ads	Push finished: 48.293014ms {
    "ProxyStatus": {},
    "Start": "2018-12-24T16:27:52.464875563Z",
    "End": "2018-12-24T16:27:52.513045891Z"
}
2018-12-24T16:27:52.513331Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|15010||istio-pilot.istio-system.svc.cluster.local
2018-12-24T16:27:52.513376Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|15011||istio-pilot.istio-system.svc.cluster.local
gc 152 @16089.641s 0%: 0.011+10+7.0 ms clock, 0.045+7.5/7.9/13+28 ms cpu, 11->11->6 MB, 12 MB goal, 4 P
2018-12-24T16:27:52.513606Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|443||kubernetes.default.svc.cluster.local
2018-12-24T16:27:52.513718Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|443||metrics-server.kube-system.svc.cluster.local
2018-12-24T16:27:52.513727Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|53||kube-dns.kube-system.svc.cluster.local
2018-12-24T16:27:52.513732Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|5601||kibana-logging.kube-system.svc.cluster.local
2018-12-24T16:27:52.513737Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|8080||istio-pilot.istio-system.svc.cluster.local
2018-12-24T16:27:52.513742Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|8083||monitoring-influxdb.kube-system.svc.cluster.local
2018-12-24T16:27:52.513747Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|8086||monitoring-influxdb.kube-system.svc.cluster.local
2018-12-24T16:27:52.516493Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|80||default-http-backend.kube-system.svc.cluster.local
2018-12-24T16:27:52.516515Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|80||heapster.kube-system.svc.cluster.local
2018-12-24T16:27:52.516521Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|80||kubernetes-dashboard.kube-system.svc.cluster.local
2018-12-24T16:27:52.516527Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|80||monitoring-grafana.kube-system.svc.cluster.local
2018-12-24T16:27:52.516532Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|9093||istio-pilot.istio-system.svc.cluster.local
2018-12-24T16:27:52.516538Z	info	ads	EDS: remove unwatched cluster node=sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 cluster=outbound|9200||elasticsearch-logging.kube-system.svc.cluster.local
2018-12-24T16:27:52.517353Z	info	ads	EDS: PUSH for sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 clusters 16 endpoints 16 empty 0
~~~

We have seen movement in the logs of istio-proxy (envoy) after creating the service. 

~~~
From : kubectl logs -f helloworld-v1-575d9d9fcd-bjjj8 -c istio-proxy

[2018-12-24 16:27:52.484][18][info][upstream] external/envoy/source/common/upstream/cluster_manager_impl.cc:500] add/update cluster outbound|5000||helloworld.default.svc.cluster.local starting warming
[2018-12-24 16:27:52.495][18][info][upstream] external/envoy/source/common/upstream/cluster_manager_impl.cc:500] add/update cluster inbound|5000||helloworld.default.svc.cluster.local starting warming
[2018-12-24 16:27:52.495][18][info][upstream] external/envoy/source/common/upstream/cluster_manager_impl.cc:512] warming cluster inbound|5000||helloworld.default.svc.cluster.local complete
[2018-12-24 16:27:52.501][18][info][upstream] external/envoy/source/common/upstream/cluster_manager_impl.cc:512] warming cluster outbound|5000||helloworld.default.svc.cluster.local complete
[2018-12-24 16:27:52.529][18][info][upstream] external/envoy/source/server/lds_api.cc:80] lds: add/update listener '172.17.0.3_5000'
[2018-12-24 16:27:52.531][18][info][upstream] external/envoy/source/server/lds_api.cc:80] lds: add/update listener '0.0.0.0_5000'
~~~


- Time to add another POD with v2 version. No movement in pod v1 istio-proxy logs.

Following istio-pilot logs indicates that EDS (Endpoint incremental change) is pushed to existing helloworld v1. 

~~~
2018-12-24T16:41:43.016663Z	info	Handling event update for pod helloworld-v2-54b97b8585-725mx in namespace default -> 172.17.0.14
2018-12-24T16:41:43.035372Z	info	Handle EDS endpoint helloworld in namespace default -> [{[{172.17.0.3  0xc42062bf30 &ObjectReference{Kind:Pod,Namespace:default,Name:helloworld-v1-575d9d9fcd-bjjj8,UID:5f0597a9-0793-11e9-9f03-0800274a2878,APIVersion:,ResourceVersion:29313,FieldPath:,}}] [{172.17.0.14  0xc42062bf50 &ObjectReference{Kind:Pod,Namespace:default,Name:helloworld-v2-54b97b8585-725mx,UID:ca46710b-079a-11e9-9f03-0800274a2878,APIVersion:,ResourceVersion:34260,FieldPath:,}}] [{http 5000 TCP}]}] [0xc4209ebf20]
2018-12-24T16:41:43.236706Z	info	Push debounce stable 56: 201.26999ms since last change, 13m50.771858104s since last push, full=false
2018-12-24T16:41:43.236737Z	info	ads	XDS Incremental Push EDS:12
2018-12-24T16:41:43.236774Z	info	ads	XDS:EDSInc Pushing 2018-12-24T16:27:52Z/20 Services: map[monitoring-grafana.kube-system.svc.cluster.local:0xc420a52d50 default-http-backend.kube-system.svc.cluster.local:0xc420a52fc0 metrics-server.kube-system.svc.cluster.local:0xc420a53020 monitoring-influxdb.kube-system.svc.cluster.local:0xc420a52f50 istio-pilot.istio-system.svc.cluster.local:0xc4206418a0 helloworld.default.svc.cluster.local:0xc420641520 kubernetes.default.svc.cluster.local:0xc4206416f0 kube-dns.kube-system.svc.cluster.local:0xc420a52c90 kubernetes-dashboard.kube-system.svc.cluster.local:0xc420a52db0 heapster.kube-system.svc.cluster.local:0xc420a52e10 elasticsearch-logging.kube-system.svc.cluster.local:0xc420a52cf0 kibana-logging.kube-system.svc.cluster.local:0xc420a52e70], VirtualServices: 0, ConnectedEndpoints: 1
2018-12-24T16:41:43.236864Z	info	ads	Cluster init time 84.202µs 2018-12-24T16:27:52Z/20
2018-12-24T16:41:43.236889Z	info	ads	PushAll done 2018-12-24T16:27:52Z/20 18.827µs
2018-12-24T16:41:43.236996Z	info	ads	EDS: INC PUSH for sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 clusters 16 endpoints 15 empty 1
2018-12-24T16:41:44.032374Z	info	Handling event update for pod helloworld-v2-54b97b8585-725mx in namespace default -> 172.17.0.14
2018-12-24T16:41:44.038589Z	info	Handle EDS endpoint helloworld in namespace default -> [{[{172.17.0.14  0xc4206407a0 &ObjectReference{Kind:Pod,Namespace:default,Name:helloworld-v2-54b97b8585-725mx,UID:ca46710b-079a-11e9-9f03-0800274a2878,APIVersion:,ResourceVersion:34269,FieldPath:,}} {172.17.0.3  0xc4206407b0 &ObjectReference{Kind:Pod,Namespace:default,Name:helloworld-v1-575d9d9fcd-bjjj8,UID:5f0597a9-0793-11e9-9f03-0800274a2878,APIVersion:,ResourceVersion:29313,FieldPath:,}}] [] [{http 5000 TCP}]}] [0xc420d9e420 0xc420d9e540]
2018-12-24T16:41:44.164053Z	info	ads	ADS:CDS: REQ 172.17.0.14:44282 sidecar~172.17.0.14~helloworld-v2-54b97b8585-725mx.default~default.svc.cluster.local-9 56.839µs raw: node:<id:"sidecar~172.17.0.14~helloworld-v2-54b97b8585-725mx.default~default.svc.cluster.local" cluster:"helloworld" metadata:<fields:<key:"INTERCEPTION_MODE" value:<string_value:"REDIRECT" > > fields:<key:"ISTIO_PROXY_SHA" value:<string_value:"istio-proxy:930841ca88b15365737acb7eddeea6733d4f98b9" > > fields:<key:"ISTIO_PROXY_VERSION" value:<string_value:"1.0.2" > > fields:<key:"ISTIO_VERSION" value:<string_value:"1.0.5" > > fields:<key:"POD_NAME" value:<string_value:"helloworld-v2-54b97b8585-725mx" > > fields:<key:"app" value:<string_value:"helloworld" > > fields:<key:"istio" value:<string_value:"sidecar" > > fields:<key:"version" value:<string_value:"v2" > > > build_version:"0/1.8.0-dev//RELEASE" > type_url:"type.googleapis.com/envoy.api.v2.Cluster"
2018-12-24T16:41:44.164409Z	info	ads	CDS: PUSH 2018-12-24T16:27:52Z/20 for helloworld-v2-54b97b8585-725mx.default "172.17.0.14:44282", Clusters: 18, Services 12
2018-12-24T16:41:44.185269Z	info	ads	EDS: PUSH for sidecar~172.17.0.14~helloworld-v2-54b97b8585-725mx.default~default.svc.cluster.local-9 clusters 16 endpoints 15 empty 1
2018-12-24T16:41:44.188511Z	info	Uses TLS multiplexing for helloworld.default.svc.cluster.local {http 5000 HTTP}

2018-12-24T16:41:44.205817Z	info	ads	LDS: PUSH for node:helloworld-v2-54b97b8585-725mx.default addr:"172.17.0.14:44282" listeners:18 16671
gc 159 @16921.351s 0%: 0.012+8.0+6.1 ms clock, 0.050+0.58/3.7/4.3+24 ms cpu, 11->12->6 MB, 12 MB goal, 4 P
2018-12-24T16:41:44.239763Z	info	Push debounce stable 57: 200.938979ms since last change, 1.0029814s since last push, full=false
2018-12-24T16:41:44.239991Z	info	ads	XDS Incremental Push EDS:1
2018-12-24T16:41:44.241117Z	info	ads	XDS:EDSInc Pushing 2018-12-24T16:27:52Z/20 Services: map[helloworld.default.svc.cluster.local:0xc420641520], VirtualServices: 0, ConnectedEndpoints: 2
2018-12-24T16:41:44.241286Z	info	ads	Cluster init time 49.901µs 2018-12-24T16:27:52Z/20
2018-12-24T16:41:44.241444Z	info	ads	PushAll done 2018-12-24T16:27:52Z/20 104.926µs
2018-12-24T16:41:44.241736Z	info	ads	EDS: INC PUSH for sidecar~172.17.0.14~helloworld-v2-54b97b8585-725mx.default~default.svc.cluster.local-9 clusters 16 endpoints 1 empty 0
2018-12-24T16:41:44.241749Z	info	ads	EDS: INC PUSH for sidecar~172.17.0.3~helloworld-v1-575d9d9fcd-bjjj8.default~default.svc.cluster.local-8 clusters 16 endpoints 1 empty 0
2018-12-24T16:41:44.244961Z	info	ads	ADS: RDS: PUSH for node: helloworld-v2-54b97b8585-725mx.default addr:172.17.0.14:44282 routes:5 ver:2018-12-24T16:27:52Z/20
~~~


- Created another curl POD, it does the same thing which it has done for helloworld. No movement in logs of helloworld is reported.

`kubectl create -f <(istioctl kube-inject -f curl-deploy.yaml)`

~~~
2018-12-24T16:45:15.429910Z	info	Handling event update for pod curl-deploy-5f7684bb65-x5j26 in namespace default -> 172.17.0.15
2018-12-24T16:45:16.458860Z	info	Handling event update for pod curl-deploy-5f7684bb65-x5j26 in namespace default -> 172.17.0.15
2018-12-24T16:45:31.840011Z	info	Handling event update for pod curl-deploy-5f7684bb65-x5j26 in namespace default -> 172.17.0.15
2018-12-24T16:45:32.012493Z	info	ads	ADS:CDS: REQ 172.17.0.15:45084 sidecar~172.17.0.15~curl-deploy-5f7684bb65-x5j26.default~default.svc.cluster.local-10 35.484µs raw: node:<id:"sidecar~172.17.0.15~curl-deploy-5f7684bb65-x5j26.default~default.svc.cluster.local" cluster:"curl" metadata:<fields:<key:"INTERCEPTION_MODE" value:<string_value:"REDIRECT" > > fields:<key:"ISTIO_PROXY_SHA" value:<string_value:"istio-proxy:930841ca88b15365737acb7eddeea6733d4f98b9" > > fields:<key:"ISTIO_PROXY_VERSION" value:<string_value:"1.0.2" > > fields:<key:"ISTIO_VERSION" value:<string_value:"1.0.5" > > fields:<key:"POD_NAME" value:<string_value:"curl-deploy-5f7684bb65-x5j26" > > fields:<key:"app" value:<string_value:"curl" > > fields:<key:"istio" value:<string_value:"sidecar" > > > build_version:"0/1.8.0-dev//RELEASE" > type_url:"type.googleapis.com/envoy.api.v2.Cluster"
2018-12-24T16:45:32.012743Z	info	ads	CDS: PUSH 2018-12-24T16:27:52Z/20 for curl-deploy-5f7684bb65-x5j26.default "172.17.0.15:45084", Clusters: 17, Services 12
2018-12-24T16:45:32.029937Z	info	ads	EDS: PUSH for sidecar~172.17.0.15~curl-deploy-5f7684bb65-x5j26.default~default.svc.cluster.local-10 clusters 16 endpoints 15 empty 1
2018-12-24T16:45:32.035645Z	info	ads	LDS: PUSH for node:curl-deploy-5f7684bb65-x5j26.default addr:"172.17.0.15:45084" listeners:17 12408
2018-12-24T16:45:32.052889Z	info	ads	ADS: RDS: PUSH for node: curl-deploy-5f7684bb65-x5j26.default addr:172.17.0.15:45084 routes:5 ver:2018-12-24T16:27:52Z/20
~~~

#### Summary

- Any new creation will follow the below sequence of actions:

  - CDS updates (if any) must always be pushed first.
  - EDS updates (if any) must arrive after CDS updates for the respective clusters.
  - LDS updates must arrive after corresponding CDS/EDS updates.
  - RDS updates related to the newly added listeners must arrive in the end.
  - Stale CDS clusters and related EDS endpoints (ones no longer being referenced) can then be removed.

- Any update will follow the below sequence of actions:

  - CDS
  - EDS
  - LDS
  - EDSInc (For service)
  - EDS: INC PUSH for sidecars of helloworld v1/v2
  - RDS push for helloworld v2


[1] https://github.com/envoyproxy/data-plane-api/blob/master/XDS_PROTOCOL.md  