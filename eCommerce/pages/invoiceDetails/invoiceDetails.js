var app = getApp();
Page({
  data: {
    showDialog: false,
    orderId: '',
    url: '',
    invoiceType: '',
    taker_email: '',
  },
  onLoad: function (options) {
    this.setData({
      invoiceType: options.invoiceType,
      orderId: options.orderId,
    });
    this.getDefualtData();
  },
  onReady: function () {
  },
  onShow: function () {
  },
  onHide: function () {
  },
  onUnload: function () {
  },
  onPullDownRefresh: function () {
  },
  onReachBottom: function () {
  },
  onShareAppMessage: function () {
  },
  getDefualtData: function () {
    let _this = this;
    let param = {
      order_id: this.data.orderId,
      liberal_invoice_type: this.data.invoiceType
    }
    app.sendRequest({
      url: '/index.php?r=AppInvoice/ViewInvoice',
      data: param,
      success: function (res) {
        _this.setData({
          url: res.data.invoice_url,
          taker_email: res.data.taker_email,
        });
      }
    })
  },
  localPreservation: function () {
    let _this = this;
    app.downloadFile(this.data.url ,(res) => {
      wx.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: function (data) {
          wx.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          })
        },
      })
    })
  },
  cancel: function () {
    this.setData({
      showDialog: false,
    })
  },
  checkEmail: function (e) {
    this.data.taker_email = e.detail.value;
  },
  sendEmail: function () {
    let _this = this;
    if (!this.data.taker_email) {
      app.showModal({
        content: '请输入邮箱'
      });
      return true;
    }
    if (this.data.taker_email && !/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(this.data.taker_email)) {
      app.showModal({
        content: '请输入正确的邮箱'
      });
      return true;
    }
    let param = {
      email: this.data.taker_email,
      order_id: this.data.orderId,
      liberal_invoice_type: this.data.invoiceType,
    }
    app.sendRequest({
      url: '/index.php?r=AppInvoice/SendInvoiceToEmail',
      data: param,
      success: function (res) {
        let timer = setTimeout(() => {
          app.hideToast();
          app.showToast({
            title: '发送成功',
            icon: 'success',
            duration: 1500
          });
          clearTimeout(timer);
        });
        _this.setData({
          showDialog: false,
        })
      }
    })
  },
  emailDailog: function () {
    this.setData({
      showDialog: true,
    })
  }
})