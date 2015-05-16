var uArm = require('uArm'),
	camera = require('camera'),
	Q = require('q'),
	paper = require('paper'),
	fs = require('fs'),
	color = require('onecolor');

// CONFIG
var portConfig =  {} ;// JSON.parse(fs.readFileSync('portConfig.json', 'utf8'));
var file = 'nyc.svg';//bangbang.svg';
var MIN_DIST = 20;//3;
var speed = 150;
var wrist = 2;
var scale = .5;


var svg = fs.readFileSync(file, 'utf8');

var scope = paper.setup();
scope.activate();
var project = scope.project;


var bang = project.importSVG(svg);
//console.log(bang);

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
			imgData.push({'color': getColorArray(obj.style.fillColor)});
		}
		imgData.push({'pos': obj.getLocationAt(i*MIN_DIST).point});
	}
	imgData.push({'pos': obj.getLocationAt(length).point});
};

var imgData = [];

layer.children[0].position = new paper.Point(0,0);
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
		var x = pt.x*scale;
		var y = pt.y*scale;
		//var z = pt.z*scale;

		var polar = uArm.toPolar(x, 70);

		var rotation = Math.round(-90 + polar.theta*180/Math.PI);
		var stretch = 0 + polar.r;
		var height = Math.round(80 + -y);
		

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
			uArm.setRGB(255,255,255);
			deferredRGBConnect.resolve(true);
		}, 3000);

	});
});
/*
*/


process.stdin.resume();