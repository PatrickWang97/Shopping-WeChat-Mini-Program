var app = getApp();
Page({
  data: {
    orderId: '',
    deliverType: 0,
    indemnityOrderData: {},
    isFromBack: false,
    indemnityExplain: {},
    isShowBtn: true
  },
  onLoad: function (options) {
    this.setData({
      orderId: options.orderId,
      deliverType: options.deliverType
    })
    this.dataInitial();
  },
  onReady: function () {
  },
  onShow: function () {
    this.dataInitial();
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
  dataInitial: function(){
    this.getTransportIndemnityOrder();
    this.getIndemnityExplainParam();
  },
  getTransportIndemnityOrder: function() {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/getTransportIndemnityOrder',
      data: {
        order_id: that.data.orderId
      },
      success: function (res) {
        that.setData({
          indemnityOrderData: res.data
        })
        if(res.data.length > 3){
          that.setData({
            isShowBtn: false
          })
          return;
        }
        for(let i = 0;i < res.data.length; i++){
          if (res.data[i].status == 1){
            that.setData({
              isShowBtn: false
            })
            return;
          }
        }
      }
    });
  },
  indemnity: function() {
    app.turnToPage('/orderMeal/pages/takeoutFeedback/takeoutFeedback?orderId=' + this.data.orderId + '&deliverType=' + this.data.deliverType);
  },
  toBalance: function() {
    app.turnToPage('/eCommerce/pages/balance/balance');
  },
  getIndemnityExplainParam: function () {
    let submitData = {
      order_id: this.data.orderId
    }
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/getIndemnityExplainParam',
      method: 'post',
      data: submitData,
      success: function (res) {
        that.setData({
          indemnityExplain: res.data
        })
      }
    })
  },
  previewImage: function (e) {
    var dataset = e.currentTarget.dataset;
    app.previewImage({
      current: dataset.src,
      urls: dataset.previewImgarr,
    });
  }
})