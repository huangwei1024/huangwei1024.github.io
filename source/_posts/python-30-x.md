---
layout: post
title: 30 行 Python 代码搞定 X 算法
categories: algorithm
tags: [game, random, algorithm, distribution]
description: 30 行 Python 代码搞定 X 算法
keywords: Python, 数独, 游戏, 算法
date: 2014-07-22
---

这篇文章是在没有搭建这个Blog之前帮jobbole翻译的，现在只是复制回来自己做个存档，[jobbole链接在这](http://blog.jobbole.com/74000/)。

----------


假如你对数独解法感兴趣，你可能听说过[精确覆盖问题](http://zh.wikipedia.org/wiki/%E7%B2%BE%E7%A1%AE%E8%A6%86%E7%9B%96%E9%97%AE%E9%A2%98)。给定全集 `X `和 `X `的子集的集合 `Y `，存在一个 Y 的子集 Y*，使得 Y* 构成 X 的一种分割。

这儿有个Python写的例子。

```py
X = {1, 2, 3, 4, 5, 6, 7}
Y = {
    'A': [1, 4, 7],
    'B': [1, 4],
    'C': [4, 5, 7],
    'D': [3, 5, 6],
    'E': [2, 3, 6, 7],
    'F': [2, 7]}
```

这个例子的唯一解是`['B', 'D', 'F']。`

精确覆盖问题是NP完备<span style="color: #888888;">（译注：指没有任何一个够快的方法可以在合理的时间内，意即多项式时间 找到答案）</span>。[X算法](http://en.wikipedia.org/wiki/Knuth%27s_Algorithm_X)是由大牛高德纳发明并实现。他提出了一种高效的实现技术叫[舞蹈链](http://en.wikipedia.org/wiki/Dancing_Links)，使用双向链表来表示该问题的矩阵。

然而，舞蹈链实现起来可能相当繁琐，并且不易写地正确。接下来就是展示Python奇迹的时刻了！有天我决定用Python来编写`X `算法，并且我想出了一个有趣的舞蹈链变种。

## 算法

主要的思路是使用字典来代替双向链表来表示矩阵。我们已经有了 `Y`。从它那我们能快速的访问每行的列元素。现在我们还需要生成行的反向表，换句话说就是能从列中快速访问行元素。为实现这个目的，我们把X转换为字典。在上述的例子中，它应该写为

```py
X = {
    1: {'A', 'B'},
    2: {'E', 'F'},
    3: {'D', 'E'},
    4: {'A', 'B', 'C'},
    5: {'C', 'D'},
    6: {'D', 'E'},
    7: {'A', 'C', 'E', 'F'}}
```

眼尖的读者能注意到这跟Y的表示有轻微的不同。事实上，我们需要能快速删除和添加行到每列，这就是为什么我们使用集合。另一方面，高德纳没有提到这点，实际上整个算法中所有行是保持不变的。

以下是算法的代码。

```py
def solve(X, Y, solution=[]):
    if not X:
        yield list(solution)
    else:
        c = min(X, key=lambda c: len(X[c]))
        for r in list(X[c]):
            solution.append(r)
            cols = select(X, Y, r)
            for s in solve(X, Y, solution):
                yield s
            deselect(X, Y, r, cols)
            solution.pop()

def select(X, Y, r):
    cols = []
    for j in Y[r]:
        for i in X[j]:
            for k in Y[i]:
                if k != j:
                    X[k].remove(i)
        cols.append(X.pop(j))
    return cols

def deselect(X, Y, r, cols):
    for j in reversed(Y[r]):
        X[j] = cols.pop()
        for i in X[j]:
            for k in Y[i]:
                if k != j:
                    X[k].add(i)
```

真的只有 30 行！

## 格式化输入

在解决实际问题前，我们需要将输入转换为上面描述的格式。可以这样简单处理
<pre class="brush: python; gutter: false">X = {j: set(filter(lambda i: j in Y[i], Y)) for j in X}</pre>

但这样太慢了。假如设 X 大小为 m，Y 的大小为 n，则迭代次数为 m*n。在这例子中的数独格子大小为 N，那需要 N^5 次。我们有更好的办法。

```py
X = {j: set() for j in X}
for i in Y:
    for j in Y[i]:
        X[j].add(i)
```

这还是 O(m*n) 的复杂度，但是是最坏情况。平均情况下它的性能会好很多，因为它不需要遍历所有的空格位。在数独的例子中，矩阵中每行恰好有 4 个条目，无论大小，因此它有N^3的复杂度。

## 优点

*   **简单: **不需要构造复杂的数据结构，所有用到的结构Python都有提供。
*   **可读性: **上述第一个例子是直接从[Wikipedia上的范例](http://en.wikipedia.org/wiki/Exact_cover#Detailed_example)直接转录下来的！
*   **灵活性: **可以很简单得扩展来解决数独。

## 求解数独

我们需要做的就是把数独描述成精确覆盖问题。[这里](http://www.cs.mcgill.ca/~aassaf9/python/sudoku.txt)有完整的数独解法代码，它能处理任意大小，3x3，5x5，即使是2x3，所有代码少于100行，并包含doctest！（感谢Winfried Plappert 和 David Goodger的评论和建议）

