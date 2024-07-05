from flask import Flask, send_from_directory,jsonify, request as flask_request
from flask_cors import CORS
import sys
sys.path.append('..')
from utils.workflow_utils import run_workflow,output_images
import json
app = Flask(__name__)
CORS(app)
# 定义路由，使得外部可以直接访问图片
@app.route('/images/<filename>')
def get_image(filename):
    return send_from_directory('/root/static/images', filename)
# 上传
@app.route('/upload', methods=['POST'])
def upload():
    try:
        # 获取前端传过来的文本信息   
        data = flask_request.get_json()
        text = data.get('text')
        print(text)
        prompt_workflow = json.load(open('/root/data/default_api.json'))
        # 替换输入文本
        prompt_workflow['6']['inputs']['text'] = text
        # 运行workflow
        prompt_id = run_workflow(prompt_workflow)
        return jsonify({"prompt_id": prompt_id})
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



