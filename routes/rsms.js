var express = require('express');
var router = express.Router();
var RemoteSensingMetadata = require('../database_config/models').RemoteSensingMetadata;
var sequelize = require('../database_config/models').sequelize;
var multer = require("multer");
var path = require("path");
var fs = require("fs");
const {
    exec
} = require('child_process');
const spawn = require("child_process").spawn;
// 导入 sequelize 和 Op
const {
    Sequelize,
    Op
} = require('sequelize');
const {
    body,
    check,
    validationResult
} = require('express-validator');




//上传遥感数据
const upload = multer({
    dest: "public/upload/rs"
});
router.post("/upload", upload.single("rs"),
    (req, res, next) => {
        if (!req.file) {
            return res.json({
                code: 400,
                message: '文件是必须的'
            });
        }
        next();
    },
    check('product_name').exists().withMessage('product_name字段是必须的').isString().withMessage('product_name必须是字符串').notEmpty().withMessage('product_name不能为空'),
    check('cloud_coverage').exists().withMessage('cloud_coverage字段是必须的').isNumeric().withMessage('cloud_coverage必须是数字').notEmpty().withMessage('cloud_coverage不能为空'),
    check('acquisition_time').exists().withMessage('acquisition_time字段是必须的').isISO8601().withMessage('acquisition_time必须是一个有效的ISO 8601日期字符串'),
    check('image_quality').exists().withMessage('image_quality字段是必须的').isNumeric().withMessage('image_quality必须是数字').notEmpty().withMessage('image_quality不能为空'),
    check('processing_level').exists().withMessage('processing_level字段是必须的').isString().withMessage('processing_level必须是字符串').notEmpty().withMessage('processing_level不能为空'),
    check('data_source').exists().withMessage('data_source字段是必须的').isString().withMessage('data_source必须是字符串').notEmpty().withMessage('data_source不能为空'),
    check('band_info').exists().withMessage('band_info字段是必须的').isString().withMessage('band_info必须是字符串').notEmpty().withMessage('band_info不能为空'), async (req, res) => {
        let responseSent = false;
        let body = req.body;
        const file = req.file;
        const newFilename = file.filename + path.extname(file.originalname);
        const filePath = "public/upload/rs/" + newFilename;
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

        if (path.extname(req.file.originalname) !== '.tif' && path.extname(req.file.originalname) !== '.tiff') {
            return sendResponse(400, '只接受.tif或.tiff文件');
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return sendResponse(400, errors.array());
        }

        const pythonProcess = spawn('python', ["./scripts/rs.py", filePath]);

        pythonProcess.stdout.on('data', (data) => {
            try {
                const parsedData = JSON.parse(data.toString());

                Object.assign(body, {
                    image_path: "/rs/" + newFilename,
                    projection_crs: parsedData.projection_crs,
                    geographic_crs: parsedData.geographic_crs,
                    center_latitude: parsedData.center_latitude,
                    center_longitude: parsedData.center_longitude,
                    band_info: req.body.band_info.split(',').toString(),
                    spatial_coverage: parsedData.spatial_coverage,
                    epsg_code: parsedData.epsg_code
                });

                const command = `python ./scripts/hdfs_operation.py ${filePath} /rs/${newFilename} add`;

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return sendResponse(500, '服务器错误');
                    }

                    RemoteSensingMetadata.create(body).then(rsData => {
                        sendResponse(200, '遥感数据添加成功', body);
                    }).catch(err => {
                        console.log(err);
                        sendResponse(500, '服务器错误');
                    });
                });
            } catch (error) {
                console.log(error);
                sendResponse(500, '读取空间信息出错');
            }
        });

        pythonProcess.stderr.on('data', (data) => {
            console.error(data.toString());
            sendResponse(500, '读取空间信息出错');
        });

        pythonProcess.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });
    });


