// Global variable definitionvar canvas;
var canvas;
var gl;

var gameOver = false;

// Menu Variables
var mainMenu;
var pauseMenu;
var gameOverMenu;
var inGameUI;
var loadMenu;

//Life bar vars
var full_1;
var full_2;
var full_3;

var half_1;
var half_2;
var half_3;


function initLife() {
  half_1 = document.getElementById("halfLife1");
  half_2 = document.getElementById("halfLife2");
  half_3 = document.getElementById("halfLife3");

  full_1 = document.getElementById("fullLife1");
  full_2 = document.getElementById("fullLife2");
  full_3 = document.getElementById("fullLife3");
}


//Pause/play trigger
var playTime = false;
var pauseShow = false;


function startGame() {

  loadMenu.style.visibility = 'visible';
  canvas.style.visibility='visible';
  mainMenu.style.visibility = 'hidden';
  inGameUI.style.visibility = 'hidden';
  playTime = true;
  pauseShow = true;


}

function resumeGame() {
  playTime = true;
  inGameUI.style.visibility = 'visible';
  pauseMenu.style.visibility = 'hidden';
  canvas.style.visibility='visible';

}

// shading programs
var currentProgram;
var perVertexProgram;
var perFragmentProgram;

// Buffers
var moonVertexPositionBuffer;
var moonVertexNormalBuffer;
var moonVertexTextureCoordBuffer;
var moonVertexIndexBuffer;

var cubeVertexPositionBuffer;
var cubeVertexNormalBuffer;
var cubeVertexTextureCoordBuffer;
var cubeVertexIndexBuffer;

var model1VertexPositionBuffer;
var model1VertexNormalBuffer;
var model1VertexTexBuffer;
var model1VertexIndexBuffer;

var zombieVertexPositionBuffer;
var zombieVertexNormalBuffer;
var zombieVertexTexBuffer;
var zombieVertexIndexBuffer;

var floorVertexPositionBuffer;
var floorVertexNormalBuffer;
var floorVertexTexBuffer;
var floorVertexIndexBuffer;

var sodVertexPositionBuffer;
var sodVertexNormalBuffer;
var sodVertexTexBuffer;
var sodVertexIndexBuffer;


var sodPosition = [0, 3, 0];

var playerPosition = [0, 0, 0];
var playerRadius = 1;

var playerHealth = 1000;
var playerHurtTimeout = 0;
var playerAttackRange = 4;
var playerAttackCooldown = 0;

var playerRotation = 0;
var spin2Win = 0;
var playerForwardTilt = 45;

var speedFW = 0.3;
var speedBW = 0.15;
var speedSide = 0.2;


var zombie1Position = [50, 0, 0];
var zombie1Rotation = 0;
var zombie1Health = 5;
var zombie1Spin = 0;

var zombie2Position = [-50, 0, 0];
var zombie2Rotation = 0;
var zombie2Health = 5;
var zombie2Spin = 0;

var zombie3Position = [0, 0, 50];
var zombie3Rotation = 0;
var zombie3Health = 5;

var zombieSpeed = 0.1;
var zombieRadius = 1;
var zombie3Spin = 0;

var tlaPosition = [0, -1.2, 0];
var tlaRotation = 0;
var floorScale = [100, 100, 1];


var cubePosition = [3.25, 0, 0];
var cubeRadius = 1;

var moonPosition = [-15.0, -30, -30];
var moonRadius = 1;

var hurtAudio = new Audio('./assets/hurt.m4a');
//console.log("hurt volume: ", hurtAudio.volume);
var deadAudio = new Audio('./assets/ded.m4a');
//console.log("dead volume: ", deadAudio.volume);
var zombieHurtAudio = new Audio('./assets/zombieHurt.m4a');
zombieHurtAudio.volume = 0.5;
//console.log("zombie hurt volume: ", zombieHurtAudio.volume);
var portAudio = new Audio('./assets/port.m4a');


// Model-view and projection matrix and model-view matrix stack
var mvMatrixStack = [];
var mvMatrix = mat4.create();
var pMatrix = mat4.create();

// Variable for storing textures
var moonTexture;
var crateTexture;
var testBarvaTexture;
var monsterTexture;
var floorTexture;
var sodTexture;

// Variable that stores  loading state of textures.
var numberOfTextures = 6;
var texturesLoaded = 0;

var numberOfModels = 6;
var modelsLoaded = 0;

// Mouse helper variables
var moonAngle = 180;
var cubeAngle = 0;

// Helper variable for animation
var lastTime = 0;

var currentlyPressedKeys = {};

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

function radToDeg(radians) {
    return radians * 180 / Math.PI;
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
// createProgram
//
// Creates shading program.
//
function createProgram(fragmentShaderID, vertexShaderID) {
  var fragmentShader = getShader(gl, fragmentShaderID);
  var vertexShader = getShader(gl, vertexShaderID);

  // Create the shader program
  var program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    alert("Could not initialise shaders");
  }

  // store location of aVertexPosition variable defined in shader
  program.vertexPositionAttribute = gl.getAttribLocation(program, "aVertexPosition");

  // turn on vertex position attribute at specified position
  gl.enableVertexAttribArray(program.vertexPositionAttribute);

  // store location of aVertexNormal variable defined in shader
  program.vertexNormalAttribute = gl.getAttribLocation(program, "aVertexNormal");

  // turn on vertex texture coordinates attribute at specified position
  gl.enableVertexAttribArray(program.vertexNormalAttribute);

  // store location of aTextureCoord variable defined in shader
  program.textureCoordAttribute = gl.getAttribLocation(program, "aTextureCoord");

  // turn on texture coordinate attribure at specified position
  gl.enableVertexAttribArray(program.textureCoordAttribute);

  // store location of uPMatrix variable defined in shader - projection matrix
  program.pMatrixUniform = gl.getUniformLocation(program, "uPMatrix");
  // store location of uMVMatrix variable defined in shader - model-view matrix
  program.mvMatrixUniform = gl.getUniformLocation(program, "uMVMatrix");
  // store location of uNMatrix variable defined in shader - normal matrix
  program.nMatrixUniform = gl.getUniformLocation(program, "uNMatrix");
  // store location of uSampler variable defined in shader
  program.samplerUniform = gl.getUniformLocation(program, "uSampler");
  program.useTexturesUniform = gl.getUniformLocation(program, "uUseTextures");
  // store location of uUseLighting variable defined in shader
  program.useLightingUniform = gl.getUniformLocation(program, "uUseLighting");
  // store location of uAmbientColor variable defined in shader
  program.ambientColorUniform = gl.getUniformLocation(program, "uAmbientColor");
  // store location of uPointLightingLocation variable defined in shader
  program.pointLightingLocationUniform = gl.getUniformLocation(program, "uPointLightingLocation");
  // store location of uPointLightingColor variable defined in shader
  program.pointLightingColorUniform = gl.getUniformLocation(program, "uPointLightingColor");

  return program;
}

