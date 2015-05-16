var camera = {
	init: function(callback)
	{
		var spawn = require('child_process').spawn;
		//'--filename', 'camera/'+id+'.%C',
		var child = spawn('killall', ['PTPCamera']);
		  
		child.stdout.on('data', function (data) {
		  	//	console.log('stdout: ' + data);
		});

		child.stderr.on('data', function (data) {
		  //console.log('stderr: ' + data);
		});

		child.on('close', function (code) {
			console.log('close');
			if(callback) callback();
		});

		return child;
	},


	start: function(onComplete)
	{
		console.log('start');
		var spawn = require('child_process').spawn;
		//'--filename', 'camera/'+id+'.%C',
		var child = spawn('gphoto2', ['--set-config', 'eosremoterelease=Immediate', '--wait-event-and-download=10000s']);
			//['--set-config', 'eosremoterelease=Immediate', '--wait-event=2s', '--set-config', 'eosremoterelease="Release Full"', '--keep', '--filename camera/'+i+'.%C', '--wait-event-and-download=3s']);

		child.stdout.on('data', function (data) {
		  	//console.log('start stdout: ' + data);
		});

		child.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

		child.on('close', function (code) {
			//console.log('child process exited with code ' + code);
			console.log('start bulb process ended...');
			onComplete();
		});

		return child;
	},

	bulbStart: function(onComplete)
	{
		console.log('bulb start');
		var self = this;
		var child = self.start(function(){
			setTimeout(function(){
				self.getLast(function(filenum){
					self.download(filenum, onComplete);
				});
			},3000);
		});

		return child;
	},

	bulbEnd: function(child)
	{	
		child.kill('SIGINT');
	},

	getLast: function(callback)
	{
		console.log('getLast');
		var spawn = require('child_process').spawn;
		//'--filename', 'camera/'+id+'.%C',
		var child1 = spawn('gphoto2', ['--list-files']);
		var child2 = spawn('grep', ['image/jpeg']);

		child1.stdout.on('data', function (data) {
		  	//	console.log('stdout: ' + data);
		  	child2.stdin.write(data);
		});

		child1.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

		child1.on('close', function (code) {
			//console.log('child process exited with code ' + code);
		    child2.stdin.end();
		});

		var cols;
		child2.stdout.on('data', function (data) {
		  var str = data.toString(), lines = str.split('#');//(/\r?\n/);
		  var last = lines[lines.length-1];			    
		  cols = last.split(/[ ,]+/);
		  
		});

		child2.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

		child2.on('close', function (code) {
			//console.log('child2 process exited with code ' + code);
			//console.log('cols', cols);
		    callback(cols[0]);
		});
	},


	download: function(filenum, callback)
	{
		console.log('download', filenum);
		var spawn = require('child_process').spawn;
		//'--filename', 'camera/'+id+'.%C',
		var child = spawn('gphoto2', ['--get-file', filenum , '--keep', '--filename', './camera/%f.%C', '--wait-event-and-download=9']);
			//['--set-config', 'eosremoterelease=Immediate', '--wait-event=2s', '--set-config', 'eosremoterelease="Release Full"', '--keep', '--filename camera/'+i+'.%C', '--wait-event-and-download=3s']);
		  
		child.stdout.on('data', function (data) {
		  		console.log('stdout: ' + data);
		});

		child.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

		child.on('close', function (code) {
				console.log('child download process exited with code ' + code);
		    callback();
		});
	},

	//	capture: function(duration, callback)
	//	{
	//		var spawn = require('child_process').spawn;
	//		//'--filename', 'camera/'+id+'.%C',
	//		var child = spawn('gphoto2', ['--set-config', 'eosremoterelease=Immediate', '--wait-event=' + duration + 's', '--set-config', 'eosremoterelease=Release Full', '--keep', '--filename', 'camera/%f.%C', '--wait-event-and-download=9']);
	//			//['--set-config', 'eosremoterelease=Immediate', '--wait-event=2s', '--set-config', 'eosremoterelease="Release Full"', '--keep', '--filename camera/'+i+'.%C', '--wait-event-and-download=3s']);
		  
	//		child.stdout.on('data', function (data) {
	//		  	//	console.log('stdout: ' + data);
	//		});

	//		child.stderr.on('data', function (data) {
	//		  console.log('stderr: ' + data);
	//		});

	//		child.on('close', function (code) {
	//			//	console.log('child process exited with code ' + code);
	//		    callback();
	//		});
	//	},

	downloadLast: function(onComplete)
	{
		self.getLast(function(filenum){
			self.download(filenum, onComplete);
		});
	},

	list: function(callback)
	{
		//gphoto2 --list-files --new

		var result = '';

		var spawn = require('child_process').spawn;
		//'--filename', 'camera/'+id+'.%C',
		var child = spawn('gphoto2', ['--list-files']);
		  
		child.stdout.on('data', function (data) {
		  	//console.log('stdout: ' + data);
		  	result += data.toString();
		});

		child.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

		child.on('close', function (code) {
			//	console.log('child process exited with code ' + code);
		    callback(result);
		});
	}
};

module.exports = camera;