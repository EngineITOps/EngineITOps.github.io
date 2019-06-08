---
layout: post
title: 35.Methods  - Programming in GO
tags: [GO]
categories: [ GO ]
---

# What is Methods?

A method is a function with a receiver. A method declaration binds an identifier, 
the method name, to a method, and associates the method with the receiver's base type.

```
func (t Type) methodName(parameter list) {  
}
```

The above snippet creates a method named `methodName` which has `receiver` type Type.

Let's write a simple program which creates a method on a struct type and calls it.

```
package main

import (
	"fmt"
)

type student struct {
	name     string
	collage_name   string
	course  string
}

/*
 displayname() method has student as the receiver type
*/
func (s student) displayname() {
	fmt.Printf(" student details of %s \n is %s \n %s", s.name, s.collage_name, s.course)
}

func main() {
	stud1 := student{
		name:     "Sangam biradar",
		collage_name:  "alliance University Bengalore" ,
		course: "btech",
	}
	stud1.displayname() //Calling displayname() method of student type
}
```

try on -[Go PlayGround](https://play.golang.org/p/myRvCjqX_td)


