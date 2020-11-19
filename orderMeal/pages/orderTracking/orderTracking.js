var app = getApp()
Page({
  data: {
  },
  onLoad: function (options) {
    this.orderId = options.orderId;
  },
  onReady: function () {
  },
  onShow: function () {
    this.getTransport(this.orderId);
  },
  getTransport: function (order_id) {
    let that = this;
    app.sendRequest({
      url:'/index.php?r=AppTransport/getTransportOrderFlow',
      method: "post",
      data: {
        order_id: order_id
      },
      success:function(res){
        console.log(res.data.reverse());
        console.log(res.data);
        that.setData({
          orderFlow: res.data
        })
      },
    })
  },
})