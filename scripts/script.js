// Global variable definitionvar canvas;
var gl;
var shaderProgram;

// Buffers
var cubeVertexPositionBuffer;
var cubeVertexColorBuffer;
var cubeVertexIndexBuffer;

var obstacleVertexPositionBuffer;
var obstacleVertexColorBuffer;
var obstacleVertexIndexBuffer;

// Model-view and projection matrix and model-view matrix stack
var mvMatrixStack = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Variables for storing curent rotation of pyramid and cube

var rotationCube = 0;

// Helper variable for animation
var lastTime = 0;

var currentlyPressedKeys = {};



world = new OIMO.World({ 
    timestep: 1/60, 
    iterations: 8, 
    broadphase: 2, // 1 brute force, 2 sweep and prune, 3 volume tree
    worldscale: 1, // scale full world 
    random: true,  // randomize sample
    info: false,   // calculate statistic or not
    gravity: [0,-9.8,0] 
});


var body = world.add({ 
    type:'sphere', // type of shape : sphere, box, cylinder 
    size:[1,1,1], // size of shape
    pos:[0,0,0], // start position in degree
    rot:[0,0,90], // start rotation in degree
    move:true, // dynamic or statique
    density: 1,
    friction: 0.2,
    restitution: 0.2,
    belongsTo: 1, // The bits of the collision groups to which the shape belongs.
    collidesWith: 0xffffffff // The bits of the collision groups with which the shape collides.
});


var playerX = 0;
var playerZ = 0;
var playerZ = 0;

var playerRotation = 0;

var speed = 0.3;



//cube object test
var cubeBase = [0, 0, 0];
var cubeX = 1.5;
var cubeY = 1.5;
var cubeZ = 1.5;


//
// Matrix utility functions
//
// mvPush   ... push current matrix on matrix stack
// mvPop    ... pop top matrix from stack
// degToRad ... convert degrees to radians
//
function mvPushMatrix() {
  var copy = mat4.create();
  mat4.set(mvMatrix, copy);
  mvMatrixStack.push(copy);
}

function mvPopMatrix() {
  if (mvMatrixStack.length == 0) {
    throw "Invalid popMatrix!";
  }
  mvMatrix = mvMatrixStack.pop();
}

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}


//
// initGL
//
// Initialize WebGL, returning the GL context or null if
// WebGL isn't available or could not be initialized.
//
function initGL(canvas) {
  var gl = null;
  try {
    // Try to grab the standard context. If it fails, fallback to experimental.
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
  } catch(e) {}

  // If we don't have a GL context, give up now
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
  }
  return gl;
}

//
// getShader
//
// Loads a shader program by scouring the current document,
// looking for a script with the specified ID.
//
function getShader(gl, id) {
  var shaderScript = document.getElementById(id);

  // Didn't find an element with the specified ID; abort.
  if (!shaderScript) {
    return null;
  }

  // Walk through the source element's children, building the
  // shader source string.
  var shaderSource = "";
  var currentChild = shaderScript.firstChild;
  while (currentChild) {
    if (currentChild.nodeType == 3) {
        shaderSource += currentChild.textContent;
    }
    currentChild = currentChild.nextSibling;
  }

  // Now figure out what type of shader script we have,
  // based on its MIME type.
  var shader;
  if (shaderScript.type == "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (shaderScript.type == "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return null;  // Unknown shader type
  }

  // Send the source to the shader object
  gl.shaderSource(shader, shaderSource);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(shader));
    return null;
  }

  return shader;
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  var fragmentShader = getShader(gl, "shader-fs");
  var vertexShader = getShader(gl, "shader-vs");

  // Create the shader program
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert("Unable to initialize the shader program.");
  }

  // start using shading program for rendering
  gl.useProgram(shaderProgram);

  // store location of aVertexPosition variable defined in shader
  shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");

  // turn on vertex position attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

  // store location of aVertexColor variable defined in shader
  shaderProgram.vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");

  // turn on vertex color attribute at specified position
  gl.enableVertexAttribArray(shaderProgram.vertexColorAttribute);

  // store location of uPMatrix variable defined in shader - projection matrix
  shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");

  // store location of uMVMatrix variable defined in shader - model-view matrix
  shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
}

//
// setMatrixUniforms
//
// Set the uniform values in shaders for model-view and projection matrix.
//
function setMatrixUniforms() {
  gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, mvMatrix);
}

