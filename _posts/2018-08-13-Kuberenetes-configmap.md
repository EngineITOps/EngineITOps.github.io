---
layout: post
title: Deep-dive on kubernetes config maps
tags: [Kubernetes, configmap]
category: [Kubernetes]
author: vikrant
comments: true
--- 

configmap is very important topic in kubernetes, this is a recommended way to pass the configuration to your PODs instead of hard-coding the config files into your docker images. In this article, I provide the information about various ways of providing configmap to PODs. 

configmap can be provided to PODs mainly in two ways:

1) environment variable

Pass the key/value pair directly as literal to command. 
List of multiple environment variables can be define in a file and then that file can be passed to kubectl command using `--from-env-file` switch. 

2) Config files. 

Passing the whole directory or single file without specifying the key.
Passing the files using the keys. 


## Configmap using ENV

#### Creating configmap from literals

- Passing the key/value pair directly in kubectl command which we want to use inside the POD. 

~~~
# kubectl create configmap fromliterals --from-literal=pizza=cheese --from-literal=drink=coke

# kubectl describe cm fromliterals
Name:         fromliterals
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
pizza:
----
cheese
drink:
----
coke
Events:  <none>
~~~

- Use the configmap `fromliterals` in POD manifest and accessing the key/value pair using keys and passing the values to environment variables. In this case `FOOD` env variable should get the value of `pizza` key and `DRINK` env variable should get the value of `drink` key. 

~~~
cat <<EOF | kubectl create -f -
   apiVersion: v1
   kind: Pod
   metadata:
     name: literal-pod
   spec:
     containers:
       - name: literal-container
         image: k8s.gcr.io/busybox
         command: [ "/bin/sh", "-c", "env" ]
         env:
           # Define the environment variable
           - name: FOOD
             valueFrom:
               configMapKeyRef:
                 # The ConfigMap containing the value you want to assign to SPECIAL_LEVEL_KEY
                 name: fromliterals
                 # Specify the key associated with the value
                 key: pizza
           - name: DRINK
             valueFrom: 
               configMapKeyRef: 
                 name: fromliterals
                 key: drink      
     restartPolicy: Never
EOF
~~~

- Verify from the POD logs that environment variables are set to right values. FOOD and DRINK env variables got the cheese and coke as values respectively. 

~~~
root@node1:~# kubectl logs literal-pod
KUBERNETES_PORT=tcp://10.233.0.1:443
KUBERNETES_SERVICE_PORT=443
HOSTNAME=literal-pod
SHLVL=1
HOME=/root
FOOD=cheese
KUBERNETES_PORT_443_TCP_ADDR=10.233.0.1
DRINK=coke
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
KUBERNETES_PORT_443_TCP_PORT=443
KUBERNETES_PORT_443_TCP_PROTO=tcp
KUBERNETES_PORT_443_TCP=tcp://10.233.0.1:443
KUBERNETES_SERVICE_PORT_HTTPS=443
PWD=/
KUBERNETES_SERVICE_HOST=10.233.0.1
~~~

#### Creating configmap using file

- Define the key/value pair in a file. 

~~~
# cat configenvfile
food=pizza
drink=coffee
dessert=cake
~~~

- Create the configmap using the file. 

~~~
# kubectl create cm envfromfile --from-env-file=configenvfile
configmap "envfromfile" created

# kubectl describe cm envfromfile
Name:         envfromfile
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
dessert:
----
cake
drink:
----
coffee
food:
----
pizza
Events:  <none>
~~~

- Start the POD using configmap and verified that env are set. 

~~~
cat <<EOF | kubectl create -f -
   apiVersion: v1
   kind: Pod
   metadata:
     name: envfile-pod
   spec:
     containers:
       - name: envfile-container
         image: k8s.gcr.io/busybox
         command: [ "/bin/sh", "-c", "env" ]
         env:
           # Define the environment variable
           - name: FOOD
             valueFrom:
               configMapKeyRef:
                 # The ConfigMap containing the value you want to assign to SPECIAL_LEVEL_KEY
                 name: envfromfile
                 # Specify the key associated with the value
                 key: food
           - name: DRINK
             valueFrom: 
               configMapKeyRef: 
                 name: envfromfile
                 key: drink      
     restartPolicy: Never
EOF

