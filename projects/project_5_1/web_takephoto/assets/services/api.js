// api.js - 负责与后端 API 的通信

const API_TIMEOUT = 300000; // 300 seconds

export class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl || "http://192.168.31.101:6020"; // 默认 API 地址，可以通过传参自定义
    }

    // 带有超时控制的 fetch 请求
    async fetchWithTimeout(url, options, timeout = API_TIMEOUT) {
        const controller = new AbortController();
        const signal = controller.signal;
        const id = setTimeout(() => {
            controller.abort(); // 超时后中止请求
        }, timeout);
    
        try {
            const response = await fetch(url, { ...options, signal });
            clearTimeout(id); // 请求完成后清除超时定时器
            
    
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            return await response.json();
        } catch (error) {
            // clearTimeout(id); // 捕获错误时也要清除定时器
            if (error.name === "AbortError") {
                console.error("Fetch request timed out");
                throw new Error("Request timed out");
            } else {
                console.error("Fetch failed:", error);
                throw error;
            }
        }
    }
    
    // 初始化服务器（获取 selectedIndex 等信息）
    async initServer() {
        const url = `${this.baseUrl}/init`;
        return this.fetchWithTimeout(url, { method: 'GET' });
    }

    // 上传图像
    async uploadImage(file, selectedIndex, rotatePitch) {
        const url = `${this.baseUrl}/upload`;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('selected_index', selectedIndex);

        return this.fetchWithTimeout(url, {
            method: 'POST',
            body: formData,
        });
    }

    // 将图像加入队列
    async queueImage(selectedIndex, fileResponseData, rotatePitch) {
        const url = `${this.baseUrl}/queue`;
        const body = JSON.stringify({
            selected_index: selectedIndex,
            file_response_data: fileResponseData,
            rotate_pitch: rotatePitch
        });

        return this.fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });
    }

    // 获取生成的图像
    async getGeneratedImage(promptId, selectedIndex) {
        const url = `${this.baseUrl}/get_output`;

        const body = JSON.stringify({
            prompt_id: promptId,
            selected_index: selectedIndex
        });

        return this.fetchWithTimeout(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
        });
    }
}