//
// initShaders
//
// Initialize the shaders, so WebGL knows how to light our scene.
//
function initShaders() {
  perVertexProgram = createProgram("per-vertex-lighting-fs", "per-vertex-lighting-vs");
  perFragmentProgram = createProgram("per-fragment-lighting-fs", "per-fragment-lighting-vs");
}

//
// setMatrixUniforms
//
// Set the uniform values in shaders for model-view and projection matrix.
//
function setMatrixUniforms() {
  gl.uniformMatrix4fv(currentProgram.pMatrixUniform, false, pMatrix);
  gl.uniformMatrix4fv(currentProgram.mvMatrixUniform, false, mvMatrix);

  var normalMatrix = mat3.create();
  mat4.toInverseMat3(mvMatrix, normalMatrix);
  mat3.transpose(normalMatrix);
  gl.uniformMatrix3fv(currentProgram.nMatrixUniform, false, normalMatrix);
}

//
// initTextures
//
// Initialize the textures we'll be using, then initiate a load of
// the texture images. The handleTextureLoaded() callback will finish
// the job; it gets called each time a texture finishes loading.
//
function initTextures() {
  moonTexture = gl.createTexture();
  moonTexture.image = new Image();
  moonTexture.image.onload = function () {
    handleTextureLoaded(moonTexture)
  }
  moonTexture.image.src = "./assets/moon.gif";

  crateTexture = gl.createTexture();
  crateTexture.image = new Image();
  crateTexture.image.onload = function () {
    handleTextureLoaded(crateTexture)
  }
  crateTexture.image.src = "./assets/crate.gif";

  testBarvaTexture = gl.createTexture();
  testBarvaTexture.image = new Image();
  testBarvaTexture.image.onload = function () {
    handleTextureLoaded(testBarvaTexture)
  }
  testBarvaTexture.image.src = "./assets/vojakTex.png";

  monsterTexture = gl.createTexture();
  monsterTexture.image = new Image();
  monsterTexture.image.onload = function () {
    handleTextureLoaded(monsterTexture)
  }
  monsterTexture.image.src = "./assets/monsterTex.png";

  floorTexture = gl.createTexture();
  floorTexture.image = new Image();
  floorTexture.image.onload = function () {
    handleTextureLoaded(floorTexture)
  }
  floorTexture.image.src = "./assets/tlaTex.jpg";
  
  sodTexture = gl.createTexture();
  sodTexture.image = new Image();
  sodTexture.image.onload = function () {
    handleTextureLoaded(sodTexture)
  }
  sodTexture.image.src = "./assets/sodTex.jpg";
  
  
  
}

function handleTextureLoaded(texture) {
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // Third texture usus Linear interpolation approximation with nearest Mipmap selection
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.generateMipmap(gl.TEXTURE_2D);

  gl.bindTexture(gl.TEXTURE_2D, null);

  // when texture loading is finished we can draw scene.
  texturesLoaded += 1;
}


//LOADANJE JSON MODELOV
function loadModel(url, modelLoader) {
  var request = new XMLHttpRequest();
  request.open('GET', url + '?please-dont-cache=' + Math.random(), true);
  request.onload = function () {
		if (request.status < 200 || request.status > 299) {
			callback('Error: HTTP Status ' + request.status + ' on resource ' + url);
		} else {
      //console.log(request.responseText);
      modelLoader(JSON.parse(request.responseText));
		}
	};
  request.send();
}

var model1Vertices;
var model1Normals;
var model1Indices;
var model1TexCoords;
function handleLoadedModel1(modelData){
  model1Normals = modelData.meshes[0].normals;
  model1Vertices = modelData.meshes[0].vertices;
  model1Indices = [].concat.apply([], modelData.meshes[0].faces);
  model1TexCoords = modelData.meshes[0].texturecoords[0];

  //console.log(model1Vertices);
  //console.log(model1Indices);
  //console.log(model1TexCoords);
  //console.log(model1Normals);

  console.log("Vertex num: "+model1Vertices.length);
  console.log("Normals num: "+model1Normals.length);
  console.log("Normals num /3: "+model1Normals.length/3);
  console.log("Textures num: "+model1TexCoords.length);
  console.log("Indices num: "+model1Indices.length);

  //OD TUKI NAPREJ INICIALIZIRAMO BUFFERJE
  model1VertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, model1VertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model1Vertices), gl.STATIC_DRAW);
  model1VertexPositionBuffer.itemSize = 3;
  model1VertexPositionBuffer.numItems = model1Vertices.length / 3;

  model1VertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, model1VertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model1Normals), gl.STATIC_DRAW);
  model1VertexNormalBuffer.itemSize = 3;
  model1VertexNormalBuffer.numItems = model1Normals.length / 3;

  model1VertexTexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, model1VertexTexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model1TexCoords), gl.STATIC_DRAW);
  model1VertexTexBuffer.itemSize = 2;
  model1VertexTexBuffer.numItems = model1TexCoords.length / 2;

  model1VertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model1VertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model1Indices), gl.STATIC_DRAW);
  model1VertexIndexBuffer.itemSize = 1;
  model1VertexIndexBuffer.numItems = model1Indices.length;

  modelsLoaded += 1;
}


