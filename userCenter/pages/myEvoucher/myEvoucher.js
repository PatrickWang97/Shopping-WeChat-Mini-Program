const app = getApp();
const util = require('../../../utils/util.js');
Page({
  data: {
    isShowQRCode: false,  // 是否展示核销码
    evoucherData: {
      loadingData: {
        isLoading: false,
        isMore: 1,
        currentPage: 1
      },
      list: [],
      listNull: {
        txt: '',
        img: ''
      }
    },
    codeImgUrl: '',
    codeNum: '',
    codeStatus: ''
  },
  onLoad: function (options) {
    this.getMyEvoucherList();
  },
  onShow: function () {
  },
  getMyEvoucherList: function () {
    let that = this;
    let { loadingData, list } = this.data.evoucherData;
    if (loadingData.isLoading || !loadingData.isMore) {
      return;
    }
    this.setData({
      'evoucherData.loadingData.isLoading': true
    });
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetReceivedEletronicCard',
      data: {
        page: loadingData.currentPage,
        page_size: 10,
      },
      success: (res) => {
        let { data, is_more: isMore, current_page: currentPage } = res;
        if (data.length) {
          data.forEach((item) => {
            let goodsInfo = item.form_data.goods_info;
            let goodsModel = goodsInfo.model_value;
            goodsInfo['model_value_str'] = goodsModel && goodsModel.join ? goodsModel.join('； ') : '';
            goodsInfo['valid_date_str'] = this.returnValidDate(goodsInfo);
            item.form_data.goods_info = goodsInfo;
            item['receiveNum'] = (+item.unused_num) + (+item.used_num) + (+item.expired_num);
          });
          loadingData.isLoading = false;
          loadingData.isMore = +isMore;
          loadingData.currentPage = (currentPage || 0) + 1;
          that.setData({
            'evoucherData.loadingData': loadingData,
            'evoucherData.list': list.concat(data)
          });
        } else {  // 没有数据
          that.setData({
            'evoucherData.listNull.txt': '暂无数据',
            'evoucherData.listNull.img': 'http://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/xcx-differentialMall/icon_data_null.png',
          });
        }
      },
      complete: () => {
        wx.stopPullDownRefresh();
      }
    });
  },
  getWriteOffCodeBox: function (e){
    let { orderId, id } = e.currentTarget.dataset;
    let _this = this;
    let franchiseeId = this.franchiseeId;
    if (this.isLoading) { return };
    this.isLoading = true;
    let params = {
      'sub_shop_app_id': franchiseeId,
      'order_id': orderId,
      'cursor': '-1',
      'third_id': id
    };
    app.sendRequest({
      url: '/index.php?r=AppShop/GetOrderVerifyCode',
      data: params,
      success: _this.setVerificationCodeData
    })
  },
  setVerificationCodeData: function (res) {
    this.setData({
      'codeImgUrl': util.showFullUrl(res.data.qrcode_url),
      'codeNum': res.data.code.toString(),
      'codeStatus': res.data.status,
      'isShowQRCode': true,
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
  initEvoucherData: function () {
    this.setData({
      evoucherData: {
        loadingData: {
          isLoading: false,
          isMore: 1,
          currentPage: 1
        },
        list: [],
        listNull: {
          txt: '',
          img: ''
        }
      }
    });
  },
  onPullDownRefresh: function () {
    this.initEvoucherData();
    this.getMyEvoucherList();
  },
  onReachBottom: function () {
    this.getMyEvoucherList();
  },
  copyCodeNum: function (e) {
    console.log(e)
    let code = e.currentTarget.dataset.code;
    app.setClipboardData({
      data: code,
      success: () => {
        app.showToast({ title: '复制成功', duration: 500 });
      }
    });
  },
  showQRCode: function () {
    this.setData({
      isShowQRCode: true
    });
  },
  hideQRCode: function () {
    this.setData({
      isShowQRCode: false
    });
  },
  turnToEvoucherDetailPage: function (e) {
    let id = e.currentTarget.dataset.id;
    let status = e.currentTarget.dataset.status;
    if (status == 2) {  // 已过期的电子卡券不能跳转
      return;
    }
    app.turnToPage(`/evoucher/pages/evoucherDetail/evoucherDetail?id=${id}`);
  },
  returnValidDate: function(goodsInfo) {
    let tempStr = '';
    tempStr = goodsInfo.valid_date_type == 1 ? '永久有效' : `${goodsInfo.valid_start_date}至${goodsInfo.valid_end_date}`;
    return tempStr;
  },
})