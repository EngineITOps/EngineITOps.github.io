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

Following are the advantages and disadvantages of the Key-Value database.
● advantages
• Can perform queries
• Supports schemas
• Data can be accessed using a key
● disadvantages
• Does not provide any traditional database capabilities
• Maintaining unique keys are difficult as the volume of data increases

# 2.Document Database
Based on the concept of documents, the Document database:
● Stores and retrieves various documents in JavaScript Object Notation (JSON ), Extensible Markup Language (XML), BSON
● Consists of maps, structures, and scalar values
● Store documents in the value part of the key-value store

Examples of Document databases are:

● MongoDB: Provides a rich query language and many useful features such as built-in support for MapReduce-style aggregation and geospatial indexes.
● Apache CouchDB: Uses JSON for documents, JavaScript for MapReduce indexes, and regular HTTP for its API.
Example: 

      (MongoDB) document {Name:“engineITops",
    Address:"Pune”, Courses: [“Big Data”,”Python”,”Android”,”PMP”,”ITIL”],
    Offices: [”PUNE”,”IND”],
     }
     
# Column-Based Database
Column-based databases store data in column families as rows. These rows contain multiple columns associated with a row key.
In a Column-Based database:
● The key identifies the rows.
● The various rows need not have the same columns.    

You can add a column to a row at any time without adding it to other rows

A Column-Based database reads and writes data to and from hard disk storage to quickly return a query. It lets you access individual data elements as a group in columns rather than access individually row-by-row.

# Column-Based Database Example
 Cassandra is a column-based database. The features include:
● Fast and easily scalable
● Write operations spread across the cluster
● Any node can handle the read and write operations

# Graph Database
 A Graph database makes relationships readily available for any join-like execution allowing quick access of millions of connections. It lets you store data and its relationships with other data in the form of nodes and edges.
 
 
 img ..........
 
 
 ● Examples of Graph database are—Neo4J, InfiniteGraph, OrientDB, and FlockDB.
● Neo4J is ACID compliant.
● FlockDB was created by Twitter for relationship related analytics.


img.......



# CAP Theorem
In a distributed system, the following three properties are important.

img.......


The CAP theorem states that in any distributed system only two of the three properties can be used simultaneously—consistency, availability, or partition tolerance. To adjust the database, understanding the following requirements is essential:
● How the data is consumed by the system
● Whether the data is read or write heavy
● If there is a need to query data with random parameters
● If the system is capable of handling inconsistent data


## Consistency
Below are the definitions of consistency in CAP theorem and ACID.

CAP Theorem:
Consistency in CAP theorem means consistent read and write operations for the same sets of data so that concurrent operations see the same valid and consistent data state.

## ACID
Consistency in ACID means if the data does not satisfy predefined constraints, it is not persisted.





coming soon...
