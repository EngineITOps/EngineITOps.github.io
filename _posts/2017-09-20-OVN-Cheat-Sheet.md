---
layout: post
title: OVN Cheat Sheet
tags: [OVN]
category: [OVN, Openstack]
author: vikrant
comments: true
--- 

OVN Cheat Sheet for ovn-nbctl and ovn-sbctl commands. 

## ovn-nbctl 

1) Issue the following command to understand the logical network topology. As no port from the switch is used to spin up an instance hence only router port is seen in output. 

~~~
[root@controller ~(keystone_admin)]# ovn-nbctl show
    switch 0d413d9c-7f23-4ace-9a8a-29817b3b33b5 (neutron-89113f8b-bc01-46b1-84fb-edd5d606879c)
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

2) Let's spin up an instance and then check the output of command. We can see that from switch "0d413d9c-7f23-4ace-9a8a-29817b3b33b5" one port is used to spin up an instance, we can see the private IP and MAC address of the instance. I have also attached the floating IP to instance but we can't see the floating IP in output. 

~~~
[root@controller ~(keystone_admin)]# nova list
+--------------------------------------+---------------+--------+------------+-------------+--------------------------------------+
| ID                                   | Name          | Status | Task State | Power State | Networks                             |
+--------------------------------------+---------------+--------+------------+-------------+--------------------------------------+
| edef7dd9-0114-4463-a13c-c9a2edaf6ce4 | testinstance1 | ACTIVE | -          | Running     | internal1=10.10.10.9, 192.168.122.54 |
+--------------------------------------+---------------+--------+------------+-------------+--------------------------------------+

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

3) If you just want to list the logical switches present in setup. 

~~~
[root@controller ~(keystone_admin)]# ovn-nbctl ls-list
0d413d9c-7f23-4ace-9a8a-29817b3b33b5 (neutron-89113f8b-bc01-46b1-84fb-edd5d606879c)
1ec08997-0899-40d1-9b74-0a25ef476c00 (neutron-e411bbe8-e169-4268-b2bf-d5959d9d7260)
~~~

4) Similarly to list only routers. 

~~~
[root@controller ~(keystone_admin)]# ovn-nbctl lr-list
7418a4e7-abff-4af7-85f5-6eea2ede9bea (neutron-67dc2e78-e109-4dac-acce-b71b2c944dc1)
~~~

5) To list the ports associated with switch and router. 

~~~
Logical switch ports

[root@controller ~(keystone_admin)]# ovn-nbctl lsp-list 0d413d9c-7f23-4ace-9a8a-29817b3b33b5
6ef6bbdb-fa68-4fff-a281-90387da961f2 (397c019e-9bc3-49d3-ac4c-4aeeb1b3ba3e)

Logical router ports

[root@controller ~(keystone_admin)]# ovn-nbctl lrp-list 7418a4e7-abff-4af7-85f5-6eea2ede9bea
f5bc5204-4c19-4cf8-b240-67fa268120b5 (lrp-397c019e-9bc3-49d3-ac4c-4aeeb1b3ba3e)
947dc0fb-cfe6-4737-aa27-9fb38b7c7ac9 (lrp-b95e9ae7-5c91-4037-8d2c-660d4af00974)
~~~

6) Two main factors which decide the communication with instance is ACL (Security groups) and NAT. 

Security groups are applied at logical switch. I have allowed the ICMP and ssh traffic. 

~~~
[root@controller ~(keystone_admin)]# ovn-nbctl acl-list 0d413d9c-7f23-4ace-9a8a-29817b3b33b5
from-lport  1002 (inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip4) allow-related
from-lport  1002 (inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip4 && ip4.dst == {255.255.255.255, 10.10.10.0/24} && udp && udp.src == 68 && udp.dst == 67) allow
from-lport  1002 (inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip6) allow-related
from-lport  1001 (inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip) drop
  to-lport  1002 (outport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip4 && ip4.src == $as_ip4_329529f7_d012_4ba1_a689_dd443b0ec795) allow-related
  to-lport  1002 (outport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip4 && ip4.src == 0.0.0.0/0 && icmp4) allow-related
  to-lport  1002 (outport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip4 && ip4.src == 0.0.0.0/0 && tcp && tcp.dst == 22) allow-related
  to-lport  1002 (outport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip6 && ip6.src == $as_ip6_329529f7_d012_4ba1_a689_dd443b0ec795) allow-related
  to-lport  1001 (outport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && ip) drop
~~~ 

At the moment, I have deleted the previous instance hence only one default SNAT rule is present which is applicable for whole network if the instance is not having floating IP. 

~~~
[root@controller ~(keystone_admin)]# ovn-nbctl lr-nat-list 7418a4e7-abff-4af7-85f5-6eea2ede9bea
TYPE             EXTERNAL_IP        LOGICAL_IP            EXTERNAL_MAC         LOGICAL_PORT
snat             192.168.122.50     10.10.10.0/24
~~~

Let's spin the instance and attach floating ip to the instance and check the NAT rule again. New SNAT/DNAT rule is inserted for the instance. 

~~~
[root@controller ~(keystone_admin)]# nova list
+--------------------------------------+---------------+--------+------------+-------------+--------------------------------------+
| ID                                   | Name          | Status | Task State | Power State | Networks                             |
+--------------------------------------+---------------+--------+------------+-------------+--------------------------------------+
| 69736780-e0cc-46d4-a1f7-f0fac7e1cf54 | testinstance1 | ACTIVE | -          | Running     | internal1=10.10.10.4, 192.168.122.54 |
+--------------------------------------+---------------+--------+------------+-------------+--------------------------------------+

