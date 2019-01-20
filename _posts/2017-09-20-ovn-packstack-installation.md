---
layout: post
title: How to use OVN as a mechansim driver in openstack packstack?
tags: [OVN]
category: [OVN, Openstack]
author: vikrant
comments: true
--- 

In this article, I am going to show the packstack deployment using ovn as mechansim driver. Pike is the first release which introduced the support for ovn in packstack deployment tool. It require just few changes in answer.txt file to make the deployment successful with ovn as mechanism driver. 

Question arises what is OVN? OVN stands for Open Virtual Network. It's replacement for OVS (Openvswitch) mechanism driver, basically OVN is an extended form of OVS which will be taking care of L2 and L3 packet flows using openflows only which was not possible with OVS without network namespaces. Openflows supporting L3 traffic are present on all compute nodes which means that instances with floating IP will be having direct connectivity with external network from compute node itself instead of traversing through the controller nodes similar to DVR. But in case of DVR still the namespaces were coming into the picture which increases the number of hops in the network path. Also, in DVR if the instance is not having floating IP address then traffic has to go through controller nodes because NAT will happen on that node, in OVN new distributed gateway concept is introduced which makes this opertion also happen on one of the compute node instead of controller node. Note: Distributed GW is not running on all compute nodes, only few of them can have it. It's decided by scheduler on which compute node distributed gateway should be placed. 

Let's what changes we need to made in Openstack packstack answer.txt file to make the deployment using OVN as mechanism driver. 

Step 1 : I have done the deployment using one controller and two compute nodes. In the following example, I am just showing the ovn related changes in the answer.txt file for sake of brevity. 

~~~
[root@controller ~]# grep -i ovn /root/answer.txt | grep -v "#"
CONFIG_NEUTRON_ML2_MECHANISM_DRIVERS=ovn
CONFIG_NEUTRON_L2_AGENT=ovn
CONFIG_NEUTRON_OVN_BRIDGE_MAPPINGS=extnet:br-ex
CONFIG_NEUTRON_OVN_BRIDGE_IFACES=br-ex:ens3
CONFIG_NEUTRON_OVN_BRIDGES_COMPUTE=br-ex
CONFIG_NEUTRON_OVN_EXTERNAL_PHYSNET=extnet
CONFIG_NEUTRON_OVN_TUNNEL_IF=
CONFIG_NEUTRON_OVN_TUNNEL_SUBNETS=
~~~

One more change is required to support the new tunnel type `geneve`. 

~~~
[root@controller ~(keystone_admin)]# grep 'geneve' /root/answer.txt | grep -v "#"
CONFIG_NEUTRON_ML2_TYPE_DRIVERS=vxlan,flat,geneve
CONFIG_NEUTRON_ML2_TENANT_NETWORK_TYPES=vxlan,geneve
~~~

Step 2 : Let's check which version of OVN is installed after succesful packstack deployment. It's `ovs-ovn 2.7`

~~~
[root@controller ~(keystone_admin)]# rpm -qa | grep -i ovn
openstack-nova-novncproxy-16.0.0-1.el7.noarch
openvswitch-ovn-common-2.7.2-3.1fc27.el7.x86_64
openvswitch-ovn-host-2.7.2-3.1fc27.el7.x86_64
novnc-0.5.1-2.el7.noarch
puppet-ovn-11.3.0-1.el7.noarch
openvswitch-ovn-central-2.7.2-3.1fc27.el7.x86_64
python-networking-ovn-3.0.0-1.el7.noarch
~~~

Verify that mechanism driver is set to ovn. 

~~~
[root@controller ~(keystone_admin)]# grep ovn /etc/neutron/plugins/ml2/ml2_conf.ini
mechanism_drivers=ovn
[ovn]
ovn_nb_connection=tcp:192.168.122.39:6641
ovn_sb_connection=tcp:192.168.122.39:6642
~~~

Everything is commented in ovn `networking-ovn.ini` file by default.  

~~~
[root@controller ~(keystone_admin)]# ll /etc/neutron/plugins/networking-ovn/networking-ovn.ini
-rw-r-----. 1 root neutron 3826 Aug 30 07:50 /etc/neutron/plugins/networking-ovn/networking-ovn.ini
[root@controller ~(keystone_admin)]# egrep -v "^(#|$)" /etc/neutron/plugins/networking-ovn/networking-ovn.ini
[DEFAULT]
[ovn]
[root@controller ~(keystone_admin)]#
~~~

Step 3 : Create some test internal network, external network and router using the same neutron commands. Add internal network as port in router and set external network as gateway for router.

