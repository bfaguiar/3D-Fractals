/*
	3D Fractals
	Bruno Aguiar, Paulo Sousa
*/

//----------------------------------------------------------------------------
// Global Variables

var numLevels = 0;

var fractal = 0;

var gl = null; // WebGL context 

var shaderProgram = null;

var triangleVertexPositionBuffer = null;
	
var triangleVertexNormalBuffer = null;

// The GLOBAL transformation parameters

var globalAngleYY = 0.0;

var globalTz = 0.0;

// The local transformation parameters

// The translation vector

var tx = 0.0;
var ty = 0.0;
var tz = 0.0;

// The rotation angles in degrees

var angleXX = -30.0;
var angleYY = 20.0;
var angleZZ = 0.0;

// The scaling factors

var sx = 0.5;
var sy = 0.5;
var sz = 0.5;

// GLOBAL Animation controls

var globalRotationYY_ON = 1;
var globalRotationYY_DIR = 1;
var globalRotationYY_SPEED = 1;

// Local Animation controls

var rotationXX_ON = 0;
var rotationXX_DIR = 1;
var rotationXX_SPEED = 1;
var rotationYY_ON = 0;
var rotationYY_DIR = 1;
var rotationYY_SPEED = 1;
var rotationZZ_ON = 0;
var rotationZZ_DIR = 1;
var rotationZZ_SPEED = 1;
 
// To allow choosing the way of drawing the model triangles

var primitiveType = null;
 
// To allow choosing the projection type

var projectionType = 0;

// The viewer position
 
var pos_Viewer = [ 0.0, 0.0, 0.0, 1.0 ];

// Point Light Source Features

// Directional - Homogeneous coordinate is ZERO

var pos_Light_Source = [ 0.0, 0.0, 1.0, 0.0 ];

// White light

var int_Light_Source = [ 0.3, 0.0, 1.0 ];

// Low ambient illumination

var ambient_Illumination = [ 0.3, 0.3, 0.3 ];

// Model Material Features

// Ambient coef.

var kAmbi = [ 1.0, 1.0, 1.0 ];

// Diffuse coef.

var kDiff = [0.8, 0.8, 0.8]; //[ 0.2, 0.48, 0.72 ]; // COLOR

// Specular coef.

var kSpec = [ 0.5, 0.5, 0.5 ];

// Phong coef.

var nPhong = 100;

// Initial model has just ONE TRIANGLE

var vertices = [ ];
var normals = [ ];

//----------------------------------------------------------------------------
// The WebGL code
//----------------------------------------------------------------------------

// Rendering

// Handling the Vertex Coordinates and the Vertex Normal Vectors

function initBuffers() {	
	
	switch(fractal) {
		case 0 : 
			computeSierpinskiGasket();
			break;
	
		case 1 : 
			computeMengerSponge();
			break;
		
		case 2 : 
			computeJerusalemCube();
			break;
		
		case 3:
			computeCantorDust();
			break;

		case 4 :
			computeKochSnowflake();
			break;
	}
	
	triangleVertexPositionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
	triangleVertexPositionBuffer.itemSize = 3;
	triangleVertexPositionBuffer.numItems = vertices.length / 3;			

	// Associating to the vertex shader
	
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 
			triangleVertexPositionBuffer.itemSize, 
			gl.FLOAT, false, 0, 0);
	
	// Vertex Normal Vectors
		
	triangleVertexNormalBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexNormalBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
	triangleVertexNormalBuffer.itemSize = 3;
	triangleVertexNormalBuffer.numItems = normals.length / 3;			

	// Associating to the vertex shader
	
	gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 
			triangleVertexNormalBuffer.itemSize, 
			gl.FLOAT, false, 0, 0);	
}

//----------------------------------------------------------------------------
//  Drawing the model

function drawModel( angleXX, angleYY, angleZZ, 
					sx, sy, sz,
					tx, ty, tz,
					mvMatrix,
					primitiveType ) {

// The the global model transformation is an input

// Concatenate with the particular model transformations

mvMatrix = mult( mvMatrix, translationMatrix( tx, ty, tz ) );
		 
mvMatrix = mult( mvMatrix, rotationZZMatrix( angleZZ ) );

mvMatrix = mult( mvMatrix, rotationYYMatrix( angleYY ) );

mvMatrix = mult( mvMatrix, rotationXXMatrix( angleXX ) );

mvMatrix = mult( mvMatrix, scalingMatrix( sx, sy, sz ) );
		 
// Passing the Model View Matrix to apply the current transformation

var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

gl.uniformMatrix4fv(mvUniform, false, new Float32Array(flatten(mvMatrix)));

// Associating the data to the vertex shader

// Vertex Coordinates and Vertex Normal Vectors

initBuffers();

// Material properties

gl.uniform3fv( gl.getUniformLocation(shaderProgram, "k_ambient"), flatten(kAmbi) );

gl.uniform3fv( gl.getUniformLocation(shaderProgram, "k_diffuse"), flatten(kDiff) );

gl.uniform3fv( gl.getUniformLocation(shaderProgram, "k_specular"), flatten(kSpec) );

gl.uniform1f( gl.getUniformLocation(shaderProgram, "shininess"), nPhong );

// Light Sources

var numLights = lightSources.length;

gl.uniform1i( gl.getUniformLocation(shaderProgram, "numLights"), numLights );

//Light Sources

for(var i = 0; i < lightSources.length; i++ )
{
	gl.uniform1i( gl.getUniformLocation(shaderProgram, "allLights[" + String(i) + "].isOn"), lightSources[i].isOn );

	gl.uniform4fv( gl.getUniformLocation(shaderProgram, "allLights[" + String(i) + "].position"), flatten(lightSources[i].getPosition()) );

	gl.uniform3fv( gl.getUniformLocation(shaderProgram, "allLights[" + String(i) + "].intensities"), flatten(lightSources[i].getIntensity()) );
}

// Drawing 

// primitiveType allows drawing as filled triangles / wireframe / vertices

	if( primitiveType == gl.LINE_LOOP ) {

	// To simulate wireframe drawing!

	// No faces are defined! There are no hidden lines!

	// Taking the vertices 3 by 3 and drawing a LINE_LOOP

		var i;

		for( i = 0; i < triangleVertexPositionBuffer.numItems / 3; i++ ) {
			gl.drawArrays( primitiveType, 3 * i, 3 ); 
		}
	} else {
		gl.drawArrays(primitiveType, 0, triangleVertexPositionBuffer.numItems); 
	}	
}

//----------------------------------------------------------------------------
//  Drawing the 3D scene

