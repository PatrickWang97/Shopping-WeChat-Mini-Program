var Element = require('../../utils/element.js');
var app = getApp();
var popupWindow = new Element({
  events: {
    tapMaskClosePopupWindow: function(e){
      this.tapMaskClosePopupWindow(e);
    }
  },
  methods: {
    init: function(compid, pageInstance, isPullRefresh){
      if(isPullRefresh){
        return;
      }
      this.controlAutoPopupWindow(compid, pageInstance);
    },
    controlAutoPopupWindow: function (compid, pageInstance) {
      let _this = this;
      let newData = {};
      let compData = pageInstance.data[compid];
      let customFeature = compData.customFeature;
      let topnav = pageInstance.data['custom_top_nav1'];
      if (topnav && topnav.customFeature.isDefault == 1 && !compData.styleInit){
        let top = compData.style.match(/margin-top:(\-?([\d|\.]*))rpx;/);
        if(top){
          let systeminfo = app.getSystemInfoData();
          let rpxRatio = systeminfo.rpxRatio || 2.34375;
          let mtop = "margin-top:" + (+top[1] + (app.globalData.topNavBarHeight || 0) * rpxRatio) + "rpx;";
          let style = compData.style.replace(top[0], mtop);
          newData[compid + ".style"] = style;
          newData[compid + ".styleInit"] = true;
          pageInstance.setData(newData);
        }
      }
      if (customFeature.autoPopup === true) {
        if (customFeature.popupScene === 'everyDay' || customFeature.popupScene === 'firstAuthorize'){
          if (!app.globalData.firstLoginAppChecked) {
            app.sendRequest({
              hideLoading: true,
              url: '/index.php?r=AppData/CheckFirstLoginApp',
              success: function(data){
                app.globalData.firstAuthorize = data.data.isAppFirstLogin;
                app.globalData.dailyFirstLogin = data.data.isDailyFirstLogin;
                app.globalData.firstLoginAppChecked = true;
                _this.controlAutoPopupWindow(compid, pageInstance);
              }
            })
            return;
          }
          if((app.globalData.firstAuthorize && customFeature.popupScene === 'firstAuthorize') || (app.globalData.dailyFirstLogin && customFeature.popupScene === 'everyDay')){
            if(!pageInstance.data[compid].alreadyShown){
              newData[compid+'.showPopupWindow'] = true;
              newData[compid+'.alreadyShown'] = true;
              app.globalData.firstAuthorize = false;
              app.globalData.dailyFirstLogin = false;
              pageInstance.setData(newData);
            }
          }
        } else if (customFeature.popupScene === 'everyTime'){
          newData[compid+'.showPopupWindow'] = true;
          pageInstance.setData(newData);
        }
        if(customFeature.autoClose === true){
          setTimeout(()=>{
            newData[compid+'.showPopupWindow'] = false;
            pageInstance.setData(newData);
          }, +customFeature.closeDelay*1000);
        }
      }
    },
    tapMaskClosePopupWindow: function(event){
      let pageInstance = app.getAppCurrentPage();
      let compdata = event.currentTarget.dataset.compdata;
      let newData = {};
      if(compdata.customFeature.tapMaskClose === true){
        newData[compdata.compId+'.showPopupWindow'] = false;
        pageInstance.setData(newData);
      }
    }
  }
})
module.exports = popupWindow;