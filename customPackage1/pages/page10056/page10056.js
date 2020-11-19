var app      = getApp();
var pageData = {
  data: {"free_vessel1":{"type":"free-vessel","style":"margin-left:0rpx;width:750rpx;height:707.75556564331rpx;margin-bottom:auto;opacity:1;margin-top:0rpx;margin-right:auto;","content":[{"type":"picture","style":"border-color:rgb(34, 34, 34);background-color:transparent;border-width:0rpx;margin-left:0;width:750rpx;left:0rpx;height:712.5rpx;position:absolute;opacity:1;border-style:none;border-radius:0rpx;top:0rpx;margin-top:0;margin-right:0;","content":"http:\/\/img.weiye.me\/zcimgdir\/album\/file_590a9d8a836aa.png","customFeature":{"boxShadow":"5","boxColor":"#000","boxX":"0","boxY":"0","boxR":"5","photoRatio":"1.05"},"animations":[],"hidden":false,"compId":"data.content[0]","parentCompid":"free_vessel1"}],"customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":5,"boxStyle":false,"boxX":0,"boxY":0},"animations":[],"hidden":false,"page_form":"","compId":"free_vessel1"},"free_vessel2":{"type":"free-vessel","style":"background-color:rgb(255, 255, 255);margin-left:0rpx;width:750rpx;height:84.350591897964rpx;margin-bottom:auto;opacity:1;margin-top:0rpx;margin-right:auto;","content":[{"type":"button","style":"line-height:70.3125rpx;border-color:rgb(34, 34, 34);color:rgb(255, 255, 255);background-color:rgb(38, 58, 65);border-width:4.6875rpx;text-align:center;margin-left:0;width:421.875rpx;left:161.71875rpx;height:70.3125rpx;position:absolute;opacity:1;border-style:none;border-radius:234.375rpx;top:11.71875rpx;margin-top:0;margin-right:0;font-size:32.8125rpx;","content":"\u7535 \u8bdd \u4e0b \u5355","customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":"5px","boxStyle":false,"boxX":"0","boxY":"0","action":"call","phone-num":"+86-13072880839"},"animations":[],"hidden":false,"compId":"data.content[0]","parentCompid":"free_vessel2","itemType":"button","itemParentType":"free-vessel","itemIndex":0,"eventParams":"{\"phone_num\":\"+86-13072880839\"}","eventHandler":"tapPhoneCallHandler"}],"customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":5,"boxStyle":false,"boxX":0,"boxY":0},"animations":[],"hidden":false,"page_form":"","compId":"free_vessel2"},"free_vessel3":{"type":"free-vessel","style":"background-color:rgb(255, 255, 255);margin-left:0rpx;width:750rpx;height:67.96875rpx;margin-bottom:auto;opacity:1;margin-top:0rpx;margin-right:auto;","content":[{"type":"text","style":"line-height:44.53125rpx;border-color:rgb(34, 34, 34);color:rgb(38, 58, 65);background-color:rgba(0, 0, 0, 0);border-width:4.6875rpx;text-align:left;margin-left:0;width:177.99480557442rpx;left:215.625rpx;height:44.270834326744rpx;position:absolute;opacity:1;border-style:none;top:7.03125rpx;margin-top:0;margin-right:0;font-size:28.125rpx;","content":"\u6d17\u8863\u70ed\u7ebf","customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":"5","boxStyle":false,"boxX":"0","boxY":"0"},"animations":[],"hidden":false,"compId":"data.content[0]","parentCompid":"free_vessel3","markColor":"","mode":0},{"type":"text","style":"line-height:44.53125rpx;border-color:rgb(34, 34, 34);color:rgb(38, 58, 65);background-color:rgba(0, 0, 0, 0);border-width:4.6875rpx;text-align:left;margin-left:0;width:248.291015625rpx;left:337.5rpx;height:88.541668653488rpx;position:absolute;opacity:1;border-style:none;top:11.71875rpx;margin-top:0;margin-right:0;font-size:28.125rpx;","content":"+86-13072880839","customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":"5","boxStyle":false,"boxX":"0","boxY":"0","action":"call","phone-num":"+86-13072880839"},"animations":[],"hidden":false,"compId":"data.content[1]","parentCompid":"free_vessel3","markColor":"","mode":0,"itemType":"text","itemParentType":"free-vessel","itemIndex":1,"eventParams":"{\"phone_num\":\"+86-13072880839\"}","eventHandler":"tapPhoneCallHandler"}],"customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":5,"boxStyle":false,"boxX":0,"boxY":0},"animations":[],"hidden":false,"page_form":"","compId":"free_vessel3"},"free_vessel4":{"type":"free-vessel","style":"background-color:rgb(255, 255, 255);margin-left:0rpx;width:750rpx;height:325.74870586395rpx;margin-bottom:auto;opacity:1;margin-top:4.6875rpx;margin-right:auto;","content":[{"type":"text","style":"line-height:44.53125rpx;border-color:rgb(34, 34, 34);color:rgb(48, 50, 49);background-color:rgba(0, 0, 0, 0);border-width:4.6875rpx;text-align:left;margin-left:0;left:39.84375rpx;height:44.53125rpx;position:absolute;opacity:1;border-style:none;top:39.84375rpx;margin-top:0;font-weight:bold;margin-right:0;font-size:32.8125rpx;","content":"\u53cb\u60c5\u63d0\u793a\uff1a","customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":"5","boxStyle":false,"boxX":"0","boxY":"0"},"animations":[],"hidden":false,"compId":"data.content[0]","parentCompid":"free_vessel4","markColor":"","mode":0},{"type":"text","style":"line-height:44.53125rpx;border-color:rgb(34, 34, 34);color:rgb(171, 171, 171);background-color:rgba(0, 0, 0, 0);border-width:4.6875rpx;text-align:left;margin-left:0;width:674.9267667532rpx;left:39.84375rpx;height:44.270834326744rpx;position:absolute;opacity:1;border-style:none;top:105.46875rpx;margin-top:0;margin-right:0;font-size:28.125rpx;","content":"1\uff09\u4e3a\u4e86\u786e\u4fdd\u60a8\u5728\u6211\u4eec\u7684\u6536\u9001\u8303\u56f4\u5185\uff0c\u8bf7\u5728\u4e0b\u5355\u524d\u67e5\u770b\u54ab\u5c3a\u6d17\u8863\u4e0a\u95e8\n2\uff09 \u4e3a\u4e86\u786e\u4fdd\u6d17\u8863\u8d28\u91cf\uff0c\u51ac\u8863\u6e05\u6d17\u5468\u671f\u4e3a3-5\u5929\n3\uff09 \u771f\u4e1d\u8863\u7269\u6e05\u6d17\u3001\u7279\u6b8a\u6c61\u6e0d\u5904\u7406\u3001\u52a0\u6025\u6d17\u9700\u8981\u989d\u5916\u52a0\u653610-30\u5143\u8d39\u7528","customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":"5","boxStyle":false,"boxX":"0","boxY":"0"},"animations":[],"hidden":false,"compId":"data.content[1]","parentCompid":"free_vessel4","markColor":"","mode":0},{"type":"text","style":"line-height:44.53125rpx;border-color:rgb(34, 34, 34);color:rgb(100, 214, 139);background-color:rgba(0, 0, 0, 0);border-width:4.6875rpx;text-align:left;margin-left:0;left:210.9375rpx;height:44.53125rpx;position:absolute;opacity:1;border-style:none;top:150rpx;margin-top:0;margin-right:0;font-size:28.125rpx;","content":"\u6536\u9001\u8303\u56f4","customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":"5","boxStyle":false,"boxX":"0","boxY":"0"},"animations":[],"hidden":false,"compId":"data.content[2]","parentCompid":"free_vessel4","markColor":"","mode":0}],"customFeature":{"boxColor":"rgb(0, 0, 0)","boxR":5,"boxStyle":false,"boxX":0,"boxY":0},"animations":[],"hidden":false,"page_form":"","compId":"free_vessel4"},"has_tabbar":0,"page_hasNavBar":false,"page_hidden":true,"page_form":"","top_nav":{"navigationBarBackgroundColor":"#ffffff","navigationBarTextStyle":"black","navigationBarTitleText":"\u6d17\u978b"},"dataId":"","page_config":{"name":"\u6d17\u978b","background-color":"rgb(243, 243, 243)","background-image":"","titleBackgroundColor":"#ffffff","titleColor":"black"}},
    need_login: false,
      bind_phone: false,
    page_router: 'page10056',
    page_form: 'none',
      dataId: '',
      list_compids_params: [],
      user_center_compids_params: [],
      goods_compids_params: [],
  prevPage:0,
      waimaiOnLoadCompidParam: [],
      tostoreComps: [],
      carouselGroupidsParams: [],
      relobj_auto: [],
      bbsCompIds: [],
      dynamicVesselComps: [],
      communityComps: [],
      franchiseeComps: [],
      cityLocationComps: [],
      seckillOnLoadCompidParam: [],
      dynamicClassifyGroupidsParams: [],
      newClassifyGroupidsParams: [],
      videoListComps: [],
      videoProjectComps: [],
      newsComps: [],
      popupWindowComps: [],
        formVesselComps: [],
      searchComponentParam: [],
      topicComps: [],
      topicClassifyComps: [],
      topicSortComps: [],
      rowNumComps: [],
      sidebarComps: [],
      slidePanelComps: [],
      newCountComps: [],
      exchangeCouponComps: [],
      communityGroupComps: [],
      groupBuyStatusComps: [],
      groupBuyListComps: [],
      timelineComps: [],
      signInComps: [],
      verticalListComps: [],
      presellComps: [],
      albumComps: [],
    returnToVersionFlag: true,
  requesting: false,
  requestNum: 1,
  modelChoose: [],
  modelChooseId: '',
  modelChooseName: [],
  onLoad: function (e) {
    if (app.globalData.appScene === 1154) {
      this.setData({
        scene: app.globalData.appScene
      })
      this.dataInitial();
    }
    if (e.franchisee) {
      this.franchiseeId = e.franchisee;
      this.fmode = e.fmode;
      this.setData({
        franchiseeInfo: {
          id: e.franchisee,
          mode: e.fmode || ''
        }
      });
    }
    app.onPageLoad(e);
  },
  dataInitial: function () {
    app.pageDataInitial();
    if (this.page_router === 'userCenterComponentPage'){
      app.getAppECStoreConfig((res) => {
        this.setData({
          storeStyle: res.color_config
        })
      });
    }
  },
  onPageScroll: function(e) {
    app.onPageScroll(e);
  },
  onShareAppMessage: function (e) {
    if (e.from == 'button') {
      let dataset = e.target.dataset;
      if (dataset && dataset.from == 'topicButton') {
        let compid = dataset.compid;
        if (compid && (this.data[compid].topicMoreOperationModal || {})['show']) {
          this.setData({
            [compid + '.topicMoreOperationModal.show']: false
          });
        }
        let franchiseeId = app.getPageFranchiseeId();
        let chainParam = franchiseeId ? '&franchisee=' + franchiseeId : '';
        return app.shareAppMessage({
          path: '/informationManagement/pages/communityDetail/communityDetail?detail=' + e.target.dataset.id + chainParam,
          desc: dataset.title,
          title: dataset.title,
          success: function(addTime) {
            app.getIntegralLog(addTime);
            app.CountSpreadCount(dataset.id);
          }
        });
      }
    };
    return app.onPageShareAppMessage(e, app.getIntegralLog);
  },
  onShareTimeline: function (e) {
    return {
      imageUrl: this.data.page_config.share ? this.data.page_config.share_img : app.globalData.share_img !== '' && !this.data.franchiseeInfo ? app.globalData.share_img : this.data.app_shop_logo? this.data.app_shop_logo : this.data.data.app_logo, // 这里的逻辑是编辑器设置页面的分享图与标语优先级最高，其次是管理后台设置分享图与标语，最后才轮到小程序的log以及名称，但如果对象是云店那就分享当前云店信息
      title: this.data.page_config.share ? this.data.page_config.share_title : app.globalData.share_title !== '' && !this.data.franchiseeInfo ? app.globalData.share_title : this.data.app_shop_name? this.data.app_shop_name : this.data.data.app_name,
      query: app.getShareQuery(this.data.options || Object.assign(this.data.franchiseeInfo || {}, {isSubShop: true}), app.getAppCurrentPage().dataId)
    }
  },
  onShow: function () {
    app.onPageShow();
  },
  onHide: function () {
    app.onPageHide();
  },
  reachBottomFuc: [],
  onReachBottom: function () {
    app.onPageReachBottom( this.reachBottomFuc );
  },
  onUnload: function () {
    app.onPageUnload(this);
  },
  onPullDownRefresh : function(){
    app.onPagePullDownRefresh();
  },
  tapPrevewPictureHandler: function (e) {
    app.tapPrevewPictureHandler(e);
  },
  changeCount: function (e) {
    app.changeCount(e);
  },
  listVesselTurnToPage: function (e) {
    app.listVesselTurnToPage(e);
  },
  userCenterTurnToPage: function (e) {
    app.userCenterTurnToPage(e);
  },
  callPhone: function (e) {
    app.callPhone(e);
  },
  stopPropagation: function () {
  },
  turnToSearchPage:function (e) {
    app.turnToSearchPage(e);
  },
  previewImage: function (e) {
    var dataset = e.currentTarget.dataset;
    app.previewImage({
      current : dataset.src,
      urls: dataset.imgarr || [dataset.src],
    });
  },
  keywordList:{},
  textToMap: function(e) {
    app.textToMap(e);
  },
  animationEnd: function(e){
    app.animationEnd(e);
  },
  tapEventCommonHandler: function(e){
    app.tapEventCommonHandler(e);
  },
  vipCardTurnToPage: function (e) {
    app.vipCardTurnToPage(e);
  },
  showQRRemark: function (e) {
    app.showQRRemark(e);
  },
  turnToJisuApp: function() {
    wx.navigateToMiniProgram({
      appId: 'wxf0f99c6948c8cd4e',
      path: 'flowPromote/pages/flowSignIn/flowSignIn',
      success(res) {
        console.log(res);
      },
      fail(err) {
        console.log(err)
      }
    })
  },
  };
var customComponent = app.customComponent;
for (let i in customComponent) {
  let comp = customComponent[i];
  for (let j in comp.events) {
    pageData[j] = comp[j];
  }
}
Page(pageData);
