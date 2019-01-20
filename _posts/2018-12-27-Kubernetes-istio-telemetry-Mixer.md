---
layout: post
title: Istio telemetry
tags: [istio, kubernetes]
category: [istio, kubernetes]
author: vikrant
comments: true
--- 

Istio Mixer component is responsible for telemetry. While generating the HTTP GET request for helloworld service from curl POD I kept an eye on mixer logs, I found number of logs reported.

~~~
$ kubectl logs -f istio-telemetry-664d896cf5-tht8f -n istio-system -c mixer
{"level":"info","time":"2018-12-27T13:13:14.263217Z","instance":"accesslog.logentry.istio-system","apiClaims":"","apiKey":"","clientTraceId":"","connection_security_policy":"none","destinationApp":"policy","destinationIp":"172.17.0.20","destinationName":"istio-policy-6fcb6d655f-hhxbr","destinationNamespace":"istio-system","destinationOwner":"kubernetes://apis/apps/v1/namespaces/istio-system/deployments/istio-policy","destinationPrincipal":"","destinationServiceHost":"istio-policy.istio-system.svc.cluster.local","destinationWorkload":"istio-policy","httpAuthority":"mixer","latency":"1.145884ms","method":"POST","protocol":"http","receivedBytes":1387,"referer":"","reporter":"destination","requestId":"5c654243-cdfc-403a-bc53-7d46d37f49b2","requestSize":899,"requestedServerName":"","responseCode":200,"responseSize":70,"responseTimestamp":"2018-12-27T13:13:14.264281Z","sentBytes":206,"sourceApp":"helloworld","sourceIp":"172.17.0.14","sourceName":"helloworld-v1-575d9d9fcd-58rf6","sourceNamespace":"helloworld","sourceOwner":"kubernetes://apis/apps/v1/namespaces/helloworld/deployments/helloworld-v1","sourcePrincipal":"","sourceWorkload":"helloworld-v1","url":"/istio.mixer.v1.Mixer/Check","userAgent":"","xForwardedFor":"172.17.0.14"}
~~~

I studied about the architecture of mixer from official documentation so the sidecar running along with your POD is reponsible for sending this information to mixer. Sidecare is adding metadata information like clientTraceId, xForwardedFor, etc. before passing the information to mixer. 

Istio mixer is mainly using following three CRDs for complete pipeline:


- Templates define the schema for specifying request mapping from attributes to adapter inputs. A given adapter may support any number of templates. Metric is a type of template, all the resources of type of metric are instances. 
~~~
$ kubectl get metric -n istio-system
NAME              AGE
requestcount      3h
requestduration   3h
requestsize       3h
responsesize      3h
tcpbytereceived   3h
tcpbytesent       3h
~~~

Dimensions are the attributes and same attributes are define as adapter inputts. 

