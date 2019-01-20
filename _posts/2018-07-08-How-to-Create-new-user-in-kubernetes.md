---
layout: post
title: How to create new user in kubernetes
tags: [kubernetes, user, certificate]
category: Kubernetes
author: vikrant
comments: true
---

In minikube openssl command is not available by default and it's not possible to install the package using package manager then how can we generate the SSL certificate for user communication. By default minikube user is using the certificats.

- Two users (admin-cluster.local and minikube) are present by default when you spin-up the minikube VM.

~~~
$ kubectl config view
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: REDACTED
    server: https://172.17.1.101:6443
  name: cluster.local
- cluster:
    certificate-authority: /Users/viaggarw/.minikube/ca.crt
    server: https://192.168.99.100:8443
  name: minikube
contexts:
- context:
    cluster: cluster.local
    user: admin-cluster.local
  name: admin-cluster.local
- context:
    cluster: minikube
    user: minikube
  name: minikube
- context:
    cluster: cluster.local
    user: vikrant
  name: vikrant
current-context: vikrant
kind: Config
preferences: {}
users:
- name: admin-cluster.local
  user:
    client-certificate-data: REDACTED
    client-key-data: REDACTED
- name: minikube
  user:
    client-certificate: /Users/viaggarw/.minikube/client.crt
    client-key: /Users/viaggarw/.minikube/client.key
~~~    

Easy to way find the list of users present. `*` indicates the current user.

~~~
$ kubectl config get-contexts
CURRENT   NAME                  CLUSTER         AUTHINFO              NAMESPACE
          admin-cluster.local   cluster.local   admin-cluster.local
*         minikube              minikube        minikube
~~~

- And we can see the certificate related information in.

~~~
$ cat ~/.kube/config
apiVersion: v1
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUM5ekNDQWQrZ0F3SUJBZ0lKQUpjeUtqRnU0dHNvTUEwR0NTcUdTSWIzRFFFQkN3VUFNQkl4RURBT0JnTlYKQkFNTUIydDFZbVV0WTJFd0hoY05NVGd3TXpBeU1EZzFNVE14V2hjTk5EVXdOekU0TURnMU1UTXhXakFTTVJBdwpEZ1lEVlFRRERBZHJkV0psTFdOaE1JSUJJakFOQmdrcWhraUc5dzBCQVFFRkFBT0NBUThBTUlJQkNnS0NBUUVBCjc5U3BORSt6QTdJdGoydUFwQ0psOGFMa1JBS3dKK0huL0dpSU1ZMnpYb2VYL0srazNHZVpaaXRVRllkU3g1Q3cKQjZhV0VyOGN2U1dwZE9acWl1T2pUMlRRZ1VCRFUzNS9teTBsY0pRRWY3MHhiV2tKYzVJTWJyQXEwLzVuVGpSbgpDV3UyVStHTDQyYjRvd0lvS3JHalZ1dzFqRzFERWorelR4aDdwTDFlWFl1cHdtUWxyei9xd3J3K2ROcTBUS2xlCnVRR2M2WlFTOHArMm1weFkxZUFnTVNxSHJMSFdEc1paNkdnY1Q5cWE4RVBqTVhtUTBaOFl4YUZVbVp5NXFUVVIKSnhrZkREQU84YlVlcGxNeEpoUGVrbk1udEFWL1NaenRNSmJQRkp0ZzhJbndLbURIUnJoK2xjRSs1TGpTamc5NQpYSkozNXZUQ1ZTYzVxYWdiTGVmWVV3SURBUUFCbzFBd1RqQWRCZ05WSFE0RUZnUVVVQXBlVy8vNnFUZ3Y1d1FZCmlxQXp0VGtwTS9zd0h3WURWUjBqQkJnd0ZvQVVVQXBlVy8vNnFUZ3Y1d1FZaXFBenRUa3BNL3N3REFZRFZSMFQKQkFVd0F3RUIvekFOQmdrcWhraUc5dzBCQVFzRkFBT0NBUUVBb0RISmNRdHNJY1VwMjlmV25kVEZjMVB3Uk44NApKN2c1R1I0QlJWZ08zTlpaVkhFbVpQbEttdE1NdHBMMnBETmsvN1ZKVmlHU3BxaHZkcGg2blo3UlVoZkJyRkZ2CjQrd05MMTRMNS9TaEhVNFNjQUgwZk5adFZzWUwyNm5ZSUQwMlhnMTBJY2RWZXlISjk3OXFkQzNsaDN1dDNJL2cKeVhSU0NMVFI4NmxrWG5CMG4venZGV0tIc1pJL0NCUHVrdHNaZ1RWQTNIeWRueHE5WG5TNGdPWHpLRzE2eHRRVApZcVhPWGJsZkFGZ2V1QkphRVR1OEx2Wjg3THdvK2o1QUVFRFJsVEVBdzJzbVc5OTRNSURlNU1LU1hVYVpKaTBQClI1a2ROVmhsVFB4OG1PNjhydjgzMm1zdHVNVkpBN0pYTlZ0U3RJOHZpemFiTno3M2QzS3lOb3pYVXc9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://172.17.1.101:6443
  name: cluster.local
