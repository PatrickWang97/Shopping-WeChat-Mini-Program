var app      = getApp();
var pageData = {
  data: {"franchisee_list1":{"type":"franchisee-list","style":"background-color:rgb(243, 243, 243);margin-top:0rpx;opacity:1;color:rgb(102, 102, 102);font-size:35.15625rpx;height:auto;margin-left:auto;","content":"","customFeature":{"lineBackgroundColor":"rgb(255, 255, 255)","lineBackgroundImage":"","margin":1,"imgWidth":66,"imgHeight":66,"vesselAutoheight":1,"height":"300px","form":"app_shop","mode":0,"name":"\u5546\u5bb6\u5217\u8868","source":"5793319","loadingMethod":1,"loadingStyle":"text","loadingText":"\u70b9\u51fb\u52a0\u8f7d","loadingNum":10,"loadingImg":"https:\/\/cdn.jisuapp.cn\/zhichi_frontend\/static\/webapp\/images\/list-vessel\/loading1.png","loadingColor":"#000","isShowFinishText":false,"id":"zhichi_171277792289","sourceType":"shop"},"animations":[],"hidden":false,"page_form":"","compId":"franchisee_list1","parentCompid":"franchisee_list1","list_style":"margin-bottom:2.34375rpx;background-color:rgb(255, 255, 255);margin-left:auto;","img_style":"width:154.6875rpx;height:154.6875rpx;margin-left:auto;","title_width":{"width":"571.875rpx"},"param":"{\"id\":\"zhichi_171277792289\",\"form\":\"app_shop\",\"page\":1,\"app_id\":\"Bp0DwZJPVQ\",\"sort_key\":\"distance\",\"sort_direction\":1}"},"has_tabbar":1,"page_hasNavBar":false,"page_hidden":true,"page_form":"","top_nav":{"navigationBarBackgroundColor":"#ffffff","navigationBarTextStyle":"black","navigationBarTitleText":"\u5927\u5c0f\u4e8b\u4fbf\u5229\u5e97"},"dataId":"","page_config":{"name":"\u5927\u5c0f\u4e8b\u4fbf\u5229\u5e97","titleBackgroundColor":"#ffffff","titleColor":"black"}},
    need_login: false,
      bind_phone: false,
    page_router: 'page10096',
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
      franchiseeComps: [{"compid":"franchisee_list1","param":{"id":"zhichi_171277792289","form":"app_shop","page":1,"app_id":"Bp0DwZJPVQ","sort_key":"distance","sort_direction":1}}],
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
