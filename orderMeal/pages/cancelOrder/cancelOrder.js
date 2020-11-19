var app = getApp();
Page({
  data: {
    cancelReason: [],
    orderId: '',
    deliverType: 0,
    submitData: {
      order_id: '',
      app_id: '',
      sub_shop_app_id: '',
      refund_reason: '',
      description: '',
      img_url: []
    },
    reasonIndex: '',
    isShowInstruction: false,
    isFromBack: false,
    isShowText: true
  },
  onLoad: function (options) {
    this.data.orderId = options.orderId;
    this.data.deliverType = options.deliverType;
    this.data.submitData.app_id = app.getAppId();
    this.data.submitData.sub_shop_app_id = options.franchisee || '';
    this.dataInitial();
  },
  onReady: function () {
  },
  onShow: function () {
    if (this.data.isFromBack) {
      this.dataInitial();
    } else {
      this.setData({
        isFromBack: true
      });
    }
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
  dataInitial: function () {
    this.getBuyerCancelReason();
  },
  getBuyerCancelReason: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/getBuyerCancelReason',
      data: {
        deliver_type: this.data.deliverType
      },
      success: function (res) {
        if (res.status === 0) {
          that.setData({
            cancelReason: res.data
          });
        }
      }
    });
  },
  chooseImage: function (e) {
    var that = this,
      img_url = that.data.submitData.img_url;
    if (img_url.length >= 3) {
      app.showModal({
        content: '每个商品最多上传3张图片'
      });
      return;
    }
    app.chooseImage(function (images) {
      var data = {};
      data['submitData.img_url'] = img_url.concat(images);
      that.setData(data);
    }, 3 - img_url.length);
  },
  removePic: function (e) {
    var picIndex = e.currentTarget.dataset.picIndex,
      img_url = this.data.submitData.img_url,
      data = {};
    img_url.splice(picIndex, 1);
    data['submitData.img_url'] = img_url;
    this.setData(data);
  },
  chooseReason: function (e) {
    var chooseIndex = e.currentTarget.dataset.reasonIndex,
      data = {};
    data['submitData.refund_reason'] = chooseIndex;
    data.reasonIndex = chooseIndex;
    this.setData(data);
  },
  applyDrawback: function (e) {
    var that = this,
      submitData = that.data.submitData;
    submitData.order_id = this.data.orderId;
    submitData.app_id = app.getAppId();
    if (!submitData.refund_reason) {
      app.showModal({
        content: '选择一个原因'
      })
      return;
    }
    if (submitData.img_url.length > 3) {
      app.showModal({
        content: '最多上传3张图片'
      })
      return;
    }
    that.showInstruction();
    that.setData({
      isShowText: false
    })
  },
  showInstruction: function () {
    this.setData({ isShowInstruction: true });
  },
  hideInstruction: function () {
    var that = this,
      submitData = that.data.submitData;
      submitData.order_id = this.data.orderId;
      submitData.app_id = app.getAppId();
    app.sendRequest({
      url: '/index.php?r=AppShop/applyRefund',
      method: 'post',
      data: submitData,
      success: function (res) {
        app.sendUseBehavior([{goodsId: submitData.order_id,}],6); // 行为轨迹埋点 申请退款
        that.setData({ isShowInstruction: false });
        app.turnBack();
      },
      complete: function() {
        that.setData({ isShowInstruction: false });
      }
    })
  },
  commentInput: function (e) {
    this.data.submitData.description = e.detail.value;
  },
})