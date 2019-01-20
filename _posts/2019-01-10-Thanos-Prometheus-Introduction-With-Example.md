---
layout: post
title: How to use swift as object storage for Thanos (Prometheus)?
tags: [Kubernetes, thanos, prometheus, swift]
category: [Kubernetes]
author: vikrant
comments: true
--- 

Thanos is gaining lot of popularity in the prometheus community. It's easy to do deploy prometheus using operator but while running prometheus in HA setup, we have limited options like running two instances of prometheus which are scraping the same targets. Since they are scraping the same targets hence they are generating the same alert twice. Other issues with prometheus was with downsampling and long term storage retention. To overcome these challenges, thanos is introduced. 

If you want to read more about [Thanos](https://improbable.io/games/blog/thanos-prometheus-at-scale)

Official examples in Thanos repoistory provides the configuration for integrating GCS (Google cloud storage) but everybody doesn't have access to public cloud storage. To do the PoC I was supposed to use opensource solution swift. By default, when you are deploying openstack setup using packstack, swift is deployed in  it. Instead of spending time on standalone swift deployment I thought of using the existing swift in packstack setup. 

For accessing the swift in packstack I am using admin credentials. I will put the same credentials in Thanos sidecar container so that it can push the dataset to swift bucket.

- Create a bucket or container in openstack swift. We don't have objects in container by default. 

~~~
[root@packstack1 ~]# source keystonerc_admin
[root@packstack1 ~(keystone_admin)]# swift post test3
[root@packstack1 ~(keystone_admin)]# swift stat test3
               Account: AUTH_45a6706c831c42d5bf2da928573382b1
             Container: test3
               Objects: 0
                 Bytes: 0
              Read ACL:
             Write ACL:
               Sync To:
              Sync Key:
         Accept-Ranges: bytes
      X-Storage-Policy: Policy-0
         Last-Modified: Thu, 10 Jan 2019 04:06:37 GMT
           X-Timestamp: 1547093196.88206
            X-Trans-Id: txe98f86f79560438db790f-005c36c4dc
          Content-Type: application/json; charset=utf-8
X-Openstack-Request-Id: txe98f86f79560438db790f-005c36c4dc
~~~

- Use the following manifest for creating that prometheus setup with thanos-sidecar injected. I intentionally kept the `storage.tsdb.retention` to very low value so that it can quickly start dumping the datasets to object store. 

If you want to try the same manifest in your environment. You need to change the swift config map according to your setup. IP address is obfuscated in manifest. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: prometheus
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRole
metadata:
  name: prometheus
rules:
- apiGroups: [""]
  resources:
  - nodes
  - services
  - endpoints
  - pods
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources:
  - configmaps
  verbs: ["get"]
- nonResourceURLs: ["/metrics"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1beta1
kind: ClusterRoleBinding
metadata:
  name: prometheus
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: prometheus
subjects:
- kind: ServiceAccount
  name: prometheus
  namespace: default
---
apiVersion: apps/v1beta1
kind: StatefulSet
metadata:
  name: prometheus
  labels:
    app: prometheus
    thanos-peer: "true"
spec:
  serviceName: "prometheus"
  replicas: 2
  selector:
    matchLabels:
      app: prometheus
      thanos-peer: "true"
  template:
    metadata:
      labels:
        app: prometheus
        thanos-peer: "true"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "10902"
    spec:
      serviceAccountName: prometheus
## Commented out because Minikube has only one node, should be commented in for any production setup
#      affinity:
#        podAntiAffinity:
#          requiredDuringSchedulingIgnoredDuringExecution:
#          - labelSelector:
#              matchExpressions:
#              - key: app
#                operator: In
#                values:
#                - prometheus
#            topologyKey: kubernetes.io/hostname
      containers:
      - name: prometheus
        image: quay.io/prometheus/prometheus:v2.0.0
        # To quickly see the objects in swift timing values are set to very low value. It's not recommended for production.
        args:
        - "--storage.tsdb.retention=10m"
        - "--config.file=/etc/prometheus-shared/prometheus.yml"
        - "--storage.tsdb.path=/var/prometheus"
        - "--storage.tsdb.min-block-duration=5m"
        - "--storage.tsdb.max-block-duration=5m"
        - "--web.enable-lifecycle"
        ports:
        - name: prom-http
          containerPort: 9090
        volumeMounts:
        - name: config-shared
          mountPath: /etc/prometheus-shared
        - name: data
          mountPath: /var/prometheus
      - name: thanos-sidecar
        # Always use explicit image tags (release or master-<date>-sha) instead of ambigous `latest` or `master`.
        image: improbable/thanos:v0.2.1
        args:
        - "sidecar"
        - "--log.level=debug"
        - "--tsdb.path=/var/prometheus"
        - "--prometheus.url=http://127.0.0.1:9090"
        - "--cluster.peers=thanos-peers.default.svc.cluster.local:10900"
        - "--reloader.config-file=/etc/prometheus/prometheus.yml.tmpl"
        - "--reloader.config-envsubst-file=/etc/prometheus-shared/prometheus.yml"
        - "--objstore.config-file=/creds/swift_access_information.yaml"
        ports:
        - name: sidecar-http
          containerPort: 10902
        - name: grpc
          containerPort: 10901
        - name: cluster
          containerPort: 10900
        volumeMounts:
        - name: data
          mountPath: /var/prometheus
        - name: config-shared
          mountPath: /etc/prometheus-shared
        - name: config
          mountPath: /etc/prometheus
        - name: swiftconfig
          mountPath: /creds
      volumes:
      - name: config
        configMap:
          name: prometheus-config
      - name: config-shared
        emptyDir: {}
      - name: data
        emptyDir: {}
      - name: swiftconfig
        configMap:
          name: swiftinfo
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml.tmpl: |-
    global:
      external_labels:
        monitor: prometheus
        replica: '$(HOSTNAME)'

    scrape_configs:
    - job_name: prometheus
      static_configs:
        - targets:
          - "127.0.0.1:9090"

    - job_name: kubelets
      kubernetes_sd_configs:
      - role: node

    - job_name: kube_pods
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scheme]
        action: replace
        target_label: __scheme__
        regex: (https?)
      - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
        action: replace
        regex: (.+?)(?::\d+)?;(\d+)
        replacement: ${1}:${2}
        target_label: __address__
      - action: labelmap
        regex: __meta_kubernetes_pod_label_(.+)
      - source_labels: [__meta_kubernetes_pod_namespace]
        action: replace
        target_label: kubernetes_namespace
      - source_labels: [__meta_kubernetes_pod_name]
        action: replace
        target_label: kubernetes_pod_name

    # Scrapes the endpoint lists for the main Prometheus endpoints
    - job_name: kube_endpoints
      kubernetes_sd_configs:
      - role: endpoints
      relabel_configs:
      - action: keep
        source_labels: [__meta_kubernetes_service_label_app]
        regex: prometheus
      - action: replace
        source_labels: [__meta_kubernetes_service_label_app]
        target_label: job
      - action: replace
        target_label: prometheus
        source_labels: [__meta_kubernetes_service_label_prometheus]
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: prometheus
  name: prometheus
spec:
  externalTrafficPolicy: Cluster
  ports:
  - port: 9090
    protocol: TCP
    targetPort: prom-http
    name: http-prometheus
  - port: 10902
    protocol: TCP
    targetPort: sidecar-http
    name: http-sidecar-metrics
  selector:
    app: prometheus
  sessionAffinity: None
  type: NodePort
status:
  loadBalancer: {}

---
apiVersion: v1
kind: Service
metadata:
  name: thanos-peers
spec:
  type: ClusterIP
  clusterIP: None
  ports:
  - name: cluster
    port: 10900
    targetPort: cluster
  selector:
    # Useful endpoint for gathering all thanos components for common gossip cluster.
    thanos-peer: "true"
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: swiftinfo
  # For example only ConfigMap is used for normal usage secret is recommended instead of ConfigMap
data:
  swift_access_information.yaml: |
    type: SWIFT
    config:
      auth_url: "http://10.121.xx.xx:5000/v3"
      username: admin
      password: 4019b525ee414a4c
      tenant_name: admin
      container_name: test3
      domain_name: Default
~~~


- We should be able to see the two prometheus replica in the running status along with Thanos sidecar.  

~~~
$ kubectl get pod
NAME           READY     STATUS    RESTARTS   AGE
prometheus-0   2/2       Running   1          3m
prometheus-1   2/2       Running   1          3m
~~~

Also in openstack we can see that number of objects in container is increased.

~~~
[root@packstack1 ~(keystone_admin)]# swift stat test3
               Account: AUTH_45a6706c831c42d5bf2da928573382b1
             Container: test3
               Objects: 48
                 Bytes: 8123441
              Read ACL:
             Write ACL:
               Sync To:
              Sync Key:
         Accept-Ranges: bytes
      X-Storage-Policy: Policy-0
         Last-Modified: Thu, 10 Jan 2019 04:06:37 GMT
           X-Timestamp: 1547093196.88206
            X-Trans-Id: txa3c475b6c15749349d906-005c36ccdb
          Content-Type: application/json; charset=utf-8
X-Openstack-Request-Id: txa3c475b6c15749349d906-005c36ccdb
~~~

- Keep an eye on thanos-sidecar logs to see the dataset dumped to object storage. 

~~~
kubectl logs prometheus-0 -c thanos-sidecar  | grep 'shipper.go'
level=info ts=2019-01-10T04:12:44.092071737Z caller=shipper.go:201 msg="upload new block" id=01D0TZC903FHNFMBHQGYGXXWJA
level=info ts=2019-01-10T04:17:43.682245251Z caller=shipper.go:201 msg="upload new block" id=01D0TZNDZ5Q09TVVZWG5XCF54K
level=info ts=2019-01-10T04:22:44.017883724Z caller=shipper.go:201 msg="upload new block" id=01D0TZYJZ7AHH45S86TSFQ4GE4
level=info ts=2019-01-10T04:27:44.011867423Z caller=shipper.go:201 msg="upload new block" id=01D0V07QYRPQT71MK27202NCPA
level=info ts=2019-01-10T04:32:44.553502153Z caller=shipper.go:201 msg="upload new block" id=01D0V0GWW5NABS9KFZP7ZPEPZB
level=info ts=2019-01-10T04:37:43.689988084Z caller=shipper.go:201 msg="upload new block" id=01D0V0T1WSSD5V1CJJ3M8AD96X
~~~

- Once the dataset is dumped to object storage to query that data from object store you need storage gateway. This storage gateway also need to use the swift credentials to query the datasets. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: thanos-store
spec:
  serviceName: "thanos-store"
  replicas: 1
  selector:
    matchLabels:
      app: thanos
      thanos-peer: "true"
  template:
    metadata:
      labels:
        app: thanos
        thanos-peer: "true"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "10902"
    spec:
      containers:
      - name: thanos-store
        # Always use explicit image tags (release or master-<date>-sha) instead of ambigous `latest` or `master`.
        image: improbable/thanos:v0.2.1
        args:
        - "store"
        - "--log.level=debug"
        - "--data-dir=/var/thanos/store"
        - "--cluster.peers=thanos-peers.default.svc.cluster.local:10900"
        - "--objstore.config-file=/creds/swift_access_information.yaml"
        ports:
        - name: http
          containerPort: 10902
        - name: grpc
          containerPort: 10901
        - name: cluster
          containerPort: 10900
        volumeMounts:
        - name: swiftconfig
          mountPath: /creds
        - name: data
          mountPath: /var/thanos/store
      volumes:
      - name: data
        emptyDir: {}
        # configmap is not recommended for production use. It's used only for example.
      - name: swiftconfig
        configMap:
          name: swiftinfo
EOF
~~~

- We spoke about query the dataset from object store but where is my query componenet here you go : Manifest to create the thanos-query. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thanos-query
  labels:
    app: thanos-query
    thanos-peer: "true"
spec:
  replicas: 2
  selector:
    matchLabels:
      app: thanos-query
      thanos-peer: "true"
  template:
    metadata:
      labels:
        app: thanos-query
        thanos-peer: "true"
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "10902"
    spec:
      containers:
      - name: thanos-query
        # Always use explicit image tags (release or master-<date>-sha) instead of ambigous `latest` or `master`.
        image: improbable/thanos:v0.2.1
        args:
        - "query"
        - "--log.level=debug"
        - "--cluster.peers=thanos-peers.default.svc.cluster.local:10900"
        - "--query.replica-label=replica"
        ports:
        - name: http
          containerPort: 10902
        - name: grpc
          containerPort: 10901
        - name: cluster
          containerPort: 10900
        livenessProbe:
          httpGet:
            path: /-/healthy
            port: http
---
apiVersion: v1
kind: Service
metadata:
  labels:
    app: thanos-query
  name: thanos-query
spec:
  externalTrafficPolicy: Cluster
  ports:
  - port: 9090
    protocol: TCP
    targetPort: http
    name: http-query
  selector:
    app: thanos-query
  sessionAffinity: None
  type: NodePort
EOF
~~~

- We talked about downsampling in the introduction but which component is taking care of this task. Compactor is used for downsampling of the datasets in object store. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: thanos-compactor
spec:
  serviceName: "thanos-compactor"
  replicas: 1
  selector:
    matchLabels:
      app: thanos-compactor
  template:
    metadata:
      labels:
        app: thanos-compactor
    spec:
      containers:
      - name: thanos-compactor
        # Always use explicit image tags (release or master-<date>-sha) instead of ambigous `latest` or `master`.
        image: improbable/thanos:v0.2.1
        args:
        - "compact"
        - "--log.level=debug"
        - "--data-dir=/tmp/thanos-compact"
        - "--objstore.config-file=/creds/swift_access_information.yaml"
        - "--sync-delay=5m"
        - "--retention.resolution-raw=10m"
        - "--retention.resolution-5m=1h"
        - "--retention.resolution-1h=2h"
        - "-w"
        volumeMounts:
        - name: swiftconfig
          mountPath: /creds
        - name: data
          mountPath: /tmp/thanos-compact
      volumes:
      - name: data
        emptyDir: {}
      - name: swiftconfig
        configMap:
          name: swiftinfo
EOF
~~~

Refer the [link](https://github.com/improbable-eng/thanos/blob/master/docs/components/compact.md) to know more about compactor options. We can see the following logs in compactor run.

~~~
kubectl logs thanos-compactor-0
level=info ts=2019-01-10T05:00:11.877653878Z caller=factory.go:39 msg="loading bucket configuration"
level=info ts=2019-01-10T05:00:12.552319625Z caller=compact.go:193 msg="retention policy of raw samples is enabled" duration=10m0s
level=info ts=2019-01-10T05:00:12.552453317Z caller=compact.go:196 msg="retention policy of 5 min aggregated samples is enabled" duration=1h0m0s
level=info ts=2019-01-10T05:00:12.552468338Z caller=compact.go:199 msg="retention policy of 1 hour aggregated samples is enabled" duration=2h0m0s
level=info ts=2019-01-10T05:00:12.552601749Z caller=compact.go:281 msg="starting compact node"
level=info ts=2019-01-10T05:00:12.552855301Z caller=main.go:308 msg="Listening for metrics" address=0.0.0.0:10902
level=info ts=2019-01-10T05:00:12.553153026Z caller=compact.go:816 msg="start sync of metas"
level=debug ts=2019-01-10T05:00:13.023376044Z caller=compact.go:174 msg="download meta" block=01D0V1NGPPV3FA8TMJXBFMN002
level=debug ts=2019-01-10T05:00:13.163197482Z caller=compact.go:174 msg="download meta" block=01D0V1NGR6DB612WD6NEEMZ17S
level=debug ts=2019-01-10T05:00:13.302204633Z caller=compact.go:174 msg="download meta" block=01D0V1YNNPM82YQRJ60189KGYN
level=debug ts=2019-01-10T05:00:13.441454572Z caller=compact.go:192 msg="block is too fresh for now" block=01D0V1YNNPM82YQRJ60189KGYN
level=debug ts=2019-01-10T05:00:13.441495172Z caller=compact.go:174 msg="download meta" block=01D0V1YNQCFBV9JCQMX03J76QM
level=debug ts=2019-01-10T05:00:13.582934377Z caller=compact.go:192 msg="block is too fresh for now" block=01D0V1YNQCFBV9JCQMX03J76QM
level=info ts=2019-01-10T05:00:13.724814306Z caller=compact.go:822 msg="start of GC"
level=info ts=2019-01-10T05:00:13.731974591Z caller=compact.go:207 msg="compaction iterations done"
level=info ts=2019-01-10T05:00:13.732213612Z caller=compact.go:214 msg="start first pass of downsampling"
level=info ts=2019-01-10T05:00:14.57574943Z caller=compact.go:220 msg="start second pass of downsampling"
level=info ts=2019-01-10T05:00:15.428989866Z caller=compact.go:225 msg="downsampling iterations done"
level=info ts=2019-01-10T05:00:15.429026068Z caller=retention.go:17 msg="start optional retention"
level=info ts=2019-01-10T05:00:15.724043874Z caller=retention.go:35 msg="deleting block" id=01D0V1NGPPV3FA8TMJXBFMN002 maxTime="2019-01-10 04:50:00 +0000 UTC"
level=info ts=2019-01-10T05:00:16.870180595Z caller=retention.go:35 msg="deleting block" id=01D0V1NGR6DB612WD6NEEMZ17S maxTime="2019-01-10 04:50:00 +0000 UTC"
level=info ts=2019-01-10T05:00:18.287429817Z caller=retention.go:46 msg="optional retention apply done"
~~~

Number of objects in swift container is reduced.

~~~
[root@packstack1 ~(keystone_admin)]# swift stat test3
               Account: AUTH_45a6706c831c42d5bf2da928573382b1
             Container: test3
               Objects: 30
                 Bytes: 2192174
              Read ACL:
             Write ACL:
               Sync To:
              Sync Key:
         Accept-Ranges: bytes
      X-Storage-Policy: Policy-0
         Last-Modified: Thu, 10 Jan 2019 04:06:37 GMT
           X-Timestamp: 1547093196.88206
            X-Trans-Id: tx246915ed24314585b3ac6-005c36d160
          Content-Type: application/json; charset=utf-8
X-Openstack-Request-Id: tx246915ed24314585b3ac6-005c36d160
~~~

#### Summary

thanos-sidecar - To fetch the dataset information from prometheus and put the dataset in object store as per configuration.
Storage Gateway - To run the query agains the object storage.
Thanos query - To run the queries to fetch the information from prometheus and object store using storage gateway. 
Compactor - Run the downsampling and delete old data as per conf settings. 