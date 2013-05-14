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
    var image = req.files.image
    
    if (!image) {
        res.send({res: false});
        return false;    
    }
    
    var fs = require('fs'),
        path = require('path');

    fs.readFile(image.path, function (err, data) {
        // asynchronously reads the entire contents of an image file
        var uploadDir = path.join(__dirname, '../', '/public/uploads/');
        
        var picId = req.param('picId');
        if(!picId) {
           picId = new Date().getTime(); 
        }
        
        var savePath = uploadDir + picId + '.png';
        fs.writeFile(savePath, data, function (err) {
            if (err) throw err;
            res.send({
                picId: picId,
                picLink: conf.domain + '/uploads/' + picId + '.png'
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

exports.monitorHandler = function(req, res) {
    var fs = require('fs'),
        path = require('path');
        
    var viewData = _getCommonViewData(), 
        uploadDir = path.join(__dirname, '../', '/public/uploads/');
            
    fs.readdir(uploadDir, function(err, files){
        viewData.files = files;
         res.render('monitor.html', viewData);
    });
    
   
}



