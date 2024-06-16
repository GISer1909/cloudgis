const express = require('express');
const router = express.Router();
const Data = require('../database_config/models').Data;


// 创建新数据
router.post('/data', async (req, res) => {
    try {
        const newData = req.body;
        const createdData = await Data.create(newData);
        res.json({
            message: 'Data created',
            code: 200
        });
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// 更新数据
router.put('/data/:id', async (req, res) => {
    try {
        const dataId = req.params.id;
        const newData = req.body;
        const data = await Data.findByPk(dataId);
        if (data) {
            //判断是否是管理员或者data的上传者
            if (req.user.role !== 1 && req.user.id !== data.userid) {
                return res.json({
                    code: 403,
                    message: '权限不足'
                });
            }
            await data.update(newData);
            res.json({
                message: 'Data updated',
               code: 200,

            });
        } else {
            res.status(404).json({
                message: 'Data not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// 删除数据
router.delete('/data/:id', async (req, res) => {
    try {
        const dataId = req.params.id;
        const data = await Data.findByPk(dataId);
        if (data) {
            //判断是否是管理员或者data的上传者
            if (req.user.role !== 1 && req.user.id !== data.userid) {
                return res.json({
                    code: 403,
                    message: '权限不足'
                });
            }
            await data.destroy();
            res.json({
                message: 'Data deleted',
                code:200
            });
        } else {
            res.status(404).json({
                message: 'Data not found'
            });
        }
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// 根据userid获取其数据
router.get('/data', async (req, res) => {
    try {
        const userId = req.user.id
        const data = await Data.findAll({
            where: {
                userid: userId
            }
        });
        res.json({
            code:200,
            data: data
        });
        
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});


module.exports = router;