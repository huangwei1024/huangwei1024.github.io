// Visibility algorithm visualization
// Copyright 2012 Red Blob Games
// License: Apache v2

"use strict";

// This implements the diagrams on
// <http://www.redblobgames.com/articles/visibility/>. The core
// algorithm is in Visibility.hx (compiled into
// compiled_visibility.js). The UI code here is a bit messy. It's
// mutated quite a bit as I changed my plans for the page, adding and
// removing daigrams. The core code in Visibility.hx is a bit cleaner; I
// also use it in other projects.

// TODO: test performance on Firefox, Dolphin, Opera on Android

// Paul Irish's requestAnimationFrame: http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          window.oRequestAnimationFrame      ||
          window.msRequestAnimationFrame     ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();


// Pass in the configuration: size and storageArea (extra space on the right)
// Also pass in the center position and the blocks. These will be *modified* by
// the UI. Also pass in additional walls, which will not be moveable.
function makeDiagram(rootId, options, center, blocks, walls, lights) {
    // Scratch area on right where you can keep blocks
    var size = (options.size || 400);
    var maxStorageColumn = size + (options.storageArea || 0);
    var drawLights = (lights.length > 0);
    var gridMargin = 20;

    // References to the DOM
    var body = $('body');
    var root = $('#' + rootId);
    root
        .css('position', 'relative')
        .css('width', maxStorageColumn+1)
        .css('height', size+1);
    // TODO: if canvas isn't available place error text into the root

    // Canvas layers
    var grid, visible, centerLayer, knobWidget;

    // The algorithm is implemented in Visibility.hx, compiled to compiled_visibility.js
    var visibility = new Visibility();

    // Since people are dragging things around in the workspace, and
    // dragging is also used for scrolling on touch devices, disable
    // the scrolling if dragging happens inside the workspace
    root.on('touchmove', function(event) { event.preventDefault(); });

    // We'll make some elements in the workspace draggable:
    function makeDraggable(node, model, limits) {
        var epsilon = 1e-2; // keep the draggable inside the box by this amount
        
        // TODO: use jquery-ui draggable?
        node.on('mousedown touchstart', function(event) {
            var up = (event.type == 'touchstart')? 'touchend' : 'mouseup';
            var move = (event.type == 'touchstart')? 'touchmove' : 'mousemove';
            
            event.preventDefault();
            
            // Store the offset between the object's center and the
            // mouse position. We want to preserve this offset when
            // moving the object relative to the mouse. This is a
            // minor touch but it makes the dragging feel better.
            var dx = model.x - (event.originalEvent.touches? event.originalEvent.touches[0].pageX : event.pageX);
            var dy = model.y - (event.originalEvent.touches? event.originalEvent.touches[0].pageY : event.pageY);

            // TODO: handle multitouch?; see http://buildnewgames.com/mobile-game-primer/
            
            body.on(up, function(event) {
                event.preventDefault();
                body.off(move);
                body.off(up);
                return false;
            });
            
            body.on(move, function(event) {
                event.preventDefault();
                var x = dx + (event.originalEvent.touches? event.originalEvent.touches[0].pageX : event.pageX);
                var y = dy + (event.originalEvent.touches? event.originalEvent.touches[0].pageY : event.pageY);

                if (x < limits[0] + epsilon) x = limits[0] + epsilon;
                if (x > limits[1] - epsilon) x = limits[1] - epsilon;
                if (y < limits[2] + epsilon) y = limits[2] + epsilon;
                if (y > limits[3] - epsilon) y = limits[3] - epsilon;
                model.x = x;
                model.y = y;

                updateAll();
                return false;
            });
        });
    }


    // Layer to show floor visible from the center, blocks, and then walls
    function makeVisibleLayer() {
        visible = $('<canvas>').appendTo(root);
        visible
            .css('position', 'absolute')
            .attr('width', maxStorageColumn + 1)
            .attr('height', size + 1);
    }


    // 2 layers for each blocks, one output and one input. The output
    // will be off-screen and copied to the visible layer; the input
    // will be above the visible layer. That way we can drag the input
    // around, and draw the block underneath other layers.
    function makeBlocks() {
        blocks.forEach(function(block, i) {
            // TODO: look at canvas "hit regions" too, as an
            // alternative to using separate canvases for the mouse
            // events
            block.inputNode = $('<canvas>').appendTo(root);
            block.inputNode
                .css('position', 'absolute')
                .css('cursor', 'move')
                .attr('width', block.r * 2)
                .attr('height', block.r * 2);
            makeDraggable(block.inputNode, block, [block.r, maxStorageColumn - block.r,
                                                   block.r, size - block.r]);
            
            // Don't add this canvas to the DOM; its contents get copied with drawImage()
            block.outputNode = $('<canvas>');
            block.outputNode
                .attr('width', block.r * 2)
                .attr('height', block.r * 2);

            var g = block.outputNode.get(0).getContext('2d');
            var hue = 75;
            
            var gradient = g.createRadialGradient(block.r, block.r, 0,
                                                  block.r*0.7, block.r*0.7, block.r * 1.5);
            gradient.addColorStop(0.0, 'hsl(' + hue + ', 40%, 40%)');
            gradient.addColorStop(0.5, 'hsl(' + hue + ', 50%, 35%)');
            gradient.addColorStop(1.0, 'hsl(' + hue + ', 60%, 30%)');

            g.save();
            g.fillStyle = gradient;
            g.strokeStyle = 'hsl(' + hue + ', 20%, 30%)';
            g.lineWidth = 2;
            g.beginPath();
            g.rect(0, 0, block.r * 2, block.r * 2);
            g.fill();
            g.stroke();
            g.restore();
        });
    }


    function getMaxAngle() {
        // If the slider is disabled, the max angle is PI
        return knobWidget? knobWidget.slider('value') : Math.PI;
    }
    
    function setMaxAngle(maxAngle) {
        // This should never get called if the slider is disabled
        knobWidget.slider('value', maxAngle);
    }

    
    function updateBlocks() {
        blocks.forEach(function(block, i) {
            block.inputNode
                .css('left', block.x - block.r)
                .css('top', block.y - block.r);
        });
    }


    function makeCenter() {
        // Note: the circle drag area is extra large for touch screen
        // devices, where it's harder to get the finger in the right
        // spot. (The circle itself isn't any bigger.)
        var s = center.r * 5;
        
        centerLayer = $('<canvas>').appendTo(root);
        centerLayer
            .css('position', 'absolute')
            .css('cursor', 'move')
            .attr('width', s)
            .attr('height', s);
        
        var g = centerLayer.get(0).getContext('2d');
        g.save();
        g.fillStyle = 'hsl(60, 100%, 63%)';
        g.strokeStyle = 'hsl(60, 60%, 30%)';
        g.beginPath();
        g.arc(s/2, s/2, center.r, 0, 2*Math.PI, true);
        g.fill();
        g.stroke();
        g.restore();
        
        makeDraggable(centerLayer, center, [gridMargin, size - gridMargin,
                                            gridMargin, size - gridMargin]);
    }


    function updateCenter() {
        centerLayer
            .css('left', (center.x - parseFloat(centerLayer.attr('width'))/2) + 'px')
            .css('top', (center.y - parseFloat(centerLayer.attr('height'))/2) + 'px');
    }


    var _needsRedraw = false;
    function redrawAll() {
        _needsRedraw = false;

        visibility.loadMap(size, gridMargin,
                           blocks.filter(function (block) { return block.x - block.r < size; }),
                           walls.map(function (wall) {
                               return {p1: {x: wall[0], y: wall[1]}, p2: {x: wall[2], y: wall[3]}}})
                          );
        visibility.setLightLocation(center.x, center.y);
        visibility.sweep(getMaxAngle());

        updateCenter();
        updateBlocks();
        redraw();
    }
    
    function updateAll() {
        _needsRedraw = true;
        requestAnimFrame(redrawAll);
    }


    function makeGridLayer() {
        grid = $('<canvas>').appendTo(root);
        grid
            .css('position', 'absolute')
            .attr('width', maxStorageColumn + 1)
            .attr('height', size + 1);
        drawGrid();
    }

    
    function drawGrid() {
        var stepSize = 20;
        var g = grid.get(0).getContext('2d');
        
        // Background
        g.fillStyle = 'hsl(210, 50%, 25%)';
        g.fillRect(0, 0, size+1, size+1);

        // Draw the static lights -- NOTE: this can't handle blocks
        // moving around. NOTE: This should use additive blend mode
        // but canvas doesn't support that so I use 'lighter'
        // composite operation instead, which causes the lights to be
        // more bluish and less yellowish. That's ok for this demo.
        if (drawLights) {
            g.save();
            g.globalAlpha = options.lightAlpha || 0.8;
            g.globalCompositeOperation = 'lighter';
            var v = new Visibility();
            v.loadMap(size, gridMargin, blocks, walls.map(function (wall) {
                return {p1: {x: wall[0], y: wall[1]}, p2: {x: wall[2], y: wall[3]}}}));
            lights.forEach(function (p) {
                v.setLightLocation(p[0], p[1])
                v.sweep(Math.PI);
                var paths = computeVisibleAreaPaths({x: p[0], y: p[1]}, v.output);
                var gradient = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], options.lightRadius || 100);
                gradient.addColorStop(0.0, 'hsla(60, 100%, 50%, 1.0)');
                if (options.lightGradientStyle == 2) {
                    gradient.addColorStop(0.1, 'hsla(-40, 20%, 30%, 1.0)');
                    gradient.addColorStop(0.99, 'hsla(-40, 20%, 30%, 1.0)');
                    gradient.addColorStop(1.0, 'hsla(60, 70%, 50%, 1.0)');
                } else {
                    gradient.addColorStop(0.03, 'hsla(60, 100%, 100%, 1.0)');
                    gradient.addColorStop(0.04, 'hsla(60, 80%, 75%, 0.4)');
                    gradient.addColorStop(1.0, 'hsla(60, 50%, 75%, 0.05)');
                }
                g.fillStyle = gradient;
                g.beginPath();
                interpretSvg(g, paths.floor);
                g.fill();
            });
            g.restore();
        }
        
        // Draw the grid on the left side
        g.strokeStyle = 'hsla(210, 0%, 10%, 0.2)';
        g.lineWidth = 1.5;
        g.beginPath();
        for (var x = 0.5; x <= 0.6 + size; x += stepSize) {
            g.moveTo(0, x);
            g.lineTo(size, x);
            g.moveTo(x, 0);
            g.lineTo(x, size);
        }
        g.stroke();

        // Draw a storage area on the right
        g.fillStyle = 'hsl(35, 30%, 90%)';
        g.strokeStyle = 'hsl(35, 0%, 50%)';
        g.beginPath();
        g.rect(size+1, 0, maxStorageColumn - size, size+1);
        g.fill();
        g.stroke();
    }


    function interpretSvg(g, path) {
        for (var i = 0; i < path.length; i++) {
            if (path[i] == 'M') { g.moveTo(path[i+1], path[i+2]); i += 2; }
            if (path[i] == 'L') { g.lineTo(path[i+1], path[i+2]); i += 2; }
        }
    }

    
    function computeVisibleAreaPaths(center, output) {
        var path1 = [];
        var path2 = [];
        var path3 = [];

        for (var i = 0; i < output.length; i += 2) {
            var p1 = output[i];
            var p2 = output[i+1];
            if (isNaN(p1.x) || isNaN(p1.y) || isNaN(p2.x) || isNaN(p2.y)) {
                // These are collinear points that Visibility.hx
                // doesn't output properly. The triangle has zero area
                // so we can skip it.
                continue;
            }

            path1.push("L", p1.x, p1.y, "L", p2.x, p2.y);
            path2.push("M", center.x, center.y, "L", p1.x, p1.y, "M", center.x, center.y, "L", p2.x, p2.y);
            path3.push("M", p1.x, p1.y, "L", p2.x, p2.y);
        }

        return {floor: path1, triangles: path2, walls: path3};
    }


    function getEndpointAngles() {
        var angles = [];
        visibility.endpoints.toArray().forEach(function (endpoint) {
            // Since many endpoints are part of more than one line segments
            // there will be duplicates, which we discard here
            if (angles.length == 0 || endpoint.angle != angles[angles.length-1]) {
                angles.push(endpoint.angle);
            }
        });
        return angles;
    }
       
        
    function drawRays(g, path, option) {
        g.save();
        
        g.beginPath();
        interpretSvg(g, path);
        g.clip();

        var angles = [];
        if (option == 'endpoints') {
            angles = getEndpointAngles();
        } else {
            // A fixed set of angles
            var numAngles = 60;
            for (var i = 0; i < numAngles; i++) {
                angles.push(2 * Math.PI * i / numAngles);
            }
        }
        
        g.strokeStyle = 'hsla(30, 100%, 70%, 0.3)';
        g.lineWidth = 2;
        g.beginPath();
        angles.forEach(function(angle) {
            g.moveTo(center.x, center.y);
            g.lineTo(center.x + size * Math.cos(angle), center.y + size * Math.sin(angle));
        });
        g.stroke();
        
        g.restore();
    }

    
    function drawFloor(g, path, solidStyle) {
        var gradient = g.createRadialGradient(center.x, center.y, 0,
                                              center.x, center.y, size*0.75);
        gradient.addColorStop(0.0, 'hsla(60, 100%, 75%, 0.5)');
        gradient.addColorStop(0.5, 'hsla(60, 50%, 50%, 0.3)');
        gradient.addColorStop(1.0, 'hsla(60, 60%, 30%, 0.1)');
        
        g.save();
        g.fillStyle = solidStyle? 'hsla(60, 75%, 60%, 0.2)' : gradient;
        g.beginPath();
        g.moveTo(center.x, center.y);
        interpretSvg(g, path);
        g.lineTo(center.x, center.y);
        
        if (drawLights) {
            // When lights are involved, the lighting has already been
            // applied. Instead of lighting up the areas we can see,
            // invert the fill region, blacking out areas we can't
            // see.
            g.fillStyle = 'rgba(0, 0, 16, 0.8)';
            g.moveTo(0, 0); g.lineTo(0, size); g.lineTo(size, size); g.lineTo(size, 0);
        }
        g.fill();
        g.restore();
    }


    function drawFloorTriangles(g, path) {
        g.save();
        g.strokeStyle = 'hsl(80, 30%, 25%)';
        g.beginPath();
        interpretSvg(g, path);
        g.stroke();
        g.restore();
    }


    // Draw the blocks, plus possible intersections
    function drawBlocks(g) {
        blocks.forEach(function (block) {
            // Optimization: integer coordinates -- see http://seb.ly/2011/02/html5-canvas-sprite-optimisation/
            var rounded_x = Math.round(block.x - block.r);
            var rounded_y = Math.round(block.y - block.r);
            g.drawImage(block.outputNode.get(0), rounded_x, rounded_y);
        });

        g.save();
        g.strokeStyle = 'hsl(0, 50%, 30%)';
        g.lineWidth = 4;
        g.beginPath();
        visibility.demo_intersectionsDetected.forEach(function (segment) {
            g.moveTo(segment[0].x, segment[0].y);
            g.lineTo(segment[1].x, segment[1].y);
            g.moveTo(segment[2].x, segment[2].y);
            g.lineTo(segment[3].x, segment[3].y);
        });
        g.stroke();
        g.restore();
    }
    

    // Draw the walls lit up by the light
    function drawWalls(g, path) {
        g.save();
        g.strokeStyle = 'hsl(60, 100%, 90%)';
        g.lineWidth = 2;
        g.beginPath();
        interpretSvg(g, path);
        g.stroke();
        g.restore();

        // TODO: there's a corner case bug: if a wall is collinear
        // with the player, the wall isn't marked as being visible. An
        // alternative would be to draw all the walls and use the
        // floor area as a mask.
    }


    // Draw the segments
    function drawSegments(g) {
        var maxAngle = getMaxAngle();
        
        g.save();
        g.strokeStyle = 'hsl(30, 10%, 50%)';
        g.lineWidth = 2;
        var i = visibility.segments.iterator();
        while (i.hasNext()) {
            var segment = i.next();
            g.beginPath();
            g.moveTo(segment.p1.x, segment.p1.y);
            g.lineTo(segment.p2.x, segment.p2.y);
            g.stroke();
        }
        
        g.strokeStyle = 'hsl(30, 0%, 100%)';  // first one
        g.lineWidth = 3;
        var i = visibility.open.iterator();
        while (i.hasNext()) {
            var segment = i.next();
            g.beginPath();
            g.moveTo(segment.p1.x, segment.p1.y);
            g.lineTo(segment.p2.x, segment.p2.y);
            g.stroke();
            g.strokeStyle = 'hsl(30, 0%, 0%)';  // remaining segments
        }
        g.restore();
    }


    // Draw the endpoints of the segments
    function drawEndpoints(g) {
        var maxAngle = getMaxAngle();

        g.save();
	var i = visibility.endpoints.iterator();
	while (i.hasNext()) {
	    var p = i.next();
            if (p.visualize) {
                g.fillStyle = (p.angle < maxAngle + 1e-2)? 'hsl(60, 80%, 50%)' : 'hsl(60, 20%, 40%)';
                g.beginPath();
                g.arc(p.x, p.y, (Math.abs(p.angle - maxAngle) < 1e-2)? 5 : 3, 0, 2*Math.PI, true);
                g.fill();
            }
        }
        g.restore();
    }


    // Draw a sweep line that will be animated around 360 degrees
    function drawSweepLine(g) {
        var maxAngle = getMaxAngle();

        g.save();
        g.strokeStyle = 'hsl(30, 100%, 70%)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(center.x, center.y);
        g.lineTo(center.x + size * Math.cos(maxAngle),
                 center.y + size * Math.sin(maxAngle));
        g.stroke();
        g.restore();
    }
    

    var _lastFinalizedTime = 0;

    // Draw the output, which should be calculated already before
    // calling this function. There are three phases:
    // 1. [partial] The sweep line hasn't made a complete circle. Scaffolding is drawn.
    // 2. [prefinal] The sweep line has made a circle but the scaffolding is still there.
    // 3. [final] Scaffolding is removed.
    function redraw() {
        var paths = computeVisibleAreaPaths(center, visibility.output);
        var fadeOutMilliseconds = 1000;
        var now = new Date().getTime();
        var maxAngle = getMaxAngle();
        
        if (maxAngle < Math.PI) { _lastFinalizedTime = now; }

        // 'fade' will be 0.0 until maxAngle reaches pi, and then it
        // will go from 0.0 to 1.0 over fadeOutMilliseconds ms.
        var fade = (now - _lastFinalizedTime) / fadeOutMilliseconds;
        if (0.0 < fade && fade < 1.0) {
            // We're in the pre-final stage and will want to keep
            // redrawing until we get out
            requestAnimFrame(redraw);
        }
        
        // Reset the canvas (note: clearRect is much faster than the
        // old way of resetting width -- see
        // http://www.html5rocks.com/en/tutorials/canvas/performance/
        var canvas = visible.get(0);
        var g = canvas.getContext('2d');
        g.clearRect(0, 0, canvas.width, canvas.height);

        // NOTE: the drawing options are a mess; I only put in what I
        // needed to for the diagrams, and it's not clean or
        // orthogonal or documented.
        
        g.globalAlpha = 0.5 + 0.5 * fade;
        if (options.drawFloor != false) {
            drawFloor(g, paths.floor, options.drawFloor);
            if (fade < 1.0) {
                g.globalAlpha = 1.0 - fade;
                drawFloorTriangles(g, paths.triangles);
            }
        }
        if (options.drawRays) {
            drawRays(g, paths.floor, options.drawRays);
        }
        g.globalAlpha = 1.0;
        drawBlocks(g);
        if (fade < 1.0 && options.drawSegments != false) {
            g.globalAlpha = 1.0 - fade;
            drawSegments(g);
        }
        g.globalAlpha = 0.5 + 0.5 * fade;
        drawWalls(g, paths.walls);
        g.globalAlpha = 1.0 - fade;
        if (options.drawEndpoints == true || fade < 1.0) {
            drawEndpoints(g);
        }
        if (fade < 1.0) {
            drawSweepLine(g);
        }
        g.globalAlpha = 1.0;
    }


    function makeSlider(sliderInitialPosition) {
        var container = $('<div>').insertAfter(root);
        var model = {radians: 0};
        
        var play = $('<input type="checkbox" id="' + rootId + '-playbutton">').appendTo(container);
        $('<label for="' + rootId + '-playbutton">Play</label>').appendTo(container);
        play
            .button({text: false, icons: {primary: 'ui-icon-play'}})
            .on('change', function() {
                if (play.prop('checked')) {
                    // Change the button to show pause
                    play.button('option', 'icons', {primary: 'ui-icon-pause'});
                    // Start the animation
                    model.radians = getMaxAngle();
                    if (getMaxAngle() >= Math.PI - 1e-4) {
                        // Reset the angle to the beginning
                        model.radians = -Math.PI;
                    }
                    $(model).animate({radians: Math.PI}, {
                        duration: 1500 * (Math.PI - model.radians),
                        easing: 'linear',
                        step: function() {
                            // Pick an angle from the endpoints
                            // HACK: only do this if the slider started on the left
                            if (sliderInitialPosition == 'left') {
                                var angles = getEndpointAngles();
                                var i = Math.floor((angles.length + 2) * (model.radians + Math.PI) / (2 * Math.PI));
                                setMaxAngle((i == 0) ? -Math.PI :
                                            (i == angles.length + 1) ? Math.PI :
                                            angles[i-1]);
                            } else {
                                setMaxAngle(model.radians);
                            }
                            updateAll();
                        },
                        complete: function() {
                            play.prop('checked', false);
                            play.button('option', 'icons', {primary: 'ui-icon-play'});
                            setMaxAngle(Math.PI);
                            updateAll();
                        }
                    });
                } else {
                    // Change the button to show play
                    play.button('option', 'icons', {primary: 'ui-icon-play'});
                    // Stop the animation
                    $(model).stop();
                }
            });
        
        knobWidget = $('<div>').appendTo(container);
        knobWidget
            .attr('class', 'slider')
            .css('display', 'inline-block')
            .css('background', '#ccc')
            .css('vertical-align', 'middle')
            .css('margin', '10px')
            .css('width', size-60);
        knobWidget.slider({min: -Math.PI, max: Math.PI, step: 0.01,
                           value: sliderInitialPosition == 'right'? Math.PI : -Math.PI})
            .on('slide', function(event, ui) {
                updateAll();
            });
    }
    
    
    function main() {
        makeGridLayer();
        makeVisibleLayer();
        makeBlocks();
        if (options.slider) { makeSlider(options.slider); }
        makeCenter();
        
        updateAll();
    }

    main()

    return {
        setLights: function(show) {
            drawLights = show;
            drawGrid();
            redraw();
        }
    };
}