//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we have
// two objecta -- a simple cube and pyramidß.
//
function initBuffers() {

  // CUBE
  // Create a buffer for the cube's vertices.
  cubeVertexPositionBuffer = gl.createBuffer();

  // Select the cubeVertexPositionBuffer as the one to apply vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);

  // Now create an array of vertices for the cube.
  vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  cubeVertexPositionBuffer.itemSize = 3;
  cubeVertexPositionBuffer.numItems = 24;

  // Now set up the colors for the vertices. We'll use solid colors
  // for each face.
  cubeVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
  colors = [
      [1.0, 0.0, 0.0, 1.0], // Front face
      [1.0, 1.0, 0.0, 1.0], // Back face
      [0.0, 1.0, 0.0, 1.0], // Top face
      [1.0, 0.5, 0.5, 1.0], // Bottom face
      [1.0, 0.0, 1.0, 1.0], // Right face
      [0.0, 0.0, 1.0, 1.0]  // Left face
  ];

  // Convert the array of colors into a table for all the vertices.
  var unpackedColors = [];
  for (var i in colors) {
    var color = colors[i];

    // Repeat each color four times for the four vertices of the face
    for (var j=0; j < 4; j++) {
          unpackedColors = unpackedColors.concat(color);
      }
  }

  // Pass the colors into WebGL
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  cubeVertexColorBuffer.itemSize = 4;
  cubeVertexColorBuffer.numItems = 24;

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.
  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  var cubeVertexIndices = [
      0, 1, 2,      0, 2, 3,    // Front face
      4, 5, 6,      4, 6, 7,    // Back face
      8, 9, 10,     8, 10, 11,  // Top face
      12, 13, 14,   12, 14, 15, // Bottom face
      16, 17, 18,   16, 18, 19, // Right face
      20, 21, 22,   20, 22, 23  // Left face
  ];

  // Now send the element array to GL
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 36;
  
  
  
  
  
  ////////////////////////////////////////// COPY PASTED CUBE, FIXED TO FIT CRITERIA FOR TESTING
  // OBSTACLE
  // Create a buffer for the cube's vertices.
  obstacleVertexPositionBuffer = gl.createBuffer();

  // Select the cubeVertexPositionBuffer as the one to apply vertex
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, obstacleVertexPositionBuffer);

  // Now create an array of vertices for the cube.
  vertices = [
    // Front face
    -1.0, -1.0,  1.0,
     1.0, -1.0,  1.0,
     1.0,  1.0,  1.0,
    -1.0,  1.0,  1.0,

    // Back face
    -1.0, -1.0, -1.0,
    -1.0,  1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0, -1.0, -1.0,

    // Top face
    -1.0,  1.0, -1.0,
    -1.0,  1.0,  1.0,
     1.0,  1.0,  1.0,
     1.0,  1.0, -1.0,

    // Bottom face
    -1.0, -1.0, -1.0,
     1.0, -1.0, -1.0,
     1.0, -1.0,  1.0,
    -1.0, -1.0,  1.0,

    // Right face
     1.0, -1.0, -1.0,
     1.0,  1.0, -1.0,
     1.0,  1.0,  1.0,
     1.0, -1.0,  1.0,

    // Left face
    -1.0, -1.0, -1.0,
    -1.0, -1.0,  1.0,
    -1.0,  1.0,  1.0,
    -1.0,  1.0, -1.0
  ];

  // Now pass the list of vertices into WebGL to build the shape. We
  // do this by creating a Float32Array from the JavaScript array,
  // then use it to fill the current vertex buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
  obstacleVertexPositionBuffer.itemSize = 3;
  obstacleVertexPositionBuffer.numItems = 24;

  // Now set up the colors for the vertices. We'll use solid colors
  // for each face.
  obstacleVertexColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, obstacleVertexColorBuffer);
  colors = [
      [1.0, 0.0, 0.0, 8.0], // Front face
      [1.0, 0.0, 0.0, 8.0], // Back face
      [1.0, 0.0, 0.0, 8.0], // Top face
      [1.0, 0.0, 0.0, 8.0], // Bottom face
      [1.0, 0.0, 0.0, 8.0], // Right face
      [1.0, 0.0, 0.0, 8.0]  // Left face
  ];

  // Convert the array of colors into a table for all the vertices.
  var unpackedColors = [];
  for (var i in colors) {
    var color = colors[i];

    // Repeat each color four times for the four vertices of the face
    for (var j=0; j < 4; j++) {
          unpackedColors = unpackedColors.concat(color);
      }
  }

  // Pass the colors into WebGL
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(unpackedColors), gl.STATIC_DRAW);
  obstacleVertexColorBuffer.itemSize = 4;
  obstacleVertexColorBuffer.numItems = 24;

  // Build the element array buffer; this specifies the indices
  // into the vertex array for each face's vertices.
  obstacleVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obstacleVertexIndexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  var obstacleVertexIndices = [
      0, 1, 2,      0, 2, 3,    // Front face
      4, 5, 6,      4, 6, 7,    // Back face
      8, 9, 10,     8, 10, 11,  // Top face
      12, 13, 14,   12, 14, 15, // Bottom face
      16, 17, 18,   16, 18, 19, // Right face
      20, 21, 22,   20, 22, 23  // Left face
  ];

  // Now send the element array to GL
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(obstacleVertexIndices), gl.STATIC_DRAW);
  obstacleVertexIndexBuffer.itemSize = 1;
  obstacleVertexIndexBuffer.numItems = 36;
}

