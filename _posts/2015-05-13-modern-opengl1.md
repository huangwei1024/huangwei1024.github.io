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

## 译序

早前学OpenGL的时候还是1.x版本，用的都是`glVertex`，`glNormal`等固定管线API。后来工作需要接触DirectX9，shader也只是可选项而已，跟固定管线一起混用着。现在工作内容是手机游戏，又转到OpenGL ES，发现OpenGL的世界已经完全不同了，OpenGL ES 2.0版本开始就不再支持固定管线，只支持可编程管线。

<!--more-->

<p align="center">
    <img src="{{ site.cdn.link }}/static/img/opengl-tutorials/pipe2.0.png" width="60%">
</p>

国内很多资料教程参差不齐，旧式接口满天飞。在[知乎](http://www.zhihu.com/question/22005157)看到这一系列教程，觉着挺好，就想着一边学顺便翻译下。毕竟手游市场的机遇和竞争压力都在同比猛涨，多了解OpenGL ES肯定没有坏处。浮躁功利的环境下更需要怀着一颗宁静致远的心去提高自身功底，长路漫漫，与君共勉。

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

<mark>Vertex shader主要用来将点（x，y，z坐标）变换成不同的点。</mark>顶点只是几何形状中的一个点，一个点叫vectex，多个点叫vertices（发音为[ver-tuh-seez](http://static.sfdict.com/dictstatic/dictionary/audio/luna/V00/V0096700.mp3)）。在本教程中，我们的三角形需要三个顶点（vertices）组成。

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

<mark>Fragment shader的主要功能是计算每个需要绘制的像素点的颜色。</mark>

一个"fragment"基本上就是一个像素，所以你可以认为片段着色器（fragment shader）就是像素着色器（pixel shader）。在本文中每个片段都是一像素，但这并不总是这样的。假如你更改了某个OpenGL设置，你可以得到比像素更小的片段，之后的文章我们会讲到这个。

本文所使用的fragment shader代码如下：

```py
#version 150

out vec4 finalColor;

void main() {
    //set every drawn pixel to white
    finalColor = vec4(1.0, 1.0, 1.0, 1.0);
}
```

再次，第一行`#version 150`告诉OpenGL这个shader使用的是GLSL 1.50。

第二行`finalColor = vec4(1.0, 1.0, 1.0, 1.0);`将输出变量设为白色。`vec4(1.0, 1.0, 1.0, 1.0)`是创建一个RGBA颜色，并且红绿蓝和alpha都设为最大值，即白色。

现在，就能用shader在OpenGL中绘制出了纯白色。在之后的文章中，我们还会加入不同颜色和贴图。贴图就是你3D模型上的图像。

## 编译和链接Shaders

在C++中，你需要对你的`.cpp`文件进行编译，然后链接到一起组成最终的程序。OpenGL的shaders也是这么回事。

在这篇文章中用到了两个可复用的类，是用来处理shaders的编译和链接：`tdogl::Shader`和`tdogl::Program`。这两个类代码不多，并且有详细的注释，我建议你阅读源码并且去链接OpenGL是如何工作的。

## 什么是VBO和VAO？

当shaders运行在GPU，其它代码运行在CPU时，你需要有种方式将数据从CPU传给GPU。在本文中，我们传送了一个三角的三个顶点数据，但在更大的工程中3D模型会有成千上万个顶点，颜色，贴图坐标和其它东西。

这就是我们为什么需要Vertex Buffer Objects (VBOs)和Vertex Array Objects (VAOs)。<mark>VBO和VAO用来将C++程序的数据传给shaders来渲染。</mark>

在旧版本的OpenGL中，是通过`glVertex`，`glTexCoord`和`glNormal`函数把每帧数据发送给GPU的。在现代OpenGL中，所有数据必须通过VBO在渲染之前发送给显卡。当你需要渲染某些数据时，通过设置VAO来描述该获取哪些VBO数据推送给shader变量。

## Vertex Buffer Objects (VBOs)

第一步我们需要从内存里上传三角形的三个顶点到显存中。这就是VBO该干的事。<mark>VBO其实就是显存的“缓冲区（buffers）” - 一串包含各种二进制数据的字节。</mark>你能上传3D坐标，颜色，甚至是你喜欢的音乐和诗歌。VBO不关心这些数据是啥，因为它只是对内存进行复制。

## Vertex Array Objects (VAOs)

第二步我们要用VBO的数据在shaders中渲染三角形。请记住VBO只是一块数据，它不清楚这些数据的类型。而告诉OpenGL这缓冲区里是啥类型数据，这事就归VAO管。

<mark>VAO对VBO和shader变量进行了连接。它描述了VBO所包含的数据类型，还有数据该传递给哪个shader变量。</mark>在OpenGL所有不准确的技术名词中，“Vertex Array Object”是最烂的一个，因为它根本没有解释VAO该干的事。

你回头看下本文的vertex shader（在文章的全面），你就能发现我们只有一个输入变量`vert`。在本文中，我们用VAO来说明“hi，OpenGL，这里的VBO有3D顶点，我想要你在vertex shader时，发三个顶点数据给vert变量。”

在后续的文章中，我们会用VAO来说“hi，OpenGL，这里的VBO有3D顶点，颜色，贴图坐标，我想要你在shader时，发顶点数据给vert变量，发颜色数据给vertColor变量，发贴图坐标给vertTexCoord变量。”

**给使用上个OpenGL版本的用户的提醒**

假如你在旧版本的OpenGL中使用了VBO但没有用到VAO，你可能会不认同VAO的描述。你会争论说“顶点属性”可以用`glVertexAttribPointer`将VBO和shaders连接起来，而不是用VAO。这取决于你是否认为顶点属性应该是VAO“内置（inside）”的（我是这么认为的），或者说它们是否是VAO外置的一个全局状态。3.2内核和我用的AIT驱动中，VAO不是可选项 - 没有VAO的封装`glEnableVertexAttribArray`, `glVertexAttribPointer`和`glDrawArrays`都会导致`GL_INVALID_OPERATION`错误。这就是为啥我认为顶点属性应该内置于VAO，而非全局状态的原因。[3.2内核手册](http://www.opengl.org/registry/doc/glspec32.core.20091207.pdf)也说VAO是必须的，但我只听说ATI驱动会抛错误。下面描述引用自[OpenGL 3.2内核手册](http://www.opengl.org/registry/doc/glspec32.core.20091207.pdf)

    所有与顶点处理有关的数据定义都应该封装在VAO里。
    一般VAO边界包含所有更改vertex array状态的命令，比如VertexAttribPointer和EnableVertexAttribArray；所有使用vertex array进行绘制的命令，比如DrawArrays和DrawElements；所有对vertex array状态进行查询的命令（见第6章）。

不管怎样，我也知道为啥会有人认为顶点属性应该放在VAO外部。`glVertexAttribPointer`出现早于VAO，在这段时间里顶点属性一直被认为是全局状态。你应该能看出VAO是一种改变全局状态的有效方法。我更倾向于认为是这样：假如你没有创建VAO，那OpenGL通过了一个默认的全局VAO。所以当你使用`glVertexAttribPointer`时，你仍然是在VAO内修改得顶点属性，只不过现在从默认的VAO变成你自己创建的VAO。

这里有更多的讨论：[http://www.opengl.org/discussion_boards/showthread.php/174577-Questions-on-VAOs](http://www.opengl.org/discussion_boards/showthread.php/174577-Questions-on-VAOs)

## 代码解释

终于！理论已经说完了，我们开始编码。OpenGL对于初学者而言不是特别友好，但如果你理解了之前所介绍的概念（shaders，VBO，VAO）那你就没啥问题。

打开`main.cpp`，我们从`main()`函数开始。

首先，我们初始化GLFW：

```cpp
glfwSetErrorCallback(OnError);
if(!glfwInit())
    throw std::runtime_error("glfwInit failed");
```

`glfwSetErrorCallback(OnError)`这一行告诉GLFW当错误发生时调用`OnError`函数。`OnError`函数会抛一个包含错误信息的异常，我们能从中了解哪里出错了。

然后我们用GLFW创建一个窗口。

```cpp
glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 2);
glfwWindowHint(GLFW_RESIZABLE, GL_FALSE);
gWindow = glfwCreateWindow((int)SCREEN_SIZE.x, (int)SCREEN_SIZE.y, "OpenGL Tutorial", NULL, NULL);
if(!gWindow)
    throw std::runtime_error("glfwCreateWindow failed. Can your hardware handle OpenGL 3.2?");
```

该窗口包含一个向前兼容的OpenGL 3.2内核上下文。假如`glfwCreateWindow`失败了，你应该降低下OpenGL版本。

创建窗口最后一步，我们应该设置一个“当前”OpenGL上下文给刚创建的窗口：

```cpp
glfwMakeContextCurrent(gWindow);
```

无论我们调用哪个OpenGL函数，都会影响到“当前上下文”。我们只会用到一个上下文，所以设置完后，就别管它了。理论上来说，我们可以有多个窗口，且每个窗口都可以有自己的上下文。

现在我们窗口有了OpenGL上下文变量，我们需要初始化GLEW以便访问OpenGL接口。

```cpp
glewExperimental = GL_TRUE; //stops glew crashing on OSX :-/
if(glewInit() != GLEW_OK)
    throw std::runtime_error("glewInit failed");
```

这里的GLEW与OpenGL内核有点小问题，设置`glewExperimental`就可以修复，但希望再未来永远不要发生。

我们也可以用GLEW再次确认3.2版本是否存在：

```cpp
if(!GLEW_VERSION_3_2)
    throw std::runtime_error("OpenGL 3.2 API is not available.");
```

在`LoadShaders`函数中，我们使用本教程提供的`tdogl::Shader`和`tdogl::Program`两个类编译和链接了vertex shader和fragment shader。

```cpp
std::vector<tdogl::Shader> shaders;
shaders.push_back(tdogl::Shader::shaderFromFile(ResourcePath("vertex-shader.txt"), GL_VERTEX_SHADER));
shaders.push_back(tdogl::Shader::shaderFromFile(ResourcePath("fragment-shader.txt"), GL_FRAGMENT_SHADER));
gProgram = new tdogl::Program(shaders);
```

在`LoadTriangle`函数中，我们创建了一个VAO和VBO。这是第一步，创建和绑定新的VAO：

```cpp
glGenVertexArrays(1, &gVAO);
glBindVertexArray(gVAO);
```

然后我们创建和绑定新的VBO：

```cpp
glGenBuffers(1, &gVBO);
glBindBuffer(GL_ARRAY_BUFFER, gVBO);
```

接着，我们上传一些数据到VBO中。这些数据就是三个顶点，每个顶点包含三个`GLfloat`。

```cpp
GLfloat vertexData[] = {
    //  X     Y     Z
     0.0f, 0.8f, 0.0f,
    -0.8f,-0.8f, 0.0f,
     0.8f,-0.8f, 0.0f,
};
glBufferData(GL_ARRAY_BUFFER, sizeof(vertexData), vertexData, GL_STATIC_DRAW);
```

现在缓冲区包含了三角形的三个顶点，是时候开始设置VAO了。首先，我们应该启用shader程序中的`vert`变量。这些变量能被开启或关闭，默认情况下是关闭的，所以我们需要开启它。`vert`变量是一个“属性变量（attribute variable）”，这也是为何OpenGL函数名称中有带“Attrib”。我们可以在后续的文章中看到更多类型。

```cpp
glEnableVertexAttribArray(gProgram->attrib("vert"));
```

VAO设置最复杂的部分就是下个函数：`glVertexAttribPointer`。让我们先调用该函数，等会解释。

```cpp
glVertexAttribPointer(gProgram->attrib("vert"), 3, GL_FLOAT, GL_FALSE, 0, NULL);
```





















