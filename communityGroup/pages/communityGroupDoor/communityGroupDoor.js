var app = getApp();
Page({
  data: {
    promoterRequirement: false,
    requirementCount: '',
    canApply: true,
    consumption: '',
    consumptionGap: '',
    completePercent: 0,
  },
  onLoad: function (options) {
    this.dataInitial()
  },
  dataInitial: function () {
    let that = this;
    let distributionInfo = app.globalData.getDistributionInfo;
    this.setData({
      promoterRequirement: distributionInfo.threshold_type != 1 ? true : false,
      requirementCount: distributionInfo.threshold_requirement
    })
    if (distributionInfo.threshold_type != 1) {
      that.getTotalExpense();
    }
  },
  getTotalExpense: function () {
    var that = this,
      canApply = '',
      requirementCount = that.data.requirementCount;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getTotalExpense',
      success: function (res) {
        if (res.data < requirementCount) {
          canApply = false;
          that.setData({
            canApply: canApply
          })
        }
        that.setData({
          consumption: res.data,
          consumptionGap: (requirementCount - res.data).toFixed(2),
          completePercent: res.data / requirementCount * 100
        })
      }
    })
  },
  toApply: function() { //去首页
    if(this.data.canApply) {
      app.turnToPage('/communityGroup/pages/communityGroupApply/communityGroupApply')
    } else {
      let router = app.getHomepageRouter();
      app.reLaunch({
        url: '/pages/' + router + '/' + router
      });
    }
  }
})