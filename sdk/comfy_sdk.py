import random
import json
import requests



# url检查服务器是否在线
def is_server_online(url, timeout=5):
    try:
        response = requests.get(url, timeout=timeout)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False

def select_random_server(target_urls):
    # 只返回不是 None 的随机 URL
    online_servers = [(index, url) for index, url in enumerate(target_urls) if url is not None]
    if not online_servers:
        raise Exception("No servers are online.")
    selected_index, selected_url = random.choice(online_servers)
    return selected_url, selected_index

# 运行工作流，返回prompt_id
def run_workflow(selected_url,prompt_workflow):
    p = {"prompt": prompt_workflow}
    data = json.dumps(p).encode('utf-8')
    headers = {
        'Content-Type': 'application/json',  # 确保请求头正确
        'Accept': 'application/json'  # 如果服务器期望返回 JSON
    }
    response = proxy_request(f"{selected_url}",'/prompt','POST', data=data,headers=headers)
    return response


# 上传文件
def upload_file(target_url,files,data=None):
    try:
        print(target_url)
        response = proxy_request(target_url,'/upload/image','POST', files=files,data=data)
        return response
    except Exception as e:
        print(f"Error fetching upload_img: {e}")
        return None

# 查看运行的结果
def history(target_url,prompt_id):
    try:
        data={prompt_id:prompt_id}
        response = proxy_request(target_url,'/history','GET', data=data)
        print(response)
        return response
    except Exception as e:
        print(f"Error fetching history: {e}")
        return None
# 查看图片
def show_result(target_url, filename):

    try:
        params = {
            'filename': filename
        }
        response = proxy_request(target_url, '/api/view', 'GET', params=params)
        if isinstance(response, dict):  # 处理代理请求失败的情况
            return jsonify({'error': response['content']}), response['status_code']
        # 返回视频内容给客户端
        return response
    
    except Exception as e:
        print(f"Error fetching image: {e}")
        return None
    
# 通用代理转发
def proxy_request(target_url, path, method, params=None, data=None, headers=None, cookies=None,files=None):
    url = f"{target_url}{path}"
    try:
        response = requests.request(
            method=method,
            url=url,
            headers=headers,
            params=params,
            data=data,
            files=files,
            cookies=cookies,
            allow_redirects=False
        )
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return {
            'status_code': 502,
            'content': f"Request failed: {e}"
        }