function drawScene() {
	
	var pMatrix;
	
	var mvMatrix = mat4();
	
	// Clearing the frame-buffer and the depth-buffer
	
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Computing the Projection Matrix
	
	if( projectionType == 0 ) {
		
		// For now, the default orthogonal view volume
		
		pMatrix = ortho( -1.0, 1.0, -1.0, 1.0, -1.0, 1.0 );
		
		// Global transformation
		
		globalTz = 0.0;
		
		// The viewer is on the ZZ axis at an indefinite distance
		
		pos_Viewer[0] = pos_Viewer[1] = pos_Viewer[3] = 0.0;
		
		pos_Viewer[2] = 1.0;
		
		// Allow the user to control the size of the view volume
	} else {	

		// A standard view volume.
		
		// Viewer is at (0,0,0)
		
		// Ensure that the model is "inside" the view volume
		
		pMatrix = perspective( 45, 1, 0.05, 15 );
		
		// Global transformation !!
		
		globalTz = -2.5;

		// The viewer is on (0,0,0)
		
		pos_Viewer[0] = pos_Viewer[1] = pos_Viewer[2] = 0.0;
		
		pos_Viewer[3] = 1.0;
		
		// Allow the user to control the size of the view volume
	}
	
	// Passing the Projection Matrix to apply the current projection
	
	var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(flatten(pMatrix)));
	
	// Passing the viewer position to the vertex shader
	
	gl.uniform4fv( gl.getUniformLocation(shaderProgram, "viewerPosition"), flatten(pos_Viewer) );
	
	// GLOBAL TRANSFORMATION FOR THE WHOLE SCENE
	
	mvMatrix = translationMatrix( 0, 0, globalTz );
	
	// Updating the position of the light sources, if required
	
	// FOR EACH LIGHT SOURCE
	    
	for(var i = 0; i < lightSources.length; i++ )
	{
		// Animating the light source, if defined
		    
		var lightSourceMatrix = mat4();

		if( !lightSources[i].isOff() ) {
				
			// COMPLETE THE CODE FOR THE OTHER ROTATION AXES

			if( lightSources[i].isRotYYOn() ) 
			{
				lightSourceMatrix = mult( lightSourceMatrix, 
										  rotationYYMatrix( lightSources[i].getRotAngleYY() ) );
			}
		}
		
		// NEW Passing the Light Souree Matrix to apply
	
		var lsmUniform = gl.getUniformLocation(shaderProgram, "allLights["+ String(i) + "].lightSourceMatrix");
	
		gl.uniformMatrix4fv(lsmUniform, false, new Float32Array(flatten(lightSourceMatrix)));
	}
			
	// Instantianting the current model
		
	drawModel( angleXX, angleYY, angleZZ, 
	           sx, sy, sz,
	           tx, ty, tz,
	           mvMatrix,
	           primitiveType );
}

//----------------------------------------------------------------------------
// Animation

// Animation - Updating transformation parameters

var lastTime = 0;

function animate() {
	
	var timeNow = new Date().getTime();
	
	if( lastTime != 0 ) {
		
		var elapsed = timeNow - lastTime;
		
		// Global rotation
		
		if( globalRotationYY_ON ) {

			globalAngleYY += globalRotationYY_DIR * globalRotationYY_SPEED * (90 * elapsed) / 1000.0;
	    }

		// Local rotations
		
		if( rotationXX_ON ) {

			angleXX += rotationXX_DIR * rotationXX_SPEED * (90 * elapsed) / 1000.0;
	    }

		if( rotationYY_ON ) {

			angleYY += rotationYY_DIR * rotationYY_SPEED * (90 * elapsed) / 1000.0;
	    }

		if( rotationZZ_ON ) {

			angleZZ += rotationZZ_DIR * rotationZZ_SPEED * (90 * elapsed) / 1000.0;
		}
	}

	// Rotating the light sources
	
	for(var i = 0; i < lightSources.length; i++ )
	{
		if( lightSources[i].isRotYYOn() ) {
 
			var angle = lightSources[i].getRotAngleYY() + lightSources[i].getRotationSpeed() * (90 * elapsed) / 1000.0;
	
			lightSources[i].setRotAngleYY( angle );
		}

		if( lightSources[i].isRotXXOn() ) {
			var angle = lightSources[i].getRotAngleXX() + lightSources[i].getRotationSpeed() * (90 * elapsed) / 1000.0;

			lightSources[i].setRotAngleXX( angle )
		}
	}
	lastTime = timeNow;
}

//----------------------------------------------------------------------------
// Timer

function tick() {
	
	requestAnimFrame(tick); 
	
	drawScene();
	
	animate();
}

//----------------------------------------------------------------------------
//  User Interaction

function outputInfos(){ }

//----------------------------------------------------------------------------
// Handling mouse events

// Adapted from www.learningwebgl.com

var mouseDown = false;

var lastMouseX = null;

var lastMouseY = null;

function handleMouseDown(event) {
    
    mouseDown = true;
  
    lastMouseX = event.clientX;
  
    lastMouseY = event.clientY;
}

function handleMouseUp(event) {

    mouseDown = false;
}

function handleMouseMove(event) {

	if (!mouseDown) return;
	
    // Rotation angles proportional to cursor displacement
    
    var newX = event.clientX;
  
    var newY = event.clientY;

    var deltaX = newX - lastMouseX;
    
    angleYY += radians( 10 * deltaX  );

    var deltaY = newY - lastMouseY;
    
    angleXX += radians( 10 * deltaY  );
    
    lastMouseX = newX;
    
    lastMouseY = newY;
}