- cluster:
    certificate-authority: /Users/viaggarw/.minikube/ca.crt
    server: https://192.168.99.100:8443
  name: minikube
contexts:
- context:
    cluster: cluster.local
    user: admin-cluster.local
  name: admin-cluster.local
- context:
    cluster: minikube
    user: minikube
  name: minikube
current-context: minikube
kind: Config
preferences: {}
users:
- name: admin-cluster.local
  user:
    client-certificate-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSURrVENDQW5tZ0F3SUJBZ0lKQU1tb240QWhjYXh0TUEwR0NTcUdTSWIzRFFFQkN3VUFNQkl4RURBT0JnTlYKQkFNTUIydDFZbVV0WTJFd0hoY05NVGd3TXpBeU1EZzFNVE15V2hjTk1qZ3dNakk0TURnMU1UTXlXakExTVJvdwpHQVlEVlFRRERCRnJkV0psTFdGa2JXbHVMV3M0Y3kwd01qRVhNQlVHQTFVRUNnd09jM2x6ZEdWdE9tMWhjM1JsCmNuTXdnZ0VpTUEwR0NTcUdTSWIzRFFFQkFRVUFBNElCRHdBd2dnRUtBb0lCQVFDMm5jNFE2Q0lXVU1EMGx0QnIKWXJ1SE5nYzZkUnQxcDFsRVFSRDFUbUo1cDQvNmc0VGh5OXZIcGkwVUlpL3pFd3NWSmNISCtjTmdKaFRJRVdKRApDSitXQ1JNQ1hYSTczanVheDYySWJET0daSVNHS2NRK25Va3VuY3ljeGExM2J6RGpDTEFDS3FRcWFQN1pONDZWCnRxMnVJczhIaEw4SmM4Tmo0NlNvTGFPZEcxQXJhdWtRU3hBYWNiRy9vb291OW9Jd0N2ejF6MERMRmU3NnUzK2UKVWpNOSs4QVZmalN1eU9qc2FJYk80TTF6ajU0Q0EvUm84eXcxS3JrMHlBNlFvWnZTTVRsNys2VnY1NGNsaWZ6RgppWjkrcVF0ekwxNEhxdnZrMHpRWlF4eUplZk9kMUxnamNIQUZzK2oraEZIRVZQSEpUalErTGY2ZWhZR3JDTWI5CnBSakpBZ01CQUFHamdjWXdnY013Q1FZRFZSMFRCQUl3QURBTEJnTlZIUThFQkFNQ0JlQXdnYWdHQTFVZEVRU0IKb0RDQm5ZSUthM1ZpWlhKdVpYUmxjNElTYTNWaVpYSnVaWFJsY3k1a1pXWmhkV3gwZ2hacmRXSmxjbTVsZEdWegpMbVJsWm1GMWJIUXVjM1pqZ2lScmRXSmxjbTVsZEdWekxtUmxabUYxYkhRdWMzWmpMbU5zZFhOMFpYSXViRzlqCllXeUNDV3h2WTJGc2FHOXpkSUlHYXpoekxUQXhnZ1pyT0hNdE1ES0hCQW9BQWcrSEJLd1JBV1dIQkFvQUFnK0gKQkt3UkFXYUhCQXJwQUFHSEJIOEFBQUV3RFFZSktvWklodmNOQVFFTEJRQURnZ0VCQURYbTQ1SnFFaUNlcXFoVwpRbVVPZUhQU3NzWTdvY1RiaXFVZzV3VEtUY2RONXpVankwYVh4Y0xkY2NKR2JDdmhQRk9FMXVhcmRncGlKby9PCkk5c253N0ZaRjY2STVYdGRkOUIyaDFyUHBKbHZxL3lNaVZqaFZyU1RnbmhZT2xtQmV3aXNWNldjdk9oUDZLbzgKSUIvYmJ6RGpMOWhEZGpoQnFpdjdqaVN5K0pOb0VrbE9icklBY2w0UEU1UldScm1YYlJwMDhNSDJQU0NOMVBzWQpTai9oWjU5ZUFLZ2Z1am80MWZkY1FnelJJVldCYlJGVUlkSTVKcEdFRWpqcjZHOWRuRGs3SlRiWTlBVmhxaXhQCjh0aHlnUWlsd0J6cjJxclprSk1LNzBqVE0xL0NLTHFkR3crOEtjbmErekRiSHd0WUlHdHE4Y0hobEhVMUdFNzAKUVRBaHFRdz0KLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo=
    client-key-data: LS0tLS1CRUdJTiBSU0EgUFJJVkFURSBLRVktLS0tLQpNSUlFb3dJQkFBS0NBUUVBdHAzT0VPZ2lGbERBOUpiUWEySzdoellIT25VYmRhZFpSRUVROVU1aWVhZVArb09FCjRjdmJ4Nll0RkNJdjh4TUxGU1hCeC9uRFlDWVV5QkZpUXdpZmxna1RBbDF5Tzk0N21zZXRpR3d6aG1TRWhpbkUKUHAxSkxwM01uTVd0ZDI4dzR3aXdBaXFrS21qKzJUZU9sYmF0cmlMUEI0Uy9DWFBEWStPa3FDMmpuUnRRSzJycApFRXNRR25HeHY2S0tMdmFDTUFyODljOUF5eFh1K3J0L25sSXpQZnZBRlg0MHJzam83R2lHenVETmM0K2VBZ1AwCmFQTXNOU3E1Tk1nT2tLR2IwakU1ZS91bGIrZUhKWW44eFltZmZxa0xjeTllQjZyNzVOTTBHVU1jaVhuem5kUzQKSTNCd0JiUG8vb1JSeEZUeHlVNDBQaTMrbm9XQnF3akcvYVVZeVFJREFRQUJBb0lCQURQVUJhLzJzZlh6WlZBRgpuWkZjckN4cndSRnVPeVRoSWd5bEN0TVVOQTZpNTlJSmthVWozblNEVFRmeG0vbzQ1V1JUR3ZST2hveTdRaHFtCkZHVkNCVWpudW1WcGNBcGR3RHpsZnZMQkFyNlp1S0w3SjU4OXRJOXVhYXYwem82ZkdCalhWbHpIRFdDYisvaGEKTkRWNWEwR0l6NGtxdTYxTEZhRTc4bmRvdkk3UnZqOStQeDBXVU43RkYvNkpBb2swWk9GNkRaUFNaV1N5Si9UOApXdTBjRUZaZ0xwUGRiUlY3RG9PbmpqV1hIKy9RYkplVXF1dXFpRm9XMGN5MlJQSnMxNC9FS3p4Njd2VzdjNEgrCkxQNWdKZHozQ3Jib1pNdDVDYXdRREZtNnFHOXRDelhVb2IrbE1SRGtyRk13SEg2RG9mZXFhOVlVTG1CNGdTVEEKa21KajBvRUNnWUVBOEJpRmNFbEJtNGI5d0VJeTk2MGFGODVBcStwQ0JzeGxmUi9UNE8zQURxaGVOUDNXREJYVwpHRDV2SHJzN1hzb2xCWjl1RGNBMVpUdnNQaisxNWVvZVFnUnhjL3M0emw2eGFnSTNOLzNJYTVGdjc5RWtXK1U4CnlpWkNCS2FEdEp1MEVpQSs2SUFXWC80OU1PN3VXUjc5MHgrTGV5Y1BHaWNHNUdLMG9PdGg0eDBDZ1lFQXdyYVEKZk9wcXRWdjhtcEN3MmUvRFZsOHBrcGFlS3BlaWdkVWVyTU5weE1IZkdXZmV3a1IrZkpNK28zYkhtWUlhWUZjZAo5YUVSbjdZek1pQ3NMU2ZCTkRHUXR0bUliNDZYTmlybHhyTVlCUE5TVTdTMzc3RjliYTdNVHJHK0tqMXFXRjM4CmpCVlQ0d1dEVHoyTXVnTjdBaG1SeVgxTTJ5ZGFDVlgxVzZjbkVKMENnWUVBanRDWE54WnNMeDRaL0cya01ZMUcKOHhnZGdlVkRSeFgzM0hpOUtKTmpaWlNqRFBSY2lTM0gvdjNNVFVSajZWdG1zRFNJV3llVTIxWE1qYTZKL1d2SQplYzU0eWR1S2k3N3AyenZjS3JNTHIyaUFZKzlNcUZqd1V2SjAzSjFMeEhmRm9lNktYUFFyMndlNDBFMmZlMldpCjZCMWdjMjNsWHRJT0dIWGFLY281bk1VQ2dZQTlzeG9mNnl3N0lkWHVxSkRSem04SWpJa2c0VWRuV2J0dUJybDgKcDBONXpMRkVYS3l5eEgrTVBDQnFMZlpieDJWU1IraS9iL1drdFZpTnR0cTRTRk9wbFZjMUNjTjVEaWNPVEJPWgpuaUNyV09zcWlTYUw5cU0zUVYrT1JEWnRMaDdudDRpU1h5UEEyWHRkZmJSOU1TTW1iREhOTmo1SFo3WFpKWHJsCk94ZGU1UUtCZ0NlQnh4ZXljRWFZK1lMeEsvQ1pudEVmZzlabEJYQXpxNVhKUTlEb3F5Vm04TEdPdGU5VFBELzIKdHFGNjRDa0syS0luUFRWZGxNU1RmVERMaDg5U2xjTWpJb1FzYVV2aTB0b2kzdjRteVl1b0RGTEh2cWh1L2NCaQp6ODZSTmE2MjRZZmhqNklBUWpSZXh1d3ViTG5QWDgyY1JMMWxSSUZUUWQzZkcrdVdnUGpZCi0tLS0tRU5EIFJTQSBQUklWQVRFIEtFWS0tLS0tCg==
