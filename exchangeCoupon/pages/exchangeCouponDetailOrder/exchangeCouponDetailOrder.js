var app = getApp()
Page({
  data: {
    useBalance: true,
    balance: '',
    couponId: '',
    couponDetail: '',
    payInfo: '',
    discountList: [],
    isFromSelectAddress: false,
    franchisee_id: '',
    cart_id_arr: [],
    cart_data_arr: [],
    balance: '',
    requesting: false,
    additional_info: {},
    is_group: '',
    inputTimer: '',
    style: '', // 兑换券样式存储
    exchangeCouponData: {
      dialogHidden: true,
      goodsInfo: {},
      selectModelInfo: {},
      hasSelectGoods: false,
      voucher_coupon_goods_info: {}
    },
    couponBuyNum: 1,//购买的可兑换券数量
    saveCouopnBuyNum: 1,//购买的可兑换券数量备份
    is_union_coupon: 0,// 1： 联盟优惠券， 0： 非联盟优惠券
    orderId: '',//订单id
    buyLimitNum: 0,//该可兑换券的可购买数
  },
  hasRequiredSuppInfo: false,
  onLoad: function (options) {
    let that = this;
    let id = options.id
    let exchangeCouponDetail = app.globalData.exchangeCouponStyle
    let style = {}
    if (exchangeCouponDetail) {
      let styleArr = this.cutStyle(exchangeCouponDetail.style)
      style.strStyle = styleArr
      style.lineBackgroundColor = exchangeCouponDetail.customFeature.lineBackgroundColor
      style.secColor = exchangeCouponDetail.customFeature.secColor
    }
    that.setData({
      'couponId': id,
      'style': style,
      is_union_coupon: options.is_union_coupon
    });
    this.getExchangeCouponInfo()
    this.getBuyLimitNum();
    this.getPayInfo()
  },
  cutStyle: function (str) { // 截取style样式
    let obj = str.split(';').reduce((p, e) => {
      let [k, v] = e.split(':')
      v = v && v.trim() || ''
      if (v) {
        p[k] = v
      }
      return p
    }, {})
    return obj
  },
  getExchangeCouponInfo: function () { // 兑换券详情
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appCoupon/GetExchangeCouponDetail',
      data: {
        'coupon_id': that.data.couponId,
      },
      hideLoading: true,
      success: function (res) {
        that.setCouponData(res.data);
      }
    });
  },
  getBuyLimitNum: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appCoupon/GetUserCanRecvExchangeCouponNum',
      data: {
        'id': that.data.couponId,
      },
      hideLoading: true,
      success: function (res) {
        if (!res.status) {
          that.setData({
            buyLimitNum: res.data
          })
        }
      }
    });
  },
  setCouponData: function (data) { // 处理兑换券的使用方式
    let that = this;
    let useCondition = '';
    if (data.type == 0) {
      useCondition = '满' + data.condition + '，减' + data.value + '元';
    } else if (data.type == 1) {
      useCondition = '打' + data.value + '折';
    } else if (data.type == 2) {
      useCondition = '可抵扣' + data.value + '元';
    } else if (data.type == 3) {
      if (data.extra_condition == '') {
        useCondition = '直接兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.price) {
        useCondition = '消费满' + data.extra_condition.price + '元可兑换' + data.coupon_goods_info.title;
      } else if (data.extra_condition.goods_id) {
        useCondition = '购买' + data.condition_goods_info.title + '可兑换' + data.coupon_goods_info.title;
      }
    } else if (data.type == 4) {
      useCondition = '储值金可充值' + data.value + '元';
    } else if (data.type == 5) {
      useCondition = data.extra_condition;
    }
    let newData = data;
    newData['useCondition'] = useCondition;
    that.setData({
      'couponDetail': newData
    });
  },
  useBalanceChange: function (e) { // 是否使用储值金
    this.setData({
      useBalance: e.detail.value ? true : false
    });
    this.changePayInfo();
  },
  changePayInfo: function () { // 改变支付优惠
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appCoupon/calculateCouponPrice',
      data: {
        'app_id': app.globalData.appId,
        'id': that.data.couponId,
        'select_benefit': that.data.selectDiscountInfo.no_use_benefit ? 'no_use_benefit' : '',
        'no_use_balance': that.data.useBalance ? 0 : 1,
        'select_benefit[discount_type]': that.data.selectDiscountInfo.discount_type,
        'select_benefit[vip_id]': that.data.selectDiscountInfo.vip_id,
        'select_benefit[coupon_id]': that.data.selectDiscountInfo.coupon_id,
        'select_benefit[discount_title]': that.data.selectDiscountInfo.discount_title,
        'num': that.data.couponBuyNum,
        'version': '1.1'
      },
      hideLoading: true,
      method: 'post',
      success: function (res) {
        let newData = res.data;
        that.setData({
          'payInfo': newData,
          'balance': newData.balance
        });
      },
      complete: function (res) {
        if (res.status != 0) {
          that.setData({
            couponBuyNum: that.data.saveCouopnBuyNum
          });
          that.changePayInfo();
        }
      }
    });
  },
  getPayInfo: function () { // 第一次拿取支付信息
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appCoupon/calculateCouponPrice',
      data: {
        'app_id': app.globalData.appId,
        'id': that.data.couponId,
        'version': '1.1'
      },
      hideLoading: true,
      method: 'post',
      success: function (res) {
        let newData = res.data
        let info = res.data;
        let benefits = info.benefit;
        let goodsBenefitsData = [];
        let selectDiscountInfo = {};
        if (info.selected_benefit) {
          selectDiscountInfo = {
            discount_title: info.selected_benefit.discount_title,
            discount_type: info.selected_benefit.discount_type,
            coupon_id: info.selected_benefit.coupon_id,
            vip_id: info.selected_benefit.vip_id
          }
        }
        benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({ label: 'coupon', value: benefits.coupon_benefit }) : '';
        benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({ label: 'vip', value: benefits.all_vip_benefit }) : '';
        that.setData({
          'balance': newData.balance,
          'payInfo': newData,
          'discountList': goodsBenefitsData,
          'selectDiscountInfo': selectDiscountInfo
        });
      },
      complete: function (res) {
        if (res.status === 0) {
          return
        }
      }
    });
  },
  confirmPayment: function (e) {
    var list = this.data.goodsList,
      that = this,
      no_use_balance = that.data.useBalance ? 0 : 1,
      selected_benefit = this.data.selectDiscountInfo.discount_type ? '' : 'no_use_benefit';
    if (this.requesting) {
      return;
    }
    if (this.data.couponBuyNum > this.data.buyLimitNum) {
      app.showToast({
        title: '超过购买上限！',
        icon: 'none'
      });
      return
    }
    let data
    this.requesting = true;
    if (selected_benefit == '') {
      data = {
        'app_id': app.globalData.appId,
        'id': that.data.couponId,
        'select_benefit[discount_type]': that.data.selectDiscountInfo.discount_type,
        'select_benefit[vip_id]': that.data.selectDiscountInfo.vip_id,
        'select_benefit[coupon_id]': that.data.selectDiscountInfo.coupon_id,
        'select_benefit[discount_title]': that.data.selectDiscountInfo.discount_title,
        'no_use_balance': no_use_balance
      }
    } else {
      data = {
        'app_id': app.globalData.appId,
        'id': that.data.couponId,
        'select_benefit': selected_benefit,
        'select_benefit[discount_type]': that.data.selectDiscountInfo.discount_type,
        'select_benefit[vip_id]': that.data.selectDiscountInfo.vip_id,
        'select_benefit[coupon_id]': that.data.selectDiscountInfo.coupon_id,
        'select_benefit[discount_title]': that.data.selectDiscountInfo.discount_title,
        'no_use_balance': no_use_balance
      }
    }
    data.num = that.data.couponBuyNum;
    data.is_union_coupon = that.data.is_union_coupon;
    data.version = '1.1';
    app.sendRequest({
      url: '/index.php?r=appCoupon/addCouponOrder',
      method: 'post',
      data: data,
      success: function (res) {
        that.setData({
          orderId: res.data.order_id
        })
        that.payOrder(res.data);
      },
      fail: function () {
        that.requesting = false;
      },
      successStatusAbnormal: function () {
        that.requesting = false;
      }
    });
  },
  cancelOrder: function (orderId) {
    var appId = app.getAppId(),
      that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/cancelOrder',
      data: {
        order_id: orderId,
        app_id: appId,
        sub_shop_app_id: appId
      },
      success: function (res) {
        app.sendUseBehavior([{goodsId: orderId}],7); // 取消订单
      }
    })
  },
  payOrder: function (data) {
    var that = this;
    function paySuccess() {
      that.getUseCouponId();
    }
    function payFail() {
      app.showModal({ content: '兑换失败！' });
      that.cancelOrder(data.order_id)
      setTimeout(() => {
        wx.navigateBack();
      }, 1000);
    }
    if (data.total_price == 0) {
      that.getUseCouponId();
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: data.order_id
      },
      success: function (res) {
        var param = res.data;
        param.orderId = data.order_id;
        param.success = paySuccess;
        param.goodsType = 0;
        param.fail = payFail;
        app.wxPay(param);
      },
      fail: function () {
        payFail();
      },
      successStatusAbnormal: function () {
        payFail();
      }
    })
  },
  showMemberDiscount: function () {
    this.selectComponent('#component-memberDiscount').showDialog(this.data.selectDiscountInfo);
  },
  afterSelectedBenefit: function (event) {
    this.setData({
      'selectDiscountInfo': event.detail.selectedDiscount
    })
    this.changePayInfo();
  },
  changeCouponNum: function (e) {
    let type = e.currentTarget.dataset.type;
    this.data.saveCouopnBuyNum = this.data.couponBuyNum;
    if (type == 'min') {
      if (this.data.couponBuyNum > 1) {
        this.data.couponBuyNum--
      } else {
        return
      }
    } else {
      if (this.data.couponBuyNum == this.data.buyLimitNum) {
        app.showToast({
          title: '超过购买上限！',
          icon: 'none'
        });
        return
      }
      this.data.couponBuyNum++
    };
    this.setData({
      couponBuyNum: this.data.couponBuyNum
    });
    this.changePayInfo();
  },
  changeCouponInput: function (e) {
    let value = e.detail.value;
    this.data.saveCouopnBuyNum = this.data.couponBuyNum;
    if (value < 1) {
      this.setData({
        couponBuyNum: 1
      });
      app.showToast({
        title: '至少需要购买一个！',
        icon: 'none'
      });
    } else if (value > this.data.buyLimitNum) {
      this.setData({
        couponBuyNum: this.data.buyLimitNum
      });
      app.showToast({
        title: '超过购买上限！',
        icon: 'none'
      });
    } else {
      this.setData({
        couponBuyNum: value
      });
    }
    this.changePayInfo();
  },
  getUseCouponId: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=appCoupon/GetUserExchangeCouponIdByOrderId',
      data: {
        order_id: that.data.orderId
      },
      success: function (res) {
        if (res.data && res.data.id.length) {
          let use_coupon_id = res.data.id[0];
          let url = '/exchangeCoupon/pages/haveBuyVoucher/haveBuyVoucher?id=' + use_coupon_id + '&type=1';
          app.turnToPage(url, 1);
        } else {
          setTimeout(() => {
            that.getUseCouponId();
          }, 1000)
        }
      }
    })
  }
})