function setEventListeners(canvas) {

	// Projection Type

	document.getElementById("orthogonal").onclick = function(){
		projectionType = 0;
	};
	document.getElementById("perspective").onclick = function(){
		projectionType = 1;
	};

	// Rendering Type

	document.getElementById("filled").onclick = function(){
		primitiveType = gl.TRIANGLES;
	};
	document.getElementById("wireframe").onclick = function(){
		primitiveType = gl.LINE_LOOP;
	};
	document.getElementById("vertices").onclick = function(){
		primitiveType = gl.POINTS;
	}; 
	
	// Fractal Type

	document.getElementById("sierpinskiGasket").onclick = function(){
		fractal = 0;
		computeSierpinskiGasket();
		
	};
	document.getElementById("mengerSponge").onclick = function(){
		fractal = 1;
		computeMengerSponge();
	};

	document.getElementById("jerusalemCube").onclick = function() {
		fractal = 2;
		computeJerusalemCube();
	};

	document.getElementById("cantorDust").onclick = function() {
		fractal = 3;
		computeCantorDust();
	}

	document.getElementById("kochSnowflake").onclick = function() {

		fractal = 4;
		computeKochSnowflake();
	}

	// Button events
	
	document.getElementById("XX-on-off-button").onclick = function(){
		
		// Switching on / off
		if( rotationXX_ON ) {
			rotationXX_ON = 0;
		}
		else {
			rotationXX_ON = 1;
		}  
	};

	document.getElementById("XX-direction-button").onclick = function(){
		
		// Switching the direction
		if( rotationXX_DIR == 1 ) {
			rotationXX_DIR = -1;
		}
		else {
			rotationXX_DIR = 1;
		}  
	};      

	document.getElementById("XX-slower-button").onclick = function(){
		rotationXX_SPEED *= 0.75;  
	};      

	document.getElementById("XX-faster-button").onclick = function(){
		rotationXX_SPEED *= 1.25;  
	};      

	document.getElementById("YY-on-off-button").onclick = function(){
		
		// Switching on / off
		if( rotationYY_ON ) {
			rotationYY_ON = 0;
		}
		else {
			rotationYY_ON = 1;
		}  
	};

	document.getElementById("YY-direction-button").onclick = function(){
		
		// Switching the direction
		if( rotationYY_DIR == 1 ) {
			rotationYY_DIR = -1;
		}
		else {
			rotationYY_DIR = 1;
		}  
	};      

	document.getElementById("YY-slower-button").onclick = function(){
		rotationYY_SPEED *= 0.75;  
	};      

	document.getElementById("YY-faster-button").onclick = function(){
		rotationYY_SPEED *= 1.25;  
	};      

	document.getElementById("ZZ-on-off-button").onclick = function(){
		
		// Switching on / off
		if( rotationZZ_ON ) {	
			rotationZZ_ON = 0;
		}
		else {
			rotationZZ_ON = 1;
		}  
	};

	document.getElementById("ZZ-direction-button").onclick = function(){
		
		// Switching the direction
		if( rotationZZ_DIR == 1 ) {
			rotationZZ_DIR = -1;
		}
		else {
			rotationZZ_DIR = 1;
		}  
	};      

	document.getElementById("ZZ-slower-button").onclick = function(){
		rotationZZ_SPEED *= 0.75;  
	};      

	document.getElementById("ZZ-faster-button").onclick = function(){
		rotationZZ_SPEED *= 1.25;  
	};      

	document.getElementById("reset-button").onclick = function(){
		
		// The initial values

		numLevels = 0;
		document.getElementById("num-iterations").innerHTML = numLevels;

		// The translation vector

		tx = ty = tz = 0.0;

		// The rotation angles in degrees

		angleXX = -22.5;
		angleYY = 16.0;
		angleZZ = 0.0;

		// The scaling factors

		sx = sy = sz = 0.5;
		
		// Local Animation controls

		rotationXX_ON = 0;
		rotationXX_DIR = 1;
		rotationXX_SPEED = 1;
		rotationYY_ON = 0;
		rotationYY_DIR = 1;
		rotationYY_SPEED = 1;
		rotationZZ_ON = 0;
		rotationZZ_DIR = 1;
		rotationZZ_SPEED = 1;
		projectionType = 0;
		kDiff = [0.8, 0.8, 0.8]; 

		initBuffers();
	};

	// Iteraction++
	document.getElementById("add-recursion-button").onclick = function(){
		numLevels = numLevels+1;
		document.getElementById("num-iterations").innerHTML = numLevels;

		switch(fractal) {
			case 0 : 
				computeSierpinskiGasket();
				break;
		
			case 1 : 
				computeMengerSponge();
				break;
			
			case 2 :
				computeJerusalemCube();
				break;

			case 3:
				computeCantorDust();
				break;

			case 4:
				computeKochSnowflake();
				break;
		}
		initBuffers();
	}; 

	// Iteraction--
	document.getElementById("reduce-recursion-button").onclick = function(){
		if (numLevels > 0){
			numLevels = numLevels-1;
			document.getElementById("num-iterations").innerHTML = numLevels;
		}
		initBuffers();
	};
	
	// Handling the mouse
	canvas.onmousedown = handleMouseDown;
    
    document.onmouseup = handleMouseUp;
    
	document.onmousemove = handleMouseMove;
	
	// Zooming
	canvas.addEventListener('wheel', function(event) {
		if(event.deltaY > 0) {  
			if (sx <= 0.1) { sx = 0.1; sy = 0.1; sz = 0.1; } 
			else { sx -= 0.1; sy -= 0.1; sz -= 0.1; }
		} 
		else {
			if (sx >= 1) { sx = 0.9; sy = 0.9; sz = 0.9; } 
			else { sx += 0.1; sy += 0.1; sz += 0.1; }
		}
		drawScene();
	}, false);
	
	// Prent window scroll when zooming
	document.getElementById( "my-canvas" ).onwheel = function(event){
    	event.preventDefault();
	};
}

//----------------------------------------------------------------------------
// WebGL Initialization

function initWebGL( canvas ) {
	try {
		
		// Create the WebGL context
		
		// Some browsers still need "experimental-webgl"
		
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		
		// DEFAULT: The viewport occupies the whole canvas 
		
		// DEFAULT: The viewport background color is WHITE
		
		// Drawing the triangles defining the model
		
		primitiveType = gl.TRIANGLES;
		
		// DEFAULT: Face culling is DISABLED
		
		// Enable FACE CULLING
		
		gl.enable( gl.CULL_FACE );
		
		// DEFAULT: The BACK FACE is culled!!
		 
		// The next instruction is not needed...
		
		gl.cullFace( gl.BACK );
		
		// Enable DEPTH-TEST
		
		gl.enable( gl.DEPTH_TEST );
        
	} catch (e) {
	}
	if (!gl) {
		alert("Could not initialise WebGL, sorry! :-(");
	}        
}

//----------------------------------------------------------------------------

function runWebGL() {
	
	var canvas = document.getElementById("my-canvas");
	
	initWebGL( canvas );

	shaderProgram = initShaders( gl );
	
	setEventListeners(canvas);
	
	initBuffers();
	
	tick(); 

	outputInfos();
}

