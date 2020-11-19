var app = getApp()
Page({
  data: {
    franchiseeList: []
  },
  onLoad: function(options){
    app.globalData.franchiseeListRefresh = false;
    this.getMyAppShopList();
  },
  onShow: function(){
    if (app.globalData.franchiseeListRefresh ){
      this.getMyAppShopList();
      app.globalData.franchiseeListRefresh = false;
    }
  },
  onPullDownRefresh: function(){
    this.getMyAppShopList();
  },
  getMyAppShopList: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetMyAppShopList',
      data: {
        parent_app_id: app.getAppId()
      },
      success: function (res) {
        that.setData({
          franchiseeList: res.data
        });
        if(res.data.length == 1){
          let current = res.data[0];
          let appid = current.app_id;
          app.turnToPage('/franchisee/pages/franchiseeEnterStatus/franchiseeEnterStatus?franchisee=' + appid);
        }
        wx.stopPullDownRefresh();
      }
    })
  },
  turnToFranchiseeEnter: function() {
    app.turnToPage('/franchisee/pages/franchiseeEnter/franchiseeEnter');
  },
  turnToFranchiseeEnterStatus: function (event) {
    let appid = event.currentTarget.dataset.appid;
    app.turnToPage('/franchisee/pages/franchiseeEnterStatus/franchiseeEnterStatus?franchisee=' + appid);
  },
})
