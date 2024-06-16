var express = require('express');
var router = express.Router();
var VisualData = require('../database_config/models').VisualData;
var VisualDataDetail = require('../database_config/models').VisualDataDetail;

// 获取所有VisualData
router.get('/visualData/all', function (req, res, next) {
    VisualData.findAll({
        include: [{
            model: VisualDataDetail
        }]
    }).then(data => {
        //将数据改成 visualData，data_type，visualDataDetails三级树形结构
        let treeData = {};
        data.forEach(visualData => {
            if (!treeData[visualData.id]) {
                treeData[visualData.id] = {
                    label: visualData.label,
                    id: visualData.id,
                    createdAt: visualData.createdAt,
                    updatedAt: visualData.updatedAt,
                    children: {}
                };
            }

            visualData.VisualDataDetails.forEach(detail => {
                if (!treeData[visualData.id].children[detail.data_type]) {
                    treeData[visualData.id].children[detail.data_type] = [];
                }

                treeData[visualData.id].children[detail.data_type].push(detail);
            });
        });

        let treeDataArray = [];
        for (let i in treeData) {
            let arr = []
            for (let j in treeData[i].children) {
                arr.push({
                    label: j,
                    children: treeData[i].children[j],
                    notCURD: true
                });

            }
            treeData[i].children = arr;

            treeDataArray.push(treeData[i]);
        }


        res.json({
            code: 200,
            data: treeDataArray
        });

    }).catch(err => {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    });
});

// 添加新VisualData
router.post('/visualData/add', function (req, res, next) {
    let body = req.body;
    VisualData.create(body).then(data => {
        res.json({
            code: 200,
            message: 'VisualData添加成功'
        });
    }).catch(err => {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    });
});

// 删除VisualData
router.post('/visualData/delete', function (req, res, next) {
    let body = req.body;
    VisualData.destroy({
        where: {
            id: body.id
        }
    }).then(data => {
        res.json({
            code: 200,
            message: 'VisualData删除成功'
        });
    }).catch(err => {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    });
});

// 更新VisualData
router.post('/visualData/update', function (req, res, next) {
    let body = req.body;
    VisualData.update(body, {
        where: {
            id: body.id
        }
    }).then(data => {
        res.json({
            code: 200,
            message: 'VisualData更新成功'
        });
    }).catch(err => {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    });
});

// 获取所有VisualDataDetail
router.get('/visualDataDetail/all', function (req, res, next) {
    VisualDataDetail.findAll().then(data => {
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

// 添加新VisualDataDetail
router.post('/visualDataDetail/add', function (req, res, next) {
    let body = req.body;
    VisualDataDetail.create(body).then(data => {
        res.json({
            code: 200,
            message: 'VisualDataDetail添加成功'
        });
    }).catch(err => {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    });
});

// 删除VisualDataDetail
router.post('/visualDataDetail/delete', function (req, res, next) {
    let body = req.body;
    VisualDataDetail.destroy({
        where: {
            id: body.id
        }
    }).then(data => {
        res.json({
            code: 200,
            message: 'VisualDataDetail删除成功'
        });
    }).catch(err => {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    });
});

// 更新VisualDataDetail
router.post('/visualDataDetail/update', function (req, res, next) {
    let body = req.body;
    VisualDataDetail.update(body, {
        where: {
            id: body.id
        }
    }).then(data => {
        res.json({
            code: 200,
            message: 'VisualDataDetail更新成功'
        });
    }).catch(err => {
        console.log(err);
        res.json({
            code: 500,
            message: '服务器错误'
        });
    });
});

//    print("Usage: python script.py <layer_name> <file_path> <workspace>")
router.post('/geoserver', function (req, res, next) {
    const {
        exec
    } = require('child_process');
    const layer_name = req.body.layer_name;
    const file_path = req.body.file_path;
    const workspace = req.body.workspace;

    const command = `python ./scripts/visual/geoserver.py ${layer_name} ${file_path} ${workspace}`;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            res.json({
                code: 500,
                message: '服务器错误'
            });
        } else {
            res.json({
                code: 200,
                message: '运行成功'
            });
        }
    });
})
router.post('/gocesiumtiler', function (req, res, next) {
    const {
        exec
    } = require('child_process');
    const input = req.body.input;
    const output = req.body.output;
    const srid = req.body.srid;

    const command = `./scripts/visual/gocesiumtiler/gocesiumtiler.exe -i ${input} -o ${output} -srid ${srid} -geoid`;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            res.json({
                code: 500,
                message: '服务器错误'
            });
        } else {
            res.json({
                code: 200,
                message: '运行成功'
            });
        }
    });
})
//3dtile --format osgb --input /tmp/osgb/mine_1/ --output /tmp/server/osgb/mine_1/3dtiles
router.post('/3dtile', function (req, res, next) {
    const {
        exec
    } = require('child_process');
    const input = req.body.input;
    const output = req.body.output;

    const command = `3dtile --format osgb --input ${input} --output ${output}`;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            res.json({
                code: 500,
                message: '服务器错误'
            });
        } else if (stderr.indexOf('ERROR') !== -1) {
            res.json({
                code: 500,
                message: '服务器错误'
            });
        } else {
            res.json({
                code: 200,
                message: '运行成功'
            });
        }
    });
})
//ctb-tile -f Mesh -C -N -o /tmp/server/dem/mine_1/Terrain /tmp/dem/mine_1.tif
//ctb-tile -f Mesh -C -N -l -o /tmp/server/dem/mine_1/Terrain /tmp/dem/mine_1.tif 
router.post('/ctbtile', function (req, res, next) {
    const {
        exec
    } = require('child_process');
    const input = req.body.input;
    const output = req.body.output;

    const command = `ctb-tile -f Mesh -C -N -o ${output} ${input}`;
    exec(command, (err, stdout, stderr) => {
        if (err) {
            console.log(err);
            res.json({
                code: 500,
                message: '服务器错误'
            });
        } else {
            const command2 = `ctb-tile -f Mesh -C -N -l -o ${output} ${input}`;
            exec(command2, (err, stdout, stderr) => {
                if (err) {
                    console.log(err);
                    res.json({
                        code: 500,
                        message: '服务器错误'
                    });
                } else {
                    res.json({
                        code: 200,
                        message: '运行成功'
                    });
                }
            });

        }
    });
})

module.exports = router;