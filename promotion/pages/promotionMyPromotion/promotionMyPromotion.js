var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    customer: '',
    userInfo: '',
    shareText: '我在推广赚佣金，一起来吧~',
    scanText: '长按识别小程序码推广赚佣金'
  },
  factor: app.globalData.systemInfo.screenWidth / 750,
  canvas: null,
  ctx: null,
  fillStyle: '#fff',
  onLoad: function (options) {
    this.dataInitial()
    let userInfo = wx.getStorageSync('userInfo') || {};
    Object.assign(userInfo, {'nickname': app.globalData.getDistributorInfo.shop_name});
    this.setData({userInfo})
  },
  dataInitial: function () {
    this.getMyPromotionInfo().then(() => {
      wx.createSelectorQuery().select('#shareCanvas').fields({
        node: true,
        size: true,
      }).exec(this.initCanvas.bind(this))
    })
  },
  initCanvas(res) {
    const { width, height, node } = res[0]
    const ctx = node.getContext('2d')
    const dpr = wx.getSystemInfoSync().pixelRatio
    node.width = width * dpr
    node.height = height * dpr
    ctx.scale(dpr, dpr)
    this.canvas = node
    this.ctx = ctx
    this.genaratePic();
  },
  previewImage: function(e){
    app.previewImage({
      current: e.currentTarget.dataset.src
    })
  },
  getMyPromotionInfo:function(){
    let that = this;
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppDistribution/getMyPromotionInfo',
        success: function (res) {
          let status = res.status;
          let data = res.data;
          if(status == 0){
            that.setData({
              customer: data
            })
            resolve(true)
          }else{
            reject(false)
          }
        },
        fail: function (err) {
          reject(false)
        }
      })
    })
  },
  toPx(rpx) {
    return rpx * this.factor;
  },
  setRectWidth(color = "#fff") {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.fillStyle = color
    this.ctx.fill()
    this.ctx.restore()
  },
  setRadiusRectWidthNone(x, y, w, h, r, color = "#fff") {
    const br = r / 2
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.moveTo(this.toPx(x + br), this.toPx(y))                                                            // 移动到左上角的点
    this.ctx.lineTo(this.toPx(x + w - br), this.toPx(y))                                                        // 画上边的线
    this.ctx.arcTo(this.toPx(x + w), this.toPx(y), this.toPx(x + w), this.toPx(y + br), this.toPx(br))          // 画右上角的弧		
    this.ctx.lineTo(this.toPx(x + w), this.toPx(y + h))                                                    // 画右边的线
    this.ctx.lineTo(this.toPx(x), this.toPx(y + h))                                                        // 画下边的线
    this.ctx.lineTo(this.toPx(x), this.toPx(y + br))                                                            // 画左边的线
    this.ctx.arcTo(this.toPx(x), this.toPx(y), this.toPx(x + br), this.toPx(y), this.toPx(br))                  // 画左上角的弧
    this.ctx.fillStyle = color
    this.ctx.fill()
    this.ctx.restore()
  },
  setAvatarCircle(x, y, r, color) {
    this.ctx.save()
    this.ctx.beginPath()
    this.ctx.arc(x, y, r, 0, 2 * Math.PI)
    this.ctx.fillStyle = color
    this.ctx.fill()
    this.ctx.restore()
  },
  getCircleImg(src, x, y, r,callback) {
    x = this.toPx(x);
    y = this.toPx(y);
    r = this.toPx(r);
    const img = this.canvas.createImage()
    img.src = src
    img.onload = () => {
      this.ctx.save()
      this.ctx.beginPath()
      this.ctx.arc(x + r, y + r, r, 0, 2 * Math.PI)
      this.ctx.clip()
      this.ctx.drawImage(img, x, y, 2 * r, 2 * r)
      this.ctx.closePath()
      this.ctx.restore()
      typeof callback == 'function' && callback();
    }
  },
  setDrawImg(src, x, y, width, height,callback) {
    const img = this.canvas.createImage()
    img.src = src
    img.onload = () => {
      this.ctx.drawImage(img, this.toPx(x), this.toPx(y), this.toPx(width), this.toPx(height));
      typeof callback == 'function' && callback();
    }
  },
  setDrawText(title, fontSize, color, x, y) {
    fontSize = fontSize.split(' ');
    this.ctx.fillStyle = color
    this.ctx.font = `${fontSize[1]} ${fontSize[0]} Arial, Helvetica, sans-serif`
    this.ctx.fillText(title, this.toPx(x), this.toPx(y))
  },
  setDrawImg(src, x, y, width, height,callback) {
    const img = this.canvas.createImage()
    img.src = src
    img.onload = () => {
      this.ctx.drawImage(img, this.toPx(x), this.toPx(y), this.toPx(width), this.toPx(height));
      typeof callback == 'function' && callback();
    }
  },
  genaratePic() {
    let {
      userInfo:{
        cover_thumb,nickname
      },
      customer:{shop_qrcode},
      shareText,
      scanText
     } = this.data
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(0, 0, this.toPx(586), this.toPx(720));
    this.getCircleImg(cover_thumb, 35,35,45);
    this.setDrawText(nickname,`${this.toPx(30)}px bold`,'#000',145,70);
    this.setDrawText(shareText,`${this.toPx(22)}px normal`,'#999',145,115);
    this.setDrawText("”",`${this.toPx(90)}px normal`,'#FFE3CC',520,125);
    this.setDrawImg(shop_qrcode, 130,220,330,330);
    this.setDrawText(scanText,`${this.toPx(23)}px normal`,'#ff7100',140,650);
  },
  drawImage() {
    let canvas = this.canvas
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      destWidth: canvas.width,
      destHeight: canvas.height,
      canvas: canvas,
      quality: 1,
      success: res => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success() {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            })
          },
          fail: res => {
            if (res && (res.errMsg === "saveImageToPhotosAlbum:fail auth deny" || res.errMsg === "saveImageToPhotosAlbum:fail:auth denied")) {
              wx.showModal({
                title: '提示',
                content: '您已经拒绝授权保存图片到您的相册，这将影响您使用小程序，您可以点击右上角的菜单按钮，选择关于。进入之后再点击右上角的菜单按钮，选择设置，然后将保存到相册按钮打开，返回之后再重试。',
                showCancel: false,
                confirmText: "确定",
                success: function (res) {
                }
              })
            }
          }
        })
      }
    })
  },
  savePic: function () {
    this.drawImage();
  }
})
