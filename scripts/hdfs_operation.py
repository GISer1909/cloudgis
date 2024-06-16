import sys
from hdfs import InsecureClient
# 从config.json中读取Hadoop的配置信息
import json
config = json.load(open('config.json', 'r'))
client = InsecureClient(f'http://{config["hadoop"]["host"]}:{config["hadoop"]["port"]}')
def upload_to_hdfs(local_path, hdfs_path):
    client.upload(hdfs_path, local_path)

def delete_from_hdfs(hdfs_path):
    client.delete(hdfs_path)

def move_from_hdfs_to_local(hdfs_path, local_path):
    client.download(hdfs_path, local_path)


if __name__ == "__main__":
    local_path = sys.argv[1]
    hdfs_path = sys.argv[2]
    operation = sys.argv[3]
    if operation.lower() == "add":
        upload_to_hdfs(local_path, hdfs_path)
    elif operation.lower() == "delete":
        delete_from_hdfs(hdfs_path)
    elif operation.lower() == "move":
        move_from_hdfs_to_local(hdfs_path, local_path)
    else:
        print("Invalid operation. Please enter 'add' to upload a file, 'delete' to delete a file, or 'move' to move a file.")




