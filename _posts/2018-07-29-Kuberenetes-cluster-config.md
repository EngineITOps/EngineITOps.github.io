---
layout: post
title: Kuberenetes creating kube config file to access cluster
tags: [kubernetes]
category: [Kubernetes]
author: vikrant
comments: true
--- 

Recently I deployed multinode HA setup using kubespray, after that I was able to issue the commands from the master node but was not able to issue the commands from my laptop. I am using my same laptop for creating the minikube setup also and I knew that kubernetes has concept of `context` which is used to access the K8 setups. 

- Checking the existing config file. You may have noticed that I have tried to create multiple minikube setups and all of them are showing in following outputs. 

~~~
$ kubectl config get-contexts
CURRENT   NAME       CLUSTER    AUTHINFO   NAMESPACE
*         minikube   minikube   minikube

$ kubectl config current-context
minikube

$ kubectl config get-clusters
NAME
minikube2
minikubeA
cluster.local
minikube
minikube1
~~~

- Logged into the clustered setup using `vagrant ssh <machine name>` and I thought of checking the output of same commands. Strangely nothing shown up here. 

~~~
[vagrant@k8s-01 kubernetes]$ kubectl config current-context
error: current-context is not set
[vagrant@k8s-01 kubernetes]$ kubectl config get-clusters
NAME
[vagrant@k8s-01 kubernetes]$ kubectl config get-contexts
CURRENT   NAME      CLUSTER   AUTHINFO   NAMESPACE
[vagrant@k8s-01 kubernetes]$
~~~

- I found this file on system which is used kubectl to get the access. 

~~~
[vagrant@k8s-01 ~]$ cat /etc/kubernetes/kubelet.env
# logging to stderr means we get it in the systemd journal
KUBE_LOGTOSTDERR="--logtostderr=true"
KUBE_LOG_LEVEL="--v=2"
# The address for the info server to serve on (set to 0.0.0.0 or "" for all interfaces)
KUBELET_ADDRESS="--address=172.17.8.101 --node-ip=172.17.8.101"
# The port for the info server to serve on
# KUBELET_PORT="--port=10250"
# You may leave this blank to use the actual hostname
KUBELET_HOSTNAME="--hostname-override=k8s-01"






KUBELET_ARGS="--pod-manifest-path=/etc/kubernetes/manifests \
--cadvisor-port=0 \
--pod-infra-container-image=gcr.io/google_containers/pause-amd64:3.0 \
--node-status-update-frequency=10s \
--docker-disable-shared-pid=True \
--client-ca-file=/etc/kubernetes/ssl/ca.pem \
--tls-cert-file=/etc/kubernetes/ssl/node-k8s-01.pem \
--tls-private-key-file=/etc/kubernetes/ssl/node-k8s-01-key.pem \
--anonymous-auth=false \
--read-only-port=0 \
--cgroup-driver=cgroupfs \
--cgroups-per-qos=True \
--max-pods=110 \
--fail-swap-on=True \
--authentication-token-webhook \
--enforce-node-allocatable=""  --cluster-dns=10.233.0.3 --cluster-domain=cluster.local --resolv-conf=/etc/resolv.conf --kubeconfig=/etc/kubernetes/node-kubeconfig.yaml --kube-reserved cpu=200m,memory=512M --node-labels=node-role.kubernetes.io/master=true,node-role.kubernetes.io/node=true  --feature-gates=Initializers=False,PersistentLocalVolumes=False,VolumeScheduling=False,MountPropagation=False  "
KUBELET_NETWORK_PLUGIN="--network-plugin=cni --cni-conf-dir=/etc/cni/net.d --cni-bin-dir=/opt/cni/bin"

KUBELET_VOLUME_PLUGIN="--volume-plugin-dir=/var/lib/kubelet/volume-plugins"

# Should this cluster be allowed to run privileged docker containers
KUBE_ALLOW_PRIV="--allow-privileged=true"
KUBELET_CLOUDPROVIDER=""

