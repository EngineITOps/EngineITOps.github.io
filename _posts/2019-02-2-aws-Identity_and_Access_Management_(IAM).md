---
layout: post
title: AWS - Identity and Access Management (IAM)
tags: [AWS]
categories: [ AWS ]

---

# Identity and Access Management (IAM)

# The key features of IAM:
<br>
● Shared Access to your Account <br>
● Granular Permissions<br>
● Secure Access to AWS Resources<br>
● Identity Federation<br>
● Identity Information for Assurance<br>
● Payment Card Industry (PCI) Data Security Standard (DSS) Compliance<br>
● Password Policy<br>
● Multi Factor Authentication (MFA)<br>

## Shared access to your AWS account
● Grant permission to users to access and use resources in your AWS account without sharing your password.<br>
## Granular Permissions
● Granular permissions allow different permissions to various users to manage their access to AWS, such as:<br>
• User access to specific services<br>
• Specific permissions for actions<br>
• Specific access to resources<br>
## Secure Access
● Securely allocate credentials that applications on EC2 instances require to access other AWS resources.<br>
## Identity Federation
● Allows users with external accounts to get temporary access to AWS resources<br>
## Identity Information
● Log, monitor, and track what users are doing with your AWS resources.<br>
## PCI DSS Compliance
● Payment Card Industry (PCI) and Data Security Standard (DSS) compliant<br>
## Multi-Factor Authentication
● Two-Factor Authorization for users and resources to ensure absolute security using MFA devices<br>
## Password Policy
● IAM allows you to define password strength and rotation policies.<br>

## IAM Policies
● A document that defines one or more permissions<br>
● Attached to users, groups, and roles<br>
● Written in JavaScript Object Notation (JSON)<br>
● Selected from a pre-defined AWS list of policies, or you can create your own policy<br>
  
 ## AWS Policies
● AWS has many predefined policies which allow you to define granular access to AWS resources.<br>
● There are around 200 predefined policies available for you to choose from.<br>
## AdministratorAccess Policy
● AdministratorAccess policy provides full access to AWS services and resources.<br>
## AmazonEC2FullAccess Policy
● AmazonEC2FullAccess policy provides AWS Directory Service user or groups full access to the Amazon EC2 services and resources<br>
## AmazonS3ReadOnlyAccess Policy
● AmazonS3ReadOnlyAccess policy provides read-only access to all buckets using the AWS Management Console<br>
## JSON
● AWS policies are written using JavaScript Object Notation (JSON).<br>
 
 ```
{
  "Version": "2012-10-17",
  "Statement": {
    "Effect": "Allow",
    "Action": "s3:listbucket",
    "Resource": "arn:aws:s3:::example_s3_bucket"
  }
}
 ```
Policy-wide information:<br>
Version–Date this policy was created<br>

One or more individual statements:<br>
Effect–Allow permission<br>
Action– 3 list bucket <br>
Resource–Name of the S3 bucket<br>

 ## IAM Users
 Users are defined as the people or systems that use your AWS resources. <br>
 
 ## Security Credentials
 AWS provides numerous ways to provide secure user access to your AWS resources: <br>
 
 Key pairs: <br>
• They consist of a public and private key <br>
• A private key is used to create a digital signature <br>
• AWS uses the corresponding public key to validate the signature <br>

Email address and password <br>
• They are created when you sign up to use AWS <br>
• They are used to sign in to AWS web pages <br>

IAM user name and password <br>
• They allow multiple individuals or applications access to your AWS account <br>
• Individuals use their user names and passwords to sign in <br>

 Multi-Factor Authentication (MFA) <br>
• With AWS MFA enabled, users are prompted for a user name and password and for an authentication code from an MFA device <br>
 
 Access keys <br>
• They consist of an access key and a secret access key <br>
• They use access keys to sign programmatic requests <br>

 ## IAM Groups
 ● AWS defines a group as a collection of users that inherit the same set of permissions. <br>
 
 ## IAM Roles
 
IAM Roles are: <br>
• Very similar to users <br>
• Not password protected and do not require access keys <br>
• AWS identities with permission policies that determine the access available to the identities <br>
• Assumed by anyone who requires them <br>

## Create Individual IAM Users <br>
• The benefits of creating individual IAM users: <br>
• Control permissions at an individual level <br>
• No shared accounts <br>
• Unique credentials for everyone <br>
• Easier to rotate credentials <br>
• Easier to identify security breaches <br>

## Grant Least Privilege
 When creating IAM policies, granting ”least privilege,” means that: <br>
• You only grant required permissions <br>
• It's more secure to start with minimum permissions <br>
• It’s easier to grant permissions than revoke them <br>
• You protect your assets <br>
 
 ## Manage Permissions with Groups
 Use permissions with groups to minimize the workload  <br>
 Easy to assign new permissions <br>
• It is easier to assign a new permission to a group than to assign it to many individual users. <br>
  Simple to reassign permissions  <br>
• It is simpler to reassign permissions if a user has a change in responsibilities. <br>

## Restrict Access with Further Conditions
• Use additional conditions such as MFA and Security Groups to ensure only the intended users get access. <br>
  
 ## Monitor Activity in your AWS Account 
  AWS has several features to log user actions.  <br>
• Logs <br>
• AWS Cloudtrail <br>

## Create a Strong Password Policy
• Ensure that all your users have strong passwords and they rotate their passwords regularly. <br>
 
## Use Roles for Applications that run on EC2
• IAM Roles remove the need for your developers to store or pass credentials to AWS EC2. <br>
 
 ## Reduce or Remove Unnecessary Credentials
• To reduce the potential for misuse, run a credential report to identify users that are no longer in use and can be removed. <br>

# AWS Security Token Service (STS)
• It is a web service that enables you to request temporary, limited-privilege credentials for AWS Identity and Access Management users that you authenticate.
 <br>
## STS: Things To Remember
• Develop an Identity Broker to communicate with LDAP and AWS STS <br>
• Identity Broker always authenticates with LDAP first and then AWS STS <br>
• Application gets temporary access to AWS resources <br>


 
