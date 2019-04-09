---
layout: post
title: GO challenges - compare the triplets problem
tags: [GO, challenges]
categories: [ GO challenges ]
---
# Problem
[HackerRank](https://www.hackerrank.com/challenges/compare-the-triplets/problem)




Alice and Bob each created one problem for HackerRank. A reviewer rates the two challenges, awarding points on a scale from ``` 1 ```to ```100``` for three categories: problem clarity, originality, and difficulty.
We define the rating for Alice's challenge to be the triplet ```a={a[0],a[1],a[2]}``` , and the rating for Bob's challenge to be the triplet ```b={b[0],b[1],b[2]}``` .
Your task is to find their comparison points by comparing  ```a[0]``` with ```b[0]``` , ```a[1] ```with ```b[1]``` , and ```a[2]``` with ```b[2]``` .
If ,``` a[i] > b[i]``` then Alice is awarded``` 1``` point.
If , ``` a[i] < b[i]```then Bob is awarded  point.
If ,```a[i] = b[i]``` then neither person receives a point.


editing..................



coming sooon ..........



# Solution 
```
package main
import "fmt"

func main(){
    var a [3]int
    var b [3]int
    fmt.Scan(&a[0],&a[1],&a[2])
    fmt.Scan(&b[0],&b[1],&b[2])
    var alice,bob int
    for i:=0;i<3;i++{
        
        if a[i] > b[i] {
            alice++
        }else if b[i] > a[i] {
            bob++
        }
    }
    fmt.Println(alice,bob)
}

```
