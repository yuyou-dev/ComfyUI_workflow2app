/*
    调用微信小程序的相册 / 后置摄像头，获取图片，上传到ComfyUI服务器端的input文件夹
*/
uploadImage() {
    let that = this;
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
            if (res.statusCode === 200 && res.data.name) {
              let image_name = res.data.name
              console.log(image_name)
              prompt_json['11']['inputs']['image'] = image_name
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
