var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    type: 1,
    loadData: {
      currentPage: 1,
      isMore: 1,
      loading: false
    },
    hiddenmodalput: true,
    untimes: '', // 次数券的次数
    numberOfStampsUrl: '',
    couponList: [],
    exchangeCoupons:[],
    addLabelText: '',
    rechargeSuccess: 0
  },
  onShow: function () {
    let _this = this;
    let isParent = app.globalData.hasFranchiseeList || app.globalData.hasFranchiseeChain;
    _this.setData({
      isParentShop: isParent,
      'loadData.currentPage': 1,
      'loadData.isMore':1,
      'loadData.loading': false,
      'couponList':[],
    });
    if (isParent) {
      _this.getLocation();
    } else {
      _this.getAppECStoreConfig();
      _this.getMyCoupons();
      _this.getMyExchangeCoupons();
    }
  },
  changeTab: function (event) {
    let _this = this;
    let type = event.target.dataset.type;
    _this.setData({
      type: type,
      couponList: [],
      exchangeCoupons:[],
      loadData: {
        currentPage: 1,
        isMore: 1,
        loading: false
      }
    });
    _this.getMyExchangeCoupons();
    if (_this.data.isParentShop) {
      _this.getMyAllCoupons();
    } else {
      _this.getMyCoupons();
    }
  },
  getMyExchangeCoupons: function () {
    let _this = this;
    let param = {}
    if (_this.data.isParentShop){
      param = {
        type: _this.data.type,
        is_multiple: 1,
        latitude: _this.data.latitude,
        longitude: _this.data.longitude,
      }
    }else{
      param = {
        type: _this.data.type
      }
    }
    app.sendRequest({
      url: '/index.php?r=appCoupon/GetUserExchangeCouponList',
      data: param,
      method:'post',
      hideLoading: true,
      success: function (res) {
        for (let item of res.data) {
          item.showMoreData = false;
          item.start_get_time = util.formatTimeYMD(item.start_get_time, 'YYYY.MM.DD');
          item.end_get_time = util.formatTimeYMD(item.end_get_time, 'YYYY.MM.DD');
          item.coupon_info_copy = item.coupon_info.concat();
          item.coupon_info = item.coupon_info.slice(0, 1);
          for (let sub of item.coupon_info_copy) {
            _this.setCouponData(sub);
          }
          item.app_shop_info = item.coupon_info[0].app_shop_info
        }
        _this.data.exchangeCoupons = [];
        _this.setData({
          'exchangeCoupons': _this.data.exchangeCoupons.concat(res.data),
          'loadData.currentPage': (res.current_page || 0) + 1,
        })
      }
    });
  },
  getMyCoupons: function () {
    let _this = this;
    if (_this.data.loadData.isMore == 0 || _this.data.loadData.loading) {
      return false;
    }
    _this.setData({
      'loadData.loading': true,
    })
    app.sendRequest({
      url: '/index.php?r=AppShop/getMyCoupons',
      data: {
        type: _this.data.type,
        page: _this.data.loadData.currentPage,
        page_size: 10
      },
      hideLoading: true,
      success: function (res) {
        for (let item of res.data) {
          if (parseInt(item.value) == item.value) {
            item.value = parseInt(item.value);
          }
          item.start_use_date = util.formatTimeYMD(item.start_use_date, 'YYYY.MM.DD');
          item.end_use_date = util.formatTimeYMD(item.end_use_date, 'YYYY.MM.DD');
          if (item.type == 5) {
            item.extra_condition = item.extra_condition.replace(/\\n/g, '');
          }
          _this.isShowCouponMore(item);
          item.showMoreData = false;
        }
        _this.setData({
          'couponList': _this.data.couponList.concat(res.data),
          'loadData.currentPage': (res.current_page || 0) + 1,
          'loadData.isMore': res.is_more,
          'loadData.loading': false,
        })
      }
    });
  },
  getMyAllCoupons: function () {
    let _this = this;
    if (_this.data.loadData.isMore == 0 || _this.data.loadData.loading) {
      return false;
    }
    _this.setData({
      'loadData.loading': true,
    })
    app.sendRequest({
      url: '/index.php?r=AppShop/GetMyAllCoupons',
      data: {
        type: _this.data.type,
        latitude: _this.data.latitude,
        longitude: _this.data.longitude,
        page: _this.data.loadData.currentPage,
        page_size: 10
      },
      hideLoading: true,
      success: function (res) {
        for (let item of res.data) {
          if (parseInt(item.value) == item.value) {
            item.value = parseInt(item.value);
          }
          item.start_use_date = util.formatTimeYMD(item.start_use_date, 'YYYY.MM.DD');
          item.end_use_date = util.formatTimeYMD(item.end_use_date, 'YYYY.MM.DD');
          if (item.type == 5) {
            item.extra_condition = item.extra_condition.replace(/\\n/g, '');
          }
          _this.isShowCouponMore(item);
          item.showMoreData = false;
        }
        _this.setData({
          'couponList': _this.data.couponList.concat(res.data),
          'loadData.currentPage': (res.current_page || 0) + 1,
          'loadData.isMore': res.is_more,
          'loadData.loading': false,
        })
      }
    });
  },
  getLocation: function () {
    let that = this;
    app.getLocation({
      success: function (res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
        that.getMyAllCoupons();
        that.getMyExchangeCoupons();
      },
      fail: function () {
        that.setData({
          longitude: '',
          latitude: ''
        });
        that.getMyAllCoupons();
        that.getMyExchangeCoupons();
      }
    })
  },
  gotoCouponDetail: function (event) {
    let couponId = event.currentTarget.dataset.id;
    let appid = event.currentTarget.dataset.appid || '';
    let franisee = '';
    if (app.globalData.appId != appid && this.data.isParentShop) {
      franisee = '&franchisee=' + appid;
    }
    let url = '/pages/couponDetail/couponDetail?status=use&detail=' + couponId + franisee;
    app.turnToPage(url, false);
  },
  gotoVoucherDetail: function (event) {
    let couponId = event.currentTarget.dataset.id;
    let type = this.data.type;
    let url = '/exchangeCoupon/pages/haveBuyVoucher/haveBuyVoucher?id=' + couponId+ '&type=' + type;
    app.turnToPage(url, false);
  },
  gotoTransferPage: function () {
    let url = '/eCommerce/pages/transferPage/transferPage';
    app.turnToPage(url, false);
  },
  addLabelInput: function (e) {
    this.setData({ 'addLabelText': e.detail.value })
  },
  gotoNumberPage: function (event) {
    let couponId = event.currentTarget.dataset.id;
    let appid = event.currentTarget.dataset.appid || '';
    let untimes = event.currentTarget.dataset.untimes;
    let num = event.currentTarget.dataset.num;
    let coupon = event.currentTarget.dataset.coupon;
    let franisee = '';
    if (app.globalData.appId != appid && this.data.isParentShop) {
      franisee = '&franchisee=' + appid;
    }
    let url = '/exchangeCoupon/pages/numberOfStampsUsed/numberOfStampsUsed?detail=' + couponId + franisee;
    if(num == 1){
      let data={
        currentTarget:{
          dataset:{
            id: couponId,
            coupon: coupon,
            appId: appid,
          }
        }
      };
      this.showCouponVerify(data);
      return;
    }
    this.setData({ numberOfStampsUrl: url, hiddenmodalput: false, untimes: untimes , coupon: coupon})
  },
  confirm: function () {
    if (+this.data.untimes < +this.data.addLabelText) {
      app.showModal({ content: '核销次数超过剩余次数' });
      this.setData({ hiddenmodalput: true, addLabelText: '' })
      return
    }
    let url = this.data.numberOfStampsUrl + '&Number=' + this.data.addLabelText;
    let coupon = this.data.coupon;
    let that = this;
    app.sendRequest({
      url:'/index.php?r=AppCoupon/RecordCurrentVerifyTimes',
      data:{
        verify_code: coupon.verify_code,
        current_verify_times: that.data.addLabelText
      },
      method:'post',
      hideLoading: true,
      success: function (res) {
        if(!res.status){
          that.setData({ hiddenmodalput: true, addLabelText: '' })
          app.turnToPage(url, false);
        }
      }
    })  
  },
  cancel: function () {
    this.setData({ hiddenmodalput: true, addLabelText: '' })
  },
  gotoRecharge: function (event) {
    let _this = this;
    let userCouponId = event.currentTarget.dataset.id;
    app.sendRequest({
      url: '/index.php?r=AppShop/useCoupon',
      data: {
        user_coupon_id: userCouponId
      },
      hideLoading: true,
      success: function (res) {
        _this.setData({
          rechargeSuccess: 1
        });
        setTimeout(function () {
          _this.hideToast();
        }, 3000);
        let couponList = _this.data.couponList;
        for (var i = 0; i < couponList.length; i++) {
          if (couponList[i]['id'] == userCouponId) {
            let newData = {};
            newData['couponList[' + i + '].status'] = 2;
            _this.setData(newData);
          }
        }
      }
    })
  },
  hideToast: function () {
    this.setData({
      rechargeSuccess: 0
    });
  },
  gotoShop: function (e) {
    let dataset = e.currentTarget.dataset
    let appId = dataset.appid || '';
    let mode = dataset.mode;
    let chainId = app.getChainId();
    let home = app.getHomepageRouter();
    let headquartersId = app.globalData.appId;
    let s_his_data = dataset.sHisData;
    if (app.globalData.hasFranchiseeChain && chainId !== appId) {
      let options = {s_his_data, appId};
      app.couponChangeStore(options);
    } else if (headquartersId == appId || chainId == appId) {
      app.reLaunch({
        url: '/pages/' + home + '/' + home
      })
    } else {
      let param = {};
      let pageLink = dataset.newpage;
      param.detail = appId;
      if (pageLink){
        mode = dataset.newmode;
        let options = { mode, pageLink, franchiseeId: appId, param};
        app.turnToFranchiseePage(options);
        return;
      }
      app.goToFranchisee(mode, param);
    }
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    });
  },
  setCouponData: function (data) {
    if (data.type == 0) {
      data.useCondition = '满' + data.condition + '，减' + data.value + '元';
    } else if (data.type == 1) {
      data.useCondition = '打' + data.value + '折';
    } else if (data.type == 2) {
      data.useCondition = '可抵扣' + data.value + '元';
    } else if (data.type == 3) {
      if (data.extra_condition == '') {
        data.useCondition = '直接兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.price) {
        data.useCondition = '消费满' + data.extra_condition.price + '元可兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.goods_id) {
        data.useCondition = '购买' + data.condition_goods_info.title + '可兑换' + data.coupon_goods_info.title;
      }
    } else if (data.type == 4) {
      data.useCondition = '储值金可充值' + data.value + '元';
    } else if (data.type == 5) {
      data.useCondition = data.extra_condition.replace(/\\n/g, '');
    } else if (data.type == 6) {
      data.useCondition = '可使用' + parseInt(data.value) + '次';
    }
  },
  isShowMoreData: function (e) {
    let dataset = e.currentTarget.dataset;
    let index = dataset.index;
    let exchange_coupon = this.data.exchangeCoupons;
    if (exchange_coupon[index].showMoreData) {
      exchange_coupon[index].showMoreData = false;
      exchange_coupon[index].coupon_info = exchange_coupon[index].coupon_info.slice(0, 1)
    } else {
      exchange_coupon[index].showMoreData = true;
      exchange_coupon[index].coupon_info = exchange_coupon[index].coupon_info_copy.concat();
    };
    this.setData({
      exchangeCoupons: exchange_coupon
    });
  },
  isShowCouponMore: function (data) {
    data.showMore = false;
    if (data.type == 0 || data.type == 3 || data.type == 5 || data.type == 6) {
      data.showMore = true;
    } else if (data.type == 1 || data.type == 2 || data.type == 4) {
      if (data.extra_goods && data.extra_goods != 'null') {
        data.showMore = true;
      }
    }
  },
  isShowCouponMoreData: function (e) {
    let index = e.currentTarget.dataset.index;
    this.data.couponList[index].showMoreData = !this.data.couponList[index].showMoreData;
    this.setData({
      'couponList': this.data.couponList
    })
  },
  goToUsePage:function(e){
    let index = e.currentTarget.dataset.index;
    let coupon = this.data.couponList[index];
    let chainId = app.getChainId();
    let home = app.getHomepageRouter();
    let appId = e.currentTarget.dataset.appid;
    let headquartersId = app.globalData.appId;
    if (coupon.extra_goods && coupon.extra_goods != 'null'){
      let coupon_id = coupon.coupon_id;
      let url = '/eCommerce/pages/couponGoodsListPage/couponGoodsListPage?detail=' + coupon_id;
      if (appId && appId != headquartersId) {
        url += '&franchisee=' + appId;
      }
      app.turnToPage(url);
    }else{
      if (app.globalData.hasFranchiseeChain && chainId !== appId) {
        let s_his_data = index > -1 ? this.data.couponList[index].s_his_data : this.data.recvCouponPopHisData;
        let options = {s_his_data, appId};
        app.couponChangeStore(options);
      } else if (headquartersId == appId || chainId == appId) {
        app.reLaunch({
          url: '/pages/' + home + '/' + home
        })
      } else {
        let subAppBar = coupon.sub_app_bar || {},
          pageLink = '',
          param = {},
          mode = coupon.mode_id || 0;
        param.detail = appId;
        pageLink = subAppBar['homepage-router'] || '';
        if (pageLink){
          mode = Number(subAppBar.mode_id || 0);
          let options = { mode, pageLink, franchiseeId: appId, param};
          app.turnToFranchiseePage(options);
          return;
        }
        app.goToFranchisee(mode, param);
      }
    }
  },
  showCouponVerify: function (e) {
    let coupon_id = e.currentTarget.dataset.id;
    let coupon = e.currentTarget.dataset.coupon;
    let appId = e.currentTarget.dataset.appId;
    var qrcodeUrl = `${app.globalData.siteBaseUrl}` +
      `/index.php?r=AppShop/couponQrcode&app_id=${appId}` +
      `&user_coupon_id=${coupon_id}`;
    this.setData({
      'detailShow': false,
      'verifyShow': true,
      'verifyData.qrcodeUrl': qrcodeUrl,
      'couponDetail': coupon
    });
    this.connectSocket();
  },
  hideCouponVerify: function () {
    this.setData({
      'detailShow': true,
      'verifyShow': false
    });
    clearInterval(this.timeInterval);
    this.socketOpen && wx.closeSocket();
  },
  timeInterval: '',// 定时器,间断发送消息
  socketOpen: false,
  connectSocket: function () {
    var that = this;
    wx.connectSocket({
      url: 'wss://ceshi.zhichiwangluo.com', //线下test
      header: {
        'content-type': 'application/json'
      },
      method: 'GET'
    });
    wx.onSocketOpen(function (res) {
      that.socketOpen = true;
      let data = {
        'action': 'mark_client',
        'user_token': app.globalData.userInfo.user_token,
        'scenario_name': 'app_coupon_verify',
        'session_key': app.globalData.sessionKey
      };
      wx.sendSocketMessage({
        data: JSON.stringify(data)
      });
      that.timeInterval = setInterval(function () {
        let data = {
          'action': 'heartbeat',
          'user_token': app.globalData.userInfo.user_token,
          'scenario_name': 'app_coupon_verify',
          'session_key': app.globalData.sessionKey
        };
        wx.sendSocketMessage({
          data: JSON.stringify(data)
        })
      }, 30000);
    });
    wx.onSocketMessage(function (res) {
      let { couponDetail } = that.data;
      let data = JSON.parse(res.data);
      if (data.action == 'push_to_client') {
        let msg = JSON.parse(data.msg);
        if ((msg.type == 'app_coupon_verify') && (msg.status == 0)) {
          if (couponDetail.type != 6) {
            that.setData({
              'couponDetail.status': 2
            });
          } else { // 次数券
            let unVerfiyTimes = couponDetail.un_verify_times - 1;
            let verifiedTimes = couponDetail.verified_times + 1;
            that.setData({
              'couponDetail.un_verify_times': unVerfiyTimes,
              'couponDetail.verified_times': verifiedTimes,
            });
            if (unVerfiyTimes == 0) {
              that.setData({
                'couponDetail.status': 2
              });
            }
          }
          that.setData({
            'verifyData.success': true,
          });
          clearInterval(that.timeInterval);
          wx.closeSocket();
        }
      }
    });
    wx.onSocketClose(function (res) {
      that.socketOpen = false;
      clearInterval(that.timeInterval);
      console.log('WebSocket 已关闭！');
    });
    wx.onSocketError(function (res) {
      that.socketOpen = false;
      console.log('WebSocket连接打开错误，请检查！')
    })
  },
})
