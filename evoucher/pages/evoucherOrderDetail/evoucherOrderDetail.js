const app = getApp()
const util = require('../../../utils/util.js');
Page({
  data: {
    orderInfo: {},
    orderStatus: { '0': '订单待付款', '1': '待使用', '2': '已使用', '4': '退款审核中', '7': '已关闭'},
    orderIcon: { '0': 'goods-undone-payment', '1': 'goods-undone-ship', '2': 'goods-undone-receipt', '3': 'goods-undone-evaluation', '4': 'goods-refund', '5': 'goods-refund-doing', '6': 'presell-completed', '7': 'goods-order-close' },
    refundStatus: ['退款审核中', '', '', '等待买家退货', '商家待收货', '', '等待第三方退款结果'],
    refundIcon: ['goods-refund-review', '', '', 'goods-refund', 'goods-undone-receipt', '', 'goods-already-refund'],
    invoiceStatus: ['开票中', '查看发票', '取消开票', '开票失败', '补开发票'],
    goodsAdditionalInfo: {},
    hasAdditionalInfo: false,
    customFields: [],
    orderId: '',
    isFromTemplateMsg: false,
    originalPrice: '',
    useBalance: '',
    discount_cut_price: '',
    isFromBack: false,
    showWriteOffCodeBox: false,
    showEventDialog: false,
    eventType: '',
    hasAlreadyGoods: false,
    isShowGiveModal: false,
    isShowQRCode: false,
    evoucherSendNum: 0, // 电子卡券赠送数量
    isCanRefund: true,  // 订单是否可以退款
    verifyCodeType: 'single', // 核销码类型 单个和批量
    singleCode: {},           // 单个核销的核销码
    mulCode: {},              // 批量核销的核销码
    cantSendEvoucher: true,   // 
    showShareBtn: false,      // 是否显示赠送按钮
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
  onUnload: function () {
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
          additional_goodsid_arr = [];
        if (form_data.additional_info) {
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
        for (let i = 0; i < form_data.goods_info.length; i++) {
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
        if (form_data.status == 0 && form_data.settlement_activity && form_data.settlement_activity.item_price) {  // 如果待付款状态存在结算活动，需把结算活动金额算到实付金额
          form_data.total_price = ((+form_data.total_price) + (+form_data.settlement_activity.item_price)).toFixed(2);
        }
        form_data.canSendNum = (+form_data.goods_info[0]._electronic.buyer_unused_num || 0) + (+form_data.goods_info[0]._electronic.buyer_unaccepted_num || 0);
        if (form_data.canSendNum > 0 && form_data.status == 1) {
          that.getWriteOffCodeBox(form_data.goods_info[0].cursor);
        }
        form_data.goods_info[0]['valid_date_str'] = that.returnValidDate(form_data.goods_info[0]);
        that.setData({
          orderInfo: form_data,
          vip_cut_price: form_data.vip_cut_price,
          is_vip_goods: form_data.goods_info[0].is_vip_goods,
          hasAdditionalInfo: hasAdditionalInfo,
          discount_cut_price: form_data.discount_cut_price,
          useBalance: form_data['use_balance'],
          invoiceInfo: form_data.invoice_info,
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
          showEventDialog: false
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
        app.sendUseBehavior([{ goodsId: orderId }], 7); // 取消订单
        that.setData(data);
      },
      complete: function () {
        that.setData({
          showEventDialog: false
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
        success: function (res) {
          setTimeout(function () {
            app.showToast({
              'title': '支付成功',
              'icon': 'success',
              'success': function () {
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
            type: 1, successFunction: function () {
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
    let pagePath = '/evoucher/pages/evoucherRefund/evoucherRefund?type=apply&orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  editorRefund: function () {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/evoucher/pages/evoucherRefund/evoucherRefund?type=editor&orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
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
          showEventDialog: false
        });
      }
    })
  },
  makeComment: function (event) {
    let formId = [];
    formId.push(event.detail.formId);
    app.saveUserFormId({ form_id: formId });
    var franchiseeId = this.franchiseeId,
      pagePath = '/eCommerce/pages/makeComment/makeComment?detail=' + this.data.orderInfo.order_id + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  goToHomepage: function () {
    var router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  seeAdditionalInfo: function () {
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo?from=goodsOrderDetail');
  },
  paySuccessCallback: function () {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsOrderPaySuccess/goodsOrderPaySuccess?detail=' + orderId
      + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    if (!franchiseeId) {
      app.sendRequest({
        url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
        data: {
          order_id: orderId,
          sub_app_id: franchiseeId
        },
        success: function (res) {
          if (res.valid == 0) {
            pagePath += '&collectBenefit=1';
          }
          app.turnToPage(pagePath, 1);
        }
      });
    } else {
      app.turnToPage(pagePath, 1);
    }
  },
  copyOrderId: function () {
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
  hideEventDialog: function () {
    this.setData({
      showEventDialog: false
    })
  },
  showEventDialog: function (event) {
    this.setData({
      eventType: event.currentTarget.dataset.type,
      showEventDialog: true
    })
  },
  goOrderProgress: function () {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsOrderProgress/goodsOrderProgress?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  returnInfor: function () {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let pagePath = '/eCommerce/pages/goodsReturnInfor/goodsReturnInfor?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  cancelRefund: function () {
    let _this = this;
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    app.sendRequest({
      url: '/index.php?r=appShop/cancelRefund',
      data: {
        'order_id': orderId,
        'sub_shop_app_id': franchiseeId
      },
      success: function () {
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
  deliveryDrawback: function () {
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
        app.sendUseBehavior([{ goodsId: orderId, }], 6); // 行为轨迹埋点 申请退款
        _this.getOrderDetail(orderId);
      },
      complete: function () {
        _this.setData({
          showEventDialog: false
        });
      }
    })
  },
  goAlreadyGoodsPage: function () {
    let pagePath = '/eCommerce/pages/goodsAlreadyRefunded/goodsAlreadyRefunded';
    app.turnToPage(pagePath);
  },
  toGoodsAfterSaleDetail: function (event) {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchiseeId;
    let applyId = this.data.orderInfo.refund_apply.id;
    let router = '/eCommerce/pages/goodsAfterSaleDetail/goodsAfterSaleDetail?applyId=' + applyId + '&detail=' + orderId + '&franchisee=' + franchiseeId;
    app.turnToPage(router);
  },
  goDeliveryNavigation: function () {
    wx.openLocation({
      latitude: Number(this.data.orderInfo.self_delivery_info.latitude),
      longitude: Number(this.data.orderInfo.self_delivery_info.longitude),
      name: this.data.orderInfo.self_delivery_info.address
    });
  },
  getRefundConfigByPickUpType: function (type) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getRefundConfigByPickUpType',
      data: {
        pick_up_type: type,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        if (res.data && res.data.config_data) {
          let data = res.data.config_data;
          _this.setData({
            refundAdress: data.address || '',
            isFullRefund: data.is_full_refund
          })
        }
      }
    })
  },
  makePhoneCall: function (e) {
    let phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
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
  patchInvoicePage: function (e) {
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
  turnToGoodsDetail: function (e) {
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
  },
  sendNumInput: function (e) {
    let { orderInfo } = this.data;
    let sendNum = e.detail.value.trim();
    if (sendNum > orderInfo.canSendNum || !sendNum) {
      this.setData({
        cantSendEvoucher: true,
      });
    }
    if (sendNum && sendNum <= orderInfo.canSendNum) {
      this.setData({
        evoucherSendNum: sendNum,
        cantSendEvoucher: false,
      });
    }
  },
  getWriteOffCodeBox: function (cursor){
    let _this = this;
    let {orderId} = this.data;
    let franchiseeId = this.franchiseeId;
    let params = {
      'sub_shop_app_id': franchiseeId,
      'order_id': orderId,
      'cursor': cursor
    };
    app.sendRequest({
      url: '/index.php?r=AppShop/GetOrderVerifyCode',
      data: params,
      success: _this.setVerificationCodeData
    })
  },
  setVerificationCodeData: function (res) {
    let _this = this;
    let {verifyCodeType} = this.data;
    if (verifyCodeType == 'single') {
      _this.setData({ // 单个商品核销码
        'singleCode.codeImgUrl': util.showFullUrl(res.data.qrcode_url),
        'singleCode.codeNum': res.data.code.toString(),
        'singleCode.codeStatus': res.data.status,
      }); 
    } else {  // 批量核销码
      _this.setData({
        'mulCode.codeImgUrl': util.showFullUrl(res.data.qrcode_url),
        'mulCode.codeNum': res.data.code,
        'mulCode.codeStatus': res.data.status,
      });
    }
    _this.connectSocket();
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
  getEvoucherShareId: function () {
    let that = this;
    let { orderInfo, evoucherSendNum } = this.data;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/SendElectronicCard',
      method: 'post',
      data: {
        order_id: orderInfo.order_id,
        apply_goods: [{
          cursor: orderInfo.goods_info[0].cursor,
          num: evoucherSendNum
        }],
      },
      success: (res) => {
        if (res.data) {
          let goodsInfo = orderInfo.goods_info[0],
            goodsId = goodsInfo.goods_id;
          app.sendUseBehavior([{goodsId: goodsId}],2);
          that.setData({
            shareId: res.data,
            showShareBtn: true
          });
        }
      }
    });
  },
  onShareAppMessage: function () {
    let that = this;
    let { shareId, franchiseeId, orderInfo } = this.data;
    let goodsInfo = orderInfo.goods_info[0];
    that.getOrderDetail(this.data.orderId);
    that.hideGiveModal();
    return app.shareAppMessage({
      path: `/evoucher/pages/evoucherReceive/evoucherReceive?id=${shareId}${franchiseeId ? '&franchisee=' + franchiseeId : '' }`,
      title: `${orderInfo['buyer_info']['nickname']}送你卡券了，快来领取吧~`,
      imageUrl: goodsInfo.cover,
    });
  },
  copyCodeNum: function (e) {
    let code = e.currentTarget.dataset.code;
    app.setClipboardData({
      data: code,
      success: () => {
        app.showToast({ title: '复制成功', duration: 500 });
      }
    });
  },
  showQRCode: function (event) {
    let type = event.currentTarget.dataset.type;
    this.setData({
      verifyCodeType: type
    });
    if (type === 'single') {
      let cursor = this.data.orderInfo.goods_info[0].cursor;
      this.getWriteOffCodeBox(cursor);
    } else {
      this.getWriteOffCodeBox('-1');
    }
    this.setData({
      isShowQRCode: true
    });
  },
  hideQRCode: function () {
    this.setData({
      isShowQRCode: false
    });
    this.getOrderDetail(this.data.orderId);
  },
  showGiveModal: function () {
    this.setData({
      isShowGiveModal: true,
      cantSendEvoucher: true,
    });
  },
  hideGiveModal: function () {
    this.setData({
      isShowGiveModal: false,
      showShareBtn: false
    });
  },
  returnValidDate: function(goodsInfo) {
    let tempStr = '';
    let tempObj = {
      1: `永久有效`,
      2: `${util.formatTimeYMD(goodsInfo.start_date_time, 'YYYY-MM-DD')}至${util.formatTimeYMD(goodsInfo.end_date_time, 'YYYY-MM-DD')}`,
      3: goodsInfo['after_buy_x_days'] > 0 ? `购买后${goodsInfo['after_buy_x_days']}天后生效，有效期${goodsInfo['after_buy_continued_x_days']}天` : `购买后当天生效，有效期${goodsInfo['after_buy_continued_x_days']}天`
    };
    if (!goodsInfo['valid_start_date'] || !goodsInfo['valid_end_date']) {
      tempStr = tempObj[goodsInfo.valid_date_type];
    } else {  // 接口有有效期返回
      if (goodsInfo.valid_date_type == 1) { // 永久有效
        tempStr = tempObj[1];
      } else 
      tempStr = `${goodsInfo.valid_start_date}至${goodsInfo.valid_end_date}`
    }
    return tempStr;
  },
})
