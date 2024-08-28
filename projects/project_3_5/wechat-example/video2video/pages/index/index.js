// index.js
Page({
  data: {
    videoUrl: '',
    videoUrlOutput: '',
    genderArray: ['男', '女'],
    genderIndex: 0,
    canUpload: false,
    baseUrl: "http://192.168.3.189:6020",
    selected_index: null
  },

  onLoad() {
    this.initServer();
  },

  // 初始化服务器
  initServer() {
    wx.request({
      url: `${this.data.baseUrl}/init`,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        if (res.data.code === 10000) {
          this.setData({
            selected_index: res.data.data.selected_index
          });
          console.log('Selected index:', res.data.data.selected_index);
        } else {
          wx.showToast({
            title: `Error: ${res.data.message}`,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: res => {
        console.error('Init request failed', res);
      }
    });
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
        const videoUrl = res.tempFiles[0].tempFilePath;
        this.setData({
          videoUrl: videoUrl
        });
      },
      fail: err => {
        console.error('Video selection failed', err);
      }
    });
  },

  // 上传视频
  uploadVideo() {
    const filePath = this.data.videoUrl;
    if (!filePath) {
      wx.showToast({
        title: 'Please select a video first',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showLoading({
      title: '正在上传...',
    });

    wx.uploadFile({
      url: `${this.data.baseUrl}/upload`,
      filePath: filePath,
      name: 'file',
      formData: {
        'selected_index': this.data.selected_index
      },
      success: res => {
        const data = JSON.parse(res.data);
        console.log(data)
        if (data.code === 10000) {
          this.setData({
            canUpload: true,
            file_response_data: data.data
          })
          wx.showToast({
            title: 'Upload successful',
            icon: 'success',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: `Error: ${data.message}`,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        console.error('Upload failed', err);
        wx.showToast({
          title: 'Upload failed',
          icon: 'none',
          duration: 2000
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  // 队列提示
  queuePrompt() {
    wx.showLoading({
      title: '正在生成...',
    });

    wx.request({
      url: `${this.data.baseUrl}/queue`,
      method: 'POST',
      data: {
        gender_index: this.data.genderIndex,
        selected_index: this.data.selected_index,
        file_response_data: this.data.file_response_data
      },
      header: {
        'content-type': 'application/json'
      },
      success: res => {

        if (res.data.code === 10000) {
          this.getOutput(res.data.data.prompt_id);
        } else {
          wx.hideLoading();
          wx.showToast({
            title: `Error: ${res.data.message}`,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        wx.hideLoading();

        console.error('Queue prompt failed', err);
        wx.showToast({
          title: 'Queue prompt failed',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 获取输出
  getOutput(prompt_id) {
    wx.request({
      url: `${this.data.baseUrl}/get_output`,
      method: 'POST',
      data: {
        prompt_id: prompt_id,
        selected_index: this.data.selected_index
      },
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        if (res.data.code === 10000) {
          wx.hideLoading();

          const filename = res.data.data.outputs_video.gifs[0].filename;
          this.setData({
            videoUrlOutput: `${this.data.baseUrl}/view?filename=${filename}&selected_index=${this.data.selected_index}`
          });
        } else if (res.data.code === 10002) {
          setTimeout(() => {
            this.getOutput(prompt_id);
          }, 2000);
        } else {
          wx.hideLoading();

          wx.showToast({
            title: `Error: ${res.data.message}`,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        console.error('Get output failed', err);
        wx.showToast({
          title: 'Get output failed',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  // 重置按钮
  returnBtn() {
    this.setData({
      videoUrlOutput: ''
    });
  }
});