# webgl-test
(2014) A simple test to determine if your browser supports WebGL 1.0

This is the source code for the test used in alejandrosegovia.net/webgl - a page that lets you test if your browser supports WebGL 1.0.


How does the test work?
=======================

This test consists in two steps: first, we attempt to create an HTML5 canvas element. If the canvas element is not supported, you will see an error message stating that your current browser does not support WebGL.

If the HTML5 canvas element is indeed supported, then we attempt to create a WebGL rendering context inside it. We try both: a standard context and an “experimental” context. If both fail, an alert message will be triggered, stating that WebGL may be disabled (or not available at all).

On some browsers, like Safari 4+, WebGL may be supported but disabled. In such cases, it can usually be enabled from the browser’s settings.

Example Output
==============

![ScreenShot](https://raw.github.com/alesegovia/webgl-test/master/output/safari.png)

