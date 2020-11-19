var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    tabIndex: 0,
    userInfo: {},
    distributionInfo: '',
    distributorInfo: '',
    colonelInfo: {},
    user_token: '',
    groupCode: ''
  },
  factor: app.globalData.systemInfo.screenWidth / 750,
  canvas: null,
  ctx: null,
  fillStyle: '#fff',
  onLoad: function (options) {
    let that = this;
    if (options.distributorInfo) {
      this.setData({
        distributorInfo: options.distributorInfo,
        user_token: options.distributorInfo.user_token
      })
      this.initApplyStatus()
    } else {
      this.getDistributorInfo(that.initApplyStatus)
    }
    this.dataInitial()
    wx.createSelectorQuery().select('#shareCanvas').fields({
      node: true,
      size: true,
    }).exec(this.initCanvas.bind(this))
  },
  dataInitial: function () {
    this.setData({
      userInfo: app.getUserInfo()
    })
  },
  changeTab: function (e) {
    let index = e.currentTarget.dataset.index;
    this.page = 1;
    this.setData({
      tabIndex: index
    })
  },
  modifyCode: function() {
    app.chooseImage(res => {
      this.setData({
        "groupCode": res[0]
      })
      app.sendRequest({
        url: '/index.php?r=AppDistributionExt/UploadWeChatGroupQRCode',
        method: 'post',
        data: {
          qr_code: res[0]
        },
        success: function (res) {
          console.log(res.data)
        }
      })
    })
  },
  deleteCode: function() {
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/UploadWeChatGroupQRCode',
      method: 'post',
      data: {
        qr_code: this.data.groupCode,
        action_type : 1,
      },
      success: function (res) {
        console.log(res.data)
      }
    })
    this.setData({
      groupCode: ''
    });
  },
  initApplyStatus: function(token) {
    let _this = this;
    let data = {
      leader_token: token || _this.data.user_token
    }
    let leaderInfo = app.globalData.getDistributorInfo;
    if (leaderInfo && leaderInfo.dis_group_info && +leaderInfo.dis_group_info.is_block_up === 1) {
      data['is_from_admin'] = 1
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
      method: 'post',
      data: data,
      success: function (res) {
        if (res.data.length) {
          res.data[0].is_block_up = res.data[0].is_block_up ? +res.data[0].is_block_up : 0;
          _this.setData({
            colonelInfo: res.data[0],
            groupCode: (res.data[0].extra_fields && res.data[0].extra_fields.qr_code) || ''
          })
          _this.genaratePic();
        }
      }
    })
  },
  previewImage: function(e){
    app.previewImage({
      current: e.currentTarget.dataset.src
    })
  },
  getDistributorInfo: function(callback) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      data:{
        is_group_leader_info: 1
      },
      success: function(res) {
        let status = res.status;
        let data = res.data;
        if(status == 0 && data){
          that.setData({
            distributorInfo: res.data,
            user_token: res.data.user_token
          })
          if (callback && typeof callback == 'function') {
            callback(res.data.user_token)
          }
        }else{
          app.showToast({
            title: '接口错误',
            icon: 'none',
            duration: 2000
          });
        }
      }
    })
  },
  downLoadImage(imgUrl){
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: imgUrl,
        success: resolve,
        fail: reject
      })
    });
  },
  save(e) {
    let { type } = e.currentTarget.dataset;
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 210, this.toPx(750), this.toPx(804));
    if (type == 1) { // 群二维码
      this.setDrawText(`长按识别二维码进群`,`${this.toPx(24)}px normal`,'#999',262,740);
      this.setDrawImg(this.data.groupCode, 262,472,200,200,this.drawImage);
      return;
    }
    this.setDrawText(`长按识别二维码参团`,`${this.toPx(24)}px normal`,'#999',262,740);
    this.getCircleImg(this.data.distributorInfo.shop_qrcode, 262,472,98,this.drawImage);
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
  initCanvas(res) {
    const { width, height, node } = res[0]
    const ctx = node.getContext('2d')
    const dpr = wx.getSystemInfoSync().pixelRatio
    node.width = width * dpr
    node.height = height * dpr
    ctx.scale(dpr, dpr)
    this.canvas = node
    this.ctx = ctx
  },
  toPx(rpx) {
    return rpx * this.factor;
  },
  toRpx(px) {
    return px / this.factor;
  },
  setDrawImg(src, x, y, width, height,callback) {
    const img = this.canvas.createImage()
    img.src = src
    img.onload = () => {
      this.ctx.drawImage(img, this.toPx(x), this.toPx(y), this.toPx(width), this.toPx(height));
      typeof callback == 'function' && callback();
    }
  },
  drawIconWidthText(icon, title, x, y, w, h, lineMaxLen = 12, fontSize = 26, fontStyle = 'normal', color = "#333") {
    let lineLength = 0
    let startX = 0
    let lineOneArray = [];
    let lineTwoArray = [];
    let limit = {
      'line1': 0,
      'line2': 0
    }
    if (icon) {
      this.setDrawImg(icon, x, y + 32 - h, w, h)
      startX = w + 10
      lineMaxLen = lineMaxLen - parseInt(w / fontSize * 1.75)
    }
    title.split('').some(value => {
      let len = this.getByteLen(value);
      lineLength += len;
      if (lineLength <= lineMaxLen) {
        lineOneArray.push(value)
        limit.line1 = lineLength
      } else {
        lineTwoArray.push(value)
        limit.line2 = lineLength - limit.line1;
      }
      if (lineLength >= (icon ? (lineMaxLen * 2 + parseInt(w / fontSize * 1.75) - 4.5) : (lineMaxLen * 2 - 3))) return true
    })
    this.setDrawText(lineOneArray.join(''), `${this.toPx(fontSize)}px ${fontStyle}`, color, x + startX, y + 28)
    this.setDrawText(lineTwoArray.join('') + (limit.line2 >= lineMaxLen - 3 ? '...' : ''), `${this.toPx(fontSize)}px ${fontStyle}`, color, x, y + 62)
  },
  getByteLen(val) {
    let len = 0;
    if (val.match(/[^\x00-\xff]/ig) != null) {
      len = 1.75;
    } else {
      if (val.match(/[a-zA-Z]/) != null) {
        len = 0.95;
      } else {
        len = 1;
      }
    }
    return len;
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
  setDrawText(title, fontSize, color, x, y) {
    fontSize = fontSize.split(' ');
    this.ctx.fillStyle = color
    this.ctx.font = `${fontSize[1]} ${fontSize[0]} sans-serif`
    this.ctx.fillText(title, this.toPx(x), this.toPx(y))
  },
  genaratePic() {
    let {
      nickname,
      cover_thumb,
    } = this.data.userInfo;
    let {phone,address_detail,region_address,housing_estate} = this.data.colonelInfo; 
    let communityTitle = `小区名称：${housing_estate}`;
    let addressTitle = `${region_address}${address_detail}`;
    let shareText = `我在【${app.globalData.appTitle}】售卖商品，快来参与团购吧`;
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(0, 0, this.toPx(750), this.toPx(804));
    this.setRadiusRectWidthNone(0,0,750,420,16, "#ff7100");
    this.setAvatarCircle(this.toPx(118),this.toPx(95),this.toPx(57),'#f88a3d');
    this.getCircleImg(cover_thumb, 68,46,50);
    this.setDrawText(nickname,`${this.toPx(30)}px bold`,'#fff',196,87);
    this.setDrawText(phone,`${this.toPx(26)}px normal`,'#fff',196,134);
    this.setDrawText(shareText,`${this.toPx(28)}px normal`,'#fff',74,210);
    this.setAvatarCircle(this.toPx(360),this.toPx(570),this.toPx(110),'#ffe4d0');
    this.setDrawImg('https://develop.zhichiwangluo.com/zcimgdir/album/file_5eb3a2dd57615.png',74,250,29,26);
    this.setDrawImg('https://develop.zhichiwangluo.com/zcimgdir/album/file_5eb3a2dd6e099.png',74,292,23,28);
    this.setDrawText(communityTitle,`${this.toPx(26)}px normal`,'#fff',114,270);
    this.setDrawText('提货地点：',`${this.toPx(26)}px normal`,'#fff',114,320);
    this.drawIconWidthText('', addressTitle, 248, 292,0,0,34, 24, 'normal', '#fff');
  },
})
