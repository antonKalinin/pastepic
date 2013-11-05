// configuration
var conf = require('../conf');

var _getCommonViewData = function() {
    return {
        domain: conf.domain,
        port: conf.port,
        picId: false
    };
    },
    _saveImageWithPreviewAsFile = function(imageBlob, picId, resp) {
        var fs = require('fs'),
            gm = require('gm'),
            path = require('path');

        var storePath = path.join(__dirname, '../', conf.storePath),
            prStorePath = path.join(__dirname, '../', conf.prStorePath),
            picPath = storePath + picId + '.png',
            picPrevPath = prStorePath + picId + '.png',
            domain = conf.domain + (!conf.production ? (':' + conf.port) : '') + '/';

        /* Save blob image, first read the file */
        /* Asynchronously reads the entire contents of an image file */
        fs.readFile(imageBlob.path, function (err, data) {
            fs.writeFile(picPath, data, function(err) {
                if (err) throw err;

                // gm picture object
                var gmPic = gm(picPath);
                // resize and save picture
                gmPic
                .resize('200')
                .write(picPrevPath, function(err) {
                    if (err) throw err;
                });

                var pic = {
                    id: picId,
                    link: domain + picId,
                    src: '/' + conf.storeDir + '/' + picId + '.png'
                };

                // get picture properties
                gmPic.identify(function (err, data) {
                    if (err) throw err;

                    pic['size'] = data.size;
                    resp.send(pic);
                });

            });
        });
    },
    _writeUaLog = function(req) {
        var uap = require('ua-parser'),
            fs = require('fs'),
            path = require('path'),
            logFilePath = path.join(__dirname, '../', 'ualog.json');


        fs.readFile(logFilePath, function(err, data) {
            if (err) throw err;
            var log = JSON.parse(data),
                ua = req.headers['user-agent'],
                r = uap.parse(ua);

            var osLogged = false,
                uaLogged = false;

            if (log.os.length > 0) {
                for (var i = 0,l = log.os.length; i < l; i++) {
                    if (log.os[i] == r.os.family) {
                        osLogged = true;
                        break;
                    }
                }
            }

            if (log.ua.length > 0) {
                for (var i = 0,l = log.ua.length; i < l; i++) {
                    if (log.ua[i] == r.ua.family) {
                        uaLogged = true;
                        break;
                    }
                }
            }

            if (!osLogged) log.os.push(r.os.family);
            if (!uaLogged) log.ua.push(r.ua.family);

            if(!osLogged || !uaLogged) {
                fs.writeFile(logFilePath, JSON.stringify(log));
            }
        });
    };

exports.index = function(req, res) {
    _writeUaLog(req);
    var viewData = _getCommonViewData();
    viewData.imageSrc = false;
    viewData.renderTools = true;
    res.render('index.html', viewData)
};

exports.image = function(req, res) {
    // TODO: increment image view stats
    var picInsert = require('../models/pic.js').Insert;
    var viewData = _getCommonViewData();
    var picId = req.route.params.picId;

    viewData.picSrc = conf.storeDir + '/' + picId + '.png';
    viewData.picId = picId;
    viewData.picLink = conf.domain + (!conf.production ? (':' + conf.port) : '') + '/' + viewData.picId;

    picInsert.findOne({_id: picId}, function(err, pic) {
        if (err) {
            console.log(err);
            return;
        }

        viewData.picDate = pic.getDate();
        res.render('index.html', viewData);
    });


};

exports.upload = function(req, res) {
    var imageBlob = req.files.imageBlob;
    if (!imageBlob) {
        res.send({res: false});
        return false;    
    }
    
    var uap = require('ua-parser'),
        In = require('../models/pic.js').Insert,
        clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        ua = req.headers['user-agent'],
        r = uap.parse(ua);

    var clientProps = {
        browser: In.getBrowserId(r.ua.family),
        os: In.getOsId(r.os.family),
        ip: clientIp.split('.', 4)
    };

    var insert = new In(clientProps);
    insert.save( function (err) {
        if (err) {
            console.log(err);
            return false;
        }
        // save full image and preview on drive
        // send response to client
        try {
            _saveImageWithPreviewAsFile(imageBlob, insert._id, res);
        } catch(err) {
            console.log(err);
        }
    });
};

/**
 * Special for Konstantin Dmitriev
 *
 * @param req
 * @param res
 */
exports.crop = function(req, res) {
    var fs = require('fs'),
        path = require('path'),
        gm = require('gm');

    var picId = req.param('picId'),
        w = req.param('width'),
        h = req.param('height'),
        x = req.param('left'),
        y = req.param('top');

    var storePath = path.join(__dirname, '../', conf.storePath),
        picPath = storePath + picId + '.png';

    gm(picPath)
        .crop(w, h, x, y)
        .write(picPath, function(err) {
            if (err) {
                console.log(err);
                res.send({res: false});
            }
            res.send({res: true});
        });
}



