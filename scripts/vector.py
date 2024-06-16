import sys
import json
from osgeo import ogr

# 从命令行获取文件路径
file_path = sys.argv[1]

# 打开GeoJSON文件
dataSource = ogr.Open(file_path)
layer = dataSource.GetLayer()

# 获取坐标系统
spatialRef = layer.GetSpatialRef()
coordinate_system = spatialRef.GetAttrValue('GEOGCS')
epsg_code = spatialRef.GetAttrValue('AUTHORITY', 1)

# 获取几何类型
feature = layer.GetNextFeature()
geometry = feature.GetGeometryRef()
geometry_type = geometry.GetGeometryName()

# 获取几何数据
geometry_data = []
layer.ResetReading()
for feature in layer:
    geometry = feature.GetGeometryRef()
    geometry_data.append(json.loads(geometry.ExportToJson()))

# 生成json数据
data = {
    'geometry_type': geometry_type,
    'coordinate_system': coordinate_system,
    'epsg_code': epsg_code,
    # 'geometry_data': {
    #     'crs':{
    #         'type': 'name',
    #         'properties': {
    #             'name': 'EPSG:'+epsg_code
    #         }
    #     },
    #     'type': 'GeometryCollection',
    #     'geometries': geometry_data
    # },
}

# 打印json数据
print(json.dumps(data, indent=4))
