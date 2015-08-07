---
layout: post
title: Number Theory 4.5 Relative Primality
categories: algorithm
tags: concrete_mathematics number_theory reading_notes
description: 具体数学 数论 4.5 互素
keywords: 具体数学, 数论, 互素
---

当 $\gcd(m, n) = 1$时，我们称 $m$和$n$互素。

约定用 $m\bot n$来表示两者互素。

$$m / \gcd(m, n) \;\bot\; n / \gcd(m, n)$$

由 gcd和素数序列的关系我们可以得出

**$$k \bot m \text{  and  } k \bot n \Leftrightarrow  k \bot mn$$**

书上看到一种很好玩的一种构造算法。

用来构造所有具有 $m\bot n$的非负分数 $m/n$集合，称为Stem-Brocot tree。

建树思想是：
从两个分数$（0/1， 1/0）$开始，重复以下操作，在两个邻接的分数 $m/n$和 $m'/n'$之间插入 $(m+m')/(n+n')$。

![relative primality]({{ site.cdn.link }}/static/img/relative_primality.JPG)

这颗树构造能保证相同分数不会出现两次，基于以下事实：

如果在任何构造阶段 $m/n$和 $m'/n'$是相继的分数，则有 $m'n - mn' = 1$

证明：

开始时，$1*1 - 0*0 = 1$满足条件，计算出中间值 $(m+m')/(n+n')$后，

$
\begin{array}{l}
(m + m')n - m(n + n') = 1 ;\\\\
m'(n + n') - (m + m')n' = 1 ;
\end{array}
$

仍然等价于原方程式。

还有任何 a⊥b是否都能被表示出来？