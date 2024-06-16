var express = require('express');
var router = express.Router();
var RasterDataMetadata = require('../database_config/models').RasterDataMetadata;
var sequelize = require('../database_config/models').sequelize;
var multer = require("multer");
var path = require("path");
var fs = require("fs");
const {
    exec
} = require('child_process');
const spawn = require("child_process").spawn;
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
    dest: "public/upload/raster"
});

router.post("/upload", upload.single("raster"),
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
    check('processing_description').exists().withMessage('processing_description字段是必须的').isString().withMessage('processing_description必须是字符串').notEmpty().withMessage('processing_description不能为空'),
    check('band_info').exists().withMessage('band_info字段是必须的').isString().withMessage('band_info必须是字符串').notEmpty().withMessage('band_info不能为空'),
    check('raw_data').exists().withMessage('raw_data字段是必须的').isString().withMessage('raw_data必须是字符串').notEmpty().withMessage('raw_data不能为空'),
    check('mine_id').exists().withMessage('mine_id字段是必须的').isInt().withMessage('mine_id必须是整数').notEmpty().withMessage('mine_id不能为空'),
    check('time').exists().withMessage('time字段是必须的').isISO8601().withMessage('time必须是一个有效的ISO 8601日期字符串'),
    async (req, res) => {
        let responseSent = false;
        let body = req.body;
        const file = req.file;
        const newFilename = file.filename + path.extname(file.originalname);
        const filePath = "public/upload/raster/" + newFilename;

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



        const pythonProcess = spawn('python', ["./scripts/raster.py", filePath]);

        pythonProcess.stdout.on('data', (data) => {
            try {
                const parsedData = JSON.parse(data.toString());

                Object.assign(body, {
                    file_path: "/raster/" + newFilename,
                    projection_crs: parsedData.projection_crs,
                    geographic_crs: parsedData.geographic_crs,
                    center_latitude: parsedData.center_latitude,
                    center_longitude: parsedData.center_longitude,
                    spatial_coverage: parsedData.spatial_coverage,
                    epsg_code: parsedData.epsg_code
                });

                const command = `python ./scripts/hdfs_operation.py ${filePath} /raster/${newFilename} add`;

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        return sendResponse(500, '服务器错误');
                    }

                    RasterDataMetadata.create(body).then(rasterData => {
                        sendResponse(200, '栅格数据添加成功', body);
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
        RasterDataMetadata.findOne({
            where: {
                data_id: body.data_id
            }
        }).then(rasterData => {
            //调用hdfs_operation.py
            const command = `python ./scripts/hdfs_operation.py ${rasterData.file_path} ${rasterData.file_path} delete`;
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return sendResponse(500, '服务器错误'); // 使用响应函数
                }
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);
                RasterDataMetadata.destroy({
                    where: {
                        data_id: body.data_id
                    }
                }).then(rasterData => {
                    sendResponse(200, '栅格数据删除成功'); // 使用响应函数
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
            band_info: body.band_info,
            processing_description: body.processing_description,
            description: body.description,
            projection_crs: body.projection_crs,
            geographic_crs: body.geographic_crs,
            raw_data: body.raw_data,
            file_path: body.file_path,
            center_latitude: body.center_latitude,
            center_longitude: body.center_longitude,
            spatial_coverage: body.spatial_coverage,
            epsg_code: body.epsg_code,
        };

        RasterDataMetadata.findOne({
            where: {
                data_id: body.data_id
            }
        }).then(rasterData => {
            if (rasterData) {
                rasterData.update(updateData).then(() => {
                    sendResponse(200, '栅格数据更新成功'); // 使用响应函数
                }).catch(err => {
                    console.log(err);
                    sendResponse(500, '服务器错误'); // 使用响应函数
                });
            } else {
                sendResponse(404, '栅格数据不存在'); // 使用响应函数
            }
        }).catch(err => {
            console.log(err);
            sendResponse(500, '服务器错误'); // 使用响应函数
        });
    });


router.get('/search', async function (req, res, next) {
    // 搜索参数
    let mine_id = req.query.mine_id;
    let description = req.query.description;
    let band_info = req.query.band_info;
    let processing_description = req.query.processing_description;
    let raw_data = req.query.raw_data;
    let start_time = req.query.start_time;
    let end_time = req.query.end_time;
    let projection_crs = req.query.projection_crs;
    let geographic_crs = req.query.geographic_crs;
    let spatial_coverage = req.query.spatial_coverage;
    //  spatial_type: "",//intersects,contains,within
    let spatial_type = req.query.spatial_type;
    let epsg_code = req.query.epsg_code;
    // 构建查询条件
    let whereCondition = {};
    if (mine_id) whereCondition.mine_id = mine_id;
    if (description) whereCondition.description = {
        [Op.like]: '%' + description + '%'
    };
    if (band_info) {
        const bands = band_info.split(",");
        whereCondition.band_info = {
            [Op.or]: bands.map(band => ({
                [Op.like]: '%' + band + '%'
            }))
        };
    }
    if (processing_description) whereCondition.processing_description = {
        [Op.like]: '%' + processing_description + '%'
    };
    if (raw_data) whereCondition.raw_data = {
        [Op.like]: '%' + raw_data + '%'
    };
    if (start_time) whereCondition.time = {
        [Op.gte]: start_time
    };
    if (end_time) whereCondition.time = {
        [Op.lte]: end_time
    };
    if (projection_crs) whereCondition.projection_crs = projection_crs;
    if (geographic_crs) whereCondition.geographic_crs = geographic_crs;
    if (epsg_code) whereCondition.epsg_code = epsg_code;
    if (spatial_coverage) {
        //如果spatial_type为空，则默认为intersects
        if (!spatial_type) {
            spatial_type = "intersects";
        }
        whereCondition.spatial_coverage = sequelize.where(
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
    try {
        let data = await RasterDataMetadata.findAll({
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