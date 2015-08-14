---
layout: post
title: 现代OpenGL教程 03 - 矩阵，深度缓冲，动画
categories: modern-opengl-tutorials
tags: opengl tutorials
description: 现代OpenGL贴图
keywords: 现代, OpenGL, 教程, 入门指南
---

<img src="{{ site.cdn.link }}/static/img/opengl-tutorials/modern-opengl-03.png" width="60%">

本文中，我会将不会动的2D三角形替换为旋转的3D立方体。你会看到这样的效果：

![]({{ site.cdn.link }}/static/img/opengl-tutorials/rotating-crate.gif)

现在我们终于能在屏幕上搞点有趣的东西了，我放了更多的动图在这里：[http://imgur.com/a/x8q7R](http://imgur.com/a/x8q7R)

为了生成旋转立方体，我们需要学些关于矩阵的数学，用于创建透视投影，旋转，平移和“相机”概念。我们还有必要学习些深度缓冲，和典型的随时间改变的3D应用，比如动画。

<!--more-->

## 获取代码

所有例子代码的zip打包可以从这里获取：[https://github.com/tomdalling/opengl-series/archive/master.zip](https://github.com/tomdalling/opengl-series/archive/master.zip)。

这一系列文章中所使用的代码都存放在：[https://github.com/tomdalling/opengl-series](https://github.com/tomdalling/opengl-series)。你可以在页面中下载zip，加入你会git的话，也可以复制该仓库。

本文代码你可以在<code>[source/02_textures](https://github.com/tomdalling/opengl-series/tree/master/source/02_textures)</code>目录里找到。使用OS X系统的，可以打开根目录里的`opengl-series.xcodeproj`，选择本文工程。使用Windows系统的，可以在Visual Studio 2013里打开`opengl-series.sln`，选择相应工程。

工程里已包含所有依赖，所以你不需要再安装或者配置额外的东西。如果有任何编译或运行上的问题，请联系我。

## 矩阵原理

本文讲的最多的就是关于3D中的矩阵，所以让我们在写代码前先了解下矩阵原理。我不会过多关注数学，网上有很多好的这类资源。我们只需要使用GLM来实现相关运算。我会注重于那些应用在我们3D程序里的矩阵。

<mark>矩阵是用来进行3D变换。</mark>可能的变换包括（点击可以看动画）：

- [旋转](http://en.wikipedia.org/wiki/Rotation_matrix)
- [缩放](http://imgur.com/a/x8q7R#6)（变大和变小）
- [平移](http://en.wikipedia.org/wiki/Translation_(geometry))（移动）
- [透视/正交 投影](http://imgur.com/a/x8q7R#0)（后面会解释）

一个矩阵是一个数字表格，像这样：

![]({{ site.cdn.link }}/static/img/opengl-tutorials/mat4x4.png)

矩阵英文matrix的复数形式是matrices。

不同的数值的能产生不同类型的变换。上面的那个矩阵会绕着Z轴旋转90°。我们会使用GLM来创建矩阵，所以我们不用理解如何计算出这些数值。

矩阵可以有任意行和列，但3D变换使用4×4矩阵，就像上面看到的那样。无论我在那说到“矩阵”，指的就是4×4矩阵。

当用代码实现矩阵时，一般会用一个浮点数组来表示。我们使用`glm::mat4`类来表示4×4矩阵。

两个最重要的矩阵操作是：

<mark>
- matrix × matrix = combined matrix
- matrix × coordinate = transformed coordinate 
</mark> 

## 矩阵 × 矩阵

当你要对两个矩阵进行相乘时，它们的乘积是一个包含两者变换的新矩阵。

比如，你将一个旋转矩阵乘以一个平移矩阵，得到的结果就是“组合”矩阵，即先旋转然后平移。下面的例子展示这类矩阵相乘。

![]({{ site.cdn.link }}/static/img/opengl-tutorials/mat-x-mat.png)

<mark>不像普通的乘法，矩阵乘法中顺序很重要。</mark> 比如，`A`和`B`是矩阵，`A*B`不一定等于`B*A`。下面我们会使用相同的矩阵，但改变下乘法顺序：

![]({{ site.cdn.link }}/static/img/opengl-tutorials/mat-x-mat-commutative.png)

注意不同的顺序，结果也不同。下面动画说明顺序有多重要。相同的矩阵，不同的顺序。两个变换分别是沿Y轴上移，和旋转45°。

![]({{ site.cdn.link }}/static/img/opengl-tutorials/translate-rotate.gif)

当你编码的时候，假如看到变换出错，请回头检查下你的矩阵运算是否是正确的顺序。

## 矩阵 × 坐标

当你用矩阵乘以一个坐标时，它们的乘积就是一个变换后的新坐标。

比如，你有上面提到的旋转矩阵，乘上坐标(1,1,0)，它的结果就是(-1,1,0)。变换后的坐标就是原始坐标绕着Z周旋转90°。下面是该乘法的图例：

![]({{ site.cdn.link }}/static/img/opengl-tutorials/mat-x-vec.png)

## 为何我们会使用4D坐标

你可能注意到了上面的坐标是4D的，而非3D。它的格式是这样的：

![]({{ site.cdn.link }}/static/img/opengl-tutorials/homo-coord-letters.png)

为何我们会使用4D坐标？因为我们需要用4x4的矩阵完成所有我们需要的3D变换。不管怎样，矩阵乘法需要左边的列数等于右边的行数。这就意味着4x4矩阵无法与3D坐标相乘，因为矩阵有4列，但坐标只有3行。<mark>我们需要使用4D坐标，因为4x4的矩阵*需要*用它们来完成矩阵运算。</mark>

一些变换，比如旋转，缩放，只需要3x3矩阵。对于这些变换，我们不需要4D坐标，因为3D坐标就能运算。但无论如何，变换需要至少是4x3的矩阵，而透视投影矩阵需要4x4矩阵，而我们两者都会用到，所以我们强制使用4D。

这些被称为[齐次坐标](http://en.wikipedia.org/wiki/Homogeneous_coordinates)。在后续的教程里，我们会讲到有向光照，那里我们会学到有关“W”维度的表示。在这里，我们只需要将3D转换为4D。3D转换为4D只要将第四维坐标“W”设为1即可。比如，坐标(22,33,44)转换为：


![]({{ site.cdn.link }}/static/img/opengl-tutorials/homo-coord.png)

当需要将4D坐标变为3D时，假如“W”维度是1，你可以直接忽略它，使用X，Y，Z的值即可。如果你发现“W”的值不为1，好吧，你就需要做些额外处理，或者这里出了个bug。

## 构造一个立方体

代码上第一个变动就是用立方体替换之前的三角形。

我们用三角形来构造立方体，用两个三角形表示6个面的每个面。在旧版本的OpengGL中，我们可以使用1个正方形（`GL_QUADS`）来替代2个三角表示每个面，但`GL_QUADS`已经被现代版本的OpenGL给移除了。X，Y，Z坐标值域为-1到1，这意味着立方体是两个单位宽，立方体中心点在原点（原点坐标(0,0,0)）。我们将使用256×256的贴图给立方体每个面贴上。后序文章中都会使用这个数据，我们不需要改变太多。这里有立方体数据：

```cpp
GLfloat vertexData[] = {
    //  X     Y     Z       U     V
    // bottom
    -1.0f,-1.0f,-1.0f,   0.0f, 0.0f,
     1.0f,-1.0f,-1.0f,   1.0f, 0.0f,
    -1.0f,-1.0f, 1.0f,   0.0f, 1.0f,
     1.0f,-1.0f,-1.0f,   1.0f, 0.0f,
     1.0f,-1.0f, 1.0f,   1.0f, 1.0f,
    -1.0f,-1.0f, 1.0f,   0.0f, 1.0f,

    // top
    -1.0f, 1.0f,-1.0f,   0.0f, 0.0f,
    -1.0f, 1.0f, 1.0f,   0.0f, 1.0f,
     1.0f, 1.0f,-1.0f,   1.0f, 0.0f,
     1.0f, 1.0f,-1.0f,   1.0f, 0.0f,
    -1.0f, 1.0f, 1.0f,   0.0f, 1.0f,
     1.0f, 1.0f, 1.0f,   1.0f, 1.0f,

    // front
    -1.0f,-1.0f, 1.0f,   1.0f, 0.0f,
     1.0f,-1.0f, 1.0f,   0.0f, 0.0f,
    -1.0f, 1.0f, 1.0f,   1.0f, 1.0f,
     1.0f,-1.0f, 1.0f,   0.0f, 0.0f,
     1.0f, 1.0f, 1.0f,   0.0f, 1.0f,
    -1.0f, 1.0f, 1.0f,   1.0f, 1.0f,

    // back
    -1.0f,-1.0f,-1.0f,   0.0f, 0.0f,
    -1.0f, 1.0f,-1.0f,   0.0f, 1.0f,
     1.0f,-1.0f,-1.0f,   1.0f, 0.0f,
     1.0f,-1.0f,-1.0f,   1.0f, 0.0f,
    -1.0f, 1.0f,-1.0f,   0.0f, 1.0f,
     1.0f, 1.0f,-1.0f,   1.0f, 1.0f,

    // left
    -1.0f,-1.0f, 1.0f,   0.0f, 1.0f,
    -1.0f, 1.0f,-1.0f,   1.0f, 0.0f,
    -1.0f,-1.0f,-1.0f,   0.0f, 0.0f,
    -1.0f,-1.0f, 1.0f,   0.0f, 1.0f,
    -1.0f, 1.0f, 1.0f,   1.0f, 1.0f,
    -1.0f, 1.0f,-1.0f,   1.0f, 0.0f,

    // right
     1.0f,-1.0f, 1.0f,   1.0f, 1.0f,
     1.0f,-1.0f,-1.0f,   1.0f, 0.0f,
     1.0f, 1.0f,-1.0f,   0.0f, 0.0f,
     1.0f,-1.0f, 1.0f,   1.0f, 1.0f,
     1.0f, 1.0f,-1.0f,   0.0f, 0.0f,
     1.0f, 1.0f, 1.0f,   0.0f, 1.0f
};
```

我们需要更改下`Render`函数中`glDrawArrays`调用，之前是用来绘制三角形的。立方体6个面，每个面有2个三角形，每个三角形有3个顶点，所以需要绘制的顶点数是：6 × 2 × 3 = 36。新的`glDrawArrays`调用像这样：

```cpp
glDrawArrays(GL_TRIANGLES, 0, 6*2*3);
```

最后，我们使用新的贴图“wooden-crate.jpg”，我们更改`LoadTexture`中的文件名，如下：

```cpp
tdogl::Bitmap bmp = tdogl::Bitmap::bitmapFromFile(ResourcePath("wooden-crate.jpg"));
```

就是这样！我们已经提供了所有绘制带贴图立方体的需要用到的数据。假如你运行程序，你可以看到这样的：

![]({{ site.cdn.link }}/static/img/opengl-tutorials/crate-stretched.jpg)

此时此刻，我们有两个问题。第一，这个立方体看上去非常2D，因为我们只看到了一个面。我们需要“移动相机”，以不同角度观察这个立方体。第二，上面有些问题，因为立方体宽和高应该相等，但从截图看上去宽度明显比高度大。为了修复这两个问题，我们需要学习更多的矩阵知识，和如何应用到3D程序中。

## 裁剪体 - 默认相机

为了理解3D中的“相机”，我们首先得理解裁剪体。

<mark>裁剪体是一个立方体。无论什么东西在裁剪体中的都会显示在屏幕上，任何在裁剪体之外的都不会显示。</mark>裁剪体跟我们上面的立方体是相同大小，它的X，Y，Z坐标值域也是从-1到+1。-X表示左边，+X表示右边，-Y是底部，+Y是顶部，+Z是远离相机，-Z是朝着相机。

因为我们的立方体和裁剪体一样大，所以我们只能看到立方体的正面。

这也解释了为何我们的立方体看起来比较宽。窗口显示了裁剪体里的所有东西。窗口的左右边缘是X轴的-1和+1，窗口的底部和顶部边缘是Y轴的-1和+1。裁剪体被拉伸了，用来跟窗口的可视大小相适应，所以我们的立方体看上去不是正方形的。

## 固定住相机，让世界移动起来

我们需要移动相机，使得可以从不同角度进行观察，或放大缩小。但不管怎样，<mark>裁剪体不会更改。它永远是一样的大小和位置。所以我们换种方式来替代移动相机，我们可以移动3D场景让它正确得出现在裁剪体中。</mark>比如，我们想要让相机往右旋转，我们可以把整个世界往左旋转。假如我们想要让相机离玩家近些，我们可以把玩家挪到相机前。这就是“相机”在3D中的工作方式，变换整个世界使得它出现在裁剪体中并且看上去是正确的。

无论你走到哪里，都会觉得是世界没动，是你在移动。但你也能想象出当你不动，而世界在你脚下滚动，就像你在跑步机上一样。这就是“移动相机”和“移动世界”的区别，这两种方式，对于观察者而言，看上去都是一样的。

我们如何对3D场景进行变换来适应裁剪体呢？这里我们需要用到矩阵。

## 实现相机矩阵

让我们先来实现相机矩阵。3D中“相机”的解释可认为是对3D场景的一系列变换。因为相机就是一个变换，所以我们可以用矩阵来表示。

首先，我们需要包含GLM头文件，用来创建不同类型的矩阵。

```cpp
#include <glm/gtc/matrix_transform.hpp>
```

接着，我们需要更新顶点着色器。我们创建一个相机矩阵变量叫做`camera`，并且每个顶点都会乘上这个相机矩阵。这样我们就将整个3D场景进行了变换。每个顶点都会被相机矩阵所变换。新的顶点着色器看上去应该是这样的：

```cpp
#version 150

uniform mat4 camera; //this is the new variable

in vec3 vert;
in vec2 vertTexCoord;

out vec2 fragTexCoord;

void main() {
    // Pass the tex coord straight through to the fragment shader
    fragTexCoord = vertTexCoord;
    
    // Transform the input vertex with the camera matrix
    gl_Position = camera * vec4(vert, 1);
}
```

现在我们需要在C++代码中设置`camera`着色器变量。在`LoadShaders`函数的地步，我们添加这样的代码：

```cpp
gProgram->use();

glm::mat4 camera = glm::lookAt(glm::vec3(3,3,3), glm::vec3(0,0,0), glm::vec3(0,1,0));
gProgram->setUniform("camera", camera);

gProgram->stopUsing();
```

这个相机矩阵在本文中不会再被改变，当所有着色器被创建后，我们只需这样设置一次。

你无法在设置着色器变量，除非着色器在使用中，这就是为何我们用到了`gProgram->use()`和`gProgram->stopUsing()`。

我们使用`glm::lookAt`函数为我们创建相机矩阵。假如你使用的是旧版本的OpenGL，那你应该使用`gluLookAt`函数来达到相同目的，但`gluLookAt`已经在最近的OpenGL版本中被移除了。第一个参数`glm::vec3(3,3,3)`是相机的位置。第二个参数`glm::vec3(0,0,0)`是相机观察的点。立方体中心是（0,0,0），相机就朝着这个点观察。最后一个参数`glm::vec3(0,1,0)`是“向上”的方向。我们需要垂直摆放相机，所以我们设置“向上”是沿着Y轴的正方向。假如相机是颠倒或者倾斜的，这里就是其它值了。

在我们生成了相机矩阵后，我们用`gProgram->setUniform("camera", camera);`来设置`camera`着色器变量，`setUniform`方法属于`tdogl::Program`类，它会调用`glUniformMatrix4fv`来设置变量。

就是这样！我们现在有了一个可运行的相机。

不幸的是，假如你现在运行程序，你会看到整个都是黑屏。因为我们的立方体顶点经过相机矩阵变换后，飞出了裁剪体。这就是上面我提到的，在裁剪体之外的它是不会被显示。为了能再次看到它，我们需要设置**投影矩阵**。

## 实现投影矩阵

记住裁剪体只有2个单元宽、高和深。假设1个单元等于我们3D场景中的1米。这就意味着我们在相机中能看到正前方2米，这样不是很方便。

我们需要扩大裁剪体使得能看到3D场景中的更多东西，可怜我们又不能改变裁剪体的大小，但，我们能缩小整个场景。缩小是一个变换，所以我们用矩阵来表示，基本上说，投影矩阵就是用来干这个的。

让我们在顶点着色器中加入投影矩阵变量。更新后的代码看上去是这样的：

```cpp
#version 150

uniform mat4 projection; //this is the new variable
uniform mat4 camera;

in vec3 vert;
in vec2 vertTexCoord;

out vec2 fragTexCoord;

void main() {
    // Pass the tex coord straight through to the fragment shader
    fragTexCoord = vertTexCoord;
    
    // Apply camera and projection transformations to the vertex
    gl_Position = projection * camera * vec4(vert, 1);
}
```

注意矩阵相乘的顺序：`projection * camera * vert`。相机变换是放在首位的，投影矩阵是第二位。<mark>矩阵乘法中，变换从右往左，从顶点角度说是从最近的变换到更早前的变换。</mark>

现在让我们在C++代码中设置`projection`着色器变量，方式和我们设置`camera`变量相同。在`LoadShaders`函数中，添加如下代码：

```cpp
glm::mat4 projection = glm::perspective(glm::radians(50.0f), SCREEN_SIZE.x/SCREEN_SIZE.y, 0.1f, 10.0f);
gProgram->setUniform("projection", projection);
```

假如你使用的是旧版本OpenGL，你可以使用`gluPerspective`来设置投影矩阵，同样`gluPerspective`函数在最近版本的OpenGL中也被移除了。幸运的是你可以使用`glm::perspective`来替代。

`glm::perspective`第一个参数是“可视区域”参数。这个参数是个弧度，用来说明相机视野有多宽。弧度换算我们可以用`glm::radians`函数来将50度转换为弧度。大的可视区域意味着我们的相机可以看到更多场景，看上去就像是缩小了。小的可视区域意味着相机只能看到场景的一小部分，看上去像是放大了。第二个参数是“纵横比”，该参数表示可视区域的纵横比率。一般该参数设置为窗口的`width/height`，倒数第二个参数是“近平面”，近平面是裁剪体的前面，`0.1`表示近平面离相机是0.1单位远。任何离相机小于`0.1`单位的物体均不可见。近平面的值必须大于0。最后一个参数是“远平面”，远平面是裁剪体的后面。`10.0`表示相机所显示的物体均离相机10个单位之内。任何大于10单位的物体均不可见。我们的立方体是3单位远，所以它能被看见。

`glm::perspective`对将[可视锥体](http://en.wikipedia.org/wiki/Viewing_frustum")对应到裁剪体中非常有用。一个锥体像是一个金字塔被砍掉了顶端。金字塔的底部就是远平面，顶部就是近平面。可视区域就是该锥体胖瘦。任何在锥体里的物体都会被显示，而不再内的就隐藏。

![]({{ site.cdn.link }}/static/img/opengl-tutorials/frustum.png)

有了相机矩阵和投影矩阵的组合，我们就可以看到立方体了。运行程序你会看到：

![]({{ site.cdn.link }}/static/img/opengl-tutorials/depth-buffer-disabled.png)

这看上去。。。几乎是对的。

这个立方体看上去已经是正方形了，不再是矩形。这是因为`glm::perspective`中的“纵横比”参数，能够基于窗口的宽和高进行正确的调整比例。

不幸的是，截图看上去立方体的背面渲染并覆盖到前面来了。我们当然不希望发生这样的事，我们需要开启**深度缓冲**来解决。

## 深度缓冲

OpenGL默认会将最新的绘制覆盖到之前的绘制上。假如一个物体的背面在前面之后绘制，就会发生背面挡住前面。<mark>深度缓冲就是为了防止背景层覆盖到前景层的东西。</mark>

假如深度缓冲被开启，每个被绘制的像素到相机的距离都是可知的。这个距离会以一个数值保存在深度缓冲里。当你绘制一个像素在另外一个已存在的像素上时，OpenGL会查找深度缓冲来决定哪个像素应该离相机更近。假如新的像素离相机更近，那该像素点就会被重写。假如之前的像素离相机更近，那新像素就会被*抛弃*。所以，<mark>一个之前已存在的像素只会当新像素离相机更近时才会被重写。</mark>这就叫做“深度测试”。

## 实现深度缓冲

在`AppMain`函数中，调用了`glewInit`之后，我们添加如下代码：

```cpp
glEnable(GL_DEPTH_TEST);
glDepthFunc(GL_LESS);
```

这告诉OpenGL开启深度测试。调用`glDepthFunc`是表明假如像素离相机的距离*小于*之前的像素距离时应该被重写。

最后一步我们需要在渲染每帧之后清理深度缓冲。假如我们不清理，旧的像素距离会保存在缓冲中，这样会影响到绘制新的一帧。在`Render`函数里，我们改变`glClear`来实现它：

```cpp
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
```

![]({{ site.cdn.link }}/static/img/opengl-tutorials/depth-buffer-correct.png)

## 旋转立方体

假如你完成了上述例子，祝贺你走了这么远！最后我们来实现会旋转的立方体动画。

如何实现旋转？你会猜到：另外一个矩阵。这与之前的矩阵不同的是，这个矩阵是每帧都在改变，之前的矩阵都是常量。

我需要新建一个“模型”矩阵。在常见的3D引擎中，每个物体都有一个模型矩阵。相机和投影矩阵对整个场景来说是一样的，但模型矩阵是每个物体都不同。模型矩阵用来摆放每个物体在正确的位置上（平移），设置正确的面向（旋转），或者改变物体大小（缩放）。我们只有一个物体在当前3D场景上，所以，我们只需要一个模型矩阵。

让我们添加一个`model`矩阵变量到顶点着色器，就像我们添加相机和投影一样。最终版本的顶点着色器应该是这样的：

```cpp
#version 150

uniform mat4 projection;
uniform mat4 camera;
uniform mat4 model; //this is the new variable

in vec3 vert;
in vec2 vertTexCoord;

out vec2 fragTexCoord;

void main() {
    // Pass the tex coord straight through to the fragment shader
    fragTexCoord = vertTexCoord;
    
    // Apply all matrix transformations to vert
    gl_Position = projection * camera * model * vec4(vert, 1);
}
```

还是要注意矩阵相乘的顺序。模型矩阵是`vert`变量最近的一次变换，意味着模型矩阵应该第一个被使用，其次是相机，最后是投影。

现在我们需要设置新的`model`着色器变量。不像相机和投影变量，模型变量需要每帧都被设置，所以我们把它放在`Render`函数里。在`gProgram->use()`之后添加这样的代码：

```cpp
gProgram->setUniform("model", glm::rotate(glm::mat4(), glm::radians(45.0f), glm::vec3(0,1,0)));
```

我们使用`glm::rotate`函数创建一个旋转矩阵。第一个参数是一个已存在的需要进行旋转的矩阵。在这我们不需要对已存在的矩阵进行旋转，所以我们传个新的`glm::mat4`对象就可以了。下一个参数是旋转的角度，或者说是要旋转多少度。现在让我给它设置个45°。最后一个参数是旋转的轴。想象下旋转像是将物体插在叉子上，然后转动叉子。叉子就是轴，角度就是你的转动。在我们的例子中，我们使用垂直的叉子，所以立方体像在一个平台上旋转。

运行程序，你们看到立方体被旋转：


![]({{ site.cdn.link }}/static/img/opengl-tutorials/not-animated.png)

它还没有转动，因为矩阵没有被更改-它永远是旋转了45°。最后一步就是让它每帧都旋转一下。

## 动画

首先，添加一个新的全局变量叫`gDegreesRotated`。

```cpp
GLfloat gDegreesRotated = 0.0f;
```

每帧，我们会轻微的增加`gDegreesRotated`，并且我们用它来计算新的旋转矩阵。这样就能达到动画效果。我们需要做的就是更新，绘制，更新，绘制，更新，绘制，这样一个模式。

让我们创建一个`Update`函数，用来每次增加`gDegreesRotated`：

```cpp
void Update() {
    //rotate by 1 degree
    gDegreesRotated += 1.0f;

    //don't go over 360 degrees
    while(gDegreesRotated > 360.0f) gDegreesRotated -= 360.0f;
} 
```

我们需要每帧都调用一次`Update`函数。让我们把它加入到`AppMain`的循环中，在调用`Render`之前。

```cpp
while(glfwGetWindowParam(GLFW_OPENED)){
    // process pending events
    glfwPollEvents();

    // update the rotation animation
    Update();
    
    // draw one frame
    Render();
}
```

现在我们需要基于`gDegreesRotated`变量来重新计算模型矩阵。在`Render`函数中我们修改相关代码来设置模型矩阵：

```cpp
gProgram->setUniform("model", glm::rotate(glm::mat4(), glm::radians(gDegreesRotated), glm::vec3(0,1,0)));
```

与之前唯一不同的是我们使用了`gDegreesRotated`来替换45°常量。

你现在运行程序能看到一个漂亮，平滑转动的立方体动画。唯一的问题就是转动的速度很你的FPS帧率有关。假如FPS高，你的立方体旋转的就快。假如FPS降低，那立方体旋转的就慢些。这不够理想。一个程序应该能正确更新，而不在乎于运行的帧率。

## 基于时间的动画

为了使程序跑起来更正确，不依赖于FPS，动画应该*每秒*更新，而非*每帧*更新。最简单得方式就是对时间进行计数，并相对上次更新时间来正确更新。让我们改下`Update`函数，增加个变量`secondsElapsed`：

```cpp
void Update(float secondsElapsed) {
    const GLfloat degreesPerSecond = 180.0f;
    gDegreesRotated += secondsElapsed * degreesPerSecond;
    while(gDegreesRotated > 360.0f) gDegreesRotated -= 360.0f;
}
```

这段代码使得立方体每秒旋转180°，而无关多少帧率。

在`AppMain`循环中，我们需要计算离上次更新过去了多少秒。新的循环应该是这样：

```cpp
double lastTime = glfwGetTime();
while(glfwGetWindowParam(GLFW_OPENED)){
    // process pending events
    glfwPollEvents();

    // update the scene based on the time elapsed since last update
    double thisTime = glfwGetTime();
    Update((float)(thisTime - lastTime));
    lastTime = thisTime;
    
    // draw one frame
    Render();
}
```

`glfwGetTime`返回从程序启动开始到现在所逝去的时间。

我们使用`lastTime`变量来记录上次更新时间。每次迭代，我们获取最新的时间存入变量`thisTime`。从上次更新到现在的差值就是`thisTime - lastTime`。当更新结束，我们设置`lastTime = thisTime`以便下次循环迭代的时候很正常工作。

这是基于时间更新的最简单方法。这里还有[更好的更新方法](http://gafferongames.com/game-physics/fix-your-timestep/)，但我们还不需要搞得这么复杂。

## 下篇预告

下一篇，我们会使用`tdogl::Camera`类来实现用键盘操作第一人称射击类型的相机移动，可以用鼠标观察不同方向，或者用鼠标滚轮来放大缩小。

## 更多资源

- [Tutorial 3 : Matrices](http://www.opengl-tutorial.org/beginners-tutorials/tutorial-3-matrices/) is a great explanation of matrices from opengl-tutorial.org
- [Scaling](http://en.wikipedia.org/wiki/Scaling_(geometry)), [rotation](http://en.wikipedia.org/wiki/Rotation_matrix), [translation](http://en.wikipedia.org/wiki/Translation_(geometry)), and [transformation matrices](http://en.wikipedia.org/wiki/Transformation_matrix) on Wikipedia
- [Basic 3D Math: Matrices](http://www.matrix44.net/cms/notes/opengl-3d-graphics/basic-3d-math-matrices)
- [Homogeneous coordinates](http://www.teamten.com/lawrence/graphics/homogeneous/) by Lawrence Kesteloot
- [Viewing](http://www.glprogramming.com/red/chapter03.html) chapter of the OpenGL red book. Uses old version of OpenGL in code examples, but the theory is still the same.
- GLM [code samples](http://glm.g-truc.net/code.html) and [manual (pdf)](http://glm.g-truc.net/glm-0.9.4.pdf)
- [Z-buffering (depth buffering)](http://en.wikipedia.org/wiki/Z-buffering) on Wikipedia
- [Overlap and Depth Buffering](http://www.arcsynthesis.org/gltut/Positioning/Tut05%20Overlap%20and%20Depth%20Buffering.html) section of the Learning Modern 3D Graphics Programming book
- [Fix Your Timestep!](http://gafferongames.com/game-physics/fix-your-timestep/) by Glenn Fiedler