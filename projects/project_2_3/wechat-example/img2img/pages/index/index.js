const prompt_json = require('../../data/api_json')

Page({
  data: {
    filename: '',
    baseUrl: "https://u45708-9524-962502aa.westb.seetacloud.com:8443" // 替换成ComfyUI的实际运行地址
  },

  // 根据 prompt_id 获取图片
  fetchImageByPromptId(prompt_id) {
    return new Promise((resolve, reject) => {
      const fetchImage = () => {
        this.makeRequest(`/api/history/${prompt_id}`, 'GET')
          .then(res => {
            if (res.data && res.data[prompt_id]) {
              this.setData({
                filename: res.data[prompt_id]["outputs"][9]['images'][0]['filename']
              });
              resolve(res.data[prompt_id]["outputs"][9]['images']);
            } else {
              setTimeout(fetchImage, 2000); // 轮询直到获取到图片
            }
          })
          .catch(reject);
      };
      fetchImage();
    });
  },

  uploadImage() {
    let that = this;
    wx.showLoading({ title: '请等待...' });
    wx.chooseMedia({
      count: 9,
      mediaType: ['image','video'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success (res) {
        const tempFilePath = res.tempFiles[0].tempFilePath
        wx.uploadFile({
          url: `${that.data.baseUrl}/api/upload/image`,
          filePath: tempFilePath,
          name: 'image',
          success: function(res) {
            if (res.statusCode === 200) {
              let res_data = JSON.parse(res.data)
              prompt_json['11']['inputs']['image'] = res_data['name']

              that.queue(prompt_json)
              .then(that.fetchImageByPromptId)
              .then(imgUrls => {
                that.setData({ imgReturns: imgUrls });
              })
              .catch(error => {
                console.error(error);
              })
              .finally(() => {
                wx.hideLoading();
              });  
            } else {
              console.error('Upload failed:', res.statusCode, res.data);
            }
          },
          fail: function(error) {
            console.error('Upload error:', error);
          }
        })
      }
    })
  },

  queue(prompt) {
    return this.makeRequest('/api/prompt','POST',{prompt:prompt})
      .then(res => {
        if (res.data && res.data.prompt_id) {
          return res.data.prompt_id;
        } else {
          throw new Error('Failed to get prompt_id');
        }
      });
  },

  // 通用请求方法
  makeRequest(endpoint, method, data = {}) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.data.baseUrl}${endpoint}`,
        method,
        data,
        timeout: 20000,
        header: {
          'content-type': 'application/json'
        },
        success: resolve,
        fail: reject
      });
    });
  },

  // 重置文件名
  resetFilename() {
    this.setData({
      filename: ''
    });
  }
});
