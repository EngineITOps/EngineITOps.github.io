---
layout: post
title: Istio telemetry deep dive
tags: [istio, kubernetes]
category: [istio, kubernetes]
author: vikrant
comments: true
--- 

In previous post introduction was provided to istio telemetry part. In this article, I am using the examples [1] from official documentation to dig more on logging and metric part of istio-mixer. 

Modified the logging example by removing and adding some extra variables. Used metric example as it's. 

~~~
cat <<EOF | kubectl create -f -
# Configuration for logentry instances
apiVersion: "config.istio.io/v1alpha2"
kind: logentry
metadata:
  name: newlog
  namespace: istio-system
spec:
  severity: '"warning"'
  timestamp: request.time
  variables:
    source: source.labels["app"] | source.workload.name | "unknown"
    destination: destination.labels["app"] | destination.workload.name | "unknown"
    responseCode: response.code | 0
    responseSize: response.size | 0
    latency: response.duration | "0ms"
    destinationName: destination.name | "unknown"
    sourceName: source.name | "unknown"
  monitored_resource_type: '"UNSPECIFIED"'
---
# Configuration for a stdio handler
apiVersion: "config.istio.io/v1alpha2"
kind: stdio
metadata:
  name: newhandler
  namespace: istio-system
spec:
 severity_levels:
   warning: 1 # Params.Level.WARNING
 outputAsJson: true
---
# Rule to send logentry instances to a stdio handler
apiVersion: "config.istio.io/v1alpha2"
kind: rule
metadata:
  name: newlogstdio
  namespace: istio-system
spec:
  match: "true" # match for all requests
  actions:
   - handler: newhandler.stdio
     instances:
     - newlog.logentry
EOF
~~~

- Using same helloworld and curl deployments which I used in the previous article, only difference is that this time both are deployed in default namespace. 

- While issuing GET call on helloworld app from the curl deployments. Following logs are reported in mixer container part of istio-telemetry POD. By default when you deploy istio without customization, istio mixer deployment deploys two POD and I have noticed both PODs receives the messages related to policy and telemetry. 

~~~
$ kubectl logs -f istio-telemetry-664d896cf5-tht8f -n istio-system -c mixer

{"level":"warn","time":"2018-12-28T11:53:10.083270Z","instance":"newlog.logentry.istio-system","destination":"policy","destinationName":"istio-policy-6fcb6d655f-hhxbr","latency":"1.192326ms","responseCode":200,"responseSize":70,"source":"helloworld","sourceName":"helloworld-v2-54b97b8585-gwqt9"}

{"level":"info","time":"2018-12-28T11:53:10.083270Z","instance":"accesslog.logentry.istio-system","apiClaims":"","apiKey":"","clientTraceId":"","connection_security_policy":"none","destinationApp":"policy","destinationIp":"172.17.0.20","destinationName":"istio-policy-6fcb6d655f-hhxbr","destinationNamespace":"istio-system","destinationOwner":"kubernetes://apis/apps/v1/namespaces/istio-system/deployments/istio-policy","destinationPrincipal":"","destinationServiceHost":"istio-policy.istio-system.svc.cluster.local","destinationWorkload":"istio-policy","httpAuthority":"mixer","latency":"1.192326ms","method":"POST","protocol":"http","receivedBytes":1168,"referer":"","reporter":"destination","requestId":"eed8f8fd-43c9-44a5-99f2-b198d9dc8d29","requestSize":684,"requestedServerName":"","responseCode":200,"responseSize":70,"responseTimestamp":"2018-12-28T11:53:10.084310Z","sentBytes":206,"sourceApp":"helloworld","sourceIp":"172.17.0.26","sourceName":"helloworld-v2-54b97b8585-gwqt9","sourceNamespace":"default","sourceOwner":"kubernetes://apis/apps/v1/namespaces/default/deployments/helloworld-v2","sourcePrincipal":"","sourceWorkload":"helloworld-v2","url":"/istio.mixer.v1.Mixer/Check","userAgent":"","xForwardedFor":"172.17.0.26"}

