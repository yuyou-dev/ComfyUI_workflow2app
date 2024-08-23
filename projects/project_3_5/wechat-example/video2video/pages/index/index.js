// index.js
Page({
  data: {
    videoUrlOutput: '',
    genderArray: ['男', '女'],
    genderIndex: 0,
    baseUrl: "http://192.168.31.101:6010"
  },
  onGenderChange: function (e) {
    this.setData({
      genderIndex: e.detail.value
    });
  },
  // 选择视频
  chooseMedia() {
    wx.chooseMedia({
      count: 1,
      mediaType: 'video',
      success: res => {
        console.log(res)
        let videoUrl = res.tempFiles[0].tempFilePath
        this.setData({
          videoUrl: videoUrl
        });
      }
    });
  },
  // 上传视频
  uploadVideo() {
    let filePath = this.data.videoUrl
    wx.showLoading({
      title: '正在生成...',
    })
    wx.uploadFile({
      url: this.data.baseUrl + '/upload', // 服务器接收视频的接口
      filePath: filePath,
      name: 'file', // 对应服务器端处理文件的字段名
      formData: {
        'genderIndex': this.data.genderIndex
      },
      success: res => {
        try {
          const data = JSON.parse(res.data); // 解析JSON字符串
          console.log('解析后的数据:', data);
          if (data.prompt_id) {
            this.getOutput(data.prompt_id);
          } else {
            wx.hideLoading()
            console.error('未收到 prompt_id');
          }
        } catch (e) {
          wx.hideLoading()
          console.error('解析JSON出错:', e);
        }
      },
      fail: error => {
        wx.hideLoading()
        console.error('上传失败', error)
      }
    })
  },
  getOutput(prompt_id) {
    // console.log(prompt_id)
    wx.request({
      url: this.data.baseUrl + '/get_output',
      method: 'POST',
      data: {
        prompt_id: prompt_id
      },
      header: {
        'content-type': 'application/json'
      },
      success: res => {
        console.log(res)

        if (res.data.code == 10000) {
          this.setData({
            videoUrlOutput: res.data.video_urls
          });
          wx.hideLoading()

        } else if (res.data.code == 10002) {
          setTimeout(() => {
            this.getOutput(prompt_id)
          }, 2000)
        }else{
          wx.hideLoading()

        }

      },
      fail: error => {
        wx.hideLoading()

        console.log(error);
      }
    });
  },
  returnBtn() {
    this.setData({
      videoUrlOutput: ''
    })
  },

})
