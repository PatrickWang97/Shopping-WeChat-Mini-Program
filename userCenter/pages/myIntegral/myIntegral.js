var app = getApp()
Page({
  data: {
    integralPage: 0, // 控制是否展开 0:显示主页 1:显示积分规则页
    canUseIntegral: 0, // 现有积分
    totalIntegral: 0, // 总积分
    integralFontSize: 60, // 根据积分长度改变积分字体大小
    currentMessageType: 'income', // income:收入 / outcome:支出
    navFixed: false, // 固定导航条
    integralRule: {
      convertNum: 100, // xx积分对应1元
      consumeNum: 0, // 消费xx元积累1积分
      loginNum: 0, // 每天登录送xx积分
      postCommentNum: 0, // 商品评论送xx积分
      shareNum: 0, // 推荐好友送xx积分
    },
    incomeBranch: {
      data: [],
      isMore: 0,
      currentPage: 1,
      onload: false
    },
    outcomeBranch: {
      data: [],
      isMore: 0,
      currentPage: 1,
      onload: false
    },
    couponList: [], // 积分优惠券
    couponStatus: {
      noMore: false, // 没有积分兑换券
      loadingFail: false, // 获取积分优惠券失败
    },
    showOpenSetting: false, // 是否显示授权入口
    appLogo: app.globalData.appLogo
  },
  headHeight: 180,
  onLoad: function(){
    this.getIntegralDetailData();
    this.getIntegralRuleData();
    this.getMessageData('income');
    this.getMessageData('outcome');
    this.headHeight = 360 / (app.globalData.systemInfo && app.globalData.systemInfo.rpxRatio ? app.globalData.systemInfo.rpxRatio : 2);
    this.getIntegralExchangeCoupons();
  },
  getIntegralDetailData: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetIntegralInfo',
      success: function(res){
        let integralLength = ('' + res.data.can_use_integral).length + ('' + res.data.total_integral).length
        let fontSize = integralLength > 0 ? 60 - integralLength * 2 : 60
        that.setData({
          'canUseIntegral': res.data.can_use_integral,
          'totalIntegral': res.data.total_integral,
          'integralFontSize': fontSize
        });
      }
    });
  },
  getIntegralRuleData: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/IntegralRule',
      success: function(res){
        that.setData({
          'integralRule.convertNum': res.data.convert_num || 0,
          'integralRule.consumeNum': res.data.consume_num ,
          'integralRule.loginNum': res.data.login_num || 0,
          'integralRule.postCommentNum': res.data.post_comment_num,
          'integralRule.shareNum': res.data.share_num
        });
      }
    });
  },
  getMessageData: function(type, page){
    let that = this;
    let action = '';
    if (type == 'income') {
      action = 'add';
    } else if (type = 'outcome') {
      action = 'minus';
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/UserIntegralAction',
      data: {
        'action': action,
        'page': page || 1
      },
      success: function (res) {
        let data = that.parseMessageData(res.data) || [];
        switch(type){
          case 'income':
            that.setData({
              'incomeBranch.data': res.current_page > 1 
              ? that.data.incomeBranch.data.concat(data) : data,
              'incomeBranch.isMore': res.is_more,
              'incomeBranch.currentPage': res.current_page || '',
              'incomeBranch.onload': false,
            });
            break;
          case 'outcome':
            that.setData({
              'outcomeBranch.data': res.current_page > 1
              ? that.data.outcomeBranch.data.concat(data) : data,
              'outcomeBranch.isMore': res.is_more,
              'outcomeBranch.currentPage': res.current_page ||'',
              'outcomeBranch.onload': false,
            })
            break;
        }
      }
    });
  },
  parseMessageData: function(data){
    var that = this;
    let array = [];
    let item = {};
    for (var i = 0; i < data.length; i++) {
      item = {
        content: data[i].content,
        num: data[i].num,
        time: data[i].time
      }
      array.push(item);
    }
    return array;
  },
  checkMoreMessageData: function(){
    let that = this;
    switch(that.data.currentMessageType) {
      case 'income':
        if ((that.data.incomeBranch.isMore != 0 ) && ( !that.data.incomeBranch.onload)) {
          that.getMessageData('income', (that.data.incomeBranch.currentPage + 1));
          that.setData({
            'incomeBranch.onload': true
          });
        }
        break;
      case 'outcome':
        if ((that.data.outcomeBranch.isMore != 0 ) && ( !that.data.outcomeBranch.onload)) {
          that.getMessageData('outcome', (that.data.outcomeBranch.currentPage + 1));
          that.setData({
            'outcomeBranch.onload': true
          });
        }
        break;
    }
  },
  fixedMessageNav: function(event){
    var that = this;
    if (event.detail.scrollTop <= this.headHeight) {
      that.setData({
        navFixed: false
      });
    } else {
      that.setData({
        navFixed: true
      });
    }
  },
  setCurrentMessageType: function(event){
    this.setData({
      'currentMessageType': event.target.dataset.type
    });
  },
  showIntegralRule: function(){
    app.setPageTitle('积分规则');
    this.setData({
      'integralPage': 1
    });
  },
  hideIntegralRule: function(){
    app.setPageTitle('个人积分');
    this.setData({
      'integralPage': 0
    });
  },
  getIntegralExchangeCoupons: function () {
    let that = this;
    let params = {
      in_show_list: 1,
      enable_status: 1,
      stock: 1,
      exchangeable: 1,
      page: 1,
      page_size: 2,
      category: [0, 1]
    };
    let url = '/index.php?r=AppCoupon/GetExchangeCouponList';
    if (this.data.couponStatus.loadingFail) {
      this.setData({
        'couponStatus.loadingFail': false
      });
    }
    this.getCurrentLatLng().then((location) => {
      params.latitude = location.latitude;
      params.longitude = location.longitude;
      app.sendRequest({
        hideLoading: true,
        url: url,
        data: params,
        method: 'post',
        success: function (res) {
          if (res.status == 0 && Array.isArray(res.data) && res.data[0]) {
            let data = [];
            res.data.forEach((item) => {
              let coupons = item.coupon_info;
              let distance = that.transferDistance(item.distance);
              coupons.forEach((coupon) => {
                coupon.distance = distance;
                coupon.compose_id = item.id;
                return coupon;
              });
              data = data.concat(coupons);
            });
            that.setData({
              couponList: data
            });
          }
          that.setData({
            'couponStatus.noMore': !!(res.is_more - 1)
          });
        },
        fail: function () {
          that.setData({
            'couponStatus.loadingFail': true
          });
        },
        complete: function () {
          app.getBoundingClientRect('#coupon-area', function (rect) {
            if (rect[0] && rect[0].height) {
              that.headHeight = +that.headHeight + rect[0].height
            }
          });
        }
      });
    })
  },
  getCurrentLatLng: function () {
    let that = this;
    return new Promise((resolve, reject) => {
      if (app.globalData.locationInfo.latitude) {
        resolve(app.globalData.locationInfo);
      } else {
        wx.getSetting({
          success(res) {
            const result = res.authSetting['scope.userLocation'];
            if (result === undefined) {
              wx.authorize({
                scope: 'scope.userLocation',
                success(e) {
                  that.getIntegralExchangeCoupons();
                },
                fail(e) {
                  that.setData({
                    showOpenSetting: true
                  });
                }
              })
            } else if (result === false) {
              that.setData({
                showOpenSetting: true
              });
            } else {
              app.getLocation({
                success: resolve,
                fail: reject
              })
            }
          }
        })
      }
    });
  },
  getExchangeCoupon: function (event) {
    let dataset = event.currentTarget.dataset;
    let composeId = dataset.composeId;
    app.turnToPage('/exchangeCoupon/pages/exchangeCouponDetail/exchangeCouponDetail?id=' + composeId);
  },
  transferDistance: function (dis) {
    if (!dis) {
      return '';
    }
    return Math.round(dis / 10) / 100 + '千米';
  },
  gotoCouponDetail: function (event) {
    let dataset = event.currentTarget.dataset;
    let composeId = dataset.composeId;
    let url = '/exchangeCoupon/pages/exchangeCouponDetail/exchangeCouponDetail?id=' + composeId;
    app.turnToPage(url, false);
  },
  gotoExchangeCouponList: function () {
    app.turnToPage('/eCommerce/pages/exchangeCoupon/exchangeCoupon');
  },
  updateOutComBranch: function () {
    this.getMessageData('outcome', 1);
    this.setData({
      'outcomeBranch.onload': true
    });
  },
  openSettingCallback: function (res) {
    if (res.detail.authSetting && res.detail.authSetting['scope.userLocation']) {
      this.setData({
        showOpenSetting: false
      });
      this.getIntegralExchangeCoupons();
    }
  }
})
