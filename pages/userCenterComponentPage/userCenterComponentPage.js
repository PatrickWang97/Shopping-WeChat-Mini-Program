var app      = getApp();
var pageData = {
  data: {"user_center1":{"type":"user-center","style":"opacity:1;color:#59607B;margin-top:0;font-size:37.5rpx;height:auto;margin-left:auto;","content":[{"name":"\u7535\u5546\u8ba2\u5355","blockArr":[{"name":"\u5f85\u4ed8\u6b3e","icon":"icon-pending-payment","bindtap":"userCenterTurnToPage","actionType":"default","router":"myOrder","param":"currentIndex=1&goodsType=0","actionName":"\u5f85\u4ed8\u6b3e"},{"name":"\u5f85\u53d1\u8d27","icon":"icon-pending-delivery","bindtap":"userCenterTurnToPage","actionType":"default","router":"myOrder","param":"currentIndex=2&goodsType=0","actionName":"\u5f85\u53d1\u8d27"},{"name":"\u5f85\u6536\u8d27","icon":"icon-pending-receipt","bindtap":"userCenterTurnToPage","actionType":"default","router":"myOrder","param":"currentIndex=3&goodsType=0","actionName":"\u5f85\u6536\u8d27"},{"name":"\u5f85\u8bc4\u4ef7","icon":"icon-pending-evaluate","bindtap":"userCenterTurnToPage","actionType":"default","router":"myOrder","param":"currentIndex=4&goodsType=0","actionName":"\u5f85\u8bc4\u4ef7"}],"col":4,"height":"168.75rpx","color":"#59607B","showName":true,"imgHeight":"51.5625rpx","line-height":"168.75rpx","font-size":"28.125rpx","parentCompid":"user_center1","style":"","content":""},{"name":"\u6211\u7684\u5de5\u5177","blockArr":[{"name":"\u6536\u8d27\u5730\u5740","icon":"icon-location","bindtap":"userCenterTurnToPage","actionType":"default","router":"myAddress","actionName":"\u6536\u8d27\u5730\u5740"},{"name":"\u8d2d\u7269\u8f66","icon":"icon-shoppingcart","bindtap":"userCenterTurnToPage","actionType":"default","router":"shoppingCart","actionName":"\u8d2d\u7269\u8f66"},{"name":"\u7cfb\u7edf\u901a\u77e5","icon":"icon-notify","bindtap":"userCenterTurnToPage","actionType":"default","router":"myMessage","actionName":"\u7cfb\u7edf\u901a\u77e5"}],"col":3,"height":"168.75rpx","color":"#59607B","showName":true,"imgHeight":"51.5625rpx","line-height":"168.75rpx","font-size":"28.125rpx","parentCompid":"user_center1","style":"","content":""},{"name":"\u4f1a\u5458\u4e2d\u5fc3","blockArr":[{"name":"\u4f1a\u5458\u5361","icon":"icon-vip-card","bindtap":"userCenterTurnToPage","actionType":"default","router":"vipCardList","actionName":"\u4f1a\u5458\u5361"},{"name":"\u4f18\u60e0\u5238","icon":"icon-coupon","bindtap":"userCenterTurnToPage","actionType":"default","router":"couponList","actionName":"\u4f18\u60e0\u5238"},{"name":"\u79ef\u5206","icon":"icon-integral","bindtap":"userCenterTurnToPage","actionType":"default","router":"myIntegral","actionName":"\u79ef\u5206"},{"name":"\u50a8\u503c\u91d1","icon":"icon-balance","bindtap":"userCenterTurnToPage","actionType":"default","router":"balance","actionName":"\u50a8\u503c\u91d1"}],"col":3,"height":"168.75rpx","color":"#59607B","showName":true,"imgHeight":"51.5625rpx","line-height":"168.75rpx","font-size":"28.125rpx","parentCompid":"user_center1","style":"","content":""}],"customFeature":{"mode":1,"personal-mode":1,"blockStyle":{"margin-top":"10px","opacity":1},"topSectionStyle":{"background-color":"","background-image":"url(http:\/\/cdn.jisuapp.cn\/zhichi_frontend\/static\/webapp\/images\/top_bg.jpg)","topHeight":"234.375rpx","coverHeight":"50px","opacity":1,"font-size":"20px","color":"#59607B","vip-font-size":"12px","other-font-size":"12px","vip-color":"#333","other-color":"#FF9900","button-font-size":"12px","button-color":"#fff"},"actionList":{"0":"call","3":"transfer","4":"coupon-receive-list","5":"recharge","7":"lucky-wheel","8":"scratch-card","9":"golden-eggs"},"iconType":"2","colums":3,"margin-top":0,"height":58,"digitalColor":"#686868","textColor":"#999999","button-background":"#FF9900","isHiddenComponent":true,"showDataBlock":[{"name":"\u6570\u636e\u5c55\u793a","blockArr":[{"name":"\u4f18\u60e0\u5238","actionName":"\u4f18\u60e0\u5238","actionType":"default","digital":"7\u5f20","router":"couponList","feild":"coupon_count","bindtap":"userCenterTurnToPage","param":"dataIndex=0"},{"name":"\u79ef\u5206","actionName":"\u79ef\u5206","actionType":"default","digital":"100","router":"myIntegral","feild":"integral","bindtap":"userCenterTurnToPage","param":"dataIndex=1"},{"name":"\u50a8\u503c","actionName":"\u50a8\u503c","actionType":"default","digital":"100\u5143","router":"balance","feild":"balance","bindtap":"userCenterTurnToPage","param":"dataIndex=2"}],"col":3,"height":"72px","color":"#333","showName":true,"imgHeight":"24px","line-height":"72px","font-size":"12px","margin-top":"10px"}],"subWidget":["myOrder","myAddress","shoppingCart","myMessage","vipCard","coupon","myIntegral","myGroup","myVideo","balance","winningRecord","myPromotion"]},"animations":[],"hidden":false,"page_form":"","compId":"user_center1"},"has_tabbar":1,"page_hasNavBar":false,"page_hidden":true,"page_form":"","top_nav":{"navigationBarBackgroundColor":"#ffffff","navigationBarTextStyle":"black","navigationBarTitleText":"\u4e2a\u4eba\u4e2d\u5fc3"},"dataId":"","page_config":{"name":"\u4e2a\u4eba\u4e2d\u5fc3","needLogin":false,"background-color":"#f3f3f3","titleBackgroundColor":"#ffffff","titleColor":"black"}},
    need_login: false,
      bind_phone: false,
    page_router: 'userCenterComponentPage',
    page_form: 'none',
      dataId: '',
      list_compids_params: [],
      user_center_compids_params: [{"compid":"user_center1","param":{"orderType":null}}],
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