~~~
[root@controller ~(keystone_admin)]# openstack network list
+--------------------------------------+------------------+--------------------------------------+
| ID                                   | Name             | Subnets                              |
+--------------------------------------+------------------+--------------------------------------+
| 89113f8b-bc01-46b1-84fb-edd5d606879c | internal1        | 2936931e-0a8d-43e8-bab2-b2be05feddfe |
| e411bbe8-e169-4268-b2bf-d5959d9d7260 | external_network | 9cc2b26f-3c3e-41f9-be25-e99ac514e2b9 |
+--------------------------------------+------------------+--------------------------------------+
[root@controller ~(keystone_admin)]# openstack router list
+--------------------------------------+---------+--------+-------+-------------+-------+----------------------------------+
| ID                                   | Name    | Status | State | Distributed | HA    | Project                          |
+--------------------------------------+---------+--------+-------+-------------+-------+----------------------------------+
| 67dc2e78-e109-4dac-acce-b71b2c944dc1 | router1 | ACTIVE | UP    | False       | False | a1ba67a2a9b84e4ab5746edcec40dba4 |
+--------------------------------------+---------+--------+-------+-------------+-------+----------------------------------+
~~~

Verify the logical OVN topology using command:

~~~
[root@controller ~(keystone_admin)]# ovn-nbctl show
    switch 0d413d9c-7f23-4ace-9a8a-29817b3b33b5 (neutron-89113f8b-bc01-46b1-84fb-edd5d606879c)
        port 6fe3cab5-5f84-44c8-90f2-64c21b489c62
            addresses: ["fa:16:3e:fa:d6:d3 10.10.10.9"]
        port 397c019e-9bc3-49d3-ac4c-4aeeb1b3ba3e
            addresses: ["router"]
    switch 1ec08997-0899-40d1-9b74-0a25ef476c00 (neutron-e411bbe8-e169-4268-b2bf-d5959d9d7260)
        port provnet-e411bbe8-e169-4268-b2bf-d5959d9d7260
            addresses: ["unknown"]
        port b95e9ae7-5c91-4037-8d2c-660d4af00974
            addresses: ["router"]
    router 7418a4e7-abff-4af7-85f5-6eea2ede9bea (neutron-67dc2e78-e109-4dac-acce-b71b2c944dc1)
        port lrp-b95e9ae7-5c91-4037-8d2c-660d4af00974
            mac: "fa:16:3e:52:20:7c"
            networks: ["192.168.122.50/24"]
        port lrp-397c019e-9bc3-49d3-ac4c-4aeeb1b3ba3e
            mac: "fa:16:3e:87:28:40"
            networks: ["10.10.10.1/24"]
~~~

Two logical switches are connected corresponding to internal1 and external_network. router is created with first IP address from subnet range and this IP will be used for NAT of the instances which are not having floating IP associated with them.  

Check out what are the differences present when using ovn as mechanism driver instead of ovs (openvswitch). 

- First of all private networks are created with new tunnel type instead of vxlan.

~~~
[root@controller ~(keystone_admin)]# openstack network show internal1
+---------------------------+--------------------------------------+
| Field                     | Value                                |
+---------------------------+--------------------------------------+
| admin_state_up            | UP                                   |
| availability_zone_hints   |                                      |
| availability_zones        |                                      |
| created_at                | 2017-09-03T17:04:31Z                 |
| description               |                                      |
| dns_domain                | None                                 |
| id                        | 89113f8b-bc01-46b1-84fb-edd5d606879c |
| ipv4_address_scope        | None                                 |
| ipv6_address_scope        | None                                 |
| is_default                | None                                 |
| is_vlan_transparent       | None                                 |
| mtu                       | 1442                                 |
| name                      | internal1                            |
| port_security_enabled     | True                                 |
| project_id                | a1ba67a2a9b84e4ab5746edcec40dba4     |
| provider:network_type     | geneve                               |
| provider:physical_network | None                                 |
| provider:segmentation_id  | 63                                   |
| qos_policy_id             | None                                 |
| revision_number           | 3                                    |
| router:external           | Internal                             |
| segments                  | None                                 |
| shared                    | False                                |
| status                    | ACTIVE                               |
| subnets                   | 2936931e-0a8d-43e8-bab2-b2be05feddfe |
| tags                      |                                      |
| updated_at                | 2017-09-03T17:04:39Z                 |
+---------------------------+--------------------------------------+
~~~

- No network namespaces are present corresponding to created networks. That means you would not be able to connect to instances which are not having floating IP address from the network namespace. But this feature is again introduced in later versions. 

~~~
[root@controller ~(keystone_admin)]# ip netns list
[root@controller ~(keystone_admin)]#
~~~

- What about `neutron agent-list`? That's also gone. 

~~~
[root@controller ~(keystone_admin)]# neutron agent-list
neutron CLI is deprecated and will be removed in the future. Use openstack CLI instead.

[root@controller ~(keystone_admin)]#
~~~

In the next post, we will discuss about the architecture of OVN which will help us to understand why these things are missing from OVN. 
