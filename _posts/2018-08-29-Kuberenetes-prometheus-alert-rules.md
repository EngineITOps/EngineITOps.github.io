---
layout: post
title: How to create kubernetes prometheus alert rules
tags: [Kubernetes, prometheus]
category: [Kubernetes]
author: vikrant
comments: true
--- 

In this article, I am providing the steps to add new alerting rules for an app in prometheus. Once you have deployed the prometheus using prometheus operator then you can login into the prometheus container to understand the configuration. It's showing us that file `/etc/prometheus/config_out/prometheus.env.yaml` is used as prometheus configuration file. 

~~~
kubectl exec prometheus-k8s-0 -c prometheus -n monitoring -it sh
/prometheus $ ps -ef
PID   USER     TIME  COMMAND
    1 1000      1:38 /bin/prometheus --web.console.templates=/etc/prometheus/consoles --web.console.libraries=/etc/prometheus/console_libraries --config.file=/etc/prometheus/config_out/prometheus.env.yam
   21 1000      0:00 sh
   26 1000      0:00 ps -ef
/prometheus $
~~~

If we grep for rules in the conf file we can see that it's using the `/etc/prometheus/rules/prometheus-k8s-rulefiles-0/*.yaml` file to evaluate the rules. 

~~~
/prometheus $ grep -i rule /etc/prometheus/config_out/prometheus.env.yaml
rule_files:
- /etc/prometheus/rules/prometheus-k8s-rulefiles-0/*.yaml
/prometheus $
~~~

Issue the command `kubectl describe pod prometheus-k8s-0 -n monitoring` to see how this configuration file is mapped inside the container. 

~~~
    Mounts:
      /etc/prometheus/rules/prometheus-k8s-rulefiles-0 from prometheus-k8s-rulefiles-0 (rw)
      /var/run/secrets/kubernetes.io/serviceaccount from prometheus-k8s-token-nfp7p (ro)
~~~      

And further down from the volumes section it's confirmed that it's using `prometheus-k8s-rulefiles-0` as a rule file. 

~~~
Volumes:
  prometheusstorage:
    Type:       PersistentVolumeClaim (a reference to a PersistentVolumeClaim in the same namespace)
    ClaimName:  prometheusstorage-prometheus-k8s-0
    ReadOnly:   false
  config:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  prometheus-k8s
    Optional:    false
  config-out:
    Type:    EmptyDir (a temporary directory that shares a pod's lifetime)
    Medium:
  prometheus-k8s-rulefiles-0:
    Type:      ConfigMap (a volume populated by a ConfigMap)
    Name:      prometheus-k8s-rulefiles-0
    Optional:  false
  prometheus-k8s-token-nfp7p:
    Type:        Secret (a volume populated by a Secret)
    SecretName:  prometheus-k8s-token-nfp7p
    Optional:    false
~~~   

We can modify the configuration file `prometheus-rules.yaml` present in prometheus-operator repo to re-create the configmap.

~~~
kubectl get cm -n monitoring | grep rulefile
prometheus-k8s-rulefiles-0                  1         40m
~~~

I have added the following section at end of the configuration file. 

~~~
- name: exampleapp
  rules:
  - alert: example_app_http_Request
    annotations:
      description: '{{$labels.job}} has received many http requests'
      summary: Example app getting too many http requests
    expr: |
      sum(http_request_size_bytes_sum{job!~"apiserver"}) by(job) > 1085746600
    for: 2m
    labels:
      severity: warning
  - alert: example_api_http_Request
    annotations:
      description: '{{$labels.namespace}}/{{$labels.endpoint}} has received many http
        requests'
      summary: Example app getting too many http requests
    expr: |
      sum(http_request_size_bytes_sum{job!~"apiserver",handler="api"}) without(instance,pod) > 1085746600
    for: 2m
    labels:
      severity: critical
~~~

Re-create the configmap

~~~
kubectl delete -f prometheus-rules.yaml
kubectl create -f prometheus-rules.yaml
prometheusrule "prometheus-k8s-rules" created
~~~

Access the prometheus UI and in alerts you should be able to see two new ALERTS are fired. Ideally alerts should be manage through alertmanager UI and it can be accessed using:

~~~
kubectl -n monitoring port-forward alertmanager-main-0 9093
Forwarding from 127.0.0.1:9093 -> 9093
~~~
