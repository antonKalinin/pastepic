// Enable profiling
require('look').start(8031, '127.0.0.1')

var express = require('express')
    , swig = require('swig')
    , http = require('http')
    , path = require('path')
    , conf = require('./conf.js')
    , passport = require('passport')
    , mongoose = require('mongoose');

var app = express();

// all environments
app.set('port', process.env.PORT || conf.port);

// configure view
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.set('view cache', false);
app.engine('html', swig.renderFile);

app.set('db-uri', 'mongodb://127.0.0.1/pastepic')
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: 'seriously'}));
app.use(express.methodOverride());
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// connection to mongoose
var db = mongoose.connect(app.get('db-uri'));

// include all routes after Fbody parser
require('./routes')(app);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

/* creating a server */
var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});






