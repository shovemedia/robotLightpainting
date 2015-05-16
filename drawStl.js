var uArm = require('uArm'),
	camera = require('camera'),
	sylvester = require('sylvester'),
	stljs = require('stljs'),
	dotobj = require('dot-obj'),
	fs = require('fs'),
	color = require('onecolor'),
	Q = require('q'),
	Dictionary = require('Dictionary');

var portConfig =  {};
//JSON.parse(fs.readFileSync('portConfig.json', 'utf8'));
// {};


var defaultColor = {r:255, g:255, b:255};
var MIN_DIST = .2;//3;
var speed = 150;
var wrist = 12;
var scale = 7;

var percentSpin = Number(process.argv[2]);

console.log(percentSpin);

var axis = sylvester.Vector.create([.1, .3, 1]).toUnitVector();
var rotationMatrix = sylvester.Matrix.Rotation(percentSpin*2*Math.PI, axis);
var rotationOrigin = sylvester.Vector.create([0, 0, 0]);



function arrays_equal(a,b) { return !!a && !!b && !(a<b || b<a); }

var foundCount = 0;
var edges = [];
var polygonsByEdges = new Dictionary();

var imgData = [];


//OBJ
/*
var file = 'cube.obj';
var obj = fs.readFileSync(file, 'utf8');
var data = dotobj(obj);
console.log(data)
console.log(data[0].normals[0]);
for (var i = 0; i<data[0].cells.length; i++)
{
	console.log(data[0].cells[i]);
}
*/


var isCoplanar = function(p1, p2)
{
	var n1 = p1.normal;
	var n2 = p2.normal;

	if (n1.length != n2.length)
	{
		return false;
	}

	for (var i = 0; i < n1.length; ++i) {
    	if (n1[i] !== n2[i]) return false;
  	}
	
	return true;
};


stljs.readFile('cube.stl', 
function(err, solid, name){
	//	console.log('solid', solid, name);
	console.log('edges', edges);
	forEachEdge(edges, stroke);

	
}, 
function(err, polygon, name){
	//console.log('polygon', polygon);
	var verticies = polygon.verticies;
	
	for (var i=0, lenV=verticies.length; i<lenV; i++)
	{
		var foundSharedEdge = false;
		var v0 = verticies[i];
		var v1 = verticies[(i+1) % lenV];

		var edge = [v0, v1].sort();

		//console.log(edges.length);

		//Shared edge check
		for (var j=0,len=edges.length; j<len; j++)
		{
			var searchEdge = edges[j];
			if (arrays_equal(edge, searchEdge))
			{
				// console.log('found',++foundCount)
				foundSharedEdge = true;

				if (isCoplanar(polygon, polygonsByEdges.get(searchEdge)))
				{
					//delete it
					edges.splice(j, 1);
				}

				break;
			}			
		}

		if (!foundSharedEdge)
		{
			edges.push(edge);
			polygonsByEdges.set(edge, polygon);
		}
	}
});

var forEachEdge = function(edges, fn)
{
	for (var i=0, len=edges.length; i<len; i++)
	{
		var edge = edges[i];
		fn(edge);
	}
};

var stroke = function (edge)
{
	var lengths = getLengths(edge);

	//	console.log('lengths', lengths);

	var length = lengths.length;
	for (var i=0, len=length/MIN_DIST; i<len; i++)
	{
		if (i==0)
		{
			imgData.push({'color': {r:0, g:0, b:0}});
			imgData.push({'wait': 50});
		}
		else if (i==1)
		{
			//	console.log(obj.style);
			imgData.push({'color': defaultColor});
			imgData.push({'wait': 25});
		}

		var percent = i/len;
		imgData.push({'pos': rotationTransform(
			
			{
				x: edge[0][0] + percent*lengths.dx,
				y: edge[0][1] + percent*lengths.dy,
				z: edge[0][2] + percent*lengths.dz
			}
			,rotationMatrix
			,rotationOrigin)
		});

		if (i==1)
		{
			imgData.push({'wait': 200});
		}
	}
	imgData.push({'pos': rotationTransform(
		{
			x:edge[1][0],
			y:edge[1][1],
			z:edge[1][2]
		}
		,rotationMatrix
		,rotationOrigin)
	});

};

