---
layout: post
title: Win11右键菜单玩法汇总
date: 2022-09-01 17:30:00 +0800
updatetime:
category: Collect
thumbnail: https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/thumbnail/milad-fakurian-tUF--C9oOuE-unsplash.jpg
icon: code
summary: 让右键简洁方便一点~
tag: [Windows]
---

* content
{:toc}

<style>
   .highlight .err{
      background-color: aliceblue !important;
   }
</style>

### 修改Win11菜单样式

#### 1.启用传统右键菜单

打开cmd命令行，执行以下命令即可：

```powershell
reg add HKCU\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32 /f /ve
```



#### 2.恢复Win11折叠菜单

打开cmd命令行，执行以下命令即可：

```powershell
reg delete HKCU\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}  /f
```



#### 其他：使样式生效

**方法一：**注销重启即可



**方法二：**

cmd执行下列命令

```powershell
# 结束explorer.exe进程
taskkill /im explorer.exe /f
# 启动 explorer.exe
start c:\windows\explorer.exe
```

<br>

### 管理工具：RightMenuMgr

[点击下载](https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/something/Software/RightMenuMgr-1.2.1.7z)

- **勾选**以启用/禁用相应选项

<img src="	https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2022-09-31-Win-Right-Menu-Collect/Snipaste_2022-09-01_17-04-20.png" alt="Snipaste_2022-09-01_17-04-20" style="zoom:50%;" />

<br>

### 新建Markdown文件

1. **新建**一个**reg文件**

2. 复制**以下内容**到reg文件中

   > 将typora.exe修改为自己的地址

```json
Windows Registry Editor Version 5.00

[HKEY_CLASSES_ROOT\.md]
@="typora.md"
"icon"="你的typora安装目录下的typora.exe文件"
[HKEY_CLASSES_ROOT\.md\OpenWithProgids]
"Typora.md"=""
"VSCode.md"=""

[HKEY_CLASSES_ROOT\.md\ShellNew]
"NullFile"=""
```

3.**运行**编辑好的reg文件

<br>

### 在VS Code中打开文件/文件夹

1. ##### VS Code打开文件

   - 方法一：运行reg文件

   ```json
   Windows Registry Editor Version 5.00
   
   [HKEY_CLASSES_ROOT\*\shell\VSCode]
   @="Open With VS Code"
   "Icon"="你的Code.exe文件地址"
   
   [HKEY_CLASSES_ROOT\*\shell\VSCode\command]
   @="你的Code.exe文件地址""%1"
   ```

   例：

   > "Icon"="\"C:\\Users\\Ning\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe\""
   >
   > @="\"C:\\Users\\Ning\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe\"\"%1\""

   

2. ##### VS Code打开文件夹

   - 方法一：运行reg文件

   ```json
   Windows Registry Editor Version 5.00
   
   [HKEY_LOCAL_MACHINE\SOFTWARE\Classes\Directory\background\shell\VSCode]
   @="Open With VS Code"
   "Icon"="你的Code.exe文件地址"
   
   [HKEY_LOCAL_MACHINE\SOFTWARE\Classes\Directory\background\shell\VSCode\Command]
   @="你的Code.exe文件地址""%V"
   ```

   

