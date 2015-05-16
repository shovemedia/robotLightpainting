var paper = require('paper');
var scope = paper.setup();
scope.activate();


// Generate raw Vogel Data


var spiralWidth = 3;
var radius = 100;

var accuracyCoefficient = .3;
var decimalPlaces = 3;



var phi = (Math.sqrt(5) + 1) / 2;
var PI_2 = Math.PI * 2;



var roundingFactor = Math.pow(10, decimalPlaces);
var area = radius * radius;

var theta, x, y;

var rawData = [];
var len = Math.ceil(area * accuracyCoefficient);
for (var i=0; i<len; i++)
{	
	theta = PI_2 * phi * i;
	var r_n = Math.sqrt(i / accuracyCoefficient);

	x = Math.round(r_n * Math.cos(theta) * roundingFactor) / roundingFactor;
	y = Math.round(r_n * Math.sin(theta) * roundingFactor) / roundingFactor;
	
	rawData.push(new scope.Point(x, y));
}

console.log('rawData', rawData);
return;

// Generate Archimedes Spiral

var archimedesSpiralPoints = [];



var coils = (radius) / spiralWidth;

// value of theta corresponding to end of last coil
var thetaMax = coils * 2 * Math.PI;

// How far to step away from center for each side.
var awayStep = radius / thetaMax;

// distance between points to plot
var chord = spiralWidth/Math.PI;

var cX = 0;
var cY = 0;

archimedesSpiralPoints.push({x:cX, y:cY});

// For every side, step around and away from center.
// start at the angle corresponding to a distance of chord
// away from centre.
for ( var theta = chord / awayStep; theta <= thetaMax; ) {

    // How far away from center
    var r = awayStep * theta;

    // Convert 'around' and 'away' to X and Y.
    var x = cX + Math.cos ( theta ) * r;
    var y = cY + Math.sin ( theta ) * r;
    
	archimedesSpiralPoints.push(new scope.Point(x, y));

    // to a first approximation, the points are on a circle
    // so the angle between them is chord/radius
    theta += chord / r;
}
//console.log('archimedesSpiralPoints', archimedesSpiralPoints.length);



var sortedPoints = [];

// "sort" Vogel data by adding as it intersects walked spiral
var hitTestRange = new scope.Path.Circle(new scope.Point(0,0), spiralWidth/1.5);
hitTestRange.fillColor = new scope.Color(1, 0, 0);

for (var i=0, len=archimedesSpiralPoints.length; i<len; i++)
{
	var spiralPoint = archimedesSpiralPoints[i];

	//console.log(spiralPoint);

	hitTestRange.position = spiralPoint;

	for (var j=rawData.length-1; j>=0; j--)
	{
		var vogelPt = rawData[j];

		if (hitTestRange.hitTest(vogelPt))
		{
			sortedPoints.push(vogelPt);
			rawData.splice(j, 1);

			console.log(vogelPt);
		}
	}
	
}

//console.log('remaining', rawData.length);
//console.log('sorted', sortedPoints.length);

//	console.log(rawData);

//console.log(rawData);
