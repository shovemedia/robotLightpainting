var paper = require('paper');
var scope = paper.setup();
scope.activate();

var w = 100;
var h = 60;

var r_rows = [];
var g_rows = [];
var b_rows = [];

var r_theta = -15;
var g_theta = 45;
var b_theta = -75;


var generateRows = function(theta, rows)
{
	var r = new scope.Path.Rectangle(0,0, w, h);
	r.rotate(theta);

	var min = r.bounds.x - 5;
	var max = r.bounds.x + r.bounds.width + 5;

	var group = new scope.Group();

	for (var i=r.bounds.y, len=r.bounds.height; i<len; i++)
	{
		var line = new scope.Path.Line(new scope.Point(min, i), new scope.Point(max, i));

		var intersections = line.getIntersections(r);
		if (intersections.length == 2)
		{	
			//console.log(intersections.length);
			var segment = new scope.Path.Line(intersections[0].point, intersections[1].point);
			group.addChild(segment);
		}
	}

	group.rotate(-theta);

	for (var j=0, len=group.children.length; j<len; j++)
	{
		var line = group.children[j].segments;
		var p1 = line[0].point;
		var p2 = line[1].point;

		var p3 = new scope.Point(p1.x, p1.y);
		var p4 = new scope.Point(p2.x, p2.y);

		rows.push([p3, p4]);
		//	console.log('p1', p3, 'p2', p4);//.point, group.children[j].segments[1].point);
	}
}

generateRows(r_theta, r_rows);
generateRows(g_theta, g_rows);
generateRows(b_theta, b_rows);

//	console.log('segment', segment.segments[0].point.x, segment.segments[0].point.y);
//	console.log('segment', segment.segments[1].point.x, segment.segments[1].point.y);

