var app = getApp();
var WxParse = require('../../../components/wxParse/wxParse.js');
Page({
  data: {
    showBtn: false,
    recuitData: []
  },
  onLoad: function (options) {
    let showBtn = options.isAudit ? false : true;
    this.setData({
      showBtn: showBtn
    })
    this.getShopExplain()
  },
  getShopExplain: function () {
    let shopMessage = app.globalData.getDistributionInfo.role_setting[6].illustration;
    if (shopMessage != '') {
      this.setData({
        recuitData: shopMessage
      })
      shopMessage = shopMessage ? shopMessage.replace(/\u00A0|\u2028|\u2029|\uFEFF/g, '') : shopMessage;
      WxParse.wxParse('wxParseDescription', 'html', shopMessage, this, 10);
    }
  },
  goToApply(){
    console.log('进入社区团购')
    app.turnToPage('/communityGroup/pages/communityGroupApply/communityGroupApply', 1)
  }
})