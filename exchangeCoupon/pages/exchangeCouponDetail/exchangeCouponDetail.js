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
    style: '',
    verifyData: {
      success: false,
      qrcodeUrl: ''
    }
  },
  cutStyle: function (str) { // 截取style样式
    let obj = str.split(';').reduce((p, e) => {
      let [k,v] = e.split(':')
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
    let id = options.id 
    that.setData({
      'couponId': id,
      'style': style
    });
    app.sendRequest({
      url: '/index.php?r=appCoupon/GetExchangeCouponDetail',
      data: {
        'coupon_id': id
      },
      hideLoading: true,
      success: function(res){
        that.setCouponData(res.data);
      }
    });
  },
  setCouponData: function (data) {
    let that = this;
    let useCondition = '';
    let stampsType, stampsUser = '';
    for (let item of data.coupon_info){
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
      if (item.expire == -1){
        item.start_use_date = util.formatTimeYMD(item.start_use_date, 'YYYY.MM.DD');
        item.end_use_date = util.formatTimeYMD(item.end_use_date, 'YYYY.MM.DD');
      }
      if (parseInt(item.value) == item.value) {
        item.value = parseInt(item.value);
      }
    }
    data.start_get_time = util.formatTimeYMD(data.start_get_time, 'YYYY.MM.DD');
    data.end_get_time = util.formatTimeYMD(data.end_get_time, 'YYYY.MM.DD');
    let newData = data;
    that.setData({
      'couponDetail': newData
    });
  },
  formSubmit: function (event) {
    let that = this
    let couponDetail = that.data.couponDetail;
    let is_union_coupon= couponDetail.category > 0 ? 1 : 0;// 1： 联盟优惠券， 0： 非联盟优惠券
    if (couponDetail.recv_status == 0) {
      app.showModal({content: '超过可兑换次数'});
      return
    }
    app.turnToPage('/exchangeCoupon/pages/exchangeCouponDetailOrder/exchangeCouponDetailOrder?id=' + couponDetail.id + '&is_union_coupon=' + is_union_coupon);
  },
  timeInterval: '',// 定时器,间断发送消息
  socketOpen: false,
  connectSocket: function () {
    var that = this;
    wx.connectSocket({
      url: 'wss://xcx.jisuapp.cn', //线上
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
      let data = JSON.parse(res.data);
      if (data.action == 'push_to_client') {
        let msg = JSON.parse(data.msg);
        if ((msg.type == 'app_coupon_verify') && (msg.status == 0)) {
          that.setData({
            'verifyData.success': true,
            'couponDetail.status': 2
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
  isShowMoreData:function(e){
    let index = e.currentTarget.dataset.index;
    this.data.couponDetail.coupon_info[index].showMoreData = !this.data.couponDetail.coupon_info[index].showMoreData;
    this.setData({
      'couponDetail.coupon_info': this.data.couponDetail.coupon_info
    })
  }
})