var zombieVertices;
var zombieNormals;
var zombieIndices;
var zombieTexCoords;
function handleLoadedZombie(modelData){
  zombieNormals = modelData.meshes[0].normals;
  zombieVertices = modelData.meshes[0].vertices;
  zombieIndices = [].concat.apply([], modelData.meshes[0].faces);
  zombieTexCoords = modelData.meshes[0].texturecoords[0];

  //console.log(zombieVertices);
  //console.log(zombieIndices);
  //console.log(zombieTexCoords);
  //console.log(zombieNormals);

  console.log("Vertex num: "+zombieVertices.length);
  console.log("Normals num: "+zombieNormals.length);
  console.log("Normals num /3: "+zombieNormals.length/3);
  console.log("Textures num: "+zombieTexCoords.length);
  console.log("Indices num: "+zombieIndices.length);

  //OD TUKI NAPREJ INICIALIZIRAMO BUFFERJE
  zombieVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(zombieVertices), gl.STATIC_DRAW);
  zombieVertexPositionBuffer.itemSize = 3;
  zombieVertexPositionBuffer.numItems = zombieVertices.length / 3;

  zombieVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(zombieNormals), gl.STATIC_DRAW);
  zombieVertexNormalBuffer.itemSize = 3;
  zombieVertexNormalBuffer.numItems = zombieNormals.length / 3;

  zombieVertexTexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexTexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(zombieTexCoords), gl.STATIC_DRAW);
  zombieVertexTexBuffer.itemSize = 2;
  zombieVertexTexBuffer.numItems = zombieTexCoords.length / 2;

  zombieVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, zombieVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(zombieIndices), gl.STATIC_DRAW);
  zombieVertexIndexBuffer.itemSize = 1;
  zombieVertexIndexBuffer.numItems = zombieIndices.length;

  modelsLoaded += 1;
}

var floorVertices;
var floorNormals;
var floorIndices;
var floorTexCoords;
function handleLoadedFloor(modelData){
  floorVertices = modelData.meshes[0].vertices;
  floorNormals = modelData.meshes[0].normals;
  floorIndices = [].concat.apply([], modelData.meshes[0].faces);
  floorTexCoords = modelData.meshes[0].texturecoords[0];

  //console.log(zombieVertices);
  //console.log(zombieIndices);
  //console.log(zombieTexCoords);
  //console.log(zombieNormals);

  console.log("Vertex num: "+floorVertices.length);
  console.log("Normals num: "+floorNormals.length);
  console.log("Normals num /3: "+floorNormals.length/3);
  console.log("Textures num: "+floorTexCoords.length);
  console.log("Indices num: "+floorIndices.length);

  //OD TUKI NAPREJ INICIALIZIRAMO BUFFERJE
  floorVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertices), gl.STATIC_DRAW);
  floorVertexPositionBuffer.itemSize = 3;
  floorVertexPositionBuffer.numItems = floorVertices.length / 3;

  floorVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorNormals), gl.STATIC_DRAW);
  floorVertexNormalBuffer.itemSize = 3;
  floorVertexNormalBuffer.numItems = floorNormals.length / 3;

  floorVertexTexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexTexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorTexCoords), gl.STATIC_DRAW);
  floorVertexTexBuffer.itemSize = 2;
  floorVertexTexBuffer.numItems = floorTexCoords.length / 2;

  floorVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(floorIndices), gl.STATIC_DRAW);
  floorVertexIndexBuffer.itemSize = 1;
  floorVertexIndexBuffer.numItems = floorIndices.length;

  modelsLoaded += 1;
}


var sodVertices;
var sodNormals;
var sodIndices;
var sodTexCoords;

function handleLoadedSod(modelData){
  sodVertices = modelData.meshes[0].vertices;
  sodNormals = modelData.meshes[0].normals;
  sodIndices = [].concat.apply([], modelData.meshes[0].faces);
  sodTexCoords = modelData.meshes[0].texturecoords[0];

  //console.log(zombieVertices);
  //console.log(zombieIndices);
  //console.log(zombieTexCoords);
  //console.log(zombieNormals);

  console.log("Vertex num: "+sodVertices.length);
  console.log("Normals num: "+sodNormals.length);
  console.log("Normals num /3: "+sodNormals.length/3);
  console.log("Textures num: "+sodTexCoords.length);
  console.log("Indices num: "+sodIndices.length);

  //OD TUKI NAPREJ INICIALIZIRAMO BUFFERJE
  sodVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sodVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sodVertices), gl.STATIC_DRAW);
  sodVertexPositionBuffer.itemSize = 3;
  sodVertexPositionBuffer.numItems = sodVertices.length / 3;

  sodVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sodVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sodNormals), gl.STATIC_DRAW);
  sodVertexNormalBuffer.itemSize = 3;
  sodVertexNormalBuffer.numItems = sodNormals.length / 3;

  sodVertexTexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sodVertexTexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sodTexCoords), gl.STATIC_DRAW);
  sodVertexTexBuffer.itemSize = 2;
  sodVertexTexBuffer.numItems = sodTexCoords.length / 2;

  sodVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sodVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(sodIndices), gl.STATIC_DRAW);
  sodVertexIndexBuffer.itemSize = 1;
  sodVertexIndexBuffer.numItems = sodIndices.length;

  modelsLoaded += 1;
}




