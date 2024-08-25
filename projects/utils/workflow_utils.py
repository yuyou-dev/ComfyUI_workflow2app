import json
import time
from flask import Flask,jsonify, request as flask_request
import requests
import urllib.request
import os
import shutil
from datetime import datetime
import base64
from PIL import Image
from io import BytesIO
# 从 Flask 主文件移过来的全局变量
base_url = "http://127.0.0.1:6008"
interrupt_node = False
def queue_prompt(prompt_workflow):
    p = {"prompt": prompt_workflow}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(f"{base_url}/prompt", data=data)
    response = urllib.request.urlopen(req)
    response_data = response.read().decode('utf-8')
    return response_data
def history(prompt_id):
    req = urllib.request.Request(f"{base_url}/history/{prompt_id}")
    try:
        response = urllib.request.urlopen(req)
        response_data = response.read().decode('utf-8')
        return response_data
    except Exception as e:
        print(f"Error fetching history: {e}")
        return None

# 运行工作流，返回prompt_id
def run_workflow(prompt_workflow):
    try:
        response = queue_prompt(prompt_workflow)
        response_json = json.loads(response)
        prompt_id = response_json.get('prompt_id')
        return prompt_id;
    except Exception as e:
        return jsonify({'error2': f'Error processing workflow: {str(e)}'}), 500
def get_images(urls):
    """ 根据 URL 列表获取图片并返回 PIL 图片对象的列表。"""
    images = []
    for url in urls:
        response = requests.get(f'/root/autodl-tmp/outputs/{url}')
        img = Image.open(BytesIO(response.content))
        images.append(img)
    return images
def combine_images(image_paths, layout):
    """ 合并图片列表为一张大图，按照给定的布局 (行数和列数)。"""
    if not image_paths:
        return None
    images = [Image.open(f'/root/autodl-tmp/outputs/{image_path}') for image_path in image_paths]
    print(images)
    num_images = len(images)
    print(num_images)
    cols, rows = layout
    assert cols * rows >= num_images, "布局小于图片数量"

    # 确定单个图片的大小
    width, height = images[0].size
    # 创建一个新的图片，用于放置合并后的大图
    combined_image = Image.new('RGBA', (width * cols, height * rows), (0, 0, 0, 0))  # 使用 RGBA 模式并设置透明背景
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    output_filename = f"output_{timestamp}.png"
    # 确保目录存在
    output_dir = "/root/autodl-tmp/outputs/"
    output_path = os.path.join(output_dir, output_filename)
    # 按行列布局将图片拼接到大图上
    for index, image in enumerate(images):
        row = index // cols
        col = index % cols
        combined_image.paste(image, (col * width, row * height))
    combined_image.save(output_path)
    return output_filename
# 获取生成的图片
def output_images(prompt_id):
    response_content = json.loads(history(prompt_id))
    print(response_content)
    if not response_content.get(prompt_id, {}):
        return jsonify({"code": 10002, "message": "The value is an empty dictionary."})
    else:
        # 提取该 prompt_id 对应的 outputs 部分
        outputs = response_content[prompt_id]['outputs']
        print(outputs)
        # 初始化一个空列表来存储所有符合条件的图片信息
        output_images = []
        # 遍历 outputs 字典
        for key, value in outputs.items():
            # 检查每个 value 中的列表，看其 'type' 是否为 'output'
            for image_info in value['images']:
                if image_info['type'] == 'output':
                    # 如果是 'output' 类型，添加整个图片信息到列表
                    output_images.append(image_info)
        if len(output_images) > 1:
             # 获取 PIL 图片对象列表
            img_urls = [img['filename'] for img in output_images]
            
            # images = get_images(img_urls)
            # print(get_images)
             # 定义布局为两行两列
            final_image = combine_images(img_urls, (2, 2))
            print(final_image)
        else:
            final_image = output_images[0]['filename']
        img_urls_new = get_static_url(final_image,'images')
        return jsonify({ "code": 10000, "img_urls": img_urls_new})

# 获取生成的视频
def output_video(prompt_id):
    response_content = json.loads(history(prompt_id))
    print(response_content)
    if not response_content.get(prompt_id, {}):
        return jsonify({"code": 10002, "message": "The value is an empty dictionary."})
    else:
        # 提取该 prompt_id 对应的 outputs 部分
        outputs = response_content[prompt_id]['outputs']
        output_files = []
        # 遍历 outputs 字典
        # 遍历outputs中的所有键
        for key in outputs:
            # 检查这个键是否包含gifs
            if 'gifs' in outputs[key]:
                print(outputs[key])
                # 遍历gifs列表
                for gif in outputs[key]['gifs']:
                    print(outputs[key]['gifs'])
                    # 检查type是否为output
                    if gif.get('type') == 'output':
                        output_files.append(gif['filename'])
                        
        output_files_new = get_static_url(output_files[0],'video')
        
        return jsonify({ "code": 10000, "video_urls": output_files[0]})
        
        # 初始化一个空列表来存储所有符合条件的图片信息
        
# 把生成的图片放到静态目录，以便于外部查看
def get_static_url(url,_type):
    try:
        # Check if the local image file exists
        source_path = f'/root/autodl-tmp/outputs/{url}'
        if os.path.exists(source_path):
            # Define the destination path
            destination_dir = f'/root/static/{_type}/'
            destination_path = os.path.join(destination_dir, url)
            
            # Ensure the destination directory exists
            if not os.path.exists(destination_dir):
                os.makedirs(destination_dir)
                
            shutil.copy(source_path, destination_path)
            return url
        else:
            return {'error': 'Local image file not found'}
    except Exception as e:
        return {'error': f'Error fetching or encoding image: {str(e)}'}
# 上传图片
def upload_image(image_name, image_data):
    try:
        print('upload_img')
        url = f"{base_url}/upload/image"
        image_data = base64.b64decode(image_data)
        files = {'image': (image_name, BytesIO(image_data))}
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, files=files)
        return response
    except Exception as e:
        print(f"Error fetching upload_img: {e}")
        return None
# 检索上传内容的input所在位置
def update_prompt_workflow(file_path, class_type, input_name,input_type):
    """更新 JSON 文件中具有指定 class_type 的 image 属性，并返回更新后的数据"""
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
        
        updated = False
        for key, value in data.items():
            if value.get("class_type") == class_type:
                if 'inputs' in value and input_type in value['inputs']:
                    value['inputs'][input_type] = input_name
                    updated = True

        if updated:
            return data  # 返回更新后的数据
        else:
            return None
    except Exception as e:
        print(f"Error updating JSON: {str(e)}")
        return None