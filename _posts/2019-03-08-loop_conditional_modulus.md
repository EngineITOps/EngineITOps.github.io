---
layout: post
title: 20.Loop, Conditional, Modulus - Programming in GO
tags: [GO, LOOP]
categories: [ GO ]
---
#  Loop, Conditional, Modulus

Use the modulo operator `%`  and a `for` loop and `if` statement to print out all the even numbers from 1 to 100

```go
package main

import (
	"fmt"
)

func main() {
	for i := 1; i <= 100; i++ {
		if i%2 == 0 { // try changing the number to 3, 4, etc.
			fmt.Println(i)
		}
	}
}
```

[playground](https://play.golang.org/p/mhwuHNMCEF)