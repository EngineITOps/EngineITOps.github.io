---
layout: post
title: Vim Basics for Newbies
tags: [ linux, vim ]
categories: [ gnu-linux ]
---
Vim(_Vi IMporved_) editor is the command-line editor comes pre-installed with most of the Linux OSs and MacOS. It's a free, open-source text-editor which is highly customizable and powerful. 

Despite being one of the most powerful editors, the user needs some basic knowledge to use it properly. It's not like a general GUI text editor where you can simply click something and the job is done. Vim is truly a command-line editor and can be run using different vim commands. However, There's a vim GUI known as `gvim`. 

## Working with Vim

### Open Vim

To open Vim, open your terminal and run `vim` command to open vim editor.

```sh
$ vim
```
If the above command is giving you some errors back, for example, `bash: vim: command not found`, you need to install it. 

For Arch Linux and OS built on-top of Arch(Manjaro Linux etc)

```sh
$ sudo pacman -S vim
```
For Debian, Ubuntu, Mint Linux etc

```sh
$ sudo apt install vim
```

For RedHat Linux 

```sh
$ sudo yum install vim
```

### Strat editing a document

To start editing an existing document or writing a new one; inside vim, press `i`. This will change the editor to _insert mode_.

### Saving changes

Once you are done editing the file, press `Esc` for going back to _command mode_. Then press colon(`:`) followed by w(`w`). Then hit enter. Your file is saved. You can safely close the editor. If you opened vim with a blank document, you need to give a file name with proper extension.

```sh
# if file exists
:w

# If a blank file
:w file_name.txt
```

### Quitting Vim

Now, this is where most of the _first-time_ users failed! To close Vim, press `Esc` to go to _command mode_. Now press q(`q`). The editor will be closed.

```sh
:q
```

### Search

To search anything in the current document, change editor mode to command and type `/` followed by the word or text you are searching for. To highlight ALL matching texts, you have to set `hlsearch`. To do so, simply run the command `:set hlsearch`. To clear previous search highlights, run `:noh`.

```sh
# Search for something 
/search-query

# Case insensitive search 
/search-query\c

# Case sensitive search 
/search-query\C

# set hlsearch for highlighting all matchings
:set hlsearch

# disable hlsearch
:set nohlsearch

# Clear previous search highlight
:noh
```

### Find and Replace 

There are few variants for Find and Replace in Vim

- `:s/search-term/substitute-term` - This will substitute the first occurrence of _search-term_ with _substitute-term_ of the current line.

- `:s/search-term/substitute-term/g` - This will substitute all occurrence of _search-term_ with _substitute-term_.

- `:s//substitute-term/g` - This will substitute all occurrence of the previous search term with _substitute-term_.

where, `s` stands for `substitute`, `g` targets global occurrence.

For starting with Vim, these commands are more than enough for any beginner. If you are facing any difficulties with Vim, let me know via comment section. 

Good luck :)