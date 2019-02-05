---
layout: post
title: What is Kubernetes?
tags: [Kubernetes]
categories: [Kubernetes]
---
# What is Kubernetes?

<img src="/assets/img/Kubernetes icon.png" height="300">
Now let's talk about Kubernetes, the most popular open-source container orchestrator available today. The adoption of Docker has really taken off in the last few years. Per the 2017 Docker survey by Datadog, Docker adoption was up 40% in Datadog's very large customer base. Additionally, the 2017 Docker Usage Report, conducted by Sysdig, stated that the median number of containers running on a single host is about 10. All this data begs an important question. How do you manage all these running containers on a single host, and more importantly, across your whole infrastructure? This is where the idea of container orchestrators come in.

<img src="/assets/img/How do you manage all nodes.png" height="300">

Container orchestration solves the problem of deploying multiple containers either by themselves or as a part of an application across many hosts.
From a high level some of the features required are
1. the ability to provision hosts
2. start containers in a host
3. be able to restart failing containers, 
4. have the ability to link containers together so that they can communicate with their peers
5. expose required containers as services to the world outside the cluster, 
6. and scaling the cluster up or down.

**Kubernetes is an open-source platform designed to automate the deployment, scaling, and operation of containers.** 

**The real goal of the platform is to foster an ecosystem of components and tools that relieve the burden of running applications in public and private clouds.**

Kubernetes, often called K8S or Hubernetes, is an open-source platform that started at Google. Internally, all of the Google infrastructure relies on containers and generates more than two billion container deployments a week, all powered by an internal platform called Borg.

<img src="/assets/img/Kubernetes solution.png" height="300">

Borg was the predecessor to Kubernetes and the lessons learned from developing Borg over the years has become the primary building blocks in the development of Kubernetes. Simply put, using Kubernetes in your infrastructure gives you a platform to schedule and run containers on clusters of your machines, whether it's on bare metal, virtual machines, in a private data center, or in the cloud. This means no more golden handcuffs and opens up opportunities to have hybrid cloud scenarios for your folks migrating towards the cloud.

Because Kubernetes is a container platform, you can use Docker containers to develop and build applications, and then use Kubernetes to run these applications in your infrastructure.It's important to note that you don't have to use Docker containers. You can use rkt by CoreOS or other container platforms. However, most users in the container ecosystem use Docker containers, so we'll use Docker for this course. There are many companies that use Kubernetes today for different use cases

We'll discuss a few of these to document common ways companies are using Kubernetes.

<img src="/assets/img/box website.png" height="300">
Box has been moving towards a MIC services architecture for their infrastructure and became an early adopter. Kubernetes has provided Box's developers a common development platform to build MIC services. Also, since Kubernetes can run on bare metal, just as well as the cloud, Box could create a migration strategy to Google Cloud. It could also use the same tools and concepts to run across their existing data center and the new Google Cloud.

<img src="/assets/img/pockymanGo.png" height="300">
Pokemon GO. When a game has the motto "Got to catch them all," it retrospectively comes as no shock that as soon as it launched, within half an hour, traffic surged and crashed all Pokemon GO servers. To keep up with traffic, Niantic got help from teams at Google to move Pokemon GO to the Google container engine. To date, Pokemon GO is the largest Kubernetes deployment on the Google container engine. Due to the scale of the cluster and accompanying TrueBit, a multitude of bugs were identified, fixed, and merged back to the Kubernetes code base.

<img src="/assets/img/ebay.png" height="300">
eBay was an early adopter of OpenStack, and used OpenStack as the platform to run their virtual machines. However, as the infrastructure grew, developers found it easier to manage and deploy containers as opposed to working with .bms or applications directly on OpenStack. As a result, eBay moved to use the Kubernetes platform from OpenStack Magnum. This allowed the company to manage the infrastructure more easily and allowed their developers to continue to be agile and productive.

In the next section, we'll take a look at why Kubernetes is so effective and why people like it so much.

