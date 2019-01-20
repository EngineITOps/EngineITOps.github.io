---
layout: post
title: Istio authentication
tags: [istio, kubernetes]
category: [istio, kubernetes]
author: vikrant
comments: true
--- 

Citadel is the component of Istio repsonsible for for key and certificate management. In this article, I am showing basic information about the usage of policy and destinationrule in context of TLS. 

Deploy the Istio on minikube setup following the instructions provided in [1]

- Even though we have chosen to disable the mutual authentication between sidecars, still you will be able to see the MeshPolicy rule created in PERMISSIVE mode. This mode indicates it's accepting both TLS/non-TLS connections. 

~~~
$ kubectl describe meshpolicies.authentication.istio.io default
Name:         default
Namespace:
Labels:       app=istio-security
              chart=security-1.0.5
              heritage=Tiller
              release=istio
Annotations:  kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"authentication.istio.io/v1alpha1","kind":"MeshPolicy","metadata":{"annotations":{},"labels":{"app":"istio-security","chart":"security-1....
API Version:  authentication.istio.io/v1alpha1
Kind:         MeshPolicy
Metadata:
  Creation Timestamp:  2018-12-27T10:01:02Z
  Generation:          1
  Resource Version:    199898
  Self Link:           /apis/authentication.istio.io/v1alpha1/meshpolicies/default
  UID:                 513832f3-09be-11e9-9f03-0800274a2878
Spec:
  Peers:
    Mtls:
      Mode:  PERMISSIVE
Events:      <none>
~~~

- Deploy the helloworld application in helloworld namespace while deploying the application we have injected the sidecar. 

~~~
$ kubectl create ns helloworld
namespace "helloworld" created

$ kubectl get secrets -n helloworld
NAME                  TYPE                                  DATA      AGE
default-token-qhknp   kubernetes.io/service-account-token   3         46s
istio.default         istio.io/key-and-cert                 3         46s

$ kubectl apply -f <(istioctl kube-inject -f samples/helloworld/custom_helloworld.yml) -n helloworld
service "helloworld" created
deployment.extensions "helloworld-v1" created
deployment.extensions "helloworld-v2" created
~~~

- Create another namespace curlworld and deploy the curl in this namespace. Confirm that you are able to access the helloworld application deployed in helloworld namespace. 

~~~
$ kubectl create ns curlworld
namespace "curlworld" created

$ kubectl apply -f <(istioctl kube-inject -f samples/helloworld/curl-deploy.yaml) -n curlworld
deployment.apps "curl-deploy" created

$ kubectl exec -it curl-deploy-5f7684bb65-vbhdn -c curl -n curlworld sh
sh: shopt: not found
[ root@curl-deploy-5f7684bb65-vbhdn:/ ]$ curl helloworld.helloworld.svc.cluster.local:5000/hello
Hello version: v1, instance: helloworld-v1-575d9d9fcd-58rf6
[ root@curl-deploy-5f7684bb65-vbhdn:/ ]$ curl helloworld.helloworld.svc.cluster.local:5000/hello
Hello version: v2, instance: helloworld-v2-54b97b8585-xbvts
~~~

- Remember default Mesh wide policy is already deployed. Instead of modifying the mesh wide policy from PERMISSIVE to restrictive, created another policy for helloworld namespace for helloworld app. 

~~~
$ cat<< EOF | kubectl create -f -
apiVersion: "authentication.istio.io/v1alpha1"
kind: "Policy"
metadata:
  name: "helloworld-policy"
  namespace: "helloworld"
spec:
  peers:
  - mtls: {}
  targets:
  - name: helloworld
EOF
~~~

- Since we have enabled the Mutual TLS for helloworld app but not for client hence the curl client is not able to access the helloworld app. 

~~~
[ root@curl-deploy-5f7684bb65-vbhdn:/ ]$ curl helloworld.helloworld.svc.cluster.local:5000/hello
upstream connect error or disconnect/reset before headers
~~~

It's important to note that if I am going to create new namespace and creating helloworld app in that namespace then I should be able to access the app in that namespace because our Policy rule is only specific to helloworld service in helloworld namespace. 

- To make the client able to access the helloworld app, apply this destination rule in curlworld namespace, for helloworld service app. 

~~~
cat <<EOF | kubectl apply -f -
apiVersion: "networking.istio.io/v1alpha3"
kind: "DestinationRule"
metadata:
  name: "default"
  namespace: "curlworld"
spec:
  host: "helloworld.helloworld.svc.cluster.local"
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL
EOF
destinationrule.networking.istio.io "default" created
~~~

Perform the tls check on service to see the corresponding destination rule.

~~~
istioctl authn tls-check helloworld.helloworld.svc.cluster.local
Stderr when execute [/usr/local/bin/pilot-discovery request GET /debug/authenticationz ]: gc 1 @0.014s 11%: 0.57+0.90+1.1 ms clock, 2.2+0.28/0.74/0.67+4.7 ms cpu, 4->4->1 MB, 5 MB goal, 4 P
gc 2 @0.028s 12%: 0.010+1.9+1.3 ms clock, 0.040+0.39/1.4/2.3+5.3 ms cpu, 4->4->2 MB, 5 MB goal, 4 P

HOST:PORT                                        STATUS     SERVER     CLIENT     AUTHN POLICY                     DESTINATION RULE
helloworld.helloworld.svc.cluster.local:5000     OK         mTLS       mTLS       helloworld-policy/helloworld     default/curlworld
~~~

To confirm whether other clients are also able to access the helloworld, created new namespace `curlworld1` and started the curl deployment in it with istio sidecar. I was getting some unexpected results. Since my destination rule was only for curlworld namespace hence I was expected it not to work. 

~~~
$ kubectl exec -it -n curlworld1 curl-deploy-5f7684bb65-8djqc -c curl sh
sh: shopt: not found
[ root@curl-deploy-5f7684bb65-8djqc:/ ]$ curl helloworld.helloworld.svc.cluster.local:5000/hello
Hello version: v2, instance: helloworld-v2-54b97b8585-xbvts
~~~

Opened [Bug](https://github.com/istio/istio/issues/10673) for this issue. 

Let's see whether it's able to access the helloworld deployed in different namespace `helloworld1`, it's not which is expected behavior because in the host section of destinationrule we mentioned that we should be only able to access the service in helloworld namespace. 

~~~
[ root@curl-deploy-5f7684bb65-vbhdn:/ ]$ curl helloworld.helloworld1.svc.cluster.local:5000/hello
upstream connect error or disconnect/reset before headers
~~~

Following three commands can be useful to see policy and destinationrule present in all namespaces.

~~~
kubectl get policies.authentication.istio.io --all-namespaces
kubectl get meshpolicies.authentication.istio.io
kubectl get destinationrules.networking.istio.io --all-namespaces
~~~

[1] https://istio.io/docs/setup/kubernetes/quick-start/#option-1-install-istio-without-mutual-tls-authentication-between-sidecars


