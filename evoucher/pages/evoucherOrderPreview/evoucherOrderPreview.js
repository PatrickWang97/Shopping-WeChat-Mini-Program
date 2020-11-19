const app = getApp();
const util = require('../../../utils/util.js');
const customEvent = require('../../../utils/custom_event.js');
Page({
  data: {
    shopping_cards_deduct_all: false,   // 购物卡是否可以抵扣全部的金额
    cardDialog: false, //购物卡选择框
    uselessCard: false, // 不可用购物卡
    selected: false, // 购物卡被选中
    can_use_shopping_cards: [], // 购物卡可用列表
    cant_use_shopping_cards: [], // 不可用购物卡列表
    selectCardList: [], //选择的购物卡列表
    cardtype: '', // 购物卡 或 礼品卡是 1 下单
    user_gift_card_info: {},   //礼品卡信息
    goodsList: [],
    discountList: [],
    selectDiscountInfo: {},
    orderRemark: '',
    balance: '',
    useBalance: true,
    deduction: '',
    discount_cut_price: '',
    original_price: '',
    totalPayment: '',
    storeConfig: '',
    noAdditionalInfo: true,
    is_group: '',
    limit_buy: '',
    teamToken: '',
    exchangeCouponData: {
      dialogHidden: true,
      goodsInfo: {},
      selectModelInfo: {},
      hasSelectGoods: false,
      voucher_coupon_goods_info: {}
    },
    cashOnDelivery: false,
    hasRequiredSuppInfo: false,
    additional_info: {},
    leagueBenefitData: {
      benefitList: [],                 // 联盟优惠
      selectedBenefitInfo: {},         // 选中的联盟优惠
      benefitPrice: 0,                 // 联盟优惠价格
    },
    payGiftOptions: {},                // 支付有礼计算金额参数
    settlementActivityFreePrice: '',   // 参与结算活动的金额
    payGiftPrice: '',                  // 支付有礼价格
    hiddenInvoice: false,              // 隐藏开票口
    behavior: {},       // 行为轨迹 数据
    isShowContactDialog: false, // 是否显示选择联系人弹窗
    evoucherContactsData: {     // 联系人列表相关信息
      loadingData: {
        isLoading: false,
        isMore: 1,
        currentPage: 1
      },
      list: [],
    },
    evoucherContactSelected: {} // 选中的联系人
  },
  shopping_cards_info: [], // 可用购物卡id
  user_gift_card_id: '', //  使用礼品卡id
  is_reload: true,
  timerId: 0,
  isFromSelectAddress: false,
  franchisee_id: '',
  cart_id_arr: [],
  cart_id_arr_my: [],
  cart_data_arr: [],
  requesting: false,
  is_group: '',
  inputTimer: '',
  mulShopsParams: [], // 多店请求的参数
  payTotalPrice: 0, // 微信支付的价格
  changeShopAppId: '',  // 多店结算更改数据店铺id
  mulShopsHasVoucher: false,  // 多店结算优惠券中是否有兑换券
  onLoad: function (options) {
    this.user_gift_card_id = options.cardid || '';
    this.franchisee_id = options.franchisee || '';
    this.isFranchiseeCoupon = this.isFranchisee ? true : this.franchisee_id ? true : !this.isFranchisee && !this.franchisee_id && (app.globalData.hasFranchiseeList || app.globalData.hasFranchiseeChain) ? true : false;     // 子店 总店 多店结算均可使用联盟优惠券
    let is_together = options.is_together === 'true' ? true : false;
    let teamToken = options.team_token || '';
    let group_buy_people = options.group_buy_people || 0;
    let limit_buy = options.limit_buy || '';
    let is_from = options.is_from || '';
    this.cart_id_arr = options.cart_arr ? decodeURIComponent(options.cart_arr).split(',') : [];
    this.is_group = options.is_group || '';
    this.evoucherBuyInfo = options.cart_goods_arr ? JSON.parse(decodeURIComponent(options.cart_goods_arr)) : {};
    this.setData({
      cardtype: options.cardtype || '',   //礼品卡下单 
      franchisee_id: options.franchisee || '',
      is_together: is_together,
      limit_buy: limit_buy,
      is_group: this.is_group,
      teamToken: teamToken,
      group_buy_people: group_buy_people,
      phone: app.getUserInfo().phone,
      evoucherBuyInfo: this.evoucherBuyInfo
    });
    this.dataInitial();
  },
  dataInitial: function () {
    if (this.data.cardtype == 1) {
      this.useGiftList();
      return
    }
    this.getAppInvoiceStatus();
    this.getAppECStoreConfig();
    this.getCalculationInfo();
  },
  onShow: function () {
    this.setData({
      evoucherContactsData: {
        loadingData: {
          isLoading: false,
          isMore: 1,
          currentPage: 1
        },
        list: []
      }
    });
    this.getEvoucherContactsList();
  },
  onHide: function () {
    clearTimeout(this.timerId);
  },
  onUnload: function () {
    clearTimeout(this.timerId);
  },
  useGiftList() {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appGiftCard/Calculate',
      data: {
        user_gift_card_id: this.user_gift_card_id || '',
      },
      success: function (res) {
        res.data.goods_info.forEach(good => {
          _this.cart_id_arr.push(good.id)
        })
        _this.setData({
          goodsList: res.data.goods_info,
          user_gift_card_info: res.data.user_gift_card_info
        })
        _this.getAppECStoreConfig();
      },
      successStatusAbnormal: function (re) {
        if (re.data == '礼品卡不可用') {
          app.showModal({
            content: re.data,
            confirmText: '知道了',
            confirm: function (backdata) {
              app.turnBack();
            }
          })
          return false;
        }
      }
    })
  },
  getCalculationInfo: function (callback) {
    var _this = this;
    let ecommerce_info = {};
    let params = {
      shopping_cards_info: this.shopping_cards_info || '',   // 使用购物卡下单
      ecommerce_info: ecommerce_info,
      sub_shop_app_id: this.franchisee_id || (this.isFranchisee ? app.getAppId() : ''),
      address_id:  '',
      cart_id_arr: this.cart_id_arr,
      is_balance: this.data.useBalance ? 1 : 0,
      pick_up_type: 6,
      selected_benefit: this.data.selectDiscountInfo,
      voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
      settlement_activity_info: this.data.cashOnDelivery || this.shopping_cards_info.length > 0 ? '' : this.data.payGiftOptions,   // 货到付款和堂食先付后吃不使用支付结算活动
      is_pay_on_delivery: this.data.cashOnDelivery,
      user_gift_card_id: this.user_gift_card_id || '',
      cart_goods_arr: []
    };
    if (this.isFranchiseeCoupon) {
      params.superimposed = 1;
      params['extra_selected_benefit'] = this.data.leagueBenefitData.selectedBenefitInfo;
    }
    params['cart_goods_arr'][0] = {
      goods_id: _this.evoucherBuyInfo['goods_id'],
      model_id: _this.evoucherBuyInfo['model_id'],
      num: _this.evoucherBuyInfo['num']
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/calculationPrice',
      data: params,
      method: 'post',
      success: function (res) {
        if ((_this.data.can_use_shopping_cards.length > 0 || _this.data.cant_use_shopping_cards.length > 0)) {
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
          shopping_cards_deduct_all: res.data.shopping_cards_deduct_all    // 判断购物卡是否全部抵扣，如果全部抵扣则不能继续选
        })
        let info = res.data;
        let benefits = info.can_use_benefit;
        let goods_info = info.goods_info;
        let additional_info_goods = [];
        let selectDiscountInfo = info.selected_benefit_info;
        let suppInfoArr = [];
        let additional_goodsid_arr = [];
        _this.data.goodsList.forEach(goods => {
          goods.can_use_this_coupon = true;
        })
        if (selectDiscountInfo.only_included_goods != null) {
          _this.data.goodsList.forEach(res => {
            res.can_use_this_coupon = false;
          })
          selectDiscountInfo.only_included_goods.forEach(goods => {
            _this.data.goodsList.forEach((res, index) => {
              if (res.goods_id == goods) {
                _this.data.goodsList[index].can_use_this_coupon = true
              }
            })
          })
        }
        _this.setData({
          goodsList: _this.data.goodsList
        })
        let goodsBenefitsData = [];
        benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({ label: 'coupon', value: benefits.coupon_benefit }) : '';
        benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({ label: 'vip', value: benefits.all_vip_benefit }) : '';
        Array.isArray(benefits.integral_benefit) ? '' : benefits.integral_benefit && goodsBenefitsData.push({ label: 'integral', value: [benefits.integral_benefit] });
        if (selectDiscountInfo.type != 3) {
          _this.setData({
            'exchangeCouponData.hasSelectGoods': false,
          });
        }
        if (selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3 && _this.data.exchangeCouponData.hasSelectGoods == false) {
          _this.exchangeCouponInit(parseInt(selectDiscountInfo.value));
        }
        let goods_num = 0; // 计算商品数量
        for (var i = 0; i <= goods_info.length - 1; i++) {
          goods_num += Number(goods_info[i].num || 0);
        if (goods_info[i].delivery_id && goods_info[i].delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info[i].id) == -1) {
            suppInfoArr.push(goods_info[i].delivery_id);
            additional_goodsid_arr.push(goods_info[i].id);
            additional_info_goods.push(goods_info[i]);
          }
        }
        let goodsModel = goods_info[0].model_value;
        goods_info[0]['model_value_str'] = goodsModel && goodsModel.join ? goodsModel.join('； ') : '';
        goods_info[0]['valid_date_str'] = _this.returnValidDate(goods_info[0]);
        goods_info[0]['min_sales_nums'] = goods_info[0]['min_sales_nums'] > 0 ? goods_info[0]['min_sales_nums'] : 1;
        if (suppInfoArr.length && !_this.data.deliverydWrite) {
          _this.getSuppInfo(suppInfoArr);
        }
        let vip_goods_list = [];
        let vip_cart_info = {};
        let is_vip_goods = 0; // 是否是会员价 堂食结构会变，单独处理
        is_vip_goods = info.goods_info[0].is_vip_goods;
        if (+info.settlement_activity_item_price) {
          info.price = ((+info.price) + (+info.settlement_activity_item_price)).toFixed(2);
        }
        if (_this.data.payGiftOptions != {} && info.price == _this.data.payGiftPrice) {
          _this.setData({
            hiddenInvoice: true
          });
        } else {
          _this.setData({
            hiddenInvoice: false
          });
        }
        let leagueBenefitsData = [];
        let leagueBenefits = info.extra_can_use_benefit;
        leagueBenefits.coupon_benefit && leagueBenefits.coupon_benefit.length ? leagueBenefitsData.push({ label: 'coupon', value: leagueBenefits.coupon_benefit }) : '';
        _this.setData({
          goods_num: goods_num,
          settlementActivityFreePrice: info.settlement_activity_free_bills_item_price,
          discountList: goodsBenefitsData,
          selectDiscountInfo: selectDiscountInfo,
          discount_cut_price: info.discount_cut_price,
          is_vip_goods: is_vip_goods,
          balance: info.balance,
          deduction: info.use_balance,
          original_price: info.original_price,
          totalPayment: info.price,
          total_original_price: info.total_original_price,
          canCashDelivery: info.is_pay_on_delivery,  //快递货到付款
          cashOnDelivery: info.price > 0 ? (info.priority_pay_on_delivery == 1 ? true : false) : false,
          additional_goodsid_arr: additional_goodsid_arr,
          vip_goods_list: vip_goods_list,
          vip_cart_info: vip_cart_info,
          total_discount_cut_price: info.total_discount_cut_price,
          'leagueBenefitData.benefitList': leagueBenefitsData,
          'leagueBenefitData.selectedBenefitInfo': info.extra_selected_benefit,
          'leagueBenefitData.benefitPrice': info.extra_selected_benefit.discount_cut_price || 0,
          evoucherContactSelected: info.contact || _this.data.evoucherContactSelected || {},  // 电子卡券联系人
          goodsList: goods_info                    // 电子卡券商品
        })
        app.setPreviewGoodsInfo(additional_info_goods);
      }
    });
  },
  shopIntegralRuleMap: {},
  userCanUseIntegral: null,
  userShopIntegralPathArr: [],
  rightShopsUserIntegral: function () {
    let newData = {};
    this.userShopIntegralPathArr.forEach((path) => {
      newData[path] = this.userCanUseIntegral;
    });
    this.setData(newData);
  },
  reSeparateIntegral: function (callback) {
    if (this.userCanUseIntegral === 0) {
      Object.keys(this.shopIntegralRuleMap)
        .filter((appId) => !this.shopIntegralRuleMap[appId]['is_use'])
        .forEach((appId) => {
          let shop = this.shopIntegralRuleMap[appId];
          if (shop.can_use_integral > 0) {
            shop.can_use_integral = 0;
          }
        });
      callback();
      return;
    }
    Object.keys(this.shopIntegralRuleMap)
      .filter((appId) => this.shopIntegralRuleMap[appId]['is_use'])
      .every((appId) => {
        let shop = this.shopIntegralRuleMap[appId];
        let maxNeedIntegral = Math.max(Number(shop.original_price) * 100, shop.can_use_integral);
        let delt = maxNeedIntegral - shop.can_use_integral;
        let addVal = this.userCanUseIntegral - delt > 0 ? delt : this.userCanUseIntegral;
        if (delt > 0) {
          shop.can_use_integral -= 0;
          shop.can_use_integral += addVal;
          this.userCanUseIntegral -= addVal;
        }
        return !!this.userCanUseIntegral;
      });
    Object.keys(this.shopIntegralRuleMap)
      .filter((appId) => !this.shopIntegralRuleMap[appId]['is_use'])
      .forEach((appId) => {
        let shop = this.shopIntegralRuleMap[appId];
        let maxNeedIntegral = Math.max(Number(shop.original_price) * 100, shop.can_use_integral);
        shop.can_use_integral = maxNeedIntegral > this.userCanUseIntegral ? this.userCanUseIntegral : maxNeedIntegral;
      });
    callback();
  },
  getShopCanUseIntegral: function (appId) {
    let shop = this.shopIntegralRuleMap[appId] || {};
    return shop && shop.can_use_integral;
  },
  getMaxIntegralPrice: function (goods) {
    return goods.reduce((p, g) => {
      if (g.integral == 1 && g.integral_config) {
        p += g.price * g.num;
      }
      return p;
    }, 0);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeConfig: res,
        storeStyle: res.color_config,
        previewOrderType: res.calculation_detail.detail_type  //结算页样式类型
      })
    }, this.franchisee_id);
  },
  remarkInput: function (e) {
    let setDataObj = {};
    setDataObj['orderRemark'] = e.detail.value;
    this.setData(setDataObj);
  },
  previewImage: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src
    });
  },
  clickMinusButton: function () {
    let { evoucherBuyInfo } = this.data;
    if (+evoucherBuyInfo.num <= 0) return;
    this.changeGoodsNum('minus');
  },
  clickPlusButton: function () {
    let { evoucherBuyInfo, limit_buy: limitBuy } = this.data;
    if (limitBuy !== '' && +evoucherBuyInfo.num >= limitBuy) return;
    this.changeGoodsNum('plus');
  },
  inputGoodsCount: function (e) {
    let that = this;
    let value = +e.detail.value;
    let goodsInfo = this.data.goodsList[0];
    if (isNaN(value) || value <= 0) {
      return;
    }
    if (value < goodsInfo.min_sales_nums) {
      app.showModal({
        content: '不得少于起卖数',
        confirm: function () {
          that.changeGoodsNum(goodsInfo.min_sales_nums);
        }
      })
      return;
    }
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      this.changeGoodsNum(value);
    }, 500);
  },
  blurGoodsCount: function (e) {
    let value = +e.detail.value;
    let goodsInfo = this.data.goodsList[0];
    if (isNaN(value) || value <= 0) {
      this.setData({
        'evoucherBuyInfo.num': goodsInfo.min_sales_nums || 1
      });
    }
  },
  changeGoodsNum: function (type) {
    let that = this,
      goodsInfo = this.data.goodsList[0],
      currentNum = +this.data.evoucherBuyInfo.num,
      stock = this.data.evoucherBuyInfo.stock,
      targetNum = type == 'plus' ? currentNum + 1 : (type == 'minus' ? currentNum - 1 : Number(type));
    if (targetNum < goodsInfo.min_sales_nums) {
      app.showModal({
        content: '不得少于起卖数',
        confirm: function () {
          that.setData({
            'evoucherBuyInfo.num': goodsInfo.min_sales_nums
          });
        }
      })
      return;
    }
    if (targetNum > stock) {
      app.showModal({
        content: '购买数量不能大于库存',
        confirm: function () { 
          that.setData({
            'evoucherBuyInfo.num': stock
          });
        }
      });
      return;
    }
    this.setData({
      'selectDiscountInfo': '',
      'evoucherBuyInfo.num': targetNum
    });
    that.getCalculationInfo();
  },
  confirmPayment: function (e) {
    let _this = this;
    let {
      selectDiscountInfo,
      deliverydWrite, aloneDeliveryShow, hasRequiredSuppInfo,
      additional_info, additional_goodsid_arr, cardtype,
      leagueBenefitData, exchangeCouponData, cashOnDelivery, payGiftOptions,
      hiddenInvoice, invoiceInfo, orderRemark, useBalance, evoucherContactSelected
    } = this.data;
    if (hasRequiredSuppInfo && !deliverydWrite && !aloneDeliveryShow) {
      app.showModal({
        content: '商品补充信息未填写，无法进行支付',
        confirmText: '去填写',
        confirm: function () {
          _this.goToAdditionalInfo();
        }
      })
      return;
    }
    if (aloneDeliveryShow) {
      let a = additional_info;
      let id = additional_goodsid_arr[0];
      if (a[id][0].is_required == 0 && a[id][0].value == '') {
        app.showModal({
          content: '请填写' + a[id][0].title,
          confirmText: '确认'
        });
        return;
      }
    }
    if (!evoucherContactSelected.name) {
      app.showModal({
        content: '请填写联系人姓名',
        confirmText: '确认'
      });
      return;
    }
    if (!evoucherContactSelected.phone) {
      app.showModal({
        content: '请填写联系人手机号',
        confirmText: '确认'
      });
      return;
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/addCartOrder',
      method: 'post',
      data: {
        shopping_cards_info: this.shopping_cards_info || '',   // 使用购物卡下单
        user_gift_card_id: this.user_gift_card_id || '',  // 使用礼品卡下单
        cart_id_arr: this.cart_id_arr,
        formId: e.detail.formId,
        sub_shop_app_id: this.franchisee_id,
        selected_benefit: selectDiscountInfo,
        is_balance: useBalance ? 1 : 0,
        extra_selected_benefit: {
          title: "不使用优惠",
          name: '无',
          no_use_benefit: 1
        },
        superimposed: this.isFranchiseeCoupon ? 1 : 0,
        is_multi: this.isFranchiseeCoupon ? 1 : 0,
        ecommerce_info: {},
        pick_up_type: 6,
        self_delivery_app_store_id: '',
        remark: orderRemark,
        address_id: '',
        additional_info: additional_info,
        voucher_coupon_goods_info: exchangeCouponData.voucher_coupon_goods_info,
        is_pay_on_delivery: cashOnDelivery ? 1 : 0,
        settlement_activity_info: cashOnDelivery || (this.shopping_cards_info.length > 0 ? '' : payGiftOptions),   // 货到付款和堂食先付后吃不使用支付结算活动
        invoice_info: hiddenInvoice ? '' : (invoiceInfo || ''), //发票
        cart_goods_arr: [{  // 电子卡券信息
          goods_id: this.evoucherBuyInfo.goods_id,
          model_id: this.evoucherBuyInfo.model_id,
          num: this.evoucherBuyInfo.num
        }],
        contact_id: evoucherContactSelected.id || '', // 电子卡券联系人ID
        contact: {
          name: evoucherContactSelected.name,         // 电子卡券联系人名称
          phone: evoucherContactSelected.phone        // 电子卡券联系人电话
        }
      },
      success: function (res) {
        app.sendUseBehavior([{ goodsId: res.data }], 5); // 提交订单
        lateFunc();
        function lateFunc() {
          let { total_price, settlement_activity_item_price } = res;
          if (+settlement_activity_item_price) {                       // 购买储值或者付费卡的金额
            total_price = ((+total_price) + (+settlement_activity_item_price)).toFixed(2);
          }
          _this.setData({
            totalPayment: total_price
          })
          if (cashOnDelivery) {
            let pagePath = '/eCommerce/pages/goodsOrderPaySuccess/goodsOrderPaySuccess?detail=' + res.data + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : '');
            app.turnToPage(pagePath, 1);
          } else {
            _this.payOrder(res.data);
          }
        }
      },
      fail: function () {
        _this.requesting = false;
      },
      successStatusAbnormal: function (re) {
        _this.requesting = false;
        if (re.turn_back == 1) {
          app.showModal({
            content: '当前正在结算，请勿重复操作',
            confirm: function () {
              app.turnBack();
            }
          })
          return;
        }
      }
    });
    this.saveFormId(e.detail.formId);
  },
  saveFormId: function (form_id) {
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=api/AppMsgTpl/SaveUserFormId',
      data: {
        form_id: form_id
      },
      method: 'post',
      success: function (res) { }
    })
  },
  payOrder: function (orderId) {
    var _this = this;
    function paySuccess() {
      let goodsArr = [];
      for (let item of _this.data.goodsList) {
        goodsArr.push({
          goodsId: item.goods_id,
          num: item.num
        });
      }
      app.sendUseBehavior(goodsArr, 1);  //用户行为轨迹购买
      app.sendUseBehavior(goodsArr, 11); //黑沙转发 购物
      app.sendUseBehavior(goodsArr, 4, 2); //取消加购
      let router = 'goodsOrderPaySuccess/goodsOrderPaySuccess?detail=';
      var pagePath = '/eCommerce/pages/' + router + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : '') + '&is_group=' + !!_this.is_group;
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
      let router = 'evoucherOrderDetail/evoucherOrderDetail?detail=';
      if (_this.is_group) {
        if (_this.data.teamToken) {
          app.turnBack();
          return;
        }
        app.turnToPage('/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      } else {
        app.turnToPage('/evoucher/pages/' + router + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      }
    }
    let totalPayMoney = _this.data.totalPayment;
    if (totalPayMoney == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        method: 'post',
        data: {
          order_id: orderId,
          total_price: 0,
          data: '',
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
    let params = {};
    params['order_id'] = orderId;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      method: 'post',
      data: params,
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
  useBalanceChange: function (e) {
    let setDataObj = {};
    setDataObj['useBalance'] = e.detail.value;
    setDataObj['invoiceInfo'] = '';
    this.setData(setDataObj);
    this.getCalculationInfo();
  },
  useCashDelivery: function () {
    let setDataObj = {};
    setDataObj['cashOnDelivery'] = e.detail.value;
    setDataObj['invoiceInfo'] = '';
    this.setData(setDataObj);
  },
  goToAdditionalInfo: function (e) {
    let additionalInfo = this.data.additional_info;
    app.setGoodsAdditionalInfo(additionalInfo);
    app.turnToPage(`/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo`);
  },
  exchangeCouponInit: function (id) {
    let _this = this;
    let { franchisee_id: franchiseeId } = this.data;
    let params = {};
    params['data_id'] = id;
    if (franchiseeId) {
      params['app_id'] = franchiseeId;
    }
    _this.getGoodsById(params).then((data) => {
      if (data['hasData']) {  // 接口有数据返回
        _this.setData({
          'exchangeCouponData.dialogHidden': false,
          'exchangeCouponData.goodsInfo': data['goodsData'],
          'exchangeCouponData.selectModelInfo': data['selectModelInfo'],
        });
      } else {
        app.showModal({
          content: '兑换的商品已下架'
        });
      }
    }, (data) => {  // 报错了
      console.error(data);
    });
  },
  getGoodsById: function (params) {
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppShop/getGoods',
        data: params,
        success: function (res) {
          let goods = res.data[0].form_data || {};
          let goodsModelArr = [];
          let selectModelInfo = {
            'models': [],       // 选中的规格，默认选第一个
            'price': 0,         // 该规格的价格
            'virtual_price': 0, // 改规格的虚拟价格
            'modelId': '',      // 该规格的id
            'models_text': '',  // 该规格的文字拼接
            'imgurl': ''        // 该规格商品图
          };
          if (goods['model_items'] && goods['model_items'].length) {  // 有规格默认选中第一个规格
            selectModelInfo['price'] = Number(goods.model_items[0]['price']).toFixed(2);
            selectModelInfo['virtual_price'] = Number(goods.model_items[0]['virtual_price']).toFixed(2);
            selectModelInfo['imgurl'] = goods.model_items[0]['img_url'];
            selectModelInfo['modelId'] = goods.model_items[0]['id'];
          } else {  // 没有规格默认显示商品价格和商品主图
            selectModelInfo['price'] = Number(goods['price']).toFixed(2);
            selectModelInfo['virtual_price'] = Number(goods['virtual_price']).toFixed(2);
            selectModelInfo['imgurl'] = goods['cover'];
          }
          for (var key in goods.model) {
            if (key) {
              goodsModelArr.push(goods.model[key]);
              selectModelInfo['models'].push(goods.model[key].subModelId[0]);
              selectModelInfo['models_text'] += '“' + goods.model[key].subModelName[0] + '” ';
            }
          }
          let goodsFiled = {
            id: goods['id'],
            title: goods['title'],
            cover: goods['cover'],
            price: goods['price'],
            virtual_price: goods['virtual_price'],
            model_items: goods['model_items'],
            model: goodsModelArr,
          };
          resolve({ hasData: true, goodsData: goodsFiled, selectModelInfo: selectModelInfo });
        },
        successStatusAbnormal: function () {
          resolve({ hasData: false });
        },
        fail: function (res) {
          reject(res.data);
        }
      });
    });
  },
  exchangeCouponHideDialog: function () {
    let setDataObj = {};
    setDataObj[`selectDiscountInfo`] = {
      title: "不使用优惠",
      name: '无',
      no_use_benefit: 1
    };
    setDataObj[`exchangeCouponData.dialogHidden`] = true;
    setDataObj[`exchangeCouponData.hasSelectGoods`] = false;
    setDataObj[`exchangeCouponData.voucher_coupon_goods_info`] = {};
    this.setData(setDataObj);
    this.getCalculationInfo();
  },
  exchangeCouponSelectSubModel: function (e) {
    let dataObj = this.data;
    var dataset = e.target.dataset,
      modelIndex = dataset.modelIndex,
      submodelIndex = dataset.submodelIndex,
      data = {},
      selectModels = dataObj.exchangeCouponData.selectModelInfo.models,
      model = dataObj.exchangeCouponData.goodsInfo.model,
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
    let dataObj = this.data;
    var _this = this,
      selectModelIds = dataObj.exchangeCouponData.selectModelInfo.models.join(','),
      modelItems = dataObj.exchangeCouponData.goodsInfo.model_items,
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
    let dataObj = this.data;
    let goodsInfo = dataObj.exchangeCouponData.goodsInfo;
    let model = goodsInfo.model;
    let selectModels = dataObj.exchangeCouponData.selectModelInfo.models;
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
        model_id: dataObj.exchangeCouponData.selectModelInfo.modelId
      },
      'exchangeCouponData.goodsInfo': goodsInfo
    });
    _this.getCalculationInfo();
  },
  showMemberDiscount: function (e) {
    let seletedDiscountInfo = {};
    let { isLeague } = e.currentTarget.dataset;
    if (this.isFranchiseeCoupon && isLeague) { // 多店/子店/总店
      let {leagueBenefitData } = this.data;
      seletedDiscountInfo = leagueBenefitData.selectedBenefitInfo;
      this.setData({
        isLeagueBenefit: isLeague || '',
      });
    } else {
      this.setData({
        isLeagueBenefit: 0
      })
      seletedDiscountInfo = this.data.selectDiscountInfo;
    }
    this.selectComponent('#component-memberDiscount').showDialog(seletedDiscountInfo);
  },
  afterSelectedBenefit: function (event) {
    let { isLeagueBenefit } = this.data;
    if (this.isFranchiseeCoupon && isLeagueBenefit) { // 总店 子店 多店结算均可使用联盟券
      if (isLeagueBenefit) { // 联盟优惠
        this.setData({
          'leagueBenefitData.selectedBenefitInfo': event.detail.selectedDiscount,
        });
      }
    } else { // 单店
      this.setData({
        'selectDiscountInfo': event.detail.selectedDiscount,
        'exchangeCouponData.hasSelectGoods': false,
        'exchangeCouponData.voucher_coupon_goods_info': {}
      });
    }
    this.getCalculationInfo();
  },
  getSuppInfo: function (suppInfoArr) {
    var _this = this;
    let deliveryArr = [];
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=pc/AppShop/GetDelivery',
      method: 'post',
      data: {
        delivery_ids: suppInfoArr,
        delivery_arr: deliveryArr
      },
      success: function (res) {
        for (let i = 0; i < res.data.length; i++) {
          let suppInfo = res.data[i].delivery_info;
          for (let j = 0; j < suppInfo.length; j++) {
            if (suppInfo[j].is_required == 0 && suppInfo[j].is_hidden == 1) {
              _this.setData({
                hasRequiredSuppInfo: true
              })
            }
            if (suppInfo[j].is_hidden == 1) {
              _this.setData({
                noAdditionalInfo: false
              })
            }
          }
        }
        if (res.data.length == 1 && _this.data.additional_goodsid_arr.length == 1) {
          let deliveryIndex = 0;
          let showIndex = 0;
          for (let i = 0; i < res.data[0].delivery_info.length; i++) {
            if (res.data[0].delivery_info[i].is_hidden == 1) {
              deliveryIndex++;
              showIndex = i;
            }
          }
          if (deliveryIndex == 1) {
            let data = {};
            data[_this.data.additional_goodsid_arr[0]] = [];
            data[_this.data.additional_goodsid_arr[0]].push({
              title: res.data[0].delivery_info[showIndex].name,
              type: res.data[0].delivery_info[showIndex].type,
              is_required: res.data[0].delivery_info[showIndex].is_required,
              value: ''
            })
            _this.setData({
              additional_info: data,
              aloneDeliveryShow: true
            })
          }
        }
      }
    })
  },
  getLocation: function () {
    return new Promise((resolve, reject) => {
      let that = this;
      app.getLocation({
        success: function (res) {
          that.setData({
            latitude: res.latitude,
            longitude: res.longitude
          });
          resolve();
        },
        fail: function () {
          that.setData({
            latitude: '',
            longitude: ''
          });
          resolve();
        }
      })
    })
  },
  inputFormControl: function (e) {
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    a[b][0].value = e.detail.value
    this.setData({
      additional_info: a
    })
  },
  addDeliveryImg: function (e) {
    let _this = this;
    let info = '';
    let id = '';
    let setDataObj = {};
    info = this.data.additional_info;
    id = this.data.additional_goodsid_arr[0];
    let images = info[id][0].value || [];
    app.chooseImage((image) => {
      info[id][0].value = images.concat(image);
      setDataObj['additional_info'] = info;
      _this.setData(setDataObj);
    }, 9 - info[id][0].value.length);
  },
  deleteImage: function (e) {
    let { imageIndex } = e.currentTarget.dataset;
    let _this = this;
    let info = '';
    let id = '';
    info = this.data.additional_info;
    id = this.data.additional_goodsid_arr[0];
    let images = info[id][0].value;
    images.splice(imageIndex, 1);
    info[id][0].value = images;
    _this.setData({
      additional_info: info
    });
  },
  getPhoneNumber: function (e) {
    let that = this;
    if (/getPhoneNumber:fail/.test(e.detail.errMsg)) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppUser/GetPhoneNumber',
      data: {
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      },
      success: function (res) {
        app.setUserInfoStorage({
          phone: res.data
        })
        that.setData({
          phone: res.data
        });
      },
      successStatus5: function () {
        app.goLogin({
          success: function () {
            app.showModal({
              content: '获取手机号失败，请再次点击授权获取'
            });
          },
          fail: function () {
            app.showModal({
              content: '获取手机号失败，请再次点击授权获取'
            });
          }
        });
      }
    });
  },
  inputPhoneNumber: function (e) {
    this.setData({
      phone: e.detail.value
    });
  },
  inputPhone: function (e) {
    this.setData({
      phone: e.detail.value
    });
  },
  stopPropagation: function () {
  },
  showMoreGoods: function () {
    this.setData({
      showMoreGoods: !this.data.showMoreGoods
    })
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
  callPhone: function (event) {
    app.callPhone(event);
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
    let goodsList = this.data.goodsList;
    goodsList[index].showPackageInfo = status == 1 ? true : false;
    this.setData({
      goodsList: goodsList
    })
  },
  goInvoicePage: function () {
    let pagePath = '/eCommerce/pages/invoice/invoice?franchiseeId=' + this.franchisee_id;
    app.turnToPage(pagePath);
  },
  getAppInvoiceStatus: function () {
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
      this.shopping_cards_info.splice(id_index, 1);
      this.getCalculationInfo();
    }
    this.setData({
      selectCardList: this.data.selectCardList,
      can_use_shopping_cards: card,
    })
  },
  showContactDialog: function () {
    this.setData({
      isShowContactDialog: true,
    });
  },
  hideContactDialog: function () {
    this.setData({
      isShowContactDialog: false,
    });
  },
  contactInput: function (e) {
    let value = e.detail.value;
    let type = e.currentTarget.dataset.type;
    this.setData({
      ['evoucherContactSelected.' + type]: value
    });
    if (this.data.evoucherContactSelected.id) {
      this.setData({
        'evoucherContactSelected.id': ''
      });
    }
  },
  turnToEvoucherContacts: function (e) {
    let id = e.currentTarget.dataset.id || '';
    app.turnToPage(`/evoucher/pages/evoucherContacts/evoucherContacts?id=${id}`);
    this.setData({
      isShowContactDialog: false
    });
  },
  selectEvoucherContact: function (e) {
    let id = e.currentTarget.dataset.id;
    let { evoucherContactsData } = this.data;
    let selectedContact = evoucherContactsData.list.filter((item) => item.id == id);
    this.setData({
      evoucherContactSelected: selectedContact[0],
      isShowContactDialog: false
    });
  },
  getEvoucherContactsList: function () {
    let that = this;
    let { loadingData, list } = this.data.evoucherContactsData;
    if (loadingData.isLoading || !loadingData.isMore) { return; }
    this.setData({
      'evoucherContactsData.loadingData.isLoading': true
    });
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetContactByPage',
      data: {
        page: loadingData.currentPage,
        page_size: 10
      },
      success: function (res) {
        let { data, is_more: isMore, current_page: currentPage } = res;
        if (data.length) {
          loadingData.isLoading = false;
          loadingData.isMore = +isMore;
          loadingData.currentPage = (currentPage || 0) + 1;
          that.setData({
            'evoucherContactsData.loadingData': loadingData,
            'evoucherContactsData.list': list.concat(data)
          });
        }
      }
    });
  },
  returnValidDate: function(goodsInfo) {
    let tempStr = '';
    let tempObj = {
      1: `永久有效`,
      2: `${util.formatTimeYMD(goodsInfo.start_date_time, 'YYYY-MM-DD')}至${util.formatTimeYMD(goodsInfo.end_date_time, 'YYYY-MM-DD')}`,
      3: goodsInfo['after_buy_x_days'] > 0 ? `购买后${goodsInfo['after_buy_x_days']}天后生效，有效期${goodsInfo['after_buy_continued_x_days']}天` : `购买后当天生效，有效期${goodsInfo['after_buy_continued_x_days']}天`
    };
    tempStr = tempObj[goodsInfo.valid_date_type];
    return tempStr;
  },
})
