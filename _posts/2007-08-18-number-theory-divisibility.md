---
layout: post
title: Number Theory 4.1 Divisibility
categories: algorithm
tags: concrete_mathematics number_theory reading_notes
description: 具体数学 数论 4.1 可除性
keywords: 具体数学, 数论, 可除性
---


最熟悉的一个概念，最大公约数gcd，$k/m$ 表示$k$能除尽$m$

注意“$k$能除尽$m$”和“$m$是$k$的倍数”并不完全一样，如$k=0$


> $gcd(m, n) = max\left \\{k \mid k/m\ and\ k/n \right \\};$ ①


欧几里德算法的递归形式：

> $gcd(0, n) = n;$ 	
> $gcd(m, n) = gcd(n\%m, m); m > 0$ ②


还有一种扩展形式：

> $xm + yn = gcd(m, n);$

这个x，y得出有个很美妙的递归求法。

假定 $n>m>=0，x_1m + y_1n = gcd(m, n);$
> 1）当$m=0$时，$x_1=0，y_1=1$是它其中的一组可能解。
> 
> 2）假设 $r=n\%m$，则有 $gcd(r, m) = x_2r + y_2m;$

根据②可知 $gcd(r, m) = gcd(m, n);$

则有 $x_1m + y_1n = x_2r + y_2m;$ ③

因为 $r = n\%m = n - [n/m]m;$

③可得 $x_1m + y_1n = x_2(n - [n/m]m) + y_2m = x_2n + (y_2 - [n/m]x_2)m;$

则有解 $y_1 = x_2;  x_1 = y_2 - [n/m]x_2;$

可以看出$x_2$, $y_2$交叉赋值给$y_1$, $x_1$。

这样就得到了扩展欧几里德算法。

```cpp
// extended_euclid(m, n) = mx + ny
int extended_euclid(int m, int n, int &x, int &y)
{
    if(m == 0) {
        x = 0;
        y = 1;
        return n;
    }
    int gcd = extended_euclid(n%m ,m ,y ,x);
    x -= n/m * y;
    return gcd;
}
```
 
还有个公式就是

$$\sum a_m=\sum a_{n/m}\ (n > 0, m/n)$$

还不大清楚它的用途，下次碰到了再看下吧。