//删除遥感数据
router.post('/delete',
    body('id').exists().withMessage('id字段是必须的').isNumeric().withMessage('id必须是数字').notEmpty().withMessage('id不能为空'),
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

        //查找image_path
        RemoteSensingMetadata.findOne({
            where: {
                id: body.id
            }
        }).then(rsData => {
            //调用hdfs_operation.py
            const command = `python ./scripts/hdfs_operation.py ${rsData.image_path} ${rsData.image_path} delete`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return sendResponse(500, '服务器错误'); // 使用响应函数
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                RemoteSensingMetadata.destroy({
                    where: {
                        id: body.id
                    }
                }).then(rsData => {
                    sendResponse(200, '遥感数据删除成功'); // 使用响应函数
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


// 更新遥感数据
router.post('/update',
    body('id').exists().withMessage('id字段是必须的').isNumeric().withMessage('id必须是数字').notEmpty().withMessage('id不能为空'),
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

        let updateData = {
            product_name: body.product_name,
            band_info: body.band_info,
            cloud_coverage: body.cloud_coverage,
            image_quality: body.image_quality,
            processing_level: body.processing_level,
            projection_crs: body.projection_crs,
            geographic_crs: body.geographic_crs,
            center_latitude: body.center_latitude,
            center_longitude: body.center_longitude,
            data_source: body.data_source,
            image_path: body.image_path,
            spatial_coverage: body.spatial_coverage,
            epsg_code: body.epsg_code,
        };
        RemoteSensingMetadata.findOne({
            where: {
                id: body.id
            }
        }).then(rsData => {
            if (rsData) {
                rsData.update(updateData).then(() => {
                    sendResponse(200, '遥感数据更新成功'); // 使用响应函数
                }).catch(err => {
                    console.log(err);
                    sendResponse(500, '服务器错误'); // 使用响应函数
                });
            } else {
                sendResponse(404, '遥感数据不存在'); // 使用响应函数
            }
        }).catch(err => {
            console.log(err);
            sendResponse(500, '服务器错误'); // 使用响应函数
        });
    });


router.get('/search', function (req, res, next) {
    let {
        product_name,
        band_info,
        processing_level,
        data_source,
        start_time,
        end_time,
        projection_crs,
        geographic_crs,
        spatial_coverage,
        cloud_coverage,
        image_quality,
        epsg_code
    } = req.query;
    //  spatial_type: "",//intersects,contains,within
    let spatial_type = req.query.spatial_type;

    let whereClause = {};

    if (product_name) whereClause.product_name = product_name;
    if (band_info) {
        const bands = band_info.split(",");
        whereClause.band_info = {
            [Op.or]: bands.map(band => ({
                [Op.like]: '%' + band + '%'
            }))
        };
    }
    if (processing_level) whereClause.processing_level = processing_level;
    if (data_source) whereClause.data_source = data_source;
    if (epsg_code) whereClause.epsg_code = epsg_code;
    if (start_time && end_time) {
        whereClause.acquisition_time = {
            [Op.between]: [start_time, end_time]
        };
    } else if (start_time) {
        whereClause.acquisition_time = {
            [Op.gte]: start_time
        };
    } else if (end_time) {
        whereClause.acquisition_time = {
            [Op.lte]: end_time
        };
    }
    if (projection_crs) whereClause.projection_crs = projection_crs;
    if (geographic_crs) whereClause.geographic_crs = geographic_crs;
    if (spatial_coverage) {
        //如果spatial_type为空，则默认为intersects
        if (!spatial_type) {
            spatial_type = "intersects";
        }
        whereClause.spatial_coverage = sequelize.where(
            sequelize.fn(
                'ST_' + spatial_type,
                sequelize.col('spatial_coverage'),
                sequelize.fn(
                    'ST_GeomFromText',
                    spatial_coverage,
                    4326
                )
            ),
            true
        );
    }
    if (cloud_coverage) whereClause.cloud_coverage = cloud_coverage;
    if (image_quality) //大于等于
        whereClause.image_quality = {
            [Op.gte]: image_quality
        };

    RemoteSensingMetadata.findAll({
        where: whereClause
    }).then(data => {
        res.json({
            code: 200,
            data: data
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