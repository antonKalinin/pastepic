window.onload = function() {
    // Create a connection to server.
    // Socket is a global here. Maybe better to make it as app object property.
    socket = io.connect('http://fronteeth.com:8080');
    socket.on('connect', function (data) {
        console.log(data);
        
        /* init connetion to picture page */
        socket.emit('picConnInit', { picId: app.getPicId() });
        
        /* handle connection to picture page, response from server */
        socket.on('picConnResp', function(data) {
            console.log(data);
            /* Update online pic viewers count */
            if(data.viewersCount) updateOnline(data.viewersCount);
        });

        socket.on('message', function (data) {
            console.log(data);
        });
    });
};

window.onbeforeunload = function (evt) {
    /* Before close the page disconnect the socket */
    socket.disconnect();
}

function logEvent(event, data) {
    console.log('Event: ' + event);
    console.log(data);
}

function updateOnline(c) {
    $('#o-count').html(c);
}




