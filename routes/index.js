var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config');
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});
router.get('/download', function (req, res, next) {
  let filePath = req.query.path;
  let Url = "http://127.0.0.1:9870/webhdfs/v1" + filePath + "?op=OPEN";
  // 发送HTTP GET请求
  request.get({
    url: Url,
    followRedirect: false // 不自动处理重定向
  }, function (error, response, body) {
    if (!error && response.statusCode == 307) {
      // 获取重定向的URL
      var redirectUrl = response.headers.location;
      redirectUrl = redirectUrl.replace(/\/\/[^:]+:/, `//${config.webhdfs_host}:`);
      //返回重定向的URL
      res.json({
        code: 200,
        data: redirectUrl
      });

    }else{
      res.json({
        code: 400,
        message: '服务器错误'
      });
    }
  });
});





module.exports = router;