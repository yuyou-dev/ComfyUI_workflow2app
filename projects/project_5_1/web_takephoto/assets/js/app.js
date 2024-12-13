// 负责应用的前端逻辑和与 API 服务的交互

import { ApiService } from '../services/api.js';

// 摄像头控制类
class CameraController {
    constructor(videoElement) {
        this.videoElement = videoElement;
        this.stream = null;
    }

    // 启动摄像头
    async startCamera() {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.stream = mediaStream;
            this.videoElement.srcObject = mediaStream;
        } catch (error) {
            console.error('无法访问摄像头:', error);
        }
    }

    // 停止摄像头
    stopCamera() {
        if (this.stream) {
            const tracks = this.stream.getTracks();
            tracks.forEach(track => track.stop());
            this.videoElement.srcObject = null;
        }
    }

    // 获取当前视频帧
    getCurrentFrame() {
        let width = 1080;
        let height = 1920;

        console.log('getcurrentframe')
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const video = this.videoElement;
        const scaleFactor = height / video.videoHeight;
        const scaledWidth = video.videoWidth * scaleFactor;
        const cropOffsetX = (scaledWidth - width) / 2 / scaleFactor;

        // 设置 canvas 大小
        canvas.width = width;
        canvas.height = height;

        // 绘制缩放并裁剪的视频帧
        context.drawImage(video, cropOffsetX, 0, video.videoWidth - 2 * cropOffsetX, video.videoHeight, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/png');
    }
}

// 图像处理类
class ImageProcessor {
    constructor(apiService, selectedIndex) {
        this.apiService = apiService;
        this.selectedIndex = selectedIndex;
    }

    // 上传图像
    async uploadImage(file) {
        try {

            const response = await this.apiService.uploadImage(file, this.selectedIndex);
            return response;
        } catch (error) {
            console.error('图像上传失败:', error);
            throw error;
        }
    }

    // 加入队列并请求生成图像
    async queueImageAndGenerate(fileResponseData) {
        try {
            const queueResponse = await this.apiService.queueImage(this.selectedIndex, fileResponseData);
            const promptId = queueResponse.data.prompt_id;
            return promptId;
        } catch (error) {
            console.error('图像排队失败:', error);
            throw error;
        }
    }
}

// 图像获取类
class ImageFetcher {
    constructor(apiService, selectedIndex) {
        this.apiService = apiService;
        this.selectedIndex = selectedIndex;
    }

    // 获取生成的图像
    async getGeneratedImage(promptId) {
        try {
            const response = await this.apiService.getGeneratedImage(promptId, this.selectedIndex);
            return response.data;
        } catch (error) {
            console.error('获取生成的图像失败:', error);
            throw error;
        }
    }
}

// 主应用控制类
class AppController {
    constructor(apiService, cameraController, imageProcessor, imageFetcher) {
        this.apiService = apiService;
        this.cameraController = cameraController;
        this.imageProcessor = imageProcessor;
        this.imageFetcher = imageFetcher;
        this.selectedIndex = null;
        this.resultImageUrl = '';
        this.resultImage = document.getElementById('resultImage');
        this.downloadButton = document.getElementById('downloadButton');
        this.loadingLayer = document.getElementById('loading');
        this.page1 = document.getElementById('page1');
        this.generateImageButton = document.getElementById('generateImageButton');
        this.init();
     
    }

