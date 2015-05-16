var color = require('onecolor');

var SP = require("serialport");
SerialPort = SP.SerialPort;






	var serialPort = new SerialPort("/dev/tty.usbserial-A6031R9Z", {
	  baudrate: 9600
	}, false);


	var rgbPort = new SerialPort("/dev/tty.usbmodemfd121", {
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

		var clearBuffer = new Buffer([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
		serialPort.write(clearBuffer, function(err, results) {
			if (err)
			{ console.log('err ' + err); }
		});


	    var headerPosition = [0xFF, 0xAA];
	    var headerRGB = [0xFF, 0xAA];
	    var headerSpeed = [0xFF, 0x66];


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

	var maxSpeed = 150;//100;
	var minSpeed = 20;
	var count = 0;
	var speed = .05;//.2;//.75;

	var x = 0;
	var y = 0;
	var wristStart = 12;
	var wrist = wristStart
	var dWrist = -1;

	var radius = 70;
	var theta = 0;

	var wristMax = 23;
	var wristMin = -36;


	var armRadius = 120; //(mm)



	var rotation_prev = 0;
	var height_prev = 0;
	var stretch_prev = 0;



	var phi = (Math.sqrt(5) + 1) / 2;
	var PI_2 = Math.PI * 2;

	var accuracyCoefficient = .1;//.75;



	var area = radius * radius;

	var n = Math.ceil(area * accuracyCoefficient);











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
		

		//	radius += speed;
		//	radius = Math.min(radius, 70);
		var theta, x, y;

		if (count < n)
		{
			theta = PI_2 * phi * count;
			var r_n = Math.sqrt(count / accuracyCoefficient);

			//temp
			//r_n = radius;

			x = Math.round(r_n * Math.cos(theta));
			y = Math.round(r_n * Math.sin(theta));

			wrist = wristStart;// - (20* (r_n/radius ))
		}
		count++;
		
		theta = (theta%(2*Math.PI));


		
	//	var polarX = toPolar( Math.cos(x)*r1, Math.sin(y)*r1 );
	//	var polarY = toPolar( Math.cos(y)*r2 + Math.cos(y)*Math.cos(x)*r1, 120 + Math.sin(y)*r2 + Math.sin(y)*Math.cos(x)*r1 );

		var polar = toPolar(x, 70);

		var rotation = Math.round(-90 + polar.theta*180/Math.PI); //Math.floor(-x*.28) + Math.floor(w*.28/2);//Math.floor(0 + Math.sin(x)*r);//Math.floor(180 * Math.random() - 90);
		var stretch = 80;//0 + polar.r;//-x + 50 + w;//Math.floor(210 * Math.random());
		var height = Math.round(30 + y); //Math.floor((-y + 5 + h) + (x/2)%2 * 6 - 3  ) ;
		var wrist_rotation = wrist;//Math.floor(180 * Math.random() - 90); 
		var grip = 0;
		//+ ' ' + 0xFF + '' + 0xAA 
		//var out = rotation + ' ' + stretch + ' ' + height + ' ' + wrist_rotation + ' ' + grip + '\n';


		//	if (count%2)
		//	{
		//		rotation = -25;
		//		stretch = 40;
		//		height = 15 + 0;
		//	}
		//	else
		//	{
		//		rotation = 25;
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


		var myColor = new color.HSV(theta/(Math.PI*2), 1, .5);

		var r = myColor.red()*255;// /80 //Math.floor(Math.random()*255);
		var g = myColor.green()*255;// /35 // Math.floor(Math.random()*255);
		var b = myColor.blue()*255;// /50 // Math.floor(Math.random()*255);

		console.log(r,g,b);

		var rgbOut = [
			r, g, b,
			0x00	
		];


		//	var dRot = Math.abs(rotation - rotation_prev);
		//	var dStretch = Math.abs(stretch - stretch_prev);
		//	var dHeight = Math.abs(height - height_prev);

		//var dTotal = Math.pow(Math.pow(dRot,3) + Math.pow(dStretch,3) + Math.pow(dHeight,3), 1/3);
		//var dMax = Math.max(Math.max(dRot, dStretch), dHeight);
		//	var dMax = Math.max(dHeight/heightRange, dRot/rotRange);

		//	var speedR = Math.max(minSpeed, (dHeight/heightRange) /dMax * maxSpeed);//Math.max(1, Math.ceil(dStretch/dMax * maxSpeed));
		//	var speedL = Math.max(minSpeed, (dHeight/heightRange) /dMax * maxSpeed);//Math.max(1, Math.ceil(dHeight/dMax * maxSpeed));
		//	var speedRot = Math.max(minSpeed, (dRot/rotRange) /dMax * maxSpeed);//Math.max(1, Math.ceil(dRot/dMax * maxSpeed));

		//	var speeds = [
		//		//	maxSpeed, maxSpeed, maxSpeed
		//		(maxSpeed & 0x00FF),
		//		(maxSpeed & 0x00FF),
		//		(maxSpeed*.5 & 0x00FF)
		//	];

		//	var speedsLow = [
		//		//	50, 50, 50
		//		(maxSpeed * 1 & 0x00FF),
		//		(maxSpeed * 1 & 0x00FF),
		//		(maxSpeed * 1 & 0x00FF)
		//	];

		var servoSpeed = [
			(maxSpeed & 0x00FF)
		];

		//	console.log('deltas',dStretch,dHeight,dRot,' speeds',speeds);


		rotation_prev = rotation;
		stretch_prev = stretch;
		height_prev = height;


		var positions = [
			(rotation & 0xFF00)>>8, (rotation & 0x00FF),
			(stretch & 0xFF00)>>8, (stretch & 0x00FF),
			(height & 0xFF00)>>8, (height & 0x00FF),
			(wrist_rotation & 0xFF00)>>8, (wrist_rotation & 0x00FF),
			0x00	
		];




//


		//low speed
		setTimeout(function(){
			var speedBuf = new Buffer(headerSpeed.concat(servoSpeed));
			serialPort.write(speedBuf, function(err, results) {
				if (err)
				{ console.log('err ' + err); }
			});
		}, 0);

/*
		//top speed
		setTimeout(function(){
			var speedBuf = new Buffer(headerSpeed.concat(speeds));
			serialPort.write(speedBuf, function(err, results) {
				if (err)
				{ console.log('err ' + err); }
			});
		},250);

		//low speed
		setTimeout(function(){
			var speedBuf = new Buffer(headerSpeed.concat(speedsLow));
			serialPort.write(speedBuf, function(err, results) {
				if (err)
				{ console.log('err ' + err); }
			});
		},300);
*/

		var buff = new Buffer(headerPosition.concat(positions));
		serialPort.write(buff, function(err, results) {
			if (err)
			{ console.log('err ' + err); }

			//	setTimeout(function(){
			//		var buff2 = new Buffer(headerPosition.concat(positionsXXX));
			//		serialPort.write(buff2, function(err, results) {
			//		});
			//	}, 2000);	

			setTimeout(function(){
				var rgbBuff = new Buffer(headerRGB.concat(rgbOut));
				rgbPort.write(rgbBuff, function(err, results) {
					if (err) { console.log('err ' + err); }
				});
			}, 488);


			setTimeout(function(){
				rgbPort.write(new Buffer(headerRGB.concat(rgbOutBlack)), function(err, results) {
				  if (err) { console.log('err ' + err); }
				});
			}, 490);



		
		});	

	};


	setTimeout(function(){
		//step();
		setInterval(function(){
			step();
		}, 1500);

		//	setInterval(function(){
		//		//force position report
		//	    var clearBuffer = new Buffer([0x00]);
		//		serialPort.write(clearBuffer, function(err, results) {
		//			if (err)
		//			{ console.log('err ' + err); }
		//		});
		//	}, 200);

	}, 5000);




}

});


process.stdin.resume();