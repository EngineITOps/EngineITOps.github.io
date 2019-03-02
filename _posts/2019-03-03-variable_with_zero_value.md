---
layout: post
title: 7. variable with zero value - programming in go
tags: [GO,variable]
categories: [ GO ]
---

# variable with zero value 
7. variable with zero value - programming in go


```
package main

import "fmt"

func main() {

	var a int
	var b string
	var c float64
	var d bool

	fmt.Printf("%v \n", a)
	fmt.Printf("%v \n", b)
	fmt.Printf("%v \n", c)
	fmt.Printf("%v \n", d)

	fmt.Println()
}
```

in this above program declared variable with its type and print values so it will give zero values and for bool it will return 
false 
