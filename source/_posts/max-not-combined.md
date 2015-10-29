---
layout: post
title: 关于数论中的互质数的最大不能组合数
categories: algorithm
tags: [number_theory, acm]
description: 关于数论中的互质数的最大不能组合数 acm icpc hdoj 1792 A New Change Problem
keywords: 数论, 互质, 最大不能组合数
date: 2007-08-30
---

最近看数论，转头重新思考了这题，参考了下论文和lrj的黑书，重新证明一遍，做个笔记。

例题：HDOJ 1792 A New Change Problem
题意：给定A和B，A和B互质，求最大不能组合数，和不能组合数的个数。

基础知识：
$$\gcd(A, B) = 1 \Rightarrow \operatorname{lcm}(A, B) = AB$$

剩余类，把所有整数划分成$m$个等价类，每个等价类由相互同余的整数组成

任何数分成$m$个剩余类，分别为 $mk，mk+1，mk+2，\cdots，mk+(m-1)$
分别记为$\\{0(\mod m)\\}，\\{1(\mod m)\\}$

而$n$的倍数肯定分布在这$m$个剩余类中

因为$\gcd(m，n)=1$，所以每个剩余类中都有一些数是$n$的倍数，并且是平均分配它的旁证，可见HDOJ 1222 Wolf and Rabbit

设 $k_{min} = \min \\{ k \mid nk \in \\{i (\mod m)\\} \\},~ i \in [0, m)$

则 $nk_{min}$ 是$\\{i (mod m)\\}$中$n$的最小倍数。特别的，$nm \in \\{0 (\mod m)\\}$

$nk_{min}$ 是个标志，它表明$\\{i (\mod m)\\}$中$nk_{min}$ 后面所有数，即$nk_{min} + jm$必定都能被组合出来

那也说明最大不能组合数必定小于$nk_{min}$

我们开始寻找$\max\\{ nk_{min} \\}$

$\operatorname{lcm}(m, n) = mn$，所以很明显$(m-1)n$是最大的

因为$(m-1)n$是$nk_{min}$ 中的最大值，所以在剩下的$m-1$个剩余类中，必定有比它小并且能被$m$和$n$组合，这些数就是$(m-1)n -1，(m-1)n -2，\cdots，(m-1)n -(m-1)$

所以最大不能被组合数就是$(m-1)n -m$

如果$m$和$n$不互素，那$\\{1 (\mod m)\\}$不能被$m$组合，同样也不能被$n$和$m$组合

我们能求出各个剩余类的$nk_{min}$之后，不能组合数的个数就是每个剩余类中小于各自$nk_{min}$的数的个数总和。

观察如下：
M = 5，N = 3

- {0(mod 5)}：**0**，5，10，15……
- {1(mod 5)}：`1`，**6**，11，16……
- {2(mod 5)}：`2`，`7`，**12**，17……
- {3(mod 5)}：**3**，8，13，18……
- {4(mod 5)}：`4`，**9**，14，19……

红色的就是不能组合数，可以看出在剩余类中它的数目有规律
Total = [0+1+2] + [0+1]

因为$m$和$n$互质，必有一个不完全周期

整理以后，可得公式 $Total = (n-1)*(m-1)/2$
 
```cpp
#include <cstdio>

int main()
{
    int a,b;
    while (scanf("%d %d",&a,&b)==2) {
        printf("%d %d ", (a-1)*b - (a-1) -1,(a-1)*(b-1)/2);
    }
}
```