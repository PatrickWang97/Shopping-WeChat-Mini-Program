var app = getApp();
var util = require('../../../utils/util.js');
var customEvent = require('../../../utils/custom_event.js');
Page({
  data: {
    priceBreakDisModal: false,    // 满减优惠选择框
    canChangeSelect: true, // 是否可以切换配送方式
    shopping_cards_deduct_all: false,   // 购物卡是否可以抵扣全部的金额
    cardDialog: false, //购物卡选择框
    uselessCard: false, // 不可用购物卡
    selected: false, // 购物卡被选中
    can_use_shopping_cards: [], // 购物卡可用列表
    cant_use_shopping_cards: [], // 不可用购物卡列表
    selectCardList: [], //选择的购物卡列表
    cardtype: '', // 购物卡 或 礼品卡是 1 下单
    user_gift_card_info: {},   //礼品卡信息
    customNumArr: Array.from(new Array(101).keys()).slice(1),
    take_meal_type_index: 0,
    take_meal_type_arr: [],
    take_meal_type_text: ["", "送餐到桌", "前台自取"],
    dining_mode_arr: ['堂食', '打包'],
    take_meal_type: 1,
    people_num: 1,
    dining_mode: 1,
    is_addDishing: false,
    only_me: false,
    goodsList: [],
    selectAddress: '',
    discountList: [],
    selectDiscountInfo: {},
    orderRemark: '',
    express_fee: '',
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
    selectDelivery: '',
    hasRequiredSuppInfo: false,
    additional_info: {},
    showPickMask: false,
    isShowSameJourneyTime: false,
    expressAddressNull: false,
    goodsIcon: {
      1: 'icon-goods-express-model',
      2: 'icon-goods-city-model',
      3: 'icon-goods-delivery-model',
      4: 'icon-dining-default'
    },
    leagueBenefitData: {
      benefitList: [],                 // 联盟优惠
      selectedBenefitInfo: {},         // 选中的联盟优惠
      benefitPrice: 0,                 // 联盟优惠价格
    },
    mulShopsInfo: {},                  // 多店的信息
    payGiftOptions: {},                // 支付有礼计算金额参数
    settlementActivityFreePrice: '',   // 参与结算活动的金额
    showNoneAddress: false,            // 同城无地址弹窗
    sameJourneyConfig: {
      appointment_setting_data: {}
    },
    payGiftPrice: '',                  // 支付有礼价格
    hiddenInvoice: false,              // 隐藏开票口
    pickUpTypeName: {                  // 取货方式名称
      '-1': '',
      1: '快递',
      2: '同城',
      3: '自提',
      4: '堂食'
    },
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
  isFranchisee: false,
  mulShopsParams: [], // 多店请求的参数
  payTotalPrice: 0, // 微信支付的价格
  changeShopAppId: '',  // 多店结算更改数据店铺id
  mulShopsHasVoucher: false,  // 多店结算优惠券中是否有兑换券
  hiddenTextarea: false, // 优惠方式弹出隐藏原生组件textarea
  onLoad: function (options) {
    this.user_gift_card_id = options.cardid || '';
    this.isFranchisee = (options.is_merge_shoppingcart && !options.is_separate_pay) ? true : false;
    this.franchisee_id = options.franchisee || '';
    this.isFranchiseeCoupon = this.isFranchisee ? true : this.franchisee_id ? true : !this.isFranchisee && !this.franchisee_id && (app.globalData.hasFranchiseeList || app.globalData.hasFranchiseeChain) ? true : false;     // 子店 总店 多店结算均可使用联盟优惠券
    let is_together = options.is_together === 'true' ? true : false;
    let teamToken = options.team_token || '';
    let group_buy_people = options.group_buy_people || 0;
    let limit_buy = options.limit_buy || '';
    let pickUpType = options.type ? options.type : -1; // TODO
    let addressId = options.addressId || '';
    let is_from = options.is_from || '';
    if (is_from === 'drink_vertical_list') {  // 如果是从饮品列表跳转过来，不允许切换配送方式
      this.setData({
        canChangeSelect : false
      })
    }
    let ec_location_id = '';
    if (this.franchisee_id) {
      ec_location_id = app.globalData['commonEcLocationId'] ? app.globalData['commonEcLocationId'] : (app.globalData[this.franchisee_id] ? app.globalData[this.franchisee_id].ec_location_id : '');
    } else {
      ec_location_id = options.ec_location_id || app.globalData.ec_location_id || ''
    }
    this.cart_id_arr = options.cart_arr ? decodeURIComponent(options.cart_arr).split(',') : [];
    this.is_group = options.is_group || '';
    this.setData({
      cardtype: options.cardtype || '',   //礼品卡下单 
      franchisee_id: options.franchisee || '',
      ec_location_id: ec_location_id,
      is_together: is_together,
      pickUpType: pickUpType,
      ori_pick_up_type: pickUpType,
      sameJourneyImmediatelyState: pickUpType == 2 ? 1 : '',
      selectSameJourneyId: pickUpType == 2 ? addressId : '',
      ori_selectSameJourneyId: pickUpType == 2 ? addressId : '',
      selectAddressId: pickUpType == 1 ? addressId : '',
      limit_buy: limit_buy,
      is_group: this.is_group,
      teamToken: teamToken,
      group_buy_people: group_buy_people,
      phone: app.getUserInfo().phone,
      isFranchisee: this.isFranchisee,
    });
    this.dataInitial();
  },
  getDiningData: function () {
    if (this.data.ec_location_id) {
      this.scanInitUserInfo('', this.data.ec_location_id, this.checkIsAddDishing);
    } else {
      this.getCalculationInfo();
    }
  },
  dataInitial: function () {
    if (this.data.cardtype == 1) {
      this.useGiftList();
      return
    }
    this.getAppInvoiceStatus();
    this.getAppECStoreConfig();
    this.getCartList(() => {
      this.selectPickMethod('first');
    });
  },
  onShow: function () {
    if (this.isFromSelectAddress) {
      this.getCalculationInfo();
      this.isFromSelectAddress = false;
    }
    if (this.onlyImme) {
      this.showServiceTime('onlyImme');
      this.onlyImme = false;
    }
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
        let actIdArr = [];
        res.data.goods_info.forEach(good => {
          let actid = good.price_break_discounts_activity_id;
          if (actid > 0 && actIdArr.indexOf(actid)< 0) {
            actIdArr.push(actid);
          }
          _this.cart_id_arr.push(good.id)
        })
        _this.setData({
          actIdArr: actIdArr,
          goodsList: res.data.goods_info,
          user_gift_card_info: res.data.user_gift_card_info
        })
        _this.getAppECStoreConfig();
        _this.selectPickMethod('first');
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
  getCartList: function (callback) {
    let _this = this,
      franchiseeId = this.franchisee_id,    // 多商家子店APPID
      isFranchisee = this.isFranchisee,     // 多商家合并购物车是否合并结算
      params = { page: 1, page_size: 100 }; // 接口参数
      _this.cart_id_arr_my = [];
    if (franchiseeId) {
      params['app_id_type'] = franchiseeId;
    }
    if (isFranchisee) {
      params['is_app_shop'] = 1;
    } else {
      if (franchiseeId) {
        params['sub_shop_app_id'] = franchiseeId
      }
    }
    if (franchiseeId || isFranchisee) {
      params['parent_shop_app_id'] = app.globalData.appId
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: params,
      success: function (res) {
        var data = [];
        var actIdArr = [];
        let setDataObj = {};
        if (_this.cart_id_arr.length) { // cart_id_arr：用户购物车页选中需要结算的商品ID数组
          for (var i = 0; i <= res.data.length - 1; i++) {
            if (_this.cart_id_arr.indexOf(res.data[i].id) >= 0) {
              data.push(res.data[i]);
            }
          }
          if (isFranchisee) { // 多商家合并购物车店铺合并结算
            let shopsArr = [];
            res.appShopData.forEach((shop) => {
              shop.cartList = shop.cartList.filter((cart) => _this.cart_id_arr.indexOf(cart.id) >= 0);
            });
            shopsArr = res.appShopData.filter((shop) => shop.cartList.length);
            setDataObj['shopsList'] = shopsArr;
          }
        } else {
          data = res.data;
        }
        for (var i = 0; i <= data.length - 1; i++) {
          var goods = data[i],
            modelArr = goods.model_value;
          if (goods.is_package_goods == 1) {
            goods.showPackageInfo = false;
          }
          if (!Array.isArray(goods.package_goods)) {
            goods.package_goods = [];
          }
          if (goods.attributes) {
            for (let attr in goods.attributes) {
              for (let _goods in goods.attributes[attr].goods_list) {
                goods.package_goods.push(goods.attributes[attr].goods_list[_goods]);
              }
            }
          }
          let actid = goods.price_break_discounts_activity_id;
          if (actid > 0 && actIdArr.indexOf(actid)< 0) {
            actIdArr.push(actid);
          }
          goods.model_value_str = modelArr && modelArr.join ? modelArr.join('； ') : '';
          _this.cart_data_arr.push({
            cart_id: goods.id,
            goods_id: goods.goods_id,
            model_id: goods.model_id,
            num: goods.num
          });
          _this.cart_id_arr_my.push(goods.id);
        }
        setDataObj['actIdArr'] = actIdArr;      // 存储购物车拿到的 满减活动id 调接口参数使用
        setDataObj['actIdArrOri'] = actIdArr;      // 存储购物车拿到的 满减活动id 页面渲染使用
        setDataObj['only_me'] = true;
        setDataObj['goodsList'] = data;
        _this.setData(setDataObj);
        typeof callback == 'function' && callback();
      }
    })
  },
  getCalculationInfo: function (callback) {
    if (this.isFranchisee) { // 多店
      this.reSeparateIntegral(() => this.getMulCalculationInfo());
      return;
    }
    var _this = this;
    let ecommerce_info = {};
    if (this.data.pickUpType == 4) {
      ecommerce_info = {
        'ec_dining_data': {
          'ordering_food_type': 1,  // 点餐方式
          'dining_mode': _this.data.dining_mode,   // 就餐方式
          'people_num': _this.data.people_num,  // 就餐人数
          'take_meal_type': _this.data.take_meal_type,  // 取餐类型
          'location_id': _this.data.ec_location_id, // 座位号码
          'account_type': _this.data.account_type // 结账方式
        }
      }
    }
    let params = {
      shopping_cards_info: this.shopping_cards_info || '',   // 使用购物卡下单
      ecommerce_info: ecommerce_info,
      sub_shop_app_id: this.franchisee_id || (this.isFranchisee ? app.getAppId() : ''),
      address_id: this.data.pickUpType == 4 ? '' : (this.data.pickUpType == 1 ? this.data.selectAddressId : this.data.selectSameJourneyId),
      cart_id_arr: this.cart_id_arr,
      is_balance: this.data.useBalance ? 1 : 0,
      pick_up_type: this.data.pickUpType,
      selected_benefit: (this.data.pickUpType == 4 && this.data.account_type == 2) ? '' : this.data.selectDiscountInfo,
      voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
      settlement_activity_info: this.data.cashOnDelivery || (this.data.pickUpType == 4 && this.data.account_type == 2) ? {} : this.shopping_cards_info.length > 0 ? '' : this.data.payGiftOptions,   // 货到付款和堂食先付后吃不使用支付结算活动
      is_pay_on_delivery: this.data.cashOnDelivery,
      user_gift_card_id: this.user_gift_card_id || '',
      use_price_break_discounts_activity_ids: this.data.actIdArr,   // 满减活动id集合
    };
    let url = '';  
    if (this.data.cardtype) {
      if (this.data.cardtype == 1) {
        url = '/index.php?r=appGiftCard/Calculate';
      }
    } else {
      url = '/index.php?r=AppShop/calculationPrice';
      if (this.isFranchiseeCoupon) {
        params.superimposed = 1;
        params['extra_selected_benefit'] = this.data.leagueBenefitData.selectedBenefitInfo;
      }
    }
    app.sendRequest({
      url: url,
      data: params,
      method: 'post',
      success: function (res) {
        if ((_this.data.can_use_shopping_cards.length > 0 || _this.data.cant_use_shopping_cards.length > 0 )) {
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
        _this.getGoodsDiscountInfoInCart(goods_info);
        if (info.dining_status_data && _this.data.pickUpTypeArr.length == 1 && _this.data.pickUpType == 4) {
          let dining_in_business = info.dining_status_data.in_business_time == 0 ? false : true;
          if (!dining_in_business) {
            app.showModal({
              content: '店铺不在营业时间内',
              confirmText: '知道了',
              confirm: function () {
                app.turnBack();
              }
            })
          }
        }
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
        let ET_time = ''; // 预计时间
        if (_this.data.pickUpType == 2 && info.intra_city_status_data) {
          if (info.intra_city_status_data.in_business_time == 0) {
            app.showModal({
              content: '店铺不在营业时间内',
              confirmText: '知道了',
              confirm: function () {
                app.turnBack();
              }
            })
            return;
          }
          let ET_time_mm = Date.parse(new Date()) + (info.intra_city_status_data.deliver_time * 60 * 1000);
          if ((new Date()).getHours() + info.intra_city_status_data.deliver_time / 60 > 24){info.intra_city_status_data.tomorrow = true}   //同城判断是否超出当天
          ET_time = new Date(ET_time_mm).getHours() + ':' + (new Date(ET_time_mm).getMinutes() > 9 ? new Date(ET_time_mm).getMinutes() : '0' + new Date(ET_time_mm).getMinutes());
          if (info.intra_city_status_data.in_distance == 1) {
            _this.setData({
              'intraCity_in_distance': 1
            })
          }
          if (!info.address) {
            _this.setData({ showNoneAddress: true })
          }
        }
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
          if (_this.data.pickUpType == 4) {
            let goodsList = _this.data.goodsList.length ? _this.data.goodsList : info.goods_info;
            let goodsIdArr = [];
            goodsList.forEach((item, index) => {
              goodsIdArr.push(item.goods_id);
            });
            goods_info.forEach((item, index) => {
              item.forEach(subItem => {
                subItem.goods_list.forEach(childItem => {
                  goods_num += Number(childItem.num || 0);
                  if (childItem.delivery_id && childItem.delivery_id != 0 && additional_goodsid_arr.indexOf(childItem.goods_id) == -1 && goodsIdArr.indexOf(childItem.goods_id) > -1) {
                    suppInfoArr.push(childItem.delivery_id);
                    additional_goodsid_arr.push(childItem.goods_id);
                    additional_info_goods.push(childItem);
                  }
                })
              })
            })
          } else if (goods_info[i].delivery_id && goods_info[i].delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info[i].id) == -1) {
            suppInfoArr.push(goods_info[i].delivery_id);
            additional_goodsid_arr.push(goods_info[i].id);
            additional_info_goods.push(goods_info[i]);
          }
        }
        if (suppInfoArr.length && !_this.data.deliverydWrite) {
          _this.getSuppInfo(suppInfoArr);
        }
        if (_this.data.pickUpType == 4) {
          let buyer_list = _this.data.buyer_list || info.buyer_list;
          let goodsList = _this.data.goodsList.length ? _this.data.goodsList : info.goods_info;
          let my_self = _this.data.my_self || '';
          buyer_list.forEach((item, index) => {
            if (item.buyer_id == my_self && buyer_list.length > 1) {
              buyer_list.splice(index, 1)
              buyer_list.unshift(item);
            }
            let sum = 0;
            goodsList.forEach((subItem) => {
              if (item.buyer_id == subItem.buyer_id) {
                sum += +subItem.num;
                item.num = sum;
              }
            })
          })
          _this.setData({
            buyer_list,
          })
        }
        let vip_goods_list = [];
        let vip_cart_info = {};
        let is_vip_goods = 0; // 是否是会员价 堂食结构会变，单独处理
        if (_this.data.pickUpType == 4) {
          let goodsList = info.goods_info;
          for (var i = 0; i <= goodsList.length - 1; i++) {
            goodsList[i].forEach((item, index) => {
              if (!Array.isArray(item.goods_list)) return;
              item.goods_list.forEach((subItem, index) => {
                is_vip_goods = subItem.is_vip_goods;
                if (subItem.cart_vip_goods === 1 || subItem.is_vip_goods == 1) {
                  let modelArr = subItem.model_value;
                  subItem.model_value_str = modelArr && modelArr.join ? modelArr.join('； ') : '';
                  vip_goods_list.push(subItem);
                }
              })
            })
          }
          _this.data.buyer_list.forEach((item) => {
            if (item.buyer_id === info.dining_vip_card_info.user_token) {
              vip_cart_info = item;
              vip_cart_info.title = info.dining_vip_card_info.title;
            }
          })
        } else {
          is_vip_goods = info.goods_info[0].is_vip_goods;
        }
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
          ET_time: new Date(ET_time).getHours() + ':' + new Date(ET_time).getMinutes(),
          intraCityStatusData: info.intra_city_status_data || {},
          deliver_time: info.intra_city_status_data && info.intra_city_status_data.deliver_time,
          goods_num: goods_num,
          settlementActivityFreePrice: info.settlement_activity_free_bills_item_price,
          people_num: info.people_num,
          expressAddressNull: info.address ? false : _this.data.expressAddressNull,
          selectAddress: _this.data.pickUpType == 1 && info.address,
          selectSameJourney: _this.data.pickUpType == 2 && info.address,
          discountList: goodsBenefitsData,
          selectDiscountInfo: selectDiscountInfo,
          box_fee: info.box_fee,
          server_fee: info.server_fee,
          tissue_fee: info.tissue_fee,
          express_fee: info.express_fee,
          discount_cut_price: info.discount_cut_price,
          vip_cut_price: info.vip_cut_price,
          is_vip_goods: is_vip_goods,
          is_vip_order: info.is_vip_order,
          vip_cut_price: info.vip_cut_price,
          balance: info.balance,
          deduction: info.use_balance,
          original_price: info.original_price,
          totalPayment: info.price,
          total_original_price: info.total_original_price,
          canCashDelivery: info.is_pay_on_delivery,  //快递货到付款
          cashOnDelivery: info.price > 0 ? (info.priority_pay_on_delivery == 1 ? true : false) : false,
          selfPayOnDelivery: info.self_pay_on_delivery, //自提货到付款
          additional_goodsid_arr: additional_goodsid_arr,
          sameJourneyImmediatlyTime: ET_time,
          vip_goods_list: vip_goods_list,
          vip_cart_info: vip_cart_info,
          total_discount_cut_price: info.total_discount_cut_price,
          'leagueBenefitData.benefitList': leagueBenefitsData,
          'leagueBenefitData.selectedBenefitInfo': info.extra_selected_benefit,
          'leagueBenefitData.benefitPrice': info.extra_selected_benefit.discount_cut_price || 0,
        })
        if (info.intra_city_status_data && info.intra_city_status_data.in_distance == 0) {
          _this.setData({ 
            selectSameJourney: '',
            sameJourneyImmediatelyState: 0,
            sameJourneyImmediatlyTime: ''
          })
        }
        if( _this.data.pickUpType == 2 && _this.data.sameJourneyImmediatelyState == 0 ) {
          _this.showSameJourneyTime('onlyImme');
        }
        app.setPreviewGoodsInfo(additional_info_goods);
      },
      successStatusAbnormal: function (re) {
        if (re.data == '商品不能混合下单') {
          app.showModal({
            content: re.data,
            confirmText: '知道了',
            confirm: function (backdata) {
              app.turnBack();
            }
          })
          return false;
        }
        if (re.stop_loop) {
          clearTimeout(_this.timerId);
        }
      }
    });
  },
  getMulCalculationInfo: function () {
    let _this = this;
    let { pickUpType, mulShopsInfo, shopsList, leagueBenefitData, selectAddressId, selectSameJourneyId, changeShopAppId } = this.data;
    let mulShopsParams = [];
    let selectedBenefitInfo = leagueBenefitData.selectedBenefitInfo;
    if (selectedBenefitInfo && selectedBenefitInfo.no_use_benefit && selectedBenefitInfo.flag == false) {
      selectedBenefitInfo = '';
    }
    if (Object.keys(mulShopsInfo).some((appId) => mulShopsInfo[appId].selectDiscountInfo === '')) {
      this.shopIntegralRuleMap = {};
    }
    shopsList.forEach((shopItem) => {
      let shopAppId = shopItem.app_id;
      if (changeShopAppId && shopAppId !== changeShopAppId) {
        return;
      }
      let addressId = pickUpType == 1 ? (selectAddressId || '') : (selectSameJourneyId || '');
      let selectedBenefit = (mulShopsInfo[shopAppId] && mulShopsInfo[shopAppId].selectDiscountInfo) || '';
      let voucherCoupon = (mulShopsInfo[shopAppId] && mulShopsInfo[shopAppId].exchangeCouponData && mulShopsInfo[shopAppId].exchangeCouponData.voucher_coupon_goods_info) || '';
      let useBalance = mulShopsInfo[shopAppId] && mulShopsInfo[shopAppId].useBalance;
      let cashOnDelivery = mulShopsInfo[shopAppId] && mulShopsInfo[shopAppId].cashOnDelivery || 0;
      let canUseIntegral = this.getShopCanUseIntegral(shopAppId);
      let result = {
        'sub_shop_app_id': shopAppId,
        'address_id': addressId,
        'is_balance': useBalance == undefined ? 1 : useBalance ? 1 : 0,
        'pick_up_type': pickUpType,
        'selected_benefit': selectedBenefit,
        'voucher_coupon_goods_info': voucherCoupon,
        'cart_id_arr': shopItem.cartList.map(cart => cart.id),
        'is_pay_on_delivery': cashOnDelivery
      };
      if (canUseIntegral !== undefined) {
        result['user_can_use_integral'] = canUseIntegral;
      }
      mulShopsParams.push(result);
    });
    let params = {
      'multi_superimposed': 1,
      'extra_selected_benefit': selectedBenefitInfo || '',
      'multi_app_shops': mulShopsParams,
    };
    if (changeShopAppId) {
      params['action_detail'] = 1;
      if (!mulShopsParams.length) {
        params['del_app_shop'] = changeShopAppId;
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/MultiCalculationPrice',
      method: 'post',
      data: params,
      success: function (res) {
        let returnData = res.data;
        let shopsList = returnData.appData;
        let payTotalPrice = returnData.cart_total_price;
        let { mulShopsInfo } = _this.data;
        _this.userCanUseIntegral = null;
        _this.userShopIntegralPathArr = [];
        let hasVoucher = false;
        let allShopsCashOnDelivery = true;
        Object.keys(shopsList).forEach((key) => {
          let shop = shopsList[key];
          let benefits = shop.can_use_benefit;
          let selectDiscountInfo = shop.selected_benefit_info;
          let ET_time = ''; // 送达时间
          if (pickUpType == 2 && shop.intra_city_status_data) {
            let ET_time_mm = Date.parse(new Date()) + (shop.intra_city_status_data.deliver_time * 60 * 1000);
            ET_time = new Date(ET_time_mm).getHours() + ':' + (new Date(ET_time_mm).getMinutes() > 9 ? new Date(ET_time_mm).getMinutes() : '0' + new Date(ET_time_mm).getMinutes());
            _this.selectedAppId = key;
            _this.showSameJourneyTime('onlyImme');
          }
          let goodsBenefitsData = [];
          let currentShopExchangeCouponData = {
            'dialogHidden': true,
            'goodsInfo': {},
            'selectModelInfo': {},
            'hasSelectGoods': false,
            'voucher_coupon_goods_info': {}
          };
          let currentShopHasExchangeCoupon = false;
          let integralBenefit = Array.isArray(benefits.integral_benefit) ? benefits.integral_benefit[0] : benefits.integral_benefit;
          benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({ label: 'coupon', value: benefits.coupon_benefit }) : '';
          benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({ label: 'vip', value: benefits.all_vip_benefit }) : '';
          integralBenefit && goodsBenefitsData.push({ label: 'integral', value: [integralBenefit] });
          if (selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3) {
            currentShopHasExchangeCoupon = true;
            if (!mulShopsInfo[key]) {
              hasVoucher = true;
            }
            if (mulShopsInfo[key] && mulShopsInfo[key].exchangeCouponData) {
              currentShopExchangeCouponData = mulShopsInfo[key] && mulShopsInfo[key].exchangeCouponData;
            }
            if (!currentShopExchangeCouponData.hasSelectGoods) {
              _this.mulShopExchangeCouponInit(parseInt(selectDiscountInfo.value), key);
            }
          }
          let sameJourneyImmediatelyState = mulShopsInfo[key] && mulShopsInfo[key].sameJourneyImmediatelyState;
          let phone = mulShopsInfo[key] && mulShopsInfo[key].phone;
          let cashOnDelivery = mulShopsInfo[key] && mulShopsInfo[key].cashOnDelivery;
          if (cashOnDelivery === undefined) { // 只有首次进来才需要判断是否优先使用货到付款
            if (shop.price > 0 && shop.pickUpType != 2) { // 是否符合使用货到付款条件, 同城不能货到付款
              cashOnDelivery = shop.priority_pay_on_delivery == 1 ? true : false;
            }
          }
          if (cashOnDelivery) { // 如果货到付款则减掉
            payTotalPrice = ((payTotalPrice * 100 - shop.price * 100) / 100).toFixed(2);
          }
          if (!cashOnDelivery) {
            allShopsCashOnDelivery = false;
          }
          if (integralBenefit) {
            if (_this.userCanUseIntegral === null) {
              _this.userCanUseIntegral = integralBenefit.user_integral;
            }
            let path = 'mulShopsInfo.' + key + '.discountList[' + (goodsBenefitsData.length - 1) + '].value[0].user_integral';
            _this.userShopIntegralPathArr.push(path);
            _this.shopIntegralRuleMap[key] = {
              original_price: _this.getMaxIntegralPrice(shop.goods_info),
              can_use_integral: integralBenefit.max_can_use_integral,
              is_use: false
            }
          }
          if (selectDiscountInfo.discount_type === 'integral') {
            _this.userCanUseIntegral -= integralBenefit.max_can_use_integral;
            _this.shopIntegralRuleMap[key]['is_use'] = true;
          }
          _this.setData({
            [`mulShopsInfo.${key}.discountList`]: goodsBenefitsData, // 优惠方式
            [`mulShopsInfo.${key}.selectDiscountInfo`]: selectDiscountInfo, // 选中的优惠方式
            [`mulShopsInfo.${key}.box_fee`]: shop.box_fee, // 餐盒费
            [`mulShopsInfo.${key}.express_fee`]: shop.express_fee, // 快递费
            [`mulShopsInfo.${key}.discount_cut_price`]: shop.discount_cut_price, // 优惠金额
            [`mulShopsInfo.${key}.vip_cut_price`]: shop.vip_cut_price || '', // 会员价
            [`mulShopsInfo.${key}.price`]: shop.price, // 小计
            [`mulShopsInfo.${key}.is_vip_goods`]: shop.goods_info[0].is_vip_goods || '', // 是否是会员价
            [`mulShopsInfo.${key}.balance`]: shop.balance, // 储值金
            [`mulShopsInfo.${key}.deduction`]: shop.use_balance, // 储值金抵扣金额
            [`mulShopsInfo.${key}.original_price`]: shop.original_price, // 原价
            [`mulShopsInfo.${key}.canCashDelivery`]: shop.is_pay_on_delivery, // 快递是否支持货到付款
            [`mulShopsInfo.${key}.selfPayOnDelivery`]: shop.price > 0 ? shop.self_pay_on_delivery : false, // 自提是否能使用货到付款
            [`mulShopsInfo.${key}.cashOnDelivery`]: cashOnDelivery,
            [`mulShopsInfo.${key}.sameJourneyImmediatlyTime`]: ET_time, // 自提货到付款
            [`mulShopsInfo.${key}.sameJourneyImmediatelyState`]: sameJourneyImmediatelyState ? sameJourneyImmediatelyState : pickUpType == 2 ? 1 : '',
            [`mulShopsInfo.${key}.phone`]: phone ? phone : app.getUserInfo().phone,
            [`mulShopsInfo.${key}.exchangeCouponData`]: {
              'dialogHidden': currentShopExchangeCouponData.dialogHidden,
              'goodsInfo': currentShopExchangeCouponData.goodsInfo,
              'selectModelInfo': currentShopExchangeCouponData.selectModelInfo,
              'hasSelectGoods': currentShopExchangeCouponData.hasSelectGoods,
              'voucher_coupon_goods_info': currentShopExchangeCouponData.voucher_coupon_goods_info
            },
            [`mulShopsInfo.${key}.useBalance`]: shop.use_balance > 0 ? true : false,
            [`mulShopsInfo.${key}.selected`]: currentShopHasExchangeCoupon, // 默认兑换券选中
            [`mulShopsInfo.${key}.hasExchangeCoupon`]: currentShopHasExchangeCoupon, // 该店铺是否有兑换券
          });
          if (shop.intra_city_status_data && shop.intra_city_status_data.in_distance == 0) {
            _this.setData({
              [`mulShopsInfo.${key}.selectSameJourney`]: ''
            });
          }
        });
        let leagueBenefitsData = [];
        let leagueBenefits = returnData.extra_can_use_benefit;
        leagueBenefits.coupon_benefit && leagueBenefits.coupon_benefit.length ? leagueBenefitsData.push({ label: 'coupon', value: leagueBenefits.coupon_benefit }) : '';
        _this.setData({
          'mulShopsInfo': mulShopsInfo,
          'expressAddressNull': returnData.address ? false : _this.data.expressAddressNull, // 是否有快递地址
          'selectAddress': pickUpType == 1 && returnData.address,  // 快递地址
          'selectSameJourney': pickUpType == 2 && returnData.address,  // 同城地址
          'leagueBenefitData.benefitList': leagueBenefitsData,
          'leagueBenefitData.selectedBenefitInfo': returnData.extra_selected_benefit,
          'leagueBenefitData.benefitPrice': returnData.discount_cut_price,
          'totalPayment': returnData.cart_total_price,
          'mulShopsHasVoucher':hasVoucher,
          'allShopsCashOnDelivery': allShopsCashOnDelivery,
        });
        _this.payTotalPrice = payTotalPrice;
        if (pickUpType == 3) {
          _this.getSelfDeliveryList();
        }
        _this.getSuppInfo();
        _this.rightShopsUserIntegral();
       _this.data.shopsList.forEach(shop => {
        shop.cartList.forEach(goods=>{
          goods.can_use_this_coupon = true;
        })
        if (_this.data.mulShopsInfo[shop.app_id].selectDiscountInfo.only_included_goods != null) {
          shop.cartList.forEach(res => {
            res.can_use_this_coupon = false;
          })
          _this.data.mulShopsInfo[shop.app_id].selectDiscountInfo.only_included_goods.forEach(goods => {
            shop.cartList.forEach((res, index) => {
              if (res.goods_id == goods) {
                shop.cartList[index].can_use_this_coupon = true
              }
            })
          })
        }
      })
      _this.setData({
        shopsList: _this.data.shopsList
      })
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
    let { appId } = e.currentTarget.dataset;
    let setDataObj = {};
    if (appId) { // 多店
      setDataObj[`mulShopsInfo.${appId}.orderRemark`] = e.detail.value;
    } else { // 单店
      setDataObj['orderRemark'] = e.detail.value;
    }
    this.setData(setDataObj);
  },
  previewImage: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src
    });
  },
  clickMinusButton: function (e) {
    this.setSelectedGoodsInfo(e);
    if (+this.selectedGoodsInfo.num <= 0) return;
    this.changeGoodsNum(e, 'minus');
  },
  clickPlusButton: function (e) {
    this.setSelectedGoodsInfo(e);
    if (this.data.limit_buy !== '' && +this.selectedGoodsInfo.num >= this.data.limit_buy) return;
    this.changeGoodsNum(e, 'plus');
  },
  inputGoodsCount: function (e) {
    this.setSelectedGoodsInfo(e);
    let value = +e.detail.value;
    let index = e.target.dataset.index;
    let goods = this.data.goodsList[index];
    let that = this;
    if (isNaN(value) || value <= 0) {
      return;
    }
    if (value < goods.min_sales_nums) {
      app.showModal({
        content: '不得少于起卖数',
        confirm: function () {
          that.changeGoodsNum(e, goods.min_sales_nums);
        }
      })
      return;
    }
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      this.changeGoodsNum(e, value);
    }, 500);
  },
  changeGoodsNum: function (e, type) {
    let { index, shopIndex, isFranchisee, appId } = e.currentTarget.dataset;
    var goods = this.selectedGoodsInfo,
      goodsList = this.data.goodsList,
      currentNum = +goods.num,
      targetNum = type == 'plus' ? currentNum + 1 : (type == 'minus' ? currentNum - 1 : Number(type)),
      _this = this,
      data = {},
      param;
    data['changeShopAppId'] = appId;
    if (targetNum < goods.min_sales_nums || targetNum == 0 && type == 'minus') {
      app.showModal({
        title: targetNum < goods.min_sales_nums ? `该商品起卖数是${goods.min_sales_nums},` : '',
        content: '确定从购物车删除该商品？',
        showCancel: true,
        confirm: function () {
          if (isFranchisee) {
            data[`shopsList[${shopIndex}].cartList[${index}].num`] = targetNum;
            data[`mulShopsInfo.${_this.selectedAppId}.noAdditionalInfo`] = true;
            data[`mulShopsInfo.${_this.selectedAppId}.aloneDeliveryShow`] = false;
          } else {
            _this.cart_data_arr[index].num = targetNum;
            data['goodsList[' + index + '].num'] = targetNum;
            data['noAdditionalInfo'] = true;
            data['aloneDeliveryShow'] = false;
          }
          _this.setData(data);
          _this.deleteGoods(e);
        }
      })
      return;
    }
    param = {
      form_data: {
        attributes: []
      },
      goods_id: goods.goods_id,
      model_id: goods.model_id || '',
      num: targetNum,
      sub_shop_app_id: (isFranchisee ? (_this.selectedAppId || app.getAppId()) : _this.franchisee_id),
      is_seckill: goods.is_seckill == 1 ? 1 : '',
      location_id: this.data.pickUpType == 4 ? this.data.ec_location_id : '',
      cart_id: isFranchisee ? goods.id : this.cart_data_arr[index].cart_id,
    };
    if (goods.is_package_goods == 1) {
      param.form_data.is_package_goods = 1;
      goods.package_goods.forEach(packageItem => {
        let obj = {
          'id': packageItem.goods_id,
          'model_id': packageItem.model_id,
          'num': packageItem.selected_num,
          'elem': []
        }
        if (Array.isArray(packageItem._attributes)) {
          packageItem._attributes.forEach(_attributes => {
            if (Array.isArray(_attributes.elem)) {
              _attributes.elem.forEach(elem => {
                obj.elem.push({
                  id: elem.id,
                  num: elem.selected_num
                })
              })
            }
          })
        }
        param.form_data.attributes.push(obj)
      })
    } else if (goods.attributes) {
      goods.form_data.attributes.forEach(item => {
        param.form_data.attributes.push(item);
      })
    }
    if (goods.form_data && goods.form_data.seckill_activity_id) {
      param.form_data = {};
      param.form_data.seckill_activity_id = goods.form_data.seckill_activity_id;
      param.form_data.seckill_activity_time_id = goods.form_data.seckill_activity_time_id;
    }
    if (this.data.is_group) {
      param.is_group_buy = this.data.is_group ? 1 : 0;
      param.num_of_group_buy_people = this.data.group_buy_people;
      param.team_token = this.data.teamToken;
    }
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      method: "post",
      success: function (res) {
        if (isFranchisee) {
          data[`shopsList[${shopIndex}].cartList[${index}].num`] = targetNum;
          data[`mulShopsInfo.${goods.app_id}.selectDiscountInfo`] = '';
          data[`mulShopsInfo.${goods.app_id}.exchangeCouponData`] = {
            dialogHidden: true,
            hasSelectGoods: false,
            voucher_coupon_goods_info: {}
          }
        } else {
          _this.cart_data_arr[index].num = targetNum;
          data['goodsList[' + index + '].num'] = targetNum;
          data.selectDiscountInfo = '';
          data.exchangeCouponData = {
            dialogHidden: true,
            hasSelectGoods: false,
            voucher_coupon_goods_info: {}
          };
        }
        _this.setData(data);
        _this.getCalculationInfo();
      },
      fail: function (res) {
        data = {};
        if (isFranchisee) {
          data[`shopsList[${shopIndex}].cartList[${index}].num`] = targetNum;
        } else {
          _this.cart_data_arr[index].num = currentNum;
          data['goodsList[' + index + '].num'] = targetNum;
        }
        _this.setData(data);
      }
    })
  },
  setSelectedGoodsInfo: function (e) {
    let { index, isFranchisee, shopIndex, appId } = e.currentTarget.dataset;
    let { goodsList, shopsList } = this.data;
    this.selectedGoodsInfo = isFranchisee ? (shopsList[shopIndex] && shopsList[shopIndex].cartList[index]) : goodsList[index];
    this.selectedAppId = appId;
  },
  deleteGoods: function (e) {
    let { index, isFranchisee, shopIndex } = e.currentTarget.dataset;
    var goodsList = this.data.goodsList,
      shopsList = this.data.shopsList,
      _this = this,
      listExcludeDelete,
      shopListExcludeDelete = [];
    let currentGoodsInfo = this.selectedGoodsInfo;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: [isFranchisee ? currentGoodsInfo.id : this.cart_data_arr[index].cart_id],
        sub_shop_app_id: isFranchisee ? (_this.selectedAppId || app.getAppId()) : this.franchisee_id,
        location_id: this.data.ec_location_id,
      },
      success: function (res) {
        if (isFranchisee) { // 多商家多店
          shopListExcludeDelete = JSON.parse(JSON.stringify(shopsList));
          shopListExcludeDelete.map((shop) => {
            shop.cartList = shop.cartList.filter((cart) => cart.id != currentGoodsInfo.id);
          });
          shopListExcludeDelete = shopListExcludeDelete.filter((shop) => shop.cartList.length > 0);
          if (shopListExcludeDelete.length == 0) { // 没有店铺
            app.turnBack();
            return;
          }
          let noSameCartId = true;
          let { mulShopsInfo } = _this.data;
          shopListExcludeDelete.forEach((shop) => {
            noSameCartId = shop.cartList.some((cart) => cart.id == currentGoodsInfo.id);
          });
          if (noSameCartId && mulShopsInfo[_this.selectedAppId].additional_info) { // 删除补充信息
            let newData = delete mulShopsInfo[_this.selectedAppId].additional_info[currentGoodsInfo.id];
            _this.setData({
              [`mulShopsInfo.${_this.selectedAppId}.additional_info`]: newData,
            });
          }
          _this.setData({
            shopsList: shopListExcludeDelete,
            [`mulShopsInfo.${_this.selectedAppId}.selectDiscountInfo`]: '',
            [`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData`]: {
              dialogHidden: true,
              hasSelectGoods: false,
              voucher_coupon_goods_info: {}
            }
          });
        } else {
          (listExcludeDelete = goodsList.concat([])).splice(index, 1);
          if (listExcludeDelete.length == 0) {
            app.turnBack();
            return;
          }
          var deleteGoodsId = goodsList[index],
            noSameGoodsId = true;
          for (var i = listExcludeDelete.length - 1; i >= 0; i--) {
            if (listExcludeDelete[i].id == deleteGoodsId) {
              noSameGoodsId = false;
              break;
            }
          }
          if (noSameGoodsId && _this.data.additional_info) {
            let a = delete _this.data.additional_info[deleteGoodsId];
            _this.setData({
              additional_info: a
            })
          }
          if (_this.data.pickUpType == 4) {
            _this.data.buyer_list.forEach(item => {
              if (goodsList[index].buyer_id == item.buyer_id && item.num == 1) {
                item.num = 0;
              }
            })
            _this.setData({
              buyer_list: _this.data.buyer_list
            })
          }
          _this.cart_data_arr.splice(index, 1);
          _this.setData({
            goodsList: listExcludeDelete,
            selectDiscountInfo: '',
            exchangeCouponData: {
              dialogHidden: true,
              hasSelectGoods: false,
              voucher_coupon_goods_info: {}
            }
          })
        }
        _this.getCalculationInfo();
      }
    });
  },
  confirmPayment: function (e) {
    let _this = this;
    let {
      selectDiscountInfo,tostoreOrderType,pickUpType,
      selectAddress,location_status,ec_location_id,    
      take_meal_type,selectSameJourney,sameJourneyHourTime, 
      sameJourneyImmediatelyState,selectDelivery,selfAppointmentSwitch,
      tostoreTimeType,tostoreDateTime,tostoreHourTime,selfDeliveryPhone,
      deliverydWrite,aloneDeliveryShow,hasRequiredSuppInfo, 
      additional_info,additional_goodsid_arr,cardtype,
      leagueBenefitData,phone,locationId,dining_mode,people_num,
      account_type,allow_add_dish,allow_app_account,
      exchangeCouponData,cashOnDelivery,payGiftOptions,
      hiddenInvoice,invoiceInfo,orderRemark,useBalance
    } = this.data;
    if (pickUpType == 1 && !selectAddress) {
      this.setData({
        expressAddressNull: true
      })
      return;
    }
    if (pickUpType == 4 && location_status) {
      clearTimeout(this.timerId);
      if (!ec_location_id && take_meal_type == 1) {
        app.showModal({
          content: '请先扫码获取桌号！',
        })
        return;
      }
    }
    if (pickUpType == 2 && !selectSameJourney) {
      app.showModal({
        content: '请选择同城地址',
        confirmText: '去选择',
        confirm: function () {
          _this.isFromSelectAddress = true;
          _this.goSameJourneyAddress();
        }
      });
      return;
    }
    if (pickUpType == 2 && !sameJourneyHourTime && sameJourneyImmediatelyState != 1) {
      app.showModal({
        content: '请选择取货时间'
      });
      return;
    }
    if (pickUpType == 3 && !selectDelivery) {
      app.showModal({
        content: '请选择上门自提地址',
        confirmText: '去填写',
        confirm: function () {
          _this.toDeliveryList();
        }
      });
      return;
    }
    if (pickUpType == 3 && selfAppointmentSwitch && !tostoreOrderType) {
      app.showModal({
        content: '请选择取货时间'
      });
      return;
    }
    let year = new Date().getFullYear();
    tostoreDateTime = year + '-' + tostoreDateTime + ' ' + (tostoreHourTime || '');
    if (pickUpType == 3 && selfDeliveryPhone == 1 && (!phone || !/^[0-9]*$/.test(phone))) {
      app.showModal({
        content: '请输入正确的手机号'
      });
      return;
    }
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
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    let url = '';
    if (cardtype) {
      if (cardtype == 1) {
        url = '/index.php?r=appGiftCard/AddOrder';
      }
    } else {
      url = '/index.php?r=AppShop/addCartOrder';
    }
    app.sendRequest({
      url:  url,
      method: 'post',
      data: {
        shopping_cards_info: this.shopping_cards_info || '',   // 使用购物卡下单
        user_gift_card_id: this.user_gift_card_id || '',  // 使用礼品卡下单
        cart_id_arr: this.cart_id_arr,
        formId: e.detail.formId,
        sub_shop_app_id: this.franchisee_id || (this.isFranchisee ? app.getAppId() : ''),
        selected_benefit: selectDiscountInfo,
        is_balance: (pickUpType == 4 && account_type == 2) ? 0 : (useBalance ? 1 : 0),
        extra_selected_benefit: leagueBenefitData.selectedBenefitInfo,
        superimposed: this.isFranchiseeCoupon ? 1 : 0,
        is_multi: this.isFranchiseeCoupon ? 1 : 0,
        ecommerce_info: {
          'ec_tostore_data': {
            'ec_tostore_order_type': tostoreOrderType || 1,
            'ec_tostore_appointment_time': tostoreOrderType == 1 || !selfAppointmentSwitch ? '' : tostoreDateTime,
            'ec_tostore_buyer_phone': phone || '',
            'ec_tostore_appointment_time_type': tostoreTimeType || '',
            'ec_tostore_location_id': locationId || ''
          },
          'intra_city_data': this._mapIntraCityOptions(),
          'ec_dining_data': {
            'ordering_food_type': 1,  // 点餐方式
            'dining_mode': dining_mode,   // 就餐方式
            'people_num': people_num,  // 就餐人数
            'take_meal_type': take_meal_type,  // 取餐类型
            'location_id': ec_location_id, // 座位号码
            'account_type': account_type, // 结账方式
            'allow_add_dish': allow_add_dish, // 允许加菜
            'allow_app_account': allow_app_account  // 允许结账
          },
        },
        pick_up_type: pickUpType,
        self_delivery_app_store_id: pickUpType == 3 ? selectDelivery.id : '',
        remark: orderRemark,
        address_id: pickUpType == 1 ? selectAddress.id : (pickUpType == 4 ? '' : selectSameJourney.id),
        additional_info: additional_info,
        voucher_coupon_goods_info: exchangeCouponData.voucher_coupon_goods_info,
        is_pay_on_delivery: cashOnDelivery ? 1 : 0,
        settlement_activity_info: cashOnDelivery || (pickUpType == 4 && account_type == 2) ? {} : this.shopping_cards_info.length > 0 ? '' : payGiftOptions,   // 货到付款和堂食先付后吃不使用支付结算活动
        invoice_info: hiddenInvoice ? '' : (invoiceInfo || ''), //发票
        use_price_break_discounts_activity_ids: (pickUpType == 4 && account_type == 2) ? '' : this.data.actIdArr,   // 满减活动id集合 堂食先吃后付在订单页传活动ids
      },
      success: function (res) {
        app.sendUseBehavior([{goodsId: res.data}],5); // 提交订单
        if (pickUpType == 1 || pickUpType == 2) {
          app.requestSubscribeMessage([{ 
            type: 1, obj_id: res.data
          }]).then(()=> {
            _afterAddOrder();
          })
        }else if (pickUpType == 3) {
          app.requestSubscribeMessage([{ 
            type: 8, obj_id: res.data,
          }]).then(()=> {
            _afterAddOrder();
          })
        }else if (pickUpType == 4) {
          _afterAddOrder();
        }
        function _afterAddOrder() {
          let { total_price, settlement_activity_item_price } = res;
          if (+settlement_activity_item_price) {                       // 购买储值或者付费卡的金额
            total_price = ((+total_price) + (+settlement_activity_item_price)).toFixed(2);
          }
          _this.setData({
            totalPayment: total_price
          })
          if (pickUpType == 4) {
            clearTimeout(_this.timerId);
            ec_location_id && _this.clearCartCache();
            if (account_type == 2) {
              let pagePath = '/eCommerce/pages/diningOrderDetail/diningOrderDetail?detail=' + res.data + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : '');
              app.turnToPage(pagePath, 1);
              return;
            }
          }
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
        _this.data.is_together && _this.loopRequestMultiOrder();
      },
      successStatusAbnormal: function (re) {
        _this.requesting = false;
        if (re.status == 1 && pickUpType == 4 && _this.data.is_together) {
          _this.loopRequestMultiOrder();
        }
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
  _mapIntraCityOptions() {
    let appointmentTime = '';
    let year = new Date().getFullYear();
    let dataObj = {}
    if (this.isFranchisee) {
      dataObj = this.data.mulShopsInfo[this.selectedAppId];
    } else {
      dataObj = this.data;
    }
    if (dataObj.sameJourneyImmediatelyState == 1) {
      appointmentTime = ''
    } else {
      if (dataObj.sameJourneyTimeType === 1) {
        appointmentTime = dataObj.sameJourneyDateTime
      } else {
        appointmentTime = year + '-' + dataObj.sameJourneyDateTime + ' ' + dataObj.sameJourneyHourTime
      }
    }
    return {
      'intra_city_appointment_arrive_time': appointmentTime,
      'appointment_time_format': 1
    }
  },
  mulShopconfirmPayment: function (e) {
    let _this = this;
    let {
      mulShopsInfo,
      leagueBenefitData,
      pickUpType,
      shopsList,
      selectAddress,
      selectSameJourney
    } = this.data;
    let selectedBenefitInfo = leagueBenefitData.selectedBenefitInfo;
    if (pickUpType == 1 && !selectAddress) { // 是否选了快递地址
      _this.setData({
        expressAddressNull: true
      });
      return;
    }
    if (pickUpType == 2 && !selectSameJourney) { // 是否选了同城地址
      app.showModal({
        content: `请选择同城地址`,
        confirmText: `去填写`,
        confirm: function () {
          _this.goSameJourneyAddress();
        }
      });
      return;
    }
    this.isWriteComplete = true;
    shopsList.forEach((shop, index) => {
      if (!this.isWriteComplete) return;
      let shopAppId = shop.app_id;
      _this.selectedAppId = shopAppId;
      let shopName = shop.name;
      let shopItem = mulShopsInfo[shopAppId];
      if (pickUpType == 2) { // 同城
        if (!shopItem.sameJourneyDateTime && shopItem.sameJourneyImmediatelyState != 1) {
          app.showModal({
            title: shopName,
            content: `请选择取货时间`,
          });
          this.isWriteComplete = false;
          return;
        }
      }
      if (pickUpType == 3) { // 自提
        if (!shopItem.selectDelivery) {
          app.showModal({
            title: shopName,
            content: `请选择上门自提地址`,
            confirmText: `去填写`,
            confirm: function () {
              _this.toDeliveryList(key);
            }
          });
          this.isWriteComplete = false;
          return;
        }
        if (shopItem.selfAppointmentSwitch && !shopItem.tostoreOrderType) {
          app.showModal({
            title: shopName,
            content: `请选择取货时间`
          });
          this.isWriteComplete = false;
          return;
        }
        if (shopItem.selfDeliveryPhone == 1 && !util.isPhoneNumber(shopItem.phone)) {
          app.showModal({
            title: shopName,
            content: `请输入正确的手机号`
          });
          this.isWriteComplete = false;
          return;
        }
      }
      if (shopItem.hasRequiredSuppInfo) {
        if (!shopItem.deliverydWrite && !shopItem.aloneDeliveryShow) { // 多条补充信息
          app.showModal({
            title: shopName,
            content: `有商品补充信息未填写，无法进行支付`,
            confirmText: `去填写`,
            confirm: function () {
              _this.goToAdditionalInfo(shopAppId);
            }
          });
          this.isWriteComplete = false;
          return;
        }
        if (shopItem.aloneDeliveryShow) { // 单条补充信息
          let additionalInfoItem = shopItem.additional_info[shopItem.additional_goodsid_arr[0]][0];
          if (!additionalInfoItem.value) {
            app.showModal({
              title: shopName,
              content: `请填写${additionalInfoItem.title}`,
              confirmText: `确认`
            });
            this.isWriteComplete = false;
            return;
          }
        }
      }
    });
    if (!this.isWriteComplete || this.requesting) {
      return false;
    }
    this.requesting = true;
    let shopsOrderParams = [];
    Object.keys(mulShopsInfo).forEach((key) => {
      this.selectedAppId = key;
      let shopInfo = mulShopsInfo[key];
      let shopGoods = shopsList.filter((shop) => shop.app_id == key);
      if (shopGoods.length == 0) { // 删除没有商品的店铺
        delete mulShopsInfo[key];
        return;
      }
      let cartIdArr = shopGoods[0].cartList.map((cart) => cart.id);
      let year = new Date().getFullYear();
      let tostoreDateTime = year + '-' + shopInfo.tostoreDateTime + ' ' + (shopInfo.tostoreHourTime || '');
      let result = {
        'cart_id_arr': cartIdArr, // 购物车id
        'sub_shop_app_id': key,
        'formId': e.detail.formId,
        'selected_benefit': shopInfo.selectDiscountInfo || '', // 选中的优惠方式
        'is_balance': shopInfo.useBalance > 0 ? 1 : 0,  // 是否用储值金
        'ecommerce_info': {
          'ec_tostore_data': { // 自提
            'ec_tostore_order_type': shopInfo.tostoreOrderType || 1,
            'ec_tostore_appointment_time': shopInfo.tostoreOrderType == 1 || !shopInfo.selfAppointmentSwitch ? '' : tostoreDateTime,
            'ec_tostore_buyer_phone': shopInfo.phone || '', // 联系人手机号码
            'ec_tostore_appointment_time_type': shopInfo.tostoreTimeType || '',
            'ec_tostore_location_id': shopInfo.locationId || '', // 自提地址
          },
          'intra_city_data': this._mapIntraCityOptions(), // 同城
        },
        'pick_up_type': pickUpType, // 取货方式
        'self_delivery_app_store_id': pickUpType == 3 ? shopInfo.selectDelivery.id : '', // 自提店id
        'remark': shopInfo.orderRemark || '', // 留言
        'address_id': pickUpType == 1 ? _this.data.selectAddress.id : (pickUpType == 4 ? '' : _this.data.selectSameJourney.id), // 地址id
        'additional_info': shopInfo.additional_info || '', // 补充信息
        'voucher_coupon_goods_info': shopInfo.exchangeCouponData && shopInfo.exchangeCouponData.voucher_coupon_goods_info || '', // 兑换券兑换商品
        'is_pay_on_delivery': shopInfo.cashOnDelivery ? 1 : 0  // 是否货到付款
      };
      if (result.selected_benefit && result.selected_benefit.discount_type === 'integral') {
        let canUseIntegral = this.getShopCanUseIntegral(key);
        result.user_can_use_integral = canUseIntegral;
      }
      shopsOrderParams.push(result);
    });
    let url = '';
    if (this.data.cardtype) {
      if (this.data.cardtype == 1) {
        url = '/index.php?r=appGiftCard/AddOrder';
      }
    } else {
      url = '/index.php?r=AppShop/MultiAddCartOrder';
    }
    app.sendRequest({
      url: url,
      method: 'post',
      data: {
        user_gift_card_id: this.user_gift_card_id || '',
        'multi_superimposed': 1,
        'extra_selected_benefit': selectedBenefitInfo, // 联盟优惠
        'multi_app_shops': shopsOrderParams
      },
      success: function (res) {
        if (pickUpType == 4) { // 点餐
          clearInterval(_this.timerId);
          if (_this.data.account_type == 2) {
            let pagePath = '/eCommerce/pages/diningOrderDetail/diningOrderDetail?detail=' + res.data + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : '');
            app.turnToPage(pagePath, 1);
            return;
          }
        }
        let allShopsCashOnDelivery = true;
        Object.keys(mulShopsInfo).forEach((key) => {
          if (!mulShopsInfo[key].cashOnDelivery) {
            allShopsCashOnDelivery = false;
          }
        });
        if (allShopsCashOnDelivery) { // 货到付款直接支付成功
          let pagePath = '/eCommerce/pages/goodsOrderPaySuccess/goodsOrderPaySuccess?isFranchisee=1&detail=' + res.data.master_order.order_id + ((_this.franchisee_id && !_this.isFranchisee) ? '&franchisee=' + _this.franchisee_id : '');
          app.turnToPage(pagePath, 1);
        } else {
          _this.payOrder(res);
        }
      },
      fail: function () {
        _this.requesting = false;
      },
      successStatusAbnormal: function () {
        _this.requesting = false;
      }
    });
  },
  clearCartCache: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/clearLocationCartCache',
      method: 'post',
      data: {
        location_id: this.data.ec_location_id,
        cart_id_arr: this.cart_id_arr,
        sub_shop_app_id: this.franchisee_id,
      },
      success: function (res) { }
    })
  },
  saveFormId: function (form_id) {
    let that = this;
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
  payOrder: function (data) {
    var _this = this;
    let orderId = '';
    let masterOrderId = '';
    if (this.isFranchisee) {
      orderId = data.extra.map((order) => order.order_id);
      masterOrderId = data.data.master_order.order_id;
    } else {
      orderId = data;
    }
    function paySuccess() {
      let goodsArr = [];
      for (let item of _this.data.goodsList){
        goodsArr.push({
          goodsId: item.goods_id,
          num: item.num
        });
      }
      app.sendUseBehavior(goodsArr,1);  //用户行为轨迹购买
      app.sendUseBehavior(goodsArr,11); //黑沙转发 购物
      app.sendUseBehavior(goodsArr,4,2); //取消加购
      let router = _this.data.pickUpType == 4 && _this.data.account_type == 2 ? 'diningOrderDetail/diningOrderDetail?detail=' : 'goodsOrderPaySuccess/goodsOrderPaySuccess?detail=';
      var pagePath = '/eCommerce/pages/' + router + (_this.isFranchisee ? masterOrderId : orderId) + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : '') + '&is_group=' + !!_this.is_group + '&isFranchisee=' + (_this.isFranchisee ? 1 : 0);
      if (!_this.franchisee_id) {
        app.sendRequest({
          url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
          data: {
            'order_id': _this.isFranchisee ? masterOrderId : orderId,
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
      let router = 'intraCityOrderDetail/intraCityOrderDetail?detail=';
      if (_this.data.pickUpType == 4) {
        router = 'diningOrderDetail/diningOrderDetail?detail=';
      } else if (_this.data.pickUpType == 1) {
        router = 'goodsOrderDetail/goodsOrderDetail?detail=';
      }
      if (_this.is_group) {
        if (_this.data.teamToken) {
          app.turnBack();
          return;
        }
        app.turnToPage('/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      } else {
        if (_this.isFranchisee) {
          app.turnToPage('/eCommerce/pages/myOrder/myOrder?goodsType=0&currentIndex=0', 1);
        } else {
          app.turnToPage('/eCommerce/pages/' + router + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
        }
      }
    }
    let totalPayMoney = _this.isFranchisee ? _this.payTotalPrice : _this.data.totalPayment;
    if (totalPayMoney == 0) {
      let orderIdParam = '';
      if (typeof data === 'string') { // 单店
        orderIdParam = data;
      } else { // 多店 将货到付款的订单号去掉
        orderIdParam = data.extra.filter((order) => order.is_pay_on_delivery == 0);
        orderIdParam = orderIdParam.map((order) => order.order_id);
      }
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        method: 'post',
        data: {
          order_id: orderIdParam,
          total_price: 0,
          data: (_this.isFranchisee ? orderIdParam : ''),
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
    if (_this.isFranchisee) {
      params['data'] = data.extra.map((order) => {
        return {
          'order_id': order.order_id,
          'is_master': order.is_master,
        };
      });
    } else {
      params['order_id'] = orderId;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      method: 'post',
      data: params,
      success: function (res) {
        var param = res.data;
        param.orderId = masterOrderId;
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
  goToMyAddress: function (e) {
    let { addressId } = e.currentTarget.dataset;
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/myAddress/myAddress?id=' + addressId);
  },
  useBalanceChange: function (e) {
    let { appId } = e.currentTarget.dataset;
    let setDataObj = {};
    if (appId) { // 多店
      setDataObj[`mulShopsInfo.${appId}.useBalance`] = e.detail.value;
      setDataObj['changeShopAppId'] = appId;
      if (e.detail.value) { // 用储值不显示货到付款
        setDataObj['allShopsCashOnDelivery'] = false;
      }
    } else { // 单店
      setDataObj['useBalance'] = e.detail.value;
      setDataObj['invoiceInfo'] = '';
    }
    this.setData(setDataObj);
    this.getCalculationInfo();
  },
  useCashDelivery: function (e) {
    let { appId } = e.currentTarget.dataset;
    let setDataObj = {};
    if (appId) {
      setDataObj[`mulShopsInfo.${appId}.cashOnDelivery`] = e.detail.value;
      this.setData(setDataObj);
      let { mulShopsInfo } = this.data;
      if (e.detail.value) {
        this.payTotalPrice = ((this.payTotalPrice * 100 - mulShopsInfo[appId].price * 100) / 100).toFixed(2);
      } else {
        this.payTotalPrice = ((this.payTotalPrice * 100 + mulShopsInfo[appId].price * 100) / 100).toFixed(2);
      }
      let allShopsCashOnDelivery = true;
      Object.keys(mulShopsInfo).forEach((key) => {
        if (!mulShopsInfo[key].cashOnDelivery) {
          allShopsCashOnDelivery = false;
        }
      });
      this.setData({
        allShopsCashOnDelivery: allShopsCashOnDelivery
      });
    } else {
      setDataObj['cashOnDelivery'] = e.detail.value;
      setDataObj['invoiceInfo'] = '';
      this.setData(setDataObj);
    }
  },
  deliveryWayChange: function (event) {
    let type = event.currentTarget.dataset.type;
    this.setData({
      selectDiscountInfo: {}, // 清空已选优惠信息
      pickUpType: type,
      sameJourneyImmediatelyState: type == 2 ? 1 : '',
      isShowPickMask: false,
      cashOnDelivery: false
    })
    if (type == 3) {
      this.getSelfDeliveryList();
    } else if (type == 4) {  // 点餐
      this.getDiningFuncSetting(this.getDiningData);
    }
    type != 4 && this.getCalculationInfo();
  },
  goToAdditionalInfo: function (e) {
    let additionalInfo = {};
    let appId = '';
    if (this.isFranchisee) {
      appId = typeof e === "object" ? e.currentTarget.dataset.appId : e ? e : this.selectedAppId;
      let { mulShopsInfo } = this.data;
      additionalInfo = mulShopsInfo[appId].additional_info || {};
      app.setPreviewGoodsInfo(mulShopsInfo[appId].goodsAdditionalInfo);
    } else {
      additionalInfo = this.data.additional_info;
    }
    app.setGoodsAdditionalInfo(additionalInfo);
    app.turnToPage(`/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo?appId=${appId}`);
  },
  exchangeCouponInit: function (id) {
    let  _this = this;
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
      } else{
        app.showModal({
          content: '兑换的商品已下架'
        });
      }
    }, (data) => {  // 报错了
      console.error(data);
    });
  },
  mulShopExchangeCouponInit: function(goodsId, appId) {
    let _this = this;
    let { isFranchisee } = _this.data;
    let params = {};
    params['data_id'] = goodsId;
    if (isFranchisee) {
      params['app_id'] = appId;
    }
    _this.getGoodsById(params).then((data) => {
      if (data['hasData']) {  // 接口有数据返回
        _this.setData({
          [`mulShopsInfo.${appId}.exchangeCouponData.dialogHidden`]: false,
          [`mulShopsInfo.${appId}.exchangeCouponData.goodsInfo`]: data['goodsData'],
          [`mulShopsInfo.${appId}.exchangeCouponData.selectModelInfo`]: data['selectModelInfo'],
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
  getGoodsById: function(params) {
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
          resolve({hasData: true, goodsData: goodsFiled, selectModelInfo: selectModelInfo});
        },
        successStatusAbnormal: function () {
          resolve({hasData: false});
        },
        fail: function (res) {
          reject(res.data);
        }
      });
    });
  },
  exchangeCouponHideDialog: function (e) {
    let setDataObj = {};
    let { appId } = e.currentTarget.dataset;
    if (appId) {
      setDataObj[`mulShopsInfo.${appId}.selectDiscountInfo`] = {
        title: "不使用优惠",
        name: '无',
        no_use_benefit: 1
      };
      setDataObj[`mulShopsInfo.${this.selectedAppId}.exchangeCouponData.dialogHidden`] = true;
      setDataObj[`mulShopsInfo.${this.selectedAppId}.exchangeCouponData.hasSelectGoods`] = false;
      setDataObj[`mulShopsInfo.${this.selectedAppId}.exchangeCouponData.voucher_coupon_goods_info`] = {};
    } else {
      setDataObj[`selectDiscountInfo`] = {
        title: "不使用优惠",
        name: '无',
        no_use_benefit: 1
      };
      setDataObj[`exchangeCouponData.dialogHidden`] = true;
      setDataObj[`exchangeCouponData.hasSelectGoods`] = false;
      setDataObj[`exchangeCouponData.voucher_coupon_goods_info`] = {};
    }
    this.setData(setDataObj);
    this.getCalculationInfo();
  },
  exchangeCouponSelectSubModel: function (e) {
    let dataObj = {};
    if (this.isFranchisee) {
      let { appId } = e.currentTarget.dataset;
      if (appId) {
        this.selectedAppId = appId;
      }
      dataObj = this.data.mulShopsInfo[this.selectedAppId];
    } else {
      dataObj = this.data;
    }
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
    if (this.isFranchisee) {
      data[`mulShopsInfo.${this.selectedAppId}.exchangeCouponData.selectModelInfo.models`] = selectModels;
      data[`mulShopsInfo.${this.selectedAppId}.exchangeCouponData.selectModelInfo.models_text`] = text;
    } else {
      data['exchangeCouponData.selectModelInfo.models'] = selectModels;
      data['exchangeCouponData.selectModelInfo.models_text'] = text;
    }
    this.setData(data);
    this.exchangeCouponResetSelectCountPrice();
  },
  exchangeCouponResetSelectCountPrice: function () {
    let dataObj = {};
    if (this.isFranchisee) {
      dataObj = this.data.mulShopsInfo[this.selectedAppId];
    } else {
      dataObj = this.data;
    }
    var _this = this,
      selectModelIds = dataObj.exchangeCouponData.selectModelInfo.models.join(','),
      modelItems = dataObj.exchangeCouponData.goodsInfo.model_items,
      data = {};
    for (var i = modelItems.length - 1; i >= 0; i--) {
      if (modelItems[i].model == selectModelIds) {
        if (_this.isFranchisee) {
          data[`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.selectModelInfo.stock`] = modelItems[i].stock;
          data[`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.selectModelInfo.price`] = modelItems[i].price;
          data[`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.selectModelInfo.modelId`] = modelItems[i].id;
          data[`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.selectModelInfo.imgurl`] = modelItems[i].img_url;
          break;
        } else {
          data['exchangeCouponData.selectModelInfo.stock'] = modelItems[i].stock;
          data['exchangeCouponData.selectModelInfo.price'] = modelItems[i].price;
          data['exchangeCouponData.selectModelInfo.modelId'] = modelItems[i].id;
          data['exchangeCouponData.selectModelInfo.imgurl'] = modelItems[i].img_url;
          break;
        }
      }
    }
    this.setData(data);
  },
  exchangeCouponConfirmGoods: function () {
    let _this = this;
    let dataObj = {};
    if (this.isFranchisee) {
      dataObj = this.data.mulShopsInfo[this.selectedAppId];
    } else {
      dataObj = this.data;
    }
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
    if (_this.isFranchisee) {
      _this.setData({
        [`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.dialogHidden`]: true,
        [`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.selectModelInfo`]: {},
        [`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.hasSelectGoods`]: true,
        [`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.voucher_coupon_goods_info`]: {
          'goods_id': goodsInfo.id,
          'num': 1,
          'model_id': dataObj.exchangeCouponData.selectModelInfo.modelId
        },
        [`mulShopsInfo.${_this.selectedAppId}.exchangeCouponData.goodsInfo`]: goodsInfo,
      });
    } else {
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
    }
    _this.getCalculationInfo();
  },
  mulShopExchangeCouponConfirmGoods: function () {
    let _this = this;
    let { mulShopsInfo } = this.data;
    Object.keys(mulShopsInfo).forEach((key) => {
      let shop = mulShopsInfo[key];
      if (shop.hasExchangeCoupon) { // 有兑换券店铺
        if (shop.selected) { // 选中状态
          let goodsInfo = shop.exchangeCouponData.goodsInfo;
          let model = goodsInfo.model;
          let selectModels = shop.exchangeCouponData.selectModelInfo.models;
          let model_value_str = '';
          if (selectModels.length) {
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
            [`mulShopsInfo.${key}.exchangeCouponData.dialogHidden`]: true,
            [`mulShopsInfo.${key}.exchangeCouponData.selectModelInfo`]: {},
            [`mulShopsInfo.${key}.exchangeCouponData.hasSelectGoods`]: true,
            [`mulShopsInfo.${key}.exchangeCouponData.voucher_coupon_goods_info`]: {
              'goods_id': goodsInfo.id,
              'num': 1,
              'model_id': shop.exchangeCouponData.selectModelInfo.modelId
            },
            [`mulShopsInfo.${key}.exchangeCouponData.goodsInfo`]: goodsInfo,
          });
        } else { // 不使用兑换券
          _this.setData({
            [`mulShopsInfo.${key}.selectDiscountInfo`]: {
              title: "不使用优惠",
              name: '无',
              no_use_benefit: 1
            },
            [`mulShopsInfo.${key}.exchangeCouponData.dialogHidden`]: true,
            [`mulShopsInfo.${key}.exchangeCouponData.hasSelectGoods`]: false,
            [`mulShopsInfo.${key}.exchangeCouponData.voucher_coupon_goods_info`]: {},
          });
        }
      }
    });
    _this.getCalculationInfo();
  },
  toDeliveryList: function (e) {
    let _this = this;
    let url = '';
    let selectDelivery = {};
    let appId = typeof e === 'object' ? e.currentTarget.dataset.appId : _this.selectedAppId;
    if (this.isFranchisee) {
      let { mulShopsInfo } = _this.data;
      selectDelivery = mulShopsInfo[appId].selectDelivery;
    } else {
      selectDelivery = _this.data.selectDelivery;
    }
    if (_this.franchisee_id || appId) { // 子店或者多店中的子店
      url += '?franchiseeId=' + (this.isFranchisee ? `${appId}&isFranchisee=1` : _this.franchisee_id);
      url += selectDelivery.id ? '&deliveryId=' + selectDelivery.id : '';
    } else {
      url += selectDelivery.id ? '?deliveryId=' + selectDelivery.id : '';
    }
    if (this.data.onlyImmediatlyPickSwitch) {
      this.onlyImme = true;
    }
    app.turnToPage('/eCommerce/pages/goodsDeliveryList/goodsDeliveryList' + url);
  },
  closeMemberDiscount: function (e) {
    this.setData({
      hiddenTextarea: false
    })
  },
  showMemberDiscount: function (e) {
    this.setData({
      hiddenTextarea: true
    })
    let seletedDiscountInfo = {};
    let { appId, isLeague } = e.currentTarget.dataset;
    if (this.isFranchisee || (this.isFranchiseeCoupon && isLeague)) { // 多店/子店/总店
      let { mulShopsInfo, leagueBenefitData } = this.data;
      this.selectedAppId = appId;
      seletedDiscountInfo = isLeague ? leagueBenefitData.selectedBenefitInfo : mulShopsInfo[appId].selectDiscountInfo;
      this.setData({
        selectedAppId: appId || '',
        isLeagueBenefit: isLeague || '',
        changeShopAppId: appId || '',
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
    if (this.isFranchisee || (this.isFranchiseeCoupon && isLeagueBenefit)) { // 总店 子店 多店结算均可使用联盟券
      if (isLeagueBenefit) { // 联盟优惠
        this.setData({
          'leagueBenefitData.selectedBenefitInfo': event.detail.selectedDiscount,
        });
      } else { // 本店优惠
        if (event.detail.selectedDiscount.discount_type !== 'integral' && this.data.mulShopsInfo[this.selectedAppId].selectDiscountInfo.discount_type === 'integral') {
          let maxCanUseIntegral = this.shopIntegralRuleMap[this.selectedAppId]['can_use_integral'] - 0;
          this.userCanUseIntegral += maxCanUseIntegral;
          this.shopIntegralRuleMap[this.selectedAppId].is_use = false;
        }
        if (event.detail.selectedDiscount.discount_type === 'integral' && this.data.mulShopsInfo[this.selectedAppId].selectDiscountInfo.discount_type !== 'integral') {
          let maxCanUseIntegral = this.shopIntegralRuleMap[this.selectedAppId]['can_use_integral'] - 0;
          this.userCanUseIntegral -= maxCanUseIntegral;
          this.shopIntegralRuleMap[this.selectedAppId].is_use = true;
        }
        this.setData({
          [`mulShopsInfo.${this.selectedAppId}.selectDiscountInfo`]: event.detail.selectedDiscount,
          [`mulShopsInfo.${this.selectedAppId}.exchangeCouponData.hasSelectGoods`]: false,
          [`mulShopsInfo.${this.selectedAppId}.exchangeCouponData.voucher_coupon_goods_info`]: {},
        });
      }
    } else { // 单店
      this.setData({
        'hiddenTextarea': false,
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
    let { shopsList, mulShopsInfo } = this.data;
    if (this.isFranchisee) {
      deliveryArr = shopsList.map((shop) => {
        let suppInfoArr = [];
        let additionalInfoGoodsId = [];
        let goodsAdditionalInfo = [];
        shop.cartList.map((cart) => {
          let goodsInfo = cart.good_info;
          if (goodsInfo.delivery_id && goodsInfo.delivery_id != 0 && additionalInfoGoodsId.indexOf(goodsInfo.id) == -1) {
            suppInfoArr.push(goodsInfo.delivery_id);
            additionalInfoGoodsId.push(goodsInfo.id);
            goodsAdditionalInfo.push(goodsInfo);
          }
        });
        mulShopsInfo[shop.app_id]['additional_goodsid_arr'] = additionalInfoGoodsId;
        mulShopsInfo[shop.app_id]['goodsAdditionalInfo'] = goodsAdditionalInfo;
        mulShopsInfo[shop.app_id]['noAdditionalInfo'] = true;
        return {
          'app_id': shop.app_id,
          'delivery_id': suppInfoArr,
        }
      });
      deliveryArr = deliveryArr.filter((shop) => shop.delivery_id.length);
      this.setData({
        'mulShopsInfo': mulShopsInfo,
      });
    }
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=pc/AppShop/GetDelivery',
      method: 'post',
      data: {
        delivery_ids: suppInfoArr,
        delivery_arr: deliveryArr
      },
      success: function (res) {
        if (_this.isFranchisee) {
          let returnDataObj = res.data || {};
          Object.keys(returnDataObj).forEach((key) => {
            let additionalInfoList = returnDataObj[key];
            additionalInfoList.forEach((goodsItem) => {
              goodsItem.delivery_info.forEach((item) => {
                if (item.is_required == 0 && item.is_hidden == 1) { // 是否必填
                  _this.setData({
                    [`mulShopsInfo.${key}.hasRequiredSuppInfo`]: true,
                  });
                }
                if (item.is_hidden == 1) { // 是否没有补充信息
                  _this.setData({
                    [`mulShopsInfo.${key}.noAdditionalInfo`]: false
                  });
                }
              });
            });
            if (additionalInfoList[0].delivery_info.length == 1 && mulShopsInfo[key].additional_goodsid_arr.length == 1) {
              let deliveryIndex = 0;
              let showIndex = 0;
              additionalInfoList[0].delivery_info.forEach((item, index) => {
                if (item.is_hidden == 1) {
                  deliveryIndex++;
                  showIndex = index;
                }
              });
              if (deliveryIndex == 1) {
                let data = {};
                data[mulShopsInfo[key].additional_goodsid_arr[0]] = [];
                data[mulShopsInfo[key].additional_goodsid_arr[0]].push({
                  'title': additionalInfoList[0].delivery_info[showIndex].name,
                  'type': additionalInfoList[0].delivery_info[showIndex].type,
                  'is_required': additionalInfoList[0].delivery_info[showIndex].is_required,
                  'value': ''
                })
                _this.setData({
                  [`mulShopsInfo.${key}.additional_info`]: data,
                  [`mulShopsInfo.${key}.aloneDeliveryShow`]: true
                });
              }
            }
          });
        } else {
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
      }
    })
  },
  getLocation: function () {
    return new Promise((resolve, reject) => {
      let that = this;
      app.getLocation({
        type: 'gcj02',
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
  getInStore: function () {
    return new Promise((resolve, reject) => {
      const that = this;
      if (app.app_store_id) {
        return resolve();
      }
      app.sendRequest({
        url: '/index.php?r=AppEcommerce/getUserPrioritySelfDeliveryStore',
        data: {
          name: 'priority_self_delivery_shop',
          latitude: that.data.latitude || '',
          longitude: that.data.longitude || ''
        },
        chain: true,
        success: function (res) {
          if (res && res.data && res.data.config_data && res.data.config_data.app_store_id != 0) {
            app.app_store_id = res.data.config_data.app_store_id;
          }
        },
        complete: function(){
          resolve();
        }
      })
    })
  },
  getSelfDeliveryList: function () {
    let _this = this;
    let params = {};
    if (app.app_store_id != undefined && !this.isFranchisee && !this.franchisee_id) {
      params['self_delivery_app_store_id'] = app.app_store_id;
    }else if (_this.isFranchisee) {
      let { shopsList } = this.data;
      let shopParams = [];
      shopParams = shopsList.map((shop) => {
        return {
          'app_id': shop.app_id,
          'self_delivery_app_store_id': ''
        }
      });
      params['delivery_arr'] = shopParams;
    } else {
      params['sub_shop_app_id'] = this.franchisee_id || app.getChainId();
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/getSelfDeliveryList',
      method: 'post',
      data: params,
      success: function (res) {
        if (app.app_store_id != undefined && !_this.isFranchisee && !_this.franchisee_id) {
          let configData = res.data.self_delivery_setting;
          let storeList = res.data.store_list_data;
          if (storeList[0].region_data && storeList[0].region_data.country_region_id === 1) {
            storeList[0].region_data.region_string = storeList[0].region_data.region_string.replace(/\s+/g, "");
          }
          _this.calculateDistence(storeList[0]);
          _this.setData({
            selectDelivery: storeList[0],
            selfAppointmentSwitch: (configData.pick_up_time_status == 1 && configData.appointment.status == 1) ? true : false,
            onlyImmediatlyPickSwitch: (configData.pick_up_time_status == 1 && configData.appointment.status != 1 && configData.immediate_info.self_pcik_up_status == 1) ? true : false,
            selfDeliveryPhone: configData.is_phone,
            selfDeliveryScan: (configData.pick_up_time_status == 1 && configData.immediate_info.status == 1 && configData.immediate_info.scan_qrcode_status == 1) ? true : false,
            showWaitTime: configData.immediate_info.showWaitting  ==  1 ? true : false
          })
          _this.onlyAppointmentTime = (configData.pick_up_time_status == 1 && configData.appointment.status == 1 && configData.immediate_info.status == 0 ) ? true : false;
          if (_this.data.onlyImmediatlyPickSwitch && _this.data.selectDelivery) {
            _this.showServiceTime('onlyImme');
          }
        }else if (_this.isFranchisee) {
          let { mulShopsInfo } = _this.data;
          Object.keys(res.data).forEach((key) => {
            let storeList = res.data[key].store_list_data;
            if (!storeList) {
              app.showModal({
                content: '商家暂无自提门店',
                confirm: function () {
                  app.turnBack();
                }
              })
              return;
            }
            _this.calculateDistence(res.data[key].store_list_data[0]);
            mulShopsInfo[key]['selectDelivery'] = res.data[key].store_list_data[0];
          });
          _this.setData({
            mulShopsInfo: mulShopsInfo
          });
          _this.getGoodsStoreSet(3);
        } else {
          let storeList = res.data.store_list_data
          if (!storeList) {
            app.showModal({
              content: '商家暂无自提门店',
              confirm: function () {
                app.turnBack();
              }
            })
            return;
          }
          if (storeList[0].region_data && storeList[0].region_data.country_region_id === 1) {
            storeList[0].region_data.region_string = storeList[0].region_data.region_string.replace(/\s+/g, "");
          }
          _this.calculateDistence(storeList[0]);
          _this.setData({
            selectDelivery: storeList[0]
          })
          _this.getGoodsStoreSet(3);
        }
      }
    })
  },
  calculateDistence: function(storeInfo) {
    if(this.data.latitude && this.data.longitude) {
      let distance = parseInt(app.calculationDistanceByLatLng(
        this.data.latitude,
        this.data.longitude,
        storeInfo.latitude,
        storeInfo.longitude
      ));
      storeInfo.distanceText = distance > 1000 ? (distance / 1000).toFixed(1) + 'km' : distance + 'm';
    }
  },
  inputFormControl: function (e) {
    let { appId } = e.currentTarget.dataset;
    if (appId) { // 多店
      let { mulShopsInfo } = this.data;
      let a = mulShopsInfo[appId].additional_info;
      let b = mulShopsInfo[appId].additional_goodsid_arr[0];
      a[b][0].value = e.detail.value;
      this.setData({
        [`mulShopsInfo.${appId}.additional_info`]: a
      });
    } else { // 单店
      let a = this.data.additional_info;
      let b = this.data.additional_goodsid_arr[0];
      a[b][0].value = e.detail.value
      this.setData({
        additional_info: a
      })
    }
  },
  addDeliveryImg: function (e) {
    let { appId } = e.currentTarget.dataset;
    let _this = this;
    let info = '';
    let id = '';
    let setDataObj = {};
    if (appId) {
      let { mulShopsInfo } = this.data;
      info = mulShopsInfo[appId].additional_info;
      id = mulShopsInfo[appId].additional_goodsid_arr[0];
    } else {
      info = this.data.additional_info;
      id = this.data.additional_goodsid_arr[0];
    }
    let images = info[id][0].value || [];
    app.chooseImage((image) => {
      info[id][0].value = images.concat(image);
      if (appId) {
        setDataObj[`mulShopsInfo.${appId}.additional_info`] = info;
      } else {
        setDataObj['additional_info'] = info;
      }
      _this.setData(setDataObj);
    }, 9 - info[id][0].value.length);
  },
  deleteImage: function (e) {
    let { appId, imageIndex } = e.currentTarget.dataset;
    let _this = this;
    let info = '';
    let id = '';
    if (appId) {
      let { mulShopsInfo } = this.data;
      info = mulShopsInfo[appId].additional_info;
      id = mulShopsInfo[appId].additional_goodsid_arr[0];
    } else {
      info = this.data.additional_info;
      id = this.data.additional_goodsid_arr[0];
    }
    let images = info[id][0].value;
    images.splice(imageIndex, 1);
    info[id][0].value = images;
    if (appId) {
      _this.setData({
        [`mulShopsInfo.${appId}.additional_info`]: info,
      });
    } else {
      _this.setData({
        additional_info: info
      });
    }
  },
  closeGoodsPick: function () {
    let ori_pick_up_type = this.data.ori_pick_up_type;
    this.setData({
      isShowPickMask: false,
      isShowServiceTime: false,
      isShowSameJourneyTime: false,
      is_addDishing: this.data.ori_pick_up_type == 4 && this.data.is_addDishing
    })
  },
  confirmGoodsPick: function () {
    this.setData({
      isShowPickMask: false,
      ori_pick_up_type: this.data.pickUpType
    })
  },
  selectPickMethod: function (first) {
    let _this = this;
    let cartIdArr = this.cart_id_arr;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getCanUsePickUpTypeAtAddOrder',
      method: 'post',
      data: {
        cart_id_arr: cartIdArr,
        sub_shop_app_id: _this.franchisee_id,
        user_gift_card_id: _this.user_gift_card_id || '',
      },
      success: function (res) {
        const { goods_pick_up_type_arr, intra_city_data, dining_data, express_data } = res.data;
        let pickUpType = _this.data.pickUpType;
        if (!pickUpType || pickUpType === -1) {
          if (goods_pick_up_type_arr[0] == 2 && goods_pick_up_type_arr[1] && (intra_city_data.is_enough_price != 1)) {
            pickUpType = goods_pick_up_type_arr[1];
          } else {
            pickUpType = goods_pick_up_type_arr[0];
          }
        }
        if(goods_pick_up_type_arr.indexOf('5') >= 0){
          goods_pick_up_type_arr.splice(goods_pick_up_type_arr.indexOf(5), 1);
        }
        _this.setData({
          pickUpType,
          dining_data,
          express_data,
          pickUpTypeArr: goods_pick_up_type_arr,
          intraCityData: intra_city_data,
          isShowPickMask: first == 'first' ? false : true,
          ori_pick_up_type: !_this.data.pickUpType || _this.data.pickUpType == -1 ? goods_pick_up_type_arr[0] : _this.data.pickUpType,
        })
        if (first == 'first') {
          switch (_this.data.pickUpType) {
            case '4':
              _this.getDiningFuncSetting(_this.getDiningData);
              break;
            case '3':
              if (!_this.isFranchisee) {
                _this.getLocation().then(() => {
                  return _this.getInStore();
                }).then(() => {
                  _this.getSelfDeliveryList();
                });
              }
              break;
          }
          if(!_this.isFranchisee && _this.data.pickUpType == 2) {
            _this.showSameJourneyTime('onlyImme');
          }
          _this.data.pickUpType != 4 && _this.getCalculationInfo();
          if (_this.data.pickUpType !== 3 && goods_pick_up_type_arr.indexOf('3') !== -1){
            _this.getLocation().then(() => {
              _this.getInStore();
            })
          }
        }
      }
    });
  },
  showServiceTime: function (type) {
    let _this = this;
    let deliveryData = {};
    let appId = typeof type === 'object' ? type.currentTarget.dataset.appId : this.selectedAppId;
    this.selectedAppId = appId || '';
    let { mulShopsInfo } = this.data;
    if (this.isFranchisee) {
      deliveryData = mulShopsInfo[appId].selectDelivery;
      this.setData({
        selectedAppId: appId,
      });
    } else {
      deliveryData = this.data.selectDelivery;
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetEcTostoreAppointmentDateList',
      data: {
        app_id: appId ? appId : app.getAppId(),
        _app_id: appId ? appId : app.getAppId(),
        sub_shop_app_id: _this.isFranchisee ? appId : _this.franchisee_id,
        self_delivery_app_store_id: deliveryData.id || '',
      },
      success: function (res) {
        let data = res.data;
        if (type == 'onlyImme') {
          if (_this.isFranchisee) {
            _this.setData({
              [`mulShopsInof.${_this.selectedAppId}.waitingQueueTime`]: data.duration_time,
              [`mulShopsInof.${_this.selectedAppId}.tostoreOrderType`]: 1,
            });
            return;
          } else {
            _this.setData({
              waitingQueueTime: data.duration_time,
              tostoreOrderType: 1
            })
            return;
          }
        }
        let tostoreTimeType = data.setting_data.appointment.appointment_time_type; //1为天 2为时 3为半小时
        let tostoreDateTime = _this.isFranchisee ? mulShopsInfo[_this.selectedAppId].tostoreDateTime : _this.data.tostoreDateTime;
        let tostoreHoursArr;  
        let dateArr = data.date_arr;
        let advanceAppointmentInfo = data.setting_data.appointment.advance_appointment_info;
        let noImmediaPick = data.setting_data.immediate_info.status == 1 ? true : false; //判断上门自提立即取货开关开没开
        let noAppointmentShow = true; //是否显示暂无营业时间
        if (noImmediaPick == 1 && tostoreTimeType != 1 && dateArr.length){
          dateArr[0].is_vaild = 1
        }
        for (let item of dateArr){
          if (item.is_vaild == 1) {
            noAppointmentShow = false;
          }
          if (!tostoreDateTime && item.is_vaild == 1 && tostoreTimeType != 1) {
            tostoreDateTime = item.date;
          } 
          if (tostoreDateTime == item.date) {
            tostoreHoursArr = item.duration;
          }
        }
        if (_this.isFranchisee) {
          _this.setData({
            [`mulShopsInfo.${appId}.getEcTostoredate`]: data,
            [`mulShopsInfo.${appId}.waitingQueueTime`]: data.duration_time,
            [`mulShopsInfo.${appId}.tostoreTimeType`]: tostoreTimeType,
            [`mulShopsInfo.${appId}.noImmediaPick`]: noImmediaPick,
            [`mulShopsInfo.${appId}.tostoreDateTime`]: tostoreDateTime,
            [`mulShopsInfo.${appId}.tostoreHoursArr`]: tostoreHoursArr,
            [`mulShopsInfo.${appId}.advanceAppointmentInfo`]: advanceAppointmentInfo,
            [`mulShopsInfo.${appId}.noAppointmentShow`]: noAppointmentShow,
            'isShowServiceTime': true,
          });
        } else {
          _this.setData({
            getEcTostoredate: data,
            waitingQueueTime: data.duration_time,
            tostoreTimeType: tostoreTimeType,
            noImmediaPick: noImmediaPick,
            tostoreDateTime: tostoreDateTime,
            tostoreHoursArr, tostoreHoursArr,
            advanceAppointmentInfo: advanceAppointmentInfo,
            noAppointmentShow: noAppointmentShow,
            isShowServiceTime: true,
          });
        }
        noAppointmentShow && _this.getNoAppointmentWord();
      }
    });
  },
  getNoAppointmentWord: function () {
    let a = '商家营业时间：';
    let b = '';
    let dataObj = {};
    if (this.isFranchisee) {
      dataObj = this.data.mulShopsInfo[this.selectedAppId]
    } else {
      dataObj = this.data;
    }
    if (this.data.pickUpType != 2 && this.data.pickUpType != 3) {
      return
    }
    let businessTimeRule = dataObj.businessTimeRule;
    businessTimeRule.map((item) => {
      for (let i = 0; i < item.business_week.length; i++) {
        if (item.business_week[i] == 1) {
          switch (i) {
            case 0:
              a += '周一、';
              break;
            case 1:
              a += '周二、';
              break;
            case 2:
              a += '周三、';
              break;
            case 3:
              a += '周四、';
              break;
            case 4:
              a += '周五、';
              break;
            case 5:
              a += '周六、';
              break;
            case 6:
              a += '周日、';
              break;
          }
        }
      }
      item.business_time_interval.map((item) => {
        a += item.start_time + '-' + item.end_time + ' ';
      })
    })
    let appointment = this.data.pickUpType == 2 ? dataObj.sameJourneyConfig.appointment_setting_data : dataObj.getEcTostoredate.setting_data.appointment;
    let advanceInfo = appointment.advance_appointment_info;
    switch (advanceInfo.type) {
      case '1':
        b += '无需提前，';
        break;
      case '2':
        b += '需提前' + advanceInfo.num + '小时，';
        break;
      case '3':
        b += '需提前' + advanceInfo.num + '天，';
        break;
    }
    b += '最多可预约' + appointment.valid_days + '天内时间';
    if (this.isFranchisee) {
      this.setData({
        [`mulShopsInfo.${this.selectedAppId}.noAppointmentWorda`]: a,
        [`mulShopsInfo.${this.selectedAppId}.noAppointmentWordb`]: b,
      });
    } else {
      this.setData({
        noAppointmentWorda: a,
        noAppointmentWordb: b
      });
    }
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
        if (that.isFranchisee) {
          let { mulShopsInfo } = that.data;
          Object.keys(mulShopsInfo).forEach((key) => {
            let shopItem = mulShopsInfo[key];
            shopItem['phone'] = res.data;
          });
          that.setData({
            mulShopsInfo: mulShopsInfo
          });
        } else {
          that.setData({
            phone: res.data
          });
        }
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
    if (this.isFranchisee) {
      let { appId } = e.currentTarget.dataset;
      let { mulShopsInfo } = this.data;
      Object.keys(mulShopsInfo).forEach((key) => {
        let shopItem = mulShopsInfo[key];
        if (!shopItem.phone) {
          shopItem.phone = e.detail.model_value;
        }
      });
      this.setData({
        mulShopsInfo: mulShopsInfo,
      });
    } else {
      this.setData({
        phone: e.detail.value
      });
    }
  },
  getInStoreSeat: function () {
    var _this = this;
    wx.scanCode({
      success: function (res) {
        let path = res.path;
        let locationId = path.split(/\?location_id=/)[1];
        app.sendRequest({
          url: '/index.php?r=AppEcommerce/getEcLocationData',
          data: {
            id: locationId,
            sub_shop_app_id: _this.franchisee_id || app.getChainId()
          },
          success: function (res) {
            if (res.data.status == 0) {
              _this.setData({
                locationId: locationId,
                inStoreSeatName: res.data.title
              })
            } else {
              app.showModal({
                content: '未检索到座位号'
              })
            }
          }
        })
      },
      fail: function (res) {
        app.showModal({
          content: '未检索到座位号'
        })
      }
    })
  },
  goSameJourneyAddress: function (e) {
    this.setData({
      pickUpType: 2
    })
    let selectSameJourney = this.data.selectSameJourney;
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/goodsSameJourney/goodsSameJourney?from=preview&sameJourneyId=' + (selectSameJourney ? selectSameJourney.id : '') + '&franchiseeId=' + this.franchisee_id);
  },
  getGoodsStoreSet: function (type) {
    let _this = this;
    let params = {};
    if (_this.isFranchisee) {
      let { shopsList } = this.data;
      params['app_data_arr'] = shopsList.map((shop) => {
        return {
          'app_id': shop.app_id,
          'pick_up_type': type
        };
      });
    } else {
      params = {
        'pick_up_type': type,
        'sub_shop_app_id': this.franchisee_id
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getPickUpGoodsTypeSetting',
      method: 'post',
      data: params,
      success: function (res) {
        if (_this.isFranchisee) {
          if (type == 3) {
            let { mulShopsInfo } = _this.data;
            Object.keys(res.data).forEach((key) => {
              let configData = res.data[key].config_data;
              mulShopsInfo[key]['selfAppointmentSwitch'] = (configData.pick_up_time_status == 1 && configData.appointment.status == 1) ? true : false;
              mulShopsInfo[key]['onlyImmediatlyPickSwitch'] = (configData.pick_up_time_status == 1 && configData.appointment.status != 1 && configData.immediate_info.self_pcik_up_status == 1) ? true : false,
                mulShopsInfo[key]['selfDeliveryPhone'] = configData.is_phone;
              mulShopsInfo[key]['selfDeliveryScan'] = (configData.pick_up_time_status == 1 && configData.immediate_info.status == 1 && configData.immediate_info.scan_qrcode_status == 1) ? true : false;
              if (mulShopsInfo[key].onlyImmediatlyPickSwitch) {
                _this.selectedAppId = key;
                _this.showServiceTime('onlyImme');
              }
            });
            _this.setData({
              mulShopsInfo: mulShopsInfo
            });
          }
        } else {
          let configData = res.data.config_data;
          if (type == 3 && configData) {
            _this.setData({
              selfAppointmentSwitch: (configData.pick_up_time_status == 1 && configData.appointment.status == 1) ? true : false,
              onlyImmediatlyPickSwitch: (configData.pick_up_time_status == 1 && configData.appointment.status != 1 && configData.immediate_info.self_pcik_up_status == 1) ? true : false,
              selfDeliveryPhone: configData.is_phone,
              selfDeliveryScan: (configData.pick_up_time_status == 1 && configData.immediate_info.status == 1 && configData.immediate_info.scan_qrcode_status == 1) ? true : false,
              showWaitTime: configData.immediate_info.showWaitting  ==  1 ? true : false
            })
            if (_this.data.onlyImmediatlyPickSwitch) {
              _this.showServiceTime('onlyImme');
            }
          } else if (type == 4) {
            _this.setData({
              app_store_data: res.data.app_store_data || ''
            })
          }
        }
      }
    })
  },
  tostoreImmediately: function (e) {
    let setDataObj = {};
    if (this.isFranchisee) {
      let { appId } = e.currentTarget.dataset;
      setDataObj[`mulShopsInfo.${appId}.tostoreOrderType`] = 1;
      setDataObj[`mulShopsInfo.${appId}.tostoreHourTime`] = '';
      setDataObj[`isShowServiceTime`] = false;
    } else {
      setDataObj[`tostoreOrderType`] = 1;
      setDataObj[`tostoreHourTime`] = '';
      setDataObj[`isShowServiceTime`] = false;
    }
    this.setData(setDataObj);
  },
  selectTostoreTime: function (e) {
    let _this = this;
    let { mulShopsInfo } = this.data;
    let dateArr = this.isFranchisee ? mulShopsInfo[this.selectedAppId].getEcTostoredate.date_arr : this.data.getEcTostoredate.date_arr;
    let index = e.currentTarget.dataset.index;
    let tostoreDateTime = dateArr[index].date;
    let tostoreHoursArr = dateArr[index].duration;
    if (this.isFranchisee) {
      this.setData({
        [`mulShopsInfo.${this.selectedAppId}.tostoreOrderType`]: 2,
        [`mulShopsInfo.${this.selectedAppId}.dateIndex`]: index,
        [`mulShopsInfo.${this.selectedAppId}.tostoreHoursArr`]: tostoreHoursArr,
        [`mulShopsInfo.${this.selectedAppId}.tostoreDateTime`]: tostoreDateTime,
        [`mulShopsInfo.${this.selectedAppId}.tostoreHourTime`]: '',
        'isShowServiceTime': mulShopsInfo[_this.selectedAppId].tostoreTimeType != 1 ? true : false
      });
    } else {
      this.setData({
        tostoreOrderType: 2,
        dateIndex: index,
        tostoreHoursArr,
        tostoreDateTime,
        tostoreHourTime: '',
        isShowServiceTime: this.data.tostoreTimeType != 1 ? true : false
      })
    }
  },
  selectTostoreHourTime: function (e) {
    let _this = this;
    let tostoreHoursArr = [];
    if (this.isFranchisee) {
      let { mulShopsInfo } = this.data;
      tostoreHoursArr = mulShopsInfo[this.selectedAppId].tostoreHoursArr;
    } else {
      tostoreHoursArr = this.data.tostoreHoursArr;
    }
    let index = e.currentTarget.dataset.index;
    let tostoreHourTime = tostoreHoursArr[index];
    if (this.isFranchisee) {
      this.setData({
        [`mulShopsInfo.${_this.selectedAppId}.tostoreOrderType`]: 2,
        [`mulShopsInfo.${_this.selectedAppId}.tostoreHourTime`]: tostoreHourTime,
        isShowServiceTime: false,
      });
    } else {
      this.setData({
        tostoreOrderType: 2,
        tostoreHourTime: tostoreHourTime,
        isShowServiceTime: false
      });
    }
  },
  showSameJourneyTime: function (type) {
    let _this = this;
    let appId = typeof type === 'object' ? type.currentTarget.dataset.appId : this.selectedAppId;
    let dataObj = {};
    if (this.isFranchisee) {
      let { mulShopsInfo } = this.data;
      dataObj = mulShopsInfo[appId] || {};
    } else {
      dataObj = this.data;
    }
    let sameJourneyData = this.data.selectSameJourney || {};
    if (!sameJourneyData.id && type != 'onlyImme') {
      app.showModal({
        content: '请先选择地址'
      })
      return
    }
    this.selectedAppId = appId || '';
    this.setData({
      selectedAppId: appId
    })
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getIntraCityAppointmentDateList',
      data: {
        app_id: appId ? appId : app.getAppId(),
        _app_id: appId ? appId : app.getAppId(),
        sub_shop_app_id: _this.isFranchisee ? appId : _this.franchisee_id,
        longitude: sameJourneyData.latitude || 1,
        latitude: sameJourneyData.longitude || 10
      },
      success: function (res) {
        let data = res.data;
        let { appointment_setting_data } = data;
        let sameJourneyTimeType = 3;
        let sameJourneyDateTime = _this.isFranchisee ? dataObj.sameJourneyDateTime : _this.data.sameJourneyDateTime;
        let sameJourneyHoursArr;
        let dateArr = data.date_arr;
        let advanceAppointmentInfo = appointment_setting_data.advance_appointment_info || { type: 3, num: 1 };
        let businessTimeRule = data.business_time_rule; // 门店的营业时间
        let sameJourneyImmediatelyState = 1;
        let noAppointmentShow = appointment_setting_data.status == 1;     // 是否显示暂无营业时间
        sameJourneyTimeType = appointment_setting_data.status == 1 ? appointment_setting_data.appointment_time_type : 3;
        if (_this.data.intraCityData.in_business_time == 0 || (appointment_setting_data.status == 1 && advanceAppointmentInfo.type != 1))  {
          sameJourneyImmediatelyState =  0;
        }
        for (let i = 0; i < dateArr.length; i++) {
          if (dateArr[i].is_vaild == 1) {
            noAppointmentShow = false;
          }
          if (!sameJourneyDateTime && dateArr[i].is_vaild == 1 && sameJourneyTimeType != 1) {
            sameJourneyDateTime = dateArr[i].date;
          }
          if (sameJourneyDateTime == dateArr[i].date) {
            sameJourneyHoursArr = dateArr[i].duration;
          }
        }
        _this.businessTimeType = businessTimeRule.type;
        if (_this.isFranchisee) {
          _this.setData({
            [`mulShopsInfo.${appId}.sameJourneyConfig`]: data,
            [`mulShopsInfo.${appId}.sameJourneyTimeType`]: sameJourneyTimeType,
            [`mulShopsInfo.${appId}.sameJourneyDateTime`]: sameJourneyDateTime,
            [`mulShopsInfo.${appId}.sameJourneyHoursArr`]: sameJourneyHoursArr,
            [`mulShopsInfo.${appId}.businessTimeRule`]: businessTimeRule.type == 1 ? '' : businessTimeRule.custom.business_time,
            [`mulShopsInfo.${appId}.advanceAppointmentInfo`]: advanceAppointmentInfo,
            [`mulShopsInfo.${appId}.noAppointmentShow`]: noAppointmentShow,
            [`mulShopsInfo.${appId}.sameJourneyImmediatelyState`]: type == 'onlyImme' ? sameJourneyImmediatelyState : dataObj.sameJourneyImmediatelyState,
            'isShowSameJourneyTime': type != 'onlyImme' && appointment_setting_data.status == 1,
          });
        } else {
          _this.setData({
            sameJourneyConfig: data,
            sameJourneyTimeType,
            sameJourneyDateTime,
            sameJourneyHoursArr,
            businessTimeRule: businessTimeRule.type == 1 ? '' : businessTimeRule.custom.business_time,
            advanceAppointmentInfo: advanceAppointmentInfo,
            noAppointmentShow: noAppointmentShow,
            sameJourneyImmediatelyState: type == 'onlyImme' ? sameJourneyImmediatelyState : _this.data.sameJourneyImmediatelyState,
            isShowSameJourneyTime: type != 'onlyImme' && appointment_setting_data.status == 1,
          });
        }
        noAppointmentShow && _this.getNoAppointmentWord();
      }
    });
  },
  selectSameJourneyTime: function (e) {
    let { mulShopsInfo } = this.data;
    let dateArr = this.isFranchisee ? mulShopsInfo[this.selectedAppId].sameJourneyConfig.date_arr : this.data.sameJourneyConfig.date_arr;
    let index = e.currentTarget.dataset.index;
    let sameJourneyDateTime = dateArr[index].date;
    let sameJourneyHoursArr = dateArr[index].duration
    if (this.isFranchisee) {
      this.setData({
        [`mulShopsInfo.${this.selectedAppId}.dateIndex`]: index,
        [`mulShopsInfo.${this.selectedAppId}.sameJourneyDateTime`]: sameJourneyDateTime,
        [`mulShopsInfo.${this.selectedAppId}.sameJourneyHoursArr`]: sameJourneyHoursArr,
        [`mulShopsInfo.${this.selectedAppId}.sameJourneyHourTime`]: '',
      });
    } else {
      this.setData({
        dateIndex: index,
        sameJourneyDateTime,
        sameJourneyHoursArr,
        sameJourneyHourTime: ''
      })
    }
  },
  selectSameJourneyTimeHour: function (e) {
    let { type, index } = e.currentTarget.dataset;
    if (this.isFranchisee) {
      let { mulShopsInfo, selectedAppId } = this.data;
      let sameJourneyHoursArr = mulShopsInfo[selectedAppId].sameJourneyHoursArr;
      let sameJourneyHourTime = sameJourneyHoursArr[index];
      this.setData({
        [`mulShopsInfo.${selectedAppId}.sameJourneyImmediatelyState`]: type == 'immedia' ? 1 : 2,
        [`mulShopsInfo.${selectedAppId}.sameJourneyHourTime`]: type == 'immedia' ? '' : sameJourneyHourTime,
        isShowSameJourneyTime: false,
      });
    } else {
      let sameJourneyHoursArr = this.data.sameJourneyHoursArr;
      let index = e.currentTarget.dataset.index;
      let sameJourneyHourTime = sameJourneyHoursArr[index];
      this.setData({
        sameJourneyImmediatelyState: type == 'immedia' ? 1 : 2,
        sameJourneyHourTime: type == 'immedia' ? '' : sameJourneyHourTime,
        isShowSameJourneyTime: false
      });
    }
  },
  inputPhone: function (e) {
    if (this.isFranchisee) {
      let { appId } = e.currentTarget.dataset;
      let { mulShopsInfo } = this.data;
      Object.keys(mulShopsInfo).forEach((key) => {
        let shopItem = mulShopsInfo[key];
        if (key == appId) {
          shopItem['phone'] = e.detail.value;
        }
      });
      this.setData({
        mulShopsInfo: mulShopsInfo,
      });
    } else {
      this.setData({
        phone: e.detail.value
      });
    }
  },
  hidePerfectAddress: function () {
    this.setData({
      expressAddressNull: false
    })
  },
  manuallyAddAddress: function () {
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/addAddress/addAddress');
  },
  importWeChatAddress: function () {
    let _this = this;
    app.chooseAddress({
      success: function (res) {
        app.sendRequest({
          method: 'post',
          url: '/index.php?r=AppShop/AddWxAddress',
          data: {
            detailInfo: res.detailInfo || '',
            cityName: res.cityName || '',
            provinceName: res.provinceName || '',
            UserName: res.userName || '',
            telNumber: res.telNumber || '',
            district: res.district || '',
            countyName: res.countyName || ''
          },
          success: function () {
            _this.getCalculationInfo();
          }
        })
      }
    })
  },
  stopPropagation: function () {
  },
  showMoreGoods: function () {
    this.setData({
      showMoreGoods: !this.data.showMoreGoods
    })
  },
  needLoopRequest: true,
  loopRequestMultiOrder: function () {
    let that = this;
    this.timerId == 0 && this.getMultiOrder();
    clearTimeout(this.timerId);
    this.timerId = setTimeout(() => {
      that.getMultiOrder();
    }, 4000)
  },
  requestNum: 0,  // 请求次数
  getMultiOrder: function () {
    let that = this
    if (!that.needLoopRequest) return;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getMultiOrderingVerticalCart',
      data: {
        sub_shop_app_id: this.franchisee_id,
        location_id: this.data.ec_location_id,
        get_user_list: 1
      },
      hideLoading: true,
      success: function (res) {
        that.needLoopRequest = false;
        if (res.is_notice) {   // true 已下单
          clearTimeout(that.timerId);
          app.showModal({
            content: "您的同桌" + res.buyer_nickname + '已下单',
            confirmText: '知道了',
            confirm: function () {
              app.turnBack();
            }
          })
          return;
        } else if (res.is_reload) {  // true 购物车已改变
          if (res.data.length == 0) {
            clearTimeout(that.timerId);
            app.showModal({
              content: '商品被清空，请重新添加',
              confirmText: '知道了',
              confirm: function () {
                app.turnBack();
              }
            })
            return;
          }
        }
        that.loopRequestMultiOrder();
        if (!res.is_reload && that.requestNum > 0) return; // is_reload第一次请求有可能不是true 那么就可能不会渲染页面
        that.requestNum += 1;
        that.is_reload = res.is_reload;
        that.cart_data_arr = []; // 清空购物车数据
        that.cart_id_arr = [];  // 清空购物车id
        let buyer_list = res.buyer_info;
        let user_list = res.user_list;
        var data = [];
        data = res.data;
        for (let w = 0; w < user_list.length; w++) {
          if (user_list[w].is_myself == 1) {
            that.setData({
              my_self: user_list[w].buyer_id
            })
          }
        }
        for (var i = 0; i <= data.length - 1; i++) {
          var goods = data[i],
            modelArr = goods.model_value;
          goods.model_value_str = modelArr && modelArr.join ? modelArr.join('； ') : '';
          that.cart_data_arr.push({
            cart_id: goods.id,
            goods_id: goods.goods_id,
            model_id: goods.model_id,
            num: goods.num
          });
          goods.buyer_id == that.data.my_self ? that.cart_id_arr_my.push(data[i].id) : '';
          that.cart_id_arr.push(goods.id) // 多人购物车id_array
          if (goods.is_package_goods == 1) {
            goods.showPackageInfo = false;
          }
          if (!Array.isArray(goods.package_goods)) {
            goods.package_goods = [];
          }
          if (goods.attributes) {
            for (let attr in goods.attributes) {
              for (let _goods in goods.attributes[attr].goods_list) {
                goods.package_goods.push(goods.attributes[attr].goods_list[_goods]);
              }
            }
          }
        }
        for (let a = 0; a < buyer_list.length; a++) {
          let num = 0;
          let buyer = buyer_list[a];
          for (let b = 0; b < data.length; b++) {
            let goods = data[b];
            if (goods.buyer_id == buyer.buyer_id) {
              num += goods.num - 0;
              buyer.num = num;
            }
          }
        }
        that.setData({
          buyer_list: res.buyer_info,
          goodsList: data,
          only_me: false
        });
        data.length && that.getCalculationInfo();
      },
      fail: function () {
        app.showModal({
          content: '网络异常，请重新下单',
          confirm: function () {
            app.turnBack();
          }
        })
      },
      complete: function (re) {
        that.needLoopRequest = true;
      }
    })
  },
  getDiningFuncSetting: function (callback) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getFuncSetting',
      data: {
        sub_shop_app_id: this.franchisee_id,
        ordering_food_type: 1, //1.堂食 2.预约
        pick_up_type: 4
      },
      success: function (res) {
        if (!res.data) {
          app.showModal({
            content: '该店铺未设置堂食点餐，请设置后重试',
            confirm: function () {
              app.turnBack();
            }
          })
          return;
        }
        let arr = res.data.take_meal_type || [];
        let brr = [];
        for (let i = 0; i < arr.length; i++) {
          brr.push({
            idx: arr[i],
            text: that.data.take_meal_type_text[arr[i]]
          })
        }
        that.path = res.data.add_dish_info.page || '',
          that.setData({
            take_meal_type: arr[0],
            take_meal_type_arr: brr,
            location_status: res.data.location_status == 0 ? false : true,
            account_type: res.data.account_info.account_type,
            allow_add_dish: res.data.add_dish_info.allow_app_status == 1 ? true : false,
            allow_app_account: res.data.account_info.account_way[1] ? true : false,
            input_location_type: res.data.input_location_type || [1]
          })
        that.getGoodsStoreSet(4);
        typeof callback == 'function' && callback();
      }
    })
  },
  checkIsAddDishing: function () {
    let that = this;
    if (that.data.account_type == 1) {
      that.data.is_together ? that.loopRequestMultiOrder() : that.getCalculationInfo();
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/CheckLocationIsEmpty',
      data: {
        location_id: this.data.ec_location_id,
      },
      success: function (res) {
        that.setData({
          is_addDishing: !res.data,
          people_num: !res.data ? 0 : that.data.people_num,
        })
        if (res.ec_dining_data) {
          if (res.ec_dining_data.dining_mode) {
            that.setData({
              dining_mode: res.ec_dining_data.dining_mode
            })
          }
          if (res.ec_dining_data.take_meal_type) {
            that.setData({
              take_meal_type: res.ec_dining_data.take_meal_type
            })
          }
        }
        that.data.is_together ? that.loopRequestMultiOrder() : that.getCalculationInfo();
      }
    })
  },
  turnToAddDish: function () {
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
  selectCustomNum: function (e) {
    let people_num = e.detail.value - 0;
    this.setData({
      people_num: people_num + 1
    })
    this.getCalculationInfo();
  },
  scanPlaceInfo: function (e) {
    let that = this;
    this.saveFormId(e.detail.formId);
    app.scanCode({
      success: function (res) {
        let path = res.path;
        if (!path) {
          app.showModal({
            content: '位置码错误，请重新扫码!',
            confirmText: '知道了'
          })
          return;
        }
        let args = path.split('?');
        if (args[0] == path) {
          return '';
        }
        let arr = args[1].split('&');
        let obj = {};
        for (let i = 0; i < arr.length; i++) {
          let arg = arr[i].split('=');
          obj[arg[0]] = arg[1];
        }
        let pre_location_id = that.data.ec_location_id;
        that.setData({ showTable: false });
        that.scanInitUserInfo(pre_location_id, obj.ec_location_id, that.checkIsAddDishing);
      },
      fail: function (re) {
        console.log(re)
      }
    });
  },
  scanInitUserInfo: function (pre_location_id, ec_location_id, callback) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/scanQrcodeInitCartUserInfo',
      data: {
        sub_shop_app_id: this.franchisee_id,
        pre_location_id: pre_location_id || '',
        location_id: ec_location_id || this.data.ec_location_id,
        cart_id_arr: this.cart_id_arr_my
      },
      method: 'post',
      success: function (res) {
        if (res.status == 0) {
          if (that.franchisee_id) {
            app.globalData[that.franchisee_id] = {};
            app.globalData[that.franchisee_id].ec_location_id = ec_location_id;
          } else {
            app.globalData.ec_location_id = ec_location_id; // 更新全局座位id
          }
          that.setData({
            ec_location_id: ec_location_id,
            location_name: res.data.location_title || ''
          })
          typeof callback == 'function' && callback(that.getCalculationInfo);
        }
      },
      successStatusAbnormal: function (res) {
        if (res.status == 1) {
          that.data.ec_location_id && that.data.is_together && that.loopRequestMultiOrder();
        }
      }
    })
  },
  changeTakeMealType: function (e) {
    let value = +e.detail.value;
    this.setData({
      take_meal_type_index: value,
      take_meal_type: this.data.take_meal_type_arr[value].idx
    })
    this.getCalculationInfo();
  },
  changeDiningMode: function (e) {
    let value = +e.detail.value;
    this.setData({
      dining_mode: value + 1
    })
    this.getCalculationInfo();
  },
  changeCustomNum: function (e) {
    let value = +e.detail.value;
    this.setData({
      people_num: value + 1
    })
    this.getCalculationInfo();
  },
  turnToStore: function () { },
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
  checkedPickRadioFn: function (e) {
    let type = e.currentTarget.dataset.type - 0;
    if (type == this.data.pickUpType) return;
    this.setData({
      is_addDishing: type == 4 && this.data.is_addDishing
    })
    this.switchWayDataInitial(type);
  },
  switchWayDataInitial: function (type) {
    this.setData({
      pickUpType: type,
      selectDiscountInfo: {},
      sameJourneyTimeType: 3,
      cashOnDelivery: false
    })
    if (type == 2) {
      this.showSameJourneyTime('onlyImme');
    } else if (type == 3) {
      this.getSelfDeliveryList();
    } else if (type == 4) {  // 点餐
      this.getDiningFuncSetting(this.getDiningData);
    }
    type != 4 && this.getCalculationInfo();
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
  cancelDelete: function() {
    this.addWechatAddress();
    this.setData({ showNoneAddress : false});
  },
  sureDeleteGoods: function() {
    this.isFromSelectAddress = true;
    this.setData({ showNoneAddress: false });
    app.turnToPage('/eCommerce/pages/addAddress/addAddress');
  },
  addWechatAddress: function() {
    let _this = this;
    app.chooseAddress({
      success: function (res) {
        app.sendRequest({
          method: 'post',
          url: '/index.php?r=AppShop/AddWxAddress',
          data: {
            detailInfo: res.detailInfo || '',
            cityName: res.cityName || '',
            provinceName: res.provinceName || '',
            UserName: res.userName || '',
            telNumber: res.telNumber || '',
            district: res.district || '',
            countyName: res.countyName || ''
          },
          success: function () {
            _this.getCalculationInfo();
          }
        })
      },
      fail: function() {
        _this.getCalculationInfo();
      }
    })
  },
  clickSelectShops: function(e) {
    let { appId } = e.currentTarget.dataset;
    let hasSelected = this.data.mulShopsInfo[appId].selected;
    this.setData({
      [`mulShopsInfo.${appId}.selected`]: !hasSelected
    });
  },
  mulShopsExchangeCouponHideDialog: function () {
    let _this = this;
    let { mulShopsInfo } = this.data;
    Object.keys(mulShopsInfo).forEach((key) => {
      _this.setData({
        [`mulShopsInfo.${key}.selectDiscountInfo`]: {
          title: "不使用优惠",
          name: '无',
          no_use_benefit: 1
        },
        [`mulShopsInfo.${key}.exchangeCouponData.dialogHidden`]: true,
        [`mulShopsInfo.${key}.exchangeCouponData.hasSelectGoods`]: false,
        [`mulShopsInfo.${key}.exchangeCouponData.voucher_coupon_goods_info`]: {},
      });
    });
    this.getCalculationInfo();
  },
  getTableNumber(event) {
    let { value } = event.detail;
    this.tableNumber = value;
  },
  searchTableNumber() {
    if (!this.tableNumber) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getEclocationByTitle',
      data: {
        sub_shop_app_id: this.franchisee_id,
        title: this.tableNumber
      },
      success: res =>{
        if (res.count  == 0) {
          this.setData({
            errorText : '请输入正确的桌名'
          })
        } else if(res.count > 1) {
          this.setData({
            errorText : '当前存在相同的桌名'
          })
        } else {
          let { id } = res.data[0];
          let pre_location_id = this.data.ec_location_id;
          this.scanInitUserInfo(pre_location_id, id, this.checkIsAddDishing);
          this.closeTableModal();
        }
      }
    })
  },
  closeTableModal() {
    this.setData({
      showTable: !this.data.showTable,
      errorText: ''
    })
  },
  openLocation() {
    let data = this.data.selectDelivery;
    if (data.latitude && data.longitude) {
      wx.openLocation({
        name: data.title,
        address: data.region_data.country_region_id === 1 ? data.region_detail : data.region_data.region_string + data.address_detail,
        latitude: +data.latitude,
        longitude: +data.longitude,
        scale: 18
      })
    }
  },
  triggerPriceBreakModal() {
    this.setData({
      priceBreakDisModal: !this.data.priceBreakDisModal
    })
  },
  getGoodsDiscountInfoInCart: function() {
    let priceBreakDiscountData = app.globalData.priceBreakDiscountData; 
    let newData = {};
    let goodsList = this.data.goodsList;
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
    let newCartArr = [];
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
    newCartArr = Object.keys(newCartList).map((key) => {
      return newCartList[key];
    })
    if (newCartArr.some(item => item.cutPrice > 0)) {
      newData['not_enough_price_break'] = false;   // 购买的商品达到满减门槛
    }else {
      newData['not_enough_price_break'] = true;   // 购买的商品未达到满减门槛
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
