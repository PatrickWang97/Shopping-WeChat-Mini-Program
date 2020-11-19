var app = getApp()
Page({
  data: {
    orderInfo: {},
    combinationBenefit: {},
    orderStatus: { '0': '待付款', '6': '已完成', '7': '已关闭' },
    invoiceStatus: ['开票中', '查看发票', '取消开票', '开票失败', '补开发票'],
    isFromBack: false,
    isFromTemplateMsg: false,
    orderId: '',
    discountList: []
  },
  onLoad: function (options) {
    this.setData({
      orderId: options.detail,
      isFromTemplateMsg: options.from === 'template_msg' ? true : false,
      franchiseeId: options.franchisee || ''
    })
    this.getAppInvoiceStatus();
    this.dataInitial();
  },
  dataInitial: function () {
    this.getOrderDetail(this.data.orderId);
  },
  onShow: function () {
    if (this.data.isFromBack) {
      if (!!this.data.orderId) {
        this.getOrderDetail(this.data.orderId, 1);
      }
    } else {
      this.setData({
        isFromBack: true
      })
    }
  },
  turnToFormDetail: function () {
    let pay_form_data = this.data.orderInfo.pay_form_data;
    app.turnToPage('/userCenter/pages/myMessage/myMessage?from=transforDetail&formid=' + pay_form_data.pay_form_id + '&form=' + pay_form_data.pay_form + '&formDataId=' + pay_form_data.pay_form_data_id);
  },
  getOrderDetail: function (orderId, isFromAddrSelect) {
    let combinationBenefit = {};
    app.getOrderDetail({
      data: {
        order_id: orderId,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: (res) => {
        let orderInfo = res.data[0].form_data;
        let { selected_combination_benefit, store_benefit_info, selected_benefit_info, use_balance, coupon_fee, settlement_activity, status } = orderInfo;
        if (selected_combination_benefit) {
          let { store_benefit, vip_benefit_discount_price, coupon_benefit_discount_price, integral_benefit } = selected_combination_benefit
          combinationBenefit = selected_combination_benefit;
          if (store_benefit && store_benefit.discount_price) {
            store_benefit.discount_price = (+store_benefit.discount_price).toFixed(2);
          }
          if (vip_benefit_discount_price) {
            vip_benefit_discount_price = (+vip_benefit_discount_price).toFixed(2);
          }
          if (coupon_benefit_discount_price) {
            coupon_benefit_discount_price = (+coupon_benefit_discount_price).toFixed(2);
          }
          if (integral_benefit && integral_benefit.discount_price) {
            integral_benefit.discount_price = (+integral_benefit.discount_price).toFixed(2);
          }
        }
        if (store_benefit_info && store_benefit_info.discount_price) {
          store_benefit_info.discount_price = (+store_benefit_info.discount_price).toFixed(2);
        }
        if (selected_benefit_info && selected_benefit_info.discount_price) {
          selected_benefit_info.discount_price = (+selected_benefit_info.discount_price).toFixed(2);
        }
        if (use_balance) {
          orderInfo.use_balance = (+use_balance).toFixed(2);
        }
        if (coupon_fee) {
          orderInfo.coupon_fee = (+coupon_fee).toFixed(2);
        }
        if(+status == 0 && settlement_activity && settlement_activity.item_price){
          orderInfo.total_price = ((+orderInfo.total_price) + (+settlement_activity.item_price)).toFixed(2);
        }
        delete orderInfo.can_use_benefit.coupon_benefit
        this.setData({
          orderInfo: orderInfo,
          combinationBenefit: combinationBenefit,
          discountList: orderInfo.can_use_benefit.data,
          index: orderInfo.can_use_benefit.selected_index,
        })
      }
    })
  },
  cancelOrder: function (e) {
    var orderId = this.data.orderId,
      that = this;
    app.showModal({
      content: '是否取消订单？',
      showCancel: true,
      confirmText: '是',
      cancelText: '否',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/cancelOrder',
          data: {
            order_id: orderId,
            sub_shop_app_id: that.data.franchiseeId
          },
          success: function (res) {
            var data = {};
            data['orderInfo.status'] = '7';
            app.sendUseBehavior([{goodsId: orderId}],7); // 取消订单
            that.setData(data);
          }
        })
      }
    })
  },
  payOrder: function (e) {
    var that = this,
      orderId = this.data.orderId;
    if (this.data.orderInfo.total_price == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function (res) {
          that.getOrderDetail(that.data.orderId);
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
        var param = res.data,
          orderId = that.data.orderId;
        param.orderId = orderId;
        param.goodsType = that.data.orderInfo.goods_type;
        param.success = function () {
          that.checkAppCollectmeStatus().then((valid) => {
            let pagePath = '/eCommerce/pages/transferPaySuccess/transferPaySuccess?detail=' + orderId + '?franchisee=' + that.data.franchisee;
            if(valid == 0) {
              pagePath += '&collectBenefit=1';
            }
            that.setData({ requesting: false })
            app.turnToPage(pagePath, 1);
          })
        }
        app.wxPay(param);
      }
    })
  },
  checkAppCollectmeStatus: function (){
    return new Promise((resolve) => {
      app.sendRequest({
        url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
        data: {
          order_id: this.data.orderId,
          sub_app_id: franchiseeId
        },
        success: function(res) {
          resolve(res.valid);
        }
      });
    });
  },
  goToHomepage: function () {
    var router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  changeDiscount: function (e) {
    var _this = this;
    var index = _this.data.orderInfo.can_use_benefit.selected_index;
    var value = parseInt(e.detail.value);
    this.setData({
      index: value
    });
    var discount_type = _this.data.orderInfo.can_use_benefit.data[value].discount_type,
      coupon_id = _this.data.orderInfo.can_use_benefit.data[value].coupon_id;
    app.sendRequest({
      url: '/index.php?r=AppShop/ChangeOrder',
      data: {
        app_id: app.getAppId(),
        order_id: _this.data.orderId,
        discount_type: discount_type,
        coupon_id: coupon_id,
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        _this.getOrderDetail(_this.data.orderId);
      }
    });
  },
  verificationCode: function () {
    app.turnToPage('/eCommerce/pages/verificationCodePage/verificationCodePage?detail=' + this.data.orderId + '&sub_shop_app_id=' + this.data.franchiseeId);
  },
  toFixed2: function (num) {
    return (+num).toFixed(2);
  },
  goInvoicePage: function () {
    let pagePath = '/eCommerce/pages/invoice/invoice?from=transfer&orderId=' + this.data.orderId + '&franchiseeId=' + this.data.franchiseeId;
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
  checkInvoice: function (e) {
    let orderId = e.currentTarget.dataset.orderId;
    let invoiceType = e.currentTarget.dataset.invoiceType;
    let pagePath = '/eCommerce/pages/invoiceDetails/invoiceDetails?orderId=' + orderId + '&invoiceType=' + invoiceType;
    app.turnToPage(pagePath);
  },
  getAppInvoiceStatus: function () {
    let _this = this;
    let { franchiseeId } = this.data;
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAppInvoiceStatus',
      data: {
        sub_shop_app_id: franchiseeId
      },
      success: function (res) {
        _this.setData({
          isOpenInvoice: res.data.is_invoice == 1 ? true : false
        })
      }
    })
  },
})
