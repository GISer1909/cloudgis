                -- 将遥感数据元数据表转换为超表
                SELECT create_hypertable('remote_sensing_metadata', 'acquisition_time');
                
                -- 将光栅数据元数据表转换为超表
                SELECT create_hypertable('raster_data_metadata', 'time');
                
                -- 将文件元数据表转换为超表
                SELECT create_hypertable('file_metadata', 'time');
                
                -- 将矢量数据表转换为超表
                SELECT create_hypertable('vector_data', 'time');