function getVertices( flag ) {

	if (flag === "Tetra") {

		var a = [ -1.0,  0.0, -0.707 ];
    	var b = [  0.0,  1.0,  0.707 ]; 
    	var c = [  1.0,  0.0, -0.707 ];
		var d = [  0.0, -1.0,  0.707 ];  

		return [a, b, c, d];
	}

	else if (flag === "Cubo") {

		var a = [ -1, -1,  1 ]; 
		var b = [  1, -1,  1 ]; 
		var c = [  1,  1,  1 ];  
		var d = [ -1,  1,  1 ];
		var e = [ -1, -1, -1 ];       
		var f = [  1, -1, -1 ];  
		var g = [  1,  1, -1 ];       
		var h = [ -1,  1, -1 ];

		return [a, b, c, d, e, f, g, h];
	}

	return null;
}  

function interpolate( u, v, s ) {
		
	var result = [];
	for ( var i = 0; i < u.length; ++i ) {
		result.push( (1.0 - s) * u[i] +  s * v[i] );
	}
	return result; 
}  

//----------------------------------------------------------------------------
// Sierpinski Gasket
//----------------------------------------------------------------------------

function computeSierpinskiGasket() {
	
	vertices = []; 
	normals  = [];

	var [a, b, c, d] = getVertices("Tetra");

	divideSierpinskiGasket( a, b, c, d, numLevels );
	vertices = flatten( vertices );
	computeVertexNormals( vertices, normals );  
}  
 
function divideSierpinskiGasket(a, b, c, d, n) {
	
	if (n == 0) {	
		vertices.push(a, b, c,
					  c, b, d,
					  d, b, a, 
				      a, c, d);
	} else {	
		var ab = computeMidPoint(a, b);
		var ac = computeMidPoint(a, c);
		var ad = computeMidPoint(a, d);
		var bc = computeMidPoint(b, c);
		var bd = computeMidPoint(b, d);
		var cd = computeMidPoint(c, d); 
		
		n--;   

		divideSierpinskiGasket( a, ab, ac, ad, n );
		divideSierpinskiGasket( ab, b, bc, bd, n );
		divideSierpinskiGasket( ac, bc, c, cd, n );
		divideSierpinskiGasket( ad, bd, cd, d, n );
	}  
}

//--------------------------------------------------------------------------------
// Menger Sponge   													
//--------------------------------------------------------------------------------

function computeMengerSponge() {
	
	vertices = [];
	normals = [];

	var [a, b, c, d, e, f, g, h] = getVertices("Cubo");

	divideMengerSponge(a, b, c, d, e, f, g, h, numLevels);
	vertices = flatten(vertices);
	computeVertexNormals(vertices, normals) ;
}
 
