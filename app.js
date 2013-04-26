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

app.get('/', index.home);
app.post('/upload', index.uploadHandler);
/* simply stupid */
app.get('/:imageId', function(req, res) {
    index.imageHandler(req, res);
    setPicId(req, res);
});

/* creating a server */

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var picId = false;
function setPicId(req, res){
    picId = req.route.params.imageId;
    console.log(picId);
};

var onlineCount = 0;
var io = require('socket.io').listen(server);
var picSockets = {};

// Отключаем вывод полного лога - пригодится в production'е
io.set('log level', 1);

// Навешиваем обработчик на подключение нового клиента
io.sockets.on('connection', function (socket) {
    var ID = (socket.id).toString().substr(0, 5);
    var time = (new Date).toLocaleTimeString();
    onlineCount++;
    socket.emit('connected', {'name': ID, 'time': time, 'onlineCount': onlineCount, 'picId': picId});
    socket.broadcast.emit('userIn', {'name': ID, 'time': time, 'onlineCount': onlineCount});

    /* push socket to  */
    if (picId) {
        var key = 'pic' + picId;
        if (!picSockets[key]) {
            picSockets[key] = {};
        }
        picSockets[key][socket.id] = socket;

        var picOnlineCount = 0;
        /* Count sockets in stack */
        for(var pSocketId in picSockets[key]) {
            if (picSockets[key].hasOwnProperty(pSocketId)) picOnlineCount++;
        }
        /*  */
        for(var pSocketId in picSockets[key]) {
            picSockets[key][pSocketId].emit('picUserIn',  {'name': ID, 'time': time, 'picOnlineCount': picOnlineCount})
        }
    }

    socket.on('message', function (msg) {
        var time = (new Date).toLocaleTimeString();
        socket.json.send({'event': 'messageSent', 'name': ID, 'text': msg, 'time': time});
        socket.broadcast.json.send({'event': 'messageReceived', 'name': ID, 'text': msg, 'time': time})
    });
    socket.on('disconnect', function() {
        onlineCount--;
        var time = (new Date).toLocaleTimeString();
        io.sockets.emit('userOut', {'name': ID, 'time': time, 'onlineCount': onlineCount});

        if (picId) {
            var key = 'pic' + picId;
        }
    });
});


