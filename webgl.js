// Copyright (C) 2013-2014 Alejandro Segovia - asegovi (AT) gmail.com
// Use for commercial purposes as part of any software product is expressly forbidden.
var g_vtxShaderSrc =
"uniform mediump mat4 proj;     \n" +
"uniform mediump mat4 mv;       \n" +
"attribute mediump vec3 pos;    \n" +
"attribute mediump vec3 color;  \n" +
"attribute mediump vec2 tc;     \n" +
"varying mediump vec3 v_color;  \n" +
"varying mediump vec2 v_tc;     \n" +
"void main()                    \n" +
"{                              \n" +
"    v_color = color;           \n" +
"    v_tc = tc;                 \n" +
"    gl_Position = proj * mv * vec4(pos, 1.0); \n" +
"}";

var g_fgmtShaderSrc =
"uniform sampler2D tex0;                        \n" +
"varying mediump vec3 v_color;                  \n" +
"varying mediump vec2 v_tc;                     \n" +
"void main()                                    \n" +
"{                                              \n" +
"    lowp vec4 texel = texture2D(tex0, v_tc);   \n" +
"    gl_FragColor = texel * vec4(v_color, 1.0); \n" +
"}";

function makeFrustum(left, right, bottom, top, near, far)
{
        var A = (right + left) / (right - left);
        var B = (top + bottom) / (top - bottom);
        var C = -(far + near) / (far - near);
        var D = -(2 * far * near) / (far - near);
        var mx =      [2 * near / (right - left), 0, 0, 0,
                       0, 2 * near / (top - bottom), 0, 0,
                       A, B, C, -1,
                       0, 0, D, 0];
       return mx;
}

var gl = 0;
var g_timer = 0;
var g_vbo = -1;
var g_a = Math.PI/4.0;
var g_drawfunc = 0;

var canvas = document.getElementById("canvas");
gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

if (!gl)
{
        alert("Unable to initialize WebGL. It may be disabled or not supported.");
}
else
{
	canvas.onclick = toggleTimer;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0.2, 0.2, 0.2, 1.0);
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	/*
        var exts = gl.getSupportedExtensions();
        var extsP = document.getElementById("extsP");
        var extsStr = "";
        for (var i in exts)
        {
                extsStr += "<br />" + exts[i];
        }
        extsP.innerHTML += extsStr;
	*/

        // Load Texture:
        var texId = gl.createTexture();
        var img = new Image();
        img.onload = function() {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texId);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.generateMipmap(gl.TEXTURE_2D);
        }
        img.src = "http://www.alejandrosegovia.net/wp-content/uploads/2013/12/crate.jpg";

        // Load program and render a pyramid
        var vtxShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vtxShader, g_vtxShaderSrc);
        gl.compileShader(vtxShader);
        if (!gl.getShaderParameter(vtxShader, gl.COMPILE_STATUS))
        {
                alert("Vertex Shader: syntax error: " + gl.getShaderInfoLog(vtxShader));
        }

        var fgmtShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fgmtShader, g_fgmtShaderSrc);
        gl.compileShader(fgmtShader);
        if (!gl.getShaderParameter(fgmtShader, gl.COMPILE_STATUS))
        {
                alert("Fragment Shader: syntax error: " + gl.getShaderInfoLog(fgmtShader));
        }

        var prog = gl.createProgram();
        gl.attachShader(prog, vtxShader);
        gl.attachShader(prog, fgmtShader);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
        {
                alert("Link Error: " + gl.getProgramInfoLog());
        }

        gl.useProgram(prog);

        var texLoc = gl.getUniformLocation(prog, "tex0");
        if (texLoc != -1)
        {
                gl.activeTexture(gl.TEXTURE0);
                gl.bindTexture(gl.TEXTURE_2D, texId);
                gl.uniform1i(texLoc, 0);
        }

        var projLoc = gl.getUniformLocation(prog, "proj");
        if (projLoc != -1)
        {
		var aspect = canvas.width / canvas.height;
                var projMx = makeFrustum(-1.0, 1.0, -1.0 / aspect, 1.0 / aspect, 1.0, 10.0);
                gl.uniformMatrix4fv(projLoc, false, new Float32Array(projMx));
        }

        var posLoc = gl.getAttribLocation(prog, "pos");
        var colorLoc = gl.getAttribLocation(prog, "color");
        var tcLoc = gl.getAttribLocation(prog, "tc");
        if (posLoc == -1 || colorLoc == -1 || tcLoc == -1)
        {
                alert("Internal Error: attrib location not found. Please report.");
        }

        var vtxdata = [ -1.0,  1.0,  1.0,   1.0, 0.0, 0.0,  0.0, 1.0,
                        -1.0, -1.0,  1.0,   0.0, 1.0, 0.0,  0.0, 0.0,
                         1.0,  1.0,  1.0,   1.0, 0.0, 1.0,  1.0, 1.0,
                         1.0, -1.0,  1.0,   0.0, 0.0, 1.0,  1.0, 0.0,

                         1.0,  1.0, -1.0,   0.0, 1.0, 0.0,  0.0, 1.0,
                         1.0, -1.0, -1.0,   1.0, 0.0, 0.0,  0.0, 0.0,

                         -1.0,  1.0, -1.0,  1.0, 0.0, 1.0,  1.0, 1.0,
                         -1.0, -1.0, -1.0,  0.0, 0.0, 1.0,  1.0, 0.0,

                          -1.0,  1.0, 1.0,  0.0, 1.0, 0.0,  0.0, 1.0,
                          -1.0, -1.0, 1.0,  1.0, 0.0, 0.0,  0.0, 0.0 ];

        g_vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vtxdata), gl.STATIC_DRAW);

        g_drawfunc = draw;
        draw();
        g_timer = window.setInterval(draw, 33); // redraw at 30Hz
}

function draw()
{
        if (!gl || g_vbo == -1)
        {
                return;
        }

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var mvLoc = gl.getUniformLocation(prog, "mv");
        if (mvLoc != -1)
        {
                g_a += (1.0 * Math.PI) / 180.0;
                var a = g_a;
                var tx = 0.0;
                var ty = 0.0;
                var tz = -4.0;
                var modelviewMx = [Math.cos(a), 0.0, -Math.sin(a), 0.0,
                                   0.0,         1.0,  0.0,         0.0,
                                   Math.sin(a), 0.0,  Math.cos(a), 0.0,
                                   tx,          ty,   tz,          1.0];
                gl.uniformMatrix4fv(mvLoc, false, new Float32Array(modelviewMx));
        }

        var fsize = 4;
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 8 * fsize, 0);
        gl.enableVertexAttribArray(colorLoc);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 8 * fsize, fsize * 3);
        gl.enableVertexAttribArray(tcLoc);
        gl.vertexAttribPointer(tcLoc, 2, gl.FLOAT, false, 8 * fsize, fsize *  6);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 10);

        gl.disableVertexAttribArray(tcLoc);
        gl.disableVertexAttribArray(colorLoc);
        gl.disableVertexAttribArray(posLoc);

}

function toggleTimer()
{
        if (g_timer != 0)
        {
                window.clearInterval(g_timer);
                g_timer = 0;
        }
        else
        {
                g_timer = window.setInterval(g_drawfunc, 33);
        }
}

