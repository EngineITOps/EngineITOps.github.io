---
layout: post
title: OVN L3 Gateway
tags: [OVN]
category: [OVN, Openstack]
author: vikrant
comments: true
--- 

In one of my previous post, I talk about the L3 gateway. In this article, I am providing more information on this topic. 

If you have worked with neutron DVR, you may already know that N/S traffic in case of instances without floating IP travel through controller node. Similarly, in case of OVN, if the instance is not having floating IP attached to it, then the SNAT happens on the node on which lrp port for the external network is present.

Example : In my case private network is 10.10.10.0/24 and floating IP network is 192.168.122.0/24, if I am spinning up an instance using private network i.e 10.10.10.0/24 and not attaching floating ip to it then all the instance N/S traffic will travel through the node on which your lrp port is present. It would be right to say that node running ovn-controller is candidate for running the  L3 gateway. As I mentioned earlier, in packstack setup ovn-controller service is running on controller node also hence in my case controller node can also host the L3 gateway. After the packstack succesful installation, OVN l3 gateway was present on compute2 node, but to test some failover scenario, I shutdown the compute2 and L3 gateway got moved to controller node. 

lrp port is currently present on controller node hence all the traffic for instances without floating IP will go through controller node. 

~~~
[root@controller ~(keystone_admin)]# ovn-sbctl show
Chassis "07e20ac2-4f66-41d4-b8c6-a5b6ae80921b"
    hostname: controller
    Encap geneve
        ip: "192.168.122.39"
        options: {csum="true"}
    Port_Binding "cr-lrp-b95e9ae7-5c91-4037-8d2c-660d4af00974"
Chassis "4180095d-1528-4063-b135-5dc0abc4ecee"
    hostname: "compute2"
    Encap geneve
        ip: "192.168.122.207"
        options: {csum="true"}
Chassis "080677db-48d9-49ad-9ee4-e02eeb3da5c2"
    hostname: "compute1"
    Encap geneve
        ip: "192.168.122.15"
        options: {csum="true"}
    Port_Binding "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1"
~~~

Following setting decide the node on which L3 gateway will be hosted. 

~~~
[root@controller ~(keystone_admin)]# grep 'ovn_l3_scheduler' /etc/neutron/plugins/networking-ovn/networking-ovn.ini
#ovn_l3_scheduler = leastloaded
~~~

Only two supported values are present for this setting as per the comment in ini file. 

~~~
# The OVN L3 Scheduler type used to schedule router gateway ports on
# hypervisors/chassis.
# leastloaded - chassis with fewest gateway ports selected
# chance - chassis randomly selected (string value)
# Allowed values: leastloaded, chance
~~~

If you are having more than one VLAN based external network then it's not necessary that all L3 gateways will be present on node, they can be distributed across multiple nodes to avoid the single point of bottleneck or failure. Even if the compute node hosting the L3 gateway is getting down, it will automatically move the gateway to another compute node according to the filter results. 

In newer version ovs-ovn i.e 2.8 at the time of writing more useful commands are present to extract the information about L3 gateway chassis. I am planning to create devstack setup to try out those commands. 