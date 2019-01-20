---
layout: post
title: Kubernetes prometheus operator deployment
tags: [Kubernetes, prometheus]
category: [Kubernetes]
author: vikrant
comments: true
--- 

In one of the [previous](https://ervikrant06.github.io/kubernetes/Kuberenetes-Monitoring/) article I talked about the Kubernetes monitoring. In this article I am covering the deployment of prometheus operator on kubernetes and steps to start monitoring your application. 

Official kubernetes operator [link](Prometheus Operator vs. kube-prometheus) provides a new term kube-prometheus. I used kube-prometheus for deployment of prometheus on my minikube single node setup. 

~~~
$ git clone https://github.com/coreos/prometheus-operator.git
$ kubectl create -f prometheus-operator/contrib/kube-prometheus/manifests/
~~~

This will deploy the prometheus operator along with other components. One modification which I done was to change the number of prometheus server and alertmanager replicas I want in my setup. Since this was test installation hence I kept it at 1 only. 

~~~
kubectl get all -n monitoring
NAME               DESIRED   CURRENT   READY     UP-TO-DATE   AVAILABLE   NODE SELECTOR                 AGE
ds/node-exporter   1         1         1         1            1           beta.kubernetes.io/os=linux   46s

NAME                         DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
deploy/grafana               1         1         1            1           47s
deploy/kube-state-metrics    1         1         1            1           46s
deploy/prometheus-operator   1         1         1            1           48s

NAME                               DESIRED   CURRENT   READY     AGE
rs/grafana-5b68464b84              1         1         1         47s
rs/kube-state-metrics-58dcbb8579   1         1         1         25s
rs/kube-state-metrics-64df5b9d5c   0         0         0         46s
rs/prometheus-operator-9b4b64465   1         1         1         48s

NAME                             DESIRED   CURRENT   AGE
statefulsets/alertmanager-main   1         1         40s
statefulsets/prometheus-k8s      1         1         34s

NAME                                     READY     STATUS    RESTARTS   AGE
po/alertmanager-main-0                   2/2       Running   0          40s
po/grafana-5b68464b84-pqcd2              1/1       Running   0          46s
po/kube-state-metrics-58dcbb8579-8cz6q   4/4       Running   0          25s
po/node-exporter-nqkls                   2/2       Running   0          45s
po/prometheus-k8s-0                      3/3       Running   1          34s
po/prometheus-operator-9b4b64465-kdzzl   1/1       Running   0          46s

NAME                        TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)             AGE
svc/alertmanager-main       NodePort    10.98.23.202    <none>        9093:30900/TCP      47s
svc/alertmanager-operated   ClusterIP   None            <none>        9093/TCP,6783/TCP   40s
svc/grafana                 ClusterIP   10.107.76.245   <none>        3000/TCP            47s
svc/kube-state-metrics      ClusterIP   None            <none>        8443/TCP,9443/TCP   46s
svc/node-exporter           ClusterIP   None            <none>        9100/TCP            46s
svc/prometheus-k8s          ClusterIP   10.100.38.122   <none>        9090/TCP            45s
svc/prometheus-operated     ClusterIP   None            <none>        9090/TCP            34s
svc/prometheus-operator     ClusterIP   None            <none>        8080/TCP            48s
~~~

If you need to access the prometheus and grafana UI, issue the following commands for port-forwarding and then access the ports using loopback address. 

~~~
kubectl -n monitoring port-forward prometheus-k8s-0 9090
kubectl -n monitoring port-forward grafana-5b68464b84-kgz7n 3000
~~~

Once that all is done, I took the example from coreos website for an example-app. 

- Create the deployment with service and servicemonitor.

~~~
cat <<EOF | kubectl create -f -
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: frontend
  namespace: default
  labels:
    tier: frontend
spec:
  selector:
    matchLabels:
      tier: frontend
  targetLabels:
    - tier
  endpoints:
  - port: web
    interval: 10s
  namespaceSelector:
    matchNames:
      - default
---
kind: Service
apiVersion: v1
metadata:
  name: example-app
  labels:
    tier: frontend
  namespace: default
spec:
  selector:
    app: example-app
  ports:
  - name: web
    protocol: TCP
    port: 8080
    targetPort: web
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: example-app
  namespace: default
spec:
  replicas: 3
  template:
    metadata:
      labels:
        app: example-app
        version: 1.1.3
    spec:
      containers:
      - name: example-app 
        image: quay.io/fabxc/prometheus_demo_service
        ports:
        - name: web
          containerPort: 8080
          protocol: TCP
EOF
~~~


This newly created servicemonitor will be detected by prometheus operator which will update the prometheus configuration for scraping this target endpoints and reload the the prometheus to start scraping the new deployment. 

In UI, you can see all metrics which are exposed by example-app using the following PROMQL query. 

~~~
sum({job="example-app"}) by(__name__)
~~~
