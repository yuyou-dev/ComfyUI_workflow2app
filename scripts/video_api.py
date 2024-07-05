from flask import Flask, send_from_directory,jsonify, request as flask_request
from flask_cors import CORS
import sys
sys.path.append('..')
from utils.workflow_utils import run_workflow,output_video
import json
from werkzeug.utils import secure_filename
# 获取视频属性
# from moviepy.editor import VideoFileClip
import os
app = Flask(__name__)
CORS(app)
# 定义路由，使得外部可以直接访问图片
@app.route('/video/<filename>')
def get_image(filename):
    return send_from_directory('/root/static/video', filename)
# 上传图片
@app.route('/upload', methods=['POST'])
def upload():
    try:
        # 把视频上传到comfyui 
        if 'file' not in flask_request.files:
            return '没有文件部分在请求中', 400
        file = flask_request.files['file']
 
        if file:
            filename = secure_filename(file.filename)
            file_path = os.path.join('/root/ComfyUI/input/video/', filename)
            file.save(file_path)
            # # 使用 moviepy 获取视频时长
            # clip = VideoFileClip(file_path)
            # duration = clip.duration  # 获取视频时长，单位为秒
            # clip.close()  # 关闭clip以释放资源
            # 限制最大时长为5秒
            # max_duration = min(duration, 5)
            # print(max_duration)
            # 获取性别
            genderIndex = flask_request.form.get('genderIndex')
            print(genderIndex,'选择性别')
            prompt_workflow = json.load(open('/root/data/video_api.json'))
            if int(genderIndex) == 0:
                prompt_workflow['11']['inputs']['text_positive'] = 'chibi:2, a man with black clothes,jeans,cute,Kawaii,(full body:2),Standing:2,shoe:2,(blue clean background),(Highly saturated background),PVC material, silicone material，standing character, soft smooth lighting, soft pastel colors, skottie young, 3d blender render, polycount, modular constructivism, pop surrealism, physically based rendering, square image'
            else:
                prompt_workflow['11']['inputs']['text_positive'] = 'chibi:2, a girl with skirt,cute,Kawaii,(full body:2),Standing:2,shoe:2,(blue clean background),(Highly saturated background),PVC material, silicone material，standing character, soft smooth lighting, soft pastel colors, skottie young, 3d blender render, polycount, modular constructivism, pop surrealism, physically based rendering, square image'
                
        
            prompt_workflow['39']['inputs']['video'] = 'video/'+filename
            # prompt_workflow['39']['inputs']['video_segment_frames'] = int(max_duration * 12)  # 设置帧数
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
        response = output_video(prompt_id)
        return response;
    except Exception as e:
        return jsonify({'error': f'Error {str(e)}'}), 500
        
if __name__ == '__main__':
    app.run(debug=True, port=6008)