PATH=/usr/local/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
~~~


- Check the content of file which is mentioned in above output. Note: `--kubeconfig` parameter. 

~~~
[vagrant@k8s-01 ~]$ cat /etc/kubernetes/node-kubeconfig.yaml
apiVersion: v1
kind: Config
clusters:
- name: local
  cluster:
    certificate-authority: /etc/kubernetes/ssl/ca.pem
    server: https://127.0.0.1:6443
users:
- name: kubelet
  user:
    client-certificate: /etc/kubernetes/ssl/node-k8s-01.pem
    client-key: /etc/kubernetes/ssl/node-k8s-01-key.pem
contexts:
- context:
    cluster: local
    user: kubelet
  name: kubelet-cluster.local
current-context: kubelet-cluster.local
~~~

- Finding this config resource. 

~~~
$ kubectl get configmap --all-namespaces
NAMESPACE     NAME                                 DATA      AGE
kube-system   extension-apiserver-authentication   6         40m

[root@k8s-01 ssl]# kubectl describe configmap/extension-apiserver-authentication -n kube-system
Name:         extension-apiserver-authentication
Namespace:    kube-system
Labels:       <none>
Annotations:  <none>

Data
====
requestheader-username-headers:
----
["X-Remote-User"]
client-ca-file:
----
-----BEGIN CERTIFICATE-----
MIIC+TCCAeGgAwIBAgIJAL83Tg2YSF/wMA0GCSqGSIb3DQEBCwUAMBIxEDAOBgNV
BAMMB2t1YmUtY2EwIBcNMTgwNzI4MDkwODQwWhgPMjExODA3MDQwOTA4NDBaMBIx
EDAOBgNVBAMMB2t1YmUtY2EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIB
AQDTlYt1pNYwTajLiHgns0AUWafm4uuvxh9ELGdGe8g/GPj4m2hl9hxV3Cw7XhFU
rX0lRTbmoOpKkLzjPXfjIR8DCuOqsTaI7y7Av2qgg3CtToISzAGsArhkYahtLJZe
GnJkH7KldpLvaL9HdQUPODVm/QtGNFhm1cHlPImqlTXPuXG/ErEg4CIooGKzvPf+
DSYjE0bTn4d9O8xt2aGO2i1//XhHns9KxD+wjUp+QMeumQw1DY8xy2WS4tAFXTVs
ASvJP0JkaJsm8l+/hecMCbQFY6Nn/k/cSIZ/WslMyPqiXAmkNO9L3HL2Zkuabpqk
pScFkA/4xZJ8+nt9TFqOUDC5AgMBAAGjUDBOMB0GA1UdDgQWBBQR36In7Rj8tSDH
yq4qyh/MVNY92TAfBgNVHSMEGDAWgBQR36In7Rj8tSDHyq4qyh/MVNY92TAMBgNV
HRMEBTADAQH/MA0GCSqGSIb3DQEBCwUAA4IBAQBY1ohKEqCf+HBoVOLNV6Qn/Gye
mXBCqqukTqR8+ylh0MzEJYrNIXUMKn6TD+HJg45vJlSxpqdMrpZL+GUypYrtKB1k
9ANjn6wwAbdndSVMQ4Wr8BiDVEX0ZBZo9vK+gkB1YHki0AIylM5I+TtqrWQKBmCi
K+7kWgR/J5DSt5cG376fuDJnO6xEB+tQ8ASUJSsfuBLGCvbzE+rmTN8XvWl7QHXU
e8cfNPG+w1dd+ArF93qvQ1buXYccYr59WaP20TOwdhTicxOrsefFEX2/nJKwpake
ZTqr50F+Fmh/b+Izs21giQbK26THEFxhJDGkq0mi6zkDd3Ss9UF++vezoFCG
-----END CERTIFICATE-----

