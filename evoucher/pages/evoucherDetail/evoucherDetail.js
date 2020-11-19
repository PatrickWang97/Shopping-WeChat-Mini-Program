const app = getApp();
const util = require('../../../utils/util.js');
Page({
  data: {
    id: '',               // 电子卡券的领取id
    isShowQRCode: false,  // 是否显示核销码
    goodsInfo: '',        // 商品信息
    expiredNum: 0,        // 已过期数量
    unusedNum: 0,         // 待使用数据
    usedNum: 0,           // 已使用数量
    codeImgUrl: '',       // 核销二维码
    codeNum: '',          // 核销码码
    codeStatus: ''        // 核销状态
  },
  onLoad: function (options) {
    let id = options && options.id;
    this.franchiseeId = options.franchisee || '';
    this.setData({
      id: id,
      franchiseeId: this.franchiseeId
    });
    this.getEvoucherData(id);
  },
  getEvoucherData: function (id) {
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetReceivedEletronicCard',
      data: {
        id: id
      },
      success: (res) => {
        let returnData = res.data && res.data[0] || {};
        let goodsInfo = returnData.form_data.goods_info;
        let goodsModel = goodsInfo.model_value;
        goodsInfo['model_value_str'] = goodsModel && goodsModel.join ? goodsModel.join('； ') : '';
        goodsInfo['valid_date_str'] = this.returnValidDate(goodsInfo);
        let receiveNum = (+returnData.unused_num) + (+returnData.used_num) + (+returnData.expired_num);
        this.setData({
          goodsInfo: goodsInfo,
          receiveNum: receiveNum,
          expiredNum: returnData.expired_num || 0,
          unusedNum: returnData.unused_num || 0,
          usedNum: returnData.used_num || 0,
          orderId: returnData.order_id,
          cursor: returnData.cursor,
        });
        if (+returnData.unused_num > 0) {
          this.getWriteOffCodeBox();
        }
      },
    });
  },
  returnValidDate: function(goodsInfo) {
    let tempStr = '';
    tempStr = goodsInfo.valid_date_type == 1 ? '永久有效' : `${goodsInfo.valid_start_date}至${goodsInfo.valid_end_date}`;
    return tempStr;
  },
  getWriteOffCodeBox: function (){
    let that = this;
    let { orderId, cursor } = this.data;
    if (this.isLoading) { return };
    this.isLoading = true;
    let params = {
      'sub_shop_app_id': this.franchiseeId,
      'order_id': orderId,
      'cursor': cursor,
      'third_id': this.data.id
    };
    app.sendRequest({
      url: '/index.php?r=AppShop/GetOrderVerifyCode',
      data: params,
      success: that.setVerificationCodeData
    })
  },
  setVerificationCodeData: function (res) {
    this.setData({
      'codeImgUrl': util.showFullUrl(res.data.qrcode_url),
      'codeNum': res.data.code.toString(),
      'codeStatus': res.data.status,
    });
    this.isLoading = false;
    this.connectSocket();
  },
  connectSocket: function () {
    var _this = this;
    wx.connectSocket({
      url: 'wss://ceshi.zhichiwangluo.com', //线下test
      header: {
        'content-type': 'application/json'
      },
      method: 'GET'
    });
    wx.onSocketOpen(function (res) {
      let data = {
        'action': 'mark_client',
        'user_token': app.globalData.userInfo.user_token,
        'scenario_name': 'app_order_verify',
        'session_key': app.globalData.sessionKey
      };
      wx.sendSocketMessage({
        data: JSON.stringify(data)
      });
      _this.verifiTimeInterval = setInterval(function () {
        let data = {
          'action': 'heartbeat',
          'user_token': app.globalData.userInfo.user_token,
          'scenario_name': 'app_order_verify',
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
        if ((msg.type == 'app_order_verify') && (msg.status == 0)) {
          _this.setData({
            'codeStatus': 1
          });
          clearInterval(_this.verifiTimeInterval);
          wx.closeSocket();
        }
      }
    });
  },
  showQRCode: function () {
    this.getWriteOffCodeBox();
    this.setData({
      isShowQRCode: true,
    });
  },
  hideQRCode: function () {
    this.setData({
      isShowQRCode: false,
    });
  }
})