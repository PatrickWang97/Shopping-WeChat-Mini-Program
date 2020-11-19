var app = getApp()
var util = require('../../../utils/util.js');
Page({
  data: {
    couponId: '',       // receive时为商家设置优惠券id，use时为用户领取优惠券id
    couponDetail: {},
    receiveSuccess: 0,  // 领取成功弹窗是否显示
    receiveCount: 0,    // 已领取数量
    receiveLimitNum: 0, // 领取限制数量
    rechargeSuccess: 0, // 充值成功弹窗是否显示
    verifySuccess: false,
    verifyQrcodeUrl: '',
    verifyShow: false,
    style: '',
    verifyData: {
      success: false,
      qrcodeUrl: ''
    },
    showLoseExchangeCoupon:false,
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
  onLoad: function (options) {
    let that = this;
    let exchangeCouponDetail = app.globalData.exchangeCouponStyle
    let style = {}
    if (exchangeCouponDetail) {
      let styleArr = this.cutStyle(exchangeCouponDetail.style)
      style.strStyle = styleArr
      style.lineBackgroundColor = exchangeCouponDetail.customFeature.lineBackgroundColor
      style.secColor = exchangeCouponDetail.customFeature.secColor
    }
    let id = options.id;
    let type = options.type || 1;
    that.setData({
      'couponId': id,
      'style': style,
      'type': type,
    });
  },
  onShow:function(){
    let that =this;
    app.sendRequest({
      url: '/index.php?r=appCoupon/GetExchangeCouponDetail',
      data: {
        'id': that.data.couponId,
      },
      hideLoading: true,
      success: function (res) {
        that.setCouponData(res.data);
      }
    });
  },
  setCouponData: function (data) {
    let that = this;
    let unusedCoupon = [];
    let alreadyUseCoupon = [];
    let expiredUseCoupon = [];
    let givingCoupon = [];
    let givedCoupon = [];
    for (let item of data.coupon_info) {
      if (item.type == 0) {
        item.stampsType = '满减券'
      } else if (item.type == 1) {
        item.stampsType = '打折券'
      } else if (item.type == 2) {
        item.stampsType = '代金券'
      } else if (item.type == 3) {
        if (item.extra_condition == '') {
          item.useCondition = '直接兑换' + item.coupon_goods_info.title;
        } else if (item.extra_condition.price) {
          item.useCondition = '消费满' + item.extra_condition.price + '元可兑换' + item.coupon_goods_info.title;
        } else if (item.extra_condition.goods_id) {
          item.useCondition = '购买' + item.condition_goods_info.title + '可兑换' + item.coupon_goods_info.title;
        }
        item.stampsType = '兑换券'
      } else if (item.type == 4) {
        item.stampsType = '储值券'
      } else if (item.type == 5) {
        item.extra_condition = item.extra_condition.replace(/\\n/g, '');
        item.stampsType = '通用券'
      } else if (item.type == 6) {
        item.stampsType = '次数券'
      }
      item.showMoreData = false;
      this.isShowCouponMore(item)
      if (item.expire == -1) {
        item.start_use_date = util.formatTimeYMD(item.start_use_date, 'YYYY.MM.DD');
        item.end_use_date = util.formatTimeYMD(item.end_use_date, 'YYYY.MM.DD');
      }
      if (parseInt(item.value) == item.value) {
        item.value = parseInt(item.value);
      }
      if (item.can_use_num > 0){
        unusedCoupon.push(item);
      }
      if (item.has_used_num > 0){
        alreadyUseCoupon.push(item);
      }
      if (item.expired_num > 0){
        expiredUseCoupon.push(item);
      }
      if (item.under_transfer_num > 0){
        givingCoupon.push(item);
      }
      if (item.have_transfer_num > 0){
        givedCoupon.push(item);
      }
    }
    data.unusedCoupon = unusedCoupon;
    data.alreadyUseCoupon = alreadyUseCoupon;
    data.expiredUseCoupon = expiredUseCoupon;
    data.givingCoupon = givingCoupon;
    data.givedCoupon = givedCoupon;
    data.start_get_time = util.formatTimeYMD(data.start_get_time, 'YYYY.MM.DD');
    data.end_get_time = util.formatTimeYMD(data.end_get_time, 'YYYY.MM.DD');
    let newData = data;
    that.setData({
      'couponDetail': newData
    });
  },
  isShowCouponMore: function (data) {
    data.showMore = false;
    if (data.type == 0 || data.type == 3 || data.type == 5) {
      data.showMore = true;
    } else if (data.type == 1 || data.type == 2 || data.type == 4 || data.type == 6) {
      if (data.extra_goods && data.extra_goods != 'null') {
        data.showMore = true;
      }
    }
  },
  isShowMoreData: function (e) {
    let index = e.currentTarget.dataset.index;
    let type = e.currentTarget.dataset.type;
    let couponDetail = {};
    let coupon_info = [];
    let filed = ''
    if(type == 'noUse'){
      coupon_info = this.data.couponDetail.unusedCoupon;
      filed = 'unusedCoupon';
    }else if(type == 'alreadyUse'){
      coupon_info = this.data.couponDetail.alreadyUseCoupon;
      filed = 'alreadyUseCoupon';
    }else if(type == 'loseUse'){
      coupon_info = this.data.couponDetail.expiredUseCoupon;
      filed = 'loseUse';
    }else if(type == 'giving'){
      coupon_info = this.data.couponDetail.givingCoupon;
      filed = 'givingCoupon';
    }else if(type == 'gived'){
      coupon_info = this.data.couponDetail.givedCoupon;
      filed = 'givedCoupon';
    }
    coupon_info[index].showMoreData = !coupon_info[index].showMoreData;
    couponDetail['couponDetail.' + filed] = coupon_info;
    this.setData(couponDetail)
  },
  gotoCouponDetail: function (event) {
    let couponId = event.currentTarget.dataset.id;
    let appid = event.currentTarget.dataset.appid;
    let franisee = '';
    if (app.globalData.appId != appid && this.data.isParentShop) {
      franisee = '&franchisee=' + appid;
    }
    let url = '/pages/couponDetail/couponDetail?status=use&detail=' + couponId + franisee;
    app.turnToPage(url, false);
  },
  showMoreExchangeCoupon:function(){
    this.setData({
      showLoseExchangeCoupon: !this.data.showLoseExchangeCoupon
    });
  }
})
