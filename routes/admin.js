/* Route to monitor uploaded pictures */
exports.monitor = function(req, res) {
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