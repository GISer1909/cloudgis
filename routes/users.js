var express = require('express');
var router = express.Router();
var User = require('../database_config/models').User;
var {
  createToken
} = require('../utils/token');
var {
  checkAuth
} = require('../utils/check_auth');
const {
  body,
  check,
  validationResult
} = require('express-validator');


/* GET users listing. */ 
router.get('/', function (req, res, next) {
  res.send('This is a users page');
});

//用户注册
router.post('/register',
  body('username').exists().withMessage('用户名不能为空').isString().withMessage('用户名必须是字符串').isLength({
    max: 50
  }).withMessage('用户名不能超过50个字符'),
  body('password').exists().withMessage('密码不能为空').isString().withMessage('密码必须是字符串').isLength({
    max: 50
  }).withMessage('密码不能超过50个字符'),
  body('email').exists().withMessage('邮箱不能为空').isEmail().withMessage('邮箱格式不正确').isLength({
    max: 50
  }).withMessage('邮箱不能超过50个字符'),
  body('name').exists().withMessage('姓名不能为空').isString().withMessage('姓名必须是字符串').isLength({
    max: 50
  }).withMessage('姓名不能超过50个字符'),
  function (req, res, next) {
    let body = req.body;
    User.findOne({
      where: {
        username: body.username
      }
    }).then(user => {
      if (user) {
        return res.json({
          code: 400,
          message: '用户名已存在'
        });
      } else {
        User.create({
          username: body.username,
          password: body.password,
          email: body.email,
          name: body.name,
          role: 0
        }).then(user => {
          res.json({
            code: 200,
            message: '注册成功'
          });
        }).catch(err => {
          console.log(err);
          res.json({
            code: 500,
            message: '服务器错误'
          });
        });
      }
    }).catch(err => {
      console.log(err);
      res.json({
        code: 500,
        message: '服务器错误'
      });
    });
  });
//用户登录
router.post('/login',
  body('username').exists().withMessage('用户名不能为空').isString().withMessage('用户名必须是字符串'),
  body('password').exists().withMessage('密码不能为空').isString().withMessage('密码必须是字符串'),
  function (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.json({
        code: 400,
        message: errors.array()
      });
    }

    let body = req.body;
    User.findOne({
      where: {
        username: body.username,
        password: body.password
      }
    }).then(user => {
      if (user) {
        let token = createToken({
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          name: user.name,
        });
        res.json({
          code: 200,
          message: '登录成功',
          data: {
            token: token,
            user: {
              username: user.username,
              email: user.email,
              name: user.name,
              role: user.role
            }
          }
        });
      } else {
        res.json({
          code: 400,
          message: '用户名或密码错误'
        });
      }
    }).catch(err => {
      console.log(err);
      res.json({
        code: 500,
        message: '服务器错误'
      });
    });
  });
//查询所有用户
router.get('/all', function (req, res, next) {
  console.log(req.user);
  //判断是否是管理员
  if (checkAuth(req, res, true, false) !== true) {
    return;
  }

  User.findAll().then(users => {
    res.json({
      code: 200,
      data: users
    });
  }).catch(err => {
    console.log(err);
    res.json({
      code: 500,
      message: '服务器错误'
    });
  });
});
//新增用户
router.post('/add', body('username').exists().withMessage('用户名不能为空').isString().withMessage('用户名必须是字符串').isLength({
    max: 50
  }).withMessage('用户名不能超过50个字符'),
  body('password').exists().withMessage('密码不能为空').isString().withMessage('密码必须是字符串').isLength({
    max: 50
  }).withMessage('密码不能超过50个字符'),
  body('email').exists().withMessage('邮箱不能为空').isEmail().withMessage('邮箱格式不正确').isLength({
    max: 50
  }).withMessage('邮箱不能超过50个字符'),
  body('name').exists().withMessage('姓名不能为空').isString().withMessage('姓名必须是字符串').isLength({
    max: 50
  }).withMessage('姓名不能超过50个字符'),
  body('role').exists().withMessage('权限不能为空').isInt().withMessage('权限必须是整数'),
  function (req, res, next) {
    let body = req.body;
    //判断是否是管理员
    if (checkAuth(req, res, true, false) !== true) {
      return;
    }
    User.findOne({
      where: {
        username: body.username
      }
    }).then(user => {
      if (user) {
        return res.json({
          code: 400,
          message: '用户名已存在'
        });
      } else {
        User.create({
          username: body.username,
          password: body.password,
          email: body.email,
          name: body.name,
          role: body.role
        }).then(user => {
          res.json({
            code: 200,
            message: '新增成功'
          });
        }).catch(err => {
          console.log(err);
          res.json({
            code: 500,
            message: '服务器错误'
          });
        });
      }
    }).catch(err => {
      console.log(err);
      res.json({
        code: 500,
        message: '服务器错误'
      });
    });
  });
//删除用户
router.post('/delete',
  body('id').exists().withMessage('id字段是必须的').isNumeric().withMessage('id必须是数字').notEmpty().withMessage('id不能为空'),
  function (req, res, next) {
    let body = req.body;
    //判断是否是管理员
    if (checkAuth(req, res, true, false) !== true) {
      return;
    }
    User.destroy({
      where: {
        id: body.id
      }
    }).then(user => {
      res.json({
        code: 200,
        message: '删除用户成功'
      });
    }).catch(err => {
      console.log(err);
      res.json({
        code: 500,
        message: '服务器错误'
      });
    });
  });
//修改用户信息
router.post('/update',
  body('id').exists().withMessage('id字段是必须的').isNumeric().withMessage('id必须是数字').notEmpty().withMessage('id不能为空'),
  function (req, res, next) {
    let body = req.body;
    //判断是否是管理员或者修改自己的信息
    if (checkAuth(req, res, true, true) !== true) {
      return;
    }
    User.update({
      username: body.username,
      password: body.password,
      email: body.email,
      name: body.name,
      //如果是管理员则可以修改权限
      role: req.user.role === 1 ? body.role : req.user.role
    }, {
      where: {
        id: body.id
      }
    }).then(user => {
      res.json({
        code: 200,
        message: '修改用户信息成功'
      });
    }).catch(err => {
      console.log(err);
      res.json({
        code: 500,
        message: '服务器错误'
      });
    });

  });




module.exports = router;