//
// initBuffers
//
// Initialize the buffers we'll need. For this demo, we just have
// one object -- a simple two-dimensional cube.
//
function initBuffers() {
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

  // Map the normals onto the cube's faces.
  cubeVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);

  // Now create an array of vertex normals for the cube.
  var vertexNormals = [
    // Front face
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,
    0.0,  0.0,  1.0,

    // Back face
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,
    0.0,  0.0, -1.0,

    // Top face
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,
    0.0,  1.0,  0.0,

    // Bottom face
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,
    0.0, -1.0,  0.0,

    // Right face
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,
    1.0,  0.0,  0.0,

    // Left face
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0
  ];

  // Pass the normals into WebGL
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexNormals), gl.STATIC_DRAW);
  cubeVertexNormalBuffer.itemSize = 3;
  cubeVertexNormalBuffer.numItems = 24;

  // Now create an array of texture coordinates for the cube.
  cubeVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);

  // Now create an array of vertex texture coordinates for the cube.
  var textureCoords = [
    // Front face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,

    // Back face
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,

    // Top face
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,

    // Bottom face
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,
    1.0, 0.0,

    // Right face
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0,
    0.0, 0.0,

    // Left face
    0.0, 0.0,
    1.0, 0.0,
    1.0, 1.0,
    0.0, 1.0
  ];

  // Pass the texture coordinates into WebGL
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
  cubeVertexTextureCoordBuffer.itemSize = 2;
  cubeVertexTextureCoordBuffer.numItems = 24;

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  cubeVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  var cubeVertexIndices = [
    0, 1, 2,      0, 2, 3,    // Front face
    4, 5, 6,      4, 6, 7,    // Back face
    8, 9, 10,     8, 10, 11,  // Top face
    12, 13, 14,   12, 14, 15, // Bottom face
    16, 17, 18,   16, 18, 19, // Right face
    20, 21, 22,   20, 22, 23  // Left face
  ];
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(cubeVertexIndices), gl.STATIC_DRAW);
  cubeVertexIndexBuffer.itemSize = 1;
  cubeVertexIndexBuffer.numItems = 36;

  modelsLoaded += 1;

  // SPHERE
  var latitudeBands = 30;
  var longitudeBands = 30;
  var radius = 1;

  var vertexPositionData = [];
  var normalData = [];
  var textureCoordData = [];
  for (var latNumber=0; latNumber <= latitudeBands; latNumber++) {
    var theta = latNumber * Math.PI / latitudeBands;
    var sinTheta = Math.sin(theta);
    var cosTheta = Math.cos(theta);

    for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
      var phi = longNumber * 2 * Math.PI / longitudeBands;
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);

      var x = cosPhi * sinTheta;
      var y = cosTheta;
      var z = sinPhi * sinTheta;
      var u = 1 - (longNumber / longitudeBands);
      var v = 1 - (latNumber / latitudeBands);

      normalData.push(x);
      normalData.push(y);
      normalData.push(z);
      textureCoordData.push(u);
      textureCoordData.push(v);
      vertexPositionData.push(radius * x);
      vertexPositionData.push(radius * y);
      vertexPositionData.push(radius * z);
    }
  }

  var indexData = [];
  for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
    for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
      var first = (latNumber * (longitudeBands + 1)) + longNumber;
      var second = first + longitudeBands + 1;
      indexData.push(first);
      indexData.push(second);
      indexData.push(first + 1);

      indexData.push(second);
      indexData.push(second + 1);
      indexData.push(first + 1);
    }
  }

  // Pass the normals into WebGL
  moonVertexNormalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalData), gl.STATIC_DRAW);
  moonVertexNormalBuffer.itemSize = 3;
  moonVertexNormalBuffer.numItems = normalData.length / 3;

  // Pass the texture coordinates into WebGL
  moonVertexTextureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordData), gl.STATIC_DRAW);
  moonVertexTextureCoordBuffer.itemSize = 2;
  moonVertexTextureCoordBuffer.numItems = textureCoordData.length / 2;

  // Pass the vertex positions into WebGL
  moonVertexPositionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertexPositionData), gl.STATIC_DRAW);
  moonVertexPositionBuffer.itemSize = 3;
  moonVertexPositionBuffer.numItems = vertexPositionData.length / 3;

  // Pass the indices into WebGL
  moonVertexIndexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexData), gl.STREAM_DRAW);
  moonVertexIndexBuffer.itemSize = 1;
  moonVertexIndexBuffer.numItems = indexData.length;

  modelsLoaded += 1;
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
  // ratio of 640:480, and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

  var perFragmentLighting = document.getElementById("per-fragment").checked;
  if (perFragmentLighting) {
    currentProgram = perFragmentProgram;
  } else {
    currentProgram = perVertexProgram;
  }
  gl.useProgram(currentProgram);

  // Ligthing
  var lighting = document.getElementById("lighting").checked;

  // set uniform to the value of the checkbox.
  gl.uniform1i(currentProgram.useLightingUniform, lighting);

  // set uniforms for lights as defined in the document
  if (lighting) {
    gl.uniform3f(
      currentProgram.ambientColorUniform,
      parseFloat(document.getElementById("ambientR").value),
      parseFloat(document.getElementById("ambientG").value),
      parseFloat(document.getElementById("ambientB").value)
    );

    gl.uniform3f(
      currentProgram.pointLightingLocationUniform,
      parseFloat(document.getElementById("lightPositionX").value),
      parseFloat(document.getElementById("lightPositionY").value),
      parseFloat(document.getElementById("lightPositionZ").value)
    );

    gl.uniform3f(
      currentProgram.pointLightingColorUniform,
      parseFloat(document.getElementById("pointR").value),
      parseFloat(document.getElementById("pointG").value),
      parseFloat(document.getElementById("pointB").value)
    );
  }

  // Textures
  var textures = document.getElementById("textures").checked;

  // set uniform to the value of the checkbox.
  gl.uniform1i(currentProgram.useTexturesUniform, textures);

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  mat4.identity(mvMatrix);

  // Now move the drawing position a bit to where we want to start
  // drawing the world.
  mat4.identity(mvMatrix);
  mat4.translate(mvMatrix, [0, -4, -14]);
  mat4.rotate(mvMatrix, -degToRad(playerRotation), [0, 1, 0]);

  mat4.translate(mvMatrix, [-playerPosition[0], -playerPosition[1], -playerPosition[2]]);
  //console.log("-playerPosition: ", -playerPosition[0], -playerPosition[1], -playerPosition[2]);
  // store current location
  mvPushMatrix();

  // Now move the drawing position a bit to where we want to start
  // drawing the world.
  mat4.rotate(mvMatrix, degToRad(moonAngle), [0, 1, 0]);
  mat4.translate(mvMatrix, [-moonPosition[0], -moonPosition[1], -moonPosition[2]]);
  mat4.scale(mvMatrix, [10, 10, 10]);

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, moonTexture);
  gl.uniform1i(currentProgram.samplerUniform, 0);

  // Set the vertex positions attribute for the moon vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexPositionBuffer);
  gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, moonVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexTextureCoordBuffer);
  gl.vertexAttribPointer(currentProgram.textureCoordAttribute, moonVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, moonVertexNormalBuffer);
  gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, moonVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the index for the vertices.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, moonVertexIndexBuffer);
  setMatrixUniforms();

  // Draw the moon
  gl.drawElements(gl.TRIANGLES, moonVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // restore last location
  mvPopMatrix();

  // store current location
  mvPushMatrix();
  mat4.rotate(mvMatrix, degToRad(cubeAngle), [0, 1, 0]);
  mat4.translate(mvMatrix, cubePosition);

  // Set the vertex positions attribute for the crate vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexPositionBuffer);
  gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, cubeVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexNormalBuffer);
  gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, cubeVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVertexTextureCoordBuffer);
  gl.vertexAttribPointer(currentProgram.textureCoordAttribute, cubeVertexTextureCoordBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, crateTexture);
  gl.uniform1i(currentProgram.samplerUniform, 0);

  // Draw the crate
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, cubeVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // restore last location
  mvPopMatrix();


  ///////////////////////////////////draw warrior
  mvPushMatrix();
  mat4.translate(mvMatrix, playerPosition);

  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);//popravki, da je pravilno obrnjen in na tleh
  mat4.translate(mvMatrix, [0, -1, 0]);

  mat4.rotate(mvMatrix, degToRad(playerRotation), [0, 1, 0]);
  mat4.rotate(mvMatrix, degToRad(playerForwardTilt), [1, 0, 0]);
  mat4.rotate(mvMatrix, degToRad(spin2Win), [0, 1, 0]);
  //mat4.rotate(mvMatrix, degToRad(cubeAngle), [0, 1, 0]);
  //mat4.translate(mvMatrix, [1.25, 0, 4]);

  // Set the vertex positions attribute for the crate vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, model1VertexPositionBuffer);
  gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, model1VertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, model1VertexNormalBuffer);
  gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, model1VertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, model1VertexTexBuffer);
  gl.vertexAttribPointer(currentProgram.textureCoordAttribute, model1VertexTexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, testBarvaTexture);
  gl.uniform1i(currentProgram.samplerUniform, 0);

  // Draw the crate
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model1VertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, model1VertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // restore last location
  mvPopMatrix();




  /////////////////////zombies
  //1
  mvPushMatrix();
  mat4.translate(mvMatrix, zombie1Position);
  mat4.scale(mvMatrix, [1.5, 1.5, 1.5]);
  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);//popravki, da je pravilno obrnjen in na tleh
  mat4.rotate(mvMatrix, degToRad(zombie1Spin), [0, 1, 0]);
  mat4.translate(mvMatrix, [0, -1, 0]);

  mat4.rotate(mvMatrix, degToRad(zombie1Rotation), [0, 1, 0]);
  //mat4.rotate(mvMatrix, degToRad(cubeAngle), [0, 1, 0]);
  //mat4.translate(mvMatrix, [1.25, 0, 4]);

  // Set the vertex positions attribute for the crate vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexPositionBuffer);
  gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, zombieVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexNormalBuffer);
  gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, zombieVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexTexBuffer);
  gl.vertexAttribPointer(currentProgram.textureCoordAttribute, zombieVertexTexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, monsterTexture);
  gl.uniform1i(currentProgram.samplerUniform, 0);

  // Draw the crate
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, zombieVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, zombieVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // restore last location
  mvPopMatrix();

  //2
  mvPushMatrix();
  mat4.translate(mvMatrix, zombie2Position);
  mat4.scale(mvMatrix, [1.5, 1.5, 1.5]);
  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);//popravki, da je pravilno obrnjen in na tleh
  mat4.rotate(mvMatrix, degToRad(zombie2Spin), [0, 1, 0]);
  mat4.translate(mvMatrix, [0, -1, 0]);

  mat4.rotate(mvMatrix, degToRad(zombie2Rotation), [0, 1, 0]);
  //mat4.rotate(mvMatrix, degToRad(cubeAngle), [0, 1, 0]);
  //mat4.translate(mvMatrix, [1.25, 0, 4]);

  // Set the vertex positions attribute for the crate vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexPositionBuffer);
  gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, zombieVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexNormalBuffer);
  gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, zombieVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexTexBuffer);
  gl.vertexAttribPointer(currentProgram.textureCoordAttribute, zombieVertexTexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, monsterTexture);
  gl.uniform1i(currentProgram.samplerUniform, 0);

  // Draw the crate
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, zombieVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, zombieVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // restore last location
  mvPopMatrix();

  //3
  mvPushMatrix();
  mat4.translate(mvMatrix, zombie3Position);
  mat4.scale(mvMatrix, [1.5, 1.5, 1.5]);
  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);//popravki, da je pravilno obrnjen in na tleh
  mat4.rotate(mvMatrix, degToRad(zombie3Spin), [0, 1, 0]);
  mat4.translate(mvMatrix, [0, -1, 0]);

  mat4.rotate(mvMatrix, degToRad(zombie3Rotation), [0, 1, 0]);
  //mat4.rotate(mvMatrix, degToRad(cubeAngle), [0, 1, 0]);
  //mat4.translate(mvMatrix, [1.25, 0, 4]);

  // Set the vertex positions attribute for the crate vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexPositionBuffer);
  gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, zombieVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexNormalBuffer);
  gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, zombieVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, zombieVertexTexBuffer);
  gl.vertexAttribPointer(currentProgram.textureCoordAttribute, zombieVertexTexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, monsterTexture);
  gl.uniform1i(currentProgram.samplerUniform, 0);

  // Draw the crate
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, zombieVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, zombieVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // restore last location
  mvPopMatrix();



  //////////////////////////////tla
  mvPushMatrix();
  mat4.translate(mvMatrix, tlaPosition);
  //mat4.scale(mvMatrix, [1.5, 1.5, 1.5]);
  mat4.rotate(mvMatrix, degToRad(90), [1, 0, 0]);//popravki, da je pravilno obrnjen in na tleh
  mat4.scale(mvMatrix, floorScale);
  //mat4.translate(mvMatrix, [0, -1, 0]);

  //mat4.rotate(mvMatrix, degToRad(tlaRotation), [0, 1, 0]);
  //mat4.rotate(mvMatrix, degToRad(cubeAngle), [0, 1, 0]);
  //mat4.translate(mvMatrix, [1.25, 0, 4]);

  // Set the vertex positions attribute for the crate vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexPositionBuffer);
  gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, floorVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexNormalBuffer);
  gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, floorVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, floorVertexTexBuffer);
  gl.vertexAttribPointer(currentProgram.textureCoordAttribute, floorVertexTexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, floorTexture);
  gl.uniform1i(currentProgram.samplerUniform, 0);

  // Draw the crate
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, floorVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, floorVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // restore last location
  mvPopMatrix();
  
  
  /* SOD */
  
  mvPushMatrix();
  mat4.translate(mvMatrix, sodPosition);
  mat4.scale(mvMatrix, [1.5, 1.5, 1.5]);
  mat4.rotate(mvMatrix, degToRad(180), [0, 1, 0]);//popravki, da je pravilno obrnjen in na tleh
  //mat4.rotate(mvMatrix, degToRad(zombie3Spin), [0, 1, 0]);
  mat4.translate(mvMatrix, [0, -1, 0]);

  ///mat4.rotate(mvMatrix, degToRad(zombie3Rotation), [0, 1, 0]);
  //mat4.rotate(mvMatrix, degToRad(cubeAngle), [0, 1, 0]);
  //mat4.translate(mvMatrix, [1.25, 0, 4]);

  // Set the vertex positions attribute for the crate vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, sodVertexPositionBuffer);
  gl.vertexAttribPointer(currentProgram.vertexPositionAttribute, sodVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the normals attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, sodVertexNormalBuffer);
  gl.vertexAttribPointer(currentProgram.vertexNormalAttribute, sodVertexNormalBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Set the texture coordinates attribute for the vertices.
  gl.bindBuffer(gl.ARRAY_BUFFER, sodVertexTexBuffer);
  gl.vertexAttribPointer(currentProgram.textureCoordAttribute, sodVertexTexBuffer.itemSize, gl.FLOAT, false, 0, 0);

  // Activate textures
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, sodTexture);
  gl.uniform1i(currentProgram.samplerUniform, 0);

  // Draw the crate
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, sodVertexIndexBuffer);
  setMatrixUniforms();
  gl.drawElements(gl.TRIANGLES, sodVertexIndexBuffer.numItems, gl.UNSIGNED_SHORT, 0);

  // restore last location
  mvPopMatrix();

  
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

    // rotate the moon and the crate for a small amount
    //moonAngle += 0.05 * elapsed;
    //cubeAngle += 0.05 * elapsed;
  }
  lastTime = timeNow;
}


