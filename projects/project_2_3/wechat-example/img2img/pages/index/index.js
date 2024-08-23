Page({
  data: {
    imgReturns: '',
    imgUpload: '', // 存储上传的图片
    baseUrl: "http://192.168.31.101:6010"

  },

  // 选择图片并上传
  chooseAndUploadImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const filePath = res.tempFilePaths[0];
        this.setData({
          imgUpload: filePath
        });
        this.convertToBase64AndUpload(filePath);
      },
      fail: err => {
        console.error('Image selection failed:', err);
      }
    });
  },

  // 读取文件并转换为Base64，然后上传并获取图片
  convertToBase64AndUpload(filePath) {
    const fileSystemManager = wx.getFileSystemManager();
    fileSystemManager.readFile({
      filePath: filePath,
      encoding: 'base64', // 指定编码格式为base64
      success: res => {
        const timestamp = Math.floor(Date.now() / 1000);
        const uploadData = {
          image_name: `upload_${timestamp}`,
          image_base64: res.data
        };
        this.uploadImageAndFetchImage(uploadData);
      },
      fail: err => {
        wx.hideLoading();
        console.error('Failed to read file:', err);
      }
    });
  },

  // 整体流程控制函数：上传图片并获取生成的图片
  uploadImageAndFetchImage(uploadData) {
    wx.showLoading({ title: '请等待...' });

    this.uploadImage(uploadData)
      .then(prompt_id => this.fetchImageByPromptId(prompt_id))
      .then(imgUrls => {
        this.setData({
          imgReturns: imgUrls,
        });
        wx.hideLoading();
      })
      .catch(error => {
        wx.hideLoading();
        console.log('Error:', error);
      });
  },

  // 上传图片并返回 prompt_id
  uploadImage(uploadData) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.data.baseUrl}/upload`,
        method: 'POST',
        data: uploadData,
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

  // 根据 prompt_id 获取生成的图片并返回 imgUrls
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

  // 下载图片的函数
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

  // 重置状态以重新上传
  replay() {
    this.setData({
      imgReturns: '',
      imgUpload: ''
    });
  }
});
