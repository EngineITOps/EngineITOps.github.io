---
layout: post
title: Kubernetes services with options
tags: kubernetes, services
category: Kubernetes
author: vikrant
comments: true
---


This is just for my own reference for seeing the options with which by default services are getting started in minikube. 


#### Controller Node

`kube-apiserver`

~~~
--admission-control=Initializers,NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota 
--kubelet-client-key=/var/lib/localkube/certs/apiserver-kubelet-client.key 
--secure-port=8443 
--requestheader-client-ca-file=/var/lib/localkube/certs/front-proxy-ca.crt 
--enable-bootstrap-token-auth=true 
--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname 
--requestheader-extra-headers-prefix=X-Remote-Extra- 
--advertise-address=192.168.99.100 
--service-cluster-ip-range=10.96.0.0/12 
--tls-cert-file=/var/lib/localkube/certs/apiserver.crt 
--kubelet-client-certificate=/var/lib/localkube/certs/apiserver-kubelet-client.crt 
--allow-privileged=true 
--requestheader-allowed-names=front-proxy-client 
--client-ca-file=/var/lib/localkube/certs/ca.crt 
--tls-private-key-file=/var/lib/localkube/certs/apiserver.key 
--proxy-client-cert-file=/var/lib/localkube/certs/front-proxy-client.crt 
--insecure-port=0 
--requestheader-username-headers=X-Remote-User 
--requestheader-group-headers=X-Remote-Group 
--service-account-key-file=/var/lib/localkube/certs/sa.pub 
--proxy-client-key-file=/var/lib/localkube/certs/front-proxy-client.key 
--authorization-mode=Node,RBAC 
--etcd-servers=https://127.0.0.1:2379 
--etcd-cafile=/var/lib/localkube/certs/etcd/ca.crt 
--etcd-certfile=/var/lib/localkube/certs/apiserver-etcd-client.crt 
--etcd-keyfile=/var/lib/localkube/certs/apiserver-etcd-client.key
~~~

`kube-controller-manager`

~~~
--leader-elect=true 
--service-account-private-key-file=/var/lib/localkube/certs/sa.key 
--address=127.0.0.1 
--use-service-account-credentials=true 
--controllers=*,bootstrapsigner,tokencleaner 
--kubeconfig=/etc/kubernetes/controller-manager.conf 
--root-ca-file=/var/lib/localkube/certs/ca.crt 
--cluster-signing-cert-file=/var/lib/localkube/certs/ca.crt 
--cluster-signing-key-file=/var/lib/localkube/certs/ca.key
~~~

`kube-scheduler`

~~~
--address=127.0.0.1 
--leader-elect=true 
--kubeconfig=/etc/kubernetes/scheduler.conf
~~~

#### Worker node

`kubelet`

~~~
--pod-manifest-path=/etc/kubernetes/manifests 
--cluster-dns=10.96.0.10 
--authorization-mode=Webhook 
--client-ca-file=/var/lib/localkube/certs/ca.crt 
--cgroup-driver=cgroupfs 
--kubeconfig=/etc/kubernetes/kubelet.conf 
--bootstrap-kubeconfig=/etc/kubernetes/bootstrap-kubelet.conf 
--allow-privileged=true 
--cluster-domain=cluster.local 
--cadvisor-port=0 
--fail-swap-on=false 
--hostname-override=minikube
~~~

`kube-proxy`

~~~
--config=/var/lib/kube-proxy/config.conf
~~~
