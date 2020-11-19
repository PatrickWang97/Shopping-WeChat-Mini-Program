let app = getApp();
Component({
  properties: {},
  data: {
    selectAttrInfo: {
      attrs: []
    },
  },
  franchiseeId: '',
  startTime: '',
  endTime: '',
  type: 2,          // 1->商品，2->页面
  objId: '',        // 商品id/页面router地址
  stayedTime: '',   // 停留时间
  ready: function () {
  },
  pageLifetimes: {
    show: function(){
      this.componentInit();
    },
    hide: function(){
      this.endCalcuTime();
    }
  },
  lifetimes: {
    detached: function () {
      this.endCalcuTime();
    }
  },
  methods: {
    componentInit: function(data){
      this.startCalcuTime();
      this.currentPage(); 
    },
    startCalcuTime: function(){
      this.startTime = (new Date()).valueOf();
    },
    endCalcuTime: function () {
      this.endTime = (new Date()).valueOf();
      let time = this.endTime - this.startTime;
      this.stayedTime = parseInt(time / 1000);
      this.sendBehavior();
    },
    currentPage: function(){
      let currentPage = app.getAppCurrentPage();
      let route = currentPage.route;
      let prePageData = getCurrentPages()[getCurrentPages().length - 2];
      let prePageRoute = prePageData && prePageData.route || '';  //上一页页面路径  如果位商品则为小程序场景值
      let type = 2;
      if (route.indexOf('gpgoodsDetail') != -1){
        type = 1;
        route = currentPage.options.goods_id;
        prePageRoute = app.globalData.appScene;
      }else if (route.indexOf('goodsDetail') != -1 || route.indexOf('toStoreDetail') != -1 || route.indexOf('presellDetail') != -1){
        type = 1;
        route = currentPage.options.detail;
        prePageRoute = app.globalData.appScene;
      } else if (route.indexOf('seckillDetail') != -1){
        type = 1;
        route = currentPage.options.id;
        prePageRoute = app.globalData.appScene;
      }else if (route.indexOf('commuGroupGoods') != -1) {
        type = 1;
        route = currentPage.options.goodsId || currentPage.options.detail; // 兼容分享出去的商品id是detail
        prePageRoute = app.globalData.appScene;
      }else if (route.indexOf('communityUsercenter') != -1){
        route += '?tap=' + currentPage.options.tap;
      }
      this.type = type;
      this.objId = route;
      this.referer = prePageRoute;
    },
    sendBehavior: function () {
      setTimeout(() => {
        this.setTimeoutBehavior();
      },1000)
    },
    setTimeoutBehavior: function () { 
      let param = [{
        obj_id: this.objId,
        type: this.type,
        referer: this.referer,
        stayed_time: this.stayedTime,
        action: 0,   //普通转发antion   行为：0->浏览，1->已购，2->已分享，3->已收藏，4->已加购
        log_id: app.globalData.behaviorLogId,
        action_direction:  1     //(必) 行为方向，1->正向，2->逆向，正向表示行为本身，逆向表示行为反向操作，比如对已收藏的商品取消收藏，上报action=3，action_direction=2即为取消收藏
      }];
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppUserBehavior/Collect',
        method: 'post',
        data: {
          app_type: 1,
          param: param,
          collect_type: 1, //   1->用户行为轨迹,  2->转发
        }
      });
    }
  }
})
