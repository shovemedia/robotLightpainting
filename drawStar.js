

var color = require('onecolor');
var sleep = require('sleep');
var SP = require("serialport");
SerialPort = SP.SerialPort;

	    var headerPosition = [0xFF, 0xAA];
	    var headerGetPosition = [0xFF, 0x99];
	    var headerRGB = [0xFF, 0xAA];
	    var headerSpeed = [0xFF, 0x66];

var lastPositions;

//	/dev/tty.usbserial-A6031W7I
	var serialPort = new SerialPort("/dev/tty.usbserial-A6031W7I", {
	  baudrate: 9600
	}, false);


	var rgbPort = new SerialPort("/dev/tty.usbmodemfd131", {
	  baudrate: 9600
	}, false);


	rgbPort.open(function (error) {
	  if ( error ) {
	    console.log('failed to open: ' + error);
	  } else {
	    console.log('open rgb');
	  }
	});

	var debug = true;



	serialPort.open(function (error) {
	  if ( error ) {
	    console.log('failed to open: ' + error);
	  } else {
	    console.log('open uArm');

		var servoSpeeds = [
			//	130, 130, 130
			(maxSpeed & 0x00FF)
		];

		var speedBuf = new Buffer(headerSpeed.concat(servoSpeeds));
		serialPort.write(speedBuf, function(err, results) {
			if (err)
			{ console.log('err ' + err); }
			
		});


		//	var clearBuffer = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
		//	serialPort.write(clearBuffer, function(err, results) {
		//		if (err)
		//		{ console.log('err ' + err); }
		//	});





	    serialPort.on('data', function(data) {
	      console.log('data received: ', data.toString());
	    });


	    serialPort.on('close', function(data) {
	      console.log('CLOSED: ' + data);
	    });



		var rgbOutBlack = [
			0,0,0,
			0x00	
		];


//	var stretchRange = 210;
	var heightRange = 1000;//330;	
	var rotRange = 180;

	var maxSpeed = 10;//100;
	var count = 0;
	var speed = .15;//.2;//.75;

	var x = 0;
	var y = 0;

	var points = 5;

	var wrist = 5;

	var radius = 0;
	var theta = 0;

	var wristMax = 23;
	var wristMin = -36;


	var armRadius = 120; //(mm)



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

	var step = function()
	{
		count+=Math.floor(points/2) - 4;

		var pt = count%(points);

		radius = 100;

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

		x = Math.cos(theta)*radius;
		y = Math.sin(theta)*radius;

		
	//	var polarX = toPolar( Math.cos(x)*r1, Math.sin(y)*r1 );
	//	var polarY = toPolar( Math.cos(y)*r2 + Math.cos(y)*Math.cos(x)*r1, 120 + Math.sin(y)*r2 + Math.sin(y)*Math.cos(x)*r1 );

		var polar = toPolar(x, 70);

		var rotation = Math.round(-90 + polar.theta*180/Math.PI); //Math.floor(-x*.28) + Math.floor(w*.28/2);//Math.floor(0 + Math.sin(x)*r);//Math.floor(180 * Math.random() - 90);
		var stretch = 0 + polar.r;//-x + 50 + w;//Math.floor(210 * Math.random());
		var height = Math.round(50 + y); //Math.floor((-y + 5 + h) + (x/2)%2 * 6 - 3  ) ;
		var wrist_rotation = wrist;//Math.floor(180 * Math.random() - 90); 
		var grip = 0;
		//+ ' ' + 0xFF + '' + 0xAA 
		//var out = rotation + ' ' + stretch + ' ' + height + ' ' + wrist_rotation + ' ' + grip + '\n';


		//	if (count%2)
		//	{
		//		rotation = -30;
		//		stretch = 80;
		//		height = 15 + 0;
		//	}
		//	else
		//	{
		//		rotation = 30;
		//		stretch = 80;
		//		height = 15 + 100;
		//	}

		//	rotation = Math.floor(Math.random()*30 -15);
		//	stretch = Math.floor(Math.random()*50);
		//	height = Math.floor(Math.random()*50 + 15);
		



		if (debug)
		{
			//	console.log('polarY.theta', polarY.theta);
			console.log('rotation:', rotation);
			console.log(' stretch:', stretch);
			console.log('  height:', height);
			console.log('   wrist:', wrist);
		}	


		var myColor = new color.HSV(0, 0, 1);
		//new color.HSV(theta/(Math.PI*2), 1, .25);

		var r = myColor.red()*255;// /80 //Math.floor(Math.random()*255);
		var g = myColor.green()*255;// /35 // Math.floor(Math.random()*255);
		var b = myColor.blue()*255;// /50 // Math.floor(Math.random()*255);

		console.log(r,g,b);

		var rgbOut = [
			r, g, b,
			0x00	
		];



		

		var positions = [
			(rotation & 0xFF00)>>8, (rotation & 0x00FF),
			(stretch & 0xFF00)>>8, (stretch & 0x00FF),
			(height & 0xFF00)>>8, (height & 0x00FF),
			(wrist_rotation & 0xFF00)>>8, (wrist_rotation & 0x00FF),
			0x00	
		];


//




		var buff = new Buffer(headerPosition.concat(positions));
		serialPort.write(buff, function(err, results) {
			if (err)
			{ console.log('err ' + err); }

/*
			setTimeout(function(){
				rgbPort.write(new Buffer(headerRGB.concat(rgbOutBlack)), function(err, results) {
				  if (err) { console.log('err ' + err); }
				});
			}, 5);
*/


		
		});	


		lastPositions = positions;

	};


	setTimeout(function(){
		//step();



		var positionsTaken = 0; 
		var moveInterval = setInterval(function(){
			
			if (positionsTaken < 5) 
			{
				step();
				positionsTaken++;
			}
			else
			{
				console.log('----Track----');
				console.log('lastPositions', lastPositions);

				setInterval(function(){
					var buff = new Buffer(headerGetPosition);
					serialPort.write(buff, function(err, results) {
						if (err)
						{ console.log('err ' + err); }			
					});	

				}, 200);


				clearInterval(moveInterval);
			}

		}, 200);




		//	setInterval(function(){
		//		//force position report
		//	    var clearBuffer = new Buffer([0x00]);
		//		serialPort.write(clearBuffer, function(err, results) {
		//			if (err)
		//			{ console.log('err ' + err); }
		//		});
		//	}, 200);

	}, 3000);




}

});


process.stdin.resume();