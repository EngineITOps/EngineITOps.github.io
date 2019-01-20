---
layout: post
title: How to integrate thanos in existing prometheus setup
tags: [Thanos, Kubernetes, Prometheus]
category: [Kubernetes]
author: vikrant
comments: true
--- 


Problem Statement : I have existing prometheus setup which is using Ceph RBD as a storage. Now I want to introduce the thanos component into the environment to take the advantage of object storage long term retention and downsampling. 

Solution: Prometheus operator provides official example [1] of introducting thanos into existing prometheus setup but latest (at the time of writing) image v27.0 doesn't contain the PR [2] which provides the functionality of using object store configuration in manifest. 

I created my own image which includes the fix to include the object storage. I will show the steps to create the image and I have pushed the image to my docker hub repo page just in case if someone wants to use it for testing purpose. 

Let's start with lab work. We will cover the following steps in this guide. 

- Prepare the Prometheus operator and prometheus-config-reloader-image image.
- Deploy the ceph using ROOK on kubernetes. 
- Install prometheus using operator with new prometheus operator, config reloader image and use ceph for storage. 
- Introduce the thanos-sidecar into the existing prometheus setup.
- Deploy the thanos-store and thanos-compactor components. 

#### Prepare the prometheus operator and prometheus config reloader image

- Started the ubuntu vagrant box which has docker capability.

