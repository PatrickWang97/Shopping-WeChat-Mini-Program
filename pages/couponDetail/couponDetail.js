var app = getApp()
var util = require('../../utils/util.js')
Page({
  data: {
    topNavBarData:{
      title:'优惠券',
      isDefault: 0,
    },
    detailShow: false,
    status: 'receive', // receive、use 默认为receive，从优惠券列表进入的则为use
    couponId: '',       // receive时为商家设置优惠券id，use时为用户领取优惠券id
    franchiseeId: '',
    couponDetail: {},
    receiveSuccess: 0,  // 领取成功弹窗是否显示
    receiveCount: 0,    // 已领取数量
    receiveLimitNum: 0, // 领取限制数量
    rechargeSuccess: 0, // 充值成功弹窗是否显示
    verifySuccess: false,
    verifyQrcodeUrl: '',
    verifyShow: false,
    verifyData: {
      success: false,
      qrcodeUrl: ''
    },
    recving: false,      // 领取中
    recv_type: '',        // 领取渠道
    isExchangeCoupon: false, // 是否为积分兑换
    exchangeModal: {
      show: false,
      exchange: true,
      success: false,
      couponInfo: {
        coinid: '', 
        index: '', 
        limitNum: '', 
        userRecvNum: '',
        integral: ''
      }
    },
    addLabelText: '',
    hiddenmodalput: true,
    transfer_key: '',
    scene: null
  },
  onLoad: function (options) {
    let that = this;
    let status = options.status || 'receive'; // receive、use
    let couponId = options.detail || ''; // receive时为优惠券Id, use时为用户领取的优惠券Id
    let franchiseeId = (options.franchisee == 'undefined' || !options.franchisee) ? '' : options.franchisee;
    let recv_type = options.recv_type || ''; // 优惠券来源
    let transfer_key = options.transfer_key || '';
    let { systemInfo, topNavBarHeight } = app.globalData;
    let containerHeight = systemInfo.screenHeight - topNavBarHeight;
    that.setData({
      'status': status,
      'couponId': couponId,
      'franchiseeId': franchiseeId,
      'recv_type': recv_type,
      'containerHeight': containerHeight,
      'isExchangeCoupon': options.is_exchange === '1',
      'transfer_key': transfer_key
    });
    if(status == 'receive'){
      that.getCouponInfo();
    } else if(status == 'use') {
      that.getUserListCouponInfo();
    } else if(status == 'accept') {
      that.getUserListCouponInfo();
    }
    if (app.globalData.appScene === 1154) {
      this.setData({
        scene: app.globalData.appScene
      })
    }
  },
  getCouponInfo: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCouponInfo',
      data: {
        'sub_app_id': that.data.franchiseeId,
        'coupon_id': that.data.couponId
      },
      hideLoading: true,
      success: function(res){
        that.setCouponData(res.data);
        wx.setNavigationBarColor({
          frontColor: '#ffffff',
          backgroundColor: res.data.background || '#FF5500',
        })
      }
    });
  },
  getUserListCouponInfo: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getUserListCouponInfo',
      data: {
        'sub_app_id': that.data.franchiseeId,
        'user_coupon_id': that.data.couponId,
        'verify_log_order_by':'desc',
        'is_get_transfer_coupon': that.data.status == 'accept' ? 1 : 0,    //  赠送
      },
      hideLoading: true,
      success: function(res){
        let coupon = res.data[0];
        if(!coupon){
          that.setData({
            'status': 'receive'
          });
          that.getCouponInfo();
          return;
        }
        let verifyLogList = (coupon.form_data && coupon.form_data.verify_log) || [];
        if (verifyLogList && verifyLogList.length !== 0) {
          verifyLogList.forEach((item) => {
            item.add_time = util.formatTimeYMD(item.add_time,'YYYY/MM/DD hh:mm:ss');
          });
        }
        that.setCouponData(coupon);
        wx.setNavigationBarColor({
          frontColor: '#ffffff',
          backgroundColor: coupon.background || '#FF5500',
        })
      }
    });
  },
  setCouponData: function (data) {
    let that = this;
    let useCondition = '';
    let useTitle = '';
    let stampsUser = '';
    let vipId = '';
    if (data.value == parseInt(data.value)) {
      data.value = parseInt(data.value)
    }
    if (data.type == 0) {
      useCondition = '满' + data.condition + '，减' + data.value + '元';
      useTitle = '满' + data.condition + '，减' + data.value + '元';
    } else if (data.type == 1) {
      useCondition = '打' + data.value + '折';
      useTitle = data.value + '折折扣券';
    } else if (data.type == 2) {
      useCondition = '可抵扣' + data.value + '元';
      useTitle = data.value + '元代金券';
    } else if (data.type == 3) {
      if (data.extra_condition == '') {
        useCondition = '直接兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.price) {
        useCondition = '消费满' + data.extra_condition.price + '元可兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.goods_id) {
        useCondition = '购买' + data.condition_goods_info.title + '可兑换' + data.coupon_goods_info.title;
      }
      useTitle = '兑换券';
    } else if (data.type == 4) {
      useCondition = '储值金可充值' + data.value + '元';
      useTitle = data.value + '元储值券';
    } else if (data.type == 5) {
      useCondition = data.extra_condition.replace(/\\n/g, '\n');
      useTitle = '通用券';
    } else if (data.type == 6) {
      useCondition = '可使用' + parseInt(data.value) + '次';
      useTitle = data.value + '次次数券';
    }
    if (data.user_condition_list && data.user_condition_list.length > 0) {
      data.user_condition_list.forEach((res, i) => {
        if (i == data.user_condition_list.length - 1) {
          stampsUser = stampsUser + res
        } else {
          stampsUser = stampsUser + res + ','
        }
      })
    } else {
      if (data.user_condition == '0') {
        stampsUser = '所有用户'
      }
      if (data.user_condition == '1') {
        stampsUser = '所有会员'
      }
    }
    if (typeof(data.user_condition) == 'object') {
      if (data.user_condition[0]) {
        vipId = data.user_condition[0][0];
      }else {
        vipId = data.user_condition[1][0];
      }
    }
    if (data.transfer_data && data.transfer_data.is_transfer == 1) {
      that.data.transfer_key || that.getTransferKey();
    }
    let newData = data;
    newData['useCondition'] = useCondition;
    newData['useTitle'] = useTitle;
    newData['stampsUser'] = stampsUser;
    newData['vipId'] = vipId;
    that.setData({
      'couponDetail': newData
    });
    that.setData({
      'detailShow': true
    });
  },
  goToHomepage: function () {
    let appId = this.data.couponDetail.app_id;
    let chainId = app.getChainId();
    let headquartersId = app.globalData.appId;
    let home = app.getHomepageRouter();
    if (app.globalData.hasFranchiseeChain && chainId !== appId) {
      let s_his_data = this.data.couponDetail.s_his_data;
      let options = {s_his_data, appId};
      app.couponChangeStore(options);
    } else if (headquartersId == appId || chainId == appId) {
      app.reLaunch({
        url: '/pages/' + home + '/' + home
      })
    } else {
      let subAppBar = this.data.couponDetail.sub_app_bar || {};
      let mode = this.data.couponDetail.mode_id || 0;
      let pageLink = subAppBar['homepage-router'] || '';
      let param = {
        detail: appId
      };
      if (pageLink){
        mode = Number(subAppBar.mode_id || 0);
        let options = { mode, pageLink, franchiseeId: appId, param};
        app.turnToFranchiseePage(options);
        return;
      }
      app.goToFranchisee(mode, param);
    }
  },
  formSubmit: function (event) {
    let that = this,
        formId = event.detail.formId;
    let { category } = event.currentTarget.dataset;
    let couponId = this.data.couponId;
    if(this.data.recving){
      return
    }
    this.setRecving(true);   
    app.requestSubscribeMessage([{
      type: '4097',
      obj_id: couponId
    },{
      type: '4098',
      obj_id: couponId
    },{
      type: '4099',
      obj_id: couponId
    }]).then(()=> {
      app.sendRequest({
        url: '/index.php?r=AppShop/RecvCoupon',
        data: {
          'coupon_id': that.data.couponId,
          'sub_app_id': that.data.franchiseeId,
          'form_id': formId,
          'recv_type': that.data.recv_type,
          'alliance_coupon': category == 1 ? 1 : 0, // 是否为联盟优惠券
        },
        hideLoading: true,
        success: function (res) {
          app.sendUseBehavior([{'goodsId': that.data.couponId}],18); // 行为轨迹埋点 领取优惠券
          that.setData({
            'receiveSuccess': 1,
            'receiveCount': res.data.recv_count,
            'receiveLimitNum': res.data.limit_num,
            'couponDetail.is_already_recv': res.data.is_already_recv
          });
          setTimeout(function() {
            that.hideReceiveToast();
          }, 3000);
          let couponDetail = that.data.couponDetail;
          if (couponDetail.type != 0 && couponDetail.type != 4 && couponDetail.type != 6 && couponDetail.wx_card_id) {
            app.addToWxCard(couponDetail.wx_card_id, res.data.user_coupon_id);
          }
        },
        complete: function(){
          that.setRecving(false);
        }
      });
    })     
  },
  setRecving: function(bool){
    this.setData({
      recving: bool
    })
  },
  gotoTransferPage: function(){
    let url = '/eCommerce/pages/transferPage/transferPage';
    if (this.data.franchiseeId){
      url += '?franchisee=' + this.data.franchiseeId;
    }
    app.turnToPage(url, false);
  },
  gotoRecharge: function(event){
    let that = this;
    let userCouponId = event.currentTarget.dataset.id;
    app.sendRequest({
      url: '/index.php?r=AppShop/useCoupon',
      data: {
        user_coupon_id: userCouponId
      },
      hideLoading: true,
      success: function(res) {
        that.setData({
          'rechargeSuccess': 1,
          'couponDetail.status': 2
        });
        setTimeout(function() {
          that.hideRechargeToast();
        }, 3000);
      }
    })
  },
  hideReceiveToast: function(){
    this.setData({
      'receiveSuccess': 0,
      'receiveCount': 0,
      'receiveLimitNum': 0
    });
  },
  hideRechargeToast: function(){
    this.setData({
      'rechargeSuccess': 0
    });
  },
  onShareAppMessage: function(res){
    let that = this;
    let franchiseeId = that.data.franchiseeId;
    let couponId = '';
    let couponDetail = this.data.couponDetail;
    let transfer_key = that.data.transfer_key;
    if (that.data.status == 'receive') {
      couponId = that.data.couponId;
    } else if (that.data.status == 'use') {
      couponId = that.data.couponDetail.coupon_id;
    } else if (that.data.status == 'accept') {
      couponId = that.data.couponId;
    }
    let shareType = false;
    if (couponDetail.type == 6) {
      if (couponDetail.transfer_data && couponDetail.transfer_data.is_transfer == 1 && couponDetail.is_selected == 0 && couponDetail.status != 2 && couponDetail.status != 3 && couponDetail.verified_times == 0) {
        shareType = true;
      }
    }else {
      if (couponDetail.transfer_data && couponDetail.transfer_data.is_transfer == 1 && couponDetail.is_selected == 0 && couponDetail.status != 2 && couponDetail.status != 3) {
        shareType = true;
      }
    }
    if (shareType) {
      couponId = that.data.couponDetail.id;
      that.transferCoupon();
      this.setData({ 'couponDetail.is_selected': 2 })
      return app.shareAppMessage({
        title: couponDetail.transfer_data.transfer_title || '速抢！限量优惠券，别说我不爱你~',
        imageUrl: couponDetail.transfer_data.transfer_img || '',
        path: `/pages/couponDetail/couponDetail?status=accept&detail=${couponId}&transfer_key=${transfer_key}&franchisee=${franchiseeId}`
      })
    }else {
      let title = '速抢！限量优惠券，别说我不爱你~';
      let imageUrl = '';
      if (couponDetail.share_data) {
        title = couponDetail.share_data.share_title || '速抢！限量优惠券，别说我不爱你~';
        imageUrl = couponDetail.share_data.share_img || '';
      }
      return app.shareAppMessage({
        title: title,
        imageUrl: imageUrl,
        path: '/pages/couponDetail/couponDetail?status=' + (that.data.status || 'receive') + '&detail=' + couponId + '&franchisee=' + franchiseeId,
      })
    }
  },
  showCouponVerify: function(event) {
    if (this.data.couponDetail.is_selected == 3) {
      return;
    }
    var qrcodeUrl = `${app.globalData.siteBaseUrl}` +
    `/index.php?r=AppShop/couponQrcode&app_id=${(this.data.franchiseeId ? this.data.franchiseeId : app.globalData.appId)}` +
    `&user_coupon_id=${this.data.couponId}`;
    this.setData({
      'detailShow': false,
      'verifyShow': true,
      'verifyData.qrcodeUrl': qrcodeUrl
    });
    this.connectSocket();
  },
  hideCouponVerify: function(){
    this.setData({
      'detailShow': true,
      'verifyShow': false,
      'addLabelText': ''
    });
    clearInterval(this.timeInterval);
    this.socketOpen && wx.closeSocket();
  },
  timeInterval: '',// 定时器,间断发送消息
  socketOpen: false,
  connectSocket: function () {
    var that = this;
    wx.connectSocket({
      url: 'wss://xcx.jisuapp.cn', //线上,
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
            if (unVerfiyTimes == 0 ) {
              that.setData({
                'couponDetail.status': 2
              });
            }
          }
          that.setData({
            'verifyData.success': true,
            'addLabelText': ''
          });
          clearInterval(that.timeInterval);
          wx.closeSocket();
        }
      }
    });
    wx.onSocketClose(function(res) {
      that.socketOpen = false;
      clearInterval(that.timeInterval);
      console.log('WebSocket 已关闭！');
    });
    wx.onSocketError(function(res){
      that.socketOpen = false;
      console.log('WebSocket连接打开错误，请检查！')
    })
  },
  onUnload: function () {
    var that = this;
    clearInterval(that.timeInterval);
    that.socketOpen && wx.closeSocket();
  },
  turnToCouponGoodsList: function (event) {
    let couponId = this.data.status === 'receive' ? this.data.couponId : this.data.couponDetail.coupon_id;
    let franchiseeId = this.data.franchiseeId;
    let url = '/eCommerce/pages/couponGoodsListPage/couponGoodsListPage?detail=' + couponId;
    if (franchiseeId) {
      url += '&franchisee=' + franchiseeId;
    }
    app.turnToPage(url);
  },
  toggleVerificationDetail: function () {
    let { verificationDetailShow } = this.data;
    let isShow = verificationDetailShow ? false : true;
    let title = isShow ? '核销详情' : '优惠券';
    this.setData({
      detailShow: !isShow,
      verificationDetailShow: isShow,
      'topNavBarData.title': title
    });
  },
  getExchangeCoupon: function (event) {
    let dataset = event.currentTarget.dataset;
    let coinid = dataset.coinid;
    let index = dataset.index;
    let recv_status = dataset.status;
    let money = dataset.money ? + dataset.money : 0;
    let limitNum = dataset.limitnum ? + dataset.limitnum : 0;
    let userRecvNum = dataset.userrecvnum ? + dataset.userrecvnum : 0;
    let integral = dataset.integral;
    let category = dataset.category;
    if (recv_status == 0) {
      app.showModal({ content: '超过可兑换次数' });
      return
    }
    if (money && money > 0) {
      app.turnToPage('/exchangeCoupon/pages/exchangeCouponDetailOrder/exchangeCouponDetailOrder?id=' + coinid);
      return;
    }
    this.setData({
      'exchangeModal.couponInfo': {
        integral,
        coinid,
        index,
        limitNum,
        userRecvNum,
        category
      }
    })
    this.showExchangeModal();
  },
  isLoading: false, // 是否正在加载
  checkexchangeCoupon: function () {
    if (this.isLoading) {
      return;
    }
    app.showLoading({title: '请求中'});
    this.isLoading = true;
    let that = this;
    let {
      coinid,
      index,
      limitNum,
      userRecvNum,
      category
    } = this.data.exchangeModal.couponInfo;
    app.sendRequest({
      url: '/index.php?r=appCoupon/addCouponOrder',
      data: {
        'id': coinid,
        is_union_coupon: category > 0 ? 1 : 0, // 1： 联盟优惠券， 0： 非联盟优惠券
        version:'1.1',
      },
      method: 'post',
      hideLoading: true,
      success: function (res) {
        if (limitNum >= userRecvNum + 1) {
          that.setData({
            ['couponDetail.user_recv_num']: userRecvNum + 1
          });
        } else {
          that.setData({
            ['couponDetail.recv_status']: 0
          });
        }
        that.isLoading = false;
        that.showExchangeSuccess();
      },
      fail: function () {
        that.isLoading = false;
      },
      complete: function (res) {
        that.isLoading = false;
        app.hideLoading();
      }
    })
  },
  showExchangeModal: function () {
    this.setData({
      'exchangeModal.show': true,
      'exchangeModal.exchange': true,
      'exchangeModal.success': false
    });
  },
  showExchangeSuccess: function () {
    this.setData({
      'exchangeModal.show': true,
      'exchangeModal.exchange': false,
      'exchangeModal.success': true
    });
  },
  closeExchangeModal: function () {
    this.setData({
      'exchangeModal.show': false,
      'exchangeModal.exchange': false,
      'exchangeModal.success': false
    });
  },
  addLabelInput: function (e) {
    this.setData({ 'addLabelText': e.detail.value });
  },
  gotoNumberPage: function (event) {
    let num = event.currentTarget.dataset.num;
    if(num == 1) {
      this.setData({ addLabelText: 1 });
      this.confirm();
    }else {
      this.setData({ hiddenmodalput: false });
    }
  },
  confirm: function () {
    if (+this.data.couponDetail.value < +this.data.addLabelText) {
      app.showModal({ content: '核销次数超过剩余次数' });
      this.setData({ hiddenmodalput: true, addLabelText: '' })
      return
    }
    app.sendRequest({
      url: '/index.php?r=AppCoupon/RecordCurrentVerifyTimes',
      data:{
        verify_code: this.data.couponDetail.verify_code,
        current_verify_times: this.data.addLabelText
      },
      subshop: this.data.franchiseeId,
      method:'post',
      hideLoading: true,
      success: res => {
        var qrcodeUrl = `${app.globalData.siteBaseUrl}` +
          `/index.php?r=AppShop/couponQrcode&app_id=${(this.data.franchiseeId ? this.data.franchiseeId : app.globalData.appId)}` +
          `&user_coupon_id=${this.data.couponId}&consume_times=${this.data.addLabelText || 1}`;
        this.setData({
          'detailShow': false,
          'verifyShow': true,
          'hiddenmodalput': true,
          'verifyData.qrcodeUrl': qrcodeUrl
        });
        this.connectSocket();
      }
    })
  },
  cancel: function () {
    this.setData({ hiddenmodalput: true, addLabelText: '' })
  },
  transferCoupon: function () {
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/transferCoupon',
      data: {
        user_coupon_id: this.data.couponId,
        transfer_key: this.data.transfer_key,
      }
    })
  },
  getTransferKey: function() {
    this.setData({
      transfer_key: Math.round(Math.random() * Math.pow(10, 12))
    })
  },
  cancelShare: function() {
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/cancelTransferCoupon',
      data: {
        user_coupon_id: this.data.couponId
      },
      success: res => {
        this.setData({
          'couponDetail.is_selected': 0
        })
      }
    })
  },
  getCouponToList: function() {
    if(this.data.couponDetail.owner_token === app.globalData.userInfo.user_token) {
      app.showToast({
        title: '无法领取自己的优惠券',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/recvTransferCoupon',
      data: {
        transfer_key: this.data.transfer_key,
        user_coupon_id: this.data.couponId
      },
      success: res => {
        this.setData({ 'couponDetail.is_selected' : 3});
        app.showToast({
          title: '领取成功！',
          icon: 'none',
          duration: 2000
        });
      }
    })
  },
  turnToVip: function() {
    app.turnToPage(`/eCommerce/pages/vipBenefits/vipBenefits?id=${this.data.couponDetail.vipId}&is_paid_card=1`);
  }
})
