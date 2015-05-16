var camera = require('camera');

var onComplete = function()
{
	console.log('done');
	process.exit();
};

var list = function(done)
{
	console.log('list');
	camera.list(done);
};

var child;

var start = function(existing)
{
	//console.log('existing', existing);

	child = camera.bulbStart(onComplete);

	setTimeout(function(){
		camera.bulbEnd(child);
	}, 5 * 1000);
};

camera.init(function(){
	list(start);
});





process.stdin.resume();