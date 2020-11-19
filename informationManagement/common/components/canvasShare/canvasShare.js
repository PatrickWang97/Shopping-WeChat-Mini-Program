Component({
  properties: {
    canvasData: {
      type: Object,
      value: {
        show: false,
        appName: '微信小程序',
        bgImg: 'https://unsplash.it/620/864?image=9',
        img: 'https://unsplash.it/620/864?image=9',
        qrcodeImg: 'https://unsplash.it/180/180?image=8',
        title: '我是标题我是标题我是标题我是标题我是标题我是标题我是标题。',
        text: '我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文我是正文。'
      }
    }
  },
  data: {
    isDraw: false, //判断是否已渲染
    canvasWidth: 0, //px单位
    canvasHeight: 0, //px单位
    bgImgInfo: {},
    imgInfo: {},
    qrcodeImgInfo: {},
    systemInfo: {},
    saveImg: '' //canvas转图片时的url
  },
  lifetimes: {
    attached() {
    }
  },
  methods: {
    initData() {
      let that = this,
          canvasData = that.data.canvasData;
      wx.showLoading({
        title: '生成海报中..',
        mask: true
      })
      that.getAllImageInfo().then(() => {
        that.getCanvasSize();
        that.drawCanvas();
      })
    },
    getCanvasSize() {
      let canvasRpxWidth = 650,
          canvasRpxHeight = 898,
          canvasPxWidth = 0,
          canvasPxHeight = 0;
      canvasPxWidth = this.rpxToPx(canvasRpxWidth);
      canvasPxHeight = this.rpxToPx(canvasRpxHeight);
      this.setData({
        canvasWidth: canvasPxWidth,
        canvasHeight: canvasPxHeight
      })
    },
    getImageInfo(src) {
      return new Promise((resolve, reject) => {
        if (!src) {
          resolve(0);
        }
        wx.getImageInfo({
          src: src,
          success: (res) => {
            if (!src.match('http')) {
              resolve({
                width: res.width,
                height: res.height,
                path: src
              })
              return;
            }
            resolve({
              width: res.width,
              height: res.height,
              path: res.path
            })
          },
          fail: (err) => {
            resolve(0);
          } 
        })
      })
    },
    getAllImageInfo() {
      return new Promise((resolve, reject) => {
        let that = this;
        let canvasData = that.data.canvasData;
        let bgImgPromise = that.getImageInfo(canvasData.bgImg);
        let qrcodeImgPromise = that.getImageInfo(canvasData.qrcodeImg);
        let imgPromise = that.getImageInfo(canvasData.img);
        let promiseArr = [bgImgPromise, qrcodeImgPromise, imgPromise];
        Promise.all(promiseArr).then(res => {
          wx.hideLoading();
          let saveKeys = ['bgImgInfo', 'qrcodeImgInfo', 'imgInfo'];
          for (let i = 0; i < res.length; i++) {
            let saveKey = saveKeys[i];
            if (res[i] != 0) {
              that.setData({
                [saveKey]: res[i]
              })
            }
          }
          console.log(that.data);
          resolve();
        }).catch(err => {
          console.log(err);
          reject();
        })
      })
    },
    drawCanvas() {
      console.log('开始画');
      let that = this,
          canvasData = this.data.canvasData,
          canvasWidth = this.data.canvasWidth,
          canvasHeight = this.data.canvasHeight,
          imgInfo = this.data.imgInfo,
          bgImgInfo = this.data.bgImgInfo,
          qrcodeImgInfo = this.data.qrcodeImgInfo;
          console.log(this.data);
      const ctx = wx.createCanvasContext('mycanvas', this);
      ctx.rect(0, 0, canvasWidth, canvasHeight);
      ctx.setFillStyle('#ffffff');
      ctx.fill();
      ctx.drawImage(bgImgInfo.path, that.rpxToPx(24), that.rpxToPx(20), canvasWidth - that.rpxToPx(48), that.rpxToPx(429));
      if ((canvasData.text && canvasData.text != " ") || canvasData.title) {
        ctx.beginPath();
        ctx.setFontSize(that.rpxToPx(30));
        ctx.setFillStyle('#333333');
        ctx.setTextAlign('left');
        ctx.font = 'bold ' + that.rpxToPx(30) + 'px Arial';
        let textRow = that.cutTexToArray({
          ctx,
          text: canvasData.title+' | '+canvasData.text,
          textSize: that.rpxToPx(30),
          maxWidth: that.rpxToPx(602),
          maxRow: 3
        });
        for (let i = 0; i < textRow.length; i++) {
          ctx.fillText(textRow[i], that.rpxToPx(24), that.rpxToPx(497 + 42 * i));
        }
        ctx.closePath();
      } else if (imgInfo.width) {//单图
        let imageHeight = that.rpxToPx(200),
            imageWidth = imageHeight / imgInfo.height * imgInfo.width;
        ctx.drawImage(imgInfo.path, (that.rpxToPx(310) - imageWidth / 2), that.rpxToPx(300), imageWidth, imageHeight);
      } else {}
      ctx.beginPath();
      if (qrcodeImgInfo.path) {
        ctx.drawImage(qrcodeImgInfo.path, that.rpxToPx(235), that.rpxToPx(610), that.rpxToPx(167), that.rpxToPx(163));
      }
      ctx.setFontSize(that.rpxToPx(24));
      ctx.setFillStyle('#595f7b');
      ctx.setTextAlign('center');
      ctx.fillText('长按小程序码识别查看详情', that.rpxToPx(310), that.rpxToPx(820));
      ctx.fillText(`分享自${ canvasData.appName }`, that.rpxToPx(310), that.rpxToPx(855));
      ctx.closePath();
      ctx.draw(false, () => {
        that.setData({
          isDraw: true
        })
        wx.hideLoading();
        wx.canvasToTempFilePath({
          canvasId: 'mycanvas',
          quality: 1,
          success: (res) => {
            that.setData({
              saveImg: res.tempFilePath
            })
          }
        }, that);
      });
    },
    rpxToPx(rpx) {
      let systemInfo = this.data.systemInfo;
      if (!systemInfo.clientWidth) {
        systemInfo = wx.getSystemInfoSync();
        this.setData({
          systemInfo
        })
      }
      let px = systemInfo.windowWidth / 750 * rpx;
      return px;
    },
    cutTexToArray(options) { //传人画布，裁剪文字以换行
      let {
        ctx,
        text,
        textSize,
        maxWidth,
        maxRow
      } = options;
      maxWidth = maxWidth || this.rpxToPx(750);
      maxRow = maxRow || 5;
      let row = "",
          rows = [],
          chars = text.split("");
      if (text) {
        let lineNum = parseInt(maxWidth / textSize);
        if (text.length <= lineNum) {
          rows.push(text);
        } else if (text.length > lineNum && text.length <= (lineNum * maxRow)) {
          let length = parseInt(text.length / lineNum);
          for (let i = 0; i < length; i++) {
            row = text.slice(lineNum * i, lineNum * (i + 1));
            rows.push(row);
          }
          row = text.slice(length * lineNum, text.length);
          rows.push(row);
        } else if (text.length > lineNum && text.length > (lineNum * maxRow)) {
          let length = maxRow;
          for (let i = 0; i < length; i++) {
            row = text.slice(lineNum * i, lineNum * (i + 1));
            if (i == length - 1) {
              row = row.slice(0, -2);
              row += "...";
            }
            rows.push(row);
          }
        } else {}
        return rows;
      }
      for (let i = 0; i < chars.length; i++) {
        let textsize = ctx.measureText(row);
        if (textSize.width <= maxWidth) {
          if (i == (chars.length - 1) && rows.length < maxRow) {
            row += chars[i];
            rows.push(row);
            break;
          }
          row += chars[i];
        } else {
          i--;
          if (rows.length < maxRow) {
            if (rows.length + 1 == maxRow) {
              row = row.slice(0, -2);
              row += "...";
            }
            rows.push(row);
          }
          row = "";
        }
      }
      return rows;
    },
    canvasToImage() {
      wx.saveImageToPhotosAlbum({
        filePath: this.data.saveImg,
        success() {
          wx.showToast({
            title: '已保存至相册',
            icon: 'success'
          })
        }
      })
    },
    closePanel() {
      this.setData({
        'canvasData.show': false
      })
    },
    nothing() {
    }
  },
  observers: {
    'canvasData.**'(field) {
      if (field.show) {
        if ((field.title && field.text) || field.img) {
          this.initData();
        }
      }
    }
  }
})
