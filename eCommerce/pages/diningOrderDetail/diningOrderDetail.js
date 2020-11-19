var app = getApp();
var customEvent = require('../../../utils/custom_event.js');
var util = require('../../../utils/util.js')
Page({
  data: {
    pageData: {
      useBalance: true,
      selectDiscountInfo: {},
      discountList: [],
    },
    exchangeCouponData: {
      dialogHidden: true,
      goodsInfo: {},
      selectModelInfo: {},
      hasSelectGoods: false,
      voucher_coupon_goods_info: {}
    },
    changeOrder: false,
    showMoreBtn: false,
    showMoreGoods: false,
    showBenefitInfo: false,
    customNumArr: Array.from(new Array(101).keys()).slice(1),
    userToken: app.globalData.userInfo.user_token,
    payGiftOptions: {},               // 支付有礼计算金额参数
    settlementActivityFreePrice: '',  // 参与结算活动的金额
    isShowSettlementActivity: false,  // 是否展示结算页活动
    invoiceStatus: ['开票中', '查看发票', '取消开票', '开票失败', '补开发票'],
    shopping_cards_deduct_all: false,   // 购物卡是否可以抵扣全部的金额
    cardDialog: false, //购物卡选择框
    uselessCard: false, // 不可用购物卡
    selected: false, // 购物卡被选中
    can_use_shopping_cards: [], // 购物卡可用列表
    cant_use_shopping_cards: [], // 不可用购物卡列表
    selectCardList: [], //选择的购物卡列表
    user_gift_card_info: {},   //礼品卡信息
    total_discount_cut_price:'',
    payGiftPrice: '',                  // 支付有礼价格
    hiddenInvoice: false,              // 隐藏开票口
  },
  shopping_cards_info: [], // 可用购物卡id
  franchisee_id: '',
  requesting: false,
  pickUpType: 0,
  onLoad(options) {
    let orderId = options.detail || '';
    this.franchisee_id = options.franchisee || '';
    this.setData({
      orderId: orderId,
      franchisee_id: this.franchisee_id,
      'pageData.useBalance': this.franchisee_id ? false : true
    })
  },
  onShow: function () {
    if(!this.isRefreshPage){
      this.dataInit();
    }
  },
  onPullDownRefresh: function () {
    this.dataInit();
    setTimeout(()=> {
      wx.stopPullDownRefresh()
    },3000)
  },
  dataInit: function () {
    this.getAppInvoiceStatus();
    this.getDiningBaseSetting();
    this.getDiningFuncSetting();
    this.getOrderDetail(this.noticeMethod);
  },
  showBtnStyle: function () {
    let showBtnNum = 0;
    this.data.pageData.allow_app_account ? showBtnNum++ : '';
    this.data.pageData.allow_add_dish && this.data.pageData.orderInfo.status == 17 ? showBtnNum++ : '';
    this.data.pageData.orderInfo.goods_reduced_nums && this.data.pageData.ec_dining_data.has_reduce_dishes ? showBtnNum++ : '';
    this.setData({
      showBtnNum: showBtnNum
    })
  },
  showMoreBtn: function () {
    this.setData({
      showMoreBtn: !this.data.showMoreBtn
    })
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeConfig: res,
        storeStyle: res.color_config
      })
    }, this.franchisee_id);
  },
  getOrderDetail: function (callback) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getOrder',
      data: {
        order_id: this.data.orderId,
      },
      method: 'post',
      success: function (res) {
        let orderInfo = res.data[0].form_data;
        let ecommerce_info = orderInfo.ecommerce_info;
        let diningOrderList = ecommerce_info.ecommerce_dining_child_order;
        let goodsSum = 0;
        let newData = {};
        let additional_goodsid_arr = [];
        let additional_info_goods = [];
        let hasAdditionalInfo = false;
        let vip_goods_list = [];
        if (orderInfo.additional_info) {
          for (var i = 0; i < orderInfo.goods_info.length; i++) {
            var deliveryId = orderInfo.goods_info[i].delivery_id,
              goodsId = orderInfo.goods_info[i].goods_id;
            if (deliveryId && deliveryId != '0' && additional_goodsid_arr.indexOf(goodsId) == -1) {
              additional_info_goods.push(orderInfo.goods_info[i]);
              additional_goodsid_arr.push(goodsId);
              hasAdditionalInfo = true;
            }
          }
          newData['hasAdditionalInfo'] = hasAdditionalInfo;
          app.setPreviewGoodsInfo(additional_info_goods);
          app.setGoodsAdditionalInfo(orderInfo.additional_info || {});
        }
        for (let i = 0; i < diningOrderList.length; i++) {
          let data = diningOrderList[i].child_form_data;
          for (let j=0; j< data.length; j++) {
            goodsSum += data[j].goods_list.length
            for (let k=0; k< data[j].goods_list.length; k++) {
              if (!Array.isArray(data[j].goods_list[k].package_goods)) {
                data[j].goods_list[k].package_goods = [];
              }
              if (data[j].goods_list[k].is_package_goods == 1) {
                data[j].goods_list[k].showPackageInfo = false;
              }
              if (data[j].goods_list[k].attributes) {
                for (let attr in data[j].goods_list[k].attributes) {
                  for (let _goods in data[j].goods_list[k].attributes[attr].goods_list) {
                    data[j].goods_list[k].package_goods.push(data[j].goods_list[k].attributes[attr].goods_list[_goods]);
                  }
                }
              }
              data[j].goods_list[k].showPackageInfo = false;
              if (data[j].goods_list[k].model_value && data[j].goods_list[k].model_value.length)  {
                data[j].goods_list[k].model_value_str = data[j].goods_list[k].model_value.join('|');
              }
            }
          }
        }
        let actIdArr = [];
        orderInfo.goods_info.forEach((item, index) => {
          if (item.is_vip_goods) {
            if(item.model_value && item.model_value.length){
              item.model_value_str = item.model_value.join('|');
            }
            if (ecommerce_info.ec_dining_data.account_type == 1){
              if (item.refunded_num){
                item.count = item.num - item.refunded_num;
              }else {
                item.count = item.num;
              }
            }else {
              item.count = item.num;
            }
            vip_goods_list.push(item);
          }
          let actid = item.price_break_discounts_activity_id;
          if (actid > 0 && actIdArr.indexOf(actid)< 0) {
            actIdArr.push(actid);
          }
        })
        if(orderInfo.status == 0 && orderInfo.settlement_activity && orderInfo.settlement_activity.item_price){  // 如果待付款状态存在结算活动，需把结算活动金额算到实付金额
          orderInfo.total_price = ((+orderInfo.total_price) + (+orderInfo.settlement_activity.item_price)).toFixed(2);
        }
        if (Array.isArray(orderInfo.selected_benefit_info)) {
          newData['pageData.show_benefit_info'] = false;
        } else {
          newData['pageData.show_benefit_info'] = true;
        }
        newData['actIdArr'] = actIdArr;      // 存储购物车拿到的 满减活动id 调接口参数使用
        newData['actIdArrOri'] = actIdArr;      // 存储购物车拿到的 满减活动id 页面渲染使用
        newData['pageData.box_fee'] = orderInfo.box_fee;
        newData['pageData.tissue_fee'] = orderInfo.tissue_fee;
        newData['pageData.server_fee'] = orderInfo.server_fee;
        newData['pageData.goodsSum'] = goodsSum;
        newData['pageData.totalPayment'] = orderInfo.total_price;
        newData['pageData.original_price'] = orderInfo.original_price;
        newData['pageData.orderInfo'] = orderInfo;
        newData['pageData.people_num'] = orderInfo.people_num;
        newData['pageData.additional_info'] = orderInfo.additional_info;
        newData['pageData.ec_dining_data'] = ecommerce_info.ec_dining_data;
        newData['pageData.location_id'] = ecommerce_info.ec_dining_data.location_id || '';
        newData['pageData.take_meal_type'] = ecommerce_info.ec_dining_data.take_meal_type || '';
        newData['pageData.account_type'] = ecommerce_info.ec_dining_data.account_type;
        newData['pageData.dining_mode'] = ecommerce_info.ec_dining_data.dining_mode;
        newData['pageData.diningOrderList'] = ecommerce_info.ecommerce_dining_child_order;
        newData['vip_goods_list'] = vip_goods_list;
        newData['invoiceInfo'] = orderInfo.invoice_info;
        let coupon = orderInfo.selected_benefit_info;
        if (!Array.isArray(coupon)) {
          if (coupon.discount_type == 'coupon' && coupon.benefit_type == 2) {
            newData['exchangeCouponData.selectModelInfo'] = coupon;
            newData['exchangeCouponData.hasSelectGoods'] = true;
            newData['exchangeCouponData.goodsInfo.cover'] = coupon.goods_img;
            newData['exchangeCouponData.goodsInfo.title'] = coupon.goods_title || '';
            newData['exchangeCouponData.goodsInfo.model_value_str'] = coupon.model_name || '';
          }
        }
        that.pickUpType = orderInfo.pick_up_type;
        that.setData(newData);
        ecommerce_info.ec_dining_data.account_type == 2 ? that.showBtnStyle() : '';
        that.modifyTime(orderInfo);
        typeof callback == 'function' && callback();
        that.getGoodsDiscountInfoInCart(); // 计算价格
      }
    })
  },
  noticeMethod: function() {
    let data = this.data.pageData;
    let newData = {};
    if (data.account_type == 1 && data.orderInfo.status == 3) {
      data.ec_dining_data.location_id ? newData['showNoticeModal'] = true : newData['showNoticeModal'] = false;
    } else {
      data.orderInfo.status == 17 ? newData['showNoticeModal'] = true : newData['showNoticeModal'] = false;
    }
    this.setData(newData);
  },
  showNoticeModalFn: function() {
    this.setData({
      showNoticeModal : false
    })
  },
  orderDelete: function () {
    var orderId = this.data.orderId,
      franchisee = this.franchisee_id,
      appId = app.getAppId(),
      subShopId = franchisee == app.getAppId() ? '' : franchisee,
      that = this;
    app.showModal({
      content: '是否删除该订单？',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirmColor: '#FF7100',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/HideOrder',
          data: {
            order_id: orderId,
            app_id: appId,
            sub_shop_app_id: subShopId
          },
          success: function (res) {
            app.turnBack();
          }
        })
      }
    })
  },
  orderCancel: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/cancelOrder',
      data: {
        order_id: this.data.orderId
      },
      success: function (res) {
        app.sendUseBehavior([{goodsId: that.data.orderId}],7); // 取消订单
        that.getOrderDetail();
      }
    })
  },
  goOrderProgress: function () {
    let orderId = this.data.orderId;
    let franchiseeId = this.franchisee_id;
    let pagePath = '/eCommerce/pages/goodsOrderProgress/goodsOrderProgress?orderId=' + orderId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  turnToRufundDish: function () {
    let orderId = this.data.orderId;
    let type = this.data.pageData.account_type;
    let franchisee = this.franchisee_id ? '&franchisee=' + this.franchisee_id : '';
    app.turnToPage('/eCommerce/pages/refundDishesDetail/refundDishesDetail?detail=' + orderId + '&type=' + type + franchisee);
  },
  turnToComment: function (e) {
    var orderId = this.data.orderId,
      franchiseeId = this.franchisee_id,
      queryStr = franchiseeId === app.getAppId() ? '' : '&franchisee=' + franchiseeId;
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    app.turnToPage('/eCommerce/pages/makeComment/makeComment?detail=' + orderId + queryStr);
  },
  changeDiningOrder: function (e) {
    let formId = [];
    if (e.detail.formId) {
      formId.push(e.detail.formId);
      app.saveUserFormId({ form_id: formId });
    };
    this.setData({
      changeOrder: true,
      showMoreBtn: false
    })
  },
  changeCustomNum: function (e) {
    let value = +e.detail.value + 1;
    if (value != this.data.pageData.people_num) {
      this.setData({
        'pageData.people_num': value
      })
      this.getCalculationInfo();
      this.changeOrderInfo();
    }
  },
  changeOrderInfo: function() {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/ChangePeopleNum',
      data: {
        num: this.data.pageData.people_num,
        order_id: this.data.orderId
      },
      success: function (res) {
      }
    })
  },
  saveOrderInfo: function (e) {
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    this.setData({
      changeOrder: false
    })
  },
  turnToAddDish: function (e) {
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    if (this.franchisee_id) {
      let that = this;
      app.showModal({
        title: '温馨提示',
        content: '子店商品继续点菜只能跳转子店首页或者连锁首页',
        showCancel: true,
        confirm: function () {
          that.goToHomepage();
        }
      });
      return;
    }
    if (this.data.pageData.location_id) {
      app.globalData.ec_location_id = this.data.pageData.location_id;
    }
    let form = JSON.parse(this.path);
    let action = form.action;
    customEvent.clickEventHandler[action] && customEvent.clickEventHandler[action](form, '', '');
  },
  goToHomepage: function () {
    let that = this;
    let franchiseeId = that.franchisee_id;
    let chainId = app.getChainId();
    if (franchiseeId && franchiseeId != chainId) {
      let pages = getCurrentPages();
      let p = pages[pages.length - 2];
      if (p && p.route == 'franchisee/pages/goodsMore/goodsMore') {
        app.turnBack({ delta: 2 });
      } else {
        customEvent.clickEventHandler['to-franchisee']({ 'franchisee-id': franchiseeId });
      }
    } else {
      var router = app.getHomepageRouter();
      app.reLaunch({ url: '/pages/' + router + '/' + router });
    }
  },
  getCalculationInfo: function (callback) {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/calculationPrice',
      method: 'post',
      data: {
        shopping_cards_info: this.shopping_cards_info || '',   // 使用购物卡下单
        dining_order_id: this.data.orderId,
        ecommerce_info: {
          'ec_dining_data': {
            'ordering_food_type': 1, // 点餐方式
            'dining_mode': _this.data.pageData.dining_mode, // 就餐方式
            'people_num': _this.data.pageData.people_num, // 就餐人数
            'take_meal_type': _this.data.pageData.take_meal_type, // 取餐类型
            'location_id': _this.data.pageData.location_id, // 座位号码
            'account_type': _this.data.pageData.account_type // 结账方式
          }
        },
        sub_shop_app_id: this.franchisee_id,
        is_balance: this.data.pageData.useBalance ? 1 : 0,
        selected_benefit: this.data.pageData.selectDiscountInfo,
        pick_up_type: 4, // 写死 后面改
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
        settlement_activity_info: this.shopping_cards_info.length > 0 ? '' : this.data.payGiftOptions,
        use_price_break_discounts_activity_ids: this.data.actIdArr,   // 满减活动id集合
      },
      success: function (res) {
        if ((_this.data.can_use_shopping_cards.length > 0 || _this.data.cant_use_shopping_cards.length > 0) && _this.data.pickUpType != 4) {
        } else {
          if (res.data.can_use_shopping_cards.length > 0) {
            res.data.can_use_shopping_cards.forEach(card => {
              card.selected = false;
            })
          }
          _this.setData({
            can_use_shopping_cards: res.data.can_use_shopping_cards,
            cant_use_shopping_cards: res.data.cant_use_shopping_cards,
          })
        }
        _this.setData({
          total_discount_cut_price: res.data.total_discount_cut_price
        })
        let info = res.data;
        let benefits = info.can_use_benefit;
        let goods_info = info.goods_info;
        let additional_info_goods = [];
        let selectDiscountInfo = info.selected_benefit_info;
        let suppInfoArr = [];
        let additional_goodsid_arr = [];
        let newData = {};
        let goodsBenefitsData = [];
        benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({
          label: 'coupon',
          value: benefits.coupon_benefit
        }) : '';
        benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({
          label: 'vip',
          value: benefits.all_vip_benefit
        }) : '';
        Array.isArray(benefits.integral_benefit) ? '' : benefits.integral_benefit && goodsBenefitsData.push({
          label: 'integral',
          value: [benefits.integral_benefit]
        });
        if (selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3 && _this.data.exchangeCouponData.hasSelectGoods == false) {
          _this.exchangeCouponInit(parseInt(selectDiscountInfo.value));
        }
        goods_info.forEach(item => {
          if (item.delivery_id && item.delivery_id != 0 && additional_goodsid_arr.indexOf(item.goods_id) == -1) {
            suppInfoArr.push(item.delivery_id);
            additional_goodsid_arr.push(item.goods_id);
            additional_info_goods.push(item);
          }
        })
        if (+info.settlement_activity_item_price) {                       // 购买储值或者付费卡的金额
          if (_this.readyCount) {
            info.price = ((+info.price) + (+info.settlement_activity_item_price)).toFixed(2);
          } else {
            info.order_amount_price = ((+info.order_amount_price) + (+info.settlement_activity_item_price)).toFixed(2);
          }
        }
        let price = _this.readyCount ? info.price : info.order_amount_price;
        if (_this.data.payGiftOptions != {} && price == _this.data.payGiftPrice) {
          _this.setData({
            hiddenInvoice: true
          });
        } else {
          _this.setData({
            hiddenInvoice: false
          });
        }
        newData['settlementActivityFreePrice'] = info.settlement_activity_free_bills_item_price;
        newData['pageData.box_fee'] = info.box_fee;
        newData['pageData.server_fee'] = info.server_fee;
        newData['pageData.tissue_fee'] = info.tissue_fee;
        newData['pageData.discountList'] = goodsBenefitsData;
        newData['pageData.selectDiscountInfo'] = selectDiscountInfo;
        newData['pageData.discount_cut_price'] = info.discount_cut_price;
        newData['pageData.total_discount_cut_price'] = info.total_discount_cut_price;
        newData['pageData.balance'] = info.balance;
        newData['pageData.deduction'] = info.use_balance;
        newData['pageData.original_price'] = info.original_price;
        newData['pageData.totalPayment'] = price;
        newData['pageData.additional_goodsid_arr'] = additional_goodsid_arr;
        newData['pageData.orderInfo.price_break_discounts_info.total_discount_price'] = info.price_break_discounts_info && info.price_break_discounts_info.total_discount_price || 0;
        _this.setData(newData);
        app.setPreviewGoodsInfo(additional_info_goods);
        _this.getGoodsDiscountInfoInCart();
        typeof callback == 'function' && callback();
      }
    });
  },
  showMemberDiscount: function () {
    this.selectComponent('#component-memberDiscount').showDialog(this.data.pageData.selectDiscountInfo);
  },
  afterSelectedBenefit: function (event) {
    this.setData({
      'pageData.selectDiscountInfo': event.detail.selectedDiscount,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}
    })
    this.getCalculationInfo();
  },
  useBalanceChange: function (e) {
    this.setData({
      'pageData.useBalance': e.detail.value
    });
    this.getCalculationInfo();
  },
  exchangeCouponInit: function (id) {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: id
      },
      success: function (res) {
        var goods = res.data[0].form_data;
        var goodsModel = [];
        var selectModelInfo = {
          'models': [],
          'price': 0,
          'modelId': '',
          'models_text': '',
          'imgurl': ''
        };
        if (goods.model_items.length) {
          selectModelInfo['price'] = Number(goods.model_items[0].price);
          selectModelInfo['imgurl'] = goods.model_items[0].img_url;
          selectModelInfo['modelId'] = goods.model_items[0].id;
        } else {
          selectModelInfo['price'] = Number(goods.price);
          selectModelInfo['imgurl'] = goods.cover;
        }
        for (var key in goods.model) {
          if (key) {
            goodsModel.push(goods.model[key]); // 转成数组
            selectModelInfo['models'].push(goods.model[key].subModelId[0]);
            selectModelInfo['models_text'] += '“' + goods.model[key].subModelName[0] + '” ';
          }
        }
        goods.model = goodsModel; // 将原来的结构转换成数组
        _this.setData({
          'exchangeCouponData.dialogHidden': false, // 显示模态框
          'exchangeCouponData.goodsInfo': goods,
          'exchangeCouponData.selectModelInfo': selectModelInfo
        });
      },
      successStatusAbnormal: function () {
        app.showModal({
          content: '兑换的商品已下架'
        });
      }
    });
  },
  exchangeCouponHideDialog: function () {
    this.setData({
      'pageData.selectDiscountInfo': {
        title: "不使用优惠",
        name: '无',
        no_use_benefit: 1
      },
      'exchangeCouponData.dialogHidden': true,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}
    })
    this.getCalculationInfo();
  },
  exchangeCouponSelectSubModel: function (e) {
    var dataset = e.target.dataset,
      modelIndex = dataset.modelIndex,
      submodelIndex = dataset.submodelIndex,
      data = {},
      selectModels = this.data.exchangeCouponData.selectModelInfo.models,
      model = this.data.exchangeCouponData.goodsInfo.model,
      text = '';
    selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];
    for (let i = 0; i < selectModels.length; i++) {
      let selectSubModelId = model[i].subModelId;
      for (let j = 0; j < selectSubModelId.length; j++) {
        if (selectModels[i] == selectSubModelId[j]) {
          text += '“' + model[i].subModelName[j] + '” ';
        }
      }
    }
    data['exchangeCouponData.selectModelInfo.models'] = selectModels;
    data['exchangeCouponData.selectModelInfo.models_text'] = text;
    this.setData(data);
    this.exchangeCouponResetSelectCountPrice();
  },
  exchangeCouponResetSelectCountPrice: function () {
    var _this = this,
      selectModelIds = this.data.exchangeCouponData.selectModelInfo.models.join(','),
      modelItems = this.data.exchangeCouponData.goodsInfo.model_items,
      data = {};
    for (var i = modelItems.length - 1; i >= 0; i--) {
      if (modelItems[i].model == selectModelIds) {
        data['exchangeCouponData.selectModelInfo.stock'] = modelItems[i].stock;
        data['exchangeCouponData.selectModelInfo.price'] = modelItems[i].price;
        data['exchangeCouponData.selectModelInfo.modelId'] = modelItems[i].id;
        data['exchangeCouponData.selectModelInfo.imgurl'] = modelItems[i].img_url;
        break;
      }
    }
    this.setData(data);
  },
  exchangeCouponConfirmGoods: function () {
    let _this = this;
    let goodsInfo = _this.data.exchangeCouponData.goodsInfo;
    let model = goodsInfo.model;
    let selectModels = _this.data.exchangeCouponData.selectModelInfo.models;
    let model_value_str = '';
    if (selectModels.length > 0) {
      for (let i = 0; i < selectModels.length; i++) {
        let selectSubModelId = model[i].subModelId;
        for (let j = 0; j < selectSubModelId.length; j++) {
          if (selectModels[i] == selectSubModelId[j]) {
            model_value_str += model[i].subModelName[j] + '； ';
          }
        }
      }
    }
    goodsInfo['model_value_str'] = model_value_str;
    _this.setData({
      'exchangeCouponData.dialogHidden': true,
      'exchangeCouponData.selectModelInfo': {},
      'exchangeCouponData.hasSelectGoods': true,
      'exchangeCouponData.voucher_coupon_goods_info': {
        goods_id: goodsInfo.id,
        num: 1,
        model_id: _this.data.exchangeCouponData.selectModelInfo.modelId
      },
      'exchangeCouponData.goodsInfo': goodsInfo
    });
    _this.getCalculationInfo();
  },
  cancelPayment: function () {
    this.setData({
      'pageData.selectDiscountInfo': {},
      'exchangeCouponData':{},
      changeOrder: false,
      showBenefitInfo: false
    })
    this.getOrderDetail();
  },
  confirmPayment: function (e) {
    let _this = this;
    let form_id = e.detail.formId || '';
    form_id && this.saveFormId(form_id);
    let invoiceInfo = this.data.invoiceInfo;
    delete invoiceInfo['invoice_status'];
    delete invoiceInfo['app_confirm'];
    if (!invoiceInfo || !invoiceInfo['buyer_name']) {
      delete invoiceInfo['liberal_invoice_type'];
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/addCartOrder',
      method: 'post',
      data: {
        dining_order_id: this.data.orderId,
        formId: e.detail.formId,
        sub_shop_app_id: this.franchisee_id,
        selected_benefit: this.data.pageData.selectDiscountInfo,
        is_balance: this.data.pageData.useBalance ? 1 : 0,
        ecommerce_info: {
          'ec_dining_data': {
            'ordering_food_type': 1, // 点餐方式
            'dining_mode': _this.data.pageData.dining_mode, // 就餐方式
            'people_num': _this.data.pageData.people_num, // 就餐人数
            'take_meal_type': _this.data.pageData.take_meal_type, // 取餐类型
            'location_id': _this.data.pageData.location_id, // 座位号码
            'account_type': _this.data.pageData.account_type // 结账方式
          },
        },
        pick_up_type: 4, // 写死 后面改
        dining_order_id: this.data.orderId,
        remark: this.data.pageData.orderInfo.orderRemark,
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
        settlement_activity_info:  this.shopping_cards_info.length > 0 ? '' : this.data.payGiftOptions,
        invoice_info: this.data.invoiceInfo || '', //发票
        use_price_break_discounts_activity_ids: this.data.actIdArr,   // 满减活动id集合
      },
      success: function (res) {
        app.sendUseBehavior([{goodsId: res.data}],5); // 行为轨迹埋点 提交订单  
        let { total_price, settlement_activity_item_price } = res;
        if(+settlement_activity_item_price){                       // 购买储值或者付费卡的金额
          total_price = ((+total_price) + (+settlement_activity_item_price)).toFixed(2);
        }
        _this.setData({
          'pageData.totalPayment': total_price
        })
        if (!_this.data.pageData.allow_app_account) return;
        _this.payOrder(res.data);
      },
      fail: function () {
        _this.requesting = false;
      },
      successStatusAbnormal: function () {
        _this.requesting = false;
      }
    });
  },
  goPayOrder: function (e) {
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    this.payOrder(this.data.orderId);
  },
  payOrder: function (orderId) {
    var _this = this;
    function paySuccess() {
      var pagePath = '/eCommerce/pages/goodsOrderPaySuccess/goodsOrderPaySuccess?detail=' + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : '') + '&is_group=' + !!_this.is_group;
      if (!_this.franchisee_id) {
        app.sendRequest({
          url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
          data: {
            'order_id': orderId,
            sub_app_id: _this.franchisee_id
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
    }
    function payFail() {
      if (_this.is_group) {
        if (_this.data.teamToken) {
          app.turnBack();
          return;
        }
        app.turnToPage('/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      } else {
        if (_this.pickUpType == 4) {
          _this.getOrderDetail();
          _this.setData({
            changeOrder: false,
            showBenefitInfo: false
          })
          return;
        }
        app.turnToPage('/eCommerce/pages/goodsOrderDetail/goodsOrderDetail?detail=' + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      }
    }
    if (this.data.pageData.totalPayment == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: function (res) {
          paySuccess();
        },
        fail: function () {
          payFail();
        },
        successStatusAbnormal: function () {
          payFail();
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
  setClipboardData: function (e) {
    let content = e.currentTarget.dataset.content;
    app.setClipboardData({
      data: content
    });
  },
  callPhone: function (event) {
    let formId = [];
    formId.push(event.detail.formId);
    app.saveUserFormId({ form_id: formId });
    app.callPhone(event);
  },
  showMoreGoods: function () {
    this.setData({
      showMoreGoods: !this.data.showMoreGoods
    })
  },
  getDiningBaseSetting: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getPickUpGoodsTypeSetting',
      data: {
        pick_up_type: 4,
        sub_shop_app_id: that.franchisee_id
      },
      success: function (res) {
        that.setData({
          app_store_data: res.data.app_store_data
        })
      }
    })
  },
  getDiningFuncSetting: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getFuncSetting',
      data: {
        sub_shop_app_id: this.franchisee_id,
        ordering_food_type: 1, //1.堂食 2.预约
        pick_up_type: 4
      },
      success: function (res) {
        that.path = res.data.add_dish_info.page || '',
          that.setData({
            'pageData.allow_add_dish': res.data.add_dish_info.allow_app_status == 1 ? true : false,
            'pageData.allow_app_account': res.data.account_info.account_way[1] ? true : false,
          })
      }
    })
  },
  saveFormId: function (form_id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=api/AppMsgTpl/SaveUserFormId',
      data: {
        form_id: form_id
      },
      method: 'post',
      success: function (res) {
        console.log(res)
      }
    })
  },
  readyCount:false, // 计算需付金额
  showBenefitInfo: function (e) {
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    this.setData({
      isShowSettlementActivity: true
    })
    this.getOrderDetail();
    if (this.data.pageData.ec_dining_data.account_type == 2 && this.data.pageData.orderInfo.status == 17 ) {
      this.getCalculationInfo(this.afterShowBeneft);
      this.readyCount = true;
    }
  },
  afterShowBeneft: function () {
    this.setData({
      'showBenefitInfo': true,
      'changeOrder': true
    })
  },
  goToAdditionalInfo: function () {
    app.setGoodsAdditionalInfo(this.data.pageData.additional_info);
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo?from=diningOrderDetail');
  },
  modifyTime: function (orderInfo) {
    let newData = {};
    newData['pageData.add_time'] = util.formatTimeYMD(orderInfo.add_time, 'YYYY-MM-DD'),
      newData['pageData.payment_time'] = util.formatTimeYMD(orderInfo.payment_time);
    this.data.pageData.diningOrderList.forEach((item, index) => {
      newData['pageData.diningOrderList[' + index + '].add_time'] = util.formatTimeYMD(item.add_time, 'hh:mm:ss');
    })
    this.setData(newData)
  },
  showVipGoodsList: function () {
    this.setData({
      showVipGoodsList: true
    })
  },
  hideVipGoodsList: function () {
    this.setData({
      showVipGoodsList: false
    })
  },
  selectedPayGift: function (e) {
    const { detail } = e;
    let pagGiftData = {};
    if (detail.options) {
      pagGiftData = {
        id: detail.options.id,
        item_id: detail.options.item_id
      }
    }
    this.setData({
      payGiftOptions: pagGiftData,
      payGiftPrice: detail.options.price
    })
    this.getCalculationInfo();
  },
  showPackageInfoFn: function (e) { // 展示商品套餐详情
    let status = e.currentTarget.dataset.status;
    let index = e.currentTarget.dataset.index;
    let subIndex = e.currentTarget.dataset.subIndex;
    let childIndex = e.currentTarget.dataset.childIndex;
    let diningOrderList = this.data.pageData.diningOrderList;
    let newData = {};
    diningOrderList[index].child_form_data[subIndex].goods_list[childIndex].showPackageInfo = status == 1 ? true : false;
    newData['pageData.diningOrderList'] = diningOrderList;
    this.setData(newData);
  },
  goInvoicePage: function () {
    let from = 'orderdetail';
    if (this.data.pageData.account_type == 2){
      from = '';
      this.isRefreshPage = true;
    };
    let pagePath = '/eCommerce/pages/invoice/invoice?from='+ from +'&orderId=' + this.data.orderId + '&franchiseeId=' + this.franchisee_id;
    app.turnToPage(pagePath);
  },
  patchInvoicePage: function () {
    let pagePath = '/eCommerce/pages/invoice/invoice?from=patch&orderId=' + this.data.orderId + '&franchiseeId=' + this.franchisee_id;
    app.turnToPage(pagePath);
  },
  checkInvoiceDetail: function () {
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAuthInfo',
      data: {
        order_id: this.data.orderId
      },
      success: function (res) {
        app.navigateToXcx({
          appId: res.data.appid,
          path: res.data.auth_url
        })
      }
    })
  },
  getAppInvoiceStatus: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAppInvoiceStatus',
      data: {
        sub_shop_app_id: this.franchisee_id
      },
      success: function (res) {
        _this.setData({
          isOpenInvoice: res.data.is_invoice == 1 ? true : false
        })
      }
    })
  },
  closeCardDialog: function () {
    this.setData({
      cardDialog: false,
    })
  },
  openCardDialog: function () {
    this.setData({
      cardDialog: true,
    })
  },
  nonuseCard: function () {
    let card = this.data.can_use_shopping_cards;
    card.forEach(shoppingcard => {
      shoppingcard.selected = false
    })
    this.data.selectCardList = [];
    this.shopping_cards_info = [];
    this.getCalculationInfo();
    this.setData({
      cardDialog: false,
      can_use_shopping_cards: card,
      selectCardList: this.data.selectCardList,
    })
  },
  confirmCard: function () {
    this.setData({
      cardDialog: false,
    })
  },
  selsctUseful: function () {
    this.setData({
      uselessCard: false,
    })
  },
  selectUseless: function () {
    this.setData({
      uselessCard: true,
    })
  },
  selectThisOne: function (e) {
    let {
      id,
      index
    } = e.currentTarget.dataset;
    let card = this.data.can_use_shopping_cards;
    if (card[index].selected == false) {
      card[index].selected = true;
      this.data.selectCardList.push(card[index]);
      this.shopping_cards_info.push(id);
      this.getCalculationInfo();
    } else {
      card[index].selected = false;
      let sel_index = this.data.selectCardList.indexOf(card[index]);
      this.data.selectCardList.splice(sel_index, 1);
      let id_index = this.shopping_cards_info.indexOf(id);
      console.log(id_index, 111)
      this.shopping_cards_info.splice(id_index, 1);
      console.log(this.shopping_cards_info, 222)
      this.getCalculationInfo();
    }
    this.setData({
      selectCardList: this.data.selectCardList,
      can_use_shopping_cards: card,
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
  triggerPriceBreakModal() {
    this.setData({
      priceBreakDisModal: !this.data.priceBreakDisModal
    })
  },
  getGoodsDiscountInfoInCart: function() {
    let priceBreakDiscountData = app.globalData.priceBreakDiscountData; 
    let newData = {};
    let goodsList = this.data.pageData.orderInfo.goods_info;
    let actIdArr = this.data.actIdArr;
    let newCartList = {
      0 : {
        rule: [],
        goodsList: [],
        totalPrice: 0,
        cutPrice: 0,
        price: 0,
        title: '',
      }
    };
    priceBreakDiscountData.forEach(item => {
      newCartList[item.id] = {};
      newCartList[item.id]['rule'] = item.ladder.length ? item.ladder : [item.cycle];
      newCartList[item.id]['goodsList'] = [];
      newCartList[item.id]['totalPrice'] = 0;
      newCartList[item.id]['cutPrice'] = 0;
      newCartList[item.id]['price'] = 0;
      newCartList[item.id]['title'] = '';
      newCartList[item.id]['checked'] = actIdArr.some(actid=> item.id == actid);
      if (item.ladder.length) {
        newCartList[item.id]['rule'] = item.ladder;
        newCartList[item.id]['title'] = `满${item.ladder[0].least_amount}`;
        if (item.ladder[0].reduce_amount) {
          newCartList[item.id]['title'] += `可减${item.ladder[0].reduce_amount}`;
        }else {
          newCartList[item.id]['title'] += `可打${item.ladder[0].reduce_discount}折`;
        }
      }else {
        newCartList[item.id]['title'] = `每满${item.cycle.least_amount}减${item.cycle.reduce_amount}`;
        newCartList[item.id]['rule'] = [item.cycle];
      }
    })
    goodsList.forEach(goods=> {
      if (goods.num > 0) {
        if (newCartList[goods.price_break_discounts_activity_id]) {
          newCartList[
            goods.price_break_discounts_activity_id
          ]['totalPrice'] += (goods.price * goods.num);
          newCartList[
            goods.price_break_discounts_activity_id
          ]['goodsList'].push(goods);
        }else {
          newCartList[0]['totalPrice'] += (goods.price * goods.num);
          newCartList[0]['goodsList'].push(goods);
        }
      }
    })
    let totalCutPrice = 0;
    let totalPrice = 0;
    for (let key in newCartList) {
      if (key > 0 && newCartList[key]['goodsList'].length) {
        let rule = newCartList[key].rule.filter(item => {
          return newCartList[key]['totalPrice'] >= item.least_amount;
        })
        if (rule.length) {
          rule = rule[rule.length - 1];
          priceBreakDiscountData.forEach(data=> {
            if (data.id == key) {
              if (data.ladder.length) { // 判断门槛类型 ladder 阶梯，cycle 循环
                if (rule.reduce_amount) {
                  newCartList[key]['cutPrice'] = rule.reduce_amount;
                  newCartList[key]['title'] = `已满${rule.least_amount}减${rule.reduce_amount}`;
                }else {
                  newCartList[key]['cutPrice'] = newCartList[key]['totalPrice'] * (1 - rule.reduce_discount / 10);
                  newCartList[key]['title'] = `已满${rule.least_amount}打${rule.reduce_discount}折`;
                }
                data.ladder.forEach((item, index)=> {
                    if (item.least_amount == rule.least_amount && index < data.ladder.length - 1) {
                      if (data.ladder[index + 1].reduce_amount) {
                        newCartList[key]['title'] += `，满${data.ladder[index + 1].least_amount}可减${data.ladder[index + 1].reduce_amount}`;
                      }else {
                        newCartList[key]['title'] += `，满${data.ladder[index + 1].least_amount}可打${data.ladder[index + 1].reduce_discount}折`;
                      }
                    }
                  })
              }else {
                newCartList[key]['cutPrice'] = rule.reduce_amount * Math.floor(newCartList[key]['totalPrice'] / rule.least_amount);
                newCartList[key]['title'] = `每满${rule.least_amount}减${rule.reduce_amount}，已减${newCartList[key]['cutPrice']}`;
              }
            }
          })
        }
      }
      newCartList[key]['checked'] = actIdArr.some(actid=> actid == key);
      if (actIdArr.some(id => id == key)) {
        totalPrice += newCartList[key].totalPrice;
        totalCutPrice += newCartList[key].cutPrice;
      }
    }
    newData['TotalPrice'] = (totalPrice - totalCutPrice).toFixed(2);
    newData['totalCutPrice'] = totalCutPrice.toFixed(2);
    newData['newCartList'] = newCartList;
    this.setData(newData)
  },
  selectPriceBreak(event) {
    let { checked, id } = event.currentTarget.dataset;
    let actIdArr = this.data.actIdArr;
    let newData = {};
    if (checked) {
      let index = actIdArr.findIndex(item=> item == id);
      actIdArr.splice(index,1);
    }else {
      actIdArr.push(id);
    }
    newData[`actIdArr`] = actIdArr
    newData[`newCartList.${id}.checked`] = !checked;
    this.setData(newData);    
    this.getCalculationInfo();
  },
})
