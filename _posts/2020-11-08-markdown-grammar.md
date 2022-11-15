---
layout: post
title: Markdown语法归纳
date: 2020-11-08 17:14:00 +0800
updatetime: 2022/11/14 上午11:00:00
category: Collect
thumbnail: https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/thumbnail/kelly-sikkema--1_RZL8BGBM-unsplash.jpg
icon: note
summary: 在这里记录Markdown自己常用的语法
tag: [Markdown,语法]

---

* content
{:toc}

## 1.标题格式

`# 标题内容`为标题格式，注意空格的输入！

```markdown
# 1.标题内容 --一级标题
## 2.标题内容 --二级标题
...
##### 5.标题内容 --五级标题
####### 6.标题内容 --六级标题

默认格式
```

> 快捷键：
>
> n级标题：【Ctrl + 数字1-6】
>
> 默认格式：【Ctrl + 0】



## 2.字体样式

`*文本*`:

*斜体文本*

> 快捷键：【Ctrl + I】



`**文本**`:

**粗体文本**

> 快捷键：【Ctrl + B】



`***文本***`:

***粗斜体文本***



`~~文本~~`:

~~删除线文本~~



`<u>文本</u>`:

<u>下划线文本</u>

> 快捷键：【Ctrl + U】



## 3.常用

#### 有序列表

1. 第一项
2. 第二项
   1. 第Ⅱ-1项
   2. 第Ⅱ-2项

> 快捷键：【 Ctrl + Shift + [ 】



#### 无序列表

- 第一项
- 第二项
  - 第Ⅱ-1项
  - 第Ⅱ-2项

> 快捷键：【 Ctrl + Shift + ] 】



#### 列表缩进

> 快捷键：
>
> Ctrl + ]      右缩进
>
> Ctrl + [      左缩进



## 4.其他

#### 分割线

```
---
```



#### 脚注

创建脚注格式类似这样 [^文本内容]。

[^文本内容]: 可以把需要标注的详情放在文章最后面



#### 引用区块

```markdown
> 111
> abc
> 一二三四五
```

快捷键：【Ctrl + Shift + Q】

> 111
>
> abc
>
> 一二三四五



#### 文字链接

`[网站名称](网址)`

例：

`[百度](www.baidu.com)`

[百度](www.baidu.com)

> 快捷键：【Ctrl + K】



#### 网址链接

`<网址>`

例：

`<www.baidu.com>`

<www.baidu.com>