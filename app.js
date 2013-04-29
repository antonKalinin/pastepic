/**
 * Module dependencies.
 */

var express = require('express')
  , index = require('./routes/index')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

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

/* simply stupid */

app.get('/', index.home);
app.post('/upload', index.uploadHandler);
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
        socket.join(picId);
        var picClients = io.sockets.clients(picId); 
        var viewersCount = picClients.length;
        /* Info all clients in room about new member. */
        io.sockets.in(picId).emit('picConnResp', {picId: picId, viewersCount: viewersCount});
         
        socket.on('disconnect', function(data){
            /* Leave the picture room then disconnected. */
            var picId = data.picId ? data.picId : false;
            if(!picId) return;
            socket.leave(picId);    
        });'
    });


});