var mazeWalls = [
    // Horizontal walls
    [20, 60, 60, 60], [60, 60, 100, 60], [100, 60, 140, 60], [140, 60, 180, 60],
    [60, 100, 100, 100], [100, 100, 140, 100],
    [260, 100, 300, 100], [300, 100, 340, 100],
    [140, 140, 180, 140], [180, 140, 220, 140],
    [300, 140, 340, 140], [340, 140, 380, 140],
    [140, 260, 180, 260], [180, 260, 220, 260],
    [215, 240, 225, 240], [260, 220, 275, 220],
    // Vertical walls
    [300, 20, 300, 60],
    [180, 60, 180, 100], [180, 100, 180, 140],
    [260, 60, 260, 100], [340, 60, 340, 100],
    [180, 140, 180, 180], [180, 180, 180, 220],
    [260, 140, 260, 180], [260, 180, 260, 220],
    [140, 220, 140, 260], [140, 260, 140, 300], [140, 300, 140, 340],
    [220, 240, 220, 260], [220, 340, 220, 380],
    // Wall with holes
    [220, 260, 220, 268], [220, 270, 220, 278], [220, 280, 220, 288],
    [220, 290, 220, 298], [220, 300, 220, 308], [220, 310, 220, 318],
    [220, 320, 220, 328], [220, 330, 220, 338],
    // Pillars
    [210, 70, 230, 70], [230, 70, 230, 90], [230, 90, 222, 90], [218, 90, 210, 90], [210, 90, 210, 70],
    [51, 240, 60, 231], [60, 231, 69, 240], [69, 240, 60, 249], [60, 249, 51, 240],
    // Curves
    [20, 140, 50, 140], [50, 140, 80, 150], [80, 150, 95, 180], [95, 180, 100, 220],
    [100, 220, 100, 260], [100, 260, 95, 300], [95, 300, 80, 330],
    [300, 180, 320, 220], [320, 220, 320, 240], [320, 240, 310, 260],
    [310, 260, 305, 275], [305, 275, 300, 300], [300, 300, 300, 310],
    [300, 310, 305, 330], [305, 330, 330, 350], [330, 350, 360, 360],
];

