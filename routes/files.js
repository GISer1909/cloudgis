var express = require('express');
var router = express.Router();
var FileMetadata = require('../database_config/models').FileMetadata;
var sequelize = require('../database_config/models').sequelize;
var multer = require("multer");
var path = require("path");
var fs = require("fs");
const {
    exec
} = require('child_process');
const {
    Sequelize,
    Op
} = require('sequelize');
const {
    body,
    check,
    validationResult
} = require('express-validator');
var Mine = require('../database_config/models').Mine;

const upload = multer({
    dest: "public/upload/file"
});

router.post("/upload", upload.single("file"),
    (req, res, next) => {
        if (!req.file) {
            return res.json({
                code: 400,
                message: '文件是必须的'
            });
        }
        next();
    },
    check('description').exists().withMessage('description字段是必须的').isString().withMessage('description必须是字符串').notEmpty().withMessage('description不能为空'),
    check('mine_id').exists().withMessage('mine_id字段是必须的').isInt().withMessage('mine_id必须是整数').notEmpty().withMessage('mine_id不能为空'),
    check('time').exists().withMessage('time字段是必须的').isISO8601().withMessage('time必须是一个有效的ISO 8601日期字符串'),
    async (req, res) => {
        let responseSent = false;
        let body = req.body;
        const file = req.file;
        const extname = path.extname(file.originalname);
        const newFilename = file.filename + extname;
        const filePath = "public/upload/file/" + newFilename;

        fs.renameSync(file.path, filePath);
        const sendResponse = (code, message, data) => {
            if (!responseSent) {
                res.json({
                    code,
                    message,
                    data
                });
                responseSent = true;
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
        };

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendResponse(400, errors.array());
        }

        // 上传文件到 HDFS
        const command = `python ./scripts/hdfs_operation.py ${filePath} /file/${newFilename} add`;

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                return sendResponse(500, '服务器错误');
            }

            FileMetadata.create({
                file_path: `/file/${newFilename}`,
                time: body.time,
                description: body.description,
                mine_id: body.mine_id,
                file_format: extname.slice(1)
            }).then(fileData => {
                sendResponse(200, '文件上传成功', body);
            }).catch(err => {
                console.log(err);
                sendResponse(500, '服务器错误');
            });
        });
    });




router.post('/delete',
    body('data_id').exists().withMessage('data_id字段是必须的').isNumeric().withMessage('data_id必须是数字').notEmpty().withMessage('data_id不能为空'),
    function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                code: 400,
                message: errors.array()
            });
        }
        let body = req.body;
        let responseSent = false; // 添加的变量

        const sendResponse = (code, message, data) => { // 响应函数
            if (!responseSent) {
                res.json({
                    code,
                    message,
                    data
                });
                responseSent = true;
            }
        };

        //查找file_path
        FileMetadata.findOne({
            where: {
                data_id: body.data_id
            }
        }).then(fileData => {
            //调用hdfs_operation.py
            const command = `python ./scripts/hdfs_operation.py ${fileData.file_path} ${fileData.file_path} delete`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return sendResponse(500, '服务器错误'); // 使用响应函数
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                FileMetadata.destroy({
                    where: {
                        data_id: body.data_id
                    }
                }).then(fileData => {
                    sendResponse(200, '文件数据删除成功'); // 使用响应函数
                }).catch(err => {
                    console.log(err);
                    sendResponse(500, '服务器错误'); // 使用响应函数
                });
            });
        }).catch(err => {
            console.log(err);
            sendResponse(500, '服务器错误'); // 使用响应函数
        });
    });


router.post('/update',
    body('data_id').exists().withMessage('data_id字段是必须的').isNumeric().withMessage('data_id必须是数字').notEmpty().withMessage('data_id不能为空'),
    function (req, res, next) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.json({
                code: 400,
                message: errors.array()
            });
        }

        let body = req.body;
        let responseSent = false;

        const sendResponse = (code, message, data) => {
            if (!responseSent) {
                res.json({
                    code,
                    message,
                    data
                });
                responseSent = true;
            }
        };

        let updateData = {
            description: body.description
        };

        FileMetadata.findOne({
            where: {
                data_id: body.data_id
            }
        }).then(fileData => {
            if (fileData) {
                fileData.update(updateData).then(() => {
                    sendResponse(200, '文件数据更新成功');
                }).catch(err => {
                    console.log(err);
                    sendResponse(500, '服务器错误');
                });
            } else {
                sendResponse(404, '文件数据不存在');
            }
        }).catch(err => {
            console.log(err);
            sendResponse(500, '服务器错误');
        });
    });

router.get('/search', async function (req, res, next) {
    // 搜索参数
    let mine_id = req.query.mine_id;
    let description = req.query.description;
    let start_time = req.query.start_time;
    let end_time = req.query.end_time;
    let format = req.query.format;

    // 构建查询条件
    let whereCondition = {};
    if (mine_id) whereCondition.mine_id = mine_id;
    if (description) whereCondition.description = {
        [Op.like]: '%' + description + '%'
    };
    if (start_time) whereCondition.time = {
        [Op.gte]: start_time
    };
    if (end_time) whereCondition.time = {
        [Op.lte]: end_time
    };
    if (format) whereCondition.file_format = format;

    try {
        let data = await FileMetadata.findAll({
            where: whereCondition,
            include: [{
                model: Mine
            }]
        });
        res.json({
            code: 200,
            data: data
        });
    } catch (err) {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    }
});


module.exports = router;