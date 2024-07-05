from flask import Flask, send_from_directory,jsonify, request as flask_request
from flask_cors import CORS
import sys
sys.path.append('..')
from utils.workflow_utils import run_workflow, upload_image,output_images
import json
app = Flask(__name__)
CORS(app)
# 定义路由，使得外部可以直接访问图片
@app.route('/images/<filename>')
def get_image(filename):
    return send_from_directory('/root/static/images', filename)
# 上传图片
@app.route('/upload', methods=['POST'])
def upload():
    try:
        # 获取文件
        data = flask_request.get_json()
        image_name = data.get('image_name')
        image_base64 = data.get('image_base64')
        # 把图片上传到comfyui 
        upload_response = upload_image(image_name, image_base64)
        if upload_response.status_code == 200:
            output_type = 'image'
            prompt_workflow = json.load(open('/root/data/sticker_api.json'))
            prompt_workflow['22']['inputs']['image'] = image_name
            prompt_id = run_workflow(prompt_workflow)
            return jsonify({"prompt_id": prompt_id})
        else:
            return jsonify({"error": upload_response.status_code}), 500
    except Exception as e:
        return jsonify({'error': f'Error {str(e)}'}), 500
# 获取output内容
@app.route('/get_output', methods=['POST'])
def get_output():
    try:
        data = flask_request.get_json()
        prompt_id = data.get('prompt_id')
        response = output_images(prompt_id)
        return response;
    except Exception as e:
        return jsonify({'error': f'Error {str(e)}'}), 500
        
if __name__ == '__main__':
    app.run(debug=True, port=6008)



