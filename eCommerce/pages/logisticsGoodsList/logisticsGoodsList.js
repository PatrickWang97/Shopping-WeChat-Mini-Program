var app = getApp()
Page({
  data: {
    orderId: '',//订单id
    goodsData: [],//商品数据
  },
  onLoad: function (options) {
    this.setData({
      orderId: options.orderId || '',
      franchiseeId: options.franchiseeId || ''
    })
    this.getOrderInfo()
  },
  getOrderInfo: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=/ExpressAssistant/GetPackageExpressByPage',
      data: {
        order_id: that.data.orderId,
        order: 'asc',
        orderby:'add_time'
      },
      method: 'post',
      success: function (res) {
        that.setData({
          goodsData: res.data
        })
      },
      fail: function (res) {
        console.log(res)
      }
    });
  },
  selectSinglePackage: function (event) {
    let index = event.currentTarget.dataset.index;
    let data = this.data.goodsData[index];
    let url = '/eCommerce/pages/logisticsPage/logisticsPage?detail=' + data.order_id + '&package_id=' + data.package_id
    app.turnToPage(url);
  }
})