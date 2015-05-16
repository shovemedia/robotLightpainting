var uArm = require('uArm'),
	camera = require('camera'),
	paper = require('paper'),
	sylvester = require('sylvester'),
	fs = require('fs'),
	Q = require('q'),
	color = require('onecolor');

// CONFIG
var portConfig =  {} ;// JSON.parse(fs.readFileSync('portConfig.json', 'utf8'));
var file = 'map.svg';
var MIN_DIST = 3;//3;
var speed = 150;
var wrist = 13;
var scale = .5;
var r = 40;

var axis = sylvester.Vector.create([0, 0, 1]);
var rotationMatrix = sylvester.Matrix.Rotation(-.5*Math.PI, axis);
var rotationOrigin = sylvester.Vector.create([0, 0, 0]);


var svg = fs.readFileSync(file, 'utf8');

var scope = paper.setup();
scope.activate();
var project = scope.project;


project.importSVG(svg);

var layer = project.activeLayer;





var forEachChildPath = function(obj, fn)
{
	for (var i=0, len=obj.children.length; i<len; i++)
	{
		var child = obj.children[i];
		if (child.children)
		{
			forEachChildPath(child, fn);
		}
		else
		{
			fn(child);
		}
	}
};

var getColorArray = function(colorObject)
{
	//	var colorArray = [];
	var r = Math.round(colorObject.red   * 255);
	var g = Math.round(colorObject.green * 255);
	var b = Math.round(colorObject.blue  * 255);
	return {r:r, g:g, b:b};
};

var stroke = function (obj)
{
	var length = obj.length;
	for (var i=0, len=length/MIN_DIST; i<len; i++)
	{
		if (i==0)
		{
			imgData.push({'color': {r:0, g:0, b:0}});
		}
		else if (i==1)
		{
			//	console.log(obj.style);
			imgData.push({'color': getColorArray(obj.style.strokeColor)});
		}
		imgData.push({'pos': rotationTransform(polarTransform(obj.getLocationAt(i*MIN_DIST).point), rotationMatrix, rotationOrigin) });
	}
	imgData.push({'pos': rotationTransform(polarTransform(obj.getLocationAt(length).point),  rotationMatrix, rotationOrigin) });
};

var polarTransform = function(pt)
{
	var lat = Math.PI * pt.y/bounds.height;
	var lon = 2*Math.PI * pt.x/bounds.width;
	polarPt = {
		x: Math.sin(lon) * Math.cos(lat) * r,
		y: Math.cos(lon) * Math.cos(lat) * r,
		z: Math.sin(lat) * r
	}
	return polarPt;
};

var rotationTransform = function(pt, rotationMatrix, rotationOrigin)
{
    var dot = sylvester.Vector.create([pt.x, pt.y, pt.z]);

	var resultVector = rotationMatrix.x(dot.subtract(rotationOrigin)).add(rotationOrigin);
	return {'x':resultVector.e(1), 'y':resultVector.e(2), 'z':resultVector.e(3)};
};

var imgData = [];

//center
layer.children[0].position = new paper.Point(0,0);

var bounds = layer.bounds
//console.log(layer.bounds);


forEachChildPath(layer, stroke);
imgData.push({'color': {r:0, g:0, b:0}});

//console.log(imgData);




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
		var x = pt.x;
		var y = pt.y;
		var z = pt.z;

		var polar = uArm.toPolar(x, 50 + y);

		var rotation = Math.round(-90 + polar.theta*180/Math.PI);
		var stretch = 50 + polar.r;
		var height = Math.round(80 + -z);

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

/**/
uArm.autoConfig(function(){
	//uArm.setDebug(true);
	uArm.connectArm(portConfig.uarm, onOpen, onMoveComplete, onData, onError, onClose);
	uArm.connectRGB(portConfig.rgb, function(){
		console.log('connect RGB');
		setTimeout(function(){
			deferredRGBConnect.resolve(true);
		}, 3000);

	});
});



process.stdin.resume();