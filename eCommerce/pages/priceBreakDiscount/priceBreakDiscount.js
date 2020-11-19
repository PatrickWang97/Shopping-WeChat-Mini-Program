const app = getApp();
Page({
  data: {
    id: '',
  },
  onLoad: function (options) {
    this.setData({
      priceBreakDiscountData: app.globalData.priceBreakDiscountData,
      id: options.id || '',
    })
  },
})