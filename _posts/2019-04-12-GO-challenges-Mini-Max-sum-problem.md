---
layout: post
title: GO challenges - Mini-Max sum problem
tags: [GO, challenges]
categories: [ GO challenges ]
---
# Problem
[HackerRank](https://www.hackerrank.com/challenges/mini-max-sum/problem)

Given five positive integers, find the minimum and maximum values that can be calculated by summing exactly four of the five integers. Then print the respective minimum and maximum values as a single line of two space-separated long integers.
For example,arr[1,3,5,7,9] . Our minimum sum is 1 + 3 + 5 + 7 = 16 and our maximum sum is 3 + 5 + 7 + 9 = 24 . We would print

```
16 24
```
# Function Description
Complete the miniMaxSum function in the editor below. It should print two space-separated integers on one line: the minimum sum and the maximum sum of 4 of  5 elements.
miniMaxSum has the following parameter(s):
arr: an array of 5 integers

# Input Format
A single line of five space-separated integers.

# Output Format
Print two space-separated long integers denoting the respective minimum and maximum values that can be calculated by summing exactly four of the five integers. (The output can be greater than a 32 bit integer.)

# Sample Input
```
1 2 3 4 5
```
# Sample Output
```
10 14
```
# Explanation

Our initial numbers are 1,2,3,4 , and 5 . We can calculate the following sums using four of the five integers:<br>
If we sum everything except 1, our sum is 2 + 3 + 4 + 5 = 14.<br>
If we sum everything except 2, our sum is 1 + 3 + 4 + 5 = 13.<br>
If we sum everything except 3, our sum is 1 + 2 + 4 + 5 = 12.<br>
If we sum everything except 4, our sum is 1 + 2 + 3 + 5 = 11.<br>
If we sum everything except 5, our sum is 1 + 2 + 3 + 4 = 10.<br>
Hints: Beware of integer overflow! Use 64-bit Integer.
     
# Solution 
```
package main

import (
    "fmt"
    "io"
    "os"
    "sort"
)

var stdin io.Reader = os.Stdin
var stdout io.Writer = os.Stdout
var stderr io.Writer = os.Stderr

func main() {
    a := make([]int, 5)
    sum := 0
    for i := range a {
        fmt.Fscanf(stdin, "%d", &a[i])
        sum += a[i]
    }
    sort.Ints(a)
    fmt.Fprintln(stdout, sum-a[len(a)-1], sum-a[0])
}


```
