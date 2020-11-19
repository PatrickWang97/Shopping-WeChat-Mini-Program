Page({
  data: {
    activityType: 0,
    autoRefund: '',
    refundMode: ''
  },
  onLoad: function(options) {
    var _this = this,
    titleType = '';
    _this.getPlayMessage();
    _this.setData({
      activityType: options.activityType,
      autoRefund: options.autoRefund,
      refundMode: options.refundMode
    })
    switch(options.activityType){
      case "0":
        titleType = '';
        break;
      case "1": 
        titleType = '新人团';
        break;
      case "2":
        titleType = '阶梯团';
        break;
      case "3": 
        titleType = '帮帮团';
        break;
      case "4":
        titleType = '抽奖团';
        break;
    };
    wx.setNavigationBarTitle({
      title: titleType  + '拼团须知'
    })
  },
  getPlayMessage() {
  },
  onReady: function() {
  },
  onShow: function() {
  },
  onHide: function() {
  },
  onUnload: function() {
  },
  onPullDownRefresh: function() {
  },
  onReachBottom: function() {
  },
  onShareAppMessage: function() {
  }
})