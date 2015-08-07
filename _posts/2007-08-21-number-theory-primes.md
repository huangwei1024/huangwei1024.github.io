---
layout: post
title: Number Theory 4.2 Primes
categories: algorithm
tags: concrete_mathematics number_theory reading_notes
description: 具体数学 数论 4.2 素数
keywords: 具体数学, 数论, 素数
---

任何正整数$n$都能记为素数乘积。

$$n = p_1p_2\cdots p_m = \prod pk\ (1<=k<=m, p1<=\cdots<=pm) $$
 
而且这个展开序列是**唯一**的。

假定一个数$m$可以用素数序列$\<m1,m2,...\>$表示

$k = mn \Leftrightarrow   k_p = m_p + n_p$，对所有的p

而 $m/n \Leftrightarrow mp <= np$ ，对所有的p

那就可知

$k = gcd(m, n) \Leftrightarrow kp = min(mp, np)$ ，对所有的p 

$k = lcm(m, n) \Leftrightarrow kp = max(mp, np)$ ，对所有的p 

如果素数$p$能除尽$mn$，则根据因子分解定理，一定有$p/m$或$p/n$，或者两者都能。但是合数就不行了。