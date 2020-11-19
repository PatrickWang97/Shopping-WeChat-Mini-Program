var app = getApp();
Page({
  data: {
    appTitle: '',
    appLogo: '',
    extensionId: '',        // 推广页id
    extensionItemData: {},   // 推广页面配置信息
    currentPage: ''
  },
  onLoad: function(options){
    this.setData({
      'appTitle': app.globalData.appTitle,
      'appLogo': app.globalData.appLogo,
      'extensionId': options.extension_id,
      'currentPage': options.current_page || 'home'
    });
    this.dataInitial();
  },
  dataInitial: function(){
    this.getExtensionPageData(this.data.extensionId);
  },
  getExtensionPageData(id){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppExtensionInfo/getOneExtensionInfo',
      data: {
        'id': id
      },
      hideLoading: true,
      success: function(res){
        let configData = JSON.parse(res.data.config_data);
        that.setData({
          'extensionItemData': configData
        });
        app.setPageTitle(that.data.appTitle);
      }
    })
  },
  jumpToHome: function(){
    let router = app.globalData.homepageRouter;
    let url = '/pages/' + router + '/' + router;
    app.turnToPage(url, true);
  },
  jumpToPage: function(event){
    let url = event.currentTarget.dataset.pageUrl;
    app.turnToPage(url, false);
  },
  jumpToRouter: function(event){
    let router = event.currentTarget.dataset.pageUrl;
    let url = '/pages/' + router + '/' + router;
    app.turnToPage(url, false);
  },
  copyWifiPassword: function(){
    wx.setClipboardData({
      data: this.data.extensionItemData['wifi']['wifi_password'],
      success: function(res) {
        app.showToast({
            'title': '复制成功',
            'success': function(){
            }
        });
      }
    });
  },
  showWifiPage: function(){
    let router = 'extensionPage';
    let url = '/default/pages/extensionPage/extensionPage?extension_id=' + this.data.extensionId + '&current_page=wifi';
    app.turnToPage(url, false);
  }
});