var mazeLights = [
    // top hallway
    [40, 59], [80, 21], [120, 59], [160, 21],
    [297, 23], [303, 23], [377, 23],
    [263, 97], [337, 97],
    // upper left room
    [23, 63], [177, 63], [23, 137], [177, 137],
    // round room on left
    [45, 235], [45, 240], [45, 245],
    // upper pillar
    [220, 80],
    // hallway on left
    [120, 280],
    // next to wall notch
    [217, 243],
    // inside room with holes
    [180, 290], [180, 320], [180, 350],
    // right curved room
    [320, 320],
    // right hallway
    [270, 170],
    ];


function makeFirstDiagram() {
    // Remove placeholder images, since we're replacing them with canvases
    $('.placeholder').remove();

    // Maze diagram with optional lights
    var maze = makeDiagram(
        'maze',
        {size: 400},
        {x: 200, y: 200, r: 10},
        [], mazeWalls, mazeLights);

    var mazeToggle = $('#maze-light-toggle input');
    var mazeLabel = $('#maze-light-toggle label');
    function mazeUpdate() {
        var lights = mazeToggle.prop('checked');
        maze.setLights(lights);
        mazeLabel.text(lights? "Hide the light map." : "See the light map.");
    }
    mazeToggle.button().on('change', mazeUpdate);
    mazeUpdate();
}