function divideMengerSponge(a, b, c, d, e, f, g, h, n) {

	if (n < 1) {
		vertices.push(a, b, c, 
					  a, c, d,
					  e, h, g,
					  e, g, f,
					  h, d, c,
					  h, c, g,
			  		  e, f, b, 
					  e, b, a,
					  f, g, c,
					  f, c, b,
					  e, a, d, 
					  e, d, h);  
	} else {

		var ab = interpolate(a, b, 1/3);
		var ba = interpolate(a, b, 2/3);
		var ae = interpolate(a, e, 1/3);
		var ea = interpolate(a, e, 2/3);
		var bf = interpolate(b, f, 1/3);
		var fb = interpolate(b, f, 2/3);
		var ef = interpolate(e, f, 1/3);
		var fe = interpolate(e, f, 2/3);
		var dc = interpolate(d, c, 1/3);
		var cd = interpolate(d, c, 2/3);
		var cg = interpolate(c, g, 1/3);
		var gc = interpolate(c, g, 2/3);
		var hg = interpolate (h, g, 1/3);
		var gh = interpolate(h, g, 2/3);
		var dh = interpolate(d, h, 1/3);
		var hd = interpolate(d, h, 2/3);
		var ad = interpolate(a, d, 1/3);
		var da = interpolate(a, d, 2/3);
		var bc = interpolate(b, c, 1/3);
		var cb = interpolate(b, c, 2/3);
		var fg = interpolate(f, g, 1/3);
		var gf = interpolate(f, g, 2/3);
		var eh = interpolate(e, h, 1/3);
		var he = interpolate(e, h, 2/3);   

		n--;

		// each function bellow has the four front vertices first and then the back vertices 

		// FRONT LEFT BOTTOM CUBE 
		divideMengerSponge
		(	a,
			ab,
			interpolate( ad, bc, 1/3 ),
			ad, 

			ae,
			interpolate( ab, ef, 1/3 ),
			interpolate(interpolate( ad, bc, 1/3 ), interpolate( eh, fg, 1/3 ), 1/3 ),
			interpolate( ad, eh, 1/3 ),  

			n 
		);

		// FRONT CENTER BOTTOM CUBE 
		divideMengerSponge 
		( 	ab,
			ba,
			interpolate( ba, cd, 1/3 ), 
			interpolate( ab, dc, 1/3 ),

			interpolate( ab, ef, 1/3 ),
			interpolate( ba, fe, 1/3 ),
			interpolate(interpolate( ba, cd, 1/3 ), interpolate( fe, gh, 1/3 ), 1/3 ),
			interpolate(interpolate( ab, dc, 1/3 ), interpolate( ef, hg, 1/3 ), 1/3 ), 

			n 
		); 

		// FRONT RIGHT BOTTOM CUBE
		divideMengerSponge 
		(	ba, 
			b,
			bc, 
			interpolate( ad, bc, 2/3 ),

			interpolate( ba, fe, 1/3 ),
			bf,
			interpolate( bc, fg, 1/3 ),
			interpolate(interpolate( ba, cd, 1/3 ), interpolate( fe, gh, 1/3 ), 1/3 ),

			n 
		);

		// FRONT MID LEFT CUBE
		divideMengerSponge
		(	ad,
			interpolate( ad, bc, 1/3 ),
			interpolate( da, cb, 1/3 ),
			da,

			interpolate( ad, eh, 1/3 ),
			interpolate(interpolate( ad, bc, 1/3 ), interpolate( eh, fg, 1/3 ), 1/3 ),
			interpolate(interpolate( da, cb, 1/3 ), interpolate( he, gf, 1/3 ), 1/3 ),
			interpolate( da, he, 1/3 ),

			n
		); 

		// FRONT MID RIGHT CUBE
		divideMengerSponge 
		(	interpolate( ad, bc, 2/3 ),
			bc, 
			cb,
			interpolate( da, cb, 2/3 ),

			interpolate(interpolate( ba, cd, 1/3 ), interpolate( fe, gh, 1/3 ), 1/3 ), 
			interpolate( bc, fg, 1/3 ),  
			interpolate( cb, gf, 1/3 ),
			interpolate(interpolate( da, cb, 2/3 ), interpolate( he, gf, 2/3 ), 1/3 ),

			n
		);     

		// FRONT TOP LEFT CUBE
		divideMengerSponge 
		(	da, 
			interpolate( da, cb, 1/3 ),
			dc, 
			d,

			interpolate( da, he, 1/3 ),
			interpolate(interpolate( da, cb, 1/3 ), interpolate( he, gf, 1/3 ), 1/3 ),
			interpolate( dc, hg, 1/3 ),
			dh,  

			n
		);

		// FRONT TOP MID CUBE
		divideMengerSponge 
		(	interpolate( da, cb, 1/3 ),
			interpolate( da, cb, 2/3 ),
			cd,  
			dc,

			interpolate(interpolate( da, cb, 1/3 ), interpolate( he, gf, 1/3 ), 1/3 ),
			interpolate(interpolate( da, cb, 2/3 ), interpolate( he, gf, 2/3 ), 1/3 ),
			interpolate( cd, gh, 1/3 ),
			interpolate( dc, hg, 1/3),

			n
		);  

		// FRONT TOP RIGHT CUBE
		divideMengerSponge 
		(	interpolate( da, cb, 2/3 ),
			cb,
			c,
			cd,

			interpolate(interpolate( da, cb, 2/3 ), interpolate( he, gf, 2/3 ), 1/3 ),
			interpolate( cb, gf, 1/3 ),
			cg,
			interpolate( cd, gh, 1/3 ),

			n
		);
		
		// MID TOP LEFT CUBE
		divideMengerSponge
		(	interpolate( da, he, 1/3 ),
			interpolate(interpolate( da, cb, 1/3 ), interpolate( he, gf, 1/3 ), 1/3 ), 
			interpolate( dc, hg, 1/3 ),
			dh,

			interpolate( da, he, 2/3 ),
			interpolate(interpolate( da, cb, 1/3 ), interpolate( he, gf, 1/3 ), 2/3 ),
			interpolate( dc,  hg, 2/3 ),
			hd, 

			n
		);    

		// MID TOP RIGHT CUBE 
		divideMengerSponge
		(	interpolate(interpolate( da, cb, 2/3 ), interpolate( he,  gf, 2/3 ), 1/3 ), 
			interpolate( cb, gf, 1/3 ),
			cg, 
			interpolate( cd, gh, 1/3 ),
			 
			interpolate(interpolate( da, cb, 2/3 ), interpolate( he, gf, 2/3 ), 2/3 ),
			interpolate( cb, gf, 2/3 ),
			gc, 
			interpolate( cd, gh, 2/3 ),

			n
		); 

		// MID BOTOM LEFT CUBE
		divideMengerSponge
		(	ae, 
			interpolate( ab, ef, 1/3 ),
			interpolate(interpolate( ad, bc, 1/3 ), interpolate( eh, fg , 1/3 ), 1/3 ),
			interpolate( ad, eh, 1/3 ),

			ea,  
			interpolate(ab, ef, 2/3),
			interpolate ( interpolate( ad, bc, 1/3), interpolate(eh, fg , 1/3), 2/3), 
			interpolate( ad,  eh , 2/3 ),

			n
		);  
		
		// MID BOTTOM RIGHT CUBE 
		divideMengerSponge
		(	interpolate( ba, fe, 1/3 ), 
			bf, 
			interpolate( bc, fg, 1/3 ),
			interpolate(interpolate( ad, bc, 2/3 ), interpolate( eh, fg, 2/3 ), 1/3 ),

			interpolate( ba, fe, 2/3 ),  
			fb, 
			interpolate( bc, fg, 2/3 ),
			interpolate(interpolate( ad, bc, 2/3 ) ,interpolate( eh, fg, 2/3 ), 2/3 ),

			n
		); 

		// BACK TOP LEFT CUBE
		divideMengerSponge
		(	interpolate( da, he, 2/3 ),
			interpolate(interpolate( da, cb, 1/3 ), interpolate( he, gf, 1/3 ), 2/3 ),
			interpolate( dc, hg, 2/3 ), 
			hd, 

			he, 
			interpolate( he, gf, 1/3 ),
			hg , 
			h,

			n
		);

		// BACK TOP MID CUBE  
		divideMengerSponge
		(	interpolate(interpolate( da, cb, 1/3 ), interpolate( he, gf ,1/3 ), 2/3 ), 
			interpolate( interpolate( da, cb,2/3 ), interpolate( he, gf, 2/3 ), 2/3 ),
			interpolate( hd, gc, 2/3), 
			interpolate( hd, gc, 1/3 ), 

			interpolate( he, gf, 1/3 ),  
			interpolate( he, gf, 2/3 ),
			gh,
			hg,

			n
		); 

		// BACK TOP RIGHT CUBE
		divideMengerSponge 
		(	interpolate(interpolate( da, cb, 2/3 ), interpolate( he, gf, 2/3 ), 2/3 ),
			interpolate( cb, gf, 2/3 ),
			gc, 
			interpolate( cd, gh, 2/3 ),

			interpolate( he, gf, 2/3 ),
			gf, 
			g,
			gh,

			n
		);
		
		// BACK MID LEFT CUBE
		divideMengerSponge
		(	interpolate( ad, eh,  2/3 ),
			interpolate(interpolate( ad, bc, 1/3 ), interpolate( eh, fg, 1/3 ), 2/3 ),
			interpolate(interpolate( da, cb, 1/3 ), interpolate( he, gf, 1/3 ), 2/3 ),
			interpolate( da, he, 2/3 ), 

			eh,      
			interpolate( eh, fg, 1/3 ),
			interpolate( he, gf, 1/3 ), 
			he, 

			n
		);  
		   
		// BACK MID RIGHT CUBE
		divideMengerSponge
		(	interpolate(interpolate( ad, bc, 2/3 ), interpolate( eh, fg,2/3 ), 2/3 ),
			interpolate( bc, fg, 2/3 ),
			interpolate( cb, gf, 2/3 ),
			interpolate(interpolate( da, cb, 2/3 ), interpolate( he, gf, 2/3 ), 2/3 ),

			interpolate( eh, fg, 2/3 ),
			fg , 
			gf,  
			interpolate( he, gf, 2/3 ),

			n
		);
				 
		//  BACK LEFT BOTTOM CUBE
		divideMengerSponge
		(	ea, 
			interpolate( ea, fb, 1/3 ),  
			interpolate(interpolate( ad, bc, 1/3 ), interpolate( eh, fg, 1/3 ), 2/3 ),
			interpolate( ad, eh, 2/3 ),

			e, 
			ef, 
			interpolate(eh, fg, 1/3 ),
			eh,

			n
		);   

		// BACK MID BOTTOM CUBE
		divideMengerSponge
		(	interpolate(ea, fb, 1/3 ), 
			interpolate(ea, fb, 2/3 ), 
			interpolate(interpolate(ad, bc, 2/3), interpolate(eh, fg, 2/3), 2/3),
			interpolate(interpolate(ad, bc, 1/3), interpolate(eh, fg, 1/3 ), 2/3),

			ef, 
			fe, 
			interpolate(eh, fg, 2/3 ),
			interpolate(eh, fg, 1/3 ),

			n
		); 
		
		//  BACK RIGHT BOTTOM CUBE
		divideMengerSponge
		(	interpolate(ea, fb, 2/3 ),  
			fb, 
			interpolate(bc, fg, 2/3 ),
			interpolate(interpolate(ad, bc, 2/3) , interpolate(eh, fg, 2/3), 2/3), 

			fe , 
			f,
			fg,
			interpolate(eh, fg, 2/3 ),

			n
		); 
	}
}   
//--------------------------------------------------------------------------------
// Jerusalem Cube  													
//--------------------------------------------------------------------------------

