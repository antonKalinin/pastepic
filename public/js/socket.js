var eventsHandlers = {
    connected: function(data) {
        logEvent('connected', data);
        updateOnline(data.onlineCount);
    },
    userIn: function(data) {
        logEvent('userIn', data);
        updateOnline(data.onlineCount);
    },
    userOut: function(data) {
        logEvent('userOut', data);
        updateOnline(data.onlineCount);
    }
}

window.onload = function() {
    // Создаем соединение с сервером; websockets почему-то в Хроме не работают, используем xhr
    if (navigator.userAgent.toLowerCase().indexOf('chrome') != -1) {
        socket = io.connect('http://localhost:8080', {'transports': ['xhr-polling']});
    } else {
        socket = io.connect('http://localhost:8080');
    }
    socket.on('connect', function () {

        socket.on('message', function (data) {
            console.log(data);
        });

        /* initialize event handlers */
        for (var event in eventsHandlers) {
            socket.on(event, eventsHandlers[event]);
        }

    });
};

function logEvent(event, data) {
    console.log('Event: ' + event);
    console.log(data);
}

function updateOnline(c) {
    $('#o-count').html(c);
}




