---
layout: post
title: How to integrate existing EFK with istio
tags: [istio, kubernetes]
category: [istio, kubernetes]
author: vikrant
comments: true
--- 

In this article, I am showing the steps to integrate the existing EFK stack with Istio for logging. 

#### Setup Information.

- minikube running with EFK plugin enabled.
- Istio deployed following official documentation with some components disabled. 

#### Steps for integration.

- Minikube version and addons list available with minikube. 

~~~
$ minikube version
minikube version: v0.30.0

$ minikube addons list
- addon-manager: enabled
- coredns: enabled
- dashboard: enabled
- default-storageclass: enabled
- efk: enabled
- freshpod: disabled
- heapster: enabled
- ingress: enabled
- kube-dns: disabled
- metrics-server: enabled
- nvidia-driver-installer: disabled
- nvidia-gpu-device-plugin: disabled
- registry: disabled
- registry-creds: disabled
- storage-provisioner: enabled
~~~

- Fluentd running inside the kube-system namespace. 

~~~
$ kubectl get pod -n kube-system -l k8s-app=fluentd-es
NAME               READY     STATUS    RESTARTS   AGE
fluentd-es-xnvlr   1/1       Running   0          4d
~~~

- By default, no service is present on fluentd in kube-system namespace, we need to create one for fluentd so that Istio can communicate using that service with fluentd. 

~~~
$ cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Service
metadata:
  name: fluentd-es
  namespace: kube-system
  labels:
    k8s-app: fluentd-es
spec:
  ports:
  - name: fluentd-tcp
    port: 24224
    protocol: TCP
    targetPort: 24224
  - name: fluentd-udp
    port: 24224
    protocol: UDP
    targetPort: 24224
  selector:
    k8s-app: fluentd-es
EOF
~~~

- Create the Istio configuration which consists of three sections: handler, metric instance and rule. 

~~~
$ cat <<EOF | kubectl create -f -
# Configuration for logentry instances
apiVersion: "config.istio.io/v1alpha2"
kind: logentry
metadata:
  name: newlog
  namespace: istio-system
spec:
  severity: '"info"'
  timestamp: request.time
  variables:
    source: source.labels["app"] | source.workload.name | "unknown"
    user: source.user | "unknown"
    destination: destination.labels["app"] | destination.workload.name | "unknown"
    responseCode: response.code | 0
    responseSize: response.size | 0
    latency: response.duration | "0ms"
  monitored_resource_type: '"UNSPECIFIED"'
---
# Configuration for a fluentd handler
apiVersion: "config.istio.io/v1alpha2"
kind: fluentd
metadata:
  name: handler
  namespace: istio-system
spec:
  address: "fluentd-es.kube-system:24224"
---
# Rule to send logentry instances to the fluentd handler
apiVersion: "config.istio.io/v1alpha2"
kind: rule
metadata:
  name: newlogtofluentd
  namespace: istio-system
spec:
  match: "true" # match for all requests
  actions:
   - handler: handler.fluentd
     instances:
     - newlog.logentry
EOF
~~~

- Start generating some traffic using some services which are alredy running in your setup with Istio sidecar injected. In my case I am using helloworld and curl POD to generate some traffic. 

- To see the messages logged by Istio in EFK stack, we can either using kibana or elasticsearch API calls. I preferred to use elasticsearch API calls. I issued the APIs using the elasticsearch service cluster IP and port 9200 from the curl POD. Since minikube is single node setup hence yellow WARNING is expected in elasticsearch status. Main query is the search query which is showing us the messages sent by Istio to fluent and fluentd to ES. 

