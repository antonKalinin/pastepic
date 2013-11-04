var auth = require('../auth.js');

/**
 * All the routes includes here
 **/

module.exports = function(app) {

    var main = require('./main'),
        sign = require('./sign'),
        admin = require('./admin');

    app.get('/', main.index);
    app.get('/:picId', main.image);

    app.post('/upload', main.upload);
    app.post('/crop', main.crop);

    app.get('/monitor', auth.ensureAdmin, admin.monitor);

    app.get('/signin', sign.in);
}