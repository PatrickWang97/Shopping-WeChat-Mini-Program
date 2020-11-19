var app = getApp();
Page({
  data: {
    current_phone: '',
    mask_show: false,
    mask_success: false,
    userData: {}, //用户个人信息
    failTip: '',
    accountRequesting: false
  },
  onLoad: function (options) {
    this.dataInitial();
  },
  dataInitial: function () {
    this.GetAccountIfCouldMerge({
      app_id: app.getAppId(),
      session_key: app.globalData.sessionKey
    });
  },
  GetAccountIfCouldMerge: function (data) {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAccountIfCouldMerge',
      data: data,
      success: function (res) {
        that.setData({
          'current_phone': res.data.current_phone,
          'userData': res.data.list ? res.data.list[0] : '',
        });
      }
    })
  },
  userCollectConfirm: function () {
    var that = this;
    var that = this;
    if (that.data.accountRequesting){
      return;
    }
    that.setData({
      accountRequesting: true
    })
    app.sendRequest({
      url: '/index.php?r=AppShop/RequestToMergeAccount',
      data: {
        app_id: app.getAppId(),
        session_key: app.globalData.sessionKey,
        merged_user_token: this.data.userData.user_token
      },
      success: function (res) {
        if (res.data.code === 0) {
          that.setData({
            mask_show: true,
            mask_success: true,
          })
        } else if (res.data.code === 1) {
          that.setData({
            mask_show: true,
            mask_success: false,
            failTip: res.data.data
          })
        }
      },
      complete: function(){
        setTimeout(function(){
          that.setData({
            accountRequesting: false
          })
        }, 500);
      }
    })
  },
  userCollectReject: function () {
    let chainParam = app.globalData.chainAppId ? '?franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/userCenter/pages/userCenter/userCenter' + chainParam, 1);
  },
  successConfirm: function () {
    let chainParam = app.globalData.chainAppId ? '?franchisee=' + app.globalData.chainAppId : '';
    app.turnToPage('/userCenter/pages/userCenter/userCenter' + chainParam, 1);
  },
  failConfirm: function () {
    this.setData({
      mask_show: false,
      mask_success: false,
    })
  }
})