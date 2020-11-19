var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    showDialog: false,
    pickUpType: 0,  //配送方式 0自提 1配送
    goodsList: [],
    discountList: [],
    selectDiscountInfo: {},
    orderRemark: '', //  留言
    is_self_delivery: 0, //  自提  1自提
    expressFee: '', //  运费
    balance: '',
    useBalance: true, //  是否使用储值金
    deduction: '',
    discount_cut_price: '', //  折扣金额
    group_buy_price: '',
    original_price: '',
    totalPayment: '',
    storeConfig: '',
    noAdditionalInfo: true,
    is_group: '', //  拼团
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
    userInfo: {
      nick_name: '',
      phone: ''
    },
    hasRequiredSuppInfo: false,
    selectAddress: {}, //配送地址
    expressAddressNull: false, //没选配送地址弹窗
    payGiftOptions: {},                // 支付有礼计算金额参数
    settlementActivityFreePrice: '',   // 参与结算活动的金额
  },
  franchisee_id: '',
  cartArr: [],
  cart_id_arr: [], //社区团购购买商品购物车id数组
  requesting: false,
  additional_info: {},
  is_group: '',
  inputTimer: '',
  onLoad: function (options) {
    let getUrlOptions = app.getUrlOptions();  //获取页面参数
    this.cartArr = getUrlOptions.cart_arr;
    this.cartArr.map((item) => {
      this.cart_id_arr.push(item.id)
    })
    let prePageData = getCurrentPages()[getCurrentPages().length - 2];
    let leaderInfo = prePageData.data.leaderInfo;
    let group_id = options.group_id ? options.group_id : -1;
    let pickUpType = 0;
    let shipType = leaderInfo.ship_type;
    if (shipType && shipType.length == 1){
      if (shipType[0] == 1){
        pickUpType = 1;
      }
    }
    this.setData({
      pickUpType: pickUpType,
      leaderInfo: leaderInfo,
      group_id: group_id,
      'userInfo.phone': app.globalData.userInfo.phone,
      'userInfo.nick_name': wx.getStorageSync('communityGroupUser') || '',
    })
    this.dataInitial();
  },
  onShow: function(){
    if (this.isFromSelectAddress){
      this.dataInitial();
      this.isFromSelectAddress = false;
    }
  },
  onHide: function(){
    setTimeout(()=> {
      if (this.isFromSelectAddress){return}
      let prePageData = getCurrentPages()[getCurrentPages().length - 2];
      if(prePageData.fromSubmit){
        prePageData.fromSubmit = false;
        app.sendRequest({
          url: '/index.php?r=AppShop/DeleteAllCart',
          data: {
            is_dis_group: 1
          }
        })
      }
    })
  },
  dataInitial: function () {
    this.getCartList();
    this.getAppECStoreConfig();
    this.supportPickUp();
  },
  getCartList() {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 1000,
        dis_group_id: -1,
        leader_token: _this.data.leaderInfo.user_token
      },
      success: function (res) {
        let cartList = res.data;
        let goodsList = [];
        _this.cartArr.map((a) => {
          cartList.map((b) => {
            if(a.id == b.id){
              goodsList.push({
                buyCount: a.num,
                cart_id: b.id,
                goods_type: b.goods_type,
                id: b.goods_id,
                imgurl: b.cover,
                modelId: b.model_id || '',
                models: b.model_value,
                models_text: b.model_value,
                price: b.price,
                stock: b.stock,
                title: b.title,
                is_seckill: b.is_seckill,   //是否是秒杀
                form_data: b.form_data,
                dis_group_id: b.dis_group_id
              })
            }
          })
        })
        _this.setData({goodsList})
      }
    })
  },
  getCalculationInfo: function () {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/calculationPrice',
      method: 'post',
      data: {
        sub_shop_app_id: this.franchisee_id,
        cart_id_arr: this.cart_id_arr,
        address_id: this.data.selectAddress.id,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        selected_benefit: this.data.selectDiscountInfo,
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
        dis_group_info: {
          leader_token: this.data.leaderInfo.user_token || (app.globalData.leaderInfo && app.globalData.leaderInfo.user_token),
          dis_notice: {
            ship_type: this.data.pickUpType
          }
        },
        settlement_activity_info: this.data.cashOnDelivery ? {} : this.data.payGiftOptions,
      },
      success: function (res) {
        let info = res.data;
        let benefits = info.can_use_benefit;
        let goods_info = info.goods_info;
        let additional_info_goods = [];
        let selectDiscountInfo = info.selected_benefit_info;
        let suppInfoArr = [];
        let additional_goodsid_arr = [];
        let goodsBenefitsData = [];
        if (+info.settlement_activity_item_price) {
          info.price = ((+info.price) + (+info.settlement_activity_item_price)).toFixed(2);
        }
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
        if (_this.data.pickUpType == 1 && info.address.dis_in_distance == 0) {
          app.showModal({
            content: '当前下单地址超出配送距离，请更改下单地址',
            confirmText: '去更换',
            showCancel: true,
            confirm: function () {
              _this.goToMyAddress();
            },
            cancel: function () {
              _this.setData({
                selectAddress: {}
              })
            }
          });
        }
        if (selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3 && _this.data.exchangeCouponData.hasSelectGoods == false) {
          _this.exchangeCouponInit(parseInt(selectDiscountInfo.value));
        }
        for (var i = 0; i <= goods_info.length - 1; i++) {
          if (goods_info[i].delivery_id && goods_info[i].delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info[i].id) == -1) {
            suppInfoArr.push(goods_info[i].delivery_id);
            additional_goodsid_arr.push(goods_info[i].id);
            additional_info_goods.push(goods_info[i]);
          }
        }
        let group_buy_price = String(info.original_price - info.group_buy_discount_price);
        if (group_buy_price.split('.')[1]) {
          group_buy_price = Number(group_buy_price).toFixed(2);
        }
        if (!suppInfoArr.length) {
          _this.setData({
            hasRequiredSuppInfo: false
          });
        }
        if (suppInfoArr.length && !_this.data.deliverydWrite){
          _this.getSuppInfo(suppInfoArr);
        }
        _this.setData({
          expressAddressNull: _this.data.pickUpType == 1 && !info.address ? true : false,
          selectAddress: _this.data.pickUpType == 1 && info.address,
          discountList: goodsBenefitsData,
          selectDiscountInfo: selectDiscountInfo,
          expressFee: info.express_fee,
          discount_cut_price: info.discount_cut_price,
          vip_cut_price: info.vip_cut_price,
          is_vip_order: info.is_vip_order,
          balance: info.balance,
          deduction: info.use_balance,
          original_price: info.original_price,
          group_buy_price: group_buy_price,
          totalPayment: info.price,
          noAdditionalInfo: suppInfoArr.length ? false : true,
          canCashDelivery: info.is_pay_on_delivery,
          cashOnDelivery: info.price > 0 ? _this.data.cashOnDelivery : false,
          selfPayOnDelivery: info.self_pay_on_delivery,
          settlementActivityFreePrice: info.settlement_activity_free_bills_item_price,
        })
        app.setPreviewGoodsInfo(additional_info_goods);
      },
      successShowModalConfirm: function(res) {
        app.turnBack();
      }
    });
  },
  getAppECStoreConfig: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getAppBECStoreConfig',
      data: {
        sub_shop_app_id: _this.franchisee_id
      },
      success: function (res) {
        _this.setData({
          storeConfig: res.data,
          storeStyle: _this.franchisee_id ? '' : res.data.color_config
        })
      }
    })
  },
  remarkInput: function (e) {
    var value = e.detail.value;
    this.setData({
      orderRemark: value
    });
  },
  clickMinusButton: function (e) {
    var index = e.currentTarget.dataset.index,
        goods = this.data.goodsList[index];
    if (goods.buyCount <= 0) return;
    this.changeGoodsNum(index, 'minus');
  },
  clickPlusButton: function (e) {
    var index = e.currentTarget.dataset.index;
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function (index, type) {
    var goods = this.data.goodsList[index],
        currentNum = +goods.buyCount,
        targetNum = type == 'plus' ? currentNum + 1 : (type == 'minus' ? currentNum - 1 : Number(type)),
        that = this,
        data = {},
        param;
    if (targetNum == 0 && type == 'minus') {
      app.showModal({
        content: '确定删除该商品？',
        showCancel: true,
        confirm: function () {
          data['goodsList[' + index + '].num'] = targetNum;
          that.setData(data);
          that.deleteGoods(index);
        }
      })
      return;
    }
    if (this.data.is_group) {
      param.is_group_buy = this.data.is_group ? 1 : 0;
      param.num_of_group_buy_people = this.data.group_buy_people;
      param.team_token = this.data.teamToken;
    }
    param = {
      goods_id: goods.id,
      model_id: goods.modelId || '',
      num: targetNum,
      leader_token: that.data.leaderInfo.user_token,
      dis_group_id: goods.dis_group_id || -1,
      group_id: goods.form_data.dis_group_id || ''
    };
    if(goods.is_seckill == 1){
      param.is_single_goods = 1;
      param.is_seckill = goods.is_seckill;
      param.pick_up_type = [5];
      if(goods.form_data.seckill_activity_id){
        param.form_data = {
          seckill_activity_id: goods.form_data.seckill_activity_id,
          seckill_activity_time_id: goods.form_data.seckill_activity_time_id,
          seckill_activity_goods_id: goods.form_data.seckill_activity_goods_id,
        }
      }
    }
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      method: 'post',
      data: param,
      success: function (res) {
        data['goodsList[' + index + '].buyCount'] = targetNum;
        data.exchangeCouponData = {
          dialogHidden: true,
          hasSelectGoods: false,
          voucher_coupon_goods_info: {}
        };
        that.setData(data);
        that.getCalculationInfo();
      },
      successStatusAbnormal: function(res){
        data = {};
        data['goodsList[' + index + '].buyCount'] = currentNum;
        that.setData(data);
      },
      fail: function (res) {
        data = {};
        data['goodsList[' + index + '].buyCount'] = currentNum;
        that.setData(data);
      }
    })
  },
  deleteGoods: function (index) {
    var goodsList = this.data.goodsList;
    var that = this;
    var listExcludeDelete;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: [goodsList[index].cart_id],
        sub_shop_app_id: this.franchisee_id
      },
      success: function (res) {
        (listExcludeDelete = goodsList.concat([])).splice(index, 1);
        if (listExcludeDelete.length == 0) {
          that.setData({ goodsList: listExcludeDelete });
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
        if (noSameGoodsId) {
          delete that.additional_info[deleteGoodsId];
        }
        that.setData({
          goodsList: listExcludeDelete,
          selectDiscountInfo: '',
          exchangeCouponData: {
            dialogHidden: true,
            hasSelectGoods: false,
            voucher_coupon_goods_info: {}
          }
        })
        that.getCalculationInfo();
      }
    });
  },
  previewPay: function (e) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/CheckIsDistributorGroupLeader',
      method: 'post',
      data: {
        leader_token: this.data.leaderInfo.user_token || (app.globalData.leaderInfo && app.globalData.leaderInfo.user_token),
      },
      success: function (res) {
        if (res.data == 1) {
          _this.confirmPayment(e);
        } else {
          app.showModal({
            content: '团长资质审核中，请先在其他团长里购买!'
          })
        }
      }
    })
  },
  confirmPayment: function (e) {
    var list = this.data.goodsList,
      that = this,
      cart_data_arr = [],
      selected_benefit = this.data.selectDiscountInfo;
    if (this.data.pickUpType == 1 && !Object.keys(that.data.selectAddress).length) {
      this.setData({
        expressAddressNull: true
      })
      return;
    }
    if (this.data.pickUpType == 0 && that.data.userInfo.nick_name == '') {
      app.showModal({
        content: '请填写提货人姓名'
      })
      return;
    }
    if (this.data.pickUpType == 0 && (that.data.userInfo.phone == '' || that.data.userInfo.phone == null)) {
      app.showModal({
        content: '请填写正确的提货人手机号'
      })
      return;
    }
    if (this.data.hasRequiredSuppInfo && !this.data.deliverydWrite && !this.data.aloneDeliveryShow){
      app.showModal({
        content: '请填写商品补充信息',
        confirmText: '去填写',
        confirmColor: that.data.storeStyle.theme,
        confirm: function(){
          that.goToAdditionalInfo();
        }
      });
      return;
    }
    if (this.data.aloneDeliveryShow){
      let a = this.data.additional_info;
      let id = this.data.additional_goodsid_arr[0];
      if (a[id][0].is_required == 0 && a[id][0].value == ''){
        app.showModal({
          content: '请填写' + a[id][0].title,
          confirmText: '确认',
          confirmColor: _this.data.storeStyle.theme,
        });
        return;
      }
    }
    for (let item of list) {
      cart_data_arr.push({
        cart_id: item.cart_id,
        goods_id: item.id,
        model_id: item.modelId,
        num: item.buyCount
      })
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    let data = {
      cart_arr: cart_data_arr,
      formId: e.detail.formId,
      sub_shop_app_id: this.franchisee_id,
      selected_benefit: selected_benefit,
      is_balance: this.data.useBalance ? 1 : 0,
      remark: this.data.orderRemark,
      additional_info: this.additional_info,
      voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
      is_pay_on_delivery: this.data.cashOnDelivery ? 1 : 0,
      not_need_user_address: 1,
      leader_token: that.data.leaderInfo.user_token,
      group_id: that.data.group_id,
      dis_notice: that.data.userInfo,
      settlement_activity_info: this.data.cashOnDelivery ? {} : this.data.payGiftOptions,
    };
    data.dis_notice['ship_type'] = this.data.pickUpType;
    if (this.data.pickUpType == 1){
      let selectAddress = this.data.selectAddress;
      data.dis_notice['nick_name'] = selectAddress.address_info.name;
      data.dis_notice['phone'] = selectAddress.address_info.contact;
      data.dis_notice['address_info'] = selectAddress.address_info.province.text + selectAddress.address_info.city.text + selectAddress.address_info.district.text + selectAddress.address_info.detailAddress;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/addCartOrder',
      method: 'post',
      data: data,
      success: function (res) {
        app.requestSubscribeMessage([{
          type: that.data.pickUpType == 0 ? 8 : 1,
          obj_id: res.data,
        }]).then(() => {
          let { total_price, settlement_activity_item_price } = res;
          if (+settlement_activity_item_price) {                       // 购买储值或者付费卡的金额
            total_price = ((+total_price) + (+settlement_activity_item_price)).toFixed(2);
          }
          that.setData({
            totalPayment: total_price
          })
          app.removeStorage({ key: that.data.leaderInfo.user_token + 'Width' + that.data.group_id });
          app.setStorage({ key: 'communityGroupUser', data: that.data.userInfo.nick_name });
          let goodsArr = [];
          for (let item of list){
            goodsArr.push({
              goodsId: item.id,
              num: item.buyCount
            });
          }
          app.sendUseBehavior([{goodsId: res.data}],5); // 行为轨迹埋点 提交订单
          app.sendUseBehavior(goodsArr,1);
          app.sendUseBehavior(goodsArr,11); //黑沙转发 购物
          app.sendUseBehavior(goodsArr,4,2); //取消加购
          that.setData({ goodsList: [] });
          that.payOrder(res.data);
        })
      },
      fail: function () {
        that.requesting = false;
      },
      successStatusAbnormal: function () {
        that.requesting = false;
      }
    });
  },
  payOrder: function (orderId) {
    var that = this;
    function paySuccess() {
      var pagePath = '/promotion/pages/communityGroupPaySuccess/communityGroupPaySuccess?detail=' + orderId + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '') + '&is_group=' + !!that.is_group;
      if (!that.franchisee_id) {
        app.sendRequest({
          url: '/index.php?r=AppMarketing/CheckAppCollectmeStatus',
          data: {
            'order_id': orderId,
            sub_app_id: that.franchisee_id
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
      app.turnToPage('/promotion/pages/communityGroupOrderDetail/communityGroupOrderDetail?detail=' + orderId + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : ''), 1);
    }
    if (this.data.totalPayment == 0) {
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
  useBalanceChange: function (e) {
    this.setData({
      useBalance: e.detail.value
    });
    this.getCalculationInfo();
  },
  useCashDelivery: function (e) {
    if (this.data.selfPayOnDelivery == 0 && e.detail.value) {
      this.setData({
        is_self_delivery: false
      })
    }
    this.setData({
      cashOnDelivery: e.detail.value
    })
  },
  goToAdditionalInfo: function () {
    app.setGoodsAdditionalInfo(this.additional_info);
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo');
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
      selectDiscountInfo: {
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
  inputGoodsCount: function (e) {
    let value = +e.detail.value;
    let index = e.target.dataset.index;
    if (isNaN(value) || value <= 0) {
      return;
    }
    clearTimeout(this.inputTimer);
    this.inputTimer = setTimeout(() => {
      this.changeGoodsNum(index, value);
    }, 500);
  },
  showMemberDiscount: function () {
    this.selectComponent('#component-memberDiscount').showDialog(this.data.selectDiscountInfo);
  },
  afterSelectedBenefit: function (event) {
    this.setData({
      selectDiscountInfo: event.detail.selectedDiscount,
      'exchangeCouponData.hasSelectGoods': false,
      'exchangeCouponData.voucher_coupon_goods_info': {}
    })
    this.getCalculationInfo();
  },
  getSuppInfo: function (suppInfoArr) {
    var _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=pc/AppShop/GetDelivery',
      method: 'post',
      data: {
        delivery_ids: suppInfoArr
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
          }
        }
        if (res.data.length == 1 && _this.data.additional_goodsid_arr && _this.data.additional_goodsid_arr.length == 1){
          let deliveryIndex = 0;
          let showIndex = 0;
          res.data[0].delivery_info.map((item) => {
            showIndex++;
            if (item.is_hidden == 1){
              deliveryIndex++;
            }
          })
          if (deliveryIndex == 1){
            let data = {};
            data[_this.data.additional_goodsid_arr[0]] = [];
            data[_this.data.additional_goodsid_arr[0]].push({
              title: res.data[0].delivery_info[showIndex - 1].name,
              type: res.data[0].delivery_info[showIndex - 1].type,
              is_required: res.data[0].delivery_info[showIndex - 1].is_required,
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
  getPhoneNumber: function (e) {
    let _this = this;
    if (e.detail.errMsg == "getPhoneNumber:fail user deny" || e.detail.errMsg == "getPhoneNumber:fail:user denied" || e.detail.errMsg == "getPhoneNumber:fail:cancel to confirm login") {
      app.addLog(e.detail);
    } else if (e.detail.errMsg == "getPhoneNumber:fail 该 appid 没有权限" || e.detail.errMsg == "getPhoneNumber:fail jsapi has no permission, event…sg=permission got, detail=jsapi has no permission") {
      app.showModal({
        content: '该appid没有权限，目前该功能针对非个人开发者，且完成了认证的小程序开放（不包含海外主体）'
      });
    } else {
      app.checkSession(function () {
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=AppUser/GetPhoneNumber',
          data: {
            encryptedData: e.detail.encryptedData,
            iv: e.detail.iv
          },
          success: function (res) {
            app.setUserInfoStorage({
              phone: res.data
            })
            _this.setData({
              'userInfo.phone': res.data
            })
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
        })
      });
    }
  },
  changeUserInfo: function (e) {
    let types = e.currentTarget.dataset.type;
    let value = e.detail.value;
    if (types == 'phone') {
      this.setData({
        'userInfo.phone': value
      })
    } else {
      this.setData({
        'userInfo.nick_name': value
      })
    }
  },
  resetPreViewCark: function () {
    let key = `${this.data.leaderInfo.user_token || (app.globalData.leaderInfo && app.globalData.leaderInfo.user_token)}Width${this.data.group_id}`;
    let data = wx.getStorageSync('communityGoodCark') || {};
    data[key] = this.data.goodsList;
    app.setStorage({
      key: 'communityGoodCark',
      data: data
    })
  },
  onUnload: function () {
    this.resetPreViewCark();
  },
  openConfirmDialog: function () {
    let userInfo = this.data.userInfo;
    if (!userInfo.nick_name) {
      app.showModal({
        content: '请填写提货人姓名'
      })
      return
    }
    if (!userInfo.phone) {// 提示用户正确填写
      app.showModal({
        content: '请填写正确的提货人手机号'
      })
      return
    }
    this.setData({
      showDialog: true
    })
  },
  closeConfirmDialog: function () {
    this.setData({
      showDialog: false
    })
  },
  saveFormId: function (e) {
    if (this.data.pickUpType == 1 && !this.data.selectAddress.address_info) {// 判断是否选择地址
      app.showModal({
        content: '请选择收货地址',
        confirm: () => {
          this.goToMyAddress();
        }
      })
      return
    }
    if (e.detail.formId != 'the formId is a mock one') {
      app.sendRequest({
        url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
        data: { form_id: e.detail.formId },
        method: 'post',
        success: res => {
          this.previewPay(e)
        }
      })
    }else {
      this.previewPay(e)
    }
    this.setData({
      showDialog: false
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
  addDeliveryImg: function () {
    let _this = this;
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    let images = a[b][0].value || [];
    app.chooseImage((image) => {
      a[b][0].value = images.concat(image);
      _this.setData({
        additional_info: a
      })
    }, 9)
  },
  deleteImage: function (e) {
    let _this = this;
    let a = this.data.additional_info;
    let b = this.data.additional_goodsid_arr[0];
    let index = e.currentTarget.dataset.imageIndex;
    let images = a[b][0].value;
    images.splice(index, 1);
    a[b][0].value = images;
    _this.setData({
      additional_info: a
    })
  },
  selectedPickUptype: function(e){
    let type = e.currentTarget.dataset.type;
    this.setData({
      pickUpType: type
    })
    this.getCalculationInfo();
  },
  goToMyAddress: function () {
    let addressId = this.data.selectAddress.id;
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/myAddress/myAddress?id=' + addressId);
  },
  callGroupCaptainPhone: function(e){
    let phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  supportPickUp: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/GetDistributionInfo',
      success: res => {
        let newData = {
          distributionInfo: res.data
        };
        if (res.data.role_setting[6].enable_marketing_discount == 0){
          newData.selectDiscountInfo = {
            no_use_benefit: 1
          }
          newData.noCanUseDiscount = true
        }
        _this.setData(newData);
        _this.getCalculationInfo();
      }
    })
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
})