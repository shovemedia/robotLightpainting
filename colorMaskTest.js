var color = require('onecolor');

var c = [140, 140, 0, 255];

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

var c1 = getMaskedColor(c, 0xFF0000);
var c2 = getMaskedColor(c, 0xEE0000);
var c3 = getMaskedColor(c, 0x330000);

console.log(c1);
console.log(c2);
console.log(c3);
//	console.log( c1.red() * 255 );
//	console.log( c1.green() * 255 );
//	console.log( c1.blue() * 255 );