~~~
kubectl describe metric requestcount -n istio-system
Name:         requestcount
Namespace:    istio-system
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"config.istio.io/v1alpha2","kind":"metric","metadata":{"annotations":{},"name":"requestcount","namespace":"istio-system"},"spec":{"dimens...
API Version:  config.istio.io/v1alpha2
Kind:         metric
Metadata:
  Creation Timestamp:  2018-12-27T10:00:57Z
  Generation:          1
  Resource Version:    199841
  Self Link:           /apis/config.istio.io/v1alpha2/namespaces/istio-system/metrics/requestcount
  UID:                 4e976e84-09be-11e9-9f03-0800274a2878
Spec:
  Dimensions:
    Connection _ Security _ Policy:      conditional((context.reporter.kind | "inbound") == "outbound", "unknown", conditional(connection.mtls | false, "mutual_tls", "none"))
    Destination _ App:                   destination.labels["app"] | "unknown"
    Destination _ Principal:             destination.principal | "unknown"
    Destination _ Service:               destination.service.host | "unknown"
    Destination _ Service _ Name:        destination.service.name | "unknown"
    Destination _ Service _ Namespace:   destination.service.namespace | "unknown"
    Destination _ Version:               destination.labels["version"] | "unknown"
    Destination _ Workload:              destination.workload.name | "unknown"
    Destination _ Workload _ Namespace:  destination.workload.namespace | "unknown"
    Reporter:                            conditional((context.reporter.kind | "inbound") == "outbound", "source", "destination")
    Request _ Protocol:                  api.protocol | context.protocol | "unknown"
    Response _ Code:                     response.code | 200
    Source _ App:                        source.labels["app"] | "unknown"
    Source _ Principal:                  source.principal | "unknown"
    Source _ Version:                    source.labels["version"] | "unknown"
    Source _ Workload:                   source.workload.name | "unknown"
    Source _ Workload _ Namespace:       source.workload.namespace | "unknown"
  Monitored _ Resource _ Type:           "UNSPECIFIED"
  Value:                                 1
Events:                                  <none>
~~~

- Rule is to do the mapping between template and adapter. 
~~~
$ kubectl get rule -n istio-system
NAME                     AGE
kubeattrgenrulerule      3h
promhttp                 3h
promtcp                  3h
stdio                    3h
stdiotcp                 3h
tcpkubeattrgenrulerule   3h
~~~



Digging up more on the rule part. From naming convention two rules seems to be related with prometheus. We can see the Condition define as Match and if the condition matches then the instances which are sent to the handler. 

~~~
$ kubectl describe rule promhttp -n istio-system
Name:         promhttp
Namespace:    istio-system
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"config.istio.io/v1alpha2","kind":"rule","metadata":{"annotations":{},"name":"promhttp","namespace":"istio-system"},"spec":{"actions":[{"...
API Version:  config.istio.io/v1alpha2
Kind:         rule
Metadata:
  Creation Timestamp:  2018-12-27T10:00:58Z
  Generation:          1
  Resource Version:    199851
  Self Link:           /apis/config.istio.io/v1alpha2/namespaces/istio-system/rules/promhttp
  UID:                 4eb68757-09be-11e9-9f03-0800274a2878
Spec:
  Actions:
    Handler:  handler.prometheus
    Instances:
      requestcount.metric
      requestduration.metric
      requestsize.metric
      responsesize.metric
  Match:  context.protocol == "http" || context.protocol == "grpc"
Events:   <none>

$ kubectl describe rule promtcp -n istio-system
Name:         promtcp
Namespace:    istio-system
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"config.istio.io/v1alpha2","kind":"rule","metadata":{"annotations":{},"name":"promtcp","namespace":"istio-system"},"spec":{"actions":[{"h...
API Version:  config.istio.io/v1alpha2
Kind:         rule
Metadata:
  Creation Timestamp:  2018-12-27T10:00:58Z
  Generation:          1
  Resource Version:    199852
  Self Link:           /apis/config.istio.io/v1alpha2/namespaces/istio-system/rules/promtcp
  UID:                 4ebad639-09be-11e9-9f03-0800274a2878
Spec:
  Actions:
    Handler:  handler.prometheus
    Instances:
      tcpbytesent.metric
      tcpbytereceived.metric
  Match:  context.protocol == "tcp"
Events:   <none>
~~~


- Adapters encapsulate the logic necessary to interface Mixer with a specific infrastructure backend.
~~~
$ kubectl get prometheus -n istio-system
NAME      AGE
handler   3h


$ kubectl describe prometheus handler -n istio-system
Name:         handler
Namespace:    istio-system
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"config.istio.io/v1alpha2","kind":"prometheus","metadata":{"annotations":{},"name":"handler","namespace":"istio-system"},"spec":{"metrics...
API Version:  config.istio.io/v1alpha2
Kind:         prometheus
Metadata:
  Creation Timestamp:  2018-12-27T10:00:58Z
  Generation:          1
  Resource Version:    199850
  Self Link:           /apis/config.istio.io/v1alpha2/namespaces/istio-system/prometheuses/handler
  UID:                 4eb2e089-09be-11e9-9f03-0800274a2878
Spec:
  Metrics:
    Instance _ Name:  requestcount.metric.istio-system
    Kind:             COUNTER
    Label _ Names:
      reporter
      source_app
      source_principal
      source_workload
      source_workload_namespace
      source_version
      destination_app
      destination_principal
      destination_workload
      destination_workload_namespace
      destination_version
      destination_service
      destination_service_name
      destination_service_namespace
      request_protocol
      response_code
      connection_security_policy
    Name:  requests_total
    Buckets:
      Explicit _ Buckets:
        Bounds:
          0.005
          0.01
          0.025
          0.05
          0.1
          0.25
          0.5
          1
          2.5
          5
          10
    Instance _ Name:  requestduration.metric.istio-system
    Kind:             DISTRIBUTION
    Label _ Names:
      reporter
      source_app
      source_principal
      source_workload
      source_workload_namespace
      source_version
      destination_app
      destination_principal
      destination_workload
      destination_workload_namespace
      destination_version
      destination_service
      destination_service_name
      destination_service_namespace
      request_protocol
      response_code
      connection_security_policy
    Name:  request_duration_seconds
    Buckets:
      Exponential Buckets:
        Growth Factor:       10
        Num Finite Buckets:  8
        Scale:               1
    Instance _ Name:         requestsize.metric.istio-system
    Kind:                    DISTRIBUTION
    Label _ Names:
      reporter
      source_app
      source_principal
      source_workload
      source_workload_namespace
      source_version
      destination_app
      destination_principal
      destination_workload
      destination_workload_namespace
      destination_version
      destination_service
      destination_service_name
      destination_service_namespace
      request_protocol
      response_code
      connection_security_policy
    Name:  request_bytes
    Buckets:
      Exponential Buckets:
        Growth Factor:       10
        Num Finite Buckets:  8
        Scale:               1
    Instance _ Name:         responsesize.metric.istio-system
    Kind:                    DISTRIBUTION
    Label _ Names:
      reporter
      source_app
      source_principal
      source_workload
      source_workload_namespace
      source_version
      destination_app
      destination_principal
      destination_workload
      destination_workload_namespace
      destination_version
      destination_service
      destination_service_name
      destination_service_namespace
      request_protocol
      response_code
      connection_security_policy
    Name:             response_bytes
    Instance _ Name:  tcpbytesent.metric.istio-system
    Kind:             COUNTER
    Label _ Names:
      reporter
      source_app
      source_principal
      source_workload
      source_workload_namespace
      source_version
      destination_app
      destination_principal
      destination_workload
      destination_workload_namespace
      destination_version
      destination_service
      destination_service_name
      destination_service_namespace
      connection_security_policy
    Name:             tcp_sent_bytes_total
    Instance _ Name:  tcpbytereceived.metric.istio-system
    Kind:             COUNTER
    Label _ Names:
      reporter
      source_app
      source_principal
      source_workload
      source_workload_namespace
      source_version
      destination_app
      destination_principal
      destination_workload
      destination_workload_namespace
      destination_version
      destination_service
      destination_service_name
      destination_service_namespace
      connection_security_policy
    Name:  tcp_received_bytes_total
Events:    <none>
~~~

