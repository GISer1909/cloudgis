import sys
from hdfs import InsecureClient
import json

config = json.load(open('config.json', 'r'))
client = InsecureClient(f'http://{config["hadoop"]["host"]}:{config["hadoop"]["port"]}')

# 创建文件夹
def create_hdfs_directory(hdfs_path):
    client.makedirs(hdfs_path)

# 递归删除文件夹
def delete_hdfs_directory(hdfs_path):
    # 获取目录下的所有文件和子目录
    contents = client.list(hdfs_path, status=True)
    
    for path, status in contents:
        full_path = hdfs_path + '/' + path
        if status['type'] == 'DIRECTORY':
            # 如果是子目录，递归删除
            delete_hdfs_directory(full_path)
        else:
            # 如果是文件，直接删除
            client.delete(full_path)
    
    # 删除空目录
    client.delete(hdfs_path)

if __name__ == "__main__":
    # 删除HDFS上的所有文件和文件夹
    delete_hdfs_directory('/')

    # 创建新的文件夹
    folders = [ '/file', '/vector', '/raster', '/rs']
    for folder in folders:
        create_hdfs_directory(folder)
