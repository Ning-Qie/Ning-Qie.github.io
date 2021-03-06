---
layout: post
title: 服务器CentOS7安装code-server，快乐地用web修改代码
date: 2020-06-19 22:33:50 +0800
updatetime: 2020/11/12 下午6:11:20
category: Code
thumbnail: https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/thumbnail/blur-close-up-code-computer-546819-524c72d599c7470489c543f29c5bcc5e.jpg
icon: code
summary: 日常使用Xshell管理服务器，无界面操控编辑代码时还是较为难受的；阿里云提供远程连接，但由于登录验证比较麻烦，无意间看见VSCode的web版，即CodeServer。
tag: [Code server,VS code,在线编程,服务器]
---

* content
{:toc}

# 前言
日常使用Xshell管理服务器，无界面操控编辑代码时还是较为难受的；阿里云提供远程连接，但由于登录验证比较麻烦，无意间看见VS Code的web版，即Code Server。

# 安装
### 1.下载Code Server文件
code server项目地址：https://github.com/cdr/code-server/releases

![image.png](https://raw.githubusercontent.com/Ning-Qie/Ning-Qie.github.io/master/ning_file/image/image-0e507a3b215f4a12943316a43dab0043.png)

根据自己的服务器选择相应文件，下载到本地后通过Xftp上传至服务器任一位置，我这里就是新建了一个code_server文件夹放置文件。

```language
cd /home/Ning/code_server
```
将文件解压，tar -zxvf "code server文件名"
```language
tar -xzf code-server-3.4.1-linux-x86_64.tar.gz
```
cd到code server解压后的文件夹，后面运行./code-server需要
```language
cd /home/Ning/code_server/code-server-3.4.1-linux-x86_64
```

### 2.进行端口配置
Code Server默认端口号为8080，如果需要修改端口号为其他，需要进行下述操作：

PASSWORD="*******"   其中填你自己的密码，用于界面登录；
--port 8091 这里的数字就是你开放的端口号，记得设置好安全组；
```language
export PASSWORD="*******" && ./code-server --host 0.0.0.0 --port 8091
```

### 3.测试是否安装成功
在浏览器输入**ip+端口号**，如果出现登录界面，输入密码稍等片刻即可。
![image.png](https://raw.githubusercontent.com/Ning-Qie/Ning-Qie.github.io/master/ning_file/image/image-ac285cb2d2d9414a8b8e2fd41797f98f.png)

![image.png](https://raw.githubusercontent.com/Ning-Qie/Ning-Qie.github.io/master/ning_file/image/image-bf99594fda884707b62f846946b920a0.png)

![image.png](https://raw.githubusercontent.com/Ning-Qie/Ning-Qie.github.io/master/ning_file/image/image-0408728818fc43b9af49a6057cc664ff.png)

### 4.让Code Server在后台保持运行
如果按照上述操作，关闭或退出shell连接后，就无法再连接上服务器上code server。

此时就需要利用Screen将其放置后台运行，如果没安装的直接用yum安装即可：
```language
yum -y install screen
```
安装好Screen之后，输入下面命令进入screen窗口
```language
screen -S server
```

进入screen窗口后，再按照步骤2执行一遍命令
```language
export PASSWORD="*******" && ./code-server --host 0.0.0.0 --port 8091
```
最后键盘"Ctrl + A + D" 退出就完成了，这时候退出Shell就没有问题了。

### 5.其他（code server中文设置）
和VS Code设置方法一样，按Ctrl + Shift + P
搜索"Configure Display Language"
![image.png](https://raw.githubusercontent.com/Ning-Qie/Ning-Qie.github.io/master/ning_file/image/image-db5b46eec4b74c568c42055f60ab1b3e.png)
然后点Install，找到中文-简体安装即可
![image.png](https://raw.githubusercontent.com/Ning-Qie/Ning-Qie.github.io/master/ning_file/image/image-2e6e11f9882f4c19862de4799c4f2182.png)

![image.png](https://raw.githubusercontent.com/Ning-Qie/Ning-Qie.github.io/master/ning_file/image/image-db5b46eec4b74c568c42055f60ab1b3e.png)



然后？？快乐编程吧💻💻💻💻💻💻💻💻🎉🎉🎉🎉🎉🎉