function makeOtherDiagrams() {
    // Diagram with moveable blocks, showing all the rays
    makeDiagram(
        'diagram-raycast-interval',
        {size: 400, drawRays: true, drawFloor: false},
        {x: 200, y: 200, r: 15},
        [
            {x:  95, y:  95, r: 25},
            {x: 215, y: 285, r: 30},
        ],
        [], []
    );

    makeDiagram(
        'diagram-raycast-endpoints',
        {size: 400, drawRays: 'endpoints', drawFloor: 'solid', drawEndpoints: true},
        {x: 200, y: 200, r: 15},
        [
            {x:  95, y:  95, r: 25},
            {x: 215, y: 285, r: 30},
        ],
        [], []
    );

    // Diagram with moving blocks, no rays, but with animation
    makeDiagram(
        'diagram-sweep-points',
        {size: 400, slider: 'left', drawEndpoints: true, drawSegments: false},
        {x: 100, y: 300, r: 15},
        [
            {x: 120, y: 100, r: 40},
            {x: 180, y: 200, r: 40},
        ],
        [], []
    );

    makeDiagram(
        'diagram-sweep-segments',
        {size: 400, slider: 'left'},
        {x: 100, y: 300, r: 15},
        [
            {x: 120, y: 100, r: 40},
            {x: 180, y: 200, r: 40},
        ],
        [], []
    );

    makeDiagram(
        'diagram-playground',
        {size: 400, storageArea: 100, slider: 'right'},
        {x: 200, y: 200, r: 15},
        [
            // All blocks in storage area to start with
            {x: 430, y: 30, r: 20},
            {x: 470, y: 80, r: 20},
            {x: 430, y: 130, r: 20},
            {x: 470, y: 180, r: 20},
            {x: 440, y: 240, r: 30},
            {x: 460, y: 310, r: 30},
            {x: 420, y: 360, r: 10},
            {x: 450, y: 380, r: 10},
            {x: 480, y: 360, r: 10},
        ],
        [], []
    );

    // Grenade throwing diagram
    var grenade = makeDiagram(
        'grenade',
        {size: 400, lightAlpha: 1.0, lightRadius: 50, lightGradientStyle: 2},
        {x: 200, y: 200, r: 10},
        [], mazeWalls, [[130, 80], [150, 305], [280, 130]]);
}

setTimeout(makeFirstDiagram, 0);
setTimeout(makeOtherDiagrams, 250);
