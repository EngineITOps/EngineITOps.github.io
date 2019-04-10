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


Comparison points is the total points a person earned.
Given ```a``` and```b``` , determine their respective comparison points.
For example, ```a=[1,2,3] ``` and ```b=[3,2,1]``` . For elements 0 , Bob is awarded a point because``` a[0] < b[0]``` . For the equal elements ```a[1]==b[1]``` and , no points are earned. Finally, for elements ```2``` ```a[3]>b[3]``` ,  so Alice receives a point. Your return array ```[1,1]``` would be  with Alice's score first and Bob's second.


# Function Description
Complete the function compareTriplets in the editor below. It must return an array of two integers, the first being Alice's score and the second being Bob's.<br>
compareTriplets has the following parameter(s):<br>
- a: an array of integers representing Alice's challenge rating<br>
- b: an array of integers representing Bob's challenge rating<br>

# Input Format
The first line contains ``` 3 ```space-separated integers,``` a[0] , a[1] , a[2]``` and , describing the respective values in triplet ```a``` . 
The second line contains ```3```  space-separated integers,``` b[0] , b[1] and b[2]```describing the respective values in triplet ``` b ```.

# Output Format
Return an array of two integers denoting the respective comparison points earned by Alice and Bob.

# Sample Input :
```
5 6 7
3 6 10
```

# Sample Output :
```
1 1
```

# Explanation :

In this example:
```

a={a[0],a[1],a[2]}= {5 , 6, 7}
b={b[0],b[1],b[2]}= {3 , 6 ,10}
```

Now, let's compare each individual score:<br>
```a[0] > b[0]``` , so Alice receives 1 point.<br>
```a[0] = b[0]```, so nobody receives a point.<br>
```a[0] < b[0]```, so Bob receives 1 point.<br>
Alice's comparison score is ```1``` , and Bob's comparison score is ```1 ```. Thus, we return the array ```[1,1]``` .
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
