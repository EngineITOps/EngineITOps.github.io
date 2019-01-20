---
layout: post
title: Kubernetes monitoring
tags: [Kubernetes, monitoring]
category: [Kubernetes]
author: vikrant
comments: true
---

Kubernetes monitoring is a crucial part. I started reading about it and I was confused with lot of terms used in various blogs posts and github official documentation. In this article I am trying to demystify all of the commonly used terms which are overwhelming for over beginner. 

First article which I read about the kuberenetes monitoring is the [design proposal](https://github.com/kubernetes/community/blob/master/contributors/design-proposals/instrumentation/monitoring_architecture.md). I would say this is the Bible of k8 monitoring. 

Key takeaways from the above link are :

- Core and non-core metrics.
- metric-server
- Monitoring pipeline. 

It's easy to understand about these components after reading the article. Usually if you think about k8 monitoring, first thing which comes to our mind is heapster and prometheus. From above proposal, it's already cleared that heapster is going to be decommissioned soon so we need to dig up the prometheus stuff. If you start with the documentation provided on [github repo](https://github.com/prometheus) of prometheus, again various terms pop-up.

`metrics-server` is used for "resource" metrics (CPU and memory), for `kubectl top` and HPA resource metrics source. It's basically for capturing the core system metrics. 

~~~
$ kubectl get pod -n kube-system
NAME                                        READY     STATUS    RESTARTS   AGE
default-http-backend-59868b7dd6-9jndv       1/1       Running   2          1d
etcd-minikube                               1/1       Running   0          23h
heapster-28cx5                              1/1       Running   2          1d
influxdb-grafana-qrvmx                      2/2       Running   4          1d
kube-addon-manager-minikube                 1/1       Running   2          1d
kube-apiserver-minikube                     1/1       Running   0          23h
kube-controller-manager-minikube            1/1       Running   0          23h
kube-dns-86f4d74b45-c7ls9                   3/3       Running   8          1d
kube-proxy-pm867                            1/1       Running   0          23h
kube-scheduler-minikube                     1/1       Running   2          1d
kubernetes-dashboard-5498ccf677-9m7kq       1/1       Running   6          1d
metrics-server-85c979995f-tsc25             1/1       Running   4          1d
nginx-ingress-controller-67956bf89d-w55dw   1/1       Running   6          1d
storage-provisioner                         1/1       Running   6          1d
~~~

You are able to get the output in following command because of metric server only. 

~~~
$ kubectl top node
NAME       CPU(cores)   CPU%      MEMORY(bytes)   MEMORY%
minikube   260m         6%        2056Mi          29%
~~~

By default in k8 installation, you can see the metrics-server running. 

- Prometheus operator which provides CRD (custom resource devices) for k8.
	- prometheusrules.monitoring.coreos.com 
	- prometheuses.monitoring.coreos.com
	- alertmanagers.monitoring.coreos.com  
	- servicemonitors.monitoring.coreos.com 
- k8s-prometheus-adapter
- kube-state-metrics


How prometheus is doing the K8 monitoring?

For both core and non-core metrics prometheus is using it's own components. Here is the information which I got from the kubernetes slack channel. 

- Prometheus doesn't use metrics-server for core metric collection.  It scrapes directly from the node (kubelet) and from applications.  This can be configured using the Prometheus Operator and ServiceMonitors (which are just a handy abstraction over the Prometheus configuration file).  You can expose Prometheus metrics to the API using the k8s-prometheus-adapter
- ServiceMonitors just tell Prometheus to monitor the endpoints of a particular service.  Certain exporters (e.g. kube-state-metrics) can be used to export additional metrics about the state of your cluster or nodes.
- k8s-prometheus-adapter can expose *any* metrics from prometheus for use by the horizontal pod autoscaler.  The HPA only uses metrics from metrics-server if you use the "resource" metrics source type.  In the common case, cpu and memory metrics come from metrics-server, but there's nothing preventing you from getting them from the adapter instead (if you use the "pods" metrics source type in the HPA).

IMP point - kube-state-metrics just exports extra information about objects in the cluster (spec and status) as prometheus metrics, that prometheus can then collect that means it doesn't provide cpu, disk and memory related information. It only give the information about desired and actual state of K8 resources. 


If you want to get a feel of kube-state-metrics without using prometheus, you may use the following deployment file. 

~~~
$ cat kube-state-metric-test.yml
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: kube-state-metrics-deployment
spec:
  replicas: 1
  template:
    metadata:
      labels:
        k8s-app: kube-state-metrics
        version: "v0.4.1"
    spec:
      containers:
      - name: kube-state-metrics
        image: gcr.io/google_containers/kube-state-metrics:v0.4.1
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  annotations:
    prometheus.io/scrape: 'true'
  name: kube-state-metrics
  labels:
    k8s-app: kube-state-metrics
spec:
  ports:
  - name: http-metrics
    port: 8080
    protocol: TCP
  selector:
    k8s-app: kube-state-metrics
  type: NodePort
~~~

Perform the deployment. 


~~~
$ kubectl create -f kube-state-metric-test.yml
$ kubectl get svc
NAME                 TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)          AGE
kube-state-metrics   NodePort    10.102.19.66   <none>        8080:30021/TCP   2m
kubernetes           ClusterIP   10.96.0.1      <none>        443/TCP          1d
~~~

Get the minikube IP.

~~~
$ minikube ip
192.168.99.100
~~~

Access the browser using   192.168.99.100:30021. This will only show you the endpoints used for monitoring. Basically metrics generated by kube-state-metrics are consumed by prometheus. 

This is from github repo of kube-state-metrics:

~~~
The metrics are exported through the Prometheus golang client on the HTTP endpoint /metrics on the listening port (default 80). They are served either as plaintext or protobuf depending on the Accept header. They are designed to be consumed either by Prometheus itself or by a scraper that is compatible with scraping a Prometheus client endpoint. You can also open /metrics in a browser to see the raw metrics.
~~~

If you want to study more on this topic, I found below links very useful: 

#### References

- [Difference between heapser, prometheus and Kubernetes Metrics APIs](https://brancz.com/2018/01/05/prometheus-vs-heapster-vs-kubernetes-metrics-apis/)

- kube-state-metrics

	- https://sysdig.com/blog/introducing-kube-state-metrics/

	- https://github.com/kubernetes/kube-state-metrics

	- https://brancz.com/2017/11/13/kube-state-metrics-the-past-the-present-and-the-future/


- Start learning prometheus without having kubernetes cluster. 

	- https://github.com/mpas/infrastructure-and-system-monitoring-using-prometheus

	- https://www.youtube.com/watch?v=5GYe_-qqP30

