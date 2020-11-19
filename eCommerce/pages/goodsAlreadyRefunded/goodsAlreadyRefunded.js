var app = getApp();
Page({
  data: {
    alreadyGoods: []
  },
  onLoad: function (options) {
    let orderId = options.detail || '';
    orderId ? this.getOrderDetail(orderId) : this.dataInitial();
  },
  onShow: function () {
  },
  dataInitial: function(){
    this.getAlreadyGoods();
  },
  getAlreadyGoods: function(){
    let alreadyGoods = getCurrentPages()[getCurrentPages().length - 2].data.orderInfo.goods_info;
    let refundPrice = getCurrentPages()[getCurrentPages().length - 2].data.orderInfo.refunded_price;
    this.setData({
      alreadyGoods: alreadyGoods,
      refundPrice: refundPrice
    })
  },
  getOrderDetail: function (order_id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getOrder',
      data: {
        order_id: order_id
      },
      success: function (res) {
        that.setData({
          alreadyGoods: res.data[0].form_data.goods_info,
          refundPrice: res.data[0].form_data.refunded_price
        })
      }
    })
  },
  showPackageInfoFn: function (e) { 
    let status = e.currentTarget.dataset.status;
    let index = e.currentTarget.dataset.index;
    let goodsList = this.data.alreadyGoods;
    goodsList[index].showPackageInfo = status == 1 ? true : false;
    this.setData({
      alreadyGoods: goodsList
    })
  },
})