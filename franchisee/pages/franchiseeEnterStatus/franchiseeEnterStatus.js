var app = getApp()
Page({
  data: {
    franchiseeId: '',
    franchiseeInfo: {},
    appShopInfo: {}
  },
  onLoad: function(options){
    let franchiseeId = options.franchisee;
    this.setData({
      franchiseeId: franchiseeId
    });
    app.globalData.franchiseeEnterStatusRefresh = false;
    this.getAppShop();
    this.getAppShopInfo();
  },
  onShow: function(){
    if (app.globalData.franchiseeEnterStatusRefresh){
      this.getAppShop();
      app.globalData.franchiseeEnterStatusRefresh = false;
    }
  },
  turnToFranchiseePerfect: function(){
    let franchiseeinfo = this.data.franchiseeInfo;
    app.turnToPage('/franchisee/pages/franchiseePerfect/franchiseePerfect?edit=true&franchisee=' + franchiseeinfo.app_id + '&shop_id=' + franchiseeinfo.id, true);
  },
  franchiseeReEnter: function(){
    let franchiseeinfo = this.data.franchiseeInfo;
    app.turnToPage('/franchisee/pages/franchiseePerfect/franchiseePerfect?edit=true&franchisee=' + franchiseeinfo.app_id + '&shop_id=' + franchiseeinfo.id + '&type=2', true);
  },
  turnToFranchiseeDetail: function(){
    let franchiseeinfo = this.data.franchiseeInfo;
    let param = {};
    param.detail = franchiseeinfo.app_id;
    if (franchiseeinfo.is_audit != 1){
      param.shop_id = franchiseeinfo.id;
    }
    app.goToFranchisee(franchiseeinfo.mode_id, param);
  },
  getAppShop: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetMyAppShopList',
      data: {
        parent_app_id: app.getAppId(),
        sub_app_id: that.data.franchiseeId
      },
      success: function (res) {
        let data = res.data[0];
        that.setData({
          franchiseeInfo: data
        });
      }
    });
  },
  copyUrl: function(e){
    let data = e.currentTarget.dataset.url;
    app.setClipboardData({
      data: data,
      success: function(){
        app.showModal({
          content: '复制成功'
        });
      }
    });
  },
  makePhoneCall: function (e) {
    var phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  getAppShopInfo: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopInfo',
      data: {
      },
      success: function (res) {
        that.setData({
          appShopInfo: res.data
        });
      }
    });
  }
})
