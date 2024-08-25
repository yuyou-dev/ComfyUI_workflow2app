const prompt_json = require('../../data/api_json')

Page({
  data: {
    filename: '',
    baseUrl: "http://192.168.1.11:6008" //替换成ComfyUI的运行url
  },

  // 处理文本输入
  handleTextInput(e) {
    this.setData({
      textVal: e.detail.value
    });
  },

  // 上传文本并获取图片
  uploadTextAndFetchImage() {
    const { textVal } = this.data;

    wx.showLoading({ title: '请等待...' });

    this.uploadPrompt(textVal)
      .then(this.fetchImageByPromptId)
      .then(imgUrls => {
        this.setData({ imgReturns: imgUrls });
      })
      .catch(error => {
        console.error(error);
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  // 上传文本，返回 prompt_id
  uploadPrompt(text) {
    prompt_json['6']['inputs']['text_positive'] = text; // 在API配置文件中查找对应的属性
    return this.makeRequest('/prompt', 'POST', { prompt: prompt_json })
      .then(res => {
        if (res.data && res.data.prompt_id) {
          return res.data.prompt_id;
        } else {
          throw new Error('Failed to get prompt_id');
        }
      });
  },

  // 根据 prompt_id 获取图片
  fetchImageByPromptId(prompt_id) {
    return new Promise((resolve, reject) => {
      const fetchImage = () => {
        this.makeRequest(`/history/${prompt_id}`, 'GET')
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
