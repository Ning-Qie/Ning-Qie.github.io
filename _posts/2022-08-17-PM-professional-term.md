---
layout: post
title: PM需要知道的一些专业名词
date: 2022-08-17 10:30:00 +0800
updatetime:
category: PM
thumbnail: https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/thumbnail/parrish-freeman-58QVNWSB6qQ-unsplash.jpg
icon: note
summary: 什么都往里面放好了
tag: [PM,原型]
---

* content
{:toc}

## 一、PM

### 1.原型图相关

##### 高保真、低保真原型

- 低保真原型，是将设计概念粗线条地转换为有形的、可测试物的简便快捷方式。主要表现产品中最重要的用户流程和功能所涉及的页面关系。

- 低保真原型制作成本较低，可在很短的赶时间内快速完成。它是一种相对简单的技术，但当产品团队需要探索不同的想法并快速优化设计时，非常有用。

- 高保真原型一般用于功能实现、交互设计以及测试开发；低保真原型一般用于头脑风暴、早期测试以及开发确认。



## 二、开发

##### 持续集成（CI）

- 持续集成（CI，Continuous integration）指的是只要代码有变更,就自动运行构建和测试,反馈运行结果。确保符合预期以后,再将新代码"集成"到主干。

<img src="https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2022-08-17-PM-professional-term/20181126230558790.png" alt="20181126230558790" style="zoom:50%;" />

- 从图例上来看持续集成的流程就十分清晰了：
  - 开发人员提交代码到 Source Repository （源代码仓库），并通过 git hook 等
  - 触发 CI Server（持续集成服务器）的相关功能。执行 编译 -> 测试 -> 输出结果 的流程，
  - 向开发人员反馈结果的 report

- 持续集成的核心 在于 确保新增的代码能够与原先代码正确的集成。



##### 持续部署（CD）

- 持续部署（CD，Continuous deployment），通过自动化部署的手段将软件功能频繁的进行交付。与持续交付以及持续集成相比，持续部署强调了通过 automated deployment 的手段，对新的软件功能进行集成。

<img src="https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2022-08-17-PM-professional-term/20181127115239969.png" alt="20181127115239969" style="zoom:50%;" />

- 可以看到，同 持续交付 相比持续集成的区别体现在对Production的自动化。从开发人员提交代码到编译、测试、部署的全流程不需要人工的干预，完全通过自动化的方式执行。这一策略加快了代码提交到功能上线的速度，保证新的功能能够第一时间部署到生产环境并被使用。



##### 敏捷开发

- 敏捷开发的核心理念就是既然我们无法充分了解用户的真实需求是怎样的，将一个大的目标不断拆解，把它变成一个个可交付的小目标，然后通过不断迭代，以小步快跑的方式持续开发。



##### Scrum

- 符合敏捷开发价值观和原则的开发方式包括：极限编程(XP)、Scrum、精益软件开发(Lean Software Development)、动态系统开发方法(DSDM)、特征驱动开发(Feature Driver Development)、水晶开发(Crystal Clear)等。

- Scrum 基于经验主义和精益思维。 经验主义主张知识源自实际经验以及根据当前观察到的事物作出的判断所获得。精益思维减少浪费，专注于根本。

<img src="https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2022-08-17-PM-professional-term/v2-93214b864dac7a558ebf81d40254b1b8_r.jpg" alt="v2-93214b864dac7a558ebf81d40254b1b8_r" style="zoom:50%;" />



## 三、测试

##### AB测试

- AB测试是为Web或App界面或流程制作两个（A/B）或多个（A/B/n）版本，在同一时间维度，分别让组成成分相同（相似）的访客群组（目标人群）随机的访问这些版本，收集各群组的用户体验数据和业务数据，最后分析、评估出最好版本，正式采用。
- A/B测试的作用
  - 消除客户体验（UX）设计中不同意见的纷争，根据实际效果确定最佳方案；
  - 通过对比试验，找到问题的真正原因，提高产品设计和运营水平；
  - 建立数据驱动、持续不断优化的闭环过程；
  - 通过A/B测试，降低新产品或新特性的发布风险，为产品创新提供保障。



