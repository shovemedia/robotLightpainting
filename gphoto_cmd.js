


var captureShot = function(i)
{



	//	var exec = require('child_process').exec;
	//	exec('gphoto2 --set-config eosremoterelease=Immediate --wait-event=2s --set-config eosremoterelease="Release Full" --keep --filename camera/'+i+'.%C --wait-event-and-download=3s', function (error, stdout, stderr) {



	var spawn = require('child_process').spawn;
	var child = spawn('gphoto2', ['--set-config', 'eosremoterelease=Immediate', '--wait-event=1s', '--set-config', 'eosremoterelease=Release Full', '--keep', '--filename', 'camera/'+i+'.%C', '--wait-event-and-download=9']);
		//['--set-config', 'eosremoterelease=Immediate', '--wait-event=2s', '--set-config', 'eosremoterelease="Release Full"', '--keep', '--filename camera/'+i+'.%C', '--wait-event-and-download=3s']);
	  
		child.stdout.on('data', function (data) {
		  //	console.log('stdout: ' + data);
		});

		child.stderr.on('data', function (data) {
		  console.log('stderr: ' + data);
		});

		child.on('close', function (code) {
			//	console.log('child process exited with code ' + code);
		    next();
		});



};

var next = function()
{
	i++;
	if (i<=len)
	{
		captureShot(i);
	}
	else 
	{
		process.exit();
	}
};

var i=0;
var len=30;

next();


process.stdin.resume();