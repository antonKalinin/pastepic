window.onload = function() {
    // Create a connection to server.
    // Socket is a global here. Maybe better to make it as app object property.
    socket = io.connect(app.domen);
    socket.on('connected', function (data) {
        console.log(data);
        
        /* init connetion to picture page */
        socket.emit('picConnInit', { picId: app.getPicId() });
        
        /* handle connection to picture page, response from server */
        socket.on('picConnResp', function(data) {
            console.log(data);
            chat.init();
            /* Update online pic viewers count */
            if(data.viewersCount) updateOnline(data.viewersCount);
        });
        
        socket.on('message', function (data) {
            console.log(data);
            chat.msgIn(data);
        });
    });
};

window.onbeforeunload = function (evt) {
    /* Before close the page disconnect the socket */
    socket.disconnect({ picId: app.getPicId() });
}

function logEvent(event, data) {
    console.log('Event: ' + event);
    console.log(data);
}

function updateOnline(c) {
    $('#o-count').html(c);
}

var chat = (function(){
    var container = false,
        msgInput = false;
    var newMsg = function(data) {
        var msgWrap = $('<li>'),
            name = $('<span>').addClass('name').html(data.from),
            body = $('<span>').addClass('body').html(data.text);

        msgWrap.append(name);
        msgWrap.append(body);
        return msgWrap;
    };
    return {
        init: function() {
            container = $('#chat ul');
            msgInput = $('.chat-wrap textarea');
            msgInput.keydown(function(e) {
                if (event.which == 13) {
                    event.preventDefault();
                    chat.msgOut();
                }
            });
        },
        msgIn: function(data) {
            var $msg = newMsg(data);
            container.append($msg);
        },
        msgOut: function() {
            var text = msgInput.val();
            msgInput.val('');
            socket.json.send({text: text, picId: app.getPicId()});
        }
    };
})();