##### QA测试

- QA就是质量监督/质量保证。QA即Quality Assurance，它所关注的是对质量的测量及检查，还有通过改进过程来提高软件的质量，依次来指导软件的发行。



## 四、设计

##### UX

- UX，即UE，全称为User Experience（用户体验），指用户在使用产品过程中的个人主观感受。对于互联网行业来说，UX设计与UI设计同样重要。

- 所谓的UX设计，业界术语是UED，即用户体验设计，它包括了UI设计、交互设计两个方面。

  

##### 全栈式设计师

- 全栈式设计师是能够掌握线框、原型、图形模型的制作、前端开发、javascript和jQuery等的使用，全栈设计师能够完成项目构思及相关设计开发任务。




##### 情绪板

- Moodboard，中文翻译叫“情绪板”，是国外设计师最常用视觉调研工具。它是由设计师对一个品牌、产品甚至是海报主题充分理解后，收集相关的色彩，影像，字体或其它材料等视觉元素将其汇集在一起，最后形成作为设计方向与形式的参考。



## 五、其他

##### 用户故事

- “在软件开发和产品管理中，一个用户故事是一个非正式的，自然语言描述的一个或多个软件系统功能。” - 维基百科

- “所谓用户故事：描述了对用户、系统或软件购买者有价值的功能。” - Mike Cohn

- 总之，用户故事在软件开发过程中被作为描述需求的一种表达形式，并着重描述角色（谁要用这个功能）、功能（需要完成什么样子的功能）和价值（为什么需要这个功能，这个功能带来什么样的价值）。

- INVEST原则：

  <img src="https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2022-08-17-PM-professional-term/v2-0c67e86d12fba6789d5f887c9df9e806_r.jpg" alt="v2-0c67e86d12fba6789d5f887c9df9e806_r" style="zoom:50%;" />

  - 独立的（Independent）：一个用户故事尽可能独立于其他用户故事，并确保每个单独的用户故事都有其独立的业务价值，避免用户故事间的相互依赖导致排优先级变得困难。

  - 可讨论的（Negotiable）：用户故事是可以讨论的，用户故事不是合同，在保证价值的情况下，细节在与客户讨论中产生。

  - 有价值的（Valuable**）**：每个用户故事必须对客户或用户具有价值，避免那些只对开发团队有价值的用户故事。

  - 可估计的（Estimable）：可以对用户故事进⾏估计，以确定其优先级、工作量，并安排迭代计划。导致用户故事不可估计的原因如：缺少领域知识、缺少技术知识，故事太大了等。

  - 小的（Small**）**：大小刚刚好，确保在一个迭代（Sprint）中能够完成。

  - 可测试的（Testable）：用户故事必须是可测试的，测试通过可以确认用户故事被开发人员正确地实现了。

- 示例：

  ![v2-c9e7a56beb65a16c627b3320aa765a05_r](https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2022-08-17-PM-professional-term/v2-c9e7a56beb65a16c627b3320aa765a05_r.jpg)



##### 看板(Kanban)

- 看板（Kanban），源于丰田生产系统和精益生产，是一种可视化流程管理系统，描述团队在生产什么、何时生产及生产多少。

  <img src="https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2022-08-17-PM-professional-term/0e9485ce74af4fa9b53a564b6cbe3b2f.png" alt="0e9485ce74af4fa9b53a564b6cbe3b2f" style="zoom: 33%;" />



##### 精益思想

- 精益思想的核心就是（消除浪费）以越来越少的投入——较少的人力、较少的设备、较短的时间和较小的场地创造出尽可能多的价值；




##### 颗粒度

- 颗粒度（granularity），互联网术语。颗粒度大表示宏观、概括；颗粒度小表示更微观、注重细节。


<img src="https://ning-blog-1304206373.cos.ap-nanjing.myqcloud.com/image/posts_img/2022-08-17-PM-professional-term/image-20220809143259201.png" alt="image-20220809143259201" style="zoom:50%;" />