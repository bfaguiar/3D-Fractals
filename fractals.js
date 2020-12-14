
//----------------------------------------------------------------------------
//
// Global Variables
//
//----------------------------------------------------------------------------


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

// --- The viewer position

var pos_Viewer = [ 0.0, 0.0, 0.0, 1.0 ];

// --- Point Light Source Features

// Directional --- Homogeneous coordinate is ZERO

var pos_Light_Source = [ 0.0, 0.0, 1.0, 0.0 ];

// White light

var int_Light_Source = [ 0.3, 0.0, 1.0 ];

// Low ambient illumination

var ambient_Illumination = [ 0.3, 0.3, 0.3 ];

// NEW --- Model Material Features

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
//
// The WebGL code
//
//----------------------------------------------------------------------------
//
//  Rendering
//

// Handling the Vertex Coordinates and the Vertex Normal Vectors

function initBuffers() {	
	
	switch(fractal) {
		case 0 : 
			computeSierpinskiGasket();
			break;
	
		case 1 : 
			computeMengerSponge();
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

// Pay attention to transformation order !!

mvMatrix = mult( mvMatrix, translationMatrix( tx, ty, tz ) );
		 
mvMatrix = mult( mvMatrix, rotationZZMatrix( angleZZ ) );

mvMatrix = mult( mvMatrix, rotationYYMatrix( angleYY ) );

mvMatrix = mult( mvMatrix, rotationXXMatrix( angleXX ) );

mvMatrix = mult( mvMatrix, scalingMatrix( sx, sy, sz ) );
		 
// Passing the Model View Matrix to apply the current transformation

var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");

gl.uniformMatrix4fv(mvUniform, false, new Float32Array(flatten(mvMatrix)));

// Associating the data to the vertex shader

// This can be done in a better way !!

// Vertex Coordinates and Vertex Normal Vectors

initBuffers();

// Material properties

gl.uniform3fv( gl.getUniformLocation(shaderProgram, "k_ambient"), 
flatten(kAmbi) );

gl.uniform3fv( gl.getUniformLocation(shaderProgram, "k_diffuse"),
flatten(kDiff) );

gl.uniform3fv( gl.getUniformLocation(shaderProgram, "k_specular"),
flatten(kSpec) );

gl.uniform1f( gl.getUniformLocation(shaderProgram, "shininess"), 
nPhong );

// Light Sources

var numLights = lightSources.length;

gl.uniform1i( gl.getUniformLocation(shaderProgram, "numLights"), 
numLights );

//Light Sources

for(var i = 0; i < lightSources.length; i++ )
{
gl.uniform1i( gl.getUniformLocation(shaderProgram, "allLights[" + String(i) + "].isOn"),
lightSources[i].isOn );

gl.uniform4fv( gl.getUniformLocation(shaderProgram, "allLights[" + String(i) + "].position"),
flatten(lightSources[i].getPosition()) );

gl.uniform3fv( gl.getUniformLocation(shaderProgram, "allLights[" + String(i) + "].intensities"),
flatten(lightSources[i].getIntensity()) );
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
}	
else {
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
		
		// Global transformation !!
		
		globalTz = 0.0;
		
		// NEW --- The viewer is on the ZZ axis at an indefinite distance
		
		pos_Viewer[0] = pos_Viewer[1] = pos_Viewer[3] = 0.0;
		
		pos_Viewer[2] = 1.0;  
		
		// TO BE DONE !
		
		// Allow the user to control the size of the view volume
	}
	else {	

		// A standard view volume.
		
		// Viewer is at (0,0,0)
		
		// Ensure that the model is "inside" the view volume
		
		pMatrix = perspective( 45, 1, 0.05, 15 );
		
		// Global transformation !!
		
		globalTz = -2.5;

		// NEW --- The viewer is on (0,0,0)
		
		pos_Viewer[0] = pos_Viewer[1] = pos_Viewer[2] = 0.0;
		
		pos_Viewer[3] = 1.0;  
		
		// TO BE DONE !
		
		// Allow the user to control the size of the view volume
	}
	
	// Passing the Projection Matrix to apply the current projection
	
	var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	
	gl.uniformMatrix4fv(pUniform, false, new Float32Array(flatten(pMatrix)));
	
	// NEW --- Passing the viewer position to the vertex shader
	
	gl.uniform4fv( gl.getUniformLocation(shaderProgram, "viewerPosition"),
        flatten(pos_Viewer) );
	
	// GLOBAL TRANSFORMATION FOR THE WHOLE SCENE
	
	mvMatrix = translationMatrix( 0, 0, globalTz );
	
	// NEW - Updating the position of the light sources, if required
	
	// FOR EACH LIGHT SOURCE
	    
	for(var i = 0; i < lightSources.length; i++ )
	{
		// Animating the light source, if defined
		    
		var lightSourceMatrix = mat4();

		if( !lightSources[i].isOff() ) {
				
			// COMPLETE THE CODE FOR THE OTHER ROTATION AXES

			if( lightSources[i].isRotYYOn() ) 
			{
				lightSourceMatrix = mult( 
						lightSourceMatrix, 
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
	           
	// NEW - Counting the frames
	
}

//----------------------------------------------------------------------------
//
//  --- Animation
//

// Animation --- Updating transformation parameters

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
//
//  User Interaction
//

function outputInfos(){
    
}

//----------------------------------------------------------------------------

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

    if (!mouseDown) {
      
      return;
    } 
  
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

	// Dropdown list

	var projectionList = document.getElementById("projection-selection");
	
	projectionList.addEventListener("click", function(){
				
		// Getting the selection
		
		var p = projectionList.selectedIndex;
		
		switch(p){
			
			case 0 : projectionType = 0;
				break;
			
			case 1 : projectionType = 1;
				break;
		}  
	});


	// Dropdown list
	
	var list = document.getElementById("rendering-mode-selection");
	
	list.addEventListener("click", function(){
				
		// Getting the selection
		
		var mode = list.selectedIndex;
				
		switch(mode){
			
			case 0 : primitiveType = gl.TRIANGLES;
				break;
			
			case 1 : primitiveType = gl.LINE_LOOP;
				break;
			
			case 2 : primitiveType = gl.POINTS;
				break;
		}
	});
	
	var fractalList = document.getElementById("fractal-selection");
	
	fractalList.addEventListener("click", function(){
				
		// Getting the selection
		
		var mode = fractalList.selectedIndex;
				
		switch(mode){
			
			case 0 : 
				fractal = 0;
				computeSierpinskiGasket();
				break;
			
			case 1 : 
				fractal = 1;
				computeMengerSponge();
				break;
		}
		
	});   

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

		// The translation vector

		tx = 0.0;

		ty = 0.0;

		tz = 0.0;

		// The rotation angles in degrees

		angleXX = -22.5;

		angleYY = 16.0;

		angleZZ = 0.0;

		// The scaling factors

		sx = 0.5;

		sy = 0.5;

		sz = 0.5;
		
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

		kDiff = [ 0.2, 0.48, 0.72 ]; // COLOR

		initBuffers();
	};

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


		}

		initBuffers();
	}; 

	document.getElementById("reduce-recursion-button").onclick = function(){
		if (numLevels > 0){
			numLevels = numLevels-1;
			document.getElementById("num-iterations").innerHTML = numLevels;
		}
		initBuffers();
	};

	canvas.onmousedown = handleMouseDown;
    
    document.onmouseup = handleMouseUp;
    
	document.onmousemove = handleMouseMove;
	

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
}

function preventDefault(e) {
	e = e || window.event;
	if (e.preventDefault)
		e.preventDefault();
	e.returnValue = false;
}

function disableScroll() {
	if (window.addEventListener) 
		window.addEventListener('DOMMouseScroll', preventDefault, false);
	window.onwheel = preventDefault; 
	window.onmousewheel = document.onmousewheel = preventDefault; 
	window.ontouchmove  = preventDefault; 
}
  
function enableScroll() {
	if (window.removeEventListener)
		window.removeEventListener('DOMMouseScroll', preventDefault, false);
	window.onmousewheel = document.onmousewheel = null; 
	window.onwheel = null; 
	window.ontouchmove = null;  
	document.onkeydown = null;  
}

//------------ ----------------------------------------------------------------
//
// WebGL Initialization
//

function initWebGL( canvas ) {
	try {
		
		// Create the WebGL context
		
		// Some browsers still need "experimental-webgl"
		
		gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
		
		// DEFAULT: The viewport occupies the whole canvas 
		
		// DEFAULT: The viewport background color is WHITE
		
		// NEW - Drawing the triangles defining the model
		
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
	
	tick();		// NEW --- A timer controls the rendering / animation    

	outputInfos();
}

function getVertices( flag) {

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

//----------------------------------------------------------------------------
// Sierpinski Gasket Tetra
//----------------------------------------------------------------------------

function computeSierpinskiGasket() {
	
	vertices = []; 
	normals  = [];

	var [a, b, c, d] = getVertices("Tetra");

	divideSierpinskiGasket(a, b, c, d, numLevels);
	vertices = flatten(vertices);
	computeVertexNormals(vertices, normals);  
}  
 
function divideSierpinskiGasket(a, b, c, d, n) {
	
	if (n == 0) 
	{	vertices.push(a, b, c,
					  c, b, d,
					  d, b, a,
				      a, c, d);
	} 
	else 
	{	var ab = computeMidPoint(a, b);
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

//--------------------------------------------------------------------------------//
//compute Sierpinski / Menger Cube														  //
//--------------------------------------------------------------------------------//

function interpolate( u, v, s )
	{
		// No input checking!!
		
		var result = [];
		for ( var i = 0; i < u.length; ++i ) {
			result.push( (1.0 - s) * u[i] +  s * v[i] );
		}

		return result; 
	}  

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
	}
	else {

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

		// each function have the four front vertices first, \
		// and then the back vertices 

		// FRONT LEFT BOTTOM CUBE
		divideMengerSponge
		(	a,
			ab,
			interpolate(ad, bc, 1/3),
			ad, 
			ae,
			interpolate(ab, ef, 1/3),
			interpolate(interpolate(ad, bc, 1/3), interpolate(eh, fg, 1/3 ), 1/3),
			interpolate(ad, eh, 1/3),  
			n 
		);

		// FRONT CENTER BOTTOM CUBE 
		divideMengerSponge
		( 	ab,
			ba,
			interpolate(ba, cd, 1/3), 
			interpolate(ab, dc, 1/3),
			interpolate(ab, ef, 1/3),
			interpolate(ba, fe, 1/3),
			interpolate(interpolate(ba, cd, 1/3), interpolate(fe, gh, 1/3), 1/3),
			interpolate(interpolate(ab, dc, 1/3), interpolate(ef, hg, 1/3), 1/3),
			n 
		); 

		// ///////////////
		// FRONT RIGHT BOTTOM CUBE
		divideMengerSponge 
		(	ba, 
			b,
			bc, 
			interpolate(ad, bc, 2/3),
			interpolate(ba, fe, 1/3),
			bf,
			interpolate(bc, fg, 1/3),
			interpolate( interpolate(ba, cd, 1/3), interpolate(fe, gh, 1/3), 1/3),
			n 
		);

		// ///////////////
		// FRONT MID LEFT 
		divideMengerSponge
		(	ad,
			interpolate(ad, bc, 1/3),
			interpolate(da, cb, 1/3),
			da,
			interpolate(ad, eh, 1/3),
			interpolate(interpolate(ad, bc, 1/3 ), interpolate(eh, fg, 1/3), 1/3),
			interpolate(interpolate(da, cb, 1/3) , interpolate(he, gf, 1/3), 1/3),
			interpolate(da, he, 1/3),
			n
		); 

		// //////////////
		// FRONT MID RIGHT 
		divideMengerSponge 
		(	interpolate(ad, bc, 2/3),
			bc, 
			cb,
			interpolate(da, cb, 2/3),
			interpolate(interpolate(ba, cd, 1/3), interpolate(fe, gh, 1/3), 1/3), 
			interpolate(bc, fg, 1/3),  
			interpolate(cb, gf, 1/3),
			interpolate(interpolate(da, cb, 2/3), interpolate(he, gf, 2/3), 1/3),
			n
		);     

		// FRONT TOP LEFT 
		divideMengerSponge 
		(
			da, 
			interpolate(da, cb, 1/3),
			dc, 
			d,
			// back
			interpolate(da, he, 1/3),
			interpolate(interpolate(da, cb, 1/3), interpolate(he, gf, 1/3), 1/3),
			interpolate(dc, hg, 1/3),
			dh,  
			n
		);


		// FRONT TOP MID
		divideMengerSponge 
		(	// bottom top
			interpolate(da, cb, 1/3),
			interpolate(da, cb, 2/3),
			cd,  
			dc, 
			// BOTTOM  
			interpolate(interpolate(da, cb, 1/3), interpolate(he, gf, 1/3), 1/3),
			interpolate(interpolate(da, cb, 2/3), interpolate(he, gf, 2/3), 1/3),
			interpolate(cd, gh, 1/3 ),
			interpolate(dc, hg, 1/3),
			n
		);  

		// FRONT TOP RIGHT
		divideMengerSponge 
		(	//bottom 
			interpolate(da, cb, 2/3),
			cb,
			c,
			cd,
			// top  
			interpolate(interpolate(da, cb, 2/3), interpolate(he, gf, 2/3 ), 1/3 ),
			interpolate(cb, gf, 1/3 ),
	  
			cg,
			interpolate(cd, gh, 1/3 ),
			n
		);
		
		// mid top left
		
		divideMengerSponge
		(	//bottom
			interpolate(da, he, 1/3),
			interpolate(interpolate(da, cb, 1/3), interpolate( he, gf, 1/3), 1/3), 
			interpolate(dc, hg, 1/3),
			dh,
			interpolate(da, he, 2/3),
			interpolate(interpolate(da, cb, 1/3), interpolate( he, gf, 1/3), 2/3),
			interpolate(dc,  hg, 2/3 ),
			// top  
			hd, 
			n
		); 

		// mid bottom left
		divideMengerSponge
		(	// bottom
			ae, 
			interpolate(ab, ef, 1/3),
			interpolate(interpolate(ad, bc, 1/3), interpolate( eh, fg , 1/3), 1/3),
			interpolate(ad, eh, 1/3 ),
			ea,  
			interpolate(ab, ef, 2/3),
			// top 
	
			interpolate ( interpolate( ad, bc, 1/3), interpolate(eh, fg , 1/3), 2/3), 
			interpolate( ad,  eh , 2/3 ),
			n
		);     

		// mid top right 
		divideMengerSponge
		(	// top 

			interpolate(interpolate(da, cb, 2/3), interpolate(he,  gf, 2/3), 1/3 ), 
			interpolate(cb, gf, 1/3 ),
			cg, 
			interpolate(cd, gh, 1/3 ),  
			interpolate(interpolate(da, cb, 2/3 ), interpolate(he, gf, 2/3 ), 2/3 ),
			interpolate(cb, gf, 2/3 ),
			gc, 

			interpolate( cd, gh, 2/3 ),
			// bottom 


			
			n
		); 
		
		// mid bottom right 
		divideMengerSponge
		(	
			interpolate(ba, fe, 1/3), 
			bf, 
			interpolate(bc, fg, 1/3),
			interpolate(interpolate(ad, bc, 2/3 ), interpolate(eh, fg, 2/3), 1/3  ),
			interpolate(ba, fe, 2/3  ),  
			fb, 
			interpolate(bc, fg, 2/3),
			interpolate(interpolate(ad, bc, 2/3 ) ,interpolate(eh, fg, 2/3), 2/3, ), 
			
			n
		); 

		// back top left r))
		divideMengerSponge
		(	interpolate(da, he, 2/3 ),
			interpolate(interpolate(da, cb, 1/3 ), interpolate(he, gf, 1/3 ), 2/3 ),
			interpolate(dc, hg, 2/3 ), 
			hd,  
			he, 
			interpolate(he, gf, 1/3 ),
			hg , 
			h,
			n
		);

		// back top mid  
		divideMengerSponge
		(	interpolate(interpolate( da, cb, 1/3), interpolate(he, gf ,1/3 ), 2/3 ), 
			interpolate( interpolate( da, cb,2/3), interpolate(he, gf, 2/3 ), 2/3),
			interpolate( hd, gc, 2/3), 
			interpolate(hd, gc, 1/3 ), 
			interpolate(he, gf, 1/3 ),  
			interpolate(he, gf, 2/3 ),
			gh,
			hg,   
			n
		); 

		// back top right 
		divideMengerSponge 
		(	interpolate(interpolate(da, cb, 2/3), interpolate(he, gf, 2/3), 2/3),
			interpolate(cb, gf, 2/3),
			gc, 
			interpolate (cd, gh, 2/3),
			interpolate(he, gf, 2/3),
			gf, 
			g,
			gh,
			n
		);
		
		// back mid left )  / \
		divideMengerSponge
		(	// top
			interpolate(ad, eh,  2/3 ),
			interpolate(interpolate(ad, bc, 1/3 ), interpolate(eh, fg, 1/3 ), 2/3 ),
			interpolate(interpolate(da, cb, 1/3 ), interpolate(he, gf, 1/3 ), 2/3 ),
			interpolate(da, he, 2/3), 
			eh,      
			interpolate(eh, fg, 1/3 ),
			interpolate(he, gf, 1/3 ), 
			he, 
			n
		);  
		   
		// back mid right
		divideMengerSponge
		(	interpolate(interpolate(ad, bc, 2/3 ), interpolate(eh, fg,2/3), 2/3 ),
			interpolate(bc, fg, 2/3 ),
			
			interpolate(cb, gf, 2/3 ),
			interpolate(interpolate(da, cb, 2/3 ), interpolate(he, gf, 2/3 ), 2/3 ),
			interpolate(eh, fg, 2/3 ),
			fg , 
			gf,  
			interpolate(he, gf, 2/3 ), 
			n
		);
				 
		//  BACK BOTTOM LEFT 
		divideMengerSponge
		(	// bottom  ,,
			ea, 
			interpolate(ea, fb, 1/3 ),  
			interpolate(interpolate( ad, bc,   1/3  ), interpolate(eh, fg, 1/3 ), 2/3 ),
			interpolate(ad, eh, 2/3 ),
			e, 
			ef, 
			interpolate(eh, fg, 1/3 ),
			eh,
			n
		);   

		// BACK MID Bottom
		divideMengerSponge
		(	// BOTTOM
			interpolate(ea, fb, 1/3 ), 
			interpolate(ea, fb, 2/3 ), 
			interpolate(interpolate(ad, bc, 2/3 ), interpolate(eh, fg, 2/3), 2/3 ),
			interpolate(interpolate(ad, bc, 1/3 ), interpolate(eh, fg, 1/3 ), 2/3 ),
			ef, 
			fe, 
			interpolate(eh, fg, 2/3 ),
			interpolate(eh, fg, 1/3 ),
			n
		); 
		
		//  BACK LEFTRIGHT BOTTOM
		divideMengerSponge
		(	// top 
			interpolate(ea, fb, 2/3 ),  
			fb, 
			interpolate(bc, fg, 2/3 ),
			interpolate(interpolate(ad, bc, 2/3 ) , interpolate(eh, fg, 2/3), 2/3 ), 
			fe , 
			f,
			fg,
			interpolate(eh, fg, 2/3 ),
			n
		); 
	}
}   

//  			Avenged Sevenfold 1rightcenter center          
// 1   não sei, diria que tinha uns 25% deexistem muitos aspectos em que as caracteristas   