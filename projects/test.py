from flask import Flask, request as flask_request, Response, jsonify
from comfy_sdk import select_random_server, run_workflow, upload_file, history, show_result
import json

app = Flask(__name__)

@app.route('/test', methods=['GET'])
def upload():
    key = flask_request.args.get('key')
    return key

@app.route('/queue', methods=['POST'])
def queue():
    try:
        # 加载并修改工作流参数
        prompt_workflow = json.load(open('./workflow_api.json'))

        queue_response = run_workflow("server base", prompt_workflow)
        queue_response_data = queue_response.json()

        return create_response(queue_response_data)
    except Exception as e:
        return create_response(code=40002, message=f"Error: {str(e)}")


if __name__ == '__main__':
    app.run(port=6006)