---
layout: post
title: 现代OpenGL教程 04 - 相机，向量，输入
categories: modern-opengl-tutorials
tags: [opengl, tutorials]
description: 现代OpenGL教程 04 - 相机，向量，输入
keywords: 现代, OpenGL, 教程, 相机，向量，输入
date: 2015-09-01
---



<img src="/static/img/opengl-tutorials/modern-opengl-04.png" width="60%">

本篇教程中，我们会巩固上一篇所提到的矩阵和相机知识，并使用`tdogl::Camera`类来实现第一人称射击类型的相机。然后，我们会将相机与键盘和鼠标挂钩，使得我们可以移动和浏览3D场景。这里会学一些向量数学，还有上一篇没提到的逆矩阵。

<!--more-->

## 获取代码

所有例子代码的zip打包可以从这里获取：[https://github.com/tomdalling/opengl-series/archive/master.zip](https://github.com/tomdalling/opengl-series/archive/master.zip)。

这一系列文章中所使用的代码都存放在：[https://github.com/tomdalling/opengl-series](https://github.com/tomdalling/opengl-series)。你可以在页面中下载zip，加入你会git的话，也可以复制该仓库。

本文代码你可以在<code>[source/04_camera](https://github.com/tomdalling/opengl-series/tree/master/source/04_camera)</code>目录里找到。使用OS X系统的，可以打开根目录里的`opengl-series.xcodeproj`，选择本文工程。使用Windows系统的，可以在Visual Studio 2013里打开`opengl-series.sln`，选择相应工程。

工程里已包含所有依赖，所以你不需要再安装或者配置额外的东西。如果有任何编译或运行上的问题，请联系我。

## 向量理论

在上一篇学了矩阵理论后，你以为数学理论课就结束了？想得太美了，现在下一部分就来了：[向量](http://en.wikipedia.org/wiki/Euclidean_vector)。正统的理解认为向量是3D编程的基础。后面我会展示些代码，是用键盘来进行向量运算，让相机可以在不同方向上移动。

在3D中（2D中也一样），向量经常用来表示一些不同的东西，比如：

1. 位置（即，坐标）
2. 位移（比如，移动）
3. 方向（比如，南北，上下）
4. 速度（比如，车的速度和方向）
5. 加速（比如，重力）

你可能注意到了上面所提的一些概念都是通常是用来实现物理引擎的。我们在本文中不会实现所有的物理，但为了更好的理解向量，第一步让我们来一些物理教学。

什么是向量？<mark>一种伪数学的定义上来说，一个向量(vector)就是*幅度(magnitude)*加上*方向*。</mark>它能向上，向下，往左，往右，朝北，朝西南等等。你能用3D向量来表示任何一个你指向的方向。向量的另一部分，幅度，表示向量的长度或者大小。

向量最简单的可视化方式就是绘制它，一般向量都会被绘制为箭头。箭头所指的方向就是向量的方向，箭头的长度就是幅度。下面的图是一个2D向量，但2D的理论同样能应用到3D上。

![](/static/img/opengl-tutorials/visual_rep_of_vector.gif)

</br>
下面用例子来说明向量代表的不同含义。


|&nbsp;|方向|幅度|含义|
|:-----:|:-----:|:-----:|:--:|
|往北5千米|北|5千米|位置|
|头上5厘米|上|5厘米|位置|
|以50千米每小时开往西湖|西湖方向|50千米/每小时|速度|
|地球引力为9.8m/s<sup>2</sup>|往地球质心|9.8m/s<sup>2</sup>|加速|

</br>

<mark>当编码时，向量只是一组数字。每个数字都是向量的“一维”。比如，一个三维3D向量就是有3个数字的数组，2D向量是有2个数字。</mark>因为我们是在3D中进行工作，所以大部分情况只要处理3D向量，但我们也需要用到4D。无论何时我说“向量”，那意味着是3D向量。我们使用GLM的向量数学库，2D，3D，4D的类型分别为`glm::vec2`
,`glm::vec3`,`glm::vec4`。

3D向量表示顶点，坐标或者位置相当简单。<mark>3D向量的3个维度分别是X，Y，Z的值。</mark>当向量表示位置，方向和幅度时，都是从原点(0,0,0)开始计算的。比如，假设一个物体的XYZ坐标为(0,2,0)，则它的幅度是2，方向为“沿Y轴向上”。

## 负向量

<mark>当你要将向量取负时，就是保持相同的幅度，但变成了反方向。</mark>

比如：

![](/static/img/opengl-tutorials/vector_negation.gif)

<p align="center">
A=向北5千米</br>
-A=向南5千米</br>
</p>

如果相机的方向是往右的，我们可以使用负向量来算出相机往左的方向。就像这样：

```cpp
glm::vec3 rightDirection = gCamera.right();
glm::vec3 leftDirection = -rightDirection; //vector negation
```

## 标量乘法

<mark>当你将向量乘上一个数值时，新向量的结果表示相同的方向，但幅度被扩大了相应倍数。</mark>这个数值被称为“标量”，这就是为何该乘法被称为“标量乘法”。

比如：


![](/static/img/opengl-tutorials/scalar_mult.gif)
<p align="center">
A=向北5千米</br>
0.5 × A=向北2.5千米</br>
2 × A=向北10千米</br>
</p>

我们可以使用标量乘法来计算基于“移动速度”的相机位置，像这样：

```cpp
const float moveSpeed = 2.0; //units per second
float distanceMoved = moveSpeed * secondsElapsed;
glm::vec3 forwardDirection = gCamera.forward();
glm::vec3 displacement = distanceMoved * forwardDirection; //scalar multiplication
```

## 向量加法

向量加法在2D图形表现下最容易理解。对两个向量进行加法，就是将它们的头部（箭头一段）连接尾部（非箭头一段）。加法顺序不重要。它的结果就是，从第一个向量尾部走向另外一个向量的头部。


![](/static/img/opengl-tutorials/vector-addition.gif)

注意，即使这些向量看上去是在不同的位置上，但结果向量的幅度（长度）和方向不会改变。请记住，向量*只有*一个方向和一个幅度。它们没有起始点，所以它们可以在任意不同位置上，但还是相等的。

比如：

> A = 往北1千米
> 
> B = 往西1千米
> 
> A + B = 往西北1.41千米

向量减法相当于是加上一个负向量，比如：

> A = 往北1千米
> 
> B = 往西1千米
> 
> A - B = 往西北1.41千米
> 
> A + (-B) = 往西北1.41千米

我们使用向量加法来计算出相机位移后的的新位置，像这样：

```cpp
glm::vec3 displacement = gCamera.forward() * moveSpeed * secondsElapsed;
glm::vec3 oldPosition = gCamera.position();
glm::vec3 newPosition = oldPosition + displacement; //vector addition
gCamera.setPosition(newPosition);
```

## 单位向量

<mark>单位向量是幅度为1的向量。它们经常被用来表示方向。</mark>

当一个向量是用来表示方向时，它的幅度就没啥用处。即使这样，我们还是将它的幅度设为1，是为了计算时更方便一些。

当你在单位向量上使用标量乘法时，它的方向仍然不变，但幅度会被设为标量的值。因此，你将一个单位向量乘上5后，新的向量的幅度就是5。假如你乘上123，那幅度也就是123。基本上这允许我们设置任意一个向量的幅度，而不会更改它的方向。

让我们对相机进行往左移动12单位的操作。我们先设置一个方向为左的单位向量，然后使用标量乘法将它的幅度设为12，最后使用它来计算出新位置。代码看上去应该是这样的：

```cpp
// `gCamera.right()` returns a unit vector, therefore `leftDirection` will also be a unit vector.
// Negation only affects the direction, not the magnitude.
glm::vec3 leftDirection = -gCamera.right();
//`displacement` will have a magnitude of 12
glm::vec3 displacement = leftDirection * 12;
//`newPosition` will be 12 units to the left of `oldPosition`
glm::vec3 newPosition = oldPosition + displacement;
```

任何一个向量都能变为单位向量。这个操作叫做*单位化*。我们可以用GLM来单位化一个向量：

```cpp
glm::vec3 someRandomVector = glm::vec3(123,456,789);
glm::vec3 unitVector = glm::normalize(someRandomVector);
```

## tdogl::Camera类

恭喜你看到这儿了！现在你已经有足够的向量知识了，来，让我们开始编码。

[`tdogl::Camera`类的接口](https://github.com/tomdalling/opengl-series/blob/master/source/04_camera/source/tdogl/Camera.h)在[这里](https://github.com/tomdalling/opengl-series/blob/master/source/04_camera/source/tdogl/Camera.h)，实现代码在[这里](https://github.com/tomdalling/opengl-series/blob/master/source/04_camera/source/tdogl/Camera.cpp)。

在前面文章中我们在OpenGL中用矩阵来实现相机。`tdogl::Camera`类可以基于各种属性来创建矩阵，比如：

- 相机位置
- 相机朝向（方向）
- 缩放（视野）
- 最大和最小可视距离（远近平面）
- 视口/窗口纵横比

上面的每个属性都有各自的设置和获取接口。前文已经介绍过了。

现在让我们用`matrix`和`orientation`方法来实现如何让这所有属性组合成一个矩阵。

```cpp
glm::mat4 Camera::matrix() const {
    glm::mat4 camera = glm::perspective(_fieldOfView, _viewportAspectRatio, _nearPlane, _farPlane);
    camera *= orientation();
    camera = glm::translate(camera, -_position);
    return camera;
}

glm::mat4 Camera::orientation() const {
    glm::mat4 orientation;
    orientation = glm::rotate(orientation, _verticalAngle, glm::vec3(1,0,0));
    orientation = glm::rotate(orientation, _horizontalAngle, glm::vec3(0,1,0));
    return orientation;
}
```

我们可以看到，最终的相机矩阵是由四个不同的变换组成。按顺序是：

- 移动，基于相机位置
- 旋转，基于相机水平（左/右）转角
- 旋转，基于相机垂直（上/下）转角
- 透视，基于视野，近平面，远平面和纵横比

假如你觉得这顺序是反的，那请记住矩阵乘法是从右往左，代码上顺序是从底往上。

注意，移动用了相机的*负*位置。这里再次用前文提到的方式，我们可以让3D场景往后来实现相机往前走。向量为负时会反转其方向，所以“往前”就变成“往后”。

`tdogl::Camera`类还有其它方法来返回单位向量：`上`,`右`和`前`。我们需要从键盘获取消息来实现相机移动。

## 相机方位矩阵求逆

让我来看下`tdogl::Camera::up`方法的实现，这里有两个东西我们还没有提及。

```cpp
glm::vec3 Camera::up() const {
    glm::vec4 up = glm::inverse(orientation()) * glm::vec4(0,1,0,1);
    return glm::vec3(up);
}
```

我们看到它使用了`glm::inverse`方法。从上一篇文章中，我们知道矩阵能对坐标进行变换。在这里，我们还需要对坐标进行“反变换”，使得我们能获得矩阵乘法变换前的坐标。为了实现这个目的，我们需要计算*逆*矩阵。<mark>逆矩阵是一个矩阵，*完全相反*于另外一个矩阵，这意味着它能*撤销*另外一个矩阵的变换。</mark>比如，矩阵`A`是绕着Y轴旋转90°，那矩阵`A`的逆矩阵就是绕着Y轴旋转-90°。

当相机的方向改变时，“向上”的方向也随之改变。比如，想象下有个箭头指向你的头顶，假如你旋转你的头往地上看，那箭头就是向前倾斜，假如你往天上看，那箭头是向后倾斜的。如果你往前看，就是你的头“不旋转”，那箭头就是笔直向上。我们用“笔直向上”的单位向量(0,1,0)来表示相机的向上方向，“不旋转”使用相机方位矩阵的逆矩阵。另外一种解释，在相机旋转后，向上方向总是为(0,1,0)，所以我们要将逆旋转乘上(0,1,0)，这就能得到相机旋转前的向上方向。

(0,1,0)是单位向量，当你旋转一个单位向量结果还是一个单位向量。假如结果*不是*单位向量，你应该使用`glm::normalize`来单位化。

计算相机的`前`和`右`方向是同样的方式。

你可能注意到了这里用了一个4D向量`glm::vec4`。前文解释过，4x4 矩阵(`glm::mat4`)需要一个4D向量来进行矩阵乘法，使用`glm::vec3`会导致编译错误。只要把3D向量(0,1,0)变成4D向量(0,1,0,1)就可以进行矩阵乘法了，计算完成后我们再将4D向量变回3D向量。

## 整合tdogl::Camera类

现在我们开始使用`tdogl:Camera`类。

在之前的文章中，我们分别设置了投影矩阵和相机矩阵两个着色器变量。在本文中，`tdogl::Camera`合并了这两个矩阵，所以让我们移除`projection`着色器变量，只用`camera`变量就足够了。下面是顶点着色器的更新：

```cpp
#version 150

uniform mat4 camera;
uniform mat4 model;

in vec3 vert;
in vec2 vertTexCoord;

out vec2 fragTexCoord;

void main() {
    // Pass the tex coord straight through to the fragment shader
    fragTexCoord = vertTexCoord;
    
    // Apply all matrix transformations to vert
    gl_Position = camera * model * vec4(vert, 1);
}
```

现在我们将`tdogl::Camera`整合到`main.cpp`中。首先包含头文件：

```cpp
#include "tdogl/Camera.h"
```

然后声明全局变量：

```cpp
tdogl::Camera gCamera;
```

在前一篇文章中，相机和投影矩阵是不会改变的，所以在`LoadShaders`函数中设置一次就好了。但在本文中，因为我们需要用鼠标和键盘来控制，所以设置相机矩阵要放在`Render`函数中并每帧都要设置一下。首先让我们移除旧代码：

```cpp
static void LoadShaders() {
    std::vector<tdogl::Shader> shaders;
    shaders.push_back(tdogl::Shader::shaderFromFile(ResourcePath("vertex-shader.txt"), GL_VERTEX_SHADER));
    shaders.push_back(tdogl::Shader::shaderFromFile(ResourcePath("fragment-shader.txt"), GL_FRAGMENT_SHADER));
    gProgram = new tdogl::Program(shaders);

    // the commented-out code below was removed
    /* 
    gProgram->use();

    //set the "projection" uniform in the vertex shader, because it's not going to change
    glm::mat4 projection = glm::perspective<float>(50.0, SCREEN_SIZE.x/SCREEN_SIZE.y, 0.1, 10.0);
    //glm::mat4 projection = glm::ortho<float>(-2, 2, -2, 2, 0.1, 10);
    gProgram->setUniform("projection", projection);

    //set the "camera" uniform in the vertex shader, because it's also not going to change
    glm::mat4 camera = glm::lookAt(glm::vec3(3,3,3), glm::vec3(0,0,0), glm::vec3(0,1,0));
    gProgram->setUniform("camera", camera);

    gProgram->stopUsing();
    */
}
```

然后，在`Render`函数中设置`camera`着色器变量：

```cpp
// draws a single frame
static void Render() {
    // clear everything
    glClearColor(0, 0, 0, 1); // black
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    // bind the program (the shaders)
    gProgram->use();

    // set the "camera" uniform
    gProgram->setUniform("camera", gCamera.matrix());
```

`gCamera.matrix()`函数返回的是一个`glm::mat4`, 并且`setUniform`函数使用了`glUniformMatrix4fv`来设置顶点着色器中的相机矩阵uniform变量。

在`AppMain`函数中设置相机的初始化位置和视窗纵横比。

```cpp
gCamera.setPosition(glm::vec3(0,0,4));
gCamera.setViewportAspectRatio(SCREEN_SIZE.x / SCREEN_SIZE.y);
```

其余相机属性都留成默认值。

你现在运行程序，会看到上次实现的旋转立方体。下一步就让我们用鼠标和键盘来控制相机。

## 键盘输入

我们先来实现键盘控制。每次我们更新屏幕时，我们先检查'W','A','S'或'D'按键是否被按下，如果有触发那就稍微移动下相机。函数`glfwGetKey`返回一个布尔值来表示这个按键是否按下。新的`Update`函数看上去是这样的：

```cpp
// update the scene based on the time elapsed since last update
void Update(float secondsElapsed) {
    //rotate the cube
    const GLfloat degreesPerSecond = 180.0f;
    gDegreesRotated += secondsElapsed * degreesPerSecond;
    while(gDegreesRotated > 360.0f) gDegreesRotated -= 360.0f;

    //move position of camera based on WASD keys
    const float moveSpeed = 2.0; //units per second
    if(glfwGetKey(gWindow, 'S')){
        gCamera.offsetPosition(secondsElapsed * moveSpeed * -gCamera.forward());
    } else if(glfwGetKey(gWindow, 'W')){
        gCamera.offsetPosition(secondsElapsed * moveSpeed * gCamera.forward());
    }
    if(glfwGetKey(gWindow, 'A')){
        gCamera.offsetPosition(secondsElapsed * moveSpeed * -gCamera.right());
    } else if(glfwGetKey(gWindow, 'D')){
        gCamera.offsetPosition(secondsElapsed * moveSpeed * gCamera.right());
    }
}
```

我们先忽略立方体的旋转。

当`S`键被按下时，我们可以看得更近些：

```cpp
gCamera.offsetPosition(secondsElapsed * moveSpeed * -gCamera.forward());
```

这一行代码做了好多事，让我们用更容易懂的方式重写一遍，新的函数叫`MoveCameraBackwards`。

```cpp
void MoveCameraBackwards(float secondsElapsed) {
    //TODO: finish writing this function
}
```

向后是一个方向，所以应该是个单位向量。在相机类中没有`backward`函数，但它有个`forward`函数。向后就是向前的反方向，所以我们只要对向前的单位向量取负数即可。


```cpp
void MoveCameraBackwards(float secondsElapsed) {
    //`direction` is a unit vector, set to the "backwards" direction
    glm::vec3 direction = -gCamera.forward();

    //TODO: finish writing this function
}
```

然后，我们应该知道将相机移多*远*。我们有相机的移动速度`moveSpeed`，我们还知道从上一帧到现在过去了多少时间`secondsElapsed`。对这两个值进行乘法，就能得到相机移动的距离。

```cpp
void MoveCameraBackwards(float secondsElapsed) {
    //`direction` is a unit vector, set to the "backwards" direction
    glm::vec3 direction = -gCamera.forwards();

    //`distance` is the total distance to move the camera
    float distance = moveSpeed * secondsElapsed;

    //TODO: finish writing this function
}
```

现在，我们知道了移动的距离和方向，我们就能构造一个位移向量。它的幅度就是`distance`，它的方向就是`direction`。因为`direction`是个单位向量，我们可以用标量乘法来设置幅度。


```cpp
void MoveCameraBackwards(float secondsElapsed) {
    //`direction` is a unit vector, set to the "backwards" direction
    glm::vec3 direction = -gCamera.forwards(); //vector negation

    //`distance` is the total distance to move the camera
    float distance = moveSpeed * secondsElapsed;

    //`displacement` is a combination of `distance` and `direction`
    glm::vec3 displacement = distance * direction; //scalar multiplication

    //TODO: finish writing this function
}
```

最后，我们移动（或者说是置换）相机当前位置。用向量加法即可。最基础的公式`newPosition = oldPosition + displacement`。

```cpp
void MoveCameraBackwards(float secondsElapsed) {
    //`direction` is a unit vector, set to the "backwards" direction
    glm::vec3 direction = -gCamera.forwards(); //vector negation

    //`distance` is the total distance to move the camera
    float distance = moveSpeed * secondsElapsed;

    //`displacement` is a combination of `distance` and `direction`
    glm::vec3 displacement = distance * direction; //scalar multiplication

    //change the position of the camera
    glm::vec3 oldPosition = gCamera.position();
    glm::vec3 newPosition = oldPosition + displacement; //vector addition
    gCamera.setPosition(newPosition);
}
```

完成了！`MoveCameraBackwards`函数这么多行代码跟这一行代码是一样的：

```cpp
gCamera.offsetPosition(secondsElapsed * moveSpeed * -gCamera.forward());
```

`offsetPosition`函数做的就是向量加法，它将位移向量作为参数传入。让我们使用那一行代码来替换`MoveCameraBackwards`函数，因为简洁就是美。

其余按键的工作方式都是相同的，无非是方向不同而已。让我们再添加`Z`和`X`键来实现相机上和下。

```cpp
if(glfwGetKey(gWindow, 'Z')){
    gCamera.offsetPosition(secondsElapsed * moveSpeed * -glm::vec3(0,1,0));
} else if(glfwGetKey(gWindow, 'X')){
    gCamera.offsetPosition(secondsElapsed * moveSpeed * glm::vec3(0,1,0));
}
```

注意，为什么这里用向量(0,1,0)而不是`gCamera.up()`。记住，“向上”方向会随着相机方向而改变。假如相机看地上，“向上”指的是向前，假设相机看天上，“向上”指的是向后。这并不是我想实现的行为，我希望的是“笔直向上”的方向(0,1,0)，不依赖于相机的方向。

现在当你运行程序，你能使用`W`, `A`, `S`, `D`, `X`,和`Z`键来向前移动，向左移动，向后移动，向右移动，向上移动和向下移动。观察时不会因为相机移动而改变方向，这个将留个鼠标来控制。

## 鼠标输入

此时，我们的窗口还无法捕捉鼠标消息。你能看到鼠标在窗口上移来移去。我希望它消失，并且不希望它移出窗口。为了实现这个，我们要改下GLFW的设置。

在我们捕获鼠标之前，让我们先实现用取消键（Esc）退出程序。我不想再点击关闭按钮了，因为鼠标隐藏，并且无法离开窗口。让我们在`AppMain`主循环下放加上些代码：

```cpp
// run while the window is open
double lastTime = glfwGetTime();
while(!glfwWindowShouldClose(gWindow)){
    // process pending events
    glfwPollEvents();

    // update the scene based on the time elapsed since last update
    double thisTime = glfwGetTime();
    Update((float)(thisTime - lastTime));
    lastTime = thisTime;
    
    // draw one frame
    Render();

    // check for errors
    GLenum error = glGetError();
    if(error != GL_NO_ERROR)
        std::cerr << "OpenGL Error " << error << std::endl;

    //exit program if escape key is pressed
    if(glfwGetKey(gWindow, GLFW_KEY_ESCAPE))
        glfwSetWindowShouldClose(gWindow, GL_TRUE);
}
```

当我们用`glfwCreateWindow`打开窗口这样设置时，就可以捕获鼠标了：

```cpp
// GLFW settings
glfwSetInputMode(gWindow, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
glfwSetCursorPos(gWindow, 0, 0);
```

这段代码让鼠标消失了，并且将它移动到了像素坐标(0,0)。在`Update`中，我们会获取鼠标位置来更新相机，更新完后将鼠标坐标再次设为(0,0)。这种方式可以很方便的看出每帧鼠标移动了多少，还要在当鼠标要移出窗口时停住它。在`Update`函数下面添加以下代码：

```cpp
//rotate camera based on mouse movement
const float mouseSensitivity = 0.1f;
double mouseX, mouseY;
glfwGetCursorPos(gWindow, &mouseX, &mouseY);
gCamera.offsetOrientation(mouseSensitivity * (float)mouseY, mouseSensitivity * (float)mouseX);
glfwSetCursorPos(gWindow, 0, 0); //reset the mouse, so it doesn't go out of the window
```

鼠标的坐标单位是像素，但相机方向是基于两个角度。这就是为何我们使用`mouseSensitivity`变量来将像素转为角度。越大的鼠标灵敏度，相机转向的越快，越小的灵敏度，转向的越慢。灵敏度设为`0.1f`的含义就是每10像素就旋转1°。

`offsetOrientation`函数类似于`offsetPosition`函数，它会使用水平和垂直角度来更新相机方向。

好了！基本到这就完成了。你现在运行程序的话，你能绕着飞行并且[几乎](http://en.wikipedia.org/wiki/Gimbal_lock)能观察任意方向。立方体的旋转动画可能会让你在环绕时失去方向感，我们可以关闭它。

## 用鼠标滚轮控制视野

就像蛋糕上的糖衣一样，我们可以滚动鼠标或者在触摸板上滑动来实现相机镜头的视野缩放。上篇文章我们已经解释过视野的概念了。

我们使用同样的方式来使用鼠标位置，并且每帧重置滚动值。首先我们创建一个全局变量来保存滚动值：

```cpp
double gScrollY = 0.0;
```

使用GLFW来接受滚轮消息，首先我们得创建个回调：

```cpp
// records how far the y axis has been scrolled
void OnScroll(GLFWwindow* window, double deltaX, double deltaY) {
  gScrollY += deltaY;
}
```

然后我们用GLFW在`AppMain`中注册下回调：

```cpp
glfwSetScrollCallback(gWindow, OnScroll);
```

当每帧我们渲染的时候，我们使用`gScrollY`值来更改视野。代码放在`Update`函数的下放：

```cpp
const float zoomSensitivity = -0.2f;
float fieldOfView = gCamera.fieldOfView() + zoomSensitivity * (float)gScrollY;
if(fieldOfView < 5.0f) fieldOfView = 5.0f;
if(fieldOfView > 130.0f) fieldOfView = 130.0f;
gCamera.setFieldOfView(fieldOfView);
gScrollY = 0;
```

`zoomSensitivity`常量类似`mouseSensitivity`常量。视野取值范围是0°到180°，但假如你设置的值离上下限很近的话，3D场景看上去会很奇怪，所以我们限制这个值范围在5°到130°。类似鼠标位置的方法，我们在每帧之后设置`gScrollY = 0`。

## 下篇预告

下一篇文章，我们会重构代码来实现最最基本的“引擎”。我们会将代码分为资产（资源）和实例，类似典型的3D引擎，可以生成有多个略微不同的木箱子的3D场景。

## 更多资源

- [The vector math chapter of Learning Modern 3D Graphics Programming](http://www.arcsynthesis.org/gltut/Basics/Introduction.html) by Jason L. McKesson
- [Vector maths – a primer for games programmers](http://www.wildbunny.co.uk/blog/vector-maths-a-primer-for-games-programmers/)
- [Basic 3D Math: Vectors](http://www.matrix44.net/cms/notes/opengl-3d-graphics/basic-3d-math-vectors) by Egon Rath
- [Wikipedia article on vectors](http://en.wikipedia.org/wiki/Euclidean_vector), which isn't very beginner-friendly
- The GLFW [guides](http://www.glfw.org/docs/3.0.4/pages.html) and [references](http://www.glfw.org/docs/3.0.4/modules.html).
- 假如你有任何关于向量方面对初学者友好的文章，请发送给我，我会添加进来。
