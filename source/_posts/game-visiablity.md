---
layout: post
title: 游戏中的 2D 可见性
categories: algorithm
tags: [game, 2d, visibility]
description: 游戏中的 2D 可见性
keywords: 算法, 游戏开发, 2D, 可见性
date: 2015-04-28
---



<link rel="stylesheet" href="http://dn-huangweipro.qbox.me/static/2dvisibilitydemo/jquery-ui-1.8.19.custom.css">

这篇文章是在没有搭建这个Blog之前帮jobbole翻译的，现在只是复制回来自己做个存档，[jobbole链接在这](http://blog.jobbole.com/86268/)。

----------

2D的俯视图经常用于从给定点计算可视区域。例如，你可能想把某些东西隐藏在玩家看不见的地方，亦或你想知道点燃火炬后能看见什么地方。

拖动圆点转一圈，看看玩家都能看到些什么：



<div id="maze"><img class="placeholder" src="http://dn-huangweipro.qbox.me/static/2dvisibilitydemo/static-lightmap.png"></div>

这个算法也能计算出给定光源所照亮的区域。对每条光线，我们可以构建出被照亮区域的光线图。如果我们给上面的迷宫放上24个灯呢？见光线图。

roguelike<span style="color: #888888;">（译注：类地下城RPG游戏统称）</span>社区已经收集了[好几种算法](http://roguebasin.roguelikedevelopment.org/index.php/Category:FOV)，尤其是网格类的。消减算法是从可见的一切区域开始，减去不可见区域；添加算法是从不可见区域开始，加上可见区域。我将描述一种可工作于线段的添加算法，不仅仅是固体分块或者网格。

<!--more-->

## 光线投射

一个简单地方法是从中心点投射光线，这是得到一个近似解的合理的第一步：

<div id="diagram-raycast-interval" class="right"></div>

更聪明的是，让光线投射到所有墙体的开端和末端。这些光线所产生的三角形就是可见区域：

<div id="diagram-raycast-endpoints" class="right"></div>

就是这样！该算法如下：

1. 计算到墙体开始或结束的角度。
2. 从中心点沿各个角度投出光线。
3. 对这些光线所产生的三角形进行填充。

## 墙体跟踪

我们可以到此为止了，尤其是如果我们有一个快速光线投射算法，可使用空间哈希以避免与每一个墙体进行相交计算。然而，更有效的方法是将光线投射和墙体相交结合成一个算法。我将在这里描述了一种圆形扫描算法，对所有的击中点按角度进行排序; 它也可以扩展成圆形外扩算法，对所有的击中点按半径排序，但我还没有尝试过这种方法。

位于连续几个射线之间的区域，我们需要找到最近的墙。这面墙就被照亮了; 所有其他墙面应该被隐藏。我们的策略是360°扫描，处理所有的墙端点。当运行时，我们会持续跟踪与扫描线相交的墙壁。点击观看端点扫描：

<div class="right"><div id="diagram-sweep-points"></div></div>

下一步骤是将跟踪哪些墙壁会被扫描线穿过。只有最近的壁是可见的。你如何找出哪些墙壁是最近的？最简单的方法是计算从中心到墙的距离。然而，如果墙壁大小不同，这种方法不能很好地工作，所以演示中使用一个稍微复杂的方法，这里我就不解释了。

按PLAY可看到扫描中最近的墙面以白色绘制和其他墙面绘成黑色。

<div class="right"><div id="diagram-sweep-segments"></div></div>



每当最近的墙面终止，或者有新的墙面比其它的都近时，我们创建了一个三角形表示可见区域。这些三角形的并集就是所述中心点的可视区域。

``` py
var endpoints;      # 端点列表，按角度排序
var open = [];      # 墙面列表，按距离排序
loop over endpoints: #遍历 endpoints
    remember which wall is nearest #记住哪个墙面最近
    add any walls that BEGIN at this endpoint to 'walls' # 把所有以该端点开始的墙面添加到“墙面列表“中
    remove any walls that END at this endpoint from 'walls'# 把所有以该端点截止的墙面从“墙面列表“中删除
    SORT the open list #对open数组排序
if the nearest wall changed: #假如最近的墙面改变:
    fill the current triangle and begin a new one#填充当前三角形并且开始新的
```

需要注意的是创建一个三角形涉及到之前与扫描线相交的墙面。其结果是，三角形的新边缘可能长于或短于扫描线，并且该三角形最远的边缘比之前的墙面短。

## 试验场

这里有一块试验场，有很多可用的方块。可以拖拽方块到网格内。点击play/pause按钮可以查看算法运行，或者移动中心点查看哪些是可见的，就像玩家四处查看一样。

<div class="right"><div id="diagram-playground"></div></div>

<div id="haxe:trace"></div>



## 组合输出

我们可以使用集合运算以有趣的方式组合该算法的输出。这些也可被实现为用布尔运算分析输出，或者用位图操作渲染输出。

### 玩家视野

限制玩家的视野最简单的操作是将输出与有限的视野求交集。例如，相交算法使用圆圈来限制可见半径。与渐变填充圈相交，可使光按距离改变明暗。与圆锥相交可打造出“手电筒”效果，可以让你把前面看得更远，但没有相应视野在你身后（见随后[Dynamite Jack](http://www.tuaw.com/2012/04/16/phil-hasseys-anathema-mines-renamed-dynamite-jack-gets-a-trail/)的一个例子）。假如用双眼代替单点，玩家的视野也更好看。我希望你可以合并所有眼睛的可视区域，但我还没有试过。

### 地图物体

可见性也可用于计算哪些区域被火炬点亮。在页面的顶部演示了首先对每个火炬所点亮的区域进行求并集，然后与玩家可以看见的区域相交。（请注意，此算法会产生硬阴影，你将不得不对输出进行后处理来获得软阴影。）

同样的计算可用于确定哪些地区可被安全摄像头可以看到，有哪些被盾牌保护着，或者是否足够靠近某些魔法设施，使它赋予你属性加成或是诅咒。

### AI行为

可见性也可用于构建AI行为。例如，假设敌人的AI是想扔了一枚手榴弹击中玩家，也想站在玩家射击不到的地方。手榴弹需要足够近才能击中玩家，并且无法击中障碍物后面的。下图显示标注了AI单位的地图的可能计算：

<div class="right"><div id="grenade"></div></div>



手榴弹扔进紫色区域将成功击中一名玩家。黄色和紫色区域是危险区域; 玩家可以从那里攻击AI单位。AI需要站在一个安全的区域（深蓝色）并且投掷了一枚手榴弹到紫色区域，然后寻找掩体。如何计算掩体？在AI准备投掷手雷的地方再次运行可见性算法，让橱柜和桌子挡住视线。

## 实现

我已经用[HAXE 3](http://www.redblobgames.com/articles/visibility/Visibility.hx)来实现这个算法，使用Apache v2开源协议（类似MIT和BSD，它可以在商业项目中使用）。HAXE代码可以编译成JavaScript，ActionScript，C ++，Java，C#或PHP。我把它编译成JavaScript来制作这个网页，并为我的其他项目编译成Flash。我编译成以下语言：

* [Actionscript](http://www.redblobgames.com/articles/visibility/as3-version.zip) ; 可读，因为Actionscript和Haxe并非截然不同
* [Javascript](http://www.redblobgames.com/articles/visibility/output/_visibility.js)（用于此页面上的演示）; 大多是可读的。
* [Java](http://www.redblobgames.com/articles/visibility/java-version.zip) ; 轻度可读，但不是很好。
* [C#](http://www.redblobgames.com/articles/visibility/csharp-version.zip) ; 轻度可读，但不是很好。Roy Triesscheijn有一个更好的版本[在这里](http://roy-t.nl/index.php/2014/02/27/2d-lighting-and-shadows-preview/)。

Wade Tritschler建议[手工移植](http://www.redblobgames.com/articles/visibility/#comment-850486470)，所产生的代码要比使用Haxe输出的代码更干净。我同意这个观点。如果你手写代码还可以更好得了解该算法。尽管该算法主要在CPU中进行，可以使用GPU为位图进行三角形渲染和合并位图输出。（布尔AND操作可变成位图乘法;布尔OR操作可变成位图添加和钳位。）在我的项目中该性能已经足够，所以我还没有构建GPU版本。如果你的游戏有CPU限制，可以考虑使用消减算法（而不是这里显示的添加算法），渲染四边形的每条线段的影子。它会增加GPU渲染负载，但它并不需要在CPU上排序。如果填充率是一个问题，考虑渲染一个比游戏画面分辨率低的光度图，然后扩大它。

## 相关内容

[视觉和光线](http://ncase.me/sight-and-light/)覆盖了可见性的问题; 在我的[博客文章](http://simblob.blogspot.com/2012/07/2d-visibility.html)有更多的链接。[地平线问题](https://briangordon.github.io/2014/08/the-skyline-problem.html)类似2D可见性问题，但它在直角坐标系中，而不是极坐标。另外还有[美术馆问题](http://en.wikipedia.org/wiki/Art_gallery_problem)，关于放置多少个警卫就可以看到地图的每一个区域。我正Trello上创建了一份列表，[未来可能更新这个页面](https://trello.com/c/m0yhEv6U/37-visibility-version-2)。



<script type="text/javascript" src="http://dn-huangweipro.qbox.me/static/2dvisibilitydemo/jquery-1.7.2.min.js"></script>

<script type="text/javascript" src="http://dn-huangweipro.qbox.me/static/2dvisibilitydemo/jquery-ui-1.8.19.custom.min.js"></script>

<script type="text/javascript" src="http://dn-huangweipro.qbox.me/static/2dvisibilitydemo/visibility.js"></script>

<script type="text/javascript" src="http://dn-huangweipro.qbox.me/static/2dvisibilitydemo/demo-canvas.js"></script>