function computeJerusalemCube() {

	var [a, b, c, d, e, f, g, h] = getVertices("Cubo");

	vertices = [];
	normals = [];

	drawJerusalemPattern(a, b, c, d, e, f, g, h, numLevels); 
	vertices = flatten(vertices);
	computeVertexNormals(vertices, normals);  
}

function drawJerusalemPattern(a, b, c, d, e, f, g, h, n) {

	if (n == 0) {
		vertices.push(a, b, c, 
					  a, c, d,
					  e, h, g,
					  e, g, f,
					  h, d, c,
					  h, c, g,
					  e, f, b, 
					  e, b, a,
					  f, g, c,
					  f, c, b,
					  e, a, d, 
					  e, d, h);  
	} else {
		var small_jd = ((Math.sqrt(2)-1) * (Math.sqrt(2)-1)); //2/3
		var  jerusalem_distance= (Math.sqrt(2)-1);
		var large_jd = jerusalem_distance + small_jd;
	
		n--; 

		var ab = interpolate(a, b, jerusalem_distance);
		var ba = interpolate(a, b, large_jd);
		var ae = interpolate(a, e, jerusalem_distance);
		var ea = interpolate(a, e, large_jd);
		var bf = interpolate(b, f, jerusalem_distance);
		var fb = interpolate(b, f, large_jd);
		var ef = interpolate(e, f, jerusalem_distance);
		var fe = interpolate(e, f, large_jd);
		var dc = interpolate(d, c, jerusalem_distance);
		var cd = interpolate(d, c, large_jd);
		var cg = interpolate(c, g, jerusalem_distance);
		var gc = interpolate(c, g, large_jd);
		var hg = interpolate (h, g, jerusalem_distance);
		var gh = interpolate(h, g, large_jd);
		var dh = interpolate(d, h, jerusalem_distance);
		var hd = interpolate(d, h, large_jd);
		var ad = interpolate(a, d, jerusalem_distance);
		var da = interpolate(a, d, large_jd);
		var bc = interpolate(b, c, jerusalem_distance);
		var cb = interpolate(b, c, large_jd);
		var fg = interpolate(f, g, jerusalem_distance);
		var gf = interpolate(f, g, large_jd);
		var eh = interpolate(e, h, jerusalem_distance);
		var he = interpolate(e, h, large_jd); 

		//FRONT LEFT BOTTOM CUBE
		drawJerusalemPattern
		(	a, 
			ab, 
			interpolate(ab, dc, jerusalem_distance),
			ad,

			ae, 
			interpolate(ae, bf, jerusalem_distance), 
			interpolate(interpolate(ab, dc, jerusalem_distance ), interpolate( ef, hg, jerusalem_distance), jerusalem_distance),
			interpolate(ae, dh, jerusalem_distance),

			n
		);
		
		//FRONT RIGHT BOTTOM CUBE
		drawJerusalemPattern
		(	ba, 
			b,
			bc, 
			interpolate(ad, bc, large_jd),
			
			interpolate(ae, bf, large_jd),
			bf, 
			interpolate(bf, cg, jerusalem_distance),
			interpolate(interpolate(bf, cg, jerusalem_distance), interpolate(ae, dh, jerusalem_distance), jerusalem_distance),
			
			n
		);
		
		//FRONT LEFT TOP CUBE
		drawJerusalemPattern
		(	da, 
			interpolate(da, cb, jerusalem_distance),
			dc ,  
			d, 

			interpolate(da, he, jerusalem_distance),
			interpolate(interpolate(da, he, jerusalem_distance), interpolate(cb, gf, jerusalem_distance), jerusalem_distance),
			interpolate(dh, cg, jerusalem_distance),
			dh,
			
			n
		);

		//FRONT RIGHT TOP CUBE
		drawJerusalemPattern
		(	interpolate(da, cb, large_jd),
			cb, 
			c, 
			cd, 

			interpolate(interpolate(da,  he,  jerusalem_distance), interpolate(cb, gf, jerusalem_distance), large_jd),
			interpolate(cb, gf, jerusalem_distance),
			cg, 
			interpolate(dh, cg, large_jd),

			n
		);
		
		//BACK LEFT TOP CUBE
		drawJerusalemPattern
		(	interpolate(da, he, large_jd),
			interpolate(interpolate(da, he, large_jd), interpolate(cb, gf, large_jd), jerusalem_distance),
			interpolate(hd, gc, jerusalem_distance),
			hd, 

			he, 
			interpolate(he, gf, jerusalem_distance),
			hg, 
			h,

			n 
		);

		//BACK RIGHT TOP CUBE
		drawJerusalemPattern
		(	interpolate(interpolate(da, he, large_jd), interpolate(cb, gf, large_jd),  large_jd),
			interpolate(cb, gf, large_jd),
			gc, 
			interpolate(hd, gc, large_jd),

			interpolate(he, gf, large_jd),
			gf, 
			g, 
			gh, 
		
			n
		);
		
		//BACK LEFT BOTTOM CUBE	
		drawJerusalemPattern
		(	ea, 
			interpolate(ea, fb, jerusalem_distance),
			interpolate(interpolate(ea, hd, jerusalem_distance), interpolate(fb, gc, jerusalem_distance), jerusalem_distance), 
			interpolate(ea, hd, jerusalem_distance),

			e, 
			ef, 
			interpolate(eh, fg, jerusalem_distance),
			eh,
			
			n
		);
		
		//BACK RIGHT BOTTOM CUBE
		drawJerusalemPattern
		(	interpolate(ea, fb, large_jd), 
			fb, 
			interpolate(fb, gc, jerusalem_distance), 
			interpolate(interpolate(fb, gc, jerusalem_distance), interpolate(ea, hd, jerusalem_distance), jerusalem_distance),
			  
			fe,  
			f,
			fg,  
			interpolate(eh, fg, large_jd),
		  
			n
		);
		
		//FRONT MID BOTTOM SMALL CUBE
		drawJerusalemPattern
		(	ab, 
			ba, 
			interpolate(ba, cd, small_jd),
			interpolate(ab, dc, small_jd),
			
			interpolate(ab, ef, small_jd),
			interpolate(ba, fe, small_jd), 
			interpolate(interpolate(ba, cd, small_jd),interpolate(fe, gh, small_jd), small_jd),
			interpolate(interpolate(ab, dc, small_jd), interpolate(ef, hg, small_jd), small_jd ),

			n
		); 
		
		//FRONT MID TOP SMALL CUBE
		drawJerusalemPattern
		(	interpolate(dc, ab, small_jd),
			interpolate(cd, ba, small_jd),
			cd,
			dc, 

			interpolate(interpolate(dc, ab, small_jd), interpolate(hg, ef, small_jd), small_jd),
			interpolate(interpolate(cd, ba, small_jd), interpolate(gh ,fe, small_jd), small_jd),
			interpolate(cd, gh, small_jd),
			interpolate(dc, hg, small_jd),

			n
		);
		
		//FRONT LEFT MID SMALL CUBE
		drawJerusalemPattern
		(	ad, 
			interpolate(ad, bc, small_jd),
			interpolate(da, cb, small_jd),
			da, 

			interpolate(ad, eh, small_jd),
			interpolate(interpolate(ad, eh, small_jd), interpolate(bc, fg, small_jd), small_jd),
			interpolate(interpolate(da, he, small_jd), interpolate(cb, gf, small_jd), small_jd),
			interpolate(da, he, small_jd), 
 
			n
		);
		
		//FRONT RIGHT MID SMALL CUBE
		drawJerusalemPattern 
		(	interpolate(bc, ad, small_jd),
			bc, 
			cb,
			interpolate(cb, da, small_jd),

			interpolate(interpolate(bc, fg, small_jd), interpolate(ad, eh, small_jd), small_jd),
			interpolate(bc, fg, small_jd), 
			interpolate(cb, gf, small_jd),
			interpolate(interpolate(cb, gf, small_jd), interpolate(da, he, small_jd), small_jd),
			
			n
		);
		
		//MID TOP LEFT SMALL CUBE
		drawJerusalemPattern
		( 	interpolate(dh, ae, small_jd), 
			interpolate(interpolate(dh, cg, small_jd), interpolate(ae, bf, small_jd), small_jd),
			interpolate(dh, cg, small_jd),
			dh, 

			interpolate(hd, ea, small_jd),
			interpolate(interpolate(hd, ea, small_jd), interpolate(gc, fb, small_jd), small_jd),
			interpolate(hd, gc,  small_jd),
			hd,
			
			n
		);
		
		//MID BOTTOM LEFT SMALL CUBE
		drawJerusalemPattern
		(	ae, 
			interpolate(ae, bf, small_jd),
			interpolate(interpolate(ae, bf, small_jd), interpolate(dh, cg, small_jd), small_jd),
			interpolate(ae, dh, small_jd),

			ea, 
			interpolate(ea, fb, small_jd),
			interpolate(interpolate(ea, fb, small_jd), interpolate(hd, gc, small_jd), small_jd),
			interpolate(ea, hd, small_jd),
			
			n 
		);

		//MID TOP RIGHT SMALL CUBE
		drawJerusalemPattern
		(	interpolate(interpolate(cg, dh, small_jd), interpolate(bf, ae, small_jd), small_jd),
			interpolate(cg, bf, small_jd),
			cg,  
			interpolate(cg, dh, small_jd),

			interpolate(interpolate(gc, fb, small_jd), interpolate(hd, ea, small_jd), small_jd),
			interpolate(gc, fb, small_jd),
			gc, 
			interpolate(gc, hd, small_jd),

			n
		);
		
		//BACK MID LEFT SMALL CUBE
		drawJerusalemPattern
		(	interpolate(eh, ad, small_jd),
			interpolate(interpolate(eh, ad, small_jd), interpolate(fg, bc, small_jd), small_jd),
			interpolate(interpolate(he, da, small_jd), interpolate(gf, cb, small_jd), small_jd), 
			interpolate(he, da, small_jd),
				
			eh, 
			interpolate(eh, fg, small_jd),
			interpolate(he, gf, small_jd),
			he,
			
			n
		);
		
		//BACK MID RIGHT SMALL CUBE
		drawJerusalemPattern
		(	interpolate(interpolate(fg, bc, small_jd), interpolate(eh, ad, small_jd), small_jd),
			interpolate(fg, bc, small_jd),
			interpolate(gf, cb, small_jd), 
			interpolate(interpolate(gf, cb, small_jd), interpolate(he, da, small_jd), small_jd),
			
			interpolate(fg, eh, small_jd),
			fg, 
			gf, 
			interpolate(gf, he, small_jd), 
			
			n
		);
		
		
		//MID RIGHT BOTTOM SMALL CUBE	
		drawJerusalemPattern
		(	interpolate(bf, ae, small_jd),  
			bf, 
			interpolate(bf, cg, small_jd), 
			interpolate(interpolate(bf, cg, small_jd), interpolate(ae, dh, small_jd), small_jd),
			
			interpolate(fb, ea, small_jd), 
			fb, 
			interpolate(fb, gc, small_jd), 
			interpolate(interpolate(fb, gc, small_jd), interpolate(ea, hd, small_jd), small_jd), 
			
			n
		);
			
		//BACK MID BOTTOM SMALL CUBE	
		drawJerusalemPattern
		(	interpolate(ef, ab, small_jd),
			interpolate(fe, ba, small_jd),
			interpolate(interpolate(fe, ba, small_jd), interpolate(gh, cd, small_jd), small_jd), 
			interpolate(interpolate(ef, ab, small_jd), interpolate(hg, dc, small_jd), small_jd),
			
			ef, 
			fe,
			interpolate(fe, gh, small_jd),
			interpolate(ef, hg, small_jd),
			
			n
		); 

		//BACK MID TOP SMALL CUBE	
		drawJerusalemPattern
		(	interpolate(interpolate(hg, dc, small_jd), interpolate(ef, ab, small_jd), small_jd),
			interpolate(interpolate(gh, cd, small_jd), interpolate(fe, ba, small_jd), small_jd),
			interpolate(gh, cd, small_jd),
			interpolate(hg, dc, small_jd),
			
			interpolate(hg, ef, small_jd),
			interpolate(gh, fe, small_jd),
			gh, 
			hg, 
			
			n
		);
	}
}  

