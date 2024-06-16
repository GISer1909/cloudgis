CREATE EXTENSION IF NOT EXISTS postgis
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE
-- 创建矿山信息表
CREATE TABLE mines (
    mine_id INT PRIMARY KEY,
    mine_name VARCHAR(255),
    mine_type VARCHAR(255),
    mine_address VARCHAR(255),
    regulatory_body_id INT,
    primary_contact_name VARCHAR(255),
    primary_contact_phone VARCHAR(255),
    dispatch_office_phone VARCHAR(255),
    operational_status VARCHAR(255),
    boundary_polygon GEOMETRY(POLYGON),
    center_coordinates GEOMETRY(POINT)
);

-- 创建地点数据表
CREATE TABLE locations (
    location_id INT PRIMARY KEY,
    position GEOMETRY(POINT),
    description VARCHAR(255),
    mine_id INT,
    FOREIGN KEY (mine_id) REFERENCES mines(mine_id)
);

-- 创建噪声数据表
CREATE TABLE noise_data (
    sensor_id INT,
    measurement_time TIMESTAMP,
    noise_level FLOAT,
    location_id INT,
    PRIMARY KEY (sensor_id, measurement_time),
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

-- 创建空气质量数据表
CREATE TABLE air_quality_data (
    sensor_id INT,
    measurement_time TIMESTAMP,
    pm25_concentration FLOAT,
    pm10_concentration FLOAT,
    location_id INT,
    PRIMARY KEY (sensor_id, measurement_time),
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

-- 创建水质数据表
CREATE TABLE water_quality_data (
    sensor_id INT,
    measurement_time TIMESTAMP,
    ph_value FLOAT,
    location_id INT,
    PRIMARY KEY (sensor_id, measurement_time),
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

-- 创建土壤数据表
CREATE TABLE soil_data (
    sensor_id INT,
    measurement_time TIMESTAMP,
    soil_moisture FLOAT,
    location_id INT,
    PRIMARY KEY (sensor_id, measurement_time),
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

-- 创建粉尘数据表
CREATE TABLE dust_data (
    sensor_id INT,
    measurement_time TIMESTAMP,
    dust_concentration FLOAT,
    location_id INT,
    PRIMARY KEY (sensor_id, measurement_time),
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

-- 创建位移数据表
CREATE TABLE displacement_data (
    sensor_id INT,
    measurement_time TIMESTAMP,
    displacement FLOAT,
    location_id INT,
    PRIMARY KEY (sensor_id, measurement_time),
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);

-- 创建气象数据表
CREATE TABLE weather_data (
    sensor_id INT,
    measurement_time TIMESTAMP,
    air_temperature FLOAT,
    air_humidity FLOAT,
    wind_speed FLOAT,
    wind_direction VARCHAR(255),
    rainfall FLOAT,
    location_id INT,
    PRIMARY KEY (sensor_id, measurement_time),
    FOREIGN KEY (location_id) REFERENCES locations(location_id)
);


CREATE TABLE remote_sensing_metadata (
    id SERIAL,
    product_name VARCHAR(255),
    band_info VARCHAR(255),
    cloud_coverage INT,
    acquisition_time TIMESTAMP,
    image_quality INT,
    processing_level VARCHAR(255),
    projection_crs VARCHAR(255),
    geographic_crs VARCHAR(255),
    center_latitude FLOAT,
    center_longitude FLOAT,
    spatial_coverage GEOMETRY(POLYGON),
    data_source VARCHAR(255),
    image_path VARCHAR(255),
    PRIMARY KEY (id, acquisition_time)
);

CREATE TABLE raster_data_metadata (
    data_id INT,
    mine_id INT,
    file_path VARCHAR(255),
    band_info VARCHAR(255),
    raw_data VARCHAR(255),
    processing_description VARCHAR(255),
    description VARCHAR(255),
    time TIMESTAMP,
    projection_crs VARCHAR(255),
    geographic_crs VARCHAR(255),
    center_latitude FLOAT,
    center_longitude FLOAT,
    spatial_coverage GEOMETRY(POLYGON),
    PRIMARY KEY (data_id, time),
    FOREIGN KEY (mine_id) REFERENCES mines(mine_id)
);

CREATE TABLE point_cloud_metadata (
    data_id INT,
    data_name VARCHAR(255),
    acquisition_time TIMESTAMP,
    data_source VARCHAR(255),
    point_count INT,
    coordinate_system VARCHAR(255),
    format VARCHAR(255),
    file_path VARCHAR(255),
    mine_id INT,
    spatial_coverage GEOMETRY(POLYGON),
    PRIMARY KEY (data_id, acquisition_time),
    FOREIGN KEY (mine_id) REFERENCES mines(mine_id)
);

CREATE TABLE oblique_photography_metadata (
    data_id INT,
    model_name VARCHAR(255),
    capture_time TIMESTAMP,
    coordinate_system VARCHAR(255),
    file_format VARCHAR(255),
    file_path VARCHAR(255),
    mine_id INT,
    PRIMARY KEY (data_id, capture_time),
    FOREIGN KEY (mine_id) REFERENCES mines(mine_id)
);

CREATE TABLE dem_metadata (
    data_id INT,
    mine_id INT,
    file_path VARCHAR(255),
    description VARCHAR(255),
    time TIMESTAMP,
    projection_crs VARCHAR(255),
    geographic_crs VARCHAR(255),
    center_latitude FLOAT,
    center_longitude FLOAT,
    spatial_coverage GEOMETRY(POLYGON),
    PRIMARY KEY (data_id, time),
    FOREIGN KEY (mine_id) REFERENCES mines(mine_id)
);

CREATE TABLE file_metadata (
    data_id INT,
    mine_id INT,
    file_path VARCHAR(255),
    description VARCHAR(255),
    time TIMESTAMP,
    file_format VARCHAR(255),
    PRIMARY KEY (data_id, time),
    FOREIGN KEY (mine_id) REFERENCES mines(mine_id)
);

CREATE TABLE vector_data (
    data_id INT,
    mine_id INT,
    geometry_type VARCHAR(255),
    coordinate_system VARCHAR(255),
    geometry_data GEOMETRY,
    attribute_data JSON,
    description VARCHAR(255),
    time TIMESTAMP,
    PRIMARY KEY (data_id, time),
    FOREIGN KEY (mine_id) REFERENCES mines(mine_id)
);
-- 将噪声数据表转换为超表
SELECT create_hypertable('noise_data', 'measurement_time');

-- 将空气质量数据表转换为超表
SELECT create_hypertable('air_quality_data', 'measurement_time');

-- 将水质数据表转换为超表
SELECT create_hypertable('water_quality_data', 'measurement_time');

-- 将土壤数据表转换为超表
SELECT create_hypertable('soil_data', 'measurement_time');

-- 将粉尘数据表转换为超表
SELECT create_hypertable('dust_data', 'measurement_time');

-- 将位移数据表转换为超表
SELECT create_hypertable('displacement_data', 'measurement_time');

-- 将气象数据表转换为超表
SELECT create_hypertable('weather_data', 'measurement_time');

-- 将遥感数据元数据表转换为超表
SELECT create_hypertable('remote_sensing_metadata', 'acquisition_time');

-- 将光栅数据元数据表转换为超表
SELECT create_hypertable('raster_data_metadata', 'time');

-- 将点云元数据表转换为超表
SELECT create_hypertable('point_cloud_metadata', 'acquisition_time');

-- 将倾斜摄影元数据表转换为超表
SELECT create_hypertable('oblique_photography_metadata', 'capture_time');

-- 将数字高程模型元数据表转换为超表
SELECT create_hypertable('dem_metadata', 'time');

-- 将文件元数据表转换为超表
SELECT create_hypertable('file_metadata', 'time');

-- 将矢量数据表转换为超表
SELECT create_hypertable('vector_data', 'time');
