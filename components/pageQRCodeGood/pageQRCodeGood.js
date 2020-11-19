var app = getApp()
import { DrawShare } from '../../utils/drawShare.js'
Component({
  properties: {
    pageQRCodeData: {
      type: Object,
      value: {
        shareDialogShow: "100%",
        shareMenuShow: false,
        animation: null
      } 
    }
  },
  data: {
    pageQRCodeShow: false,
    showShare: false,
    siteBaseUrl: getApp().globalData.siteBaseUrl,
    windowHeight:''
  },
  ready: function () {
    this.getShareToMomentsSwitch();
  },
  methods: {
    drawing: function () {
      let _this = this;
      wx.getSystemInfo({
        success(res) {
          _this.setData({
            windowHeight : res.windowHeight
          }) 
        }
      })
      const goodsInfo = this.data.pageQRCodeData.goodsInfo;
      const ctx = wx.createCanvasContext('goodsImage', this);
      ctx.setFillStyle('#FFFFFF');
      ctx.fillRect(0, 0, 239, 430);
      ctx.draw();
      let userInfo = this.data.pageQRCodeData.userInfo;
      let pathAvatar = userInfo.avatarUrl; //用户头像
      var avatorWidth = 32
        , avatorHeight = 32;
      var avatarurlX = 12;   //绘制的头像在画布上的位置
      var avatarurlY = 14;   //绘制的头像在画布上的位置
      this.setFillText(ctx, goodsInfo.text, '#333333', 300);
      ctx.draw(true)
        ctx.save();
        ctx.beginPath(); //开始绘制
        ctx.arc(avatorWidth / 2 + avatarurlX, avatorHeight / 2 + avatarurlY, avatorWidth / 2, 0, 2 * Math.PI, false);
        ctx.clip();
        this.setDrawImage(ctx, pathAvatar, avatarurlX, avatarurlY, avatorWidth, avatorWidth);
        this.setDrawImage(ctx, goodsInfo.goods_img, 12, 56, 215, 215);
        this.setDrawImage(ctx, goodsInfo.qrcode_img_url, 178, 288, 50, 50);
        this.setDrawImage(ctx, 'http://develop.zhichiwangluo.com/static/webapp/images/xcx-goods/sharePic.png', 208, 22, 14, 11);
        if (goodsInfo.isSeckill) {
          this.setDrawImage(ctx, 'http://test2.zhichiwangluo.com/static/webapp/images/seckill-share-icon.png', 10, 252, 62, 18);
        }
        ctx.setFillStyle('#FFF')
        ctx.draw(true)
    },
    setFillText: function (ctx, text, color, y) {
      let textString;
      if (text.length > 20) {
        textString = text.substr(0, 17) + '...';
      } else {
        textString = text;
      }
      let textRowArr = [];
      for (let tmp = 0; tmp < textString.length;) {
        textRowArr.push(textString.substr(tmp, 10))
        tmp += 10
      }
      for (let item of textRowArr) {
        ctx.setFontSize(15);
        ctx.setFillStyle(color);
        ctx.fillText(item, 10, y);
        y += 20;
      }
      let goodsInfo = this.data.pageQRCodeData.goodsInfo;
      if (goodsInfo.isSeckill && goodsInfo.isSeckill == 1) {
        goodsInfo.virtual_price = goodsInfo.price;
        goodsInfo.price = goodsInfo.seckill_price ? goodsInfo.seckill_price : '';
      }
      if (goodsInfo.price) {
        ctx.setFontSize(16);
        ctx.setFillStyle('#FF3600');
        if (goodsInfo.integral == '2') {
          if (goodsInfo.price == '0.00') {
            ctx.fillText(goodsInfo.max_can_use_integral + '积分', 10, y + 10)
          } else {
            ctx.fillText('¥' + goodsInfo.price + '+' + goodsInfo.max_can_use_integral + '积分', 10, y + 10);
          }
        } else {
          ctx.fillText('¥' + goodsInfo.price, 10, y + 10);
        }
      }
      ctx.setFontSize(10);
      ctx.setFillStyle('#666666');
      let userInfo = this.data.pageQRCodeData.userInfo;
      let pathNickName = userInfo.nickName;  //用户昵称
      let shareTitle = "推荐给您一个好物";  //分享标题
      ctx.fillText('长按识别', 183, 354);
      ctx.setFontSize(12);
      ctx.setFillStyle('#333333');
      ctx.fillText(pathNickName, 54, 26);
      ctx.setFontSize(11);
      ctx.setFillStyle('#666666');
      ctx.fillText(shareTitle, 54, 43);
      ctx.beginPath()
      ctx.stroke()
    },
    setDrawImage: function (ctx, src, x, y, w, h) {
      wx.getImageInfo({
        src: app.getSiteBaseUrl() + '/index.php?r=Download/DownloadResourceFromUrl&url=' + src,
        success: function (res) {
          ctx.drawImage(res.path, x, y, w, h);
          ctx.restore()//恢复之前保存的绘图上下文
          ctx.draw(true);
        }
      })
    },
    groupDrawing: function () {
      const goodsInfo = this.data.pageQRCodeData.goodsInfo;
      const ctx = wx.createCanvasContext('goodsImage', this);
      this.setDrawImage(ctx, goodsInfo.goods_img, 10, 10, 260, 260);
      this.setDrawImage(ctx, 'http://test2.zhichiwangluo.com/static/webapp/images/seckill-share-icon.png', 10, 252, 62, 18);
      ctx.setFillStyle('#ffffff');
      ctx.fillRect(0, 0, 280, 420);
      ctx.draw(true);
      this.setGroupFillText(ctx, goodsInfo.text, '#333333', 300);
      ctx.draw(true);
    },
    setGroupFillText: function (ctx, title, color, y) {
      const titleStr = title.length > 40 ? title.substr(0, 37) + '...' : title;
      const goodsInfo = this.data.pageQRCodeData.goodsInfo;
      let titles = [];
      for (let tmp = 0; tmp < titleStr.length;) {
        titles.push(titleStr.substr(tmp, 20))
        tmp += 20;
      }
      for (let item of titles) {
        ctx.setFontSize(20);
        ctx.setFillStyle(color);
        ctx.fillText(item, 10, y);
        y += 20;
      }
      y += 10;
      if (goodsInfo.groupType) {
        ctx.setFillStyle('rgba(255, 55, 0, 0.12)');
        ctx.fillRect(10, y - 10, (goodsInfo.groupType.length * 10) + 8, 14);
        ctx.setFontSize(10);
        ctx.setFillStyle('#FF3700');
        ctx.fillText(goodsInfo.groupType, 14, y);
        y += 20;
      }
      if (goodsInfo.price) {
        ctx.setFontSize(16);
        ctx.setFillStyle('#FF3600');
        let price = '';
        if (goodsInfo.integral == 2) {
          if (goodsInfo.price == 0) {
            price = goodsInfo.max_can_use_integral + '积分';
          } else {
            price = '¥' + goodsInfo.price + '+' + goodsInfo.max_can_use_integral + '积分';
          }
        } else {
          price = '¥' + goodsInfo.price;
        }
        ctx.fillText(price, 10, y + 10);
        y += 25;
      }
      const virtual_price = goodsInfo.virtual_price;
      if (virtual_price) {
        ctx.setFontSize(12);
        ctx.setFillStyle('#999');
        ctx.fillText('单买价：¥' + virtual_price, 10, y + 10);
        ctx.beginPath();
        ctx.setStrokeStyle('#999');
        ctx.moveTo(60, y + 6);
        ctx.lineTo(60 + (String(virtual_price).length + 1) * 6 + 4, y + 6);
        ctx.stroke();
      }
      this.setGroupQrCode(ctx, goodsInfo, 294 + titles.length * 20);
    },
    setGroupQrCode: function (ctx, goodsInfo, y) {
      this.setDrawImage(ctx, goodsInfo.qrcode_img_url, 210, y, 50, 50);
      ctx.setFontSize(8);
      ctx.setFillStyle('#666666');
      ctx.fillText('长按识别二维码', 210, y + 64);
      ctx.beginPath()
      ctx.stroke()
    },
    getShareToMomentsSwitch: function () {
      let that = this;
      app.sendRequest({
        url: '/index.php?r=AppData/GetShareToMomentsSwitch',
        data: {
        },
        success: function (res) {
          that.setData({
            showShare: res.data
          });
        }
      });
    },
    hideShareDialog: function () {
      let animation = wx.createAnimation({
        duration: 200,
        timingFunction: "ease"
      })
      this.animation = animation;
      animation.bottom("-320rpx").step()
      this.setData({
        "pageQRCodeData.shareDialogShow": "100%",
        "pageQRCodeData.shareMenuShow": false,
        "pageQRCodeData.animation": animation.export(),
        "pageQRCodeShow": false
      })
    },
    showPageCode: function () {
      let animation = wx.createAnimation({
        duration: 200,
        timingFunction: "ease"
      })
      this.animation = animation;
      animation.bottom("0").step()
      this.setData({
        "pageQRCodeData.animation": animation.export(),
        pageQRCodeShow: true
      }, () => {
        if (!this.data.pageQRCodeData.drawType || this.data.pageQRCodeData.drawType == 1) {
          if (this.data.pageQRCodeData.goodsInfo.isGroup) {
            this.groupDrawing();
          } else {
            this.drawing();
          }
          return;
        }
        if (!this.data.canvas) {
          wx.createSelectorQuery().in(this).select('#canvas2d').fields({
            node: true,
            size: true,
          }).exec(this.initCanvas.bind(this))
        }else {
          this.drawShareImg()
        }
      });
    },
    stopPropagation: function () {
    },
    savePageCode: function () {
      let _this = this;
      if(_this.data.pageQRCodeData.drawType > 1) {
        _this.saveCanvas2DCode()
        return
      }
      wx.canvasToTempFilePath({
        fileType: 'jpg',
        canvasId: 'goodsImage',
        width:240,
        height:379,
        success(res) {
          _this.pageCode(res.tempFilePath);
        }
      }, this)
    },
    pageCode: function (url) {
      let animation = wx.createAnimation({
        duration: 200,
        timingFunction: "ease"
      })
      let that = this;
      wx.showLoading({ mask: true })
      wx.saveImageToPhotosAlbum({
        filePath: url,
        success: function (data) {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 4000
          })
          that.animation = animation;
          that.animation.bottom("-320rpx").step();
          that.setData({
            "pageQRCodeData.shareDialogShow": "100%",
            "pageQRCodeData.shareMenuShow": false,
            "pageQRCodeData.animation": that.animation.export(),
            "pageQRCodeShow": false
          })
        },
        fail: function (res) {
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
        },
        complete: function (res) {
          wx.hideLoading();
        }
      })
    },
    getUserFn: function () {
      this.triggerEvent("run")
      this.hideShareDialog()
    },
    initCanvas(res) {
      const {width, height, node} = res[0]
      const ctx = node.getContext('2d')
      const dpr = wx.getSystemInfoSync().pixelRatio
      node.width = width * dpr
      node.height = height * dpr
      ctx.scale(dpr, dpr)
      this.setData({ "canvas": node })
      this.drawShareImg()
    },
    saveCanvas2DCode: function () {
      let canvas = this.data.canvas
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
          this.pageCode(res.tempFilePath);
        }
      })
    },
    drawShareImg() {
      let node = this.data.canvas
      let { drawType, goodsType, canvasStyle, goodsInfo } = this.data.pageQRCodeData;
      DrawShare.getInstance(node, goodsType, goodsInfo, drawType, {
        'canvas': canvasStyle
      }).init()
    }
  },
})
