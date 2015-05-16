var sleep = require("sleep");
var SP = require("serialport");
serial = SP.SerialPort;

var defaultPorts = {};

var autoConfig = function(onComplete)
{
	SP.list(function (err, ports) {
	  ports.forEach(function(port) {
	    console.log(port.comName, port.pnpId, 'manufacturer', port.manufacturer);
	    if (port.manufacturer == 'FTDI')
	    {
	    	defaultPorts.uarm = port.comName;
	    }
	    else if (port.manufacturer == 'Arduino (www.arduino.cc)')
	    {
	    	defaultPorts.rgb = port.comName;
	    }
	  });

	  console.log(defaultPorts);
	  onComplete();
	});
}


var clearBuffer = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
var headerPosition = [0xFF, 0xAA];
var headerGetPosition = [0xFF, 0x99, 0x00];
var headerSpeed = [0xFF, 0x66];
var headerRGB = [0xFF, 0xAA];

var rgbOutBlack = [
	0,0,0,
	0x00	
];

var armRadius = 120; //(mm??)
var MIN_DISTANCE = 3;
var MIN_SPEED = 2;


var uArmPort;
var rgbPort;

var currentTarget = null;
var currentPosition = null;





var debug = false;

var speedSampleMax = 10;
var recentSpeedX = [];
var recentSpeedY = [];
var recentSpeedZ = [];
var avgSpeedX = 0;
var avgSpeedY = 0;
var avgSpeedZ = 0;

var distToTarget;

var setCurrentPosition = function(pos)
{
	var lastPosition = currentPosition;
	currentPosition = pos;

	if (lastPosition)
	{
		var dx = currentPosition[0]-lastPosition[0];
		var dy = currentPosition[1]-lastPosition[1];
		var dz = currentPosition[2]-lastPosition[2];		

		var speed = Math.sqrt(dx*dx + dy*dy + dz*dz);

		recentSpeedX.push(dx);
		recentSpeedY.push(dy);
		recentSpeedZ.push(dz);
		if (recentSpeedX.length > speedSampleMax)
		{
			recentSpeedX.shift();
			recentSpeedY.shift();
			recentSpeedZ.shift();
		}


		var totalSpeedX = 0;
		var totalSpeedY = 0;
		var totalSpeedZ = 0;
		for (var i=0, len=recentSpeedX.length; i<len; i++)
		{
			totalSpeedX += recentSpeedX[i];
			totalSpeedY += recentSpeedY[i];
			totalSpeedZ += recentSpeedZ[i];
		}

		avgSpeedX = totalSpeedX/recentSpeedX.length;
		avgSpeedY = totalSpeedY/recentSpeedY.length;
		avgSpeedZ = totalSpeedZ/recentSpeedZ.length;
	}

	if (currentTarget)
	{
		var dx = Math.abs(currentTarget[0]-currentPosition[0]);
		var dy = Math.abs(currentTarget[1]-currentPosition[1]);
		var dz = Math.abs(currentTarget[2]-currentPosition[2]);
		distToTarget = Math.sqrt(dx*dx + dy*dy + dz*dz);
	}
};

var clearSpeed = function()
{
	recentSpeedX = [];
	recentSpeedY = [];
	recentSpeedZ = [];
};


var connectArm = function(port, onOpen, onMoveComplete, onData, onError, onClose)
{
	port = port || defaultPorts['uarm'];

	uArmData = "";

	uArmPort = new serial(port, {
	  baudrate: 9600
	}, false);

	uArmPort.open(function (err) {
		if ( err ) {
			if (onError) {
				onError(err);
			}
		} else {
			uArmPort.write(clearBuffer, function(err, results) {
				if (err) {
					if (onError) {
						onError(results);
					}
				}
			});


			uArmPort.on('data', function(data) {
				uArmData += data.toString();
				//console.log('data', data.toString());

				var endIndex = uArmData.indexOf('\r\n');
				while(endIndex !== -1) {

					var cmd = uArmData.substr(0, endIndex + 1);
					uArmData = uArmData.substr(cmd.length + 1);
					endIndex = uArmData.indexOf('\r\n');
					var update = JSON.parse(cmd);

					if (onData)
					{
						onData(update);
					}

					if (onMoveComplete)
					{
						var trackingPosition;
						if (currentTarget!==null && currentPosition!==null)
						{
							trackingPosition = true;
						}

						if (update.target)
						{
							//	console.log('new target');
							currentTarget = update.target;
							clearSpeed();
						}

						if (update.position)
						{
							//	console.log('new pos');
							setCurrentPosition(update.position, trackingPosition);
							//currentPosition = update.position;
						}


						if (trackingPosition)
						{

							//console.log(dx, dy, dz, 'dist', dist);

							if (distToTarget < MIN_DISTANCE ||
								(avgSpeedX < MIN_SPEED &&
								avgSpeedY < MIN_SPEED &&
								avgSpeedZ < MIN_SPEED &&
								recentSpeedX.length==speedSampleMax )
							)
							{
								//	console.log('next! ----- ');
								currentTarget = null;
								onMoveComplete();
							}
							//	else
							//	{
							//		console.log(avgSpeedX,avgSpeedY, avgSpeedZ, distToTarget);
							//	}
						}
						else
						{
							//	console.log(currentTarget, currentPosition);
						}
					}
				}
			});


			if (onClose) {
				uArmPort.on('close', function(data) {
					onClose(data.toString());
				});
			}

			if (onOpen) {
				onOpen();
			}

			if (onMoveComplete)
			{
				setInterval(function(){
					getPosition();
				}, 50);
			}
		}
	});
};