    // 初始化应用
    async init() {
        try {
            const serverData = await this.apiService.initServer();
            this.selectedIndex = serverData.data.selected_index;
            // 在初始化完成后更新 ImageProcessor 和 ImageFetcher 的 selectedIndex
            this.imageProcessor.selectedIndex = this.selectedIndex;
            this.imageFetcher.selectedIndex = this.selectedIndex;
            this.page1.addEventListener('click', ()=>{
                if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen();
                } else if (document.documentElement.mozRequestFullScreen) { // Firefox
                    document.documentElement.mozRequestFullScreen();
                } else if (document.documentElement.webkitRequestFullscreen) { // Chrome, Safari, and Opera
                    document.documentElement.webkitRequestFullscreen();
                } else if (document.documentElement.msRequestFullscreen) { // IE/Edge
                    document.documentElement.msRequestFullscreen();
                }
            })
            console.log('Selected index:', this.selectedIndex);
            this.addEventListeners();
        } catch (error) {
            console.error('应用初始化失败:', error);
        }
    }

    // 添加事件监听器
    addEventListeners() {
        document.getElementById('startButton').addEventListener('click', this.startCamera.bind(this));
        this.generateImageButton.addEventListener('click', this.handleGenerateImage.bind(this));
        this.downloadButton.addEventListener('click', this.handleDownloadImage.bind(this));
    }

    // 启动摄像头并进入下一页
    async startCamera() {
        try {
          
            await this.cameraController.startCamera();

            this.showPage(2); // 显示第二页（拍照页面）
        } catch (error) {
            console.error('启动摄像头失败:', error);
        }
    }

    // 生成图像
    async handleGenerateImage() {
        try {
            const photoDataBase64 = this.cameraController.getCurrentFrame();
            const photoElement = document.createElement('div');
            photoElement.classList.add('img_box');
            const imgElement = document.createElement('img');
            imgElement.classList.add('per_img');
            imgElement.src = photoDataBase64;
            photoElement.appendChild(imgElement);
            document.getElementById('page2').appendChild(photoElement);
            this.cameraController.stopCamera()
            const file = this.dataURItoFile(photoDataBase64);
            this.loadingLayer.style.display = 'block';
            const uploadResponse = await this.imageProcessor.uploadImage(file);

            if (uploadResponse.code === 10000) {
                const promptId = await this.imageProcessor.queueImageAndGenerate(uploadResponse.data);
                await this.fetchGeneratedImage(promptId);
            } else {
                throw new Error(uploadResponse.message);
            }
        } catch (error) {
            console.error('生成图像失败:', error);
            alert('生成图像失败，请重试');
        }
    }

    // 从 dataURI 创建文件对象
    dataURItoFile(dataURI) {
        const byteString = atob(dataURI.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);

        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }

        const file = new File([uint8Array], `captured_image_${Date.now()}.png`, { type: 'image/png' });
        return file;
    }

    // 获取生成的图像并显示
    async fetchGeneratedImage(promptId) {
        try {
            const generatedData = await this.imageFetcher.getGeneratedImage(promptId,this.selectedIndex);
            if (generatedData.outputs_img && generatedData.outputs_img.images.length > 0) {
                this.showPage(3);
                this.loadingLayer.style.display = 'none';

                const imageFileName = generatedData.outputs_img.images[0].filename;
                this.resultImageUrl = `${this.apiService.baseUrl}/view?filename=${imageFileName}&selected_index=${this.selectedIndex}`;
                this.resultImage.src = this.resultImageUrl;
                this.resultImage.style.display = 'block';
                this.downloadButton.style.display = 'block';
            } else {
                setTimeout(() => this.fetchGeneratedImage(promptId), 2000); // 如果图像还没有准备好，继续请求
            }
        } catch (error) {
            console.error('获取生成图像失败:', error);
        }
    }

    // 下载生成的图像
    handleDownloadImage() {
        const link = document.createElement('a');
        link.href = this.resultImageUrl;
        link.download = 'generated_image.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // 显示页面
    showPage(pageNumber) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(`page${pageNumber}`).classList.add('active');
    }
}

// 实例化并启动应用
const apiService = new ApiService();
const cameraController = new CameraController(document.getElementById('video'));
const imageProcessor = new ImageProcessor(apiService, null); // selectedIndex 会在初始化时设置
const imageFetcher = new ImageFetcher(apiService, null);

const appController = new AppController(apiService, cameraController, imageProcessor, imageFetcher);
