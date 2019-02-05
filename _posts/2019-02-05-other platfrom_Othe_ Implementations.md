---
layout: post
title: other platfrom - Other Implementations
tags: [Kubernetes,Docker,other]
categories: [Kubernetes,Docker]
---




# Other Implementations
Now that you know what Kubernetes is all about, it's time to discuss other platforms that are similar. We're in the software world after all, and there are many ways to solve the same problem.
Container orchestration is a very complicated topic. When containers became a hot topic in 2013 and 2014, a lot of folks and the present is included, were building their own orchestration tools in house because the landscape was very nascent at the time. Eventually, almost every company ended up moving to one of the solutions we willtalk about in this chapter.

So in short, don't build your own orchestrator today, you'll only regret it and end up moving to something else later on anyways. The four biggest players in the container orchestration landscape today are Docker Swarm, Kubernetes, Mesos and Rancher. There are also cloud-specific technologies like Amazon EC2 Container Service or Oracle Container Cloud Service that are orchestrators built specifically for those ecosystems. But we won't spent too much time comparing them in this section.

We've talked about Kubernetes in the last section, so now let's take a look at some of its competitors.

Docker Swarm is responsible for clustering and scheduling containers across hosts. It's a simpler architecture when compared to Kubernetes and Mesos. It is written in golang and it's a lightweight, declarative language. It's easy to get started, setup and understand. The typical users of Docker Swarm are smaller teams, like startups and medium-size companies. And I've only seen Swarm used in brand new greenfield projects.which are driven by teams that are mostly developers who need to deploy new products.

Mesos on the other hand is written in C++, with APIs in Java, Python, and C++. It's the oldest tool of the bunch, but this also means that it's the most stable. Mesos has a distributed kernel where many machines end up acting like one logical entity. The Marathon framework can be added to Mesos to schedule and execute tasks. And finally, Mesos has a more complex architecture than Docker Swarm.
The typical users of Mesos are larger enterprises that require lots of compute, or jobs/task-oriented workloads. Mesos is often used by companies that have to perform big data jobs. 
Rancher is a full stack container management platform. Initially it used to use a custom cluster orchestrator called cattle but now it suppers Kubernetes and Docker Swarm. It was an early player in the Docker ecosystem and had orchestration concepts that were way before its time and way before they were a hot topic.

It has a great user interface and API to interact with clusters and provides enterprise support for its tooling. One of the other benefits of Rancher is that it supports organizations and teams out of box. The typical Rancher users are smaller teams, think startups or medium-sized companies.

<img src="/assets/img/Graph of cluster tools.png" alt="This chart plots the number of hosts and containers versus the size of the development team." height=300>
If you're running in a lean shop, you should probably consider some of the solutions towards the left. If you're in a larger enterprise, you might lean towards some of the more feature-rich solutions on the right.

And it also shows that the AWS container service is overtaking Docker Swarm in less than a year. Another interesting trend in 2017 has been that most of the larger enterprises have joined the CNCF, which backs Kubernetes. Also, at DockerCon 2017, Docker natively started to support Kubernetes as an orchestrator on their platform.

<img src="/assets/img/Docker powered by Kubernets and swarm.png" alt="Kubernetes with Docker">
Realizing that the community wanted the choice of implementing Kubernetes or Docker Swarm, this gives the impression that Kubernetes has won the war of orchestrators and it has a pretty bright future ahead. We've covered other orchestration frameworks in this section, join me in the next chapter, to dive into the Kubernetes terminology and landscape.

