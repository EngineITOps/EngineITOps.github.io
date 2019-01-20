---
layout: post
title: Rook ceph custom resource defintions in kubernetes
tags: [kubernetes, rook, ceph]
category: [Kubernetes, Rook, Ceph]
author: vikrant
comments: true
---

Custom resource defintions which are created by Rook operator. 

- In the last article, we were able to create the ceph 

~~~
$ kubectl get customresourcedefinition
NAME                        AGE
clusters.ceph.rook.io       1d
filesystems.ceph.rook.io    1d
objectstores.ceph.rook.io   1d
pools.ceph.rook.io          1d
volumes.rook.io             1d
~~~

- To check the detailed information about the custom resource definition. 

~~~
$ kubectl describe customresourcedefinition/clusters.ceph.rook.io
Name:         clusters.ceph.rook.io
Namespace:
Labels:       <none>
Annotations:  <none>
API Version:  apiextensions.k8s.io/v1beta1
Kind:         CustomResourceDefinition
Metadata:
  Creation Timestamp:  2018-07-15T12:12:53Z
  Generation:          1
  Resource Version:    1346
  Self Link:           /apis/apiextensions.k8s.io/v1beta1/customresourcedefinitions/clusters.ceph.rook.io
  UID:                 6656fe9c-8828-11e8-b365-08002703dcb1
Spec:
  Group:  ceph.rook.io
  Names:
    Kind:       Cluster
    List Kind:  ClusterList
    Plural:     clusters
    Short Names:
      rcc
    Singular:  cluster
  Scope:       Namespaced
  Version:     v1beta1
Status:
  Accepted Names:
    Kind:       Cluster
    List Kind:  ClusterList
    Plural:     clusters
    Short Names:
      rcc
    Singular:  cluster
  Conditions:
    Last Transition Time:  2018-07-15T12:12:53Z
    Message:               no conflicts found
    Reason:                NoConflicts
    Status:                True
    Type:                  NamesAccepted
    Last Transition Time:  2018-07-15T12:12:53Z
    Message:               the initial names have been accepted
    Reason:                InitialNamesAccepted
    Status:                True
    Type:                  Established
Events:                    <none>
~~~