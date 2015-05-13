---
layout: post
title: 现代OpenGL教程 01 - 入门指南
categories: develop
tags: opengl tutorials
description: 现代OpenGL在Xcode，Visual C++和Linux下的入门指南
keywords: 现代, OpenGL, 教程, 入门指南
---

<p align="center">
    <img src="{{ site.cdn.link }}/static/img/opengl-tutorials/modern-opengl-01.png" width="60%">
</p>

# 译序

## 译序

### 译序

早前学OpenGL的时候还是1.x版本，用的都是`glVertex`，`glNormal`等固定管线API。后来工作需要接触DirectX9，shader也只是可选项而已，跟固定管线一起混用着。现在工作内容是手机游戏，又转到OpenGL ES，发现OpenGL的世界已经完全不同了，OpenGL ES 2.0版本开始就不再支持固定管线，只支持可编程管线。

![]({{ site.cdn.link }}/static/img/opengl-tutorials/pipe2.0.png)

国内很多资料教程参差不齐，旧式接口满天飞。在[知乎](http://www.zhihu.com/question/22005157)看到这一系列教程，觉着挺好，就想着一边学顺便翻译下。毕竟手游市场的机遇和竞争压力都在同比猛涨，多了解OpenGL ES肯定没有坏处。浮躁功利的环境下更需要怀着一颗宁静致远的心去提高自身功底，长路漫漫，与君共勉。

<!--more-->

欢迎大家，这是现代OpenGL教程系列的第一篇。所有代码都是开源的，你可以在GitHub上下载：[https://github.com/tomdalling/opengl-series](https://github.com/tomdalling/opengl-series)

通过这篇教程，你将会学到如何在Windows下用Visual Studio 2013或Mac下用Xcode搭建OpenGL 3.2工程。该应用包含一个顶点着色器（vertex shader），一个片段着色器（fragment shader）和使用VAO和VBO来绘制的三角形。该工程使用[GLEW](http://glew.sourceforge.net/)来访问OpenGL API，用[GLFW](http://www.glfw.org/)来处理窗口创建和输入，还有使用[GLM](http://glm.g-truc.net/)进行矩阵/矢量相关的数学运算。

这听上去有点无聊，但搭建这样的工程确实挺麻烦的，尤其对于初学者。只要解决完这问题，我们就可以开始玩些有趣的东西了。

[TOC]

## 获取代码

所有例子代码的zip打包可以从这里获取：[https://github.com/tomdalling/opengl-series/archive/master.zip](https://github.com/tomdalling/opengl-series/archive/master.zip)。

这一系列文章中所使用的代码都存放在：[https://github.com/tomdalling/opengl-series](https://github.com/tomdalling/opengl-series)。你可以在页面中下载zip，加入你会git的话，也可以复制该仓库。

本文代码你可以在<code>[source/01_project_skeleton](https://github.com/tomdalling/opengl-series/tree/master/source/01_project_skeleton)</code>目录里找到。使用OS X系统的，可以打开根目录里的`opengl-series.xcodeproj`，选择本文工程。使用Windows系统的，可以在Visual Studio 2013里打开`opengl-series.sln`，选择相应工程。

工程里已包含所有依赖，所以你不需要再安装或者配置额外的东西。如果有任何编译或运行上的问题，请联系我。

## 关于兼容性的提醒

本文使用OpenGL 3.2，但我会尝试保持如下兼容：

- 向后兼容OpenGL 2.1
- 向前兼容OpenGL 3.X和4.X
- 兼容Android和iOS的OpenGL ES 2.0

因为OpenGL和GLSL存在许多不同版本，本文代码不一定能做到100%上述兼容。我希望能兼容99%，并且不同版本之间只做轻微修改即可。

想要了解OpenGL和GLSL不同版本间的区别，这里很好得罗列了[兼容列表](http://web.eecs.umich.edu/~sugih/courses/eecs487/common/notes/APITables.xml)。

## Visual Studio下安装

代码在Windows 7 32位系统，[Visual Studio Express 2013](http://www.visualstudio.com/en-us/downloads/download-visual-studio-vs#DownloadFamilies_2)（免费）下创建和测试。你应该可以打开解决方案并成功编译所有工程。如果有问题请联系我，或者将补丁发我，我会更新工程。

## Xcode下安装

Xcode工程实在OSX 10.10系统，Xcode 6.1下创建并测试的。打开Xcode工程应该可以成功编译所有目标。加入你无法成功编译请联系我。

## Linux下安装

Linux是基于[SpartanJ](http://www.reddit.com/user/SpartanJ)。我在Ubuntu 12.04下简单测试通过。

- 安装GLM，GLFW和GLEW：
    `sudo aptitude install libglm-dev libglew-dev libglfw-dev`
- 进入工程目录：`cd platforms/linux/01_project_skeleto`
- 运行makefile：`make`
- 运行可执行文件：`bin/01_project_skeleton-debug`

## GLEW, GLFW和GLM介绍

现在你有了工程，就让我们开始介绍下工程所用到的开源库和为啥需要这些。

[The OpenGL Extension Wrangler (GLEW)](http://glew.sourceforge.net/)是用来访问OpenGL 3.2 API函数的。不幸的是你不能简单的使用`#include <GL/gl.h>`来访问OpenGL接口，除非你想用旧版本的OpenGL。在现代OpenGL中，API函数是在运行时（run time）确定的，而非编译期（compile time）。GLEW可以在运行时加载OpenGL API。

[GLFW](http://www.glfw.org/)允许我们跨平台创建窗口，接受鼠标键盘消息。OpenGL不处理这些窗口创建和输入，所以就需要我们自己动手。我选择GLFW是因为它很小，并且容易理解。

[OpenGL Mathematics (GLM)](http://glm.g-truc.net/)是一个数学库，用来处理矢量和矩阵等几乎其它所有东西。旧版本OpenGL提供了类似`glRotate`, `glTranslate`和`glScale`等函数，在现代OpenGL中，这些函数已经不存在了，我们需要自己处理所有的数学运算。GLM能在后续教程里提供很多矢量和矩阵运算上帮助。

在这系列的所有教程中，我们还编写了一个小型库`tdogl`用来重用C++代码。这篇教程会包含`tdogl::Shader`和`tdogl::Program`用来加载，编译和链接shaders。

## 什么是Shaders？

Shaders在现代OpenGL中是个很重要的概念。应用程序离不开它，除非你理解了，否则这些代码就没有任何意义。

<mark>Shaders是一段GLSL小程序，运行在**GPU**上而非CPU</mark>。它们使用[OpenGL Shading Language (GLSL)](http://en.wikipedia.org/wiki/GLSL)语言编写，看书去像C或C++，但却是另外一种不同的语言。使用shader就像你写个普通程序一样：写代码，编译，最后链接在一起才生成最终的程序。

Shaders并不是个很好的名字，因为它不仅仅只做着色。只要记得它们是个用不同的语言写的，运行在显卡上的小程序就行。

在旧版本的OpenGL中，shaders是可选的。在现代OpenGL中，为了能在屏幕上显示出物体，shaders是必须。

为可能近距离了解shaders和图形渲染管线，我推荐Durian Software的相关文章[The Graphics Pipeline chapter](http://duriansoftware.com/joe/An-intro-to-modern-OpenGL.-Chapter-1:-The-Graphics-Pipeline.html)。


| |主程序|Shader程序|
|:---|:---|:---|
|语言|C++|GLSL|
|主函数|int main(int, char**);|void main();|
|运行于|CPU|GPU|
|需要编译？|是|是|
|需要链接？|是|是|

那shaders实际上干了啥？这取决于是那种shader。

## Vertex Shaders

Vertex shader主要用来将点（x，y，z坐标）变换成不同的点。顶点只是几何形状中的一个点，一个点叫vectex，多个点叫vertices（发音为[ver-tuh-seez](http://static.sfdict.com/dictstatic/dictionary/audio/luna/V00/V0096700.mp3)）。在本教程中，我们的三角形需要三个顶点（vertices）组成。

Vertex Shader的GLSL代码如下：

```py
#version 150

in vec3 vert;

void main() {
    // does not alter the vertices at all
    gl_Position = vec4(vert, 1);
}
```

第一行`#version 150`告诉OpenGL这个shader使用GLSL版本1.50.

第二行`in vec3 vert;`告诉shader需要那一个顶点作为输入，放入变量`vert`。

第三行定义函数`main`，这是shader运行入口。这看上去像C，但GLSL中`main`不需要带任何参数，并且不用返回void。

第四行`gl_Position = vec4(vert, 1);`将输入的顶点直接输出，变量`gl_Position`是OpenGL定义的全局变量，用来存储vertex shader的输出。所有vertex shaders都需要对`gl_Position`进行赋值。

`gl_Position`是4D坐标（vec4），但`vert`是3D坐标（vec3），所以我们需要将`vert`转换为4D坐标`vec4(vert, 1)`。第二个的参数`1`是赋值给第四维坐标。我们会在后续教程中学到更多关于4D坐标的东西。但现在，我们只要知道第四维坐标是`1`即可，i可以忽略它就把它当做3D坐标来对待。

Vertex Shader在本文中没有做任何事，后续我们会修改它来处理动画，摄像机和其它东西。

## Fragment Shaders

```py
#version 150

out vec4 finalColor;

void main() {
    //set every drawn pixel to white
    finalColor = vec4(1.0, 1.0, 1.0, 1.0);
}
```



















