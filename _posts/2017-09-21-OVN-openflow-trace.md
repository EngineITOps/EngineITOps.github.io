---
layout: post
title: How to use ovn-trace for troubleshooting openflows
tags: [OVN]
category: [OVN, Openstack]
author: vikrant
comments: true
--- 

In my [last post](https://ervikrant06.github.io/ovn-trace/), I have shown the usage of ovn-trace to trace the logical flows, new versions of ovs-ovn also includes the option "--ovs" which will show the openflows along with logical flows. But as I am using ovs-ovn 2.7 version which doesn't include the "--ovs" option hence I am showing the trace command of openflows in this article. 

## Setup Info

Three instances are running in my setup. testinstance1 and testinstance2 are from same subnet but running on different compute nodes. 

~~~
[root@controller ~(keystone_admin)]# nova list --fields name,status,host,networks
+--------------------------------------+---------------+--------+----------+--------------------------------------+
| ID                                   | Name          | Status | Host     | Networks                             |
+--------------------------------------+---------------+--------+----------+--------------------------------------+
| 69736780-e0cc-46d4-a1f7-f0fac7e1cf54 | testinstance1 | ACTIVE | compute1 | internal1=10.10.10.4, 192.168.122.54 |
| 278b5a14-8ae6-4e91-870e-35f6230ed48a | testinstance2 | ACTIVE | compute2 | internal1=10.10.10.10                |
| 8683b0c2-6685-4aff-9549-c69311b57238 | testinstance3 | ACTIVE | compute2 | internal2=10.10.11.4                 |
+--------------------------------------+---------------+--------+----------+--------------------------------------+
~~~

Checking the interface MAC address for both instances. 

~~~
[root@controller ~(keystone_admin)]# nova interface-list testinstance1
+------------+--------------------------------------+--------------------------------------+--------------+-------------------+
| Port State | Port ID                              | Net ID                               | IP addresses | MAC Addr          |
+------------+--------------------------------------+--------------------------------------+--------------+-------------------+
| ACTIVE     | 0bc5e22d-bd80-4cac-a9b3-51c0d0b284d1 | 89113f8b-bc01-46b1-84fb-edd5d606879c | 10.10.10.4   | fa:16:3e:55:52:80 |
+------------+--------------------------------------+--------------------------------------+--------------+-------------------+

[root@controller ~(keystone_admin)]# nova interface-list testinstance2
+------------+--------------------------------------+--------------------------------------+--------------+-------------------+
| Port State | Port ID                              | Net ID                               | IP addresses | MAC Addr          |
+------------+--------------------------------------+--------------------------------------+--------------+-------------------+
| ACTIVE     | 84645ee6-8efa-435e-b93a-73cc173364ba | 89113f8b-bc01-46b1-84fb-edd5d606879c | 10.10.10.10  | fa:16:3e:ef:50:3e |
+------------+--------------------------------------+--------------------------------------+--------------+-------------------+
~~~

## Tracing the flow from compute1 to compute2.

#### compute1 (Node hosting source instance)

Step 1 : Check the port on which the testinstance1 is connected on compute1.

~~~
[root@compute1 ~]# ovs-ofctl dump-ports-desc br-int
OFPST_PORT_DESC reply (xid=0x2):
 6(ovn-418009-0): addr:1e:ed:12:10:65:13
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 7(ovn-07e20a-0): addr:52:fd:4b:fb:01:7b
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 8(tap0bc5e22d-bd): addr:fe:16:3e:55:52:80             <<<< port8
     config:     0
     state:      0
     current:    10MB-FD COPPER
     speed: 10 Mbps now, 0 Mbps max
 9(patch-br-int-to): addr:06:58:63:01:95:4b
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 LOCAL(br-int): addr:16:1c:f5:2e:46:40
     config:     PORT_DOWN
     state:      LINK_DOWN
     speed: 0 Mbps now, 0 Mbps max
~~~	 

Step 2 : Start the trace on source compute node using in_port value as 8, specifying the source and destination MAC address.

~~~
[root@compute1 ~]# ovs-appctl ofproto/trace br-int 'in_port=8,dl_src=fa:16:3e:55:52:80,dl_dst=fa:16:3e:ef:50:3e'
Flow: in_port=8,vlan_tci=0x0000,dl_src=fa:16:3e:55:52:80,dl_dst=fa:16:3e:ef:50:3e,dl_type=0x0000

bridge("br-int")
----------------
 0. in_port=8, priority 100
    set_field:0x1->reg13
    set_field:0x7->reg11
    set_field:0x4->reg12
    set_field:0x5->metadata
    set_field:0x2->reg14
    resubmit(,16)
16. reg14=0x2,metadata=0x5,dl_src=fa:16:3e:55:52:80, priority 50, cookie 0x446fb031
    resubmit(,17)
17. metadata=0x5, priority 0, cookie 0x6f65cadf
    resubmit(,18)
18. metadata=0x5, priority 0, cookie 0xbc120a28
    resubmit(,19)
19. metadata=0x5, priority 0, cookie 0xe2858a64
    resubmit(,20)
20. metadata=0x5, priority 0, cookie 0xa498a2d8
    resubmit(,21)
21. metadata=0x5, priority 0, cookie 0xaed27663
    resubmit(,22)
22. metadata=0x5, priority 0, cookie 0x3d43b8c1
    resubmit(,23)
23. metadata=0x5, priority 0, cookie 0x8d414703
    resubmit(,24)
24. metadata=0x5, priority 0, cookie 0x141e41a7
    resubmit(,25)
25. metadata=0x5, priority 0, cookie 0x3dc1b849
    resubmit(,26)
26. metadata=0x5, priority 0, cookie 0x8e786a4e
    resubmit(,27)
27. metadata=0x5, priority 0, cookie 0xd702291a
    resubmit(,28)
28. metadata=0x5, priority 0, cookie 0x2eb48ab4
    resubmit(,29)
29. metadata=0x5,dl_dst=fa:16:3e:ef:50:3e, priority 50, cookie 0xf62ef55f
    set_field:0x3->reg15
    resubmit(,32)
32. reg15=0x3,metadata=0x5, priority 100
    load:0x5->NXM_NX_TUN_ID[0..23]
    set_field:0x3->tun_metadata0
    move:NXM_NX_REG14[0..14]->NXM_NX_TUN_METADATA0[16..30]
     -> NXM_NX_TUN_METADATA0[16..30] is now 0x2
    output:6
     -> output to kernel tunnel

Final flow: reg11=0x7,reg12=0x4,reg13=0x1,reg14=0x2,reg15=0x3,tun_id=0x5,metadata=0x5,in_port=8,vlan_tci=0x0000,dl_src=fa:16:3e:55:52:80,dl_dst=fa:16:3e:ef:50:3e,dl_type=0x0000
Megaflow: recirc_id=0,ct_state=-new-est-rel-rpl-inv-trk,ct_label=0/0x1,tun_id=0/0xffffff,tun_metadata0=NP,in_port=8,vlan_tci=0x0000/0x1000,dl_src=fa:16:3e:55:52:80,dl_dst=fa:16:3e:ef:50:3e,dl_type=0x0000
Datapath actions: set(tunnel(tun_id=0x5,dst=192.168.122.207,ttl=64,tp_dst=6081,geneve({class=0x102,type=0x80,len=4,0x20003}),flags(df|csum|key))),2
~~~

It's evident from the `Datapath actions`, packet is tunneled through the geneve tunnel to destination compute node with IP address `192.168.122.207`. 

~~~
set(tunnel(tun_id=0x5,dst=192.168.122.207,ttl=64,tp_dst=6081,geneve({class=0x102,type=0x80,len=4,0x20003}),flags(df|csum|key))),2
~~~

What's 1tp_dst=6081` this comes from the genev value on destination compute node. 

~~~~
[root@compute2 ~]# ip a show dev genev_sys_6081
6: genev_sys_6081: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 65470 qdisc noqueue master ovs-system state UNKNOWN qlen 1000
    link/ether ba:05:5b:b3:a3:92 brd ff:ff:ff:ff:ff:ff
    inet6 fe80::b805:5bff:feb3:a392/64 scope link
       valid_lft forever preferred_lft forever
~~~



#### compute2 (Node hosting destination instance)

Step 1 : In case of OVN based setup br-tun is not present as separate bridge, br-int is taking care of encapsulation and decapsulation. IP address of compute1 is `192.168.122.15`, from following output, we can see that port `ovn-080677-0` is used as tunnel endpoint on compute2.

~~~
[root@compute2 ~]# ovs-vsctl show
0fed4a0e-f49f-488c-8f33-b7a90b9cabd9
    Bridge br-ex
        fail_mode: standalone
        Port "patch-provnet-e411bbe8-e169-4268-b2bf-d5959d9d7260-to-br-int"
            Interface "patch-provnet-e411bbe8-e169-4268-b2bf-d5959d9d7260-to-br-int"
                type: patch
                options: {peer="patch-br-int-to-provnet-e411bbe8-e169-4268-b2bf-d5959d9d7260"}
        Port "ens3"
            Interface "ens3"
        Port br-ex
            Interface br-ex
                type: internal
    Bridge br-int
        fail_mode: secure
        Port "tap84645ee6-8e"
            Interface "tap84645ee6-8e"
        Port br-int
            Interface br-int
                type: internal
        Port "ovn-07e20a-0"
            Interface "ovn-07e20a-0"
                type: geneve
                options: {csum="true", key=flow, remote_ip="192.168.122.39"}
        Port "tapdf575f1c-92"
            Interface "tapdf575f1c-92"
        Port "patch-br-int-to-provnet-e411bbe8-e169-4268-b2bf-d5959d9d7260"
            Interface "patch-br-int-to-provnet-e411bbe8-e169-4268-b2bf-d5959d9d7260"
                type: patch
                options: {peer="patch-provnet-e411bbe8-e169-4268-b2bf-d5959d9d7260-to-br-int"}
        Port "ovn-080677-0"         
            Interface "ovn-080677-0"
                type: geneve
                options: {csum="true", key=flow, remote_ip="192.168.122.15"}
    ovs_version: "2.7.2"
~~~

Step 2 : Let's find the port number of this decapsulation endpoint on compute2 in br-int bridge. This port is attached to port 2 of br-int bridge. Also our destination instance is connected on port 7. 

~~~	   	   
[root@compute2 ~]# ovs-ofctl dump-ports-desc br-ex
OFPST_PORT_DESC reply (xid=0x2):
 1(ens3): addr:52:54:00:74:a5:b1
     config:     0
     state:      0
     current:    100MB-FD AUTO_NEG
     advertised: 10MB-HD 10MB-FD 100MB-HD 100MB-FD COPPER AUTO_NEG AUTO_PAUSE
     supported:  10MB-HD 10MB-FD 100MB-HD 100MB-FD COPPER AUTO_NEG
     speed: 100 Mbps now, 100 Mbps max
 3(patch-provnet-e): addr:f2:5e:6b:eb:a8:8b
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 LOCAL(br-ex): addr:52:54:00:74:a5:b1
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max

[root@compute2 ~]# ovs-ofctl dump-ports-desc br-int
OFPST_PORT_DESC reply (xid=0x2):
 2(ovn-080677-0): addr:7a:a3:da:49:a0:59
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 6(ovn-07e20a-0): addr:42:33:99:83:fa:16
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 7(tap84645ee6-8e): addr:fe:16:3e:ef:50:3e
     config:     0
     state:      0
     current:    10MB-FD COPPER
     speed: 10 Mbps now, 0 Mbps max
 8(patch-br-int-to): addr:5e:92:33:e2:41:36
     config:     0
     state:      0
     speed: 0 Mbps now, 0 Mbps max
 9(tapdf575f1c-92): addr:fe:16:3e:12:69:18
     config:     0
     state:      0
     current:    10MB-FD COPPER
     speed: 10 Mbps now, 0 Mbps max
 LOCAL(br-int): addr:f2:26:c3:c2:17:45
     config:     PORT_DOWN
     state:      LINK_DOWN
     speed: 0 Mbps now, 0 Mbps max	 	   
~~~

Step 2 : Checking the openflow rule on br-int, any in_port traffic on port2 will be redirected to table 33

~~~
[root@compute2 ~]# ovs-ofctl dump-flows br-int | grep in_port
 cookie=0x0, duration=520954.078s, table=0, n_packets=99505, n_bytes=9751490, idle_age=0, hard_age=65534, priority=100,in_port=2 actions=move:NXM_NX_TUN_ID[0..23]->OXM_OF_METADATA[0..23],move:NXM_NX_TUN_METADATA0[16..30]->NXM_NX_REG14[0..14],move:NXM_NX_TUN_METADATA0[0..15]->NXM_NX_REG15[0..15],resubmit(,33)
 cookie=0x0, duration=326970.620s, table=0, n_packets=3320, n_bytes=325360, idle_age=65534, hard_age=65534, priority=100,in_port=6 actions=move:NXM_NX_TUN_ID[0..23]->OXM_OF_METADATA[0..23],move:NXM_NX_TUN_METADATA0[16..30]->NXM_NX_REG14[0..14],move:NXM_NX_TUN_METADATA0[0..15]->NXM_NX_REG15[0..15],resubmit(,33)
 cookie=0x0, duration=49546.114s, table=0, n_packets=3209, n_bytes=309122, idle_age=0, priority=100,in_port=7 actions=load:0x1->NXM_NX_REG13[],load:0x7->NXM_NX_REG11[],load:0x4->NXM_NX_REG12[],load:0x5->OXM_OF_METADATA[],load:0x3->NXM_NX_REG14[],resubmit(,16)
 cookie=0x0, duration=48811.570s, table=0, n_packets=14, n_bytes=2060, idle_age=5598, priority=100,in_port=9 actions=load:0xb->NXM_NX_REG13[],load:0xa->NXM_NX_REG11[],load:0x9->NXM_NX_REG12[],load:0x1->OXM_OF_METADATA[],load:0x2->NXM_NX_REG14[],resubmit(,16)
 cookie=0x0, duration=49546.104s, table=0, n_packets=476, n_bytes=54048, idle_age=49, priority=100,in_port=8,vlan_tci=0x0000/0x1000 actions=load:0x8->NXM_NX_REG13[],load:0x2->NXM_NX_REG11[],load:0x5->NXM_NX_REG12[],load:0x6->OXM_OF_METADATA[],load:0x1->NXM_NX_REG14[],resubmit(,16)
 cookie=0x0, duration=49546.104s, table=0, n_packets=0, n_bytes=0, idle_age=49546, priority=100,in_port=8,dl_vlan=0 actions=strip_vlan,load:0x8->NXM_NX_REG13[],load:0x2->NXM_NX_REG11[],load:0x5->NXM_NX_REG12[],load:0x6->OXM_OF_METADATA[],load:0x1->NXM_NX_REG14[],resubmit(,16)
~~~

Finally from table 65 it will reach the port 7 on which our destination instance is connected. 
 
~~~ 
[root@compute2 ~]# ovs-ofctl dump-flows br-int | grep output:7
 cookie=0x0, duration=47193.887s, table=65, n_packets=772, n_bytes=74816, idle_age=0, priority=100,reg15=0x3,metadata=0x5 actions=output:7
~~~ 

Similarly for return traffic from compute2 instance to compute1 instance can be verified using following command: 

~~~
[root@compute2 ~]# ovs-appctl ofproto/trace br-int 'in_port=7,dl_src=fa:16:3e:ef:50:3e,dl_dst=fa:16:3e:55:52:80' | grep Datapath
Datapath actions: set(tunnel(tun_id=0x5,dst=192.168.122.15,ttl=64,tp_dst=6081,geneve({class=0x102,type=0x80,len=4,0x30002}),flags(df|csum|key))),4
~~~
