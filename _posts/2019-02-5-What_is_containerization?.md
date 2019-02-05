---
layout: post
title: What is containerization?
tags: [Kubernetes ,Docker]
categories: [Kubernetes , Docker]
---
# What is containerization?
Containers have become one of the most popular concepts used in IT and software industry in the last five years. Since the introduction of Docker, containers have evolved to a larger ecosystem that include many tools and technologies, including Docker and Kubernetes.

<img src="/assets/img/HIstory of containers .png" alt="History of containers" height="300">

Before we go into too much detail, let's look at why containers have become so popular and how they're used. First off, containers aren't a new topic. They've existed for a number of years and have taken many forms before the creation of Docker.

<img src="/assets/img/What are Containers.png" alt="What is container" height="200">

As you can see here, in general a container is defined as a collection of software processes unified by one namespace with access to an operating system kernel that it shares with other containers and little or no access between them.
Docker modifies this definition by saying that a container is a runtime instance of Docker images that contain three things, a Docker image, an execution environment, and a standard set of instructions. For those coming from an object oriented world, you can use the analogy of classes and objects, where a container is an object and the class is a Docker image. While Docker has many products and solutions, the core pieces of the ecosystem are the Docker Engine and the Docker Store, sometimes referred to as the Docker Hub.

<img src="/assets/img/Docker engine and Docker Store.png" alt="Docker engine and Docker Store" height="300">

The Docker Engine is comprised of runtime and packaging tools and is required to be installed on the hosts that run Docker. The Docker Store is an online cloud service where users can store and share their Docker images. 
One question that comes up a lot is what is the difference between a container and a virtual machine? Containers might look like a VM, but these are two distinct technologies.

In a VM, 
1. Each virtual machine includes many applications
2. All the necessary binaries and libraries that would exist on the OS
3. The entire guest operating system to interact with them.

On the other hand, a container 
1. will include the application and all of its dependencies
2. Share the kernel with the other containers.
3.It is not tied to any specific infrastructureother than having the Docker Engine installed on its host.
4. It'll run an isolated process in theuser space on the host operating system. 
5. This allows containers to run on almost any computer, infrastructure, or cloud.

From a high level, containers provide benefits to both developers and DevOps folk alike.

<img src="/assets/img/Container benifits for users.png" alt="Benefits of containers for Developers" height="300">


Developers like them because,
1. it's easy to create applications that are portable and packaged in a standard way.
2. They also make the process of deployment very easy and repeatable. <br>
3. Testing, packaging, and integrations can be automated in an easier way than before.
4. Containers support newer microservices architectures, which fit better from a developer mindset. 
5. Containers help alleviate platform compatibility issues. 

From a DevOps standpoint, 
1. using containers simplifies release management. Deployments become much more reliable, which improves the speed and frequency of releases. The application lifecycle is consistent.
2. They can be configured once and run multiple times, making the process more repeatable and efficient. Environments can be made more consistent. No more process differences between the dev, staging, and production environments. 
3. Scaling applications also becomes a lot simpler. Containers take a few seconds to deploy to a host, which makes the process of adding extra workers easier and the workload can grow and shrink more quickly for on-demand use cases. 

One of the biggest value adds of using container technologies in an enterprise is that developers and DevOps team now have a common language to collaborate.Both sets of teams can describe their needs and architectures in terms of containers usingthe same vocabulary for dev and deployment. Issues that come up in production by a DevOps team can be easily communicated back to a development team. The dev team can isolate and debug specific issues to a container level, eliminating problems relating to differences in hosts or runtime issues with applications. 

With all the benefits that containersbring to the table, it's no wonder that there's such a dramatic increase in their use.
A Forrester survey conducted in 2017 indicated that organisations expect the number of containerised apps will rise by 80% in 2019. The white paper is a great read and talks about some of the most prominent use cases of containers in different sized orgs. Organizations use containers to build applications to incorporate a microservices-based architecture.Newer applications are built with a microservices mindset using containers underneath to realize this, and legacy applications are shipped as containers to fit the microservices mold as well.

Finally, containers assist with code agility and help you build a continuous integration or continuous deployment pipeline. This use case really pushes an IT team to develop, test, and deploy applications faster in a more automated fashion. Hopefully by now it's clear why enterprises have started to adopt containers in such a big way. Now that we understand what containers are all about, let's see where Kubernetes plays a role.
