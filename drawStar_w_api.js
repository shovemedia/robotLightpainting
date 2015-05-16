var uArm = require('uArm'),
	fs = require('fs'),
	color = require('onecolor');

var portConfig = JSON.parse(fs.readFileSync('portConfig.json', 'utf8'));

var count = 0;
var points = 5;
var radius = 50;

var wrist = 15;

var onOpen = function()
{
	console.log('arm connected');

	setTimeout(function(){
		step();
	}, 3000);
};

var onMoveComplete = function()
{
	step()
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
	count+=Math.floor(points/2) - 4;

	var pt = count%(points);

	if (pt == 0)
	{
		theta = 0;
	}
	else
	{
		theta = pt * (2*Math.PI)/points;
	}

	theta -= .75 * (2*Math.PI)/points;

	console.log('pt', pt, 'theta', theta);

	var x = Math.cos(theta)*radius;
	var y = Math.sin(theta)*radius;

	
//	var polarX = toPolar( Math.cos(x)*r1, Math.sin(y)*r1 );
//	var polarY = toPolar( Math.cos(y)*r2 + Math.cos(y)*Math.cos(x)*r1, 120 + Math.sin(y)*r2 + Math.sin(y)*Math.cos(x)*r1 );

	var polar = uArm.toPolar(x, 70);

	var rotation = Math.round(-90 + polar.theta*180/Math.PI); //Math.floor(-x*.28) + Math.floor(w*.28/2);//Math.floor(0 + Math.sin(x)*r);//Math.floor(180 * Math.random() - 90);
	var stretch = 0 + polar.r;//-x + 50 + w;//Math.floor(210 * Math.random());
	var height = Math.round(30 + y); //Math.floor((-y + 5 + h) + (x/2)%2 * 6 - 3  ) ;
	

	uArm.setPosition(rotation, stretch, height, wrist);

	var myColor = new color.HSV(0, 0, 1);
	//new color.HSV(theta/(Math.PI*2), 1, .25);

	var r = myColor.red()*255;// /80 //Math.floor(Math.random()*255);
	var g = myColor.green()*255;// /35 // Math.floor(Math.random()*255);
	var b = myColor.blue()*255;// /50 // Math.floor(Math.random()*255);

	uArm.setRGB(r,g,b);
};

uArm.connectArm(portConfig.uarm, onOpen, onMoveComplete, onData, onError, onClose);
uArm.connectRGB(portConfig.rgb);