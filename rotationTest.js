var sylvester = require('sylvester');


        var axis = sylvester.Vector.create([0.7, 1, 0.3]);
        var rot = sylvester.Matrix.Rotation(Math.PI*.5, axis);
        var axis_origin = sylvester.Vector.create([90, 0, 20]);

        var dot = sylvester.Vector.create([100, 50, 150]);

        console.log('pre dot: ', (dot), dot.toUnitVector());
        console.log('post dot:', rot.x(dot), rot.x(dot).toUnitVector() );
        console.log('--')
        console.log('post dot:', rot.x(dot.subtract(axis_origin)).add(axis_origin), rot.x(dot.subtract(axis_origin)).add(axis_origin).toUnitVector() );

//Plane.create(anchor, v1 [, v2]) 
//plane1.eql(plane2	)