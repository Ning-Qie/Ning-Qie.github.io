---
layout: post
title: 建立多个github page，并为其设置二级域名
date: 2020-12-09 14:55:00 +0800
updatetime: 
category: Web
thumbnail: https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/thumbnail/markus-spiske-7VVOv9Cejdc-unsplash.jpg
icon: book
summary: 把网站分布到不同仓库，以便更好管理
tag: [web,域名,github.io]
---

* content
{:toc}

# 1.创建新的github page仓库

和之前一样，使用`github账号.github.io-仓库名称`建立新的仓库，例：

```
Ning-Qie.github.io-demo1
```

将所需的站点资源存放进去，打开仓库设置`Setting`，找到`Github Pages`配置部署。

![](https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2020-12-09-aliyun-domain-set/1.png)

成功部署后即可通`账号名称.github.io/账号名称.github.io-仓库名称/`访问了

![](https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2020-12-09-aliyun-domain-set/2.png)

# 2.设置二级域名DNS解析

这里使用的是阿里云，找到DNS解析服务，点击域名解析设置，添加一个记录。

![](https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2020-12-09-aliyun-domain-set/3.png)



# 3.将二级域名绑定到新的github page

![](https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2020-12-09-aliyun-domain-set/4.png)



这样，就可以通过二级域名访问新的站点了。

![](https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2020-12-09-aliyun-domain-set/5.png)