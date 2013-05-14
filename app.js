/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , swig = require('swig')
  , conf = require('./conf')
  , cons = require('consolidate')
  , index = require('./routes/index');

var app = express();
console.log(conf.port);

app.set('port', conf.port);
app.set('views', __dirname + '/views');
app.engine('.html', cons.swig);
app.set('view engine', 'html');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

swig.init({
    root: __dirname + '/views' ,
    allowErrors: true // allows errors to be thrown and caught by express instead of suppressed by Swig
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/* creating a server */
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var io = require('socket.io').listen(server);
io.set('log level', 1);

/* simply stupid: opened admin login and pass */

var auth = express.basicAuth(function(user, pass) {
 return user === 'simply' && pass === 'stupid';
});

app.get('/', index.index);
app.post('/upload', index.uploadHandler);
app.post('/monitor', auth, index.monitorHandler);
app.get('/:picId', function(req, res) {
    index.imageHandler(req, res);
});



io.configure(function () { 
  io.set("transports", ["xhr-polling"]); 
  io.set("polling duration", 10); 
});

io.sockets.on('connection', function (socket) {
    var ID = (socket.id).toString().substr(0, 5);
    var time = (new Date).toLocaleTimeString();
    var params = {
        'name': ID,
        'time': time,
    };

    socket.emit('connected', params);

    /*
     * The way is to send from client a message witch contain a picture id.
     * In response to this message user get the number of online picture viewers.
     */

    socket.on('picConnInit', function(data){
        /*
         * Add this socket to room with same picture id.
         * Info other sockets in the room about new picture viewer.
         * Count the number of online viewers.
         */
        var picId = data.picId ? data.picId : false;
        if(!picId) return;
        /* 
         * Check if client already in room.
         * If not, join the room.
         */

        var picClients = io.sockets.clients(picId);
        socket.join(picId);

        var viewersCount = picClients.length;
        /* Info all clients in room about new member. */
        io.sockets.in(picId).emit('picConnResp', {picId: picId, viewersCount: viewersCount});
        
        socket.on('message', function(data){
            /* Leave the picture room then disconnected. */
            var picId = data.picId ? data.picId : false;
            if(!picId) return;
            var time = (new Date).toLocaleTimeString();
            var name = (socket.id).toString().substr(0, 5);

            socket.emit('msgSent', {picId: picId, status: 1});
            io.sockets.in(picId).json.send({text: data.text, from: name, time: time});
        });
         
        socket.on('disconnect', function(data){
            /* Leave the picture room then disconnected. */
            var picId = data.picId ? data.picId : false;
            if(!picId) return;
            socket.leave(picId); 
            var viewersCount = io.sockets.clients(picId).length;
            io.sockets.in(picId).emit('userOut', {picId: picId, viewersCount: viewersCount});
        });
    });


});