- name: minikube
  user:
    client-certificate: /Users/viaggarw/.minikube/client.crt
    client-key: /Users/viaggarw/.minikube/client.key
~~~    

- To create a new user, first we need to create the certificates for that user, since openssl command is not available in minikube hence we need to use any other machine on which openssl command is available. We need to copy these two files from the minikube to other machine for generating the SSL certificates. 

~~~
# cat /var/lib/localkube/certs/ca.crt
-----BEGIN CERTIFICATE-----
MIIC5zCCAc+gAwIBAgIBATANBgkqhkiG9w0BAQsFADAVMRMwEQYDVQQDEwptaW5p
a3ViZUNBMB4XDTE4MDMyMDEzNTM0NloXDTI4MDMxNzEzNTM0NlowFTETMBEGA1UE
AxMKbWluaWt1YmVDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAL8C
wAkkMkPo4J96UFvTjWAbfZMaRKz0uHM8FGDiRCgsmtMtzDSzrDTcuGtxE8Qu0gHa
HIdCz+e8d2p7y0YXGm//t2VAn4zX1eAwp9GAUq+A88X+jSMstpAiGY6H7qQPdTHi
3/ctDOIUozknrEi3St7c5OZ2juaZUYncAxiLhAW2eDcWyqzYhG6ImYvLuZ21STxo
SU+GlUAnTJ6Dpv0ZUmQ8SkXRGyZOgfrAVQafUCEQMhxH62S1v/36Lc3OdwkoBJVP
xqvUmgetTT2HD8POnsnGdgZqVhIexfbajYFwXVZducBposbiPTdVkhFTCyFm/Uii
KHLeU+hHe7aqHQNchY0CAwEAAaNCMEAwDgYDVR0PAQH/BAQDAgKkMB0GA1UdJQQW
MBQGCCsGAQUFBwMCBggrBgEFBQcDATAPBgNVHRMBAf8EBTADAQH/MA0GCSqGSIb3
DQEBCwUAA4IBAQCQkr67uWzvEiUWtIdtM/V9a8LN8Q9wQfOUF92lovkCjbA7WrCd
qLSDXpe6m/YbMoyrh4/yyyYULFAJtXdyMgx47GQiD6L5bYEv07+W+lDfWpHgCSbF
hhH1YiRWlaCPkH9ZCDddNEKtPrC4moyqt99y4jAhpRivB8bxD4IVDOcRb1lsse4F
/NuO+Gg0Sdc7kWPnsRXJMEgFyEAuDPmp9AqEamHsKuohf75LxYOnvJB82w0b60pd
N8tPfE/VGouxz9W8RBDKkdDHR2HBv7OVmiTKgnn17ZX2J89Aobc9s5lp/Jv4ibjG
AR8Elwui8AqZTEgHZC1886nrz2oKv+qQGN2O
-----END CERTIFICATE-----

