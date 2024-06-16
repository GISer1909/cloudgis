var express = require('express');
var router = express.Router();
var Mine = require('../database_config/models').Mine;
var {
    body,
    validationResult
} = require('express-validator');
const {
    Op
} = require('sequelize');

// 获取所有矿山
router.get('/all', function (req, res, next) {
    Mine.findAll().then(mines => {
        res.json({
            code: 200,
            data: mines
        });
    }).catch(err => {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    });
});

// 添加新矿山
router.post('/add',
    body('mine_name').exists().withMessage('mine_name字段是必须的').notEmpty().withMessage('mine_name不能为空'),
    body('mine_type').exists().withMessage('mine_type字段是必须的').notEmpty().withMessage('mine_type不能为空'),
    body('mine_address').exists().withMessage('mine_address字段是必须的').notEmpty().withMessage('mine_address不能为空'),
    body('regulatory_body_id').exists().withMessage('regulatory_body_id字段是必须的').isNumeric().withMessage('regulatory_body_id必须是数字').notEmpty().withMessage('regulatory_body_id不能为空'),
    body('primary_contact_name').exists().withMessage('primary_contact_name字段是必须的').notEmpty().withMessage('primary_contact_name不能为空'),
    body('primary_contact_phone').exists().withMessage('primary_contact_phone字段是必须的').notEmpty().withMessage('primary_contact_phone不能为空'),
    body('dispatch_office_phone').exists().withMessage('dispatch_office_phone字段是必须的').notEmpty().withMessage('dispatch_office_phone不能为空'),
    body('operational_status').exists().withMessage('operational_status字段是必须的').notEmpty().withMessage('operational_status不能为空'),
    body('boundary_polygon').exists().withMessage('boundary_polygon字段是必须的').notEmpty().withMessage('boundary_polygon不能为空'),
    body('center_coordinates').exists().withMessage('center_coordinates字段是必须的').notEmpty().withMessage('center_coordinates不能为空'),
    function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                code: 400,
                message: errors.array()
            });
        }
        let body = req.body;
        Mine.create(body).then(mine => {
            res.json({
                code: 200,
                message: '矿山添加成功'
            });
        }).catch(err => {
            console.log(err);
            res.json({
                code: 500,
                message: '服务器错误'
            });
        });
    }
);

// 删除矿山
router.post('/delete',
    body('mine_id').exists().withMessage('mine_id字段是必须的').isNumeric().withMessage('mine_id必须是数字').notEmpty().withMessage('mine_id不能为空'),
    function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                code: 400,
                message: errors.array()
            });
        }
        let body = req.body;
        Mine.destroy({
            where: {
                mine_id: body.mine_id
            }
        }).then(mine => {
            res.json({
                code: 200,
                message: '矿山删除成功'
            });
        }).catch(err => {
            console.log(err);
            res.json({
                code: 500,
                message: '服务器错误'
            });
        });
    }
);

// 更新矿山详情
router.post('/update',
    body('mine_id').exists().withMessage('mine_id字段是必须的').isNumeric().withMessage('mine_id必须是数字').notEmpty().withMessage('mine_id不能为空'),
    function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                code: 400,
                message: errors.array()
            });
        }
        let body = req.body;
        Mine.update(body, {
            where: {
                mine_id: body.mine_id
            }
        }).then(mine => {
            res.json({
                code: 200,
                message: '矿山更新成功'
            });
        }).catch(err => {
            console.log(err);
            res.json({
                code: 500,
                message: '服务器错误'
            });
        });
    }
);

//根据矿山名称或者矿山id查询矿山
router.get('/search',
    function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                code: 400,
                message: errors.array()
            });
        }
        let body = req.query;
        let where = {};
        if (body.mine_id) {
            where.mine_id = body.mine_id;
        }
        if (body.mine_name) {
            //模糊查询
            where.mine_name = {
                [Op.like]: '%' + body.mine_name + '%'
            };
        }
        Mine.findOne({
            where
        }).then(mine => {
            if (mine) {
                res.json({
                    code: 200,
                    data: mine
                });
            } else {
                res.json({
                    code: 404,
                    message: '未找到矿山'
                });
            }
        }).catch(err => {
            console.log(err);
            res.json({
                code: 500,
                message: '服务器错误'
            });
        });
    }
);


module.exports = router;