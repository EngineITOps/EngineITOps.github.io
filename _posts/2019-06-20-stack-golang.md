---
layout: post
title: Stack  - Programming in GO
tags: [GO]
categories: [GO - data structures and algorithms]
---


-[Stack](https://en.wikibooks.org/wiki/Data_Structures/Stacks_and_Queues)


```
type item struct {
	value interface{} //value as interface type to hold any data type
	next  *item
}
```
create struct item with two fields values and next with corresponding type of `interface{}` and item 
next is point to struct item.

```
type Stack struct {
	top  *item
	size int
}
```
same like above created stack struct with field top and size.

for finding len create method call `len()` with return time stack.size 


```
func (stack *Stack) Len() int {
	return stack.size
}
```

```
func (stack *Stack) Push(value interface{}) {
	stack.top = &item{
		value: value,
		next:  stack.top,
	}
	stack.size++
}
```
create method call push with parameter value of type `interface{}` 
and `stack.top = &item` finding stack top address to item.
define ' value: value' and `next:  stack.top,` and after push increment stack.size ++ 


```
  
func (stack *Stack) Pop() (value interface{}) {
	if stack.Len() > 0 {
		value = stack.top.value
		stack.top = stack.top.next
		stack.size--
		return
	}
  ```
  same like above write method pop()
  
  
  define main func()
  
  ```
  func main() {
	stack := new(Stack)
	// Push different data type to the stack
	stack.Push(1)
	stack.Push("Welcome")
	stack.Push(4.0)
 
	// Pop until stack is empty
	for stack.Len() > 0 {
		fmt.Println(stack.Pop())
	}
}
```  
 
-[Go PlayGround](https://play.golang.org/p/0m8oWTaofrL)
```
package main
 
import (
	"fmt"
)
 
type item struct {
	value interface{} //value as interface type to hold any data type
	next  *item
}
 
type Stack struct {
	top  *item
	size int
}
 
func (stack *Stack) Len() int {
	return stack.size
}
 
func (stack *Stack) Push(value interface{}) {
	stack.top = &item{
		value: value,
		next:  stack.top,
	}
	stack.size++
}
 
func (stack *Stack) Pop() (value interface{}) {
	if stack.Len() > 0 {
		value = stack.top.value
		stack.top = stack.top.next
		stack.size--
		return
	}
 
	return nil
}
 
func main() {
	stack := new(Stack)
	// Push different data type to the stack
	stack.Push(1)
	stack.Push("Welcome")
	stack.Push(4.0)
 
	// Pop until stack is empty
	for stack.Len() > 0 {
		fmt.Println(stack.Pop())
	}
}
```