requestheader-allowed-names:
----
["front-proxy-client"]
requestheader-client-ca-file:
----
-----BEGIN CERTIFICATE-----
MIIDBzCCAe+gAwIBAgIJANpHnbN1hP6LMA0GCSqGSIb3DQEBCwUAMBkxFzAVBgNV
BAMMDmZyb250LXByb3h5LWNhMCAXDTE4MDcyODA5MDg0MFoYDzIxMTgwNzA0MDkw
ODQwWjAZMRcwFQYDVQQDDA5mcm9udC1wcm94eS1jYTCCASIwDQYJKoZIhvcNAQEB
BQADggEPADCCAQoCggEBAKeCr8oGy4/MpNiDQ26Beh/RZ50MEnsJT4vQsOCcVFqP
N6GKcCh1NrOvC1Y+NA+XLxmZI6nxBOiQgUtT+GyU9vswCqxx8uYJI7igT0KeWe5P
p37x62wNNQPbdJo9a2qASB3EJkDLlWtj/HhvO12mtbmHoSig4MQcbTBbzxov1Vsv
1wb9DUK3dFApl5Saf0AfOn8wSQZ5POnyW5CqkvS6ClqIRM8DkVy1getDzB+gAyLc
6j7Je1MIM06zMx+bxdjGN4V7xhCjqsgQ+UP0SDjJ31bpVQZYSmz9p9v66GoS8efV
IGFFaMh/4J/Qehyw7tTEEq5LX3dUhYNckz6DQP06qw8CAwEAAaNQME4wHQYDVR0O
BBYEFH9ZzRHcDMwhrfpA4ZORrHevxW/gMB8GA1UdIwQYMBaAFH9ZzRHcDMwhrfpA
4ZORrHevxW/gMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBABiMfFVS
FdK4rrP+lwDN2tgF5H285aZOIcJ1bDx32fx45voD5z1ZW6yvoRlM2eLCutuBB2/g
GCRU7oHEhupqeBAmMVpNTHSD+s3JxQTxyfaFQj43fOyq0eJtFkCul0rIg4FUD7Ms
Cucfvp3l9ClaF5EDVcAoReMgr4whQ5F/CQqkjIBgWPrhmmYKCZYMyATgff7V4PE8
Xw7X5OjsVL8V16PPnrV7XMWWz4wZYp9NDSCvj+LZxaOLNnH2HwRjQhFG+BI/ZZPz
RkIyuZxTBIDEgQdXvgwcnTqqmPH31iR8wrCMbXXs1TOCw1eYyZBIeD30fxorNRqI
g56Pp++mdXhti98=
-----END CERTIFICATE-----

requestheader-extra-headers-prefix:
----
["X-Remote-Extra-"]
requestheader-group-headers:
----
["X-Remote-Group"]
Events:  <none>
~~~

- Copy the certificates from the clustered setup on laptop. We will be using these certificates to create the context on laptop. 

~~~
[root@k8s-01 ssl]# cat /etc/kubernetes/ssl/ca.pem  

Copy the content of certificate authority on host machine in file "ca.pem" In my case located at /Users/viaggarw/Documents/kubesprayconfig/ca.pem

[root@k8s-01 ssl]# cat /etc/kubernetes/ssl/admin-k8s-01.pem

Copy the ceriticate on host machine in "admin.pem" In my case located at /Users/viaggarw/Documents/kubesprayconfig/admin.pem

[root@k8s-01 ssl]# cat /etc/kubernetes/ssl/admin-k8s-01-key.pem

Copy the ceriticate on host machine in "admin-key.pem" In my case located at /Users/viaggarw/Documents/kubesprayconfig/admin-key.pem
~~~


- Logged out from the clustered setup and back to my laptop. I moved the existing kube config file to safe location before issuing any command on my system. 

~~~
$ mv /Users/viaggarw/.kube/config ~/Documents/
~~~

