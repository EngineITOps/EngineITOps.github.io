---
layout: post
title: How to change Kuberenetes service parameters?
tags: [Kubernetes]
category: [Kubernetes]
author: vikrant
comments: true
--- 

It's very common to have the requirement to change the parameters for a kubernetes service. I was in need of testing the PodSecurityPloicy but I found that it's not present by-default in the `--admission-control` parameter list of kube-api service. 

#### Before making the change

~~~
# ps -ef | grep kube-api
root      3169  3155  4 04:07 ?        00:07:13 kube-apiserver --admission-control=Initializers,NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota --advertise-address=192.168.99.100 --requestheader-client-ca-file=/var/lib/localkube/certs/front-proxy-ca.crt --proxy-client-cert-file=/var/lib/localkube/certs/front-proxy-client.crt --requestheader-group-headers=X-Remote-Group --requestheader-allowed-names=front-proxy-client --insecure-port=0 --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname --tls-cert-file=/var/lib/localkube/certs/apiserver.crt --tls-private-key-file=/var/lib/localkube/certs/apiserver.key --secure-port=8443 --allow-privileged=true --service-cluster-ip-range=10.96.0.0/12 --client-ca-file=/var/lib/localkube/certs/ca.crt --service-account-key-file=/var/lib/localkube/certs/sa.pub --kubelet-client-certificate=/var/lib/localkube/certs/apiserver-kubelet-client.crt --kubelet-client-key=/var/lib/localkube/certs/apiserver-kubelet-client.key --proxy-client-key-file=/var/lib/localkube/certs/front-proxy-client.key --enable-bootstrap-token-auth=true --requestheader-username-headers=X-Remote-User --requestheader-extra-headers-prefix=X-Remote-Extra- --authorization-mode=Node,RBAC --etcd-servers=https://127.0.0.1:2379 --etcd-cafile=/var/lib/localkube/certs/etcd/ca.crt --etcd-certfile=/var/lib/localkube/certs/apiserver-etcd-client.crt --etcd-keyfile=/var/lib/localkube/certs/apiserver-etcd-client.key
~~~

#### After making the change. 

- Modify the following file to add the `PodSecurityPloicy` in `--admission-control` parameter list. 

~~~
# cat /etc/kubernetes/manifests/kube-apiserver.yaml
~~~

- In few seconds automatically the kube-api service is restarted and brough the change into effect. 

~~~
# ps -ef | grep kube-api
root     18936 18922 44 07:17 ?        00:00:01 kube-apiserver --admission-control=Initializers,NamespaceLifecycle,LimitRanger,ServiceAccount,DefaultStorageClass,DefaultTolerationSeconds,NodeRestriction,MutatingAdmissionWebhook,ValidatingAdmissionWebhook,ResourceQuota,PodSecurityPolicy --advertise-address=192.168.99.100 --requestheader-client-ca-file=/var/lib/localkube/certs/front-proxy-ca.crt --proxy-client-cert-file=/var/lib/localkube/certs/front-proxy-client.crt --requestheader-group-headers=X-Remote-Group --requestheader-allowed-names=front-proxy-client --insecure-port=0 --kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname --tls-cert-file=/var/lib/localkube/certs/apiserver.crt --tls-private-key-file=/var/lib/localkube/certs/apiserver.key --secure-port=8443 --allow-privileged=true --service-cluster-ip-range=10.96.0.0/12 --client-ca-file=/var/lib/localkube/certs/ca.crt --service-account-key-file=/var/lib/localkube/certs/sa.pub --kubelet-client-certificate=/var/lib/localkube/certs/apiserver-kubelet-client.crt --kubelet-client-key=/var/lib/localkube/certs/apiserver-kubelet-client.key --proxy-client-key-file=/var/lib/localkube/certs/front-proxy-client.key --enable-bootstrap-token-auth=true --requestheader-username-headers=X-Remote-User --requestheader-extra-headers-prefix=X-Remote-Extra- --authorization-mode=Node,RBAC --etcd-servers=https://127.0.0.1:2379 --etcd-cafile=/var/lib/localkube/certs/etcd/ca.crt --etcd-certfile=/var/lib/localkube/certs/apiserver-etcd-client.crt --etcd-keyfile=/var/lib/localkube/certs/apiserver-etcd-client.key
~~~

You are good to test the functionality of PODSecurityPolicy.