//--------------------------------------------------------------------------------
// Cantor Dust  													
//--------------------------------------------------------------------------------

function computeCantorDust() {
	var [a, b, c, d, e, f, g, h] = getVertices("Cubo");

	vertices = [];
	normals = [];
	makeDust(a, b, c, d, e, f, g, h, numLevels);
	vertices = flatten(vertices);
	computeVertexNormals(vertices, normals);  	
}

function makeDust(a, b, c, d, e, f, g, h, n) {
	
	if (n == 0) {
		vertices.push(a, b, c, 
					  a, c, d,
					  e, h, g,
					  e, g, f,
					  h, d, c,
					  h, c, g,
					  e, f, b, 
					  e, b, a,
					  f, g, c,
					  f, c, b,
					  e, a, d, 
					  e, d, h);  
	}else {
		var  small = 1/3
		var large = 2/3;

		n--; 

		var  ab = interpolate(a, b, small);
		var ba = interpolate(a, b, large);
		var ae = interpolate(a, e, small);
		var ea = interpolate(a, e, large);
		var bf = interpolate(b, f, small);
		var fb = interpolate(b, f, large);
		var ef = interpolate(e, f, small);
		var fe = interpolate(e, f, large);
		var dc = interpolate(d, c, small);
		var cd = interpolate(d, c, large);
		var cg = interpolate(c, g, small);
		var gc = interpolate(c, g, large);
		var hg = interpolate (h, g, small);
		var gh = interpolate(h, g, large);
		var dh = interpolate(d, h, small);
		var hd = interpolate(d, h, large);
		var ad = interpolate(a, d, small);
		var da = interpolate(a, d, large);
		var bc = interpolate(b, c, small);
		var cb = interpolate(b, c, large);
		var fg = interpolate(f, g, small);
		var gf = interpolate(f, g, large);
		var eh = interpolate(e, h, small);
		var he = interpolate(e, h, large); 

		//FRONT LEFT BOTTOM CUBE
		makeDust
		(	a, 
			ab, 
			interpolate(ab, dc, small),
			ad,

			ae, 
			interpolate(ae, bf, small), 
			interpolate(interpolate(ab, dc, small), interpolate(ef, hg, small), small),
			interpolate(ae, dh, small),
			
			n
		);
		
		//FRONT RIGHT BOTTOM CUBE
		makeDust
		(	ba, 
			b,
			bc, 
			interpolate(ad, bc, large),
			
			interpolate(ae, bf, large),
			bf, 
			interpolate(bf, cg, small),
			interpolate(interpolate(bf, cg, small), interpolate(ae, dh, small), small),
			
			n
		);
		
		//FRONT LEFT TOP CUBE
		makeDust
		(	da, 
			interpolate(da, cb, small),
			dc ,  
			d, 

			interpolate(da, he, small),
			interpolate(interpolate(da, he, small), interpolate(cb, gf, small), small),
			interpolate(dh, cg, small),
			dh,

			n
		);
		
		//FRONT RIGHT TOP CUBE
		makeDust
		(	interpolate(da, cb, large),
			cb, 
			c, 
			cd, 

			interpolate(interpolate(da,  he,  small), interpolate(cb, gf, small), large),
			interpolate(cb, gf, small),
			cg, 
			interpolate(dh, cg, large),
			
			n
		);

		//BACK LEFT TOP CUBE
		makeDust
		(	interpolate(da, he, large),
			interpolate(interpolate(da, he, large), interpolate(cb, gf, large), small),
			interpolate(hd, gc, small),
			hd, 

			he, 
			interpolate(he, gf, small),
			hg, 
			h,
			
			n
		);
		
		//BACK RIGHT TOP CUBE
		makeDust
		(	interpolate(interpolate(da, he, large), interpolate(cb, gf, large),  large),
			interpolate(cb, gf, large),
			gc, 
			interpolate(hd, gc, large),

			interpolate(he, gf, large),
			gf, 
			g, 
			gh, 
			
			n
		);
		
		//BACK LEFT BOTTOM CUBE
		makeDust
		(	ea, 
			interpolate(ea, fb, small),
			interpolate(interpolate(ea, hd, small), interpolate(fb, gc, small), small), 
			interpolate(ea, hd, small),

			e, 
			ef, 
			interpolate(eh, fg, small),
			eh,

			n
		);
		
		//BACK RIGHT BOTTOM CUBE
		makeDust
		( 	interpolate(ea, fb, large), 
			fb, 
			interpolate(fb, gc, small), 
			interpolate(interpolate(fb, gc, small), interpolate(ea, hd, small), small),
			  
			fe,  
			f,
			fg,  
			interpolate(eh, fg, large),
		  
			n
		);
	}
}

