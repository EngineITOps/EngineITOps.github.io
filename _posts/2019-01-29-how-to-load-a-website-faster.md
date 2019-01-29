---
layout: post
title: How to Load a Website Faster
tags: [load-time, website]
categories: [ front-end ]
---

Page Load-time is an important factor for any kind of websites. The lower the load-time, higher the site traffic and low [bounce rate](https://en.wikipedia.org/wiki/Bounce_rate). 

If you don't know what a page load time is, it's the time taken by a browser to render a webpage. This process includes: making a request to the server, downloading the resources, processing DOM elements and rendering.

To decrease a website's page load time, you have to follow certain things while building/creating a website.

## Place scripts just before the closing body tag

No matter what a script does, it should always be placed at end of <body>. i.e. the closing </body> tag. Scripts are generally huge in size and costs browser some extra time to load it. Moreover, you don't want to execute any scripts before the DOM even loads, right?

## Minify

Yes, minify stylesheets and scripts. _minify_ is a process of removing whitespace and unwanted characters from your code. It will help you reduce the size of files so that browser could download it faster.

## Don't use too many redirects

Whenever we redirect a link, it takes an extra request to the server. For example, if you are loading some resources from _example.com_ which redirects to _example-2.com_. You are forcing the client(browser) to make an extra request. So, minimize the use of redirected links.

## Use CDN

__CDN__ or Content Delivery Network help you reduce the server load and serve pages based on user's location. For example, if you are somewhere in the US and using a CDN, the website would be served from the nearest server available and not from the original server. This method helps you cut-down the distance travelled by resources.

## Code Splitting

This might look something new to you. This helps you load only the code you require to render the very first instance of any website. So, if you have a big CSS file which contains many selectors which don't need during initial render, eliminate them or create a new CSS file and load them on a later stage.

## _async_ and _defer_ for scripts

if you have some scripts which you don't need immediately, just `defer` them. `async` and `defer` tells the browser to load these scripts on a later stage. Example, 

```html
<script async src="example.com"></script>
<script defer src="example.com"></script>
```