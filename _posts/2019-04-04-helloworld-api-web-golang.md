---
layout: post
title: saying Hello, World via API - GO Server Language
tags: [GO]
categories: [ GO Server Language. ]
---



# saying Hello, World via API



```
package main
import (
     "net/http"
     "encoding/json"
     "fmt"
)
type API struct {
    Message string "json:message"
}
func main() {
    http.HandleFunc("/api", func(w http.ResponseWriter, 
        r *http.Request) {
      message := API{"Hello, world!"}
      output, err := json.Marshal(message)
      if err != nil {
        fmt.Println("Something went wrong!")
}
      fmt.Fprintf(w, string(output))
    })
    http.ListenAndServe(":8080", nil)
  }
```


```
http://localhost:8080/api
{"Message":"Hello, world!"}
```