# cat /var/lib/localkube/certs/ca.key
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEAvwLACSQyQ+jgn3pQW9ONYBt9kxpErPS4czwUYOJEKCya0y3M
NLOsNNy4a3ETxC7SAdoch0LP57x3anvLRhcab/+3ZUCfjNfV4DCn0YBSr4Dzxf6N
Iyy2kCIZjofupA91MeLf9y0M4hSjOSesSLdK3tzk5naO5plRidwDGIuEBbZ4NxbK
rNiEboiZi8u5nbVJPGhJT4aVQCdMnoOm/RlSZDxKRdEbJk6B+sBVBp9QIRAyHEfr
ZLW//fotzc53CSgElU/Gq9SaB61NPYcPw86eycZ2BmpWEh7F9tqNgXBdVl25wGmi
xuI9N1WSEVMLIWb9SKIoct5T6Ed7tqodA1yFjQIDAQABAoIBAGu9+mJtp2jE6Ecs
sD1LtFg8yXV7gLdqhsyBXCFWIAnlNyPdlm031/AtfF0meHbVziG7TRJC7pERru5C
i+OqToBUZrdXX2gLqxl9eHvk/T7/5wGM10G7C/N7OJ08MbEbAwkzpw9+uuCfsX4g
0b5mnXXedcNFps+ONf8kOh7TO5IYY7u/FR4MfiKxohjsNDxo+TEWYE6ZWagB/EV3
ayWyr/P1rBF0uYimRKd9PP27y2Ms6mgvrrqw98WqDEpn+oRtbsH0SYavwCtqyCYN
6hO6DRkO+bcagsqmvSkujDcEojHT0HC5dWL96ehNhHMyAmojF1ff9QduzkSG07p4
yZMsqyECgYEA7teY0AVHyixQxsf45XNhsFXYPjVCOQ0CDxyi7ZeCTZVgxKa4M92/
qCx28XOzg5U5R5Vzn1x2RVIKiydN2x+5belzX3SFySOuVsJThaDOn39cXAFjikFL
lLtP9ZOW/nFFQCRL+432mTmidzzO/zECZYyAYdhi/V0YW+VIz7M0T5kCgYEAzLuD
mKgYJ0k8Gr2TNPI7WSzstJEY3KMVzyjkevPTWkXoz59Fl1Zo2cegH1ka3jgkBeTZ
xnxwds9aLaJIe05BOlfhSDSlj4tTzh94mII/MmWqCSK9lbOv+sDfTGn3+KD69VuI
eNeEVSzNGnOFDbCoZJtt92NWoVUZMpqF2Gy4rhUCgYEAvV+Ol2mIaWHHzkTiMTPS
AhmesnxR/KA2wLqo6I+XzmIhburt5JnvC63txTZC4JLh7sMuAO40DHSnTXwlfBdk
VCSkyMvABCJZagr8ZFiDW+2E0qJ7RTTOc6gtFv8l2qr/CIN/B36hRw5upfI+AhLe
3puPc4U5v8Afv0VF/QEO+gkCgYBIHm3W4q/Pdv7TNKCccA/z891WJh6p6lEObos9
vJJhJGtEaAitrOS2gpmnMU5DpWcbJGiKgN9lGtnbZWU++mwDz10ugE0p6ZyV6YQj
xQ3aBPIG0dQS3f9Jx5NhaZrOXHbK43mJh/G3x1Zg0Py3u9k1x4LPOJEVt9JufvxT
JslPmQKBgGZ1+fsQH2RosKKUDkRSl5vHEo3kj0AKthwJEs9F3dKeMqZfqsK+WrR0
9LeugH8WdE00mkl6ryhlabYvYV10SdXcIREOgCmAfxHDiMkU1UvWbZZ1t8i4DnnA
cHwE9Vg8I3VVXuV6UJYytj18aHT1M+phMg1jkBdQPtIMl5/9A9V0
-----END RSA PRIVATE KEY-----
~~~