~~~
[ root@curl-deploy-5f7684bb65-fpzpr:/ ]$ curl 10.103.150.23:9200/_cluster/health
?pretty
{
  "cluster_name" : "kubernetes-logging",
  "status" : "yellow",
  "timed_out" : false,
  "number_of_nodes" : 1,
  "number_of_data_nodes" : 1,
  "active_primary_shards" : 26,
  "active_shards" : 26,
  "relocating_shards" : 0,
  "initializing_shards" : 0,
  "unassigned_shards" : 26,
  "delayed_unassigned_shards" : 0,
  "number_of_pending_tasks" : 0,
  "number_of_in_flight_fetch" : 0,
  "task_max_waiting_in_queue_millis" : 0,
  "active_shards_percent_as_number" : 50.0
}

[ root@curl-deploy-5f7684bb65-fpzpr:/ ]$ curl 10.103.150.23:9200/_cat/indices?pr
etty
yellow open logstash-2018.12.24 zCpQf3GrTGCVUMakmeOg5g 5 1 24519 0 11.2mb 11.2mb
yellow open logstash-2018.12.25 9y6aKl4xQ8KhH2783SNPdg 5 1 41972 0 15.6mb 15.6mb
yellow open logstash-2018.12.26 eu4HP2yeT-q2z_7jci1UjQ 5 1 35177 0 14.9mb 14.9mb
yellow open logstash-2018.12.27 f3opUMQOSUavfT1VebzkMg 5 1 49941 0 23.6mb 23.6mb
yellow open .kibana             zRA9NpyOTreHxPv_I2EEiw 1 1     2 1 51.7kb 51.7kb
yellow open logstash-2018.12.28 GHLAHwiFRpmi8eVQPmAgtw 5 1 25215 0 11.5mb 11.5mb

