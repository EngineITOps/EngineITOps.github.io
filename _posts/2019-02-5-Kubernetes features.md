---
layout: post
title: Kubernetes features
tags: [Kubernetes]
categories: [Kubernetes]
---
# Kubernetes features


In this section, we'll breakdown the different features of Kubernetes that makes it a great platform to manage your containerized applications. Let's take a look at some of these.

First up, **Multi-host Container Scheduling**.
1. This feature is handled by the Kube-scheduler
2. assigns containers, also known as Pods in Kubernetes to hosts, which are called Nodes, at runtime.
3. It accounts for resources, quality of service, policies, and user specifications before scheduling.

**Scalability and Availability.**
1. The Kubernetes Master can be deployed in a highly available configuration. 
2. Mult-region deployments are available, as well.

In Kubernetes one eight, the architecture supports up to a 5,000 node cluster, and can run 150,000 Pods. The Pods can be horizontally scaled via an API. Flexibility and Modularization. Kubernetes has a plug-and-play architecture which allows you to extend it when you need too.
There are specific add-ons for network drivers, service discovery, container runtime,visualization, and command. If there are tasks that you need to perform for your environment, specifically, you can also create add-ons to suit your needs. 
Two features that allow Kubernetes Clusters to scale are **Registration** and **Discovery**.


New Worker Nodes can seamlessly register themselves with a Kubernetes Master Node.

Kubernetes also include Service Discovery out of the box. Service Discovery allows for automatic detection of new services and endpoints via DNS or environment variables.
Kubernetes also allows for Persistent Storage, which is a much requested feature when working with containers. 
Pods can use persistent volumes to store data, and the data is retained across pod restarts or crashes. 
Application Upgrades is one area where the Kubernetes project has done a lot of pioneering work. Application upgrades are supported out of the box, as well as application rollbacks. When it comes to Kubernetes Maintenance and Upgrades, Kubernetes features are always backward compatible for a few versions.
All APIs are also versioned. And, when upgrading, or running maintenance on a host, you can unschedule the host, so that no deployments can take place on it. Once you're done, you can simply turn the host back on, again, and schedule deployments or jobs on it. 
In terms of Logging and Monitoring, application monitoring, or health checks, are built in. TCP, HTTP, or container exec health checks are available out of the box. There are also health checks to give you the status of the Nodes, or failures monitored via the Node Controller.
The Kubernetes status can also be monitored via add-ons like Heapster or cAdvisor. And finally, you can use existing logging frameworks like Elg in Kubernetes, or extend out and use your own. Management of Secrets. Sensitive data is a first-class citizen in Kubernetes.Secrets are mounted as data volumes or environment variables, and they are also specific to a single namespace. So, these aren't shared across all applications. 
And finally, the Community. Kubernetes is one of the strongest open-source communities out there. We're over a 1,000 commits a month, and is governed by the Cloud Native Computing Foundation, also known as the CNCF.
 Kubernetes also has really good documents. In terms of meetups and conferences, KubeCon is the big conference that happens twice a year, where the larger Kubernetes features are released.
