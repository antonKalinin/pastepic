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
};

var picId = false;

exports.home = function(req, res) {
    var viewData = _getCommonViewData();
    picId = false;
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

exports.imageHandler = function(req, res, io) {
    var viewData = _getCommonViewData();
    picId = req.route.params.imageId;

    initSockets(io);

    viewData.imageSrc = '/uploads/' + picId + '.png';
    res.render('home', viewData);
};


/* pool of open sockets according to pictures */
var picSockets = {};

function initSockets(io) {
    io.sockets.on('connection', function (socket) {
        if(!picId) return false;

        var ID = (socket.id).toString().substr(0, 5);
        var time = (new Date).toLocaleTimeString();
        var params = {
            'name': ID,
            'time': time,
            'picId': picId
        };

        socket.emit('connected', params);

        var key = 'pic' + picId;
        if (!picSockets[key]) {
            picSockets[key] = {};
        }
        picSockets[key][socket.id] = socket;

        var onlineCount = 0;
        /* Count sockets in stack */
        for(var pSocketId in picSockets[key]) {
            if (picSockets[key].hasOwnProperty(pSocketId)) onlineCount++;
        }

        params.onlineCount = onlineCount;
        for(var pSocketId in picSockets[key]) {
            picSockets[key][pSocketId].emit('userIn',  params)
        }

        socket.on('disconnect', function() {
            var time = (new Date).toLocaleTimeString();
            var key = 'pic' + picId;
            if (picSockets[key].hasOwnProperty(pSocketId)) {
                onlineCount--;
                delete picSockets[key];
            }

            io.sockets.emit('userOut', {'name': ID, 'time': time, 'onlineCount': onlineCount});
        });
    });
}

