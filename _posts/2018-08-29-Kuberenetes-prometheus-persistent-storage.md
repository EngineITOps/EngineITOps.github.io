---
layout: post
title: Kubernetes prometheus persistent storage
tags: [Kubernetes, prometheus]
category: [Kubernetes]
author: vikrant
comments: true
--- 

In one of the previous [blog post](https://ervikrant06.github.io/kuberenetes/How%20to%20create%20ceph%20cluster%20using%20ROOK%20in%20kubernetes/) I showed the usage of rook operator to install ceph on top of kubernetes. I have followed the same link to create ceph cluster on kubernetes and verified that PVC is getting created successfully. 

After that modified the `prometheus-operator/contrib/kube-prometheus/manifests/prometheus-prometheus.yaml` file to add storage part in it. 

~~~
apiVersion: monitoring.coreos.com/v1
kind: Prometheus
metadata:
  labels:
    prometheus: k8s
  name: k8s
  namespace: monitoring
spec:
  alerting:
    alertmanagers:
    - name: alertmanager-main
      namespace: monitoring
      port: web
  baseImage: quay.io/prometheus/prometheus
  nodeSelector:
    beta.kubernetes.io/os: linux
  replicas: 1
  resources:
    requests:
      memory: 400Mi
  ruleSelector:
    matchLabels:
      prometheus: k8s
      role: alert-rules
  serviceAccountName: prometheus-k8s
  serviceMonitorNamespaceSelector: {}
  serviceMonitorSelector: {}
  version: v2.3.2
  storage:
      volumeClaimTemplate:
        metadata:
          name: prometheusstorage
        spec:
          storageClassName: "rook-ceph-block"
          accessModes: [ "ReadWriteOnce" ]
          resources:
            requests:
              storage: 2Gi
~~~          

Deleted and re-created the specific resource. 

Login into the prometheus container after re-creation and verified that /prometheus is using rbd for storage. 

~~~
kubectl exec -n monitoring prometheus-k8s-0 -it sh
Defaulting container name to prometheus.
Use 'kubectl describe pod/prometheus-k8s-0 -n monitoring' to see all of the containers in this pod.
/prometheus $ df -Ph
Filesystem                Size      Used Available Capacity Mounted on
overlay                  16.1G     10.6G      4.5G  70% /
tmpfs                    64.0M         0     64.0M   0% /dev
tmpfs                     2.9G         0      2.9G   0% /sys/fs/cgroup
/dev/rbd0                 2.0G    290.5M      1.7G  14% /prometheus
/dev/sda1                16.1G     10.6G      4.5G  70% /dev/termination-log
shm                      64.0M         0     64.0M   0% /dev/shm
/dev/sda1                16.1G     10.6G      4.5G  70% /etc/resolv.conf
/dev/sda1                16.1G     10.6G      4.5G  70% /etc/hostname
/dev/sda1                16.1G     10.6G      4.5G  70% /etc/hosts
/dev/sda1                16.1G     10.6G      4.5G  70% /etc/prometheus/config_out
/dev/sda1                16.1G     10.6G      4.5G  70% /etc/prometheus/rules/prometheus-k8s-rulefiles-0
tmpfs                     2.9G     12.0K      2.9G   0% /var/run/secrets/kubernetes.io/serviceaccount
tmpfs                    64.0M         0     64.0M   0% /proc/kcore
tmpfs                    64.0M         0     64.0M   0% /proc/timer_list
tmpfs                     2.9G         0      2.9G   0% /proc/scsi
tmpfs                     2.9G         0      2.9G   0% /sys/firmware
~~~

We can also check the PVC and PV created.

~~~
kubectl get pv -n monitoring
NAME                                       CAPACITY   ACCESS MODES   RECLAIM POLICY   STATUS    CLAIM                                           STORAGECLASS      REASON    AGE
pvc-22207e0f-ac51-11e8-918b-0800273b8df2   2Gi        RWO            Delete           Bound     monitoring/prometheusstorage-prometheus-k8s-0   rook-ceph-block             11m

kubectl get pvc -n monitoring
NAME                                 STATUS    VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS      AGE
prometheusstorage-prometheus-k8s-0   Bound     pvc-22207e0f-ac51-11e8-918b-0800273b8df2   2Gi        RWO            rook-ceph-block   11m
~~~

It's great now we have the persistent storage for scrape metrics. 