var app = getApp()
const util = require('../../../utils/util.js');
Page({
  data: {
    orderInfo: {},
    orderStatus: { '0':'订单待付款', '1':'商家待发货', '2':'买家待收货', '3':'订单待评价', '4':'退款审核中', '5':'退款中', '6':'订单已完成', '7':'已关闭', '8': '卖家待接单', '15': '退款失败'},
    orderIcon: { '0': 'goods-undone-payment', '1': 'goods-undone-ship', '2': 'goods-undone-receipt', '3': 'goods-undone-evaluation', '4': 'goods-refund', '5': 'goods-refund-doing', '6': 'presell-completed', '7': 'goods-order-close' },
    refundStatus: ['退款审核中','','','等待买家退货','商家待收货','','等待第三方退款结果'],
    refundIcon: ['goods-refund-review', '', '', 'goods-refund', 'goods-undone-receipt', '', 'goods-already-refund'],
    refundReason: ['多拍/拍错/不想要','快递延期','未按约定时间发货','快递记录出错','内容与描述不符','其它'],
    invoiceStatus: ['开票中', '查看发票', '取消开票', '开票失败', '补开发票'],
    goodsAdditionalInfo: {},
    hasAdditionalInfo: false,
    customFields: [],
    orderId: '',
    isFromTemplateMsg: false,
    originalPrice: '',
    useBalance: '',
    freightAdress:{},
    express_fee:'',
    discount_cut_price: '',
    isFromBack: false,
    showWriteOffCodeBox: false,
    showEventDialog: false,
    eventType: '',
    hasAlreadyGoods: false,
    sameCityStatus: {
      101: "待骑手接单",
      102: "待骑手取货",
      103: "商家取消订单",
      201: "待骑手取货",
      202: "骑手已到店",
      203: "商家取消订单",
      204: "骑手取消订单（骑手原因）",
      205: "骑手取消订单（商家原因）",
      301: "配送中",
      302: "订单配送完成",
      303: "商家取消订单",
      304: "无法联系收货人，货物返回中",
      305: "收货人拒收，货物返回中",
      401: "商品返还商户，等待重新配送",
      501: "运力系统原因取消， 订单结束",
      502: "不可抗拒因素取消，订单结束",
    },
    sameCity: false,
    mapOverlay: {
      latitude: 22.52,
      longitude: 113.93,
      markers: []
    }
  },
  verifiTimeInterval: '', // 定时器,间断发送消息
  onLoad: function (options) {
    this.setData({
      orderId: options.detail,
      isFromTemplateMsg: options.from === 'template_msg' ? true : false,
      sessionFrom: options.franchisee || app.getAppId() || '',
    })
    this.franchiseeId = options.franchisee || '';
    this.dataInitial();
  },
  onShow: function () {
    if (this.data.isFromBack) {
      if (!!this.data.orderInfo.order_id) {
        this.getOrderDetail(this.data.orderInfo.order_id);
      }
    } else {
      this.setData({
        isFromBack: true
      })
    }
  },
  onUnload :function(){
  },
  onPullDownRefresh: function () {
    this.dataInitial();
    setTimeout(function () {
      wx.stopPullDownRefresh();
    }, 2000);
  },
  dataInitial: function () {
    this.getAppInvoiceStatus();
    this.getOrderDetail(this.data.orderId);
    this.getLogistics();
    this.getAppECStoreConfig();
    this.setData({
      appName: app.globalData.appTitle,
      appLogo: app.globalData.appLogo
    })
  },
  getOrderDetail: function (orderId) {
    var that = this;
    app.getOrderDetail({
      data: {
        order_id: orderId,
        sub_shop_app_id: this.franchiseeId
      },
      success: function (res) {
        var data = res.data[0],
            form_data = data.form_data,
            hasAdditionalInfo = false,
            additional_info_goods = [],
            additional_goodsid_arr = [],
            address_id = '';
        let usePickType = form_data.ecommerce_info.dispatch_use_pick_up_type;
        let intraCityStatus = '';
        if(usePickType == 2){
          intraCityStatus = form_data.ecommerce_info.ecommerce_transport_order && form_data.ecommerce_info.ecommerce_transport_order.status;
        }
        if (form_data.additional_info){
          for (var i = 0; i < form_data.goods_info.length; i++) {
            var deliveryId = form_data.goods_info[i].delivery_id,
                goodsId = form_data.goods_info[i].goods_id;
            if (deliveryId && deliveryId != '0' && additional_goodsid_arr.indexOf(goodsId) == -1) {
              additional_info_goods.push(form_data.goods_info[i]);
              additional_goodsid_arr.push(goodsId);
              hasAdditionalInfo = true;
            }
          }
        }
        let remark = form_data.remark;
        form_data.remark = remark ? remark.replace(/\n|\\n/g, '\n') : remark;
          for (let i = 0; i < form_data.goods_info.length; i++){
            if (form_data.goods_info[i].is_package_goods == 1) {
              form_data.goods_info[i].showPackageInfo = false;
            }
            if (form_data.goods_info[i].attributes) {
              for (let attr in form_data.goods_info[i].attributes) {
                for (let _goods in form_data.goods_info[i].attributes[attr].goods_list) {
                  if (!Array.isArray(form_data.goods_info[i].package_goods)) {
                    form_data.goods_info[i].package_goods = [];
                  }
                  form_data.goods_info[i].package_goods.push(form_data.goods_info[i].attributes[attr].goods_list[_goods])
                }
              }
            }
          }
        if (form_data.refunded_price) {
          that.setData({
            hasAlreadyGoods: true
          })
        }
        if (form_data.pick_up_type == 2){
          let sytime;
          let nowTime = new Date().getTime();
          let addTime = form_data.add_time.replace(/\-/g, "/");
          let time = 15 * 60000 - ((nowTime - new Date(addTime + '').getTime()));
          if (time <= 0) {
            sytime = "0";
          } else {
            sytime = parseInt((time % (1000 * 60 * 60)) / (60 * 1000));
          }
          form_data.cacelOrderCountDownTime = sytime;
        }
        if (form_data.wx_local_express_order && usePickType != 1) {
          let sameCity = true;
          let showMap = true;
          let orderStatus = form_data.status;
          if ([3,4,5,6,7].find(item => item == orderStatus)) {
            showMap = false;
          }
          that.getSameCityOrder(res => {
            form_data['wx_local_express_order']['agent'] = res;
            that.initMapInfo(form_data, sameCity, showMap);
          })
        }
        if(form_data.status == 0 && form_data.settlement_activity && form_data.settlement_activity.item_price){  // 如果待付款状态存在结算活动，需把结算活动金额算到实付金额
          form_data.total_price = ((+form_data.total_price) + (+form_data.settlement_activity.item_price)).toFixed(2);
        }
        that.setData({
          orderInfo: form_data,
          vip_cut_price: form_data.vip_cut_price,
          is_vip_goods: form_data.goods_info[0].is_vip_goods,
          hasAdditionalInfo: hasAdditionalInfo,
          discount_cut_price: form_data.discount_cut_price,
          useBalance: form_data['use_balance'],
          express_fee: res.data[0]['express_fee'],
          box_fee: form_data['box_fee'] || 0,
          intraCityStatus: intraCityStatus || '',
          usePickType: usePickType,
          invoiceInfo: form_data.invoice_info
        });
        app.setPreviewGoodsInfo(additional_info_goods);
        app.setGoodsAdditionalInfo(form_data.additional_info || {});
        that.getRefundConfigByPickUpType(form_data.pick_up_type);
      }
    })
  },
  orderDelete: function (e) {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let _this = this;
        app.sendRequest({
          url: '/index.php?r=AppShop/HideOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: franchiseeId
          },
          success: function (res) {
            app.turnBack()
          },
          complete: function () {
            _this.setData({
              showEventDialog : false
            });
          }
        })
  },
  cancelOrder: function (e) {
    var orderId = this.data.orderInfo.order_id,
        that = this;
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.franchiseeId
          },
          success: function (res) {
            var data = {};
            data['orderInfo.status'] = 7;
            app.sendUseBehavior([{goodsId: orderId}],7); // 取消订单
            that.setData(data);
          },
          complete: function () {
            that.setData({
              showEventDialog : false
            });
          }
        })
  },
  payOrder: function (e) {
    var address_info = this.data.orderInfo.address_info,
        that = this,
        orderId = this.data.orderInfo.order_id;
    if (this.data.orderInfo.total_price == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function(res){
          setTimeout(function(){
            app.showToast({
              'title': '支付成功',
              'icon': 'success',
              'success': function(){
                that.paySuccessCallback();
              }
            });
          });
        }
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      data: {
        order_id: orderId
      },
      success: function (res) {
        var param = res.data;
        param.orderId = orderId;
        param.goodsType = that.data.orderInfo.goods_type;
        param.success = function () {
          app.requestSubscribeMessage({ 
            type: 1, successFunction: function(){
              that.paySuccessCallback()
            }
          })
        };
        app.wxPay(param);
      }
    })
  },
  applyDrawback: function () {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/previewGoodsRefund/previewGoodsRefund?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  editorRefund: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsRefundPage/goodsRefundPage?type=editor&orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  receiveDrawback: function () {
    var orderId = this.data.orderInfo.order_id,
        that = this;
        app.sendRequest({
          url: '/index.php?r=AppShop/comfirmRefund',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.franchiseeId
          },
          success: function (res) {
            var data = {};
            data['orderInfo.status'] = 7;
            that.setData(data);
          },
          complete: function () {
            that.setData({
              showEventDialog : false
            });
          }
        })
  },
  checkLogistics: function () {
    let orderId = this.data.orderId;
    let dispatch_status = this.data.orderInfo.dispatch_status;
    let ecommerce_info = this.data.orderInfo.ecommerce_info;
    let usePickType = this.data.usePickType;
    if (dispatch_status != 1){
      if (usePickType == 2) {
        let intraCityData = ecommerce_info.intra_city_data;
        let type = intraCityData && intraCityData.deliver_type || '';
        let arriveTime = intraCityData && intraCityData.intra_city_appointment_arrive_time || '';
        let sameCity = this.data.sameCity ? 1 : 0;
        app.turnToPage('/eCommerce/pages/sameJourneyLogistic/sameJourneyLogistic?orderId=' + orderId + '&type=' + type + '&arriveTime=' + arriveTime + '&franchiseeId=' + this.franchiseeId + '&sameCity=' + sameCity);
      } else {
        app.turnToPage('/eCommerce/pages/logisticsPage/logisticsPage?detail=' + orderId + '&franchiseeId=' + this.franchiseeId);
      }
    }else{
      app.turnToPage('/eCommerce/pages/logisticsGoodsList/logisticsGoodsList?orderId=' + orderId + '&franchiseeId=' + this.franchiseeId);
    }
  },
  sureReceipt: function (event) {
    var orderId = this.data.orderId,
        that = this,
        addTime = Date.now();
        let formId = [];
        formId.push(event.detail.formId);
        app.saveUserFormId({ form_id: formId });
        app.sendRequest({
          url: '/index.php?r=AppShop/comfirmOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.franchiseeId
          },
          success: function (res) {
            app.sendUseBehavior([{goodsId: orderId}],8); // 确认收货
            app.turnToPage('/eCommerce/pages/transactionSuccess/transactionSuccess?pageFrom=transation&orderId=' + orderId + '&franchiseeId=' + that.franchiseeId);
            app.sendRequest({
              hideLoading: true,
              url: '/index.php?r=appShop/getIntegralLog',
              data: { add_time: addTime },
              success: function (res) {
                if (res.status == 0) {
                  res.data && that.setData({
                    'rewardPointObj': {
                      showModal: true,
                      count: res.data,
                      callback: ''
                    }
                  });
                }
              }
            })
          },
          complete: function () {
            that.setData({
              showEventDialog : false
            });
          }
        })
  },
  makeComment: function (event) {
    let formId = [];
    formId.push(event.detail.formId);
    app.saveUserFormId({ form_id: formId });
    var franchiseeId = this.franchiseeId,
        pagePath = '/eCommerce/pages/makeComment/makeComment?detail='+this.data.orderInfo.order_id+(franchiseeId ? '&franchisee='+franchiseeId : '');
    app.turnToPage(pagePath);
  },
  goToHomepage: function () {
    var router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  getFreigtAdress:function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getAppShopLocationInfo',
      data: {
        app_id: app.getAppId(),
        sub_app_id: that.franchiseeId
      },
      success: function (res) {
        that.setData({
          freightAdress: res.data
        });
      }
    });
  },
  seeAdditionalInfo: function(){
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo?from=goodsOrderDetail');
  },
  paySuccessCallback: function(){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsOrderPaySuccess/goodsOrderPaySuccess?detail=' + orderId
                  + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    if(!franchiseeId){
      app.sendRequest({
        url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
        data: {
          order_id: orderId,
          sub_app_id: franchiseeId
        },
        success: function(res){
          if(res.valid == 0) {
            pagePath += '&collectBenefit=1';
          }
          app.turnToPage(pagePath, 1);
        }
      });
    } else {
      app.turnToPage(pagePath, 1);
    }
  },
  copyOrderId: function(){
    let _this = this;
    wx.setClipboardData({
      data: _this.data.orderId,
      success: function (res) {
        app.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  },
  getWriteOffCodeBox: function (event){
    let _this = this;
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let formId = [];
    formId.push(event.detail.formId);
    app.saveUserFormId({ form_id: formId });
    app.sendRequest({
      url: '/index.php?r=AppShop/GetOrderVerifyCode',
      data: {
        'sub_shop_app_id': franchiseeId,
        'order_id': orderId
      },
      success: _this.setVerificationCodeData
    })
  },
  setVerificationCodeData: function (res) {
    let _this = this;
    _this.setData({
      'codeImgUrl': res.data.qrcode_url,
      'codeNum': res.data.code,
      'codeStatus': res.data.status,
      'showWriteOffCodeBox': true
    });
    _this.connectSocket();
  },
  connectSocket: function () {
    var _this = this;
    wx.connectSocket({
      url: 'wss://xcx.jisuapp.cn', //线上,
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
  hideEventDialog: function () {
    this.setData({
      showEventDialog: false
    })
  },
  showEventDialog: function (event){
    this.setData({
      eventType: event.currentTarget.dataset.type,
      showEventDialog: true
    })
  },
  goOrderProgress: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsOrderProgress/goodsOrderProgress?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  returnInfor: function (){
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsReturnInfor/goodsReturnInfor?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  cancelRefund: function(){
    let _this = this;
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    app.sendRequest({
      url: '/index.php?r=appShop/cancelRefund',
      data: {
        'order_id': orderId,
        'sub_shop_app_id': franchiseeId
      },
      success: function(){
        _this.getOrderDetail(orderId);
      }
    })
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
  },
  deliveryDrawback: function(){
    let _this = this;
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShop/applyRefund',
      data: {
        order_id: orderId,
        sub_shop_app_id: franchiseeId
      },
      success: function (res) {
        app.sendUseBehavior([{goodsId: orderId,}],6); // 行为轨迹埋点 申请退款
        _this.getOrderDetail(orderId);
      },
      complete: function () {
        _this.setData({
          showEventDialog: false
        });
      }
    })
  },
  goAlreadyGoodsPage: function(){
    let pagePath = '/eCommerce/pages/goodsAlreadyRefunded/goodsAlreadyRefunded';
    app.turnToPage(pagePath);
  },
  getLogistics: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/expressFlow',
      data: {
        order_id: _this.data.orderId
      },
      success: function (res) {
        let info = res.data;
        if(!info){return};
        if (info.is_custom) {
          _this.setData({
            logisticsCustom: info.is_custom
          })
        } else {
          let logistics = info.Traces || '';
          if (info.waybill_id) {
            info.path_item_list.map((item) => {
              item.AcceptTime = item.action_time;
              item.AcceptStation = item.action_msg;
            })
            logistics = info.path_item_list;
          }
          _this.setData({
            logistics: logistics
          })
        }
      }
    })
  },
  toGoodsAfterSaleDetail: function (event) {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let applyId = this.data.orderInfo.refund_apply.id;
    let router = '/eCommerce/pages/goodsAfterSaleDetail/goodsAfterSaleDetail?applyId=' + applyId + '&detail=' + orderId + '&franchisee=' + franchiseeId;
    app.turnToPage(router);
  },
  goDeliveryNavigation: function(){
    wx.openLocation({
      latitude: Number(this.data.orderInfo.self_delivery_info.latitude),
      longitude: Number(this.data.orderInfo.self_delivery_info.longitude),
      name: this.data.orderInfo.self_delivery_info.address
    });
  },
  sameJournyLogistic: function(){
    var orderId = this.data.orderId;
    app.turnToPage('/eCommerce/pages/sameJournyLogistic/sameJournyLogistic?detail=' + orderId);
  },
  getRefundConfigByPickUpType: function(type){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getRefundConfigByPickUpType',
      data: {
        pick_up_type: type,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        if (res.data && res.data.config_data){
          let data = res.data.config_data;
          _this.setData({
            refundAdress: data.address || '',
            isFullRefund: data.is_full_refund
          })
        }
      }
    })
  },
  initMapInfo(form_data, sameCity, showMap) {
    let sameCityInfo = form_data.wx_local_express_order;
    let markers = [];
    let senderItem = {
      id: 0,
      latitude: sameCityInfo['sender']['lat'],
      longitude: sameCityInfo['sender']['lng'],
      iconPath: 'http://cdn.jisuapp.cn/static/webapp/images/xcx-goods/merchant-delivery.png',
      width: 47,
      height: 51,
    }
    let ridersItem = {
      id: 1,
      latitude: sameCityInfo['agent']['rider_lat'] || 22.52,
      longitude: sameCityInfo['agent']['rider_lng'] || 113.93,
      iconPath: 'http://cdn.jisuapp.cn/static/jisuapp_editor/images/sameCity/rider.png',
      width: 38,
      height: 45,
    }
    let receiverItem = {
      id: 2,
      latitude: sameCityInfo['receiver']['lat'],
      longitude: sameCityInfo['receiver']['lng'],
      iconPath: 'http://cdn.jisuapp.cn/static/jisuapp_editor/images/sameCity/receiver.png',
      width: 38,
      height: 45,
    }
    markers = [senderItem, ridersItem, receiverItem];
    markers = this.transPosition(markers, sameCityInfo.order_status);
    this.setData({
      'mapOverlay.markers': markers,
      sameCityInfo,
      sameCity,
      showMap
    })
  },
  transStatus(status) {
    switch (+status) {
      case 101:
        return '待骑手接单';
      case 102:
        return '待骑手取货';
      case 103:
      case 203:
      case 303:
        return '商家取消订单';
      case 201:
        return '骑手取货中';
      case 202:
        return '骑手已到店';
      case 204:
      case 205:
        return '骑手取消订单';
      case 301:
        return '骑手配送中';
      case 302:
        return '订单已完成';
      case 304:
      case 305:
        return '配送失败';
      case 401:
      case 501:
      case 502:
        return '订单结束，等待重新配送'
    }
  },
  transPosition(mapOverlay,status) {
    let transStatus = this.transStatus(status);
    let obj = {
      callout: {
        content: transStatus,
        bgColor: '#ffffff',
        display: 'ALWAYS',
        padding: 4,
        borderRadius: 5
      }
    }
    switch (transStatus) {
      case '待骑手接单':
      case '商家取消订单':
      case '订单已完成':
      case '订单结束，等待重新配送':
        Object.assign(mapOverlay[0], obj);
        mapOverlay.splice(1,1);
        this.setData({
          'mapOverlay.latitude': mapOverlay[0]['latitude'] + 0.0005,
          'mapOverlay.longitude': mapOverlay[0]['longitude'],
        })
        break;
      case '待骑手取货':
      case '骑手取货中':
      case '骑手已到店':
      case '骑手取消订单':
      case '骑手配送中':
      case '配送失败':
        Object.assign(mapOverlay[1], obj);
        this.setData({
          'mapOverlay.latitude': mapOverlay[1]['latitude'] + 0.0005,
          'mapOverlay.longitude': mapOverlay[1]['longitude'],
        })
        break;
    }
    return mapOverlay;
  },
  callRider() {
    let phone = this.data.sameCityInfo['agent']['rider_phone'] ;
    app.makePhoneCall(phone);
  },
  getSameCityOrder(callback) {
    app.sendRequest({
      url: '/index.php?r=ExpressAssistant/GetLocalExpressOrderByApi',
      data: {
        order_id: this.data.orderId
      },
      success: function (res) {
        callback && callback(res['data']);
      }
    })
  },
  showPackageInfoFn: function (e) { // 展示商品套餐详情
    let status = e.currentTarget.dataset.status;
    let index = e.currentTarget.dataset.index;
    let goodsList = this.data.orderInfo.goods_info;
    goodsList[index].showPackageInfo = status == 1 ? true : false;
    this.setData({
      'orderInfo.goods_info': goodsList
    })
  },
  goInvoicePage: function () {
    let pagePath = '/eCommerce/pages/invoice/invoice?from=orderdetail&orderId=' + this.data.orderId + '&franchiseeId=' + this.franchiseeId;
    app.turnToPage(pagePath);
  },
  patchInvoicePage: function(e){
    let isPatch = e.currentTarget.dataset.isPatch;
    let pagePath = '/eCommerce/pages/invoice/invoice?from=patch&orderId=' + this.data.orderId + '&franchiseeId=' + this.franchiseeId + '&isPatch=' + (isPatch ? '1' : '0');
    app.turnToPage(pagePath);
  },
  getAppInvoiceStatus: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAppInvoiceStatus',
      data: {
        sub_shop_app_id: this.franchiseeId
      },
      success: function (res) {
        _this.setData({
          isOpenInvoice: res.data.is_invoice == 1 ? true : false
        })
      }
    })
  },
  checkInvoice: function (e) {
    let orderId = e.currentTarget.dataset.orderId;
    let invoiceType = e.currentTarget.dataset.invoiceType;
    let pagePath = '/eCommerce/pages/invoiceDetails/invoiceDetails?orderId=' + orderId + '&invoiceType=' + invoiceType;
    app.turnToPage(pagePath);
  },
  saveInWeChat: function (e) {
    let orderId = e.currentTarget.dataset.orderId;
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAuthInfo',
      data: {
        order_id: orderId
      },
      success: function (res) {
        app.navigateToXcx({
          appId: res.data.appid,
          path: res.data.auth_url
        })
      }
    })
  },
  turnToGoodsDetail: function(e) {
    let dataset = e.currentTarget.dataset;
    let franchisee = this.franchiseeId;
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    if (+dataset.group) {
      let pageUrl = dataset.status == 4 ? '/detailPage/pages/goodsDetail/goodsDetail?detail=' + dataset.id + chainParam : '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + dataset.id + '&activity_id=' + dataset.groupId + chainParam;
      if (dataset.goodsType == 10) { //预约商品跳转到预约通用详情
        pageUrl = '/tradeApt/pages/TYDetail/TYDetail?detail=' + dataset.id + chainParam + (dataset.status == 4 ? '' : '&activeId=' + dataset.groupId + '&activeType=group');
      }
      app.turnToPage(pageUrl);
      return;
    }
    if (dataset.presell) {
      app.turnToPage('/presell/pages/presellDetail/presellDetail?detail=' + dataset.id + '&activity_id=' + dataset.presellId + chainParam);
      return;
    }
    if (dataset.seckill == 1) {
      if (dataset.appId && dataset.appId !== app.getAppId() && chainParam === '') { // 子店秒杀商品
        chainParam = '&franchisee=' + appId;
      }
      if (dataset.seckillStartState != 2) {
        let path = '/seckill/pages/seckillDetail/seckillDetail?id=' + dataset.id + '&sec_act_id=' + dataset.seckillId + '&sec_t_id=' + dataset.seckillTimeId + '&secType=' + (+dataset.seckillId ? 1 : 0) + chainParam;
        app.turnToPage(path);
      } else {
        app.showModal({ content: '该商品秒杀活动已结束' });
      }
    }
    app.turnToGoodsDetail(e);
  }
})
