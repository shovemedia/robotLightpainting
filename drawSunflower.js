var uArm = require('uArm'),
	camera = require('camera'),
	fs = require('fs'),
	color = require('onecolor'),
	Q = require('q'),
    PNG = require('pngjs').PNG;
// CONFIG
var portConfig =  {} ;// JSON.parse(fs.readFileSync('portConfig.json', 'utf8'));
var file = 'sunflowers.png';

var speed = 150;
var wrist = 4;
var scale = 1.2;
var msPerPoint = 50;

var redBrightness = 255;
var greenBrightness = 255;
var blueBrightness = 255;


var vogelData = JSON.parse(fs.readFileSync('vogelUnsorted.json', 'utf8'));


var data;
var w;
var h;
var midW;
var midH;

var positionCount = 0;


var generateDrawData = function() {

	console.log('parsed');

    data = this.data;
    w = this.width;
    h = this.height;
    midW = w/2;
    midH = h/2;

    generatePoints();

    console.log(imgData);


};

var getColorArray = function(colorObject)
{
	//	var colorArray = [];
	var r = Math.round(colorObject.red   * 255);
	var g = Math.round(colorObject.green * 255);
	var b = Math.round(colorObject.blue  * 255);
	return {r:r, g:g, b:b};
};

var generatePoints = function ()
{
	for (var i=0, len=vogelData.length; i<len; i++)
	{
		var pt = vogelData[i];
		var x = Math.floor(pt.x + midW);
		var y = Math.floor(pt.y + midH);

		if (x>0 && y>0 && x<w && y<h)
		{			
			imgData.push({'pos': {x:x, y:y}});
			imgData.push({'wait': 100});

			var c = getColorInImage(x, y);
			imgData.push({'color': {r:c.red()*redBrightness, g:c.green()*greenBrightness, b:c.blue()*blueBrightness}});	
			imgData.push({'wait': msPerPoint});
			imgData.push({'color': {r:0, g:0, b:0}});

			positionCount++;
		}
	}

	console.log('positionCount', positionCount);
};

var getColorInImage = function(x, y)
{
	var idx = (Math.round(y)*w + Math.round(x)) << 2;

	var colorData = [data[idx], data[idx+1], data[idx+2], 255];

	return color(colorData);
};

var imgData = [];

imgData.push({'color': {r:0, g:0, b:0}});

console.log(imgData);




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

	//console.log('step', cmd);

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
		//console.log('step pos');

		var pt = cmd.pos;
		var x = pt.x * scale;
		var y = pt.y * scale;

		var polar = uArm.toPolar(x, 70);

		var rotation = Math.round(-90 + polar.theta*180/Math.PI);
		var stretch = 0 + polar.r;
		var height = Math.round(150 + -y);
		
		console.log('positionCount', --positionCount);


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