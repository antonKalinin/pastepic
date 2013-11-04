var io = require('socket.io').listen(server);
io.set('log level', 1);

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