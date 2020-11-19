var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    identity: ''
  },
  onLoad: function (options) {
    this.dataInitial()
  },
  dataInitial: function () {
    this.getDistributorInfo();
    this.getDistributionInfo();
  },
  goToLeaderPromotion: function(){
    app.turnToPage('/promotion/pages/promotionLeaderPromotion/promotionLeaderPromotion');
  },
  getDistributorInfo:function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      success: function (res) {
        that.setData({
          identity: res.data.role
        })
      }
    })
  },
  getDistributionInfo: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributionInfo',
      success: function (res) {
        _this.setData({
          distributionInfo: res.data
        })
      }
    })
  },
  makePhoneCall: function(){
    app.makePhoneCall(this.data.distributionInfo.tele_phone);
  }
})
