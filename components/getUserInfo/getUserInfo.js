var app = getApp();
Component({
  properties: {
    showGetUserInfo: {
      type: Boolean,
      value: false,
      observer: function (newVal, oldVal){
        console.log(newVal, oldVal);
        if (newVal){
          let pageRoute = app.getAppCurrentPage().route;
          let fullPages = ['pages/tabbarTransferPage/tabbarTransferPage', 'pages/tabbarGroupCenter/tabbarGroupCenter', 'pages/tabbarMyOrder/tabbarMyOrder'];
          let pageInstance = app.getAppCurrentPage();
          if (pageInstance.data.page_hasNavBar) {
            this.setData({
              topNavBarHeight: app.globalData.topNavBarHeight
            })
          }
          this.setData({
            showGetUserInfoNormal: true
          });
        }else if (newVal === false){
          this.setData({
            showGetUserInfo: false,
            showGetUserInfoNormal: false
          });
        }
      }
    }
  },
  data: {
    showGetUserInfo: false,
    showGetUserInfoNormal: false,
    appLogo: '',
    consentAgreement: true
  },
  ready: function(){
    this.setData({
      appLogo: app.globalData.appLogo
    })
  },
  methods: {
    refuseGetInfo: function(){
      this.setData({
        showGetUserInfo: false,
        showGetUserInfoNormal: false
      });
      app._logining = false;
      let pages = getCurrentPages();
      if (app.globalData.hasFranchiseeChain) {
        let callback = app.globalData.showGetUserInfoOptions;
        for (let i = 0; i < callback.length; i++) {
          let options = callback[i];
          typeof options.refuseBack == 'function' && options.refuseBack();
        }
      }
      app.globalData.showGetUserInfoOptions = [];
      if(pages.length > 1){
        app.turnBack();
      }
    },
    bindGetUserInfo: function(e){
      app._logining = false;
      if (/getUserInfo:fail/.test(e.detail.errMsg)){
          this.refuseGetInfo();
      }else{
        this.setData({
          showGetUserInfo: false,
          showGetUserInfoNormal: false
        });
        app._sendUserInfo(e.detail);
        app.bindUserCrmWxAccount(e.detail);
      }
    },
    checkboxChange: function(){
      this.setData({
        consentAgreement: !this.data.consentAgreement
      })
    }
  }
})