function handleKeyDown(event) {
  // storing the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = true;

  if(event.keyCode == 32) {
    event.preventDefault();
  }


  //handleKeys();

}



function handleKeyUp(event) {
  // reseting the pressed state for individual key
  currentlyPressedKeys[event.keyCode] = false;
  //handleKeys();
}

//
// handleKeys
//
// Called every time before redeawing the screen for keyboard
// input handling. Function continuisly updates helper variables.
//
function handleKeys() {
    if(playTime){
      if (currentlyPressedKeys[87]) {
          //W - player moves forward
          //console.log("player pos: ", playerPosition);
          playerPosition[2] -= Math.cos(degToRad(playerRotation))*speedFW;
          playerPosition[0] -= Math.sin(degToRad(playerRotation))*speedFW;
          playerForwardTilt = 45;
          if(anyColide()){
              //hurtAudio.play();
              playerPosition[2] += Math.cos(degToRad(playerRotation))*speedFW;
              playerPosition[0] += Math.sin(degToRad(playerRotation))*speedFW;
          }
      } else {
        playerForwardTilt = 0;
      }
      if (currentlyPressedKeys[83]) {
          //S - player moves backward
          playerPosition[2] += Math.cos(degToRad(playerRotation))*speedBW;
          playerPosition[0] += Math.sin(degToRad(playerRotation))*speedBW;
          if(anyColide()){
              playerPosition[2] -= Math.cos(degToRad(playerRotation))*speedBW;
              playerPosition[0] -= Math.sin(degToRad(playerRotation))*speedBW;
          }
      }
      if (currentlyPressedKeys[81]) {
          //Q - player moves Left
          playerPosition[2] -= Math.cos(degToRad(playerRotation + 90))*speedSide;
          playerPosition[0] -= Math.sin(degToRad(playerRotation + 90))*speedSide;
          if(anyColide()){
              playerPosition[2] += Math.cos(degToRad(playerRotation + 90))*speedSide;
              playerPosition[0] += Math.sin(degToRad(playerRotation + 90))*speedSide;
          }
      }
      if (currentlyPressedKeys[69]) {
          //E - player moves right
          playerPosition[2] += Math.cos(degToRad(playerRotation + 90))*speedSide;
          playerPosition[0] += Math.sin(degToRad(playerRotation + 90))*speedSide;
          if(anyColide()){
              playerPosition[2] -= Math.cos(degToRad(playerRotation + 90))*speedSide;
              playerPosition[0] -= Math.sin(degToRad(playerRotation + 90))*speedSide;
          }

      }
      if (currentlyPressedKeys[68]) {
          //D - player rotates right
          playerRotation -= 2.5;
      }

      if (currentlyPressedKeys[65]) {
          //A - player rotates left
          playerRotation += 2.5;
      }

      if(currentlyPressedKeys[32] && playerAttackCooldown == 0) {
        playerAttackCooldown = 120;
        if(coliding(playerPosition, playerRadius + playerAttackRange, zombie1Position, zombieRadius)) {
          hurtZombie1(1, zombieHurtAudio);

            //console.log("zombie1health: ", zombie3Health);
          if(zombie1Health <= 0) {
            zombie1Health = 10;
            zombie1Position[0] = playerPosition[0] + Math.sin(degToRad(playerRotation))*(Math.random()*5+50);
            zombie1Position[2] = playerPosition[2] + Math.cos(degToRad(playerRotation))*(Math.random()*5+50);
            zombie1Spin = 0;
          }
        }
        if(coliding(playerPosition, playerRadius + playerAttackRange, zombie2Position, zombieRadius)) {
          hurtZombie2(1, zombieHurtAudio);

            //console.log("zombie2health: ", zombie3Health);
          if(zombie2Health <= 0) {

            zombie2Health = 10;
            zombie2Position[0] = playerPosition[0] + Math.sin(degToRad(playerRotation))*(Math.random()*5+50);
            zombie2Position[2] = playerPosition[2] + Math.cos(degToRad(playerRotation))*(Math.random()*5+50);
            zombie2Spin = 0;
          }
        }
        if(coliding(playerPosition, playerRadius + playerAttackRange, zombie3Position, zombieRadius)) {
          hurtZombie3(1, zombieHurtAudio);
          //console.log("zombie3health: ", zombie3Health);
          if(zombie3Health <= 0) {
            zombie3Health = 10;
            zombie3Position[0] = playerPosition[0] + Math.sin(degToRad(playerRotation))*(Math.random()*5+50);
            zombie3Position[2] = playerPosition[2] + Math.cos(degToRad(playerRotation))*(Math.random()*5+50);
            zombie3Spin = 0;
          }
        }
      }
  }
  if(currentlyPressedKeys[27]) {
      if(playTime) {
        playTime = false;
        canvas.style.visibility='hidden';

        if(pauseShow) {
          pauseMenu.style.visibility = 'visible';

        }

      } else {
        playTime = true;
        canvas.style.visibility='visible';
        pauseMenu.style.visibility = 'hidden';


      }


  }




}


