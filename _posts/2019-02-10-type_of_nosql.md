---
layout: post
title: 3.Types of Nosql 
tags: [MOGODB]
categories: [ MOGODB DEVELOPER ]
---

# Types of NoSQL
The types of NoSQL databases are:
# 1.Key-Value Database
 Key-value stores are the simplest NoSQL databases that:<br>
● Store every single item in the database as an attribute name (key) together with its value.<br>
● Are ideal for handling Web scale operations that need to scale across thousands of servers and millions of users with extremely quick and optimized retrieval.<br>

note:Data loss may occur in Memcached when implementing caching of user performances. The same data stored in Riak, may not be lost, but may need update.

Following are the advantages and disadvantages of the Key-Value database.<br>
● advantages<br>
• Can perform queries<br>
• Supports schemas<br>
• Data can be accessed using a key<br>
● disadvantages<br>
• Does not provide any traditional database capabilities<br>
• Maintaining unique keys are difficult as the volume of data increases<br>

# 2.Document Database<br>
Based on the concept of documents, the Document database:<br>
● Stores and retrieves various documents in JavaScript Object Notation (JSON ), Extensible Markup Language (XML), BSON<br>
● Consists of maps, structures, and scalar values<br>
● Store documents in the value part of the key-value store<br>

Examples of Document databases are:<br>

● MongoDB: Provides a rich query language and many useful features such as built-in support for MapReduce-style aggregation and geospatial indexes.<br>
● Apache CouchDB: Uses JSON for documents, JavaScript for MapReduce indexes, and regular HTTP for its API.<br>
Example: <br>

      (MongoDB) document {Name:“engineITops",
    Address:"Pune”, Courses: [“Big Data”,”Python”,”Android”,”PMP”,”ITIL”],
    Offices: [”PUNE”,”IND”],
     }
     
# Column-Based Database<br>
Column-based databases store data in column families as rows. These rows contain multiple columns associated with a row key.<br>
In a Column-Based database:<br>
● The key identifies the rows.<br>
● The various rows need not have the same columns.    <br>

You can add a column to a row at any time without adding it to other rows<br>

A Column-Based database reads and writes data to and from hard disk storage to quickly return a query. It lets you access individual data elements as a group in columns rather than access individually row-by-row.<br>

# Column-Based Database Example<br>
 Cassandra is a column-based database. The features include:<br>
● Fast and easily scalable<br>
● Write operations spread across the cluster<br>
● Any node can handle the read and write operations<br>

# Graph Database
 A Graph database makes relationships readily available for any join-like execution allowing quick access of millions of connections. It lets you store data and its relationships with other data in the form of nodes and edges.<br>
 
![](/blog/img/mogo1.png)
 
 
 ● Examples of Graph database are—Neo4J, InfiniteGraph, OrientDB, and FlockDB.<br>
● Neo4J is ACID compliant.<br>
● FlockDB was created by Twitter for relationship related analytics.<br>


![](/blog/img/mogo2.png)


# CAP Theorem<br>
In a distributed system, the following three properties are important.<br>

![](/blog/img/mogo3.png)

The CAP theorem states that in any distributed system only two of the three properties can be used simultaneously—consistency, availability, or partition tolerance. To adjust the database, understanding the following requirements is essential:<br>
● How the data is consumed by the system<br>
● Whether the data is read or write heavy<br>
● If there is a need to query data with random parameters<br>
● If the system is capable of handling inconsistent data<br>


## Consistency
Below are the definitions of consistency in CAP theorem and ACID.<br>

CAP Theorem:<br>
Consistency in CAP theorem means consistent read and write operations for the same sets of data so that concurrent operations see the same valid and consistent data state.<br>

## ACID
Consistency in ACID means if the data does not satisfy predefined constraints, it is not persisted.<br>

## Availability<br>
Availability means:<br>
● The database system is available to operate when required.<br>
● If a system is not available to serve a request when needed, it is not available.<br>

## Partition Tolerance
Partition tolerance or fault-tolerance is the third element of the CAP theorem. It measures the ability of a system to continue its service when some of its clusters become unavailable.<br>

## MongoDB As per CAP
 Partition tolerance or fault-tolerance is the third element of the CAP theorem. It measures the ability of a system to continue its service when some of its clusters become unavailable.<br>
 
 