- Generate the self signed certificates. 

~~~
# mkdir -p /var/lib/localkube/certs/
# vi /var/lib/localkube/certs/ca.crt
# vi /var/lib/localkube/certs/ca.key
# opensssl genrsa -out vikrant.pem 2048
# openssl req -new -key vikrant.pem -out vikrant-csr.pem -subj "/CN=vikrant/O=team1/"
# openssl x509 -req -in vikrant-csr.pem -CA /var/lib/localkube/certs/ca.crt -CAkey /var/lib/localkube/certs/ca.key -CAcreateserial -out vikrant.crt -days 10000
Signature ok
subject=/CN=vikrant/O=team1
Getting CA Private Key
~~~

- Copy the content of the files generated in previous command to your host machine from which you are running kubectl and minikube commands at location ~/.minikube/

~~~
# cat /root/vikrant.pem
-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAq5uH8r84vF9BcgPTpplig5oKjqkspdOmhzO+XW/LP/noacce
2LV9BKoc+i2OWMVquiVdDV3I89x7u3by542doBNa6mG9qARY6FzB/QGIe+2+pv7w
JeuoilGAOOcfacDkvwt7oMYmX3WMrMh2QFBPo/V1IVLCka3TOKsLllkb5rI8eggk
kbCWymm+3J/N2sPOPs5xwsCuBwf2beDOCeS/9YOz8E+F1gJbBWsWsgeDIlZO0pKm
5EKFV20e8Swlt5FL/PMh4bJPYu09xgNT7ECGNb6mBmUpajg4vUP+LqXzIe8GBl9+
kXhuAT/7ls/KjbcbA3485iMkplIbUDglxNtNrwIDAQABAoIBAQCbU2iG0IwS/Ikp
IMuW1Oi1Q11g6UFPSzZE1BHvUrv+ST4TWDbUYdkpuqwFyew4719940nJSmUUTTH1
aWHNMoJEnKBC23sls+GhWCwBzDx0J6nUT5agTCA+KizL1G67cuvY/BTHXfLnnmdZ
EQzvg4HCXu7I3bbc0yAG/9K6ICe/84KKUWlb3n4nGCn6Y+vfkjs+4SkOikR4/XbV
CTpK+GveTyuaB9OCq7ZSTo0tVABwrvWJnIEMgUOcOAakLruSUuuprdZCxZGwQde3
jZUPgtWizI/pbcqufE/k6z6m/2VZzuf8adljAH5F+ng+zTPcLuMH1FPKGtKJX5+K
vKoSKm6xAoGBANVbrhTl9jBLXyEvv11MX5toFLMO3ph/y7/3iO4LU8mq1a3+WhkT
7lXFDJJ0AAIAezBBrAxpyM2Vf41ca2CgBNwRVFSs+H/DiaUuqwjEsbELMHxH+ylE
FulUe5T9ivOaCIiaajlP5Gp3rhZUP91yjoqVV/eYcutJx5ukrOZr7wj5AoGBAM3n
timygRwra4pwJJzjhX2EK3VP4Sf7Gh6whJi85FY4nCglU3XjTJKkAmw/cJQa7pGu
+fOzOq250yUBzs9MWk1mt73ykDb95kPxPRORjP1AZnkpEWd1x57oKbe7NL5rdqNI
EeJXlY2mKYVGRHW7ytYDQO4cz54ePDwaTMQs1h3nAoGBAL/gyqcaxRRbxHr5EPXc
KKN/sBX0inXFgLzs5iWG5Fyamb7335lsFkzmgM75KcSjICae+RbUz/UrvOGpuxvT
7Wro3tmkEXv9o719Qe4JzvA06u7qYVOUW7KN+vJcLumznncTv/I5CmhBp7uHG0SR
sOWrN8iBPuChorU0HRbA/OEpAoGAfnLZDNxhq6ICpf7ejTawiPd9FMscc8giL0yp
8X63HzgetgzOJ2ySXs+36TBAe8PaVL9HIuEjnQKsZ2Kn1eiG4Fe/aTgoVo0wNvNU
Vcsh8Xj2NVwCIy5SjAT5carW5kXqkrW0vfKZlma/wuf3LPJJy4ot+szYt7rLtQFV
uXfremsCgYEAz3RzPu7dMtw82tKlANUNvh9Ma6l+WFwubAfB0rPk8vQlIQrdAj9A
0lc9fwgZI2hal+ewkg+T0UEy/Y18Jcyi1vwCuw20JsNO3ACRhi9QMdshdaHj/CJ2
+2aG8t/iKc+LL1rmFFWkvw7CDvRSZlX+nrAfFUmefSReq8XT3qOFtcg=
-----END RSA PRIVATE KEY-----

