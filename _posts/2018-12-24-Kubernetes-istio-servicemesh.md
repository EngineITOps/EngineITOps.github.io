---
layout: post
title: First step with Istio 
tags: [istio, kubernetes]
category: [istio, kubernetes]
author: vikrant
comments: true
--- 

If you are working in kubernetes world then it's impossible that didn't hear the word istio. I heard about istio couple of times, I tried it sometime back in my lab environment but didn't get the chance to dwell into it. Today I found sometime to dig deep into it and try out some example. In this post, I am sharing the basic exercise which I completed on my minikube setup. In future posts, we will dig more on istio topic. 

#### What is istio?

Istio is a control plane for envoy proxy dataplane. Envoy is a proxy created by Lyft to solve the internal challenges with large scale K8 setup. 

#### Setup Information:

- Minikube running with kubernetes version v1.13.0 with 7GB RAM and 4 CPUs.

- Deployed istio following the instructions from official [istio documentation](https://istio.io/docs/setup/kubernetes/minimal-install/). I have done the minimal installation to understand the core concepts first instead of getting lost in complete package :-)

- Once the minimal istio is deployed, you should see following resources in `istio-system` namespace. 

~~~
$ kubectl get all -n istio-system
NAME                           READY     STATUS    RESTARTS   AGE
istio-pilot-7847c99564-2vj6x   1/1       Running   0          1h

NAME          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                                 AGE
istio-pilot   ClusterIP   10.101.45.244   <none>        15010/TCP,15011/TCP,8080/TCP,9093/TCP   1h

NAME          DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
istio-pilot   1         1         1            1           1h

NAME                     DESIRED   CURRENT   READY     AGE
istio-pilot-7847c99564   1         1         1         1h

NAME          REFERENCE                TARGETS   MINPODS   MAXPODS   REPLICAS   AGE
istio-pilot   Deployment/istio-pilot   2%/80%    1         5         1          1h
~~~

`istio-pilot` POD has only one `discovery` container in it. Following command can be use to check the logs of discovery container. 

~~~
$ kubectl logs -f istio-pilot-7847c99564-2vj6x -n istio-system -c discovery
~~~

- `istio` repo comes with some default examples, famous one is bookinfo, again to keep the things simple for a new learner, I started with helloworld example instead. Since I am running minimal installation hence I don't have ingressgateway configured in istio-system namespace. I modified the helloworld example to only create POD and service skipping gateway and virtualservice. 

Manifest will container two helloworld deployment with different version labels and one service. 

~~~
$ cat custom_helloworld.yaml
apiVersion: v1
kind: Service
metadata:
  name: helloworld
  labels:
    app: helloworld
spec:
  ports:
  - port: 5000
    name: http
  selector:
    app: helloworld
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: helloworld-v1
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: helloworld
        version: v1
    spec:
      containers:
      - name: helloworld
        image: istio/examples-helloworld-v1
        resources:
          requests:
            cpu: "100m"
        imagePullPolicy: IfNotPresent #Always
        ports:
        - containerPort: 5000
---
apiVersion: extensions/v1beta1
kind: Deployment
metadata:
  name: helloworld-v2
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: helloworld
        version: v2
    spec:
      containers:
      - name: helloworld
        image: istio/examples-helloworld-v2
        resources:
          requests:
            cpu: "100m"
        imagePullPolicy: IfNotPresent #Always
        ports:
        - containerPort: 5000
~~~

Use the following command to deploy it. This command will insert istio-proxy containers as a sidecar.

~~~
$ kubectl create -f <(istioctl kube-inject -f samples/helloworld/custom_helloworld.yaml)
~~~

Following two deployments and service should be present in default namespace. 

~~~
$ kubectl get pod -o wide
NAME                             READY     STATUS    RESTARTS   AGE       IP            NODE
helloworld-v1-575d9d9fcd-vgcx6   2/2       Running   0          1h        172.17.0.14   minikube
helloworld-v2-54b97b8585-v6hbv   2/2       Running   0          1h        172.17.0.3    minikube

$ kubectl get svc
NAME         TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)    AGE
helloworld   ClusterIP   10.100.251.195   <none>        5000/TCP   1h
kubernetes   ClusterIP   10.96.0.1        <none>        443/TCP    2h
~~~

- Since I am not using the ingressgateway hence I need another deployment which contains the curl command for verification purpose. 

~~~
$ cat curl-deploy.yaml
apiVersion: apps/v1beta1
kind: Deployment
metadata:
  name: curl-deploy
spec:
  replicas: 1
  template:
    metadata:
      labels:
        app: curl
    spec:
      containers:
      - name: curl
        image: radial/busyboxplus:curl
        imagePullPolicy: Always
        command:
        - sh
        - -c
        - while true; do sleep 1; done
~~~        

Again use the istioctl to inject the sidecare istio-proxy. 

~~~
kubectl create -f <(istioctl kube-inject -f samples/helloworld/curl-deploy.yaml)
~~~ 

- Connect with terminal of curl pod and issue curl command couple of times to see the RR response from helloworld service. 

~~~
$ kubectl exec -it curl-deploy-5f7684bb65-468vt -c curl sh

[ root@curl-deploy-5f7684bb65-468vt:/ ]$ curl helloworld.default.svc.cluster.local:5000/hello
Hello version: v1, instance: helloworld-v1-575d9d9fcd-vgcx6

[ root@curl-deploy-5f7684bb65-468vt:/ ]$ curl helloworld.default.svc.cluster.local:5000/hello
Hello version: v2, instance: helloworld-v2-54b97b8585-v6hbv
~~~

- Using istio DestinationRule CRD. Create destination rule which will map the version v1 and v2 of helloworld app with subsets which are understandable by istio. Using subset v1 for helloworld version v1 and same for v2.

~~~
cat <<EOF | kubectl create -f -
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: helloworld-destinationrule
spec:
  host: helloworld
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
EOF
~~~

- Use another istio VirtualService CRD to route the traffic to only version of service. 

~~~
cat <<EOF | kubectl apply -f -
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: helloworld-virtualservice
spec:
  hosts:
  - "*"
  http:
  - route:
    - destination:
        host: helloworld
        subset: v1
EOF
~~~

- Now if we issue the GET from curl pod, we can see the response is coming from only v1 version. 

~~~
[ root@curl-deploy-5f7684bb65-468vt:/ ]$ curl helloworld.default.svc.cluster.local:5000/hello
Hello version: v1, instance: helloworld-v1-575d9d9fcd-vgcx6
~~~

