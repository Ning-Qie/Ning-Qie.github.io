---
layout: post
title: 修改Win11右键菜单样式
date: 2022-08-26 17:30:00 +0800
updatetime:
category: Collect
thumbnail: https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/thumbnail/milad-fakurian-tUF--C9oOuE-unsplash.jpg
icon: link
summary: 真的不想再每次点更多选项了！！
tag: [Windows]
---

* content
{:toc}

### 1.启用传统右键菜单

打开cmd命令行，执行以下命令即可：

```powershell
reg add HKCU\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32 /f /ve
```



### 2.恢复Win11折叠菜单

打开cmd命令行，执行以下命令即可：

```powershell
reg delete HKCU\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}  /f
```



### 其他：使样式生效

**方法一：**注销重启即可



**方法二：**

cmd执行下列命令

```powershell
# 结束explorer.exe进程
taskkill /im explorer.exe /f
# 启动 explorer.exe
start c:\windows\explorer.exe
```