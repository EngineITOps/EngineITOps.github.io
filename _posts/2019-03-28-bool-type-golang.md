---
layout: post
title: 26.bool Type - Programming in GO
tags: [GO]
categories: [ GO ]
---

  
Let's try creating our bool type in the [Go playground](https://play.golang.org/p/WZ3BQ0F3mao).
``` 
package main

import (
	"fmt"
)

var x bool 

func main() {
	fmt.Println(x)
}
```
above little go program gives you output as ```false``` because ```var x bool``` has no value 

what if we define value to x as True ```	x = true ``` lets try [Go playground](https://play.golang.org/p/JM_L7rEOM5V).

```
package main

import (
	"fmt"
)

var x bool

func main() {
	fmt.Println(x)
	x = true
	fmt.Println(x)
}

```
