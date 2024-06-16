CREATE INDEX mines_boundary_polygon_index ON mines USING gist (boundary_polygon);
CREATE INDEX remote_sensing_metadata_spatial_coverage_index ON remote_sensing_metadata USING gist (spatial_coverage);
CREATE INDEX raster_data_metadata_spatial_coverage_index ON raster_data_metadata USING gist (spatial_coverage);
