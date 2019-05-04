var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var queueManager = require('./queue/manager');
var queueProcess = require('./queue/process');
const cookieSession = require('cookie-session');

var index = require('./routes/index');
var status = require('./routes/status');
var coupon = require('./routes/coupon');

var app = express();

app.get('*', function (req, res, next) {
  if (app.get('env') === 'production' && req.headers['x-forwarded-proto'] != 'https')
    res.redirect('https://checkout.socialrocket.com.br' + req.url)
  else
    next()
});
 


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieSession({
  name: 'session',
  keys: ['SR', 'socialrocket2018'],
  maxAge: 30 * 24 * 60 * 60 * 1000,
}));


app.use('/', index);
app.use('/status', status);
app.use('/coupon', coupon);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




errorHandler = (exception, res) => {
	res.status(500).json({error: exception});
	res.end();
}

genericErrorHandler = (message, res, status) => {
	console.log(message);
	res.status(status).json({error: message});
	res.end();	
}

// Start a connection with rabbitMQ
queueManager.start([queueManager.startPublisher, queueManager.startWorker], "payment", (msg, cb) => {
  var obj = JSON.parse(msg.content.toString());

  queueProcess[obj.payment.QueueStatus](obj).then(result => {
      console.log('Success: ', result);
      cb(true);
    })
    .catch((err, body) => {
      console.error('Error on processing ->' + err.message);
      console.error(err.stack);
      cb(true);
    });

});


module.exports = app;
