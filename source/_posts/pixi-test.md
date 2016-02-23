---
layout: post
title: pixi.js初体验
categories: js
tags: [js, pixi]
description: pixi.js 是一款超快开源 HTML5 2D 渲染引擎
keywords: pixi, js, 渲染, HTML5
date: 2016-02-21
---



有谁还记得[边城浪子](https://www.zhihu.com/people/eastecho)吗？有谁还记得闪客帝国吗？感觉这是个暴露年龄的问题。

记得我初中那会有了台自己的电脑。然后用猫上网挂着，以可怜的下载速度，用网站抓取软件下载闪客里的Flash小游戏到本地。当然，一到每月话费结算的时候，都少不了家长的一顿揍。

在知乎上看到边城浪子创建了独立游戏社区[独立精神](http://indienova.com/)，上去看了下，原创和翻译的文章都很赞，而且有很多在线的js动画，能很好的展示相关算法。搞的我也心痒痒想学下js。

刚好网站上有篇[pixi.js 初步](http://indienova.com/indie-game-development/pixie-js-getting-started/)介绍，看着也挺简单，打算在自己Hexo搭建的这个博客上也用上pixi.js。

<!--more-->

遇到这么几个问题，希望对大家有用。

- 教学文章里创建canvas用的方法是：
  
  ``` javascript
  <script>
  var renderer = PIXI.autoDetectRenderer(800, 400, {backgroundColor : 0x1099bb});
  document.body.appendChild(renderer.view);
  </script>
  ```
  
  如果你要指定canvas的话，可以这样：
  
  ``` javascript
  <body>
  <canvas id="canvas"></canvas>
  <script>
  var canvas = document.getElementById("canvas");
  var renderer = PIXI.autoDetectRenderer(800, 400, {view: canvas});
  </script>
  </body>
  ```


- 对canvas不能进行`getContext`
  
  ``` 
  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext("2d");
  ```
  
  我发现`getContext`之后就绘制不出来了，别问我原因，我js是菜鸟。
  
- 要在HTTP服务器环境下运行，直接在本地打开HTML文件是没法使用的。
  
  比如打开链接`file:///D:/source/static/pixitest.html`，当创建Sprite的时候，指定img资源路径console显示不能跨域操作。
  
- HTML文件放在某些目录下会被Hexo转换掉。这就需要设定忽略目录，在Hexo的`_config.yml`里配置如下：
  
  ``` yaml
  skip_render: 
    - '_drafts/**'
    - 'static/**'
  ```
  
- 我现在是用`iframe`方式嵌入。可能是因为我主题的缘故，在md里定义了一些CSS和Script后，显示会出现错乱。用`iframe`的方式比较独立单纯些，不会跟主题本身的一些定义混杂。



下面窗口的这个例子，大家可以直接跳转到[pixitest.html](/static/pixitest.html)去查看源码。

<br/><iframe src="/static/pixitest.html" height="400" width="800"></iframe>