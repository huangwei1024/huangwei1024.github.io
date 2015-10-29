---
layout: post
title: Number Theory 4.4 Factorial Factors
categories: algorithm
tags: [concrete_mathematics, number_theory, reading_notes]
description: 具体数学 数论 4.4 阶乘 因数分解
keywords: 具体数学, 数论, 阶乘, 因数分解
date: 2007-08-23
---

$$n^{n/2} <= n! <= \frac{(n+1)^n}{2^n}$$

这个公式说明阶乘是以指数律增长。
对于大的$n$，我们能用Stirling公式来精确近似$n!$。

$$n!\sim \sqrt{2\pi n}\left (\frac{n}{2} \right)^n$$

误差是 $\frac{1}{12n}$。

$$
\begin{array}{|c|c|c|}  & 1\;2\;3\;4\;5\;6\;7\;8\;9\;10  & \text {powers of 2} \\\\
\hline
\text {divisible by 2} & \;\;x\;\;\;x\;\;\;x\;\;\;x\;\;\;x & 5=\left \lfloor 10/2 \right \rfloor\\\\
\text {divisible by 4} & \;\;\;\;\;\;x\;\;\;\;\;\;\;\;x\;\;\;\; & 2= \left \lfloor 10/4 \right \rfloor\\\\
\text {divisible by 8} & \;\;\;\;\;\;\;\;\;\;\;\;\;\;\;\;x\;\;\;\; & 1 = \left \lfloor 10/8 \right \rfloor\\\\
\hline
\textbf {powers of 2} & \mathbf{0\;1\;0\;2\;0\;1\;0\;3\;0\;1} & \mathbf{8}
\end{array}
$$

从该表中，我们能得出对 $n!$求$m$的幂的迭代算法。

$$\epsilon _2(n!)=n-\nu _2(n)$$

特殊的，对于2的幂次来说，$n!$的2幂次等于$n$减去它本身二进制中1的个数。