window.onload = function() {
    // Create a connection to server. In chrome use long polling somewhy! (TODO: get know why)
    if (navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
        socket = io.connect('http://localhost:8080', {'transports': ['xhr-polling']});
    } else {
        socket = io.connect('http://localhost:8080');
    }
    socket.on('connect', function () {
        
        /* init connetion to picture page */
        socket.emit('picConnInit', { picId: app.getPicId() });
        
        /* handle connection to picture page response from server */
        socket.on('picConnReps', function(data) {
            console.log(data);
        });

        socket.on('message', function (data) {
            console.log(data);
        });
    });
};

function logEvent(event, data) {
    console.log('Event: ' + event);
    console.log(data);
}

function updateOnline(c) {
    $('#o-count').html(c);
}




