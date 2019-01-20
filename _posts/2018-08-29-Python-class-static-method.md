---
layout: post
title: Understand the usage of python classmethods
tags: [python]
category: [python]
author: vikrant
comments: true
---

While trying to understand the difference between staticmethod and classmethod I landed on this [blog post](https://julien.danjou.info/guide-python-static-class-abstract-methods/). I was bit confused after reading the comment "classmethod can be helpful in case of inheritence instead of having one staticmethod calling another staticmethod".

I used the same example in blog post to extend it bit to understand the practical implementation.

I am overriding the compute_area staticmethod function in inherited class this function was called by another staticmethod compute_volume. NOTE: I need to call `compute_area` from `compute_volume` using `Pizza.compute_area(radius)` where `Pizza` is the class name, you can't use `self` instead of `Pizza`.

~~~
import math
class Pizza():
    
    def __init__(self, radius, height):
        self.radius = radius
        self.height = height
    
    @staticmethod
    def compute_area(radius):
        return math.pi * (radius ** 2)
    
    @staticmethod
    def compute_volume(height, radius):
        return height * Pizza.compute_area(radius)
    
    def get_volume(self):
        return self.compute_volume(self.height, self.radius)

class Italian(Pizza):
    @staticmethod
    def compute_area(radius):
        print("In inherited")
        return math.pi * (radius ** 2)
    
instance1=Pizza(4,5)    
print(instance1.get_volume())
instance2=Italian(5,6)
print(instance2.get_volume())
~~~

Result of run are:

~~~
251.327412287
471.238898038
~~~

It ran fine but it didn't run the overrided `compute_area` method which I defined in `Italian` class instead used `compute_area` from parent class. It happened because we are calling `compute_area` using `Pizza` classname in `compute_volume` method. 

Let's use `classmethod` now instead of `staticmethod` to define compute_volume method in parent class. 

~~~
import math
class Pizza():
    
    def __init__(self, radius, height):
        self.radius = radius
        self.height = height
    
    @staticmethod
    def compute_area(radius):
        return math.pi * (radius ** 2)
    
    #@staticmethod
    #def compute_volume(height, radius):
    #    return height * Pizza.compute_area(radius)
    
    @classmethod
    def compute_volume(cls, height, radius):
        return height * cls.compute_area(radius)
    
    def get_volume(self):
        return self.compute_volume(self.height, self.radius)

class Italian(Pizza):
    @staticmethod
    def compute_area(radius):
        print("In inherited")
        return math.pi * (radius ** 2)
    
instance1=Pizza(4,5)    
print(instance1.get_volume())
instance2=Italian(5,6)
print(instance2.get_volume())
~~~

Results of run are:

~~~
251.327412287
In inherited
471.238898038
~~~

This gives us expected results because classname was dynamically was replaced with `Italian` in-place of `cls` while calling `staticmethod` from `classmethod`. 
