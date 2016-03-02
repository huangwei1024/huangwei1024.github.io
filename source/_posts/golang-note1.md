---
layout: post
title: Golang笔记
categories: go
tags: [dev-log, go]
description: Golang笔记
keywords: golang, 笔记, map, slice, array, struct
date: 2016-03-02
---

[TOC]

整理的有点乱，都是开发中遇到的问题和网上看到好文章的记录，作为知识点保存下。

## Array和Slice

### 声明和初始化<i class="fa fa-star"></i>

[Array定义](https://golang.org/ref/spec#Array_types):

> ArrayType   = "[" ArrayLength "]" ElementType .
> 
> ArrayLength = Expression .
> 
> ElementType = Type .

在 Go 语言中数组是**固定长度**的数据类型。一旦数组被声明了，那么它的数据类型跟长度都不能再被改变。如果你需要更多的元素，那么只能创建一个你想要长度的新的数组，然后把原有数组的元素拷贝过去。

<!--more-->

例子

``` go
// 声明一个长度为5的整数数组
var array [5]int

// 声明一个长度为5的整数数组
// 初始化每个元素
array := [5]int{7, 77, 777, 7777, 77777}

// 通过初始化值的个数来推导出数组容量, ...在这里表示自动推导
array := [...]int{7, 77, 777, 7777, 77777}

// 声明一个长度为5的整数数组
// 为索引为1和2的位置指定元素初始化
// 剩余元素为0值
array := [5]int{1: 77, 2: 777}
```

[Slice定义](https://golang.org/ref/spec#Slice_types):

> SliceType = "[" "]" ElementType .

slice 是一种可以**动态数组**，可以按我们的希望增长和收缩。它跟Array声明的区别就在于`[]`里面是空的。两者在机制上的区别，Array更像是块线性存储区，Slice像Array的引用并加上长度和容量的管理。

例子

``` go
// 创建一个长度和容量都是 5的slice
slice := []string{"Red", "Blue", "Green", "Yellow", "Pink"}

// 创建一个有100个元素的空的字符串 slice
slice := []string{99: ""}

// 创建一个容量为5，长度为3的slice	
slice := make([]int, 3, 5)

```

#### nil 和 empty

``` go
// 光声明，不初始化，slice就是nil
var slice []int

// 使用make或字面值创建，slice是empty的
silce := make([]int, 0)
slice := []int{}
```

不管我们用 nil slice 还是 empty slice，内建函数 `append`，`len`和`cap`的工作方式完全相同。

#### append

``` go
func append(slice []Type, elems ...Type) []Type
```

如果slice的所引用的存储区容量够大，返回的slice就是本身。如果容量不够，Go底层会新分配一块存储区，并复制和添加相关数据到新存储区。所以`append`后一定要使用它的返回值。

``` go
slice = append(slice, elem1, elem2)
slice = append(slice, anotherSlice...)
```

特殊得，byte slice添加string也是合法的。

``` go
slice = append([]byte("hello "), "world"...)
```

注意string后面的`...`，相当与是对string的解包，相关的概念在Python和Lua等动态型语言里也有。

#### 存储机制理解

看这么几个图就明白了。

Array结构

![Array](http://blog.golang.org/go-slices-usage-and-internals_slice-array.png)

Slice结构

![Slice Struct](http://blog.golang.org/go-slices-usage-and-internals_slice-struct.png)

Slice表示

![Slice](http://blog.golang.org/go-slices-usage-and-internals_slice-1.png)

``` go
a := make([]int, 0, 5)
b := a[:5]

a = append(a, 1)
fmt.Println(a) // [1]

b[1] = 2
fmt.Println(a) // [1]
fmt.Println(b) // [1 2 0 0 0] a和b是同个存储区

b[0] = 3
fmt.Println(a) // [3]
fmt.Println(b) // [3 2 0 0 0] a和b是同个存储区

b = append(b, 4)
fmt.Println(b) // [3 2 0 0 0 4] b新建存储区

b[0] = 5
fmt.Println(a) // [3]
fmt.Println(b) // [5 2 0 0 0 4] 从此a和b是路人
```

http://dwz.cn/2Pcjro

### 函数传递<i class="fa fa-star"></i>

Array作为固定长度的存储区，作为参数传递时，它的行为代价是昂贵的。

``` go
var array [1e6]int
foo(array)
func foo(array [1e6]int) {
  ...
}
```

每一次 `foo` 被调用，8兆内存将会被分配在栈上。一旦函数返回，会弹栈并释放内存，每次都需要8兆空间。

当然可以传指针来解决这个问题。

``` go
var array [1e6]int
foo(&array)
func foo(array *[1e6]int){
  ...
}
```

但你在函数中改变指针指向的值，那么原始数组的值也会被改变。

而传递Slice是很廉价的。

``` go
fmt.Println(unsafe.Sizeof([]int{})) // size 24
```

深度阅读参考：

1. [Arrays, slices (and strings): The mechanics of 'append'](http://blog.golang.org/slices)
2. [Go Slices: usage and internals](http://blog.golang.org/go-slices-usage-and-internals)

## Map

### 声明和初始化<i class="fa fa-star"></i>

map 是一种**无序**的键值对的集合。 map 是使用 hash 表来实现的。

``` go
// 通过 make 来创建
dict := make(map[string]int)

// 通过字面值创建
dict := map[string]string{"Red": "#da1337", "Orange": "#e95a22"}
```

使用字面值是创建 map 惯用的方法。

### 键值比较<i class="fa fa-star"></i><i class="fa fa-star"></i>

C++的`std::map`支持自定义类型作为键值，只要重载`operator<`即可。在Go里也有类似概念，但Go没有操作符重载，并且map用hash实现的，所以键值比较是靠`==`操作符。

除了内建类型，struct类型的`==`比较是逐个比较相应字段，只要相应字段都可比较那struct也就是可比较的。如slice，function是不可比较的，那包含 slice 的 struct 类型也不可以作为 map 的键，否则会编译错误。

``` go
dict := map[[]string]int{}
Compiler Exception:
invalid map key type []string
```



## struct{}用途<i class="fa fa-star"></i><i class="fa fa-star"></i><i class="fa fa-star"></i>

参考[The empty struct](http://dave.cheney.net/2014/03/25/the-empty-struct)里的说明。

比如Go没有内置Set实现，我们会用map来模拟，那`map[int]bool`和`map[int]struct{}`哪个好？

``` go
var b bool
var s struct{}
var i interface{} = s
fmt.Println(unsafe.Sizeof(b)) // prints 1
fmt.Println(unsafe.Sizeof(s)) // prints 0
fmt.Println(unsafe.Sizeof(i)) // prints 16
```

http://dwz.cn/2PcWLF

基于上述struct{}对内存友好，优于`bool`和`interface{}`，我们可以优雅的实现Set。

``` go
type Empty struct{}
var empty Empty

mm := make(map[int]Empty)
mm[1] = empty
```

另外，类似的还有，channel用来传递信号可以定义为`chan struct {}`

请注意struct{}有这么一个坑，结果和直觉有点不符。

``` go
var a, b struct{}
fmt.Println(&a == &b) // true
```

``` go
a := make([]struct{}, 10)
b := make([]struct{}, 20)
fmt.Println(&a == &b)       // false, a and b are different slices
fmt.Println(&a[0] == &b[0]) // true, their backing arrays are the same
```

## reflect.DeepEqual<i class="fa fa-star"></i><i class="fa fa-star"></i>

如果有两个map，内容都一样，只有顺序不同。

``` go
m1:=map[string]int{"a":1,"b":2,"c":3};
m2:=map[string]int{"a":1,"c":3,"b":2};
```

我们怎么判断二者是否一致呢？

如果你打算这么写：

``` go
fmt.Println("m1==m2",m1==m2)
```

这是行不通的，Go没有重写map的==操作符，编译器会报告错误：

``` go
 invalid operation: m1 == m2 (map can only be compared to nil)
```

Go的反射包中有一个巨好用的武器reflect.DeepEqual,可以方便解决这个问题。

http://dwz.cn/2PdMHG



持续更新中ing...