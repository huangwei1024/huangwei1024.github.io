---
layout: post
title: 「毁灭战士3」源码就是“保持简洁”的证明
categories: develop
tags: [doom, zen]
description: 「毁灭战士3」源码就是“保持简洁”的证明
keywords: C语言, 毁灭战士, 源码
date: 2014-07-30
---

这篇文章是在没有搭建这个Blog之前帮jobbole翻译的，现在只是复制回来自己做个存档，[jobbole链接在这](http://blog.jobbole.com/83438/)。

----------

假如你在网上搜最好的C++源代码。「毁灭战士3 | Doom 3」的源代码肯定会被提到好多次，这篇就来证明此事。

<span style="color: #888888;">我花了一些时间通读了 DOOM3 的源代码。这可能是我见过的最干净最漂亮的代码了。</span>

DOOM3是[id Software](http://en.wikipedia.org/wiki/Id_Software "Id Software")公司开发 [Activision](http://en.wikipedia.org/wiki/Activision "Activision")发行的视频游戏。该游戏为id Software赢得了商业上的成功，已售出350万多份拷贝。

![](http://ww2.sinaimg.cn/large/7cc829d3jw1e4zbnxsznrj20ai06lq3u.jpg)

在2011年11月23日，id Software维持开源传统，发布了他们上一个引擎的[源代码](https://github.com/dhewm/dhewm3)。这份源代码已经被很多开发者审查，这里就有个fabien反馈的例子（[链接](http://fabiensanglard.net/doom3_bfg/)）：

<span style="color: #888888;">DOOM3 BFG是用C++写的，一种庞大的语言，它既能写出优秀的代码，但也让人憎恶到眼睛流血。幸运的是，id Software退而求其次，使用C++子集，接近于“带类的C”，如以下几条约束：</span>

*   <span style="line-height: 13px; color: #888888;">没有异常</span>
*   <span style="color: #888888;">没有引用（使用指针）</span>
*   <span style="color: #888888;">少用模板</span>
*   <span style="color: #888888;">使用常量（Const everywhere）</span>
*   <span style="color: #888888;">类</span>
*   <span style="color: #888888;">多态</span>
*   <span style="color: #888888;">继承</span>

很多C++专家不建议使用“带类的C”这样的方法。然而，DOOM3从2000开发至2004，没有使用任何现代C++机制。

让我们使用 CppDepend 来看看源代码，探索它得特别之处。

DOOM3有少量的几个工程组成，这儿有它的工程列表和一些类型统计。

![](http://ww3.sinaimg.cn/mw690/6941baebgw1eohinbexqej20ed05odh4.jpg)

这里还有他们之间的依赖关系图：

![](http://ww2.sinaimg.cn/mw690/6941baebgw1eohinasrfqj20lo094dhk.jpg)

DOOM3定义了很多全局函数。但是，大部分内容实现是在类中。

数据模型使用结构体定义。为了在源代码中对结构体的使用有个更具体的理解，在下图中将它们以蓝色分块显示出来。

在图表中，代码被表示为树形图，树形图表示法能使用嵌套的矩形来表示树状结构。而树结构用来表示代码分层结构。

*   <span style="line-height: 13px;">工程包含命名空间。</span>
*   命名空间包含类型。
*   类型包含函数和域（field）。

![](http://ww4.sinaimg.cn/mw690/6941baebgw1eohinagm9ij20le0an44r.jpg)

我们可以观察到它定义了许多的结构体，比如DoomDLL 40%的类型都是结构体。它们被有条理地用来定义数据模型。该实践已经被很多工程所接受，这种方法有个最大的缺点是多线程应用，结构体的public变量并非不可改变的。

为何支持不可变对象，有个重要原因：能显著地简化并发编程。考虑下，写个合格的多线程程序是个艰巨的任务吗？因为很难同步线程访问资源（对象或者其他OS资源）。为什么同步这些操作很困难呢？因为很难保证在资源竞争状态下多线程对多个对象进行正确的读写操作。假如没有写操作呢？换句话说，线程只访问这些对象，而不做任何变动？这样就不再需要同步操作了！

让我搜索下只有一个基类的类：

![](http://ww2.sinaimg.cn/mw690/6941baebgw1eohin9ofg3j20bt08jabe.jpg)

几乎40%的结构体和类都只有一个基类。通常，OOP（面对对象编程）使用继承的好处之一是多态，下面蓝色标明了源代码中的虚函数：

![](http://ww4.sinaimg.cn/mw690/6941baebgw1eohin97by0j20n00aqn45.jpg)

超过30%的函数是虚函数。少数是纯虚函数，下面是所有虚基类列表：

![](http://ww3.sinaimg.cn/mw690/6941baebgw1eohin8oam0j20av0drdhs.jpg)

只有52个类被定义为虚基类，其中35个类只是纯接口，也就是这些接口都是纯虚函数。

![](http://ww3.sinaimg.cn/mw690/6941baebgw1eohin8eycvj20aw0dp0vc.jpg)

我们来搜搜使用了RTTI的函数

![](http://ww2.sinaimg.cn/mw690/6941baebgw1eohin7xurlj20c20ds77l.jpg)

只有非常少的函数使用了RTTI。

为保证只使用OOP最基础的概念，不使用高级设计模式，不过度使用接口和虚基类，限制了RTTI的使用并且数据都定义为结构体。

至此这份代码跟很多C++开发者所批评的“带类的C”没太大区别。

其开发者的一些有趣的选择，帮助我们理解它的奥秘：

**1-为有用的服务提供公用的基础类。**

许多类是从idClass继承下来的：

![](http://ww2.sinaimg.cn/mw690/6941baebgw1eohin7juvpj20ax0ds0v6.jpg)

idClass提供如下服务：

1.  <span style="line-height: 13px;">创建实例化</span>
2.  类型管理
3.  事件管理

![](http://ww1.sinaimg.cn/mw690/6941baebgw1eohin6s68bj20aw0cgjts.jpg)

**2-方便的字符串操作**

一般来说，字符串是一个项目里用的最多的对象，许多地方需要使用它，并且需要函数来对其进行操作。

DOOM3定义了idstr类，几乎包含了所有用的字符串操作函数，无需再自己定义函数来接受其它框架所提供的字符串类。

**3-源代码与GUI框架（MFC）高度解耦**

很多工程用了MFC后，它的代码就会与MFC类型高度耦合，并且在代码的任何一处都能发现MFC类型。

在DOOM3里，代码和MFC是高度解耦的，只有GUI类才会直接依赖它。下面的CQLinq查询可以展示这点：

![](http://ww3.sinaimg.cn/mw690/6941baebgw1eohin65onej20bk0ds0w6.jpg)

这样的选择对生产力有很大的影响。事实上，只有GUI开发者才会关心MFC框架，其它开发者不应该被强制在MFC上浪费时间。

**4-提供了非常好的公共函数库（idlib）**

几乎在所有项目中都会用到公共工具类，就如以下查询的结果：

![](http://ww2.sinaimg.cn/mw690/6941baebgw1eohin5r7msj20bi0dsaco.jpg)

正如我们所看到经常使用的就是公共工具类。假如C++开发者不使用一个良好的公共工具框架，那就会为解决技术层面问题花费大部分的开发时间。

idlib提供了很多有用的类用于字符串处理，容器和内存。有效促进了开发者的工作，并且能让他们更多的关注在游戏逻辑上。

**5-实现非常易于理解**

DOOM3实现了非常难的编译器，对于C++开发者而言，开发语法解析器和编译器不是件轻松的事。尽管如此，DOOM3的实现非常容易被理解并且编写得十分干净。

这儿有这些编译器的类的依赖图：

![](http://ww1.sinaimg.cn/mw690/6941baebgw1eohin5clqhj20k609udh7.jpg)

这儿还有编译器源代码的代码片段：

![](http://ww2.sinaimg.cn/mw690/6941baebgw1eohin4wztzj20is0e9juu.jpg)

我们也看过许多语法解析器和编译器的代码，但这是第一次我们发现编译器是如此得容易理解，和整个DOOM3源代码一样。这太神奇了。当我们探究DOOM3源代码时，我们忍不住会喊：喔，这太漂亮了！

**总结**

即使DOOM3选择了很基础的设计，但它的设计者所做的决定都是为了开发者能更多的关注游戏逻辑本身，并且为所有技术层面的东西提供便利。这提高了多大的生产力啊。

无论何时使用“带类的C”，你应该明白你自己在干什么。你必须像DOOM3的开发专家一样。但不推荐初学者忽视现代C++建议而冒险。

