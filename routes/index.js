var conf = require('../conf');

var _getCommonViewData = function() {
    return {
        domain: conf.domain,
        port: conf.port,
        picId: false,
        mac: process.platform == 'darwin'
    };
};

exports.index = function(req, res) {
    var viewData = _getCommonViewData();
    viewData.imageSrc = false;
    res.render('index.html', viewData)
};

exports.uploadHandler = function(req, res) {
    var imageBlob = req.files.imageBlob,
        imageBase64 = req.files.imageBase64;
    
    if (!imageBlob || !imageBase64) {
        res.send({res: false});
        return false;    
    }
    
    var fs = require('fs'),
        path = require('path'),
        im = require('imagemagick');  
    
    var picId = req.param('picId');
    if (!picId) picId = new Date().getTime(); 
    
    var uploadDir = path.join(__dirname, '../', '/public/uploads/'),
        previewDir = uploadDir + 'previews/',
        savePathOrig = uploadDir + picId + '_orig.png',
        savePathB64 = uploadDir + picId + '_b64.png';
        
    /* Simple save base64 string to as file */
    fs.writeFile(savePathB64, imageBase64, 'base64', function(err) {
        if (err) throw err;
    });
        
    /* Save blob image, first read the file */    
    /* Asynchronously reads the entire contents of an image file */
    fs.readFile(imageBlob.path, function (err, data) {
        fs.writeFile(savePathOrig, data, function(err) {
            if (err) throw err;
            
            // make a preview of uploaded picture        
            var prevParams = {  
                srcPath: savePathOrig,
                srcFormat: 'png',
                dstPath: previewDir + 'pr' + picId + '.png',
                format: 'png',
                width: 200
            };
            
            im.resize(prevParams, function(err, stdout, stderr){
                if (err) throw err;
            });
            
            var response = {
                picId: picId,
                picLink: conf.domain + '/uploads/' + picId + '.png'
            };
            
            im.identify(savePathOrig, function(err, features){
              if (err) throw err;
              // { format: '', width: int, height: int, depth: int}
              response.picParams = {
                  format: features.format,
                  width: features.width,
                  height: features.height,
                  filesize: features.filesize
              };
              res.send(response);
            });

        }); 
    });
};

exports.imageHandler = function(req, res) {
    var viewData = _getCommonViewData();
    var picId = req.route.params.picId;
    viewData.imageSrc = 'uploads/' + picId + '.png';
    viewData.picId = picId;
    viewData.picLink = conf.domain + viewData.imageSrc;
    res.render('index.html', viewData);
};

/* Route to monitor uploaded pictures */
exports.monitorHandler = function(req, res) {
    var fs = require('fs'),
        path = require('path');
        
    var viewData = _getCommonViewData(), 
        filesDir = path.join(__dirname, '../', '/public/uploads/previews/');
            
    fs.readdir(filesDir, function(err, files){
        viewData.files = files;
        viewData.filesCount = files.length;
        res.render('monitor.html', viewData);
    });
}