- Install the go on ubuntu following [link](https://medium.com/@patdhlk/how-to-install-go-1-9-1-on-ubuntu-16-04-ee64c073cd79)

- Clone the prometheus operator repo.

~~~
# mkdir -p ~/prometheus/src/github.com/coreos
# cd ~/prometheus/src/github.com/coreos
# git clone https://github.com/coreos/prometheus-operator
~~~

- Set the GOPATH 

~~~
root@vagrant:~# cat ~/.profile
# ~/.profile: executed by Bourne-compatible login shells.

if [ "$BASH" ]; then
  if [ -f ~/.bashrc ]; then
    . ~/.bashrc
  fi
fi

tty -s && mesg n
export GOPATH=$HOME/prometheus
export PATH=$PATH:/usr/local/go/bin:$GOPATH/bin
~~~

- Issue the following command to prepare the images. 

~~~
# cd ~/prometheus/src/github.com/coreos/prometheus-operator
# make operator
# make hack/operator-image   << To generate the prometheus operator image. 
# make hack/prometheus-config-reloader-image  << To generate the config reloader image.
~~~

- Copy the images from vagrant box to your minikube setup. If you are new to docker world follow [link](https://stackoverflow.com/questions/23935141/how-to-copy-docker-images-from-one-host-to-another-without-using-a-repository) to copy the docker image from one machine to another. By default we don't know the credentials of root user in minikube setup. We can create a new user and use that user to copy the image to minikube from vagrant box. 

Tip: you will not find useradd command in minikube hence use adduser command to add the user. 

you may destroy your vagrant box after this activity. 

- If you want to download the image from docker hub repo.

ervikrant06/prometheusoperator:prometheus-config-reloader
ervikrant06/prometheusoperator:prometheusoperator

#### Deploy ceph using ROOK. 

Follow this [article](https://ervikrant06.github.io/kuberenetes/How%20to%20create%20ceph%20cluster%20using%20ROOK%20in%20kubernetes/) to complete the ceph installation on kubernetes. 

#### Starting prometheus operator using new images with ceph storage. 

- I am using the official examples provided in the kubernetes repo for the installation. For ceph related changes this [link](https://ervikrant06.github.io/kubernetes/Kuberenetes-prometheus-persistent-storage/) can be used. 

- Following diff is showing all changes included the image and ceph related changes. I intentionally kept the retenttion of prometheus data in local storage to 10m value so that I can quickly show the thanos working. 

~~~
diff --git a/contrib/kube-prometheus/manifests/0prometheus-operator-deployment.yaml b/contrib/kube-prometheus/manifests/0prometheus-operator-deployment.yaml
index 1ddbae2f..038329f4 100644
--- a/contrib/kube-prometheus/manifests/0prometheus-operator-deployment.yaml
+++ b/contrib/kube-prometheus/manifests/0prometheus-operator-deployment.yaml
@@ -20,8 +20,10 @@ spec:
         - --kubelet-service=kube-system/kubelet
         - --logtostderr=true
         - --config-reloader-image=quay.io/coreos/configmap-reload:v0.0.1
-        - --prometheus-config-reloader=quay.io/coreos/prometheus-config-reloader:v0.26.0
-        image: quay.io/coreos/prometheus-operator:v0.26.0
+        - --prometheus-config-reloader=quay.io/coreos/prometheus-config-reloader:0714fe4
+        #image: quay.io/coreos/prometheus-operator:v0.26.0
+        image: quay.io/coreos/prometheus-operator:0714fe4
+        imagePullPolicy: Never
         name: prometheus-operator
         ports:
         - containerPort: 8080
diff --git a/contrib/kube-prometheus/manifests/prometheus-prometheus.yaml b/contrib/kube-prometheus/manifests/prometheus-prometheus.yaml
index c16914b0..1ff97a25 100644
--- a/contrib/kube-prometheus/manifests/prometheus-prometheus.yaml
+++ b/contrib/kube-prometheus/manifests/prometheus-prometheus.yaml
@@ -18,6 +18,7 @@ spec:
   resources:
     requests:
       memory: 400Mi
+  retention: 10m
   ruleSelector:
     matchLabels:
       prometheus: k8s
@@ -30,3 +31,13 @@ spec:
   serviceMonitorNamespaceSelector: {}
   serviceMonitorSelector: {}
   version: v2.5.0
+  storage:
+      volumeClaimTemplate:
+        metadata:
+          name: prometheusstorage
+        spec:
+          storageClassName: "rook-ceph-block"
+          accessModes: [ "ReadWriteOnce" ]
+          resources:
+            requests:
+              storage: 2Gi
diff --git a/contrib/kube-prometheus/manifests/prometheus-service.yaml b/contrib/kube-prometheus/manifests/prometheus-service.yaml
index 85b007f8..e954b3af 100644
--- a/contrib/kube-prometheus/manifests/prometheus-service.yaml
+++ b/contrib/kube-prometheus/manifests/prometheus-service.yaml
@@ -13,3 +13,4 @@ spec:
   selector:
     app: prometheus
     prometheus: k8s
+  type: NodePort
diff --git a/example/rbac/prometheus/prometheus.yaml b/example/rbac/prometheus/prometheus.yaml
index 2adaef13..c3d870af 100644
--- a/example/rbac/prometheus/prometheus.yaml
+++ b/example/rbac/prometheus/prometheus.yaml
@@ -10,6 +10,10 @@ spec:
   serviceMonitorSelector:
     matchLabels:
       team: frontend
+  ruleSelector:
+    matchLabels:
+      role: prometheus-rulefiles
+      prometheus: k8s
   alerting:
     alertmanagers:
     - namespace: default
~~~

- Once the setup is deployed following PODs are running in monitoring namespace. Notice the count of containers (3) present in prometheus deployment. 

~~~
# cd ~/Documents/REPOS/prometheus-operator/contrib/kube-prometheus/manifests
# kubectl get pod -n monitoring
NAME                                   READY     STATUS    RESTARTS   AGE
alertmanager-main-0                    2/2       Running   0          13m
alertmanager-main-1                    2/2       Running   0          13m
alertmanager-main-2                    2/2       Running   0          13m
grafana-df9bfd765-66f26                1/1       Running   0          13m
kube-state-metrics-687d566cfc-lg5bw    4/4       Running   0          13m
node-exporter-jq2zx                    2/2       Running   0          13m
prometheus-adapter-69466cc54b-zxq6h    1/1       Running   0          13m
prometheus-k8s-0                       3/3       Running   0          1m
prometheus-k8s-1                       3/3       Running   0          1m
prometheus-operator-5c5bbb576b-s8rmw   1/1       Running   0          13m
thanos-compactor-0                     1/1       Running   0          6m
thanos-store-0                         1/1       Running   0          6m
~~~

#### Introduce thanos-sidecar into existing deployment

- Create the configuration file which will provide swift related information. 

~~~
# cat /Documents/thanos-objstore-config.yaml
type: SWIFT
config:
  auth_url: "http://10.121.xx.xx:5000/v3"
  username: admin
  password: 4019b525ee414a4c
  tenant_name: admin
  container_name: test5
  domain_name: Default
~~~  

- Create secrett using this file.

~~~
# kubectl -n monitoring create secret generic thanos-objstore-config --from-file=thanos.yaml=/Documents/thanos-objstore-config.yaml
~~~

- Use the created secret in the manifest which we are gonna use to inject the thanos-sidecar into existing prometheus deployment. 

~~~
cat <<EOF | kubectl apply -f -
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
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  name: k8s
  namespace: monitoring
  labels:
    prometheus: k8s
    app: prometheus
spec:
  replicas: 2
# Please edit the object below. Lines beginning with a '#' will be ignored,
  serviceAccountName: prometheus-k8s
  podMetadata:
    labels:
      thanos-peer: 'true'
  serviceMonitorSelector: {}
  alerting:
    alertmanagers:
    - namespace: monitoring
      name: alertmanager
      port: web
  ruleSelector:
    matchLabels:
      role: prometheus-rulefiles
      prometheus: k8s
  thanos:
    peers: thanos-peers.default.svc:10900
    objectStorageConfig:
      key: thanos.yaml
      name: thanos-objstore-config
EOF
~~~

- If you look closely, after few mins, number of containers preset in prometheus POD has increased to 4 from 3. newly introduced container is thanos-sidecar. 

~~~
kubectl get pod -n monitoring
NAME                                   READY     STATUS    RESTARTS   AGE
alertmanager-main-0                    2/2       Running   2          15h
alertmanager-main-1                    2/2       Running   2          15h
alertmanager-main-2                    2/2       Running   2          15h
grafana-df9bfd765-66f26                1/1       Running   1          15h
kube-state-metrics-687d566cfc-lg5bw    4/4       Running   5          15h
node-exporter-jq2zx                    2/2       Running   2          15h
prometheus-adapter-69466cc54b-zxq6h    1/1       Running   2          15h
prometheus-k8s-0                       4/4       Running   4          15h
prometheus-k8s-1                       4/4       Running   4          15h
prometheus-operator-5c5bbb576b-s8rmw   1/1       Running   2          15h
thanos-compactor-0                     1/1       Running   1          15h
thanos-store-0                         1/1       Running   1          15h
~~~

- Similarly we can start thanos-query, thanos-store and thanos-compactor. To know more about these components refer the [old post](https://ervikrant06.github.io/kubernetes/Thanos-Prometheus-Introduction-With-Example/) related to thanos. 

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
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: thanos-store
  namespace: monitoring
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
        - "--objstore.config-file=/creds/swift_access_information/swift_access_information.yaml"
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
        secret:
          secretName: thanos-objstore-config
          items:
          - key: thanos.yaml
            path: swift_access_information/swift_access_information.yaml
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: thanos-compactor
  namespace: monitoring
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
        - "--objstore.config-file=/creds/swift_access_information/swift_access_information.yaml"
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
        secret:
          secretName: thanos-objstore-config
          items:
          - key: thanos.yaml
            path: swift_access_information/swift_access_information.yaml
EOF
~~~

- After sometime we can see the following messages in the thanos-sidecare logs indicating that blocks are shipped to object storage. 

~~~
kubectl -n monitoring logs prometheus-k8s-0 -c thanos-sidecar  | grep 'shipper.go'
level=warn ts=2019-01-17T06:49:43.528640532Z caller=shipper.go:147 msg="reading meta file failed, removing it" err="unexpected end of JSON input"
level=info ts=2019-01-17T06:49:44.085718976Z caller=shipper.go:201 msg="upload new block" id=01D1D7APWSFJ53Y3BJXT6E57YV
level=info ts=2019-01-17T06:50:13.758337658Z caller=shipper.go:201 msg="upload new block" id=01D1D7APWSFJ53Y3BJXT6E57YV
level=info ts=2019-01-17T06:50:15.095102932Z caller=shipper.go:201 msg="upload new block" id=01D1D7AQPJ594QDFEYRY3W4EYA
level=info ts=2019-01-17T07:00:14.094347108Z caller=shipper.go:201 msg="upload new block" id=01D1D9R173842S2P0YBW9CN4A2
~~~

thanos-compactor is doing it's own job. 

~~~
kubectl logs thanos-compactor-0 -n monitoring | tail -4
level=info ts=2019-01-17T08:23:18.563273933Z caller=compact.go:220 msg="start second pass of downsampling"
level=info ts=2019-01-17T08:23:19.016306884Z caller=compact.go:225 msg="downsampling iterations done"
level=info ts=2019-01-17T08:23:19.016342222Z caller=retention.go:17 msg="start optional retention"
level=info ts=2019-01-17T08:23:20.367448379Z caller=retention.go:46 msg="optional retention apply done"
~~~

We can confirm that objects are shipped into swift storage successfully by checking the stat of swift container. 

~~~
[root@packstack1 ~(keystone_admin)]# swift stat test5
               Account: AUTH_45a6706c831c42d5bf2da928573382b1
             Container: test5
               Objects: 6
                 Bytes: 2340
              Read ACL:
             Write ACL:
               Sync To:
              Sync Key:
         Accept-Ranges: bytes
      X-Storage-Policy: Policy-0
         Last-Modified: Wed, 16 Jan 2019 15:06:43 GMT
           X-Timestamp: 1547651202.85613
            X-Trans-Id: tx23b91a63eb124585a4924-005c40292a
          Content-Type: application/json; charset=utf-8
X-Openstack-Request-Id: tx23b91a63eb124585a4924-005c40292a
~~~

[1] https://github.com/coreos/prometheus-operator/blob/master/example/thanos/prometheus.yaml
[2] https://github.com/coreos/prometheus-operator/pull/2264#issuecomment-453101463 