root@node1:~# kubectl get pod
NAME          READY     STATUS      RESTARTS   AGE
envfile-pod   0/1       Completed   0          7m
root@node1:~# kubectl logs envfile-pod
KUBERNETES_PORT=tcp://10.233.0.1:443
KUBERNETES_SERVICE_PORT=443
HOSTNAME=envfile-pod
SHLVL=1
HOME=/root
FOOD=pizza
KUBERNETES_PORT_443_TCP_ADDR=10.233.0.1
DRINK=coffee
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
KUBERNETES_PORT_443_TCP_PORT=443
KUBERNETES_PORT_443_TCP_PROTO=tcp
KUBERNETES_PORT_443_TCP=tcp://10.233.0.1:443
KUBERNETES_SERVICE_PORT_HTTPS=443
PWD=/
KUBERNETES_SERVICE_HOST=10.233.0.1
~~~

If you are having lot of variables to pass, it's recommended to use file. 

## configmap using files. 

- Created a directory and added two test files inside that directory which I will use to explain the usage of files. 

~~~
# mkdir configfromfiles

~/configfiles# ls -lrht
total 8.0K
-rw-r--r-- 1 root root 174 Jul 13 20:18 ssh_host_ecdsa_key.pub
-rw-r--r-- 1 root root 338 Aug 13 10:06 ssh_import_id

# cat ssh_import_id
{
	"_comment_": "This file is JSON syntax and will be loaded by ssh-import-id to obtain the URL string, which defaults to launchpad.net.  The following URL *must* be an https address with a valid, signed certificate!!!  %s is the variable that will be filled by the ssh-import-id utility.",
	"URL": "https://launchpad.net/~%s/+sshkeys"
}

# cat ssh_host_ecdsa_key.pub
ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBDORsiVxjaDDxTrT/X/PoYs0KBPxSmqJwUoLSpfhIC9ZGOkuH9ejbobVC7Rdk48JG/s9g1+MUKo7nJJZAgsZx84= root@vagrant
~~~

#### configmap using directory. 

- Create the configmap by specifying the directory in which both files are present. 

~~~
root@node1:~# kubectl create cm configfromfiles --from-file=configfiles/
configmap "configfromfiles" created

# kubectl create cm configfromfiles --from-file=configfiles/
configmap "configfromfiles" created
~~~

- Since we haven't used the keys to add configuration files hence by-default it's taking the filename as a key to refer the content of file inside the POD. 

~~~
# kubectl describe cm configfromfiles
Name:         configfromfiles
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
ssh_host_ecdsa_key.pub:
----
ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBDORsiVxjaDDxTrT/X/PoYs0KBPxSmqJwUoLSpfhIC9ZGOkuH9ejbobVC7Rdk48JG/s9g1+MUKo7nJJZAgsZx84= root@vagrant

ssh_import_id:
----
{
  "_comment_": "This file is JSON syntax and will be loaded by ssh-import-id to obtain the URL string, which defaults to launchpad.net.  The following URL *must* be an https address with a valid, signed certificate!!!  %s is the variable that will be filled by the ssh-import-id utility.",
  "URL": "https://launchpad.net/~%s/+sshkeys"
}

Events:  <none>
~~~

- Use the configmap `configfromfiles` to provide the files to POD. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: configfiles-pod
spec:
  containers:
    - name: configfiles-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "ls /etc/config/" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        # Provide the name of the ConfigMap containing the files you want
        # to add to the container
        name: configfromfiles
  restartPolicy: Never
EOF
~~~

- Created the POD and we can see that both files used in configmap are available inside the POD. 

~~~
root@node1:~/configfiles# kubectl get pod
NAME              READY     STATUS    RESTARTS   AGE
configfiles-pod   1/1       Running   0          4s

root@node1:~/configfiles# kubectl logs configfiles-pod
ssh_host_ecdsa_key.pub
ssh_import_id
~~~

- Can we use only one file inside the POD. Yes, it's possible, infact we can do that in two ways. 

a) Remember name of the file was configured as a key because we can't specify any key while creating configmap from directory but you can use key while specifying the file individually. Referring the name of file directly as a key. IMP: You need to specify the path which indicates the name with which you file will be present inside POD. In this case for file `ssh_host_ecdsa_key.pub` I am using `keys` as a name to access the file inside POD. 

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: configfiles-pod
spec:
  containers:
    - name: configfiles-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "cat /etc/config/keys" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        # Provide the name of the ConfigMap containing the files you want
        # to add to the container
        name: configfromfiles
        items:
        - key: ssh_host_ecdsa_key.pub
          path: keys
  restartPolicy: Never
EOF
~~~

