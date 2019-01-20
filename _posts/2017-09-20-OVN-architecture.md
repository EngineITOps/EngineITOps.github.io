---
layout: post
title: Understand OVN architecture
tags: [OVN]
category: [OVN, Openstack]
author: vikrant
comments: true
--- 

In previous post, we have seen the procedure to use OVN as mechanism driver in packstack installation. In this article, my main focus is to talk about the OVN architecture. 

I would suggest you some great reads on this topic given in References section. 

OVN is all about logical flows which are present on controller nodes in south DB. These logical flows are getting converted into Openvswitch openflows and getting stored on every compute node. This transition happen using ovn-controller process which is running on all compute nodes. If you are doing a packstack based installation following my previous post, then ovn-controller is also running on controller node along with compute node because in packstack there is no such way to avoid running the ovn-controller on controller node or at-least I didn't find any. Which means that controller node is also a candidate on which your distributed GW can run. 

Following are the OVN related services running on openstack nodes:

Controller Node: As I mentioned earlier ovn-controller in ideal case shouldn't be running on controller node. 

~~~
[root@controller ~(keystone_admin)]# ps -ef | grep -w ovn | grep -v grep
root       949     1  0 Sep17 ?        00:00:00 ovn-controller: monitoring pid 950 (healthy)
root       950   949  0 Sep17 ?        00:34:39 ovn-controller unix:/var/run/openvswitch/db.sock -vconsole:emer -vsyslog:err -vfile:info --no-chdir --log-file=/var/log/openvswitch/ovn-controller.log --pidfile=/var/run/openvswitch/ovn-controller.pid --detach --monitor
root       999     1  0 Sep17 ?        00:00:00 ovn-northd: monitoring pid 1000 (healthy)
root      1000   999  0 Sep17 ?        00:00:00 ovn-northd -vconsole:emer -vsyslog:err -vfile:info --ovnnb-db=unix:/run/openvswitch/ovnnb_db.sock --ovnsb-db=unix:/run/openvswitch/ovnsb_db.sock --no-chdir --log-file=/var/log/openvswitch/ovn-northd.log --pidfile=/run/openvswitch/ovn-northd.pid --detach --monitor
~~~

Compute Node: Only ovn-controller is running on compute node. 

~~~
[root@compute1 ~]# ps -ef | grep -i ovn | grep -v grep
root       895     1  0 Sep13 ?        00:00:00 ovn-controller: monitoring pid 896 (healthy)
root       896   895  0 Sep13 ?        01:10:00 ovn-controller unix:/var/run/openvswitch/db.sock -vconsole:emer -vsyslog:err -vfile:info --no-chdir --log-file=/var/log/openvswitch/ovn-controller.log --pidfile=/var/run/openvswitch/ovn-controller.pid --detach --monitor
~~~

Purpose of each service: 

ovn-northd = It transfer the logical topology into logical flows. It's important to notice that logical flows are different from openflows. All translated information is stored in Southbound DB.

OVN Controller = Running on all compute nodes, to perform logical flow translation into OpenFlow which are then programmed into the local OVS instance.

When OVS is used as mechansim driver, openflows were only responsible for handling the L2 traffic now in case of OVN openflow rules are also used to take the decision of L3 traffic. 

Whole objective of OVN was to remove network namespaces which were coming in traffic flow path. 

I will dig up more on the flows in coming posts. 

#### References:

[1]  http://networkop.co.uk/blog/2016/11/27/ovn-part1/
[2]  http://galsagie.github.io/2015/04/20/ovn-1/
[3]  https://blog.russellbryant.net/2015/04/08/ovn-and-openstack-integration-development-update/