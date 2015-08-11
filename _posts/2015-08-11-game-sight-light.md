---
layout: post
title: 视线和光线：如何给游戏添加 2D 可见性和阴影效果
categories: algorithm
tags: game 2d visibility sight
description: 视线和光线：如何给游戏添加 2D 可见性和阴影效果
keywords: 算法, 游戏开发, 阴影, 可见性
---

这篇文章是在没有搭建这个Blog之前帮jobbole翻译的，现在只是复制回来自己做个存档，[jobbole链接在这](http://blog.jobbole.com/89193/)。

----------


各位好！今天，我将告诉你如何做这样的事情：（在框中四处移动你的鼠标）

<iframe src="http://ncase.me/sight-and-light/draft7.html" height="370" width="850"></iframe>

这种效果用于我新开发的开源游戏《[Nothing To Hide](http://nothingtohide.cc/)》。许多其他的 2D 游戏（如Monaco，Gish）也都有。如果按着本教程来实现……也许下个就是你的游戏！

![](http://ww4.sinaimg.cn/large/7cc829d3gw1eux6hz1uofj20nc06y3zz.jpg)

我将展示我在学习如何实现这种效果过程中的步骤和所发生的错误。首先，给一些样板代码。下面只是演示绘制了一堆线段并跟踪鼠标位置。（注：有四个线段为边框）

<iframe src="http://ncase.me/sight-and-light/draft0.html" height="370" width="650"></iframe>

接下来介绍数学知识。别担心，这里只是复习下入门的代数而已。

我们需要找出射线和所有线段的最近交叉点。任何线段可以被写成参数形式：
<pre class="brush: c; gutter: false">点 + 方向 * T</pre>

这儿我们给出 4 组方程来描述射线和线段的 x 和 y 变量：
<pre class="brush: c; gutter: false">射线 X = r_px+r_dx*T1
射线 Y = r_py+r_dy*T1
线段 X = s_px+s_dx*T2
线段 Y = s_py+s_dy*T2</pre>

注：在我们做任何事情之前，请检查以确保射线和线段不是平行的，也就是说，它们的方向是不一样的。如果它们是平行的，那就没有交集。好了，继续。

如果射线和线段相交，其 x 和 y 变量是相同的：
<pre class="brush: c; gutter: false">r_px+r_dx*T1 = s_px+s_dx*T2
r_py+r_dy*T1 = s_py+s_dy*T2</pre>

我们做个小小的符号移位来求解 T1 和 T2
<pre class="brush: c; gutter: false">// Isolate T1 for both equations, getting rid of T1
// 从两个等式中独立出T1，移去T1
 T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy

// Multiply both sides by r_dx * r_dy
// 两边同乘上 r_dx * r_dy
s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx

// Solve for T2!
// 解出T2！
T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)

// Plug the value of T2 to get T1
// 代入T2，解出T1
T1 = (s_px+s_dx*T2-r_px)/r_dx</pre>

确保 T1&gt;0 并且 0&lt;T2&lt;1。如果不是，则可认为射线和线段没有交点，不可能有交集。但如果是，那太好了！你已经找到了一个交点。现在只要使用同一条射线与其它线段进行计算，就能找到最近的交点。（这个值就是最小T1值）

这就是所有的数学知识了：（将鼠标移到下面的框里）

<iframe src="http://ncase.me/sight-and-light/draft1.html" height="370" width="650"></iframe>

哇！现在用这些东西让我们找一些乐子！我投了50条向各个方向的光线：

<iframe src="http://ncase.me/sight-and-light/draft2.html" height="370" width="650"></iframe>

于是我想，我可以简单地连接这些射线与线段的点，就能获得不错的可见性多边形。但是，最终它看起来像......

<iframe src="http://ncase.me/sight-and-light/draft3.html" height="370" width="650"></iframe>

织网。但这并不重要，即使我使用360条射线来模拟360度，它仍然看上去很不靠谱。这是我最大的绊脚石，直到我意识到我不可能四面八方都投射到。我只需投射到线段的两端点。对每一个（唯一的）线段端点，朝它直接投射射线，再加上两条偏移为+/- 0.00001弧度的射线。这两条额外的射线会打在给定线段后面的墙上。

<iframe src="http://ncase.me/sight-and-light/draft4.html" height="370" width="650"></iframe>

接下来，按照射线的角度对交点进行排序。这让我可以简单地按顺时针方向连接各个点，并绘制出平滑的可见性多边形，比如这样的：

<iframe src="http://ncase.me/sight-and-light/draft5.html" height="370" width="650"></iframe>

终于来了！为了实际上看起来更好些。为了绘制额外的可见性多边形，我们再在位置上稍微偏移投射射线，可以创造出“模糊”阴影，像下面一样。红点表示11原点 - 是的，这有11个可见性多边形！

<iframe src="http://ncase.me/sight-and-light/draft6.html" height="370" width="650"></iframe>

当这一切完成后，我画了这两张图像...

![](http://ww4.sinaimg.cn/large/7cc829d3gw1eux6hyagcuj20nc0a0mxi.jpg)

![](http://ww3.sinaimg.cn/large/7cc829d3gw1eux6hxmtltj20nc0a0t98.jpg)

...并混合在一起，利用模糊阴影作为一个alpha遮罩。我已经向您展示了跟页面顶部相似的令人毛骨悚然的画面，只不过这里是一个不同的迭代，用了多个光源。

<iframe src="http://ncase.me/sight-and-light/draft8.html" height="370" width="850"></iframe>

多个光源。投射阴影。一个巨大的激光炸弹。显示出你的主角/敌人看的到或看不到的区域。2D可见性/照明效果可以非常灵活得进行合适的创意，可以为您的游戏增加很多额外的魅力。

### 要有光

*完全是一个技术术语 （译者注：原本是圣经创世纪里的一句话）

作者的开源地址：[https://github.com/ncase/sight-and-light](https://github.com/ncase/sight-and-light)