var getLengths = function(edge)
{
	//	console.log('edge', edge);

	var dx = edge[1][0] - edge[0][0];
	var dy = edge[1][1] - edge[0][1];
	var dz = edge[1][2] - edge[0][2];
	var length = Math.sqrt(dx*dx + dy*dy + dz*dz);

	return {
		dx:dx,
		dy:dy,
		dz:dz,
		length:length
	}
};

var rotationTransform = function(pt, rotationMatrix, rotationOrigin)
{
    var dot = sylvester.Vector.create([pt.x, pt.y, pt.z]);

	var resultVector = rotationMatrix.x(dot.subtract(rotationOrigin)).add(rotationOrigin);
	return {'x':resultVector.e(1), 'y':resultVector.e(2), 'z':resultVector.e(3)};
};




var onOpen = function()
{
	console.log('arm connected');

	setTimeout(function(){
		uArm.setSpeed(speed);
		deferredArmConnect.resolve(true);
	}, 3000);
};

var onMoveComplete = function()
{
	++movesComplete;

	console.log('moves', moves, 'complete', movesComplete);
	step();
}

var onData = function(data)
{
	//console.log(data);
};
var onError = function(data)
{
	console.log('ERR:', data);
};
var onClose = onError;



var moves = 0;
var movesComplete = 0;


var step = function()
{
	var cmd = imgData.shift();

		console.log('step', cmd);

	if (cmd == undefined)
	{
		console.log('shot end');
		camera.bulbEnd(shotProcess);

		//process.exit();
		return;
	}

	if (cmd.wait)
	{
		setTimeout(function(){
			step();
		}, cmd.wait);
	}
	else if (cmd.pos)
	{
		console.log('step pos');
		var pt = cmd.pos;
		var x = pt.x*scale;
		var y = pt.y*scale;
		var z = pt.z*scale;

		var polar = uArm.toPolar(x, 50 + y);

		var rotation = Math.round(-90 + polar.theta*180/Math.PI);
		var stretch = 0 + polar.r;
		var height = Math.round(80 + -z);

		moves++;
		uArm.setPosition(rotation, stretch, height, wrist);
	}
	else if (cmd.color)
	{
		console.log('step Color', cmd.color);
		uArm.setRGB(cmd.color.r, cmd.color.g, cmd.color.b);
		step();
	}
	else
	{
		console.log('bad command!');
	}
};













var onShotComplete = function()
{
	console.log('done');
	process.exit();
};

var list = function(done)
{
	console.log('camera list');
	camera.list(done);
};

var shotProcess;

var startShot = function()
{
	console.log('startShot');

	shotProcess = camera.bulbStart(onShotComplete);

	step();
};








var deferredArmConnect = Q.defer();
var deferredRGBConnect = Q.defer();
var deferredCameraConnect = Q.defer();

Q.all([
	deferredArmConnect.promise,
	deferredRGBConnect.promise,
	deferredCameraConnect.promise
]).then(function(x){
	console.log('x', x);
	startShot();
})
.done();


/**/
camera.init(function(){
	console.log('camera init');
	list(function(){
		deferredCameraConnect.resolve(true);
	});
});


uArm.autoConfig(function(){
	//uArm.setDebug(true);
	uArm.connectArm(portConfig.uarm, onOpen, onMoveComplete, onData, onError, onClose);
	uArm.connectRGB(portConfig.rgb, function(){
		console.log('connect RGB');
		setTimeout(function(){
			uArm.setRGB(125,25,0);
			deferredRGBConnect.resolve(true);
		}, 3000);

	});
});
/*
*/


process.stdin.resume();