# cat /root/vikrant.crt
-----BEGIN CERTIFICATE-----
MIICszCCAZsCCQCehgmLmEOZyDANBgkqhkiG9w0BAQsFADAVMRMwEQYDVQQDEwpt
aW5pa3ViZUNBMB4XDTE4MDcxMzA3NTg0OVoXDTQ1MTEyODA3NTg0OVowIjEQMA4G
A1UEAwwHdmlrcmFudDEOMAwGA1UECgwFdGVhbTEwggEiMA0GCSqGSIb3DQEBAQUA
A4IBDwAwggEKAoIBAQCrm4fyvzi8X0FyA9OmmWKDmgqOqSyl06aHM75db8s/+ehp
xx7YtX0Eqhz6LY5YxWq6JV0NXcjz3Hu7dvLnjZ2gE1rqYb2oBFjoXMH9AYh77b6m
/vAl66iKUYA45x9pwOS/C3ugxiZfdYysyHZAUE+j9XUhUsKRrdM4qwuWWRvmsjx6
CCSRsJbKab7cn83aw84+znHCwK4HB/Zt4M4J5L/1g7PwT4XWAlsFaxayB4MiVk7S
kqbkQoVXbR7xLCW3kUv88yHhsk9i7T3GA1PsQIY1vqYGZSlqODi9Q/4upfMh7wYG
X36ReG4BP/uWz8qNtxsDfjzmIySmUhtQOCXE202vAgMBAAEwDQYJKoZIhvcNAQEL
BQADggEBAIJNKnWcHY4IuYgKqyRv5wjkd6MSnvxuwyjNTY8LYrA/OArjY5JN5yNs
CmH9BW/HldjXqlyMt4WXW+Qy//HWp/hYgt7z6J/ehsUouX/TPKxOc0i0DcseyCHe
E5yjAywrh46twsefH2Bf3tuU1aTLDScQpqF3qJUdWzeWpOOPuyJzYZvmy3hqQJ+S
Rim3ph++yKy5HyN2TTTqjjbNkXuI+h6y/bOl4qE91ByGAKjg0gewswBEvU3c0w9a
yGz3Gh0e83vHyjdfDcZTFeGO6CRPx+QArjd8+dPNMzkITeRAprwO+VRS5NJb5XzX
UcLYgGDbOpgtCNk1ObeL9ofDs5lzPEA=
-----END CERTIFICATE-----
~~~

