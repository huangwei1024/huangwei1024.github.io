---
layout: post
title: Number Theory 4.3 Prime Examples
categories: algorithm acm
tags: concrete_mathematics number_theory reading_notes
description: 具体数学 数论 4.3 素数 例子
keywords: 具体数学, 数论, 素数
---

存在无限多个素数，欧几里德递归证明：

$$P_n = P_1P_2\cdots  P_{n-1} + 1, (n>=1) $$

前 $n-1个$素数中没有能除尽 $P_n$的，因为都每个能除尽 $P_{n-1}$。

形如：$2^p-1$ （$p$是素数）的数称为Mersenne numbers，中文名为梅森数

如果该梅森数也是素数的话，就叫梅森素数。

**如果 $n$是合数，则数 $2^n-1$不可能是素数。**

证明为：$2^{km} - 1 = (2^m -1)(2^{m(k-1)} + 2^{m(k-2)} + \cdots + 1)$

**但当 $p$是素数时，$2^p -1$不总是素数。**

如最小的非梅森数 $2^{11} -1 = 2047 = 23*89$

[http://acm.zju.edu.cn/show_problem.php?pid=2400](http://acm.zju.edu.cn/show_problem.php?pid=2400)
 
有个渐近公式，第 $k$个素数$P_k \approx  k \ln k$

这意味着当$k\rightarrow \infty , \frac{P_k}{k \ln k} \rightarrow  1$

则类似的可以推出 $\pi (x)$表示不超过 $x$的素数个数，$\pi (x) \approx  \frac{x}{\ln k}$

当 $n$或 $x$趋向无穷大时，有更精确的估计函数。

$$
\begin{array}{ll}
\ln x - \frac{3}{2} <\, \frac{x}{\pi (x))} <\, \ln x - \frac{1}{2},  &\text{ for } x>=67; \\\\
n(\ln n + \ln \ln n -\frac{3}{2}) <\, P_n <\, n(\ln n + \ln \ln n - \frac{1}{2}), & \text{ for } n>=20; 
\end{array}
$$

最后讲到了Eratoshenes筛法，这个太简单了，也不唠叨了~