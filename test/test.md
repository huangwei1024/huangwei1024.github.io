---
layout: post
title: Bloom Filter 原理与应用
categories: algorithm
tags:  bloom filter
description: Bloom Filter是一种简单的节省空间的随机化的数据结构，支持用户查询的集合。
keywords: bloom filter, hash
---

每个元素，用k个哈希函数计算出大小为k的哈希向量 $ (H_{1},H_{2}\cdots ,H_{k}) $
，将向量里的每个哈希值对应的位设置为1。时间复杂度为 $ k\cdot O(F_{H}) $，一般字符串哈希函数的时间复杂度也就是$ O(n) $。

