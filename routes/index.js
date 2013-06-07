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
    var imageBlob = req.files.imageBlob;
    
    if (!imageBlob) {
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
        savePath = uploadDir + picId + '.png';
        
    /* Save blob image, first read the file */    
    /* Asynchronously reads the entire contents of an image file */
    fs.readFile(imageBlob.path, function (err, data) {
        fs.writeFile(savePath, data, function(err) {
            if (err) throw err;
            
            // make a preview of uploaded picture        
            var prevParams = {  
                srcPath: savePath,
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
                picLink: conf.domain + '/' + picId,
                picSrc: conf.domain + '/uploads/' + picId + '.png'
            };

            try {
                im.identify(savePath, function(err, features){
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
            } catch (err) {
                console.log(err);
            }

        }); 
    });
};

exports.imageHandler = function(req, res) {
    var viewData = _getCommonViewData();
    var picId = req.route.params.picId;
    viewData.picSrc = 'uploads/' + picId + '.png';
    viewData.picId = picId;
    viewData.picLink = conf.domain + (conf.port != '8000' ? (':' + conf.port) : '') + '/' + viewData.picId;
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



