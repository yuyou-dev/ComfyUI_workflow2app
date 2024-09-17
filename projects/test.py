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
    # 加载工作流
    prompt_workflow = json.load(open('./workflow_api.json'))

    queue_response = run_workflow("server base", prompt_workflow)
    queue_response_data = queue_response.json()

    return queue_response_data


if __name__ == '__main__':
    app.run(port=6006)