[root@controller ~(keystone_admin)]# ovn-nbctl lr-nat-list 7418a4e7-abff-4af7-85f5-6eea2ede9bea
TYPE             EXTERNAL_IP        LOGICAL_IP            EXTERNAL_MAC         LOGICAL_PORT
dnat_and_snat    192.168.122.54     10.10.10.4
snat             192.168.122.50     10.10.10.0/24
~~~


## ovn-sbctl 

- Checking all the nodes on which ovn-controller is running. 

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

- Command to check all the logical flows present for all DATAPATHs. In newer version "--ovs" option is available which will also show the openflow corresponding to logicalflow and eventually openflows are getting injected into compute nodes. 

~~~
[root@controller ~(keystone_admin)]# ovn-sbctl lflow-list | head
Datapath: "neutron-89113f8b-bc01-46b1-84fb-edd5d606879c" (75c461bc-bf27-4402-ac7d-98630213a25e)  Pipeline: ingress
  table=0 (ls_in_port_sec_l2  ), priority=100  , match=(eth.src[40]), action=(drop;)
  table=0 (ls_in_port_sec_l2  ), priority=100  , match=(vlan.present), action=(drop;)
  table=0 (ls_in_port_sec_l2  ), priority=50   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == {fa:16:3e:55:52:80}), action=(next;)
  table=0 (ls_in_port_sec_l2  ), priority=50   , match=(inport == "397c019e-9bc3-49d3-ac4c-4aeeb1b3ba3e"), action=(next;)
  table=1 (ls_in_port_sec_ip  ), priority=90   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == fa:16:3e:55:52:80 && ip4.src == 0.0.0.0 && ip4.dst == 255.255.255.255 && udp.src == 68 && udp.dst == 67), action=(next;)
  table=1 (ls_in_port_sec_ip  ), priority=90   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == fa:16:3e:55:52:80 && ip4.src == {10.10.10.4}), action=(next;)
  table=1 (ls_in_port_sec_ip  ), priority=80   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == fa:16:3e:55:52:80 && ip), action=(drop;)
  table=1 (ls_in_port_sec_ip  ), priority=0    , match=(1), action=(next;)
  table=2 (ls_in_port_sec_nd  ), priority=90   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == fa:16:3e:55:52:80 && arp.sha == fa:16:3e:55:52:80 && arp.spa == {10.10.10.4}), action=(next;)
~~~ 

- Checking all the DATAPATH present in ovn-sbctl output. For each logical switch and router datapath, two Pipelines are present for ingress and egress. 

~~~
[root@controller ~(keystone_admin)]# ovn-sbctl lflow-list | grep Datapath
Datapath: "neutron-89113f8b-bc01-46b1-84fb-edd5d606879c" (75c461bc-bf27-4402-ac7d-98630213a25e)  Pipeline: ingress
Datapath: "neutron-89113f8b-bc01-46b1-84fb-edd5d606879c" (75c461bc-bf27-4402-ac7d-98630213a25e)  Pipeline: egress
Datapath: "neutron-67dc2e78-e109-4dac-acce-b71b2c944dc1" (98a36c00-e896-44b6-aafc-278a0bf21607)  Pipeline: ingress
Datapath: "neutron-67dc2e78-e109-4dac-acce-b71b2c944dc1" (98a36c00-e896-44b6-aafc-278a0bf21607)  Pipeline: egress
Datapath: "neutron-e411bbe8-e169-4268-b2bf-d5959d9d7260" (f527be20-ed2b-4cf6-a94e-1be7ef98bbb5)  Pipeline: ingress
Datapath: "neutron-e411bbe8-e169-4268-b2bf-d5959d9d7260" (f527be20-ed2b-4cf6-a94e-1be7ef98bbb5)  Pipeline: egress
~~~

- To check the logical flows only for one Datapath for both ingress and egress pipeline. 

~~~
[root@controller ~(keystone_admin)]# ovn-sbctl lflow-list neutron-89113f8b-bc01-46b1-84fb-edd5d606879c | head
Datapath: "neutron-89113f8b-bc01-46b1-84fb-edd5d606879c" (75c461bc-bf27-4402-ac7d-98630213a25e)  Pipeline: ingress
  table=0 (ls_in_port_sec_l2  ), priority=100  , match=(eth.src[40]), action=(drop;)
  table=0 (ls_in_port_sec_l2  ), priority=100  , match=(vlan.present), action=(drop;)
  table=0 (ls_in_port_sec_l2  ), priority=50   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == {fa:16:3e:55:52:80}), action=(next;)
  table=0 (ls_in_port_sec_l2  ), priority=50   , match=(inport == "397c019e-9bc3-49d3-ac4c-4aeeb1b3ba3e"), action=(next;)
  table=1 (ls_in_port_sec_ip  ), priority=90   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == fa:16:3e:55:52:80 && ip4.src == 0.0.0.0 && ip4.dst == 255.255.255.255 && udp.src == 68 && udp.dst == 67), action=(next;)
  table=1 (ls_in_port_sec_ip  ), priority=90   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == fa:16:3e:55:52:80 && ip4.src == {10.10.10.4}), action=(next;)
  table=1 (ls_in_port_sec_ip  ), priority=80   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == fa:16:3e:55:52:80 && ip), action=(drop;)
  table=1 (ls_in_port_sec_ip  ), priority=0    , match=(1), action=(next;)
  table=2 (ls_in_port_sec_nd  ), priority=90   , match=(inport == "0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1" && eth.src == fa:16:3e:55:52:80 && arp.sha == fa:16:3e:55:52:80 && arp.spa == {10.10.10.4}), action=(next;)
~~~