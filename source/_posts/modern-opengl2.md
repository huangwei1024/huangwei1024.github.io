---
layout: post
title: 现代OpenGL教程 02 - 贴图
categories: modern-opengl-tutorials
tags: [opengl, tutorials]
description: 现代OpenGL贴图
keywords: 现代, OpenGL, 教程, 入门指南
date: 2015-08-06
---

<img src="/static/img/opengl-tutorials/modern-opengl-02.png" width="60%">


在本文中，我们将给三角形加一个贴图，这需要在顶点和片段着色器中加入一些新变量，创建和使用贴图对象，并且学习一点贴图单元和贴图坐标的知识。

本文会使用两个新的类到`tdogl`命名空间中：`tdogl:Bitmap`和`tdogl:Texture`。这些类允许我们将jpg，png或bmp图片上传到显存并用于着色器。`tdogl:Program`类也增加一些相关接口。

<!--more-->

## 获取代码

所有例子代码的zip打包可以从这里获取：[https://github.com/tomdalling/opengl-series/archive/master.zip](https://github.com/tomdalling/opengl-series/archive/master.zip)。

这一系列文章中所使用的代码都存放在：[https://github.com/tomdalling/opengl-series](https://github.com/tomdalling/opengl-series)。你可以在页面中下载zip，加入你会git的话，也可以复制该仓库。

本文代码你可以在<code>[source/02_textures](https://github.com/tomdalling/opengl-series/tree/master/source/02_textures)</code>目录里找到。使用OS X系统的，可以打开根目录里的`opengl-series.xcodeproj`，选择本文工程。使用Windows系统的，可以在Visual Studio 2013里打开`opengl-series.sln`，选择相应工程。

工程里已包含所有依赖，所以你不需要再安装或者配置额外的东西。如果有任何编译或运行上的问题，请联系我。

## 着色器变量Uniform与Attribute

教程一里的着色器变量都是*attribute*，本文介绍另外一种类型的变量：*uniform*变量。

着色器变量有两种类型：*uniform*和*attribute*。<mark>*attribute*变量可以在每个顶点上有不同值。而*uniform*变量在多个顶点上保持相同值。</mark>比如，你想要给一个三角形设置一种颜色，那你应该使用*uniform*变量，如果你希望每个三角形顶点有不同颜色，你应该使用*attribute*变量。从这开始，我称呼他们为“uniforms”和“attributes”。

<mark>Uniforms能被任意着色器访问，但是Attributes必须先进入**顶点着色器**，而非**片段着色器**。顶点着色器在需要时会将该值传给片段着色器。</mark>这因为Uniforms像常量-它们不会被任何着色器更改。然而，Attributes不是常量。顶点着色器会改变Attribute变量的值，在片段着色器获取之前。就是说，顶点着色器的输出就是片段着色器的输入。

为了设置Uniform的值，我们可以调用[glUniform*](http://www.opengl.org/sdk/docs/man/xhtml/glUniform.xml)系列函数。而设置Attribute的值，我们需要在VBO中保存，并且和VAO一起发送给着色器，就像前一篇教程里的[glVertexAttribPointer](http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml)。加入你不想把值存在VBO里，你也可以使用[glVertexAttrib*](http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttrib.xml)系列函数来设置Attribute值。

## 贴图

<mark>贴图，大体上来说就是你应用在3D物体上的2D图像。</mark>它有其它用途，但显示2D图像在3D几何上是最常用的。有1D，2D，3D贴图，但本文只讲2D贴图。更深入阅读，请参见[Learning Modern 3D Graphics Programming](http://www.arcsynthesis.org/gltut/)书中的[Textures are not Pictures](http://www.arcsynthesis.org/gltut/Texturing/Tutorial%2014.html)章节。

贴图是存放在显存里的。那就是说，你需要在使用之前上传你的贴图数据给显卡。这类似VBO在前文的作用-VBO也是在使用之前需要存放到显存上。

<mark>贴图的高和宽需要是2的幂次方。</mark>比如16，32，64，128，256，512。本文中使用的是256*256的图像作为贴图，如下图所示。

![hazard.png](/static/img/opengl-tutorials/hazard.png)

我们使用`tdogl:Bitmap`来加载“hazard.png”的原始像素数据到内存中，参见[stb_image](https://github.com/nothings/stb)帮助文档。然后我们使用`tdogl:Texture`上传原始像素数据给OpenGL贴图对象。幸运的是OpenGL中的贴图创建方法从面世到现在都没有实质性的变化，所以网上有大量的创建贴图的好文章。虽然贴图坐标的传输方式有变化，但创建贴图还是跟以前一样。

以下是`tdogl:Texture`的构造函数，用于OpenGL贴图创建。

```cpp
Texture::Texture(const Bitmap& bitmap, GLint minMagFiler, GLint wrapMode) :
    _originalWidth((GLfloat)bitmap.width()),
    _originalHeight((GLfloat)bitmap.height())
{
    glGenTextures(1, &_object);
    glBindTexture(GL_TEXTURE_2D, _object);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, minMagFiler);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, minMagFiler);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, wrapMode);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, wrapMode);
    glTexImage2D(GL_TEXTURE_2D,
                 0, 
                 TextureFormatForBitmapFormat(bitmap.format()),
                 (GLsizei)bitmap.width(), 
                 (GLsizei)bitmap.height(),
                 0, 
                 TextureFormatForBitmapFormat(bitmap.format()), 
                 GL_UNSIGNED_BYTE, 
                 bitmap.pixelBuffer());
    glBindTexture(GL_TEXTURE_2D, 0);
}
```

## 贴图坐标

毫无疑问，贴图坐标就是贴图上的坐标。<mark>关于贴图坐标比较奇特的是它们不是以像素为单位。它们范围是从0到1，(0, 0)是左下角，(1, 1)是右上角。</mark>假如你上传到OpenGL的图像是颠倒的，那(0, 0)就是左上角，而非左下角。将像素坐标转换为贴图坐标，你必须除上贴图的宽和高。比如，在256*256的图像中，像素坐标(128, 256)的贴图坐标是(0.5, 1)。

![uv_coords.png](/static/img/opengl-tutorials/uv_coords.png)

贴图坐标通常被称为UV坐标。你也可以叫它们是XY坐标，但是XYZ通常被用来表示顶点，我们不希望将这两者混淆。

## 贴图图像单元

贴图图像单元，亦或简称“贴图单元”，是在OpenGL中略怪异的一部分。<mark>你无法直接发送贴图给着色器。首先，你要绑定贴图到贴图单元，然后呢要发送**贴图单元的索引**给着色器</mark>

对于贴图单元是有数量限制的。在低端硬件上，如手机，它们只有两个贴图单元。既然如此，即使我们有许多的贴图，我们也只能同时使用两个贴图单元在着色器中。我们在本文中只用到了一个贴图，所以也只需要一个贴图单元，但它可以在多个不同的着色器中混合。

## 实现贴图

首先，让我们创建一个新的全局贴图。

```cpp
tdogl::Texture* gTexture = NULL;
```

我们为加载“hazard.png”图片新增一个函数。该函数能被`AppMain`所调用。

```cpp
static void LoadTexture() {
    tdogl::Bitmap bmp = tdogl::Bitmap::bitmapFromFile(ResourcePath("hazard.png"));
    bmp.flipVertically();
    gTexture = new tdogl::Texture(bmp);
}
```

下一步，我们给每个三角形的顶点一个贴图坐标。假如你跟上图比较过UV坐标，就可以看出按顺序这个坐标表示（中，上），（左，下）和（右，下）。

```cpp
GLfloat vertexData[] = {
    //  X     Y     Z       U     V
     0.0f, 0.8f, 0.0f,   0.5f, 1.0f,
    -0.8f,-0.8f, 0.0f,   0.0f, 0.0f,
     0.8f,-0.8f, 0.0f,   1.0f, 0.0f,
};
```

现在我们需要修改片段着色器，使得它能使用贴图和贴图坐标作为输入。下面是新的片段着色器代码：

```cpp
#version 150
uniform sampler2D tex; //this is the texture
in vec2 fragTexCoord; //this is the texture coord
out vec4 finalColor; //this is the output color of the pixel

void main() {
    finalColor = texture(tex, fragTexCoord);
}
```

`uniform`关键字说明`tex`是*uniform*变量。贴图是一致的，因为所有三角形顶点有相同的贴图。`sampler2D`是变量类型，说明它包含一个2D贴图。

`fragTexCoord`是*attribute*变量，因为每个三角形顶点是不同的贴图坐标。

`texture`函数是用来查找给定贴图坐标的像素颜色。在GLSL旧版本中，你应该使用`texture2D`函数来实现该功能。

我们无法直接传送*attribute*给判断着色器，因为*attribute*必须首先通过顶点着色器。这儿是修改过的顶点着色器：

```cpp
#version 150
in vec3 vert;
in vec2 vertTexCoord;
out vec2 fragTexCoord;

void main() {
    // Pass the tex coord straight through to the fragment shader
    fragTexCoord = vertTexCoord;
    
    gl_Position = vec4(vert, 1);
}
```

顶点着色器使用`vertTexCoord`作为输入，并且将它不经修改，直接传给名为`fragTexCoord`的*attribute*片段着色器变量。

着色器有两个变量需要我们设置：`vertTexCoord`*attribute*变量和`tex`*uniform*变量。让我们从设置`tex`变量开始。打开main.cpp，找到`Render()`函数。我们在绘制三角形之前设置`tex`*uniform*变量：

```cpp
glActiveTexture(GL_TEXTURE0);
glBindTexture(GL_TEXTURE_2D, gTexture->object());
gProgram->setUniform("tex", 0); //set to 0 because the texture is bound to GL_TEXTURE0
```

贴图在没有绑定到贴图单元时，是无法使用的。`glActiveTexture`告诉OpenGL我们希望使用哪个贴图单元。`GL_TEXTURE0`是第一个贴图单元，我们就使用它。

下一本，我们使用`glBindTexture`来绑定我们的贴图到激活的贴图单元。

然后我们设置贴图单元索引给`tex`*uniform*着色器变量。我们使用0号贴图单元，所以我们设置`tex`变量为整数`0`。`setUniform`方法只是调用了`glUnifrom1i`函数。

最后一步，获取贴图坐标给`vertTexCoord`*attribute*变量。为了实现它，我们需要修改`LoadTriangle()`函数中的VAO。之前的代码是这样的：

```cpp
// Put the three triangle vertices into the VBO
GLfloat vertexData[] = {
    //  X     Y     Z
     0.0f, 0.8f, 0.0f,
    -0.8f,-0.8f, 0.0f,
     0.8f,-0.8f, 0.0f
};

// connect the xyz to the "vert" attribute of the vertex shader
glEnableVertexAttribArray(gProgram->attrib("vert"));
glVertexAttribPointer(gProgram->attrib("vert"), 3, GL_FLOAT, GL_FALSE, 0, NULL);
```

现在我们需要改成这样：

```cpp
// Put the three triangle vertices (XYZ) and texture coordinates (UV) into the VBO
GLfloat vertexData[] = {
    //  X     Y     Z       U     V
     0.0f, 0.8f, 0.0f,   0.5f, 1.0f,
    -0.8f,-0.8f, 0.0f,   0.0f, 0.0f,
     0.8f,-0.8f, 0.0f,   1.0f, 0.0f,
};

// connect the xyz to the "vert" attribute of the vertex shader
glEnableVertexAttribArray(gProgram->attrib("vert"));
glVertexAttribPointer(gProgram->attrib("vert"), 3, GL_FLOAT, GL_FALSE, 5*sizeof(GLfloat), NULL);
    
// connect the uv coords to the "vertTexCoord" attribute of the vertex shader
glEnableVertexAttribArray(gProgram->attrib("vertTexCoord"));
glVertexAttribPointer(gProgram->attrib("vertTexCoord"), 2, GL_FLOAT, GL_TRUE,  5*sizeof(GLfloat), (const GLvoid*)(3 * sizeof(GLfloat)));
```

我们第二次调用了`glVertexAttribPointer`，但我们也修改了第一个调用。最重要的是最后两个参数。

两个`glVertexAttribPointer`调用的倒数第二个参数都是`5*sizeof(GLfloat)`。这是“步长”参数。该参数是表明每个值开始位置的间隔是多少字节，或者说是到下个值开始的字节数。在两个调用中，每个值是5个`GLFloat`长度。举个例子，加入我们从“X”开始，往前数5个值，我们会落在下个“X”值上。从“U”开始也一样，也是往前数5个。该参数是字节单位，不是浮点作为单位，所以我们必须乘上浮点类型所占字节数。

最后一个参数`glVertexAttribPointer`是一个“偏移”参数。该参数需要知道从开始到第一个值有多少字节。开始是**XYZ**，所以偏移设置为NULL表示“到开始的距离为0字节”。第一个**UV**不在最前面-中间有3个浮点的距离。再说一遍，参数是以字节为单位，而非浮点，所以我们必须乘上浮点类型所占字节数。并且我们必须将数值转为`const GLvoid*`类型，因为在旧版本的OpenGL中该参数有别于现在的“偏移”。

现在，当你运行程序，你就能看到如本文最上方的那个三角形。


## 下篇预告

下一篇教程中我们会学一些矩阵相关的东西，使用矩阵来旋转立方体，移动相机，和添加透视投影。我们还会学习深度缓冲和基于时间更新的逻辑，比如动画。


## 更多OpenGL贴图相关资源

- [The texture page on the OpenGL wiki](http://www.opengl.org/wiki/Texture)
- [The texturing chapters](http://www.arcsynthesis.org/gltut/Texturing/Texturing.html) of the Learning Modern 3D Graphics Programming book.
- [Tutorial 16 - Basic Texture Mapping](http://ogldev.atspace.co.uk/www/tutorial16/tutorial16.html) by Etay Meiri
- [The texturing example code](https://github.com/progschj/OpenGL-Examples/blob/master/03texture.cpp) by Jakob Progsch
