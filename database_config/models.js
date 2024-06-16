const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const {
    DataTypes
} = require('sequelize');
const config = require('../config.json');
const sequelize = new Sequelize(
    config.database.name,
    config.database.user,
    config.database.password, {
        host: config.database.host,
        dialect: config.database.dialect,
        port: config.database.port
    }
);
const {
    exec
} = require('child_process');



//定义用户表模型：用户id，用户名，密码，邮箱，姓名，权限(0为普通用户，1为管理员)
const User = sequelize.define('user', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    username: Sequelize.STRING(50),
    password: Sequelize.STRING(50),
    email: Sequelize.STRING(50),
    name: Sequelize.STRING(50),
    role: Sequelize.INTEGER
}, {
    timestamps: true
});

const Mine = sequelize.define('mine', {
    mine_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mine_name: Sequelize.STRING(255),
    mine_type: Sequelize.STRING(255),
    mine_address: Sequelize.STRING(255),
    regulatory_body_id: Sequelize.INTEGER,
    primary_contact_name: Sequelize.STRING(255),
    primary_contact_phone: Sequelize.STRING(255),
    dispatch_office_phone: Sequelize.STRING(255),
    operational_status: Sequelize.STRING(255),
    boundary_polygon: Sequelize.GEOMETRY('MULTIPOLYGON'),
    center_coordinates: Sequelize.GEOMETRY('POINT')

}, {
    timestamps: true
});


const RemoteSensingMetadata = sequelize.define('remote_sensing_metadata', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    product_name: Sequelize.STRING,
    band_info: Sequelize.STRING,
    cloud_coverage: Sequelize.INTEGER,
    acquisition_time: {
        type: Sequelize.DATE,
        primaryKey: true,
        get() {
            return new Date(new Date(this.getDataValue('acquisition_time')).getTime() + 8 * 60 * 60 * 1000).toISOString()
        },
    },
    image_quality: Sequelize.INTEGER,
    processing_level: Sequelize.STRING,
    projection_crs: Sequelize.STRING,
    geographic_crs: Sequelize.STRING,
    center_latitude: Sequelize.FLOAT,
    center_longitude: Sequelize.FLOAT,
    spatial_coverage: Sequelize.GEOMETRY('POLYGON', 4326),
    data_source: Sequelize.STRING,
    image_path: Sequelize.STRING,
    //EPSG代码
    epsg_code: Sequelize.INTEGER
}, {
    timestamps: true
});

const RasterDataMetadata = sequelize.define('raster_data_metadata', {
    data_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mine_id: Sequelize.INTEGER,
    file_path: Sequelize.STRING,
    band_info: Sequelize.STRING,
    raw_data: Sequelize.STRING,
    processing_description: Sequelize.STRING,
    description: Sequelize.STRING,
    time: {
        type: Sequelize.DATE,
        primaryKey: true,
        get() {
            return new Date(new Date(this.getDataValue('time')).getTime() + 8 * 60 * 60 * 1000).toISOString()
        },
    },
    projection_crs: Sequelize.STRING,
    geographic_crs: Sequelize.STRING,
    center_latitude: Sequelize.FLOAT,
    center_longitude: Sequelize.FLOAT,
    spatial_coverage: Sequelize.GEOMETRY('POLYGON', 4326),
    //EPSG代码
    epsg_code: Sequelize.INTEGER
}, {
    timestamps: true
});

Mine.hasMany(RasterDataMetadata, {
    foreignKey: 'mine_id',
    sourceKey: 'mine_id'
});
RasterDataMetadata.belongsTo(Mine, {
    foreignKey: 'mine_id',
    targetKey: 'mine_id'
});

const FileMetadata = sequelize.define('file_metadata', {
    data_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mine_id: Sequelize.INTEGER,
    file_path: Sequelize.STRING,
    description: Sequelize.STRING,
    time: {
        type: Sequelize.DATE,
        primaryKey: true,
        get() {
            return new Date(new Date(this.getDataValue('time')).getTime() + 8 * 60 * 60 * 1000).toISOString()
        },
    },
    file_format: Sequelize.STRING
}, {
    timestamps: true
});

