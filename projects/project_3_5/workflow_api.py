from flask import Flask, request as flask_request, Response, jsonify
from comfy_sdk import select_random_server, run_workflow, upload_file, history, show_result
import json

app = Flask(__name__)

# 配置目标服务器的URL数组
target_urls = [
    'https://xxxxx-xxxx-xxxxxx',
    None,
    None,
    None,
    None
]


# 统一的响应函数
def create_response(data=None, code=10000, message="Success"):
    response = {
        "code": code,
        "message": message
    }
    if data:
        response["data"] = data
    return jsonify(response), 200 if str(code).startswith('1000') else 500

# init 分配到哪台服务器 返回index
@app.route('/init', methods=['GET'])
def init():
    try:
        
        target_url, selected_index = select_random_server(target_urls)
        print(target_url)
        print(selected_index)
        return create_response({"selected_index": selected_index})
    except Exception as e:
        return create_response(code=40001, message=f"Error: {str(e)}")

# 上传视频
@app.route('/upload', methods=['POST'])
def upload():
    try:
        # 获取上传的文件
        uploaded_file = flask_request.files['file']
        original_filename = uploaded_file.filename  # 获取原始文件名
        selected_index = flask_request.form.get('selected_index')
        # 转发上传请求
        files = {'image': (original_filename, uploaded_file.stream, uploaded_file.mimetype)}        
        data = {'subfolder': 'video'}
        print(target_urls[int(selected_index)],'target_urls[selected_index]')
        #上传文件并返回参数
        file_response = upload_file(target_urls[int(selected_index)],files,data)
        file_response_data = file_response.json()
        print(file_response_data)
        # 调用 queue 函数处理后续工作流
        return create_response(file_response_data)
    except Exception as e:
        return create_response(code=40002, message=f"Error: {str(e)}")

@app.route('/queue', methods=['POST'])
def queue():
    try:
        data = flask_request.get_json()
        gender_index = data.get('gender_index')
        selected_index = data.get('selected_index')
        file_response_data = data.get('file_response_data')
        
        print(data)
        print(gender_index)
        print(selected_index)
        print(file_response_data)

        # 加载并修改工作流参数
        prompt_workflow = json.load(open('./workflow_api.json'))
        prompt_workflow['39']['inputs']['video'] = f"{file_response_data['subfolder']}/{file_response_data['name']}"

        if int(gender_index) == 0:
            prompt_workflow['11']['inputs']['text_positive'] = 'chibi:2, a man with black clothes, jeans, cute, Kawaii, (full body:2), Standing:2, shoe:2, (blue clean background), (Highly saturated background), PVC material, silicone material, standing character, soft smooth lighting, soft pastel colors, skottie young, 3d blender render, polycount, modular constructivism, pop surrealism, physically based rendering, square image'
        else:
            prompt_workflow['11']['inputs']['text_positive'] = 'chibi:2, a girl with skirt, cute, Kawaii, (full body:2), Standing:2, shoe:2, (blue clean background), (Highly saturated background), PVC material, silicone material, standing character, soft smooth lighting, soft pastel colors, skottie young, 3d blender render, polycount, modular constructivism, pop surrealism, physically based rendering, square image'

        queue_response = run_workflow(target_urls[int(selected_index)], prompt_workflow)
        queue_response_data = queue_response.json()

        return create_response(queue_response_data)
    except Exception as e:
        return create_response(code=40002, message=f"Error: {str(e)}")

# 轮询history
@app.route('/get_output', methods=['POST'])
def get_output():
    try:
        data = flask_request.get_json()
        prompt_id = data.get('prompt_id')
        selected_index = data.get('selected_index')
        response_content = history(target_urls[int(selected_index)], prompt_id).json()
        if not response_content.get(prompt_id, {}):
            return create_response({"outputs_video": None}, code=10002, message="The value is an empty dictionary.")
        else:
            outputs_video = response_content[prompt_id]['outputs']['46']
            return create_response({"outputs_video": outputs_video})
    except Exception as e:
        return create_response(code=40002, message=f"Error: {str(e)}")

# 显示
@app.route('/view')
def view():
    try:
        filename = flask_request.args.get('filename')
        selected_index = flask_request.args.get('selected_index')
        if not filename:
            return create_response(code=40003, message="Filename is required")

        response = show_result(target_urls[int(selected_index)], filename)
        return Response(response.content, content_type=response.headers['Content-Type'])
    except Exception as e:
        return create_response(code=40002, message=f"Error: {str(e)}")

if __name__ == '__main__':
    app.run(port=6020)