{"level":"info","time":"2018-12-28T11:53:10.082342Z","instance":"accesslog.logentry.istio-system","apiClaims":"","apiKey":"","clientTraceId":"","connection_security_policy":"unknown","destinationApp":"helloworld","destinationIp":"172.17.0.26","destinationName":"helloworld-v2-54b97b8585-gwqt9","destinationNamespace":"default","destinationOwner":"kubernetes://apis/apps/v1/namespaces/default/deployments/helloworld-v2","destinationPrincipal":"","destinationServiceHost":"helloworld.default.svc.cluster.local","destinationWorkload":"helloworld-v2","httpAuthority":"helloworld.default.svc.cluster.local:5000","latency":"157.830203ms","method":"GET","protocol":"http","receivedBytes":309,"referer":"","reporter":"source","requestId":"64016022-eb7c-9157-a43b-2ec3995981fa","requestSize":0,"requestedServerName":"","responseCode":200,"responseSize":60,"responseTimestamp":"2018-12-28T11:53:10.240136Z","sentBytes":198,"sourceApp":"curl","sourceIp":"172.17.0.14","sourceName":"curl-deploy-5f7684bb65-fpzpr","sourceNamespace":"default","sourceOwner":"kubernetes://apis/apps/v1/namespaces/default/deployments/curl-deploy","sourcePrincipal":"","sourceWorkload":"curl-deploy","url":"/hello","userAgent":"curl/7.35.0","xForwardedFor":"0.0.0.0"}

{"level":"warn","time":"2018-12-28T11:53:10.082342Z","instance":"newlog.logentry.istio-system","destination":"helloworld","destinationName":"helloworld-v2-54b97b8585-gwqt9","latency":"157.830203ms","responseCode":200,"responseSize":60,"source":"curl","sourceName":"curl-deploy-5f7684bb65-fpzpr"}

{"level":"warn","time":"2018-12-28T11:53:11.084935Z","instance":"newlog.logentry.istio-system","destination":"telemetry","destinationName":"istio-telemetry-664d896cf5-tht8f","latency":"2.109818ms","responseCode":200,"responseSize":5,"source":"policy","sourceName":"istio-policy-6fcb6d655f-hhxbr"}

{"level":"info","time":"2018-12-28T11:53:11.084935Z","instance":"accesslog.logentry.istio-system","apiClaims":"","apiKey":"","clientTraceId":"","connection_security_policy":"none","destinationApp":"telemetry","destinationIp":"172.17.0.21","destinationName":"istio-telemetry-664d896cf5-tht8f","destinationNamespace":"istio-system","destinationOwner":"kubernetes://apis/apps/v1/namespaces/istio-system/deployments/istio-telemetry","destinationPrincipal":"","destinationServiceHost":"istio-telemetry.istio-system.svc.cluster.local","destinationWorkload":"istio-telemetry","httpAuthority":"mixer","latency":"2.109818ms","method":"POST","protocol":"http","receivedBytes":1331,"referer":"","reporter":"destination","requestId":"77700cba-c94c-4e16-817d-bbb09e6296f1","requestSize":939,"requestedServerName":"","responseCode":200,"responseSize":5,"responseTimestamp":"2018-12-28T11:53:11.086953Z","sentBytes":141,"sourceApp":"policy","sourceIp":"172.17.0.20","sourceName":"istio-policy-6fcb6d655f-hhxbr","sourceNamespace":"istio-system","sourceOwner":"kubernetes://apis/apps/v1/namespaces/istio-system/deployments/istio-policy","sourcePrincipal":"","sourceWorkload":"istio-policy","url":"/istio.mixer.v1.Mixer/Report","userAgent":"","xForwardedFor":"172.17.0.20"}