Aside note:  If you are curious to know what happens if you don't specify the path and trying to access the file using keyname something like below manifest.

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: configfiles-pod
spec:
  containers:
    - name: configfiles-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "cat /etc/config/ssh_host_ecdsa_key.pub" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config
  volumes:
    - name: config-volume
      configMap:
        # Provide the name of the ConfigMap containing the files you want
        # to add to the container
        name: configfromfiles
        items:
        - key: ssh_host_ecdsa_key.pub
  restartPolicy: Never
EOF
~~~

U will get following error:

~~~
error: error validating "STDIN": error validating data: ValidationError(Pod.spec.volumes[0].configMap.items[0]): missing required field "path" in io.k8s.api.core.v1.KeyToPath; if you choose to ignore these errors, turn validation off with --validate=false
~~~


b) Accessing the file inside the POD using `subPath` instead of using key to refer the name of file. But I read that if you are going to use subPath then changes to configmap doesn't reflect inside the POD. https://github.com/kubernetes/kubernetes/issues/50345

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: configfiles-pod
spec:
  containers:
    - name: configfiles-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "cat /etc/config/ssh_host_ecdsa_key.pub" ]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/config/ssh_host_ecdsa_key.pub
        subPath: ssh_host_ecdsa_key.pub
  volumes:
    - name: config-volume
      configMap:
        # Provide the name of the ConfigMap containing the files you want
        # to add to the container
        name: configfromfiles
  restartPolicy: Never
EOF
~~~

Starting POD and checking the logs. 

~~~
root@node1:~/configfiles# kubectl get pod
NAME              READY     STATUS              RESTARTS   AGE
configfiles-pod   0/1       ContainerCreating   0          3s
root@node1:~/configfiles# kubectl logs configfiles-pod
ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBDORsiVxjaDDxTrT/X/PoYs0KBPxSmqJwUoLSpfhIC9ZGOkuH9ejbobVC7Rdk48JG/s9g1+MUKo7nJJZAgsZx84= root@vagrant
root@node1:~/configfiles#
~~~

#### configmap referring file indvidually using key. 

- Here keys are used to refer the files inside configmap. 

~~~
# kubectl create cm keyconfigfiles --from-file=sshpublic=ssh_host_ecdsa_key.pub --from-file=sshimportid=ssh_import_id
configmap "keyconfigfiles" created

# kubectl describe cm keyconfigfiles
Name:         keyconfigfiles
Namespace:    default
Labels:       <none>
Annotations:  <none>

Data
====
sshimportid:
----
{
  "_comment_": "This file is JSON syntax and will be loaded by ssh-import-id to obtain the URL string, which defaults to launchpad.net.  The following URL *must* be an https address with a valid, signed certificate!!!  %s is the variable that will be filled by the ssh-import-id utility.",
  "URL": "https://launchpad.net/~%s/+sshkeys"
}

sshpublic:
----
ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBDORsiVxjaDDxTrT/X/PoYs0KBPxSmqJwUoLSpfhIC9ZGOkuH9ejbobVC7Rdk48JG/s9g1+MUKo7nJJZAgsZx84= root@vagrant

Events:  <none>
~~~

- We can use the same keys to refer the config files inside the POD.

~~~
cat <<EOF | kubectl create -f -
apiVersion: v1
kind: Pod
metadata:
  name: configfiles-pod
spec:
  containers:
    - name: configfiles-container
      image: k8s.gcr.io/busybox
      command: [ "/bin/sh", "-c", "cat /etc/config/sshid"]
      volumeMounts:
      - name: config-volume
        mountPath: /etc/configfiles
  volumes:
    - name: config-volume
      configMap:
        # Provide the name of the ConfigMap containing the files you want
        # to add to the container
        name: keyconfigfiles
        items:
        - key: sshimportid
          path: sshid
        - key: sshpublic
          path: sshpub  
  restartPolicy: Never
EOF
~~~

- Reading the content of only one file. 

~~~
root@node1:~/configfiles# kubectl get pod
NAME              READY     STATUS              RESTARTS   AGE
configfiles-pod   0/1       ContainerCreating   0          3s
root@node1:~/configfiles# kubectl logs configfiles-pod
{
	"_comment_": "This file is JSON syntax and will be loaded by ssh-import-id to obtain the URL string, which defaults to launchpad.net.  The following URL *must* be an https address with a valid, signed certificate!!!  %s is the variable that will be filled by the ssh-import-id utility.",
	"URL": "https://launchpad.net/~%s/+sshkeys"
}
~~~


