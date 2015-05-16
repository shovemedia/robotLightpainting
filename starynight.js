var SP = require("serialport");
SerialPort = SP.SerialPort;


var fs = require('fs'),
    PNG = require('pngjs').PNG;

var everyNthFrame = 2;    

fs.createReadStream(__dirname + '/stary_night.png')
    .pipe(new PNG({
        filterType: 4
    }))
    .on('parsed', function() {

    	console.log('parsed');

    var data = this.data;
    var w = this.width;
    var h = this.height;


	var x = 0;
	var y = 0;

	var delay;







	var serialPort = new SerialPort("/dev/tty.usbserial-A6031W7I", {
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

	    var header = [0xFF, 0xAA];


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




	var speed = .2;//.75;

	var x = 0;
	var y = 0;


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






var idx = (w * y + x) << 2;





	//	var polarX = toPolar( Math.cos(x)*r1, Math.sin(y)*r1 );
	//	var polarY = toPolar( Math.cos(y)*r2 + Math.cos(y)*Math.cos(x)*r1, 120 + Math.sin(y)*r2 + Math.sin(y)*Math.cos(x)*r1 );

		var rotation = Math.floor(-x*.28) + Math.floor(w*.28/2);//Math.floor(0 + Math.sin(x)*r);//Math.floor(180 * Math.random() - 90);
		var stretch = 80;//-x + 50 + w;//Math.floor(210 * Math.random());
		var height = Math.floor((-y + 5 + h) + (x/2)%2 * 6 - 3  ) ;
		var wrist_rotation = 0;//Math.floor(180 * Math.random() - 90); 
		var grip = 0;
		//+ ' ' + 0xFF + '' + 0xAA 
		//var out = rotation + ' ' + stretch + ' ' + height + ' ' + wrist_rotation + ' ' + grip + '\n';

		if (debug)
		{
			//	console.log('polarY.theta', polarY.theta);
			console.log('rotation:', rotation);
			console.log(' stretch:', stretch);
			console.log('  height:', height);
		}	




		var r = Math.floor(data[idx + 0] /3);// /80 //Math.floor(Math.random()*255);
		var g = Math.floor(data[idx + 1] /3);// /35 // Math.floor(Math.random()*255);
		var b = Math.floor(data[idx + 2] /3);// /50 // Math.floor(Math.random()*255);

		var rgbOut = [
			r, g, b,
			0x00	
		];





		var out = [
			(rotation & 0xFF00)>>8, (rotation & 0x00FF),
			(stretch & 0xFF00)>>8, (stretch & 0x00FF),
			(height & 0xFF00)>>8, (height & 0x00FF),
			(wrist_rotation & 0xFF00)>>8, (wrist_rotation & 0x00FF),
			0x00	
		];

		var buff = new Buffer(header.concat(out));



		serialPort.write(buff, function(err, results) {
			if (err)
			{ console.log('err ' + err); }


			var rgbBuff = new Buffer(header.concat(rgbOut));
			rgbPort.write(rgbBuff, function(err, results) {
				//	if (debug)
				//	{ console.log('rgb:', r, g, b); }	
				if (err) { console.log('err ' + err); }
			});

			setTimeout(function(){
				rgbPort.write(new Buffer(header.concat(rgbOutBlack)), function(err, results) {
				  if (err) { console.log('err ' + err); }
				});
			}, 5);

			setTimeout(function(){

				x+=everyNthFrame;

				if (x > w)
				{
					x = 0;
					y+=everyNthFrame;
					delay = 500
				}
				else
				{
					delay = 30
				}

				if (y> h)
				{
					process.exit(code=0);
				}

				step();
			}, delay);
		
		});	

	};


		setTimeout(function(){
			step();
		}, 8000);


	  }
	});

});


process.stdin.resume();