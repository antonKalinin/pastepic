var _getCommonViewData = function() {
    return {
        development: true,
        items: {
            Homer: "Bart, with $10,000, we'd be millionaires! We could buy all kinds of useful things like...love!",
            Bart: "I didn't do it, nobody saw me do it, there's no way you can prove anything!",
            Liza: "It chose to destroy itself rather than lie with us. You can't help but feel a little rejected.",
            Nelson: "Haa-ha"
        }
    };
}

exports.home = function(req, res) {

    var viewData = _getCommonViewData()
    viewData.imageSrc = false;

    res.render('home', viewData)
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
        var imgId = new Date().getTime();
        var savePath = uploadDir + imgId + '.png';
        fs.writeFile(savePath, data, function (err) {
            if (err) throw err;
            res.send({imgId: imgId});
        });
    });
};

exports.imageHandler = function(req, res) {
    console.log(req);

    var viewData = _getCommonViewData();
    viewData.imageSrc = '/uploads/' + req.route.params.imageId + '.png';

    res.render('home', viewData)
};