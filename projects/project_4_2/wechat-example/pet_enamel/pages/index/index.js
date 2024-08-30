Page({
  data: {
    baseUrl: "http://192.168.31.101:6020",
    result_img: '',
    selected_index: '',
    upload_src: '../images/dog_1.png'
  },
  onLoad() {
    this.initServer();
  },
  // 初始化服务器
  initServer() {
    this.request('/init', 'GET', null)
      .then(data => {
        this.setData({
          selected_index: data.data.selected_index
        });
        console.log('Selected index:', data.data.selected_index);
      });
  },
  uploadImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: res => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          upload_src: tempFilePath
        });
        wx.showLoading({
          title: '请等待...'
        });
        wx.uploadFile({
          url: `${this.data.baseUrl}/upload`,
          filePath: tempFilePath,
          formData: {
            'selected_index': this.data.selected_index
          },
          name: 'image',
          success: res => {
            const data = JSON.parse(res.data);
            if (data.code === 10000) {
              this.queue(data.data);
            } else {
              this.showError(data.message);
            }
          },
          fail: err => {
            console.error('Upload error:', err);
            this.showError('Upload failed');
          }
        });
      }
    });
  },
  queue(file_response_data) {
    this.request('/queue', 'POST', {
      selected_index: this.data.selected_index,
      file_response_data: file_response_data
    })
      .then(data => this.fetchImageByPromptId(data.data.prompt_id))
      .catch(err => console.error('Queue error:', err));
  },
  // 获取输出
  fetchImageByPromptId(prompt_id) {
    let that = this;
    this.request('/get_output', 'POST', {
      prompt_id: prompt_id,
      selected_index: this.data.selected_index
    }).then(data => {
      if (data.data.outputs_img && data.data.outputs_img.images.length > 0) {
        wx.hideLoading();
        let outputs_img = data.data.outputs_img.images[0]["filename"];
        this.setData({
          result_img: `${this.data.baseUrl}/view?filename=${outputs_img}&selected_index=${this.data.selected_index}`
        });
      } else if (data.code === 10002) {
        setTimeout(() => {
          that.fetchImageByPromptId(prompt_id);
        }, 2000);
      } else {
        this.showError(data.message);
      }
    }).catch(err => {
      console.error('Get output failed', err);
      this.showError('Get output failed');
    });
  },
  downloadImage() {
    wx.downloadFile({
      url: this.data.result_img,
      success: res => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              this.showToast('保存成功', 'success');
            },
            fail: () => {
              this.showError('保存失败');
            }
          });
        } else {
          console.error('Download failed', res);
        }
      },
      fail: err => {
        console.error('Download error', err);
      }
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
          console.error('Request failed', err);
          this.showError('Request failed');
          reject(err);
        }
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
  // 通用错误处理函数
  showError(message) {
    wx.hideLoading();
    this.showToast(`Error: ${message}`);
  },
});
