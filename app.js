var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var passport = require('passport');
var util = require('util');
var BearerStrategy = require('passport-http-bearer').Strategy;
                    
var routes = require('./routes/index');
var accounts = require('./routes/accounts');
var access_token = require('./routes/access_token');
var contacts = require('./routes/contacts');
var photos = require('./routes/photos');

var config = require('./config');

var mysql      = require('mysql');
var connection = mysql.createConnection(config.mysql);

connection.connect(function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }

  console.log('connected as id ' + connection.threadId);
});

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

function getByToken(token, fn) {
    var jwt = require('jwt-simple');

    try
    {
        var decoded = jwt.decode(token, config.token.salt);
        
        if (decoded)
        {
            // load from db user and return
            connection.query('SELECT id FROM Users WHERE email = ? and password = ?', [decoded.email, decoded.password], function(err, result)
            {            
                return fn(parseInt(result[0].id));
            });
        }
        else
        {
            return fn(0);
        }
    }
    catch (ex) {    
        //app.res.status(401).send( {"type": "Unauthorized", "message": "The request requires user authentication."} );                     
    }
}

function findByToken(token, fn) {
    // decode token and check for user in db    
    var jwt = require('jwt-simple');
    var decoded = jwt.decode(token, config.token.salt);
    
    if (decoded)
    {
        // load from db user and return
        connection.query('SELECT id FROM Users WHERE email = ? and password = ?', [decoded.email, decoded.password], function(err, result)
        {
            return fn(null, { email: decoded.email, id: result[0].id });
        });
    }
   
    return fn(null, null);
}

// Make some staff from here be accessible to router
app.use(function(req,res,next){
    req.config = config;
    req.db = connection;
    req.fnGetByToken = getByToken;
    next();
});


// Use the BearerStrategy within Passport.
// Strategies in Passport require a `validate` function, which accept
// credentials (in this case, a token), and invoke a callback with a user
// object.
passport.use(new BearerStrategy({},
    function(token, done) {
        console.log('token: ' + token);
        // asynchronous validation, for effect...
        process.nextTick(function () {
        // Find the user by token. If there is no user with the given token, set
        // the user to `false` to indicate failure. Otherwise, return the
        // authenticated `user`. Note that in a production-ready application, one
        // would want to validate the token for authenticity.
        findByToken(token, function(err, user) {
            if (err) { return done(err); }
            if (!user) { return done(null, false); }
                return done(null, user);
            })
        });
    }
));

// Initialize Passport! Note: no need to use session middleware when each
// request carries authentication credentials, as is the case with HTTP Bearer.
app.use(passport.initialize());

// to do: bind 'passport-http-bearer' can't make it working ! temporary process header on particular pages -> Authorization: Bearer [TOKEN]
/*
app.post('/contacts',
    // Authenticate using HTTP Bearer credentials, with session support disabled.
    passport.authenticate('bearer', 
        { session: false }),
        function(req, res){
            //console.log(res);
            res.json({ email: res.user.email, id: res.user.id });
        }
);
*/

app.use('/', routes);
app.use('/accounts', accounts);
app.use('/access_token', access_token);
app.use('/contacts', contacts);
app.use('/photos', photos);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;