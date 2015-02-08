---
layout: post
title: Bloom Filter 原理与应用
categories: algorithm
tags:  bloom filter
description: Bloom Filter是一种简单的节省空间的随机化的数据结构，支持用户查询的集合。
keywords: bloom filter, hash
---

这篇是从[老blog](http://www.cppblog.com/huangwei1024/archive/2010/11/17/133869.html)里复制出来，用markdown格式更新了下，纯当练手。

## 介绍
----------

Bloom Filter是一种简单的节省空间的随机化的数据结构，支持用户查询的集合。一般我们使用STL的`std::set`, `stdext::hash_set`，`std::set`是用红黑树实现的，`stdext::hash_set`是用桶式哈希表。上述两种数据结构，都会需要保存原始数据信息，当数据量较大时，内存就会是个问题。如果应用场景中允许出现一定几率的误判，且不需要逆向遍历集合中的数据时，Bloom Filter是很好的结构。

### 优点
- 查询操作十分高效。
- 节省空间。
- 易于扩展成并行。
- 集合计算方便。
- 代码实现方便。
- 有误判的概率，即存在False Position。
- 无法获取集合中的元素数据。
- 不支持删除操作。

### 缺点
- 有误判的概率，即存在False Position。
- 无法获取集合中的元素数据。
- 不支持删除操作。

<!--more-->

## 定义
----------

Bloom Filter是一个有m位的位数组，初始全为0，并有k个各自独立的哈希函数。





### 添加操作

每个元素，用k个哈希函数计算出大小为k的哈希向量 $ (H_{1},H_{2}\cdots ,H_{k}) $
，将向量里的每个哈希值对应的位设置为1。时间复杂度为 $ k\cdot O(F_{H}) $，一般字符串哈希函数的时间复杂度也就是$ O(n) $。

