// utils.js - 工具函数类，封装了与图像处理、视频流、延迟相关的功能

class Utils {
    // 1. 创建图像文件并触发下载
    static downloadImage(imageSrc, filename = 'image.png') {
      const link = document.createElement('a');
      link.href = imageSrc;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  
    // 2. 延迟功能 - 返回一个 Promise，延迟指定的毫秒数
    static delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }
  
    // 3. 从视频流获取当前帧并生成图像
    static captureVideoFrame(videoElement, width, height) {
      // 创建一个 canvas 元素
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // 设置 canvas 尺寸
      canvas.width = width;
      canvas.height = height;
  
      // 从视频中绘制当前帧
      context.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight, 0, 0, width, height);
  
      // 返回图像的 base64 编码
      return canvas.toDataURL('image/png');
    }
  
    // 4. 获取视频流并播放
    static async startVideoStream(videoElement) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        return stream;  // 返回获取到的视频流
      } catch (error) {
        console.error('无法获取视频流:', error);
        throw new Error('无法访问摄像头');
      }
    }
  }
  
  export default Utils;
  