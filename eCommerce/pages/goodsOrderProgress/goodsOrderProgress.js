var app = getApp();
Page({
  data: {
    orderFlowData: []
  },
  orderId: '',
  onLoad: function (options) {
    this.orderId = options.orderId;
    this.getOrderFlow();
  },
  onShow: function () {
  },
  getOrderFlow: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/getOrderFlow',
      data: {
        order_id: _this.orderId,
      },
      success: function (res) {
        let orderFlowData = res.data.reverse ();
        _this.setData({
          orderFlowData: orderFlowData
        })
      }
    })
  }
})