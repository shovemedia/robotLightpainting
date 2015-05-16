var gphoto2 = require('gphoto2');
var GPhoto = new gphoto2.GPhoto2();
var fs = require('fs');

//killall PTPCamera


// List cameras / assign list item to variable to use below options
GPhoto.list(function (list) {
  if (list.length === 0) return;
  var camera = list[0];
  console.log('Found', camera.model);



  // get configuration tree
  camera.getConfig(function (er, settings) {
    //  console.log('settings', JSON.stringify(settings));

    //  console.log('settings', settings.main.children.status);

//'capturetarget' to sdcard  Memory card

    camera.setConfigValue('capturetarget', 'Memory card', function (err) {
      console.log('ERR mem card', err);

      console.log('--');
    });


    camera.setConfigValue('shutterspeed', 'bulb', function (err) {
      console.log('ERR shutterspeed', err);

      console.log('--');

      //  camera.setConfigValue('bulb', 1, function (err) {
      //    console.log('ERR bulb', err);

      //    console.log('--');


          camera.setConfigValue('eosremoterelease', 'Immediate', function (err, foo) {
            console.log('ERR on', err, foo);


    // Take picture with camera object obtained from list()
    //  camera.takePicture({download: true}, function (err, data) {

    //    console.log('err', err)

    //    fs.writeFileSync(__dirname + '/picture.jpg', data);
    //  });          

            setTimeout (function(){
              //Release Full
              //None
              camera.setConfigValue('eosremoterelease', 'Release Full', function (err, bar) {
                console.log('ERR off', err, bar);

                //  camera.getCameraFile();

    //  console.log('first:', list[0]);
                setTimeout (function(){
                            //  camera.takePicture({download: true}, function (err, data) {
                            //    console.log('err saving:', err);
                            //    fs.writeFileSync(__dirname + '/picture.jpg', data);
                            //  });

                    camera.downloadPicture({
                        //  cameraPath: '/store_00010001/DCIM/100EOS7D/IMG_0687.JPG',
                        targetPath: '/tmp/capt0000.jpg'
                    }, function (err, tmpname) {

                      console.log('er saving:', err, tmpname)
                      fs.renameSync(tmpname, __dirname + '/capt0000.jpg');
                    });
                
                }, 3*1000);

                //  camera.takePicture({
                //    targetPath: '/tmp/foo.XXXXXX'
                //  }, function (err, tmpname) {
                //    console.log('err saving:', err, tmpname);
                //    fs.renameSync(tmpname, __dirname + '/camera/picture.jpg');
                //  });


                //  setTimeout (function(){
                //    camera.downloadPicture({
                //        cameraPath: '/store_00010001/DCIM/100EOS7D/IMG_0687.JPG',
                //        targetPath: '/tmp/capt0000.jpg'
                //    }, function (err, tmpname) {

                //      console.log('er saving:', err, tmpname)
                //      fs.renameSync(tmpname, __dirname + '/capt0000.jpg');
                //    });
                //  }, 3*1000);

              });
            }, 3*1000);

          });



      //  });

    });

  });





//gphoto2 --set-config eosremoterelease=Immediate --wait-event=1s --set-config eosremoterelease=Off --force-overwrite --capture-image-and-download



/*
  // Set configuration values
  camera.setConfigValue('capturetarget', 1, function (er) {
    //...
  });

  // Take picture with camera object obtained from list()
  camera.takePicture({download: true}, function (er, data) {
    fs.writeFileSync(__dirname + '/picture.jpg', data);
  });

  // Take picture without downloading immediately
  camera.takePicture({download: false}, function (er, path) {
    console.log(path);
  });

  // Take picture and download it to filesystem
  camera.takePicture({
    targetPath: '/tmp/foo.XXXXXX'
  }, function (er, tmpname) {
    fs.renameSync(tmpname, __dirname + '/picture.jpg');
  });

  // Download a picture from camera
  camera.downloadPicture({
    cameraPath: '/store_00020001/DCIM/100CANON/IMG_1231.JPG',
    targetPath: '/tmp/foo.XXXXXX'
  }, function (er, tmpname) {
    fs.renameSync(tmpname, __dirname + '/picture.jpg');
  });

  // Get preview picture (from AF Sensor, fails silently if unsupported)
  camera.takePicture({
    preview: true,
    targetPath: '/tmp/foo.XXXXXX'
  }, function (er, tmpname) {
    fs.renameSync(tmpname, __dirname + '/picture.jpg');
  });
*/  
});