//
// drawScene
//
// Draw the scene.
//
function drawScene() {
  // set the rendering environment to full canvas size
  gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Establish the perspective with which we want to view the
  // scene. Our field of view is 45 degrees, with a width/height
  // ratio and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, [0, -4, -14]);
  mat4.rotate(mvMatrix, -degToRad(playerRotation), [0, 1, 0]);



  // CUBE:

  // Now move the drawing position a bit to where we want to start
  // drawing the cube.

  // Save the current matrix, then rotate before we draw.
   mat4.translate(mvMatrix, [-playerX, 0, -playerZ]);
  mvPushMatrix();

  mat4.translate(mvMatrix, [playerX, 0, playerZ]);
  mat4.rotate(mvMatrix, degToRad(playerRotation), [0, 1, 0]);


  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the colors attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, cubeVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);

  // Draw the cube.
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // Restore the original matrix
  mvPopMatrix();
  
  
  
  
  // OBSTACLE:

  // Now move the drawing position a bit to where we want to start
  // drawing the cube.


  // Save the current matrix, then rotate before we draw.
   mat4.translate(mvMatrix, [-playerX, 0, -playerZ]);
  mvPushMatrix();
  mat4.translate(mvMatrix, [0.0, 0.0, -16.0]);


  // Draw the cube by binding the array buffer to the cube's vertices
  // array, setting attributes, and pushing it to GL.
  gl.bindBuffer(gl.ARRAY_BUFFER, obstacleVertexPositionBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, obstacleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the colors attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, obstacleVertexColorBuffer);
  gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, obstacleVertexColorBuffer.itemSize, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obstacleVertexIndexBuffer);

  // Draw the cube.
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, obstacleVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // Restore the original matrix
  mvPopMatrix();
  
  //var tempCube = vec4.create();
}

//
// animate
//
// Called every time before redeawing the screen.
//
function animate() {
  var timeNow = new Date().getTime();
  if (lastTime != 0) {
    var elapsed = timeNow - lastTime;

    // rotate pyramid and cube for a small amount

    rotationCube += (75 * elapsed) / 1000.0;
  }
  lastTime = timeNow;
}











function handleKeyDown(event) {
  // storing the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = true;
  handleKeys();

}



function handleKeyUp(event) {
  // reseting the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = false;
  handleKeys();
}

//
// handleKeys
//
// Called every time before redeawing the screen for keyboard
// input handling. Function continuisly updates helper variables.
//
function handleKeys() {
  if (currentlyPressedKeys[87]) {
      //W - player moves forward
      console.log("Naprej");
      playerZ -= Math.cos(degToRad(playerRotation))*speed;
      playerX -= Math.sin(degToRad(playerRotation))*speed;
  }
  if (currentlyPressedKeys[83]) {
      //S - player moves backward
      playerZ += Math.cos(degToRad(playerRotation))*speed;
      playerX += Math.sin(degToRad(playerRotation))*speed;
  }
  if (currentlyPressedKeys[81]) {
      //Q - player moves Left
      playerZ -= Math.sin(degToRad(playerRotation))*speed;
      playerX -= Math.cos(degToRad(playerRotation))*speed;
  }
  if (currentlyPressedKeys[69]) {
      //E - player moves right
      playerZ += Math.sin(degToRad(playerRotation))*speed;
      playerX += Math.cos(degToRad(playerRotation))*speed;

  }
  if (currentlyPressedKeys[68]) {
      //D - player rotates right
      playerRotation -= 2.5;
  }

  if (currentlyPressedKeys[65]) {
      //A - player rotates left
      playerRotation += 2.5;
  }
}










//
// start
//
// Called when the canvas is created to get the ball rolling.
//
function start() {
  canvas = document.getElementById("glcanvas");

  gl = initGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working
  if (gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
    gl.clearDepth(1.0);                                     // Clear everything
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.
    initShaders();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.
    initBuffers();

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

1;1;
    // Set up to draw the scene periodically.
    setInterval(function() {
      world.step();
      requestAnimationFrame(animate);
      drawScene();
    }, 15);
  }
}
