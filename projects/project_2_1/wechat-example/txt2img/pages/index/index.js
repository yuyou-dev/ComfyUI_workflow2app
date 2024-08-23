Page({
  data: {
    imgReturns: '',
    textVal:'',
    baseUrl: "http://192.168.31.101:6010"
  },
  textInput: function (e) {
    this.setData({
      textVal: e.detail.value
    })
  },
  // 整体流程控制函数
  uploadTextAndFetchImage() {
    const text = this.data.textVal;
    console.log(text);
    wx.showLoading({ title: '请等待...' });

    this.uploadText(text)
      .then(prompt_id => this.fetchImageByPromptId(prompt_id))
      .then(imgUrls => {
        this.setData({
          imgReturns: imgUrls,
        });
        wx.hideLoading();
      })
      .catch(error => {
        wx.hideLoading();
        console.log(error);
      });
  },

  // 上传文本并返回 prompt_id
  uploadText(text) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.data.baseUrl}/upload`,
        method: 'POST',
        data: { text },
        timeout: 200000,
        header: {
          'content-type': 'application/json'
        },
        success: res => {
          if (res.data && res.data.prompt_id) {
            resolve(res.data.prompt_id);
          } else {
            reject(new Error('Failed to get prompt_id'));
          }
        },
        fail: error => {
          reject(error);
        }
      });
    });
  },

  // 根据 prompt_id 获取图片并返回 imgUrls
  fetchImageByPromptId(prompt_id) {
    return new Promise((resolve, reject) => {
      const fetch = () => {
        wx.request({
          url: `${this.data.baseUrl}/get_output`,
          method: 'POST',
          data: { prompt_id },
          header: {
            'content-type': 'application/json'
          },
          success: res => {
            if (res.data.code === 10000) {
              resolve(res.data.img_urls);
            } else if (res.data.code === 10002) {
              setTimeout(fetch, 2000); // 再次请求
            } else {
              reject(new Error('Failed to get image'));
            }
          },
          fail: error => {
            reject(error);
          }
        });
      };
      fetch();
    });
  },

  // 下载图片的函数保持不变
  downloadPic() {
    wx.showLoading({ title: '请等待...' });

    wx.downloadFile({
      url: `${this.data.baseUrl}/images/${this.data.imgReturns}`,
      success: res => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            }),
            fail: () => wx.showToast({
              title: '保存失败',
              icon: 'none',
              duration: 2000
            })
          });
        }
      }
    });
  },
  replay(){
    this.setData({
      imgReturns:''
    })
  }
});
