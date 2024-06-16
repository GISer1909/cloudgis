import sys
import json
from osgeo import gdal, osr

# 从命令行获取文件路径
file_path = sys.argv[1]

# 打开tif文件
dataset = gdal.Open(file_path)

# 获取并设置原始坐标系
spatialRef = osr.SpatialReference(wkt=dataset.GetProjection())
spatialRef.AutoIdentifyEPSG()
sourceEPSG = spatialRef.GetAuthorityCode(None)
sourceSR = osr.SpatialReference()
sourceSR.ImportFromEPSG(int(sourceEPSG))
sourceSR.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)  # 设置为GIS传统顺序，即（Longitude，Latitude）

# 获取空间范围
geoTransform = dataset.GetGeoTransform()
minx = geoTransform[0]
maxy = geoTransform[3]
maxx = minx + geoTransform[1] * dataset.RasterXSize
miny = maxy + geoTransform[5] * dataset.RasterYSize

# 计算中心坐标
center_x = (minx + maxx) / 2
center_y = (miny + maxy) / 2

# 创建目标坐标系（EPSG:4326）
targetSR = osr.SpatialReference()
targetSR.ImportFromEPSG(4326)
targetSR.SetAxisMappingStrategy(osr.OAMS_TRADITIONAL_GIS_ORDER)  # 设置为GIS传统顺序，即（Longitude，Latitude）

# 创建坐标转换对象
coordTrans = osr.CoordinateTransformation(sourceSR, targetSR)

# 转换中心坐标
center_lon, center_lat, _ = coordTrans.TransformPoint(center_x, center_y)
#转换空间范围
min_lon, min_lat, _ = coordTrans.TransformPoint(minx, maxy)
max_lon, max_lat, _ = coordTrans.TransformPoint(maxx, miny)

# 生成json数据
data = {
    'projection_crs': sourceSR.GetAttrValue('PROJCS'),
    'geographic_crs': sourceSR.GetAttrValue('GEOGCS'),
    'center_latitude': center_lat,
    'center_longitude': center_lon,
    'epsg_code': sourceEPSG,
    'spatial_coverage': {
      'crs':{
        'type': 'name',
        'properties': {
          'name': 'EPSG:4326' 
        }
      },
      'type': 'Polygon',
        'coordinates': [[
          [min_lon, min_lat],
          [min_lon, max_lat],
          [max_lon, max_lat],
          [max_lon, min_lat],
          [min_lon, min_lat]
        ]],
      }
    }

# 打印json数据
print(json.dumps(data, indent=4))