- Issue the following commands from ~/.minikube directory. 

~~~
$ kubectl config set-credentials vikrant --client-certificate=vikrant.crt --client-key=vikrant.key
$ kubectl config set-context vikrant --cluster=minikube --user vikrant
~~~

- Verify that context is added successfully. 

~~~
$ kubectl config get-contexts
CURRENT   NAME                  CLUSTER         AUTHINFO              NAMESPACE
          admin-cluster.local   cluster.local   admin-cluster.local
          minikube              minikube        minikube
*         vikrant               minikube        vikrant
~~~     

- If you issue any command with vikrant user, it's denied. 

~~~
$ kubectl get pod
Error from server (Forbidden): pods is forbidden: User "vikrant" cannot list pods in the namespace "default"
~~~ 

- If you want to switch the context to minikube. Verify that it's switched successfully. 

~~~
$ kubectl config use-context minikube
Switched to context "minikube".

$ kubectl config view | grep current
current-context: minikube

$ kubectl config get-contexts
CURRENT   NAME                  CLUSTER         AUTHINFO              NAMESPACE
          admin-cluster.local   cluster.local   admin-cluster.local
*         minikube              minikube        minikube
          vikrant               cluster.local   vikrant
~~~    

same command which was forbidden with vikrant user is working with minikube user. 

~~~
$ kubectl get pod
NAME       READY     STATUS             RESTARTS   AGE
test-pod   0/2       CrashLoopBackOff   687        2d
~~~

In the next post, we will see how we can use the existing role to bind it with vikrant user so that it can have the privileges to do everything on cluster. 