const VectorData = sequelize.define('vector_data', {
    data_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    mine_id: Sequelize.INTEGER,
    geometry_type: Sequelize.STRING,
    coordinate_system: Sequelize.STRING,
    description: Sequelize.STRING,
    file_path: Sequelize.STRING,
    //EPSG代码
    epsg_code: Sequelize.INTEGER,
    time: {
        type: Sequelize.DATE,
        primaryKey: true,
        get() {
            return new Date(new Date(this.getDataValue('time')).getTime() + 8 * 60 * 60 * 1000).toISOString()
        },
    }
}, {
    timestamps: true
});
Mine.hasMany(FileMetadata, {
    foreignKey: 'mine_id',
    sourceKey: 'mine_id'
});
FileMetadata.belongsTo(Mine, {
    foreignKey: 'mine_id',
    targetKey: 'mine_id'
});
Mine.hasMany(VectorData, {
    foreignKey: 'mine_id',
    sourceKey: 'mine_id'
});
VectorData.belongsTo(Mine, {
    foreignKey: 'mine_id',
    targetKey: 'mine_id'
});

// 可视化数据
const VisualData = sequelize.define('VisualData', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false,
    }
}, {
    tableName: 'visual_data',
});

// 可视化数据详情
const VisualDataDetail = sequelize.define('VisualDataDetail', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    main_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: VisualData,
            key: 'id'
        }
    },
    label: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    data_type: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    layers: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: 'visual_data_detail',
});


VisualData.hasMany(VisualDataDetail, {
    foreignKey: 'main_id'
});
VisualDataDetail.belongsTo(VisualData, {
    foreignKey: 'main_id'
});

//初始化hdfs
async function initHDFS() {
    if (config.hadoop.init) {
        //调用hdfs_init.py
        const command = `python ./scripts/hdfs_init.py`;
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
            }
            console.log(`初始化HDFS成功`);
        });
    }
}

async function syncDatabase() {
    if (config.database.init) {
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
        await sequelize.query('CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;');
    }
    await sequelize.sync({
        force: config.database.init
    }).then(async () => {
        console.log('数据库已同步');
        if (config.database.init) {
            sequelize.query(
                fs.readFileSync(path.join(__dirname, './create_hypertable.sql')).toString()
            );

            sequelize.query(
                fs.readFileSync(path.join(__dirname, './create_gist.sql')).toString()
            );
            
        }


        // 创建管理员用户 
        let user = await User.findOne({
            where: {
                username: 'admin'
            }
        });
        if (!user) {
            await User.create({
                username: 'admin',
                password: 'admin',
                email: 'admin@admin.com',
                name: 'admin',
                role: 1
            });
            const visualData = await VisualData.create({
                label: '测试矿山'
            });

            await VisualDataDetail.bulkCreate([{
                    main_id: visualData.id,
                    label: '2024-03-01',
                    data_type: 'DEM',
                    url: 'http://localhost:8000/dem/测试矿山/2024-03-01/',
                    layers: null
                },
                {
                    main_id: visualData.id,
                    label: '2024-03-01',
                    data_type: 'OSGB',
                    url: 'http://localhost:8000/osgb/测试矿山/2024-03-01/tileset.json',
                    layers: null
                },
                {
                    main_id: visualData.id,
                    label: '2024-03-01',
                    data_type: 'PointCloud',
                    url: 'http://localhost:8000/pointcloud/测试矿山/2024-03-01/tileset.json',
                    layers: null
                },
                {
                    main_id: visualData.id,
                    label: '2024-03-01正射影像',
                    data_type: 'Raster',
                    url: 'http://localhost:8080/geoserver/cloudgis/wms',
                    layers: 'cloudgis:dom'
                },
                {
                    main_id: visualData.id,
                    label: '2024-03-01NDVI',
                    data_type: 'Raster',
                    url: 'http://localhost:8080/geoserver/cloudgis/wms',
                    layers: 'cloudgis:ndvi'
                },
                {
                    main_id: visualData.id,
                    label: '矿山边界',
                    data_type: 'Vector',
                    url: 'http://localhost:8000/mines/getBoundaryPolygon?mine_name=测试矿山',
                    layers: null
                },
                {
                    main_id: visualData.id,
                    label: '环境传感器位置',
                    data_type: 'Vector',
                    url: 'http://localhost:8000/locations/getPoints?mine_name=测试矿山',
                    layers: null
                },
            ]);
            let mine = await Mine.create({
                mine_name: '测试矿山',
                mine_type: '测试矿山',
                mine_address: '测试矿山',
                regulatory_body_id: 1,
                primary_contact_name: '张三',
                primary_contact_phone: '123456789',
                dispatch_office_phone: '123456789',
                operational_status: '运营中'
            })

        }
    }).catch(err => {
        console.log(err);
        console.log('数据库同步失败');;
    });
}
syncDatabase();
initHDFS()
// 导出模型
module.exports = {
    sequelize,
    User,
    Mine,
    RemoteSensingMetadata,
    RasterDataMetadata,
    FileMetadata,
    VectorData,
    VisualData,
    VisualDataDetail
};