//--------------------------------------------------------------------------------
// Koch Snowflake   													
//--------------------------------------------------------------------------------
function computeKochSnowflake() {

	var [a, b, c, d] = getVertices("Tetra");

	vertices = [];
	normals = [];

	divideKochSnowflake(a, b, c, numLevels);
	divideKochSnowflake(c, b, d, numLevels);
	divideKochSnowflake(d, b, a, numLevels);
	divideKochSnowflake(a, c, d, numLevels);
	
	vertices.push(a, b, c, 
				  c, b, d,
				  d, b, a,
				  a, c, d); 
	
	vertices = flatten(vertices);
	computeVertexNormals(vertices, normals);

}     

function divideKochSnowflake(a, b, c, n) {

	while(n > 0) {

		var ab = computeMidPoint(a, b);
		var bc = computeMidPoint(b, c);
		var ac = computeMidPoint(a, c);  

		var mid_point = computeCentroid(ab, bc, ac);
		var normal = computeNormalVector(a, b, c);
		
		for (var i = 0; i < normal.length; i++) {
			normal[i] = normal[i] * (Math.sqrt(3)/2)*(distance2Points(ab, bc));
		}

		var nv = add(mid_point, normal);
		
		n--;

		divideKochSnowflake(ab, bc, nv, n);
		divideKochSnowflake(ab, nv, ac, n);
		divideKochSnowflake(bc, ac, nv, n);
		divideKochSnowflake(ac, bc, ab, n);

		vertices.push(ac, bc, ab, 
					  ab, bc, nv,
					  nv, bc, ac,
					  ac, ab, nv);			
	}  
}   
 