[ root@curl-deploy-5f7684bb65-fpzpr:/ ]$ curl 10.103.150.23:9200/logstash-2018.1
2.28/_search?q=source:curl
{"took":73,"timed_out":false,"_shards":{"total":5,"successful":5,"skipped":0,"failed":0},"hits":{"total":27,"max_score":0.6931472,"hits":[{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf1G0vwTtLu8jUC5jwV","_score":0.6931472,"_source":{"source":"curl","user":"unknown","severity":"info","destination":"helloworld","latency":"163.685354ms","responseCode":200,"responseSize":60,"@timestamp":"2018-12-28T13:57:40+00:00","tag":"newlog.logentry.istio-system"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf1HO4oTtLu8jUC5jzF","_score":0.6931472,"_source":{"source":"curl","user":"unknown","destination":"telemetry","latency":"2.987937ms","severity":"info","responseCode":200,"responseSize":0,"@timestamp":"2018-12-28T13:59:28+00:00","tag":"newlog.logentry.istio-system"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf1HRWwTtLu8jUC5jzU","_score":0.6931472,"_source":{"user":"unknown","destination":"telemetry","severity":"info","latency":"1.794961ms","responseCode":200,"responseSize":0,"source":"curl","@timestamp":"2018-12-28T13:59:40+00:00","tag":"newlog.logentry.istio-system"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf0okaqTtLu8jUC5iFd","_score":0.5753642,"_source":{"level":"warn","time":"2018-12-28T11:45:28.718190Z","instance":"newlog.logentry.istio-system","destination":"helloworld","latency":"132.671999ms","responseCode":200,"responseSize":60,"source":"curl","user":"unknown","log":"{\"level\":\"warn\",\"time\":\"2018-12-28T11:45:28.718190Z\",\"instance\":\"newlog.logentry.istio-system\",\"destination\":\"helloworld\",\"latency\":\"132.671999ms\",\"responseCode\":200,\"responseSize\":60,\"source\":\"curl\",\"user\":\"unknown\"}\n","stream":"stdout","docker":{"container_id":"ca2320e8eb1309d1f6d2201e80e388aab284376eaa69f0d82467dce167ae12ed"},"kubernetes":{"container_name":"mixer","namespace_name":"istio-system","pod_name":"istio-telemetry-664d896cf5-tht8f","pod_id":"4d81df72-09be-11e9-9f03-0800274a2878","labels":{"app":"telemetry","istio":"mixer","istio-mixer-type":"telemetry","pod-template-hash":"664d896cf5"},"host":"minikube","master_url":"https://10.96.0.1:443/api"},"@timestamp":"2018-12-28T11:45:29+00:00","tag":"kubernetes.var.log.containers.istio-telemetry-664d896cf5-tht8f_istio-system_mixer-ca2320e8eb1309d1f6d2201e80e388aab284376eaa69f0d82467dce167ae12ed.log"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf1G0vwTtLu8jUC5jwX","_score":0.5753642,"_source":{"source":"curl","user":"unknown","destination":"helloworld","latency":"165.215147ms","responseCode":200,"responseSize":60,"severity":"info","@timestamp":"2018-12-28T13:57:40+00:00","tag":"newlog.logentry.istio-system"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf1HjkJTtLu8jUC5j1F","_score":0.5753642,"_source":{"destination":"telemetry","severity":"info","latency":"1.576953ms","responseCode":200,"responseSize":0,"source":"curl","user":"unknown","@timestamp":"2018-12-28T14:00:56+00:00","tag":"newlog.logentry.istio-system"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf1IdaBTtLu8jUC5j5e","_score":0.5753642,"_source":{"responseSize":0,"source":"curl","severity":"info","user":"unknown","destination":"telemetry","latency":"2.90946ms","responseCode":200,"@timestamp":"2018-12-28T14:04:52+00:00","tag":"newlog.logentry.istio-system"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf0qU5STtLu8jUC5iK7","_score":0.3254224,"_source":{"level":"warn","time":"2018-12-28T11:53:10.082719Z","instance":"newlog.logentry.istio-system","destination":"helloworld","destinationName":"helloworld-v2-54b97b8585-gwqt9","latency":"156.957259ms","responseCode":200,"responseSize":60,"source":"curl","sourceName":"curl-deploy-5f7684bb65-fpzpr","log":"{\"level\":\"warn\",\"time\":\"2018-12-28T11:53:10.082719Z\",\"instance\":\"newlog.logentry.istio-system\",\"destination\":\"helloworld\",\"destinationName\":\"helloworld-v2-54b97b8585-gwqt9\",\"latency\":\"156.957259ms\",\"responseCode\":200,\"responseSize\":60,\"source\":\"curl\",\"sourceName\":\"curl-deploy-5f7684bb65-fpzpr\"}\n","stream":"stdout","docker":{"container_id":"f125b5b53a11d19de6dc5821f3577c0f545c7348c9249ec85df654d39e64c773"},"kubernetes":{"container_name":"mixer","namespace_name":"istio-system","pod_name":"istio-telemetry-664d896cf5-jq65d","pod_id":"2a9a5a44-0a93-11e9-9f03-0800274a2878","labels":{"app":"telemetry","istio":"mixer","istio-mixer-type":"telemetry","pod-template-hash":"664d896cf5"},"host":"minikube","master_url":"https://10.96.0.1:443/api"},"@timestamp":"2018-12-28T11:53:11+00:00","tag":"kubernetes.var.log.containers.istio-telemetry-664d896cf5-jq65d_istio-system_mixer-f125b5b53a11d19de6dc5821f3577c0f545c7348c9249ec85df654d39e64c773.log"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf1G0vwTtLu8jUC5jwb","_score":0.3254224,"_source":{"destination":"telemetry","latency":"2.340568ms","responseCode":200,"responseSize":5,"severity":"info","source":"curl","user":"unknown","@timestamp":"2018-12-28T13:57:41+00:00","tag":"newlog.logentry.istio-system"}},{"_index":"logstash-2018.12.28","_type":"fluentd","_id":"AWf1GzikTtLu8jUC5jwL","_score":0.3254224,"_source":{"user":"unknown","destination":"helloworld","latency":"147.063828ms","responseCode":200,"responseSize":60,"severity":"info","source":"curl","@timestamp":"2018-12-28T13:57:38+00:00","tag":"newlog.logentry.istio-system"}}]}}
~~~