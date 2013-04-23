exports.home = function(req, res) {
    res.render('home', {title: 'Pic.Talk'})
};

exports.uploadHandler = function(req, res) {
    console.log('Upload started...');
    var image = req.files.image
    
    if (!image) {
        res.send({res: false});
        return false;    
    }
    
    var vs = require('fs');
    fs.readFile(image.path, function (err, data) {
        // asynchronously reads the entire contents of an image file
        var newPath = __dirname + "/uploads/" + new Date().getTime();
        fs.writeFile(newPath, data, function (err) {
            var ajaxResp = {
                res: true,
                imagePath: newPath
            }
            res.send(ajaxResp);
        });
    });
    res.send('ok');
};