- Set the default cluster pointing to your master node IP and use the certificate authority. 

~~~
$ kubectl config set-cluster default-cluster --server=https://172.17.8.101:6443 --certificate-authority=/Users/viaggarw/Documents/kubesprayconfig/ca.pem
Cluster "default-cluster" set.

$ kubectl config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority: /Users/viaggarw/Documents/kubesprayconfig/ca.pem
    server: https://172.17.8.101:6443
  name: default-cluster
contexts: []
current-context: ""
kind: Config
preferences: {}
users: []

$ kubectl config set-credentials default-admin --certificate-authority=/Users/viaggarw/Documents/kubesprayconfig/ca.pem --client-key=//Users/viaggarw/Documents/kubesprayconfig/admin-key.pem --client-certificate=/Users/viaggarw/Documents/kubesprayconfig/admin.pem
User "default-admin" set.

$ kubectl config get-contexts
CURRENT   NAME      CLUSTER   AUTHINFO   NAMESPACE

$ kubectl config set-context default-system --cluster=default-cluster --user=default-admin
Context "default-system" created.

$ kubectl config get-contexts
CURRENT   NAME             CLUSTER           AUTHINFO        NAMESPACE
          default-system   default-cluster   default-admin
~~~

- Switched the context and verify that it's switched successfully. 

~~~
$ kubectl config use-context default-system
Switched to context "default-system".

$ kubectl config get-contexts
CURRENT   NAME             CLUSTER           AUTHINFO        NAMESPACE
*         default-system   default-cluster   default-admin
~~~

- Time to confirm that you are able to issue the commands on your clustered setup. Since we have moved the existing kube/config file to another location hence while listing the cluster only one newly added default-cluster is listed. 

~~~
$ kubectl get nodes
NAME      STATUS    ROLES         AGE       VERSION
k8s-01    Ready     master,node   16h       v1.10.4
k8s-02    Ready     master,node   16h       v1.10.4
k8s-03    Ready     node          16h       v1.10.4

$ kubectl config get-clusters
NAME
default-cluster
~~~

- Take the backup of newly created config file and moved the file for which backup taken to original location. If you issue the command again, it will not list the default-cluster. 

~~~
$ cp -p ~/.kube/config .

$ mv ~/Documents/config ~/.kube/config

$ kubectl config get-clusters
NAME
minikubeA
cluster.local
minikube
minikube1
minikube2
~~~

- If you are gonna issue the commands again those will be getting issued against minikube and if you want issue the command against clustered setup then you can specify the generated kube config file in the command also. 

~~~
$ kubectl --kubeconfig config get nodes
NAME      STATUS    ROLES         AGE       VERSION
k8s-01    Ready     master,node   17h       v1.10.4
k8s-02    Ready     master,node   17h       v1.10.4
k8s-03    Ready     node          17h       v1.10.4

$ kubectl config --kubeconfig config get-clusters
NAME
default-cluster
~~~

- It's difficult to pass the kube config everytime in command itself hence you may export it as a variable. Depending upon the current context, you can issue the command on both setups. 

~~~
$ export KUBECONFIG=$KUBECONFIG:$HOME/Documents/kubesprayconfig/config
$ kubectl config get-clusters
NAME
default-cluster
$ export KUBECONFIG=$KUBECONFIG:$HOME/.kube/config
$ echo $KUBECONFIG
config:/Users/viaggarw/Documents/kubesprayconfig/config:/Users/viaggarw/.kube/config
$ kubectl config get-clusters
NAME
minikube2
minikubeA
default-cluster
cluster.local
minikube
minikube1
~~~

References: 

https://github.com/kubernetes-incubator/kubespray/issues/257
https://kubernetes-v1-4.github.io/docs/user-guide/kubectl/kubectl_config/

Note : In this case, I am not using load balancer in-front of master nodes hence I am copying the ceriticates from one of the master node but this is not good approach in production setups.  