var connectRGB = function(port, onOpen, onError, onClose)
{
	port = port || defaultPorts['rgb'];

	rgbPort = new serial(port, {
		baudrate: 9600
	}, false);

	rgbPort.open(function (err) {
		if ( err ) {
			if (onError) {
				onError(results);
			}
		} else {
		rgbPort.write(rgbOutBlack, function(err, results) {
			if (err) {
				if (onError) {
					onError(results);
				}
			}
		});

		if (onClose) {
			rgbPort.on('close', function(data) {
				onClose(data.toString());
			});
		}

		if (onOpen) {
			onOpen();
		}
	  }
	});
};

//	/onSetComplete
var setPosition = function(rotation, stretch, height, wrist) 
{
	rotation = Math.round(rotation);
	stretch = Math.round(stretch);
	height = Math.round(height);
	wrist = Math.round(wrist);

	var positions = [
		(rotation & 0xFF00)>>8, (rotation & 0x00FF),
		(stretch & 0xFF00)>>8, (stretch & 0x00FF),
		(height & 0xFF00)>>8, (height & 0x00FF),
		(wrist & 0xFF00)>>8, (wrist & 0x00FF),
		0x00	
	];

	if (debug)
	{
		console.log('set pos', rotation, stretch, height);
	}

	var buff = new Buffer(headerPosition.concat(positions).concat([0x00]));
	uArmPort.write(buff, function(err, results) {
		if (err) { console.log('setPosition ERROR: ' + err); }		
	});
};

var getPosition = function()
{
	//	console.log('getPosition');
	var buff = new Buffer(headerGetPosition);
	uArmPort.write(buff, function(err, results) {
		if (err)
		{ console.log('err ' + err); }
	});

	//	uArmPort.write(buff, function(err, results) {
	//		if (err)
	//		{ console.log('err ' + err); }
	//		console.log('wrote 2', results);
	//	});
};

var setSpeed = function(speed)
{
	var speedBuf = new Buffer(headerSpeed.concat(speed).concat([0x00]));
	uArmPort.write(speedBuf, function(err, results) {
		if (err)
		{ console.log('err ' + err); }
	});
};

var setRGB = function(r,g,b)
{
	var rgb = [r,g,b,
		0x00	
	];

	var buff = new Buffer(headerRGB.concat(rgb));

	//console.log('setRGB', buff);

	rgbPort.write(buff, function(err, results) {
		if (err)
		{ console.log('setRGB ERROR: ' + err); }		
	});	
};

var toPolar = function(x, y)
{
	y += armRadius;

	var theta1 = Math.atan2(y, x);
	if (x == 0 && y == armRadius)
	{
		theta1 = Math.PI/2;
	}

	var offsetSin = Math.sin(Math.PI/2 - theta1);
	var offsetCos = Math.cos(Math.PI/2 - theta1);

	var offsetX = armRadius * offsetSin;
	var offsetY = armRadius * offsetCos;

	if (debug)
	{
		console.log('offsetX', offsetX);
		console.log('offsetY', offsetY);
	}

	x -= offsetX;
	y -= offsetY;

	if (debug)
	{
		console.log('debug x', x);
		console.log('debug y', y);
	}

	var r = Math.sqrt(x*x + y*y);
	var theta = Math.atan2(y, x);
	if (x == 0 && y == 0)
	{
		theta = Math.PI/2;
	}	

	return {
		theta: theta,
		r: r
	}
};

var setDebug = function(bool)
{
	debug = bool;
};














//don't exit
//	process.stdin.resume();

module.exports = {
	autoConfig: 	autoConfig, 
	connectArm: 	connectArm,
	connectRGB: 	connectRGB,
	setPosition: 	setPosition,
	getPosition: 	getPosition,
	setSpeed: 	setSpeed,	
	setRGB: 		setRGB,
	toPolar: 		toPolar,
	setDebug: 		setDebug, 
};
