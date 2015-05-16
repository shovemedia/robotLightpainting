var uArm = require('uArm'),
	camera = require('camera'),
	paper = require('paper'),
	fs = require('fs'),
	color = require('onecolor'),
	Q = require('q'),
    PNG = require('pngjs').PNG;

// CONFIG
var portConfig =  {} ;// JSON.parse(fs.readFileSync('portConfig.json', 'utf8'));
var file = 'mona.png';

var everyNPoints = 1;
var MIN_DIST = 1;//3;
var speed = 150;
var wrist = 10;
var scale = 1;


var r_rows = [];
var g_rows = [];
var b_rows = [];

var r_theta = -15;
var g_theta = 45;
var b_theta = -75;

var redBrightness = 255;
var greenBrightness = 255;
var blueBrightness = 255;




var scope = paper.setup();
scope.activate();
var project = scope.project;


var data;
var w;
var h;
var midW;
var midH;


var generateDrawData = function() {

	console.log('parsed');

    data = this.data;
    w = this.width;
    h = this.height;
    midW = w/2;
    midH = h/2;

    generateChannelPaths();

    //	console.log(imgData);
};

var generateChannelPaths = function()
{
	generateRows(r_theta, r_rows);
	generateRows(g_theta, g_rows);
	generateRows(b_theta, b_rows);

	paintPaths(r_rows, 0xFF0000);
	paintPaths(g_rows, 0x00FF00);
	paintPaths(b_rows, 0x0000FF);
};

var generateRows = function(theta, rows)
{
	var r = new scope.Path.Rectangle(1,1, w-2, h-2);
	r.rotate(theta);

	var min = r.bounds.x - 5;
	var max = r.bounds.x + r.bounds.width + 5;

	var group = new scope.Group();

	for (var i=r.bounds.y, len=r.bounds.height; i<len; i+=everyNPoints)
	{
		var line = new scope.Path.Line(new scope.Point(min, i), new scope.Point(max, i));

		var intersections = line.getIntersections(r);
		if (intersections.length == 2)
		{	
			//console.log(intersections.length);
			var segment = new scope.Path.Line(intersections[0].point, intersections[1].point);
			group.addChild(segment);
		}
		
	}

	group.rotate(-theta, new scope.Point(w/2, h/2));

	for (var j=0, len=group.children.length; j<len; j+=everyNPoints)
	{
		var line = group.children[j].segments;
		var p1 = line[0].point;
		var p2 = line[1].point;

		var p3 = new scope.Point(p1.x, p1.y);
		var p4 = new scope.Point(p2.x, p2.y);

		rows.push(new scope.Path.Line(p3, p4));
		//console.log('p1', p3, 'p2', p4);//.point, group.children[j].segments[1].point);
	}
};

var paintPaths = function(paths, colorMask)
{
	//console.log('paintPaths', colorMask, w, h, data.length);

	for (var i=0,len=paths.length; i<len; i++)
	{
		var path = paths[i];
		strokePath(path, colorMask);
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

var strokePath = function (obj, colorMask)
{
	var length = obj.length;
	for (var i=0, len=length/MIN_DIST; i<len; i++)
	{
		var pos = obj.getLocationAt(i*MIN_DIST).point;
		if (i==0)
		{
			imgData.push({'color': {r:0, g:0, b:0}});
		}
		else
		{
			//imgData.push({'color': getColorArray(obj.style.fillColor)});
			var c = getMaskedColor(getColorInImage(pos.x, pos.y), colorMask);
			imgData.push({'color': {r:c.red()*redBrightness, g:c.green()*greenBrightness, b:c.blue()*blueBrightness}});
		}
		imgData.push({'pos': pos});
	}

	imgData.push({'pos': obj.getLocationAt(length).point});
};

var getMaskedColor = function(c, colorMask)
{
	var c1 = color(c);

	var c2 = (parseInt(c1.hex().substr(1), 16) & colorMask).toString(16);

	while (c2.length<6)
	{
		c2 = '0'+c2;
	}

	return color(c2);
};

var getColorInImage = function(x, y)
{
	var idx = (Math.round(y)*w + Math.round(x)) << 2;

	var colorData = [data[idx], data[idx+1], data[idx+2], 255];
	console.log(x, y, colorData);
	return colorData;
};


var imgData = [];






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
		var x = pt.x * scale;
		var y = pt.y * scale;

		var polar = uArm.toPolar(x-midW, 70);

		var rotation = Math.round(-90 + polar.theta*180/Math.PI);
		var stretch = 0 + polar.r;
		var height = Math.round(130 + -y);
		

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

fs.createReadStream(__dirname + '/' + file)
    .pipe(new PNG({
        filterType: 4
    }))
    .on('parsed', generateDrawData);














var camera = require('camera');

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
	uArm.setDebug(true);
	uArm.connectArm(portConfig.uarm, onOpen, onMoveComplete, onData, onError, onClose);
	uArm.connectRGB(portConfig.rgb, function(){
		console.log('connect RGB');
		setTimeout(function(){
			deferredRGBConnect.resolve(true);
		}, 3000);

	});
});

/*
*/


process.stdin.resume();