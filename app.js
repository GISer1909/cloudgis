var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var minesRouter = require('./routes/mines');
var filesRouter = require('./routes/files');
var rastersRouter = require('./routes/rasters');
var rsmsRouter = require('./routes/rsms');
var vectorsRouter = require('./routes/vectors');
var visualRouter = require('./routes/visuals');

var {
  verifyToken
} = require('./utils/token');


var app = express();
require('express-ws')(app);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(cors());
 
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


//验证token
app.use(function (req, res, next) {
  if (req.path === '/users/login' || req.path === '/users/register') {
    return next();
  }
  let token = req.headers['authorization'];
  if (token === undefined || token === '' || token === null) {

    return res.json({
      code: 403,
      message: '请登录'
    });

  } else {
    verifyToken(token).then(data => {
      req.user = data;
      return next();
    }).catch(err => {
      return res.json({
        code: 403,
        message: 'token验证失败'
      });
    });
  }
});



app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/mines', minesRouter);
app.use('/files', filesRouter);
app.use('/rasters', rastersRouter);
app.use('/rsms', rsmsRouter);
app.use('/vectors', vectorsRouter);
app.use('/visuals', visualRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;