{"level":"info","time":"2018-12-28T11:53:11.241351Z","instance":"accesslog.logentry.istio-system","apiClaims":"","apiKey":"","clientTraceId":"","connection_security_policy":"none","destinationApp":"telemetry","destinationIp":"172.17.0.21","destinationName":"istio-telemetry-664d896cf5-tht8f","destinationNamespace":"istio-system","destinationOwner":"kubernetes://apis/apps/v1/namespaces/istio-system/deployments/istio-telemetry","destinationPrincipal":"","destinationServiceHost":"istio-telemetry.istio-system.svc.cluster.local","destinationWorkload":"istio-telemetry","httpAuthority":"mixer","latency":"4.497147ms","method":"POST","protocol":"http","receivedBytes":1207,"referer":"","reporter":"destination","requestId":"15c61079-29d0-416b-aa25-e93298dcf314","requestSize":823,"requestedServerName":"","responseCode":200,"responseSize":5,"responseTimestamp":"2018-12-28T11:53:11.245749Z","sentBytes":141,"sourceApp":"curl","sourceIp":"172.17.0.14","sourceName":"curl-deploy-5f7684bb65-fpzpr","sourceNamespace":"default","sourceOwner":"kubernetes://apis/apps/v1/namespaces/default/deployments/curl-deploy","sourcePrincipal":"","sourceWorkload":"curl-deploy","url":"/istio.mixer.v1.Mixer/Report","userAgent":"","xForwardedFor":"172.17.0.14"}

{"level":"warn","time":"2018-12-28T11:53:11.241351Z","instance":"newlog.logentry.istio-system","destination":"telemetry","destinationName":"istio-telemetry-664d896cf5-tht8f","latency":"4.497147ms","responseCode":200,"responseSize":5,"source":"curl","sourceName":"curl-deploy-5f7684bb65-fpzpr"}
~~~

- If we look at the above logs, we can easily identify the logs which are result of our customized logging configuration. All of these logs are starting with `level:warn`. Rest of the logs are reported by sidecar istio-proxy containers to mixer. Following sequence of action happens.

a) Issue a call from curl POD. Call will reach the sidecar container of curl POD. 
b) Side care will issue a call to sidecar container of policy POD running in istio-system ns. If policy allows call will go to helloworld app.
   i) Will report to istio-telemetry about this call. 
c) From helloworld sidecar POD to helloworld POD.
d) Response from helloworld app to it's sidecar and then to curl POD sidecar. 
   i) curl POD sidecar will report to istio-telemetry about the response. 

So in nutshell, telemetry is called twice:

1) By the curl POD side when it received the response. 
2) By the policy POD sidecar 

But if I perform the prometheus query `istio_double_request_count{destination="istio-telemetry"}` it's reporting the stats from more than two sources which we were expecting as per the logs. It's also reporting the response which it receives from helloworld app. 

~~~
istio_double_request_count{destination="istio-telemetry",instance="172.17.0.21:42422",job="istio-mesh",message="twice the fun!",reporter="server",source="curl-deploy"} 12
istio_double_request_count{destination="istio-telemetry",instance="172.17.0.21:42422",job="istio-mesh",message="twice the fun!",reporter="server",source="helloworld-v1"} 4
istio_double_request_count{destination="istio-telemetry",instance="172.17.0.21:42422",job="istio-mesh",message="twice the fun!",reporter="server",source="helloworld-v2"} 6
istio_double_request_count{destination="istio-telemetry",instance="172.17.0.21:42422",job="istio-mesh",message="twice the fun!",reporter="server",source="istio-policy"}  20
istio_double_request_count{destination="istio-telemetry",instance="172.17.0.27:42422",job="istio-mesh",message="twice the fun!",reporter="server",source="curl-deploy"} 4
istio_double_request_count{destination="istio-telemetry",instance="172.17.0.27:42422",job="istio-mesh",message="twice the fun!",reporter="server",source="helloworld-v2"} 4
~~~

I thought may be PILOT_TRACE_SAMPLE is set to lower value, nope, it's also at 100%

~~~
kubectl exec -it istio-pilot-698959c67b-6r99t -c discovery -n istio-system -- env | grep PILOT_TRACE_SAMPLING
PILOT_TRACE_SAMPLING=100
~~~

root@istio-pilot-698959c67b-6r99t:/# env | grep PILOT_TRACE_SAMPLING
PILOT_TRACE_SAMPLING=100

[1] https://istio.io/docs/tasks/telemetry/metrics-logs/