Page({
  data: {
    videoUrl: '',
    videoUrlOutput: '',
    genderArray: ['男', '女'],
    genderIndex: 0,
    canUpload: false,
    baseUrl: "http://192.168.1.65:6020",
    selected_index: null,
    file_response_data: null
  },

  onLoad() {
    this.initServer();
  },

  // 初始化服务器
  initServer() {
    this.request('/init', 'GET', null)
      .then(res => {
        this.setData({
          selected_index: res.data.selected_index
        });
        console.log('Selected index:', res.data.selected_index);
      })
      .catch(err => console.error('Init request failed', err));
  },

  // 性别选择器的变更
  onGenderChange(e) {
    this.setData({
      genderIndex: e.detail.value
    });
  },

  // 选择视频
  chooseMedia() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['video'],
      success: res => {
        this.setData({
          videoUrl: res.tempFiles[0].tempFilePath
        });
      },
      fail: err => console.error('Video selection failed', err)
    });
  },

  // 上传视频
  uploadVideo() {
    if (!this.data.videoUrl) {
      return this.showError('Please select a video first');
    }

    this.uploadFile(`${this.data.baseUrl}/upload`, this.data.videoUrl, {
      'selected_index': this.data.selected_index
    }).then(res => {
      this.setData({
        canUpload: true,
        file_response_data: res.data
      });
      this.showToast('Upload successful', 'success');
    }).catch(err => {
      console.error('Upload failed', err);
      this.showError('Upload failed');
    });
  },

  // 队列提示
  queuePrompt() {
    if (!this.data.file_response_data) {
      return this.showError('No file to process');
    }
    wx.showLoading({
      title: '正在生成',
    })
    this.request('/queue', 'POST', {
      gender_index: this.data.genderIndex,
      selected_index: this.data.selected_index,
      file_response_data: this.data.file_response_data
    }).then(res => {
      this.getOutput(res.data.prompt_id);
    }).catch(err => {
      this.showError('Queue prompt failed');
      console.error('Queue prompt failed', err);
    });
  },

  // 获取输出
  getOutput(prompt_id) {
 
    this.request('/get_output', 'POST', {
      prompt_id: prompt_id,
      selected_index: this.data.selected_index
    }).then(res => {
      console.log(res)
      if (res.code === 10000) {
        const filename = res.data.outputs_video.gifs[0].filename;
        this.setData({
          videoUrlOutput: `${this.data.baseUrl}/view?filename=${filename}&selected_index=${this.data.selected_index}`
        });
        wx.hideLoading();
      } else if (res.code === 10002) {
        // 如果返回 10002，递归调用 getOutput，等待 2 秒后再次请求
        setTimeout(() => {
          this.getOutput(prompt_id);
        }, 2000);
      } else {
        wx.hideLoading();
        this.showError(res.message);
      }
    }).catch(err => {
      wx.hideLoading();
      console.error('Get output failed', err);
      this.showError('Get output failed');
    });
  },


  // 保存视频
  saveVideo() {
    if (!this.data.videoUrlOutput) {
      return this.showError('No video to save');
    }

    this.downloadFile(this.data.videoUrlOutput)
      .then(filePath => {
        wx.saveVideoToPhotosAlbum({
          filePath,
          success: () => this.showToast('保存成功', 'success'),
          fail: () => this.showError('保存失败')
        });
      })
      .catch(err => console.error('Error downloading video:', err));
  },

  // 重置按钮
  returnBtn() {
    this.setData({
      videoUrlOutput: ''
    });
  },

  // 通用request请求函数
  request(url, method, data) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.data.baseUrl}${url}`,
        method: method,
        data: data,
        header: {
          'content-type': 'application/json'
        },
        success: res => {
          if (res.data.code.toString().startsWith('1000')) {
            resolve(res.data);
          } else {
            this.showError(res.data.message);
            reject(new Error(res.data.message));
          }
        },
        fail: err => {
          this.showError('Request failed');
          reject(err);
        }
      });
    });
  },

  // 通用文件上传函数
  uploadFile(url, filePath, formData) {
    wx.showLoading({
      title: '正在上传...',
    });
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: url,
        filePath: filePath,
        name: 'file',
        formData: formData,
        success: res => {
          const data = JSON.parse(res.data);
          if (data.code === 10000) {
            resolve(data);
          } else {
            this.showError(data.message);
            reject(new Error(data.message));
          }
          wx.hideLoading();
        },
        fail: reject
      });
    });
  },

  // 通用文件下载函数
  downloadFile(url) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: url,
        success: res => {
          if (res.statusCode === 200) {
            resolve(res.tempFilePath);
          } else {
            reject(new Error(`Download failed with status code: ${res.statusCode}`));
          }
        },
        fail: reject
      });
    });
  },

  // 通用showToast函数
  showToast(title, icon = 'none', duration = 2000) {
    wx.showToast({
      title: title,
      icon: icon,
      duration: duration
    });
  },

  // 错误处理函数
  showError(message) {
    wx.hideLoading();
    this.showToast(`Error: ${message}`);
  }
});