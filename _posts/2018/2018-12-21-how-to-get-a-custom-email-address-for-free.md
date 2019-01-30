---
layout: post
title: How to Get a Custom Email Address for Free
tags: [ miscellaneous ]
categories: [ miscellaneous ]
---

A Few days ago, getting a custom email address for free was like something special for me. I mean, it helps in lots of ways. Building your online presence, for instance. Well, getting one for free was a tough task until I figured out how to get one :) 

<p class="message">This article assumes that you have basic knowledge about configuring DNS for a domain.</p>

It's easy and straight-forward process. You can easily get an email like `mail@abdusdev.me` using Zoho Mail. All you need is a custom domain. You can buy it from Namecheap or GoDaddy etc or get [one for free](#). 

## Signup for Zoho Mail

Sign-up for Zoho Mail using [this link](https://workplace.zoho.com/orgsignup.do). You would be signing up for a free email hosting plan with `5 User / 5 GB per User / 25 MB attachment limit` which, I think, is enough for the start. You can sign-up for paid plans too. Here is Zoho's [pricing list](https://www.zoho.com/workplace/pricing.html). Next, finish-up the sign-up process. 

## Configure DNS

### Host Records

Zoho allows you to verify domain ownership in three ways(_as of 21 Dec 2018_). They are: **HTML**(where you've to upload a file to your domain root), **TXT record**(DNS record type) and **CNAME**(another DNS record type). You can go for any method of your choice. All should work fine [depending upon your domain](https://superuser.com/questions/264913/cant-set-example-com-as-a-cname-record).

<p class="message">You <strong>should not</strong> use CNAME records on naked(apex) domain(for example, <em>example.com</em>. It's against the <a href="https://tools.ietf.org/html/rfc1034#section-3.6.2">fundamental rules</a> set by <a href="https://www.ietf.org/">IETF</a>. This also overrides <strong>M</strong>ail e<strong>X</strong>change(MX) records which are responsible for mail transfer between server and users.</p>

Once you configured host records, wait for sometime to get verified. Note that, you have to click Verification Button on Zoho. It doesn't verify automatically.

### MX Records

Mail Exchange records _aka_ MX records are responsible for sending and receiving emails. There are three MX records available for Zoho mail. They are: `mx.zoho.com` with priority 10, `mx2.zoho.com` with priority 20, `mx3.zoho.com` with priority 50. Set them up accordingly in your domain. There's a step-by-step guide on how to do this right in your admin panel.

### SPF

SPF stands for **Sender Policy Request**, which is basically a TXT record. Check out your Zoho admin panel for your domain's SPF record and set it up accordingly for your domain.

<p class="message">
    An SPF record is a Sender Policy Framework record and is used to indicate to mail exchanges which hosts are authorized to send mail for a domain. It is defined in <a href="https://www.ietf.org/rfc/rfc4408.txt">RFC 4408</a> and clarified by <a href="https://www.ietf.org/rfc/rfc7208.txt">RFC 7208</a> - <a href="https://support.dnsimple.com/articles/spf-record/">DNS Simple</a>.
</p>

### DKIM

DKIM looks something like this: `selector1._domainkey.example.com` and has a value corresponding to this. This piece of information is used by email services to determine if an email is spam or legit. Again, this is also a TXT record and can be found in your Zoho Admin Panel.


Once you are done configuring your DNS with appropriate data, you'll be allowed to create your email address under your domail name. You can login to your email account by following this link: [https://mail.zoho.com](https://mail.zoho.com)