//
// start
//
// Called when the canvas is created to get the ball rolling.
// Figuratively, that is. There's nothing moving in this demo.
//
function start() {
    initLife();
    loadMenu = document.getElementById("loadingScreen");
    inGameUI = document.getElementById("game");
    canvas = document.getElementById("glcanvas");
    mainMenu = document.getElementById("mainMenu");
    pauseMenu = document.getElementById("pauseMenu");
    gameOverMenu = document.getElementById("gameOver");

    loadMenu.style.visibility = 'hidden';
    inGameUI.style.visibility = 'hidden';
    gameOverMenu.style.visibility = 'hidden';
    canvas.style.visibility ='hidden';
    pauseMenu.style.visibility = 'hidden';

  gl = initGL(canvas);      // Initialize the GL context

  // Only continue if WebGL is available and working
  if (gl) {
    gl.clearColor(0.4, 0.0, 0.0, 1.0);                      // Set clear color to black, fully opaque
    gl.clearDepth(1.0);                                     // Clear everything
    gl.enable(gl.DEPTH_TEST);                               // Enable depth testing
    gl.depthFunc(gl.LEQUAL);                                // Near things obscure far things

    // Initialize the shaders; this is where all the lighting for the
    // vertices and so forth is established.
    initShaders();

    // Here's where we call the routine that builds all the objects
    // we'll be drawing.
    loadModel('./assets/vojak.json', handleLoadedModel1);
    loadModel('./assets/monster.json', handleLoadedZombie);
    loadModel('./assets/tla.json', handleLoadedFloor);
    loadModel('./assets/sod.json', handleLoadedSod);
    initBuffers();

    // Next, load and set up the textures we'll be using.
    initTextures();

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;

    // Set up to draw the scene periodically.
    setInterval(function() {
      if (texturesLoaded >= numberOfTextures && modelsLoaded >= numberOfModels && !gameOver && playTime) { // only draw scene and animate when textures are loaded.
        inGameUI.style.visibility = 'visible';
        loadMenu.style.visibility = 'hidden';
        
        if(Math.abs(playerPosition[0]) > floorScale[0]+1 ||  Math.abs(playerPosition[2]) > floorScale[1] + 1) {
          hurtPlayer(playerHealth, hurtAudio);
        }
        if(playerHurtTimeout > 0) {
          playerHurtTimeout -= 1;
        }
        if(playerAttackCooldown > 0) {
          playerAttackCooldown -= 1;
          if(playerAttackCooldown >= 90) {
            spin2Win = (spin2Win + 360*4/120)%360;
          }
        }
        zombie1Spin = (zombie1Spin + 360*4/120)%360;
        zombie2Spin = (zombie2Spin + 360*4/120)%360;
        zombie3Spin = (zombie3Spin + 360*4/120)%360;

        if(playerHealth <= 0) {
            deadAudio.play();
            gameOverMenu.style.visibility = 'visible';
            inGameUI.style.visibility = 'hidden';
            gameOver = true;
        }

        switch (playerHealth) {
          case 5:
            full_3.style.visibility ='hidden';
            //console.log("first hit");
            break;

          case 4:
            half_3.style.visibility ='hidden';
            break;

          case 3:
            full_2.style.visibility ='hidden';
            break;

          case 2:
            half_2.style.visibility ='hidden';
            break;

          case 1:
            full_1.style.visibility ='hidden';

            break;

          case 0:
            half_1.style.visibility ='hidden';

            break;

          default:
            break;

       }

        if(playerRotation > 360) {
          playerRotation -= 360;
        } else if(playerRotation < -360) {
          playerRotation += 360;
        }
        handleKeys();
        moveZombies();
        requestAnimationFrame(animate);
        drawScene();
      }
    }, 15);
  }
}

function dist(body1, body2) {
    return Math.sqrt(Math.pow(body1[0] - body2[0], 2) + Math.pow(body1[1] - body2[1], 2) + Math.pow(body1[2] - body2[2], 2));
}

function coliding(body1, rad1, body2, rad2) {
    var distance = dist(body1, body2);
    if(rad1+rad2 >= distance) {
        return true;
    } else {
        return false;
    }
}

function anyColide() {
    //console.log("coliding moon ", coliding(playerPosition, playerRadius, moonPosition, moonRadius));
    //console.log("moon distance", dist(playerPosition, moonPosition));
    return (coliding(playerPosition, playerRadius, moonPosition, moonRadius) || //collision z luno
            coliding(playerPosition, playerRadius, cubePosition, cubeRadius) ||
            coliding(playerPosition, playerRadius, zombie1Position, zombieRadius) ||
            coliding(playerPosition, playerRadius, zombie2Position, zombieRadius) ||
            coliding(playerPosition, playerRadius, zombie3Position, zombieRadius));  //collision z kocko
}

function anyColideZombie1() {
  return (coliding(zombie1Position, zombieRadius, moonPosition, moonRadius) || //collision z luno
            coliding(zombie1Position, zombieRadius, cubePosition, cubeRadius) ||
            coliding(zombie1Position, zombieRadius, playerPosition, playerRadius) /*||
            coliding(zombie1Position, zombieRadius, zombie2Position, zombieRadius) ||
            coliding(zombie1Position, zombieRadius, zombie3Position, zombieRadius)*/);  //collision z kocko
}

function anyColideZombie2() {
  return (coliding(zombie2Position, zombieRadius, moonPosition, moonRadius) || //collision z luno
            coliding(zombie2Position, zombieRadius, cubePosition, cubeRadius) ||
            coliding(zombie2Position, zombieRadius, playerPosition, playerRadius) /*||
            coliding(zombie2Position, zombieRadius, zombie1Position, zombieRadius) ||
            coliding(zombie2Position, zombieRadius, zombie3Position, zombieRadius)*/);  //collision z kocko
}

function anyColideZombie3() {
  return (coliding(zombie3Position, zombieRadius, moonPosition, moonRadius) || //collision z luno
            coliding(zombie3Position, zombieRadius, cubePosition, cubeRadius) ||
            coliding(zombie3Position, zombieRadius, playerPosition, playerRadius) /*||
            coliding(zombie3Position, zombieRadius, zombie2Position, zombieRadius) ||
            coliding(zombie3Position, zombieRadius, zombie1Position, zombieRadius)*/);  //collision z kocko
}
var timer = 0;
function moveZombies() {

    var vecToPlayer1 = [-zombie1Position[0] + playerPosition[0], -zombie1Position[1] + playerPosition[1], -zombie1Position[2] + playerPosition[2]];
    zombie1Rotation = radToDeg(Math.acos(vec3.dot(vecToPlayer1, [0, 0, -1])/vec3.length(vecToPlayer1)));
    var xMul1 = vecToPlayer1[0] < 0 ? 1 : -1;
    var zMul1 = vecToPlayer1[2] < 0 ? 1 : -1;
    zombie1Position[0] -= xMul1 * Math.abs(Math.sin(degToRad(zombie1Rotation)))*zombieSpeed;
    zombie1Position[2] -= zMul1 * Math.abs(Math.cos(degToRad(zombie1Rotation)))*zombieSpeed;

    if(coliding(zombie1Position, zombieRadius, playerPosition, playerRadius) && playerHurtTimeout == 0) {
        hurtPlayer(1, hurtAudio);
        playerHurtTimeout = 180;
    }

    if(anyColideZombie1()) {
      zombie1Position[0] += xMul1 * Math.abs(Math.sin(degToRad(zombie1Rotation)))*zombieSpeed*2;
      zombie1Position[2] += zMul1 * Math.abs(Math.cos(degToRad(zombie1Rotation)))*zombieSpeed*2;
    }


    var vecToPlayer2 = [-zombie2Position[0] + playerPosition[0], -zombie2Position[1] + playerPosition[1], -zombie2Position[2] + playerPosition[2]];
    zombie2Rotation = radToDeg(Math.acos(vec3.dot(vecToPlayer2, [0, 0, -1])/vec3.length(vecToPlayer2)));
    var xMul2 = vecToPlayer2[0] < 0 ? 1 : -1;
    var zMul2 = vecToPlayer2[2] < 0 ? 1 : -1;
    zombie2Position[0] -= xMul2 * Math.abs(Math.sin(degToRad(zombie2Rotation)))*zombieSpeed;
    zombie2Position[2] -= zMul2 * Math.abs(Math.cos(degToRad(zombie2Rotation)))*zombieSpeed;



    if(coliding(zombie2Position, zombieRadius, playerPosition, playerRadius) && playerHurtTimeout == 0) {
        hurtPlayer(1, hurtAudio);
        playerHurtTimeout = 180;
    }

    if(anyColideZombie2()) {
      zombie2Position[0] += xMul1 * Math.abs(Math.sin(degToRad(zombie2Rotation)))*zombieSpeed*2;
      zombie2Position[2] += zMul1 * Math.abs(Math.cos(degToRad(zombie2Rotation)))*zombieSpeed*2;
    }


    var vecToPlayer3 = [-zombie3Position[0] + playerPosition[0], -zombie3Position[1] + playerPosition[1], -zombie3Position[2] + playerPosition[2]];
    zombie3Rotation = radToDeg(Math.acos(vec3.dot(vecToPlayer3, [0, 0, -1])/vec3.length(vecToPlayer3)));
    var xMul3 = vecToPlayer3[0] < 0 ? 1 : -1;
    var zMul3 = vecToPlayer3[2] < 0 ? 1 : -1;
    zombie3Position[0] -= xMul3 * Math.abs(Math.sin(degToRad(zombie3Rotation)))*zombieSpeed;
    zombie3Position[2] -= zMul3 * Math.abs(Math.cos(degToRad(zombie3Rotation)))*zombieSpeed;

    if(coliding(zombie3Position, zombieRadius, playerPosition, playerRadius) && playerHurtTimeout == 0) {
        hurtPlayer(1, hurtAudio);
        playerHurtTimeout = 180;
    }

    if(anyColideZombie3()) {
      zombie3Position[0] += xMul1 * Math.abs(Math.sin(degToRad(zombie3Rotation)))*zombieSpeed*2;
      zombie3Position[2] += zMul1 * Math.abs(Math.cos(degToRad(zombie3Rotation)))*zombieSpeed*2;
    }

    if(coliding(zombie1Position, zombieRadius, zombie2Position, zombieRadius)) {
      portAudio.play();
      var vecZomb = [-zombie2Position[0] + zombie1Position[0], -zombie2Position[1] + zombie1Position[1], -zombie2Position[2] + zombie1Position[2]];
      zombie1Position[0] -= vecZomb[0]*4;
      zombie1Position[2] -= vecZomb[2]*4;
      zombie2Position[0] += vecZomb[0]*4;
      zombie2Position[2] += vecZomb[2]*4;
    }

    if(coliding(zombie1Position, zombieRadius, zombie3Position, zombieRadius)) {
      portAudio.play();
      var vecZomb = [-zombie3Position[0] + zombie1Position[0], -zombie3Position[1] + zombie1Position[1], -zombie3Position[2] + zombie1Position[2]];
      zombie1Position[0] -= vecZomb[0]*4;
      zombie1Position[2] -= vecZomb[2]*4;
      zombie3Position[0] += vecZomb[0]*4;
      zombie3Position[2] += vecZomb[2]*4;
    }

    if(coliding(zombie2Position, zombieRadius, zombie3Position, zombieRadius)) {
      portAudio.play();
      var vecZomb = [-zombie3Position[0] + zombie2Position[0], -zombie3Position[1] + zombie2Position[1], -zombie3Position[2] + zombie2Position[2]];
      zombie2Position[0] -= vecZomb[0]*4;
      zombie2Position[2] -= vecZomb[2]*4;
      zombie3Position[0] += vecZomb[0]*4;
      zombie2Position[2] += vecZomb[2]*4;
    }
    //if(timer == 60) {
      //timer = 0;
      //console.log("vecToPlayer1: ", vecToPlayer1);
    //}

    timer += 1;
}
/**
 * health podas health spremenljivko
 * dmg podas kok damaga nardis
 * sound podas sound spremenljivko, ki se predvaja
 */
function hurtPlayer(dmg, sound) {
  playerHealth -= dmg;
  sound.play();
  //console.log("player health", playerHealth);
}

function hurtZombie1(dmg, sound) {
  zombie1Health -= dmg;
  sound.play();
}

function hurtZombie2(dmg, sound) {
  zombie2Health -= dmg;
  sound.play();
}

function hurtZombie3(dmg, sound) {
  zombie3Health -= dmg;
  sound.play();
}

function restartGame() {
  playerPosition = [0, 0, 0];

  playerHealth = 6;
  playerHurtTimeout = 0;

  playerRotation = 0;



  zombie1Position = [15, 0, 0];
  zombie1Rotation = 0;
  zombie1Health = 10;
  zombie1Spin = 0;

  zombie2Position = [0, 0, 30];
  zombie2Rotation = 0;
  zombie2Health = 10;
  zombie2Spin = 0;

  zombie3Position = [0, 0, -7];
  zombie3Rotation = 0;
  zombie3Health = 10;
  zombie3Spin = 0;



  cubePosition = [3.25, 0, 0];

  moonPosition = [-15.0, 25, 0];

  gameOver = false;

  half_1.style.visibility ='visible';
  half_2.style.visibility ='visible';
  half_3.style.visibility ='visible';

  full_1.style.visibility ='visible';
  full_2.style.visibility ='visible';
  full_3.style.visibility ='visible';


  inGameUI.style.visibility = 'visible';
  gameOverMenu.style.visibility = 'hidden';
  pauseMenu.style.visibility = 'hidden';
  startGame();

}
