var app = getApp()
var util = require('../../../utils/util.js')
var customEvent = require('../../../utils/custom_event.js');
Page({
  data: {
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
    selectAddress: {},
    discountList: [],
    selectDiscountInfo: {},
    orderRemark: '',
    is_self_delivery: 0,
    express_fee: '',
    balance: '',
    useBalance: true,
    deduction: '',
    discount_cut_price: '',
    group_buy_price: '',
    original_price: '',
    totalPayment: '',
    storeConfig: '',
    noAdditionalInfo: true,
    is_group:'',
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
    isShowSameJourneyTime: false,
    expressAddressNull: false,
    seckillType: 0,              // 秒杀类型 0： 单品秒杀， 1： 活动秒杀
    payGiftOptions: {},          // 支付有礼计算金额参数
    settlementActivityFreePrice: 0,
  },
  isFromSelectAddress: false,
  franchisee_id: '',
  cart_id_arr: [],
  cart_id_arr_my: [],
  cart_data_arr: [],
  requesting: false,
  additional_info: {},
  is_group:'',
  inputTimer: '',
  hasRequiredSuppInfo: false,
  downcountArr:[],
  onLoad: function (options) {
    this.franchisee_id = options.franchisee || '';
    let teamToken = options.team_token || '';
    let group_buy_people = options.group_buy_people || 0;
    let limit_buy = options.limit_buy || '';
    let pickUpType = options.type || -1;
    let seckillType = options.secType || 0;
    this.franchisee_id = options.franchisee || '';
    this.cart_id_arr = options.cart_arr ? decodeURIComponent(options.cart_arr).split(',') : [];
    this.is_group = options.is_group || '';
    let addressId = options.addressId || '';
    let ec_location_id = '';
    if (this.franchisee_id) {
      ec_location_id = app.globalData['commonEcLocationId'] ? app.globalData['commonEcLocationId'] : (app.globalData[this.franchisee_id] ? app.globalData[this.franchisee_id].ec_location_id : '');
    } else {
      ec_location_id = options.ec_location_id || app.globalData.ec_location_id || ''
    }
    this.setData({
      franchisee_id: options.franchisee || '',
      ec_location_id: ec_location_id,
      limit_buy: limit_buy,
      is_group: this.is_group,
      selectSameJourneyId: pickUpType == 2 ? addressId : '',
      ori_selectSameJourneyId: pickUpType == 2 ? addressId : '',
      teamToken: teamToken,
      group_buy_people: group_buy_people,
      seckillType: seckillType
    });
    this.getXcxUserInfo();
    this.getDefaultPickUpType();  //  获取默认配送方式
    this.selectPickMethod('first', seckillType);
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
    this.getAppECStoreConfig();
    this.getCartList();
  },
  onShow: function(){
    if(this.isFromSelectAddress){
      this.getCalculationInfo();
      this.isFromSelectAddress = false;
    }
    if (this.onlyImme) {
      this.showServiceTime('onlyImme');
      this.onlyImme = false;
    }
  },
  getCartList: function () {
    var that = this,
        franchisee_id = this.franchisee_id;
    this.cart_id_arr_my = [];
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 100,
        sub_shop_app_id: franchisee_id,
        parent_shop_app_id: franchisee_id ? app.globalData.appId : ''
      },
      success: function(res){
        var data = [];
        if(that.cart_id_arr.length){
          for (var i = 0; i <= res.data.length - 1; i++) {
            if(that.cart_id_arr.indexOf(res.data[i].id) >= 0){
              data.push(res.data[i]);
            }
          }
        } else {
          data = res.data;
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
          that.cart_id_arr_my.push(goods.id);
        }
        for(var i=0;i<data.length;i++){
          data[i].downCount = {
            hours: '00',
            minutes: '00',
            seconds: '00'
          };
          if (data[i].seckill_start_state == 0) {
            data[i].downcount = app.beforeSeckillDownCount(data[i], that, 'goodsList[' + i + ']');
          } else if (data[i].seckill_start_state == 1) {
            data[i].downcount = app.duringSeckillDownCount(data[i], that, 'goodsList[' + i + ']');
          }
          data[i]&&that.downcountArr.push(data[i].downcount);
        }
        that.setData({
          goodsList: data
        });
      }
    })
  },
  onUnload: function () {
    if (this.downcountArr && this.downcountArr.length) {
      this.downcountArr = this.downcountArr.concat().reverse();
      for (let i = 0; i < this.downcountArr.length; i++) {
        this.downcountArr[i] && this.downcountArr[i].clear();
      }
    }
  },
  getCalculationInfo: function(){
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
        },
        'intra_city_data': _this._mapIntraCityOptions(),
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/calculationPrice',
      method: 'post',
      data: {
        ecommerce_info: ecommerce_info,
        sub_shop_app_id: this.franchisee_id,
        address_id: this.data.pickUpType == 4 ? '' : (this.data.pickUpType == 1 ? this.data.selectAddressId : this.data.selectSameJourneyId),
        cart_id_arr: this.cart_id_arr,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        pick_up_type: this.data.pickUpType,
        selected_benefit: (this.data.pickUpType == 4 && this.data.account_type == 2) ? '' : this.data.selectDiscountInfo,
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
        settlement_activity_info: this.data.cashOnDelivery || (this.data.pickUpType == 4 && this.data.account_type == 2) ? {} : this.data.payGiftOptions,   // 货到付款和堂食先付后吃不使用支付结算活动
      },
      success: function(res){
        let  info = res.data;
        let  benefits = info.can_use_benefit;
        let  goods_info = info.goods_info;
        let  additional_info_goods = [];
        let  selectDiscountInfo = info.selected_benefit_info;
        let  suppInfoArr = [];
        let  additional_goodsid_arr = [];
        let  activePreferential = 0;  //活动优惠金额
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
        let ET_time = ''; // 预计时间
        if (_this.data.pickUpType == 2 && info.intra_city_status_data ) {
          let ET_time_mm = Date.parse(new Date()) + (info.intra_city_status_data.deliver_time * 60 * 1000);
          ET_time = new Date(ET_time_mm).getHours() + ':' + (new Date(ET_time_mm).getMinutes() > 9 ? new Date(ET_time_mm).getMinutes() : '0' + new Date(ET_time_mm).getMinutes());
          if (info.intra_city_status_data.in_distance == 1) {
            _this.setData({
              'intraCity_in_distance': 1
            })
          }
          if (info.intra_city_status_data.in_distance == 0) {
            app.showModal({
              content: '地址不在配送范围内',
              confirmText: '去更换',
              showCancel: true,
              confirm: function () {
                _this.goSameJourneyAddress();
              },
              cancel: function () {
                _this.setData({
                  selectSameJourney: ''
                })
              }
            });
          } else if (info.intra_city_status_data.in_business_time == 0) {
            app.showModal({
              content: '店铺歇业中，请更换其他配送方式',
              confirmText: '去更换',
              confirm: function () {
                _this.setData({
                  isShowPickMask: true
                })
              }
            });
          }
        }
        let goodsBenefitsData = [];
        benefits.coupon_benefit && benefits.coupon_benefit.length ? goodsBenefitsData.push({ label: 'coupon', value: benefits.coupon_benefit }) : '';
        benefits.all_vip_benefit && benefits.all_vip_benefit.length ? goodsBenefitsData.push({ label: 'vip', value: benefits.all_vip_benefit }) : '';
        Array.isArray(benefits.integral_benefit) ? '' : benefits.integral_benefit && goodsBenefitsData.push({ label: 'integral', value: [benefits.integral_benefit] });
        if(selectDiscountInfo.discount_type == 'coupon' && selectDiscountInfo.type == 3 && _this.data.exchangeCouponData.hasSelectGoods == false ){
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
          }else if(goods_info[i].delivery_id && goods_info[i].delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info[i].id) == -1){
            suppInfoArr.push(goods_info[i].delivery_id);
            additional_goodsid_arr.push(goods_info[i].id);
            additional_info_goods.push(goods_info[i]);
          }
        }
        let group_buy_price = String(info.original_price - info.group_buy_discount_price);
        if(group_buy_price.split('.')[1]){
          group_buy_price = Number(group_buy_price).toFixed(2);
        }
        if (suppInfoArr.length && !_this.hasRequiredSuppInfo){
          _this.getSuppInfo(suppInfoArr);
        }
        activePreferential = (info.total_original_price - info.original_price).toFixed(2);
        if(+info.settlement_activity_item_price){
          info.price = ((+info.price) + (+info.settlement_activity_item_price)).toFixed(2);
        }
        if (_this.data.pickUpType == 1) {
          _this.setData({
            selectAddress: info.address //  保存快递的默认地址
          })
        }
        _this.setData({
          goods_num: goods_num,
          expressAddressNull: info.address ? false : _this.data.expressAddressNull,   //快递无地址时显示弹窗
          discountList: goodsBenefitsData,
          selectDiscountInfo: selectDiscountInfo,
          people_num: info.people_num,
          box_fee: info.box_fee,
          server_fee: info.server_fee,
          tissue_fee: info.tissue_fee,
          express_fee: info.express_fee,
          discount_cut_price: info.discount_cut_price,
          balance: info.balance,
          deduction: info.use_balance,
          original_price: info.original_price,
          group_buy_price: group_buy_price,
          totalPayment: info.price,
          total_original_price: info.total_original_price,
          noAdditionalInfo: suppInfoArr.length ? false : true,
          canCashDelivery: info.is_pay_on_delivery,
          cashOnDelivery: info.price > 0 ? (info.priority_pay_on_delivery == 1 ? true : false) : false,
          selfPayOnDelivery: info.self_pay_on_delivery,
          activePreferential:activePreferential,
          selectSameJourney: _this.data.pickUpType == 2 && info.address,
          additional_goodsid_arr: additional_goodsid_arr,
          sameJourneyImmediatlyTime: ET_time,
          deliver_time: info.intra_city_status_data && info.intra_city_status_data.deliver_time,
          settlementActivityFreePrice: info.settlement_activity_free_bills_item_price
        })
        app.setPreviewGoodsInfo(additional_info_goods);
      }
    });
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeConfig: res,
        storeStyle: res.color_config
      })
    }, this.franchisee_id);
  },
  remarkInput: function (e) {
    var value = e.detail.value;
    this.setData({
      orderRemark: value
    });
  },
  previewImage: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src
    });
  },
  clickMinusButton: function(e){
    var index = e.currentTarget.dataset.index,
        goods = this.data.goodsList[index];
    if(+goods.num <= 0) return;
    this.changeGoodsNum(index, 'minus');
  },
  clickPlusButton: function(e){
    var index = e.currentTarget.dataset.index,
        goods = this.data.goodsList[index];
    if(this.data.limit_buy !== '' && +goods.num >= this.data.limit_buy) return;
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function(index, type){
    var goods = this.data.goodsList[index],
        currentNum = +goods.num,
        targetNum = type == 'plus' ? currentNum + 1 : (type == 'minus' ? currentNum - 1 : Number(type)),
        that = this,
        data = {},
        param;
    if(targetNum == 0 && type == 'minus'){
      app.showModal({
        content: '确定从购物车删除该商品？',
        showCancel: true,
        confirm: function(){
          that.cart_data_arr[index].num = targetNum;
          data['goodsList['+index+'].num'] = targetNum;
          that.setData(data);
          that.deleteGoods(index);
        }
      })
      return;
    }
    if (goods.form_data && goods.form_data.seckill_activity_id){
      param = {
        goods_id: goods.goods_id,
        model_id: goods.model_id || '',
        num: targetNum,
        sub_shop_app_id: that.franchisee_id,
        is_seckill: goods.is_seckill == 1 ? 1 : '',
        form_data: goods.form_data
      };
    }else {
      param = {
        goods_id: goods.goods_id,
        model_id: goods.model_id || '',
        num: targetNum,
        sub_shop_app_id: that.franchisee_id,
        is_seckill: goods.is_seckill == 1 ? 1 : ''
      };
    }
    if(this.data.is_group){
      param.is_group_buy = this.data.is_group ? 1 : 0;
      param.num_of_group_buy_people = this.data.group_buy_people;
      param.team_token = this.data.teamToken;
    }
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      method: 'post',
      success: function(res){
        that.cart_data_arr[index].num = targetNum;
        data['goodsList['+index+'].num'] = targetNum;
        if (type == 'plus'){
          data['goodsList[' + index + '].stock'] = goods.stock -1;
        }else{
          data['goodsList[' + index + '].stock'] = goods.stock + 1;
        }
        data.selectDiscountInfo = '';
        data.exchangeCouponData = {
          dialogHidden: true,
          hasSelectGoods: false,
          voucher_coupon_goods_info: { }
        };
        that.setData(data);
        that.getCalculationInfo();
      },
      fail: function(res){
        data = {};
        that.cart_data_arr[index].num = currentNum;
        data['goodsList['+index+'].num'] = currentNum;
        that.setData(data);
      }
    })
  },
  deleteGoods: function(index){
    var goodsList = this.data.goodsList,
        that = this,
        listExcludeDelete;
    app.sendRequest({
      url : '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: [this.cart_data_arr[index].cart_id],
        sub_shop_app_id: this.franchisee_id
      },
      success: function(res){
        (listExcludeDelete = goodsList.concat([])).splice(index, 1);
        if(listExcludeDelete.length == 0){
          app.turnBack();
          return;
        }
        var deleteGoodsId = goodsList[index],
            noSameGoodsId = true;
        for (var i = listExcludeDelete.length - 1; i >= 0; i--) {
          if(listExcludeDelete[i].id == deleteGoodsId){
            noSameGoodsId = false;
            break;
          }
        }
        if(noSameGoodsId){
          delete that.additional_info[deleteGoodsId];
        }
        that.cart_data_arr.splice(index, 1);
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
  confirmPayment: function (e) {
    var _this = this,
      selected_benefit = this.data.selectDiscountInfo,
      tostoreOrderType = this.data.tostoreOrderType;
    if (this.data.pickUpType == 1 && !this.data.selectAddress) {
      this.setData({
        expressAddressNull: true
      })
      return;
    }
    if (this.data.pickUpType == 4 && this.data.location_status) {
      if (!this.data.ec_location_id && this.data.take_meal_type == 1) {
        app.showModal({
          content: '请先扫码获取桌号！',
        })
        return;
      }
    }
    if (this.data.pickUpType == 1 && !this.data.selectAddress) {
      app.showModal({
        content: '请完善地址信息',
        confirmText: '去填写',
        confirm: function () {
          _this.goToMyAddress();
        }
      });
      return;
    }
    if (this.data.pickUpType == 2 && !this.data.selectSameJourney) {
      app.showModal({
        content: '请完善地址信息',
        confirmText: '去填写',
        confirm: function () {
          _this.goSameJourneyAddress();
        }
      });
      return;
    }
    if (this.data.pickUpType == 2 && !this.data.sameJourneyDateTime && this.data.sameJourneyImmediatelyState != 1) {
      app.showModal({
        content: '请选择取货时间'
      });
      return;
    }
    if (this.data.pickUpType == 3 && !this.data.selectDelivery) {
      app.showModal({
        content: '请选择上门自提地址',
        confirmText: '去填写',
        confirm: function () {
          _this.toDeliveryList();
        }
      });
      return;
    }
    if (this.data.pickUpType == 3 && this.data.selfAppointmentSwitch && !tostoreOrderType) {
      app.showModal({
        content: '请选择取货时间'
      });
      return;
    }
    let year = new Date().getFullYear();
    let tostoreDateTime = year + '-' + this.data.tostoreDateTime + ' ' + (this.data.tostoreHourTime || '');
    if (this.data.pickUpType == 3 && this.data.selfDeliveryPhone == 1 && !util.isPhoneNumber(this.data.phone)) {
      app.showModal({
        content: '请填写正确的手机号'
      });
      return;
    }
    if (this.data.hasRequiredSuppInfo && !this.data.deliverydWrite && !this.data.aloneDeliveryShow) {
      app.showModal({
        content: '商品补充信息未填写，无法进行支付',
        confirmText: '去填写',
        confirm: function () {
          _this.goToAdditionalInfo();
        }
      })
      return;
    }
    if (this.data.aloneDeliveryShow) {
      let a = this.data.additional_info;
      let id = this.data.additional_goodsid_arr[0];
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
    app.sendRequest({
      url: '/index.php?r=AppShop/addCartOrder',
      method: 'post',
      data: {
        cart_id_arr: this.cart_id_arr,
        formId: e.detail.formId,
        sub_shop_app_id: this.franchisee_id,
        selected_benefit: selected_benefit,
        is_balance: (this.data.pickUpType == 4 && this.data.account_type == 2) ? 0 : (this.data.useBalance ? 1 : 0),
        ecommerce_info: {
          'ec_tostore_data': {
            'ec_tostore_order_type': tostoreOrderType || 1,
            'ec_tostore_appointment_time': tostoreOrderType == 1 || !this.data.selfAppointmentSwitch ? '' : tostoreDateTime,
            'ec_tostore_buyer_phone': this.data.phone || '',
            'ec_tostore_appointment_time_type': this.data.tostoreTimeType || '',
            'ec_tostore_location_id': this.data.locationId || ''
          },
          'intra_city_data': _this._mapIntraCityOptions(),
          'ec_dining_data': {
            'ordering_food_type': 1,  // 点餐方式
            'dining_mode': _this.data.dining_mode,   // 就餐方式
            'people_num': _this.data.people_num,  // 就餐人数
            'take_meal_type': _this.data.take_meal_type,  // 取餐类型
            'location_id': _this.data.ec_location_id, // 座位号码
            'account_type': _this.data.account_type, // 结账方式
            'allow_add_dish': _this.data.allow_add_dish, // 允许加菜
            'allow_app_account': _this.data.allow_app_account  // 允许结账
          },
        },
        pick_up_type: this.data.pickUpType,
        self_delivery_app_store_id: this.data.pickUpType == 3 ? this.data.selectDelivery.id : '',
        remark: this.data.orderRemark,
        address_id: this.data.pickUpType == 1 ? this.data.selectAddress.id : (this.data.pickUpType == 4 ? '' : this.data.pickUpType == 2 ? this.data.selectSameJourney.id:''),
        additional_info: this.data.additional_info,
        voucher_coupon_goods_info: this.data.exchangeCouponData.voucher_coupon_goods_info,
        is_pay_on_delivery: this.data.cashOnDelivery ? 1 : 0,
        settlement_activity_info: this.data.cashOnDelivery || (this.data.pickUpType == 4 && this.data.account_type == 2) ? {} : this.data.payGiftOptions,   // 货到付款和堂食先付后吃不使用支付结算活动
      },
      success: function (res) {
        app.sendUseBehavior([{goodsId: res.data}],5); // 行为轨迹埋点 提交订单
        let { total_price, settlement_activity_item_price } = res;
        if (_this.data.pickUpType == '3') {
          app.requestSubscribeMessage([{
            type: 8,
            obj_id: res.data
          }]).then(()=> {
            _afterAddOrder();
          })
        }else if (_this.data.pickUpType == '1' || _this.data.pickUpType == '2'){
          app.requestSubscribeMessage([{
            type: 1,
            obj_id: res.data
          }]).then(()=> {
            _afterAddOrder();
          })
        }else {
          _afterAddOrder();
        }
        function _afterAddOrder () {
          if(+settlement_activity_item_price){                       // 购买储值或者付费卡的金额
            total_price = ((+total_price) + (+settlement_activity_item_price)).toFixed(2);
          }
          _this.setData({
            totalPayment: total_price
          })
          if (_this.data.pickUpType == 4) {
            if (_this.data.account_type == 2) {
              let pagePath = '/eCommerce/pages/diningOrderDetail/diningOrderDetail?detail=' + res.data + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : '');
              app.turnToPage(pagePath, 1);
              return;
            }
          }
          if (_this.data.cashOnDelivery) {
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
      successStatusAbnormal: function () {
        _this.requesting = false;
      }
    });
  },
  payOrder: function (orderId) {
    var _this = this;
    function paySuccess() {
      let goodsArr = [];
      for (let item of _this.data.goodsList){
        goodsArr.push({
          goodsId: item.goods_id,
          num: item.num
        });
      }
      app.sendUseBehavior(goodsArr,1);
      app.sendUseBehavior(goodsArr,11); //黑沙转发 购物
      app.sendUseBehavior(goodsArr,4,2); //取消加购
      let router = _this.data.pickUpType == 4 && _this.data.account_type == 2 ? 'diningOrderDetail/diningOrderDetail?detail=' : 'goodsOrderPaySuccess/goodsOrderPaySuccess?detail=';
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
      let router = _this.data.pickUpType == 4 ? 'diningOrderDetail/diningOrderDetail?detail=' : 'goodsOrderDetail/goodsOrderDetail?detail=';
      if (_this.is_group) {
        if (_this.data.teamToken) {
          app.turnBack();
          return;
        }
        app.turnToPage('/eCommerce/pages/groupOrderDetail/groupOrderDetail?id=' + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      } else {
        app.turnToPage('/eCommerce/pages/' + router + orderId + (_this.franchisee_id ? '&franchisee=' + _this.franchisee_id : ''), 1);
      }
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
  goToMyAddress: function () {
    var addressId = this.data.selectAddress ? this.data.selectAddress.id: this.data.selectDelivery.id;
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/myAddress/myAddress?id=' + addressId);
  },
  useBalanceChange: function(e){
    this.setData({
      useBalance: e.detail.value
    });
    this.getCalculationInfo();
  },
  useCashDelivery: function(e){
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
      this.setData(setDataObj);
    }
  },
  goToAdditionalInfo: function(){
    app.setGoodsAdditionalInfo(this.additional_info);
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo');
  },
  exchangeCouponInit: function(id){
    var _this = this;
    let params = {};
    params['data_id'] = id;
    let franchiseeId = _this.franchiseeId || app.getChainId() || '';
    if (franchiseeId) {
      params['app_id'] = franchiseeId;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: params,
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
        if(goods.model_items.length){
          selectModelInfo['price'] = Number(goods.model_items[0].price);
          selectModelInfo['imgurl'] = goods.model_items[0].img_url;
          selectModelInfo['modelId'] = goods.model_items[0].id;
        } else {
          selectModelInfo['price'] = Number(goods.price);
          selectModelInfo['imgurl'] = goods.cover;
        }
        for(var key in goods.model){
          if(key){
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
      successStatusAbnormal: function(){
        app.showModal({
          content: '兑换的商品已下架'
        });
      }
    });
  },
  exchangeCouponHideDialog: function(){
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
  exchangeCouponSelectSubModel: function(e){
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
        if( selectModels[i] == selectSubModelId[j] ){
          text += '“' + model[i].subModelName[j] + '” ';
        }
      }
    }
    data['exchangeCouponData.selectModelInfo.models'] = selectModels;
    data['exchangeCouponData.selectModelInfo.models_text'] = text;
    this.setData(data);
    this.exchangeCouponResetSelectCountPrice();
  },
  exchangeCouponResetSelectCountPrice: function(){
    var _this = this,
        selectModelIds = this.data.exchangeCouponData.selectModelInfo.models.join(','),
        modelItems = this.data.exchangeCouponData.goodsInfo.model_items,
        data = {};
    for (var i = modelItems.length - 1; i >= 0; i--) {
      if(modelItems[i].model == selectModelIds){
        data['exchangeCouponData.selectModelInfo.stock'] = modelItems[i].stock;
        data['exchangeCouponData.selectModelInfo.price'] = modelItems[i].price;
        data['exchangeCouponData.selectModelInfo.modelId'] = modelItems[i].id;
        data['exchangeCouponData.selectModelInfo.imgurl'] = modelItems[i].img_url;
        break;
      }
    }
    this.setData(data);
  },
  exchangeCouponConfirmGoods: function(){
    let _this = this;
    let goodsInfo = _this.data.exchangeCouponData.goodsInfo;
    let model = goodsInfo.model;
    let selectModels = _this.data.exchangeCouponData.selectModelInfo.models;
    let model_value_str = '';
    if(selectModels.length > 0){
      for (let i = 0; i < selectModels.length; i++) {
        let selectSubModelId = model[i].subModelId;
        for (let j = 0; j < selectSubModelId.length; j++) {
          if( selectModels[i] == selectSubModelId[j] ){
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
  toDeliveryList: function (){
    let _this = this;
    let url = '';
    if (_this.franchisee_id){
      url += '?franchiseeId=' + _this.franchisee_id;
      url += _this.data.selectDelivery.id ? '&deliveryId=' + _this.data.selectDelivery.id : '';
    }else{
      url += _this.data.selectDelivery.id ? '?deliveryId=' + _this.data.selectDelivery.id : '';
    }
    if (this.data.onlyImmediatlyPickSwitch) {
      this.onlyImme = true;
    }
    app.turnToPage('/eCommerce/pages/goodsDeliveryList/goodsDeliveryList' + url);
  },
  showMemberDiscount: function(){
    this.selectComponent('#component-memberDiscount').showDialog(this.data.selectDiscountInfo);
  },
  afterSelectedBenefit: function(event){
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
  selectPickMethod: function (first, secType) {
    let _this = this;
    let cartIdArr = this.cart_id_arr;
    let seckillType = secType || this.data.seckillType;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getCanUsePickUpTypeAtAddOrder',
      method: 'post',
      data: {
        cart_id_arr: cartIdArr,
      },
      success: function (res) {
        const { goods_pick_up_type_arr, intra_city_data, dining_data, express_data } = res.data;
        let pickUpType = _this.data.pickUpType;
        let pickUpTypeArr = goods_pick_up_type_arr;
        if(pickUpTypeArr.indexOf('5') >= 0){
          pickUpTypeArr.splice(pickUpTypeArr.indexOf(5), 1);
        }
        if (seckillType == 1) { // 过滤活动秒杀商品
          for (let i = 0; i < pickUpTypeArr.length; i++) {
            if (pickUpTypeArr[i] == 4) {
              pickUpTypeArr.splice(i, 1);
            }
          }
        }
        if (!pickUpType || pickUpType === -1) {
          if (goods_pick_up_type_arr[0] == 2 && goods_pick_up_type_arr[1] && (intra_city_data.is_enough_price != 1 || intra_city_data.in_business_time != 1)) {
            pickUpType = goods_pick_up_type_arr[1];
          } else {
            pickUpType = goods_pick_up_type_arr[0];
          }
        }
        _this.setData({
          pickUpType : _this.getDefaultPickUpTypeVal || pickUpType,
          pickUpTypeArr,
          dining_data: dining_data || '',
          selectDiscountInfo: {}, // 清空已选优惠信息
          intraCityData: intra_city_data,
          isShowPickMask: first == 'first' ? false : true,
        })
        if (first == 'first') {
          switch (_this.data.pickUpType) {
            case '4':
              _this.getDiningFuncSetting(_this.getDiningData);
              break;
            case '3':
              _this.getLocation().then(() => {
                return _this.getInStore();
              }).then(() => {
                _this.getSelfDeliveryList();
              });
              break;
            case '2':
              if (intra_city_data.in_business_time == 0 && pickUpTypeArr.length == 1) {
                app.showModal({
                  content: '店铺歇业中，不支持此配送！',
                  confirmText: '知道了',
                  confirm: function (res) {
                    app.turnBack();
                  }
                })
                return;
              } else {
                _this.setData({
                  sameJourneyTimeType: 1
                })
              }
              break;
          };
          if(_this.data.pickUpType == 2) {
            _this.showSameJourneyTime('onlyImme');
          }
          _this.data.pickUpType != 4 && _this.getCalculationInfo();
          if (_this.data.pickUpType !== 3 && goods_pick_up_type_arr.indexOf('3') !== -1){
            _this.getLocation().then(() => {
              _this.getInStore();
            })
          }
        }
      },
      successShowModalConfirm: function () {
        app.turnBack();
      }
    });
  },
  deliveryWayChange: function (event) {
    let type = event.currentTarget.dataset.type;
    this.setData({
      selectDiscountInfo: {}, // 清空已选优惠信息
      pickUpType: type,
      sameJourneyTimeType: type == 2 ? 1 : '',
      isShowPickMask: false,
      cashOnDelivery: false
    })
    if (type == 3) {
      this.getSelfDeliveryList();
    }else if (type == 4) {
      this.getDiningFuncSetting(this.getDiningData);
    }
    type != 4 && this.getCalculationInfo();
  },
  goSameJourneyAddress: function (e) {
    let selectSameJourney = this.data.selectSameJourney;
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/goodsSameJourney/goodsSameJourney?from=preview&sameJourneyId=' + (selectSameJourney ? selectSameJourney.id : '') + '&franchiseeId=' + this.franchisee_id);
  },
  getGoodsStoreSet: function (type) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getPickUpGoodsTypeSetting',
      data: {
        pick_up_type: type,
        sub_shop_app_id: this.franchisee_id
      },
      success: function (res) {
        let configData = res.data.config_data;
        if (type == 3 && configData) {
          _this.setData({
            selfAppointmentSwitch: (configData.pick_up_time_status == 1 && configData.appointment.status == 1) ? true : false,
            onlyImmediatlyPickSwitch: (configData.pick_up_time_status == 1 && configData.appointment.status != 1 && configData.immediate_info.self_pcik_up_status == 1) ? true : false,
            selfDeliveryPhone: configData.is_phone,
            selfDeliveryScan: (configData.pick_up_time_status == 1 && configData.immediate_info.status == 1 && configData.immediate_info.scan_qrcode_status == 1) ? true : false
          })
          if (_this.data.onlyImmediatlyPickSwitch && _this.data.selectDelivery) {
            _this.showServiceTime('onlyImme');
          }
        } else if (type == 2 && configData) {
          _this.getsameJourneyTime(configData.business_rule);
        } else if (type == 4) {
          _this.setData({
            app_store_data: res.data.app_store_data || ''
          })
        }
      }
    })
  },
  getsameJourneyTime: function (businessRule) {
    let sameJourneyHoursArr = [];
    let currentMinute = new Date().getMinutes() + + Number(this.data.deliver_time);
    let startHours = new Date().getHours();
    if (currentMinute >= 60) {
      startHours += parseInt(currentMinute / 60);
      currentMinute = currentMinute - 60 * parseInt(currentMinute / 60);
    }
    if (businessRule.type == 1) {
      let currentLimitFlag = true;
      for (; startHours < 24; startHours++) {
        if (currentLimitFlag && currentMinute > 0 && currentMinute <= 30) {
          currentLimitFlag = false;
          sameJourneyHoursArr.push(startHours + ':30');
          continue;
        }
        if (currentLimitFlag && currentMinute > 30) {
          currentLimitFlag = false;
          startHours++
        }
        sameJourneyHoursArr.push(startHours + ':00');
        sameJourneyHoursArr.push(startHours + ':30');
      }
    } else {
      let currentWeek = new Date().getDay();
      let businessTime;
      businessRule.type == 2 && businessRule.custom.business_time.map((item) => {
        if (currentWeek == 0) {
          currentWeek = 7;
        }
        if (item.business_week[currentWeek - 1] == 1) {
          businessTime = item.business_time_interval;
        }
      })
      console.log(businessTime);
      businessTime　&& businessTime.map((item) => {
        let fSH = startHours; //是否要判断分钟，初始开始小时
        let fEH = Number(item.end_time.substring(0, 2)); //是否要判断分钟，初始结束小时
        let sH = Number(item.start_time.substring(0, 2));
        let eH = Number(item.end_time.substring(0, 2));
        let sT = Number(item.start_time.substring(3, 5));
        let eT = Number(item.end_time.substring(3, 5));
        if (startHours <= sH) {
          startHours = sH;
          currentMinute = 0;
        } else if (startHours > eH) {
          return;
        }
        for (; startHours <= eH; startHours++) {
          if (startHours == fSH && currentMinute <= 30 && currentMinute != 0) {
            sameJourneyHoursArr.push(startHours + ':30');
            continue;
          } else if (startHours == fSH && currentMinute > 30) { continue }; //开始分钟数大于三十分钟则跳过当前时间段
          if (startHours == fEH && eT < 30) {
            sameJourneyHoursArr.push(startHours + ':00');
            continue;
          } else if (startHours == fEH && eT == 0) { continue }; //结束分钟数等于0则跳过当前时间段
          sameJourneyHoursArr.push(startHours + ':00');
          sameJourneyHoursArr.push(startHours + ':30');
        }
      })
    }
    this.setData({
      sameJourneyHoursArr: sameJourneyHoursArr,
      isShowSameJourneyTime: true
    })
  },
  selectSameJourneyTime: function (e) {
    let dateArr = this.data.sameJourneyConfig.date_arr;
    let index = e.currentTarget.dataset.index;
    let sameJourneyDateTime = dateArr[index].date;
    let sameJourneyHoursArr = dateArr[index].duration
    this.setData({
      dateIndex: index,
      sameJourneyDateTime,
      sameJourneyHoursArr,
      sameJourneyHourTime: ''
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
    }, 9 - a[b][0].value.length)
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
  closeGoodsPick: function () {
    this.setData({
      isShowPickMask: false,
      isShowServiceTime: false,
      isShowSameJourneyTime: false
    })
  },
  showServiceTime: function (type) {
    let deliveryData = this.data.selectDelivery;
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetEcTostoreAppointmentDateList',
      data: {
        sub_shop_app_id: _this.franchisee_id,
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
        let tostoreDateTime = '';
        let tostoreWeekTime = '';
        let dateArr = data.date_arr;
        let advanceAppointmentInfo = data.setting_data.appointment.advance_appointment_info;
        let startHours = new Date().getHours();
        let businessTimeRule = data.business_time_rule; //上门自提营业时间
        let maxEndHour = 24;
        let currentMinute = new Date().getMinutes();
        let showImmediatelyTime = false;
        let noImmediaPick = (data.setting_data.immediate_info.status == 1 && advanceAppointmentInfo.type == 1) ? true : false; //判断上门自提立即取货开关开没开
        let noAppointmentShow = true; //是否显示暂无营业时间
        if (businessTimeRule.type == 2) { //获取自定义当天营业时间的终止小时
          let week = dateArr[0].week;
          let timeArr;
          businessTimeRule.custom.business_time.map((item) => {
            if (week == 0) {
              week = 7;
            }
            if (item.business_week[week - 1] == 1) {
              timeArr = item.business_time_interval;
              maxEndHour = +timeArr[timeArr.length - 1].end_time.substring(0, 2);
            }
          })
          timeArr && timeArr.map((item) => {
            let sH = Number(item.start_time.substring(0, 2));
            let eH = Number(item.end_time.substring(0, 2));
            let sT = Number(item.start_time.substring(3, 5));
            let eT = Number(item.end_time.substring(3, 5));
            if (((startHours > sH && startHours < eH) || (startHours == sH && currentMinute >= sT))) { showImmediatelyTime = true }
          })
        } else {
          showImmediatelyTime = true;
        }
        for (let i = 0; i < dateArr.length; i++) {
          if (i == 0 && ((advanceAppointmentInfo.type == 2 && +advanceAppointmentInfo.num + startHours >= maxEndHour) || (advanceAppointmentInfo.type == 1 && startHours >= maxEndHour))) { dateArr[i].is_vaild = 0; noImmediaPick = false};
          if (dateArr[i].is_vaild == 1 && tostoreTimeType != 1) {
            tostoreDateTime = dateArr[i].date;
            tostoreWeekTime = dateArr[i].week;
            break;
          }
        }
        dateArr.map((item) => {
          if (item.is_vaild == 1) {
            noAppointmentShow = false;
          }
        })
        _this.businessTimeType = businessTimeRule.type;
        if (_this.isFranchisee) {
          _this.setData({
            [`mulShopsInfo.${appId}.getEcTostoredate`]: data,
            [`mulShopsInfo.${appId}.waitingQueueTime`]: data.duration_time,
            [`mulShopsInfo.${appId}.tostoreTimeType`]: tostoreTimeType,
            [`mulShopsInfo.${appId}.noImmediaPick`]: noImmediaPick,
            [`mulShopsInfo.${appId}.tostoreDateTime`]: mulShopsInfo[_this.selectedAppId].tostoreDateTime ? mulShopsInfo[_this.selectedAppId].tostoreDateTime : tostoreDateTime,
            [`mulShopsInfo.${appId}.tostoreWeekTime`]: mulShopsInfo[_this.selectedAppId].tostoreWeekTime ? mulShopsInfo[_this.selectedAppId].tostoreWeekTime : tostoreWeekTime,
            [`mulShopsInfo.${appId}.businessTimeRule`]: businessTimeRule.type == 1 ? '' : businessTimeRule.custom.business_time,
            [`mulShopsInfo.${appId}.advanceAppointmentInfo`]: advanceAppointmentInfo,
            [`mulShopsInfo.${appId}.noAppointmentShow`]: noAppointmentShow,
            'isShowServiceTime': true,
          });
        } else {
          _this.setData({
            getEcTostoredate: data,
            waitingQueueTime: data.duration_time,
            tostoreTimeType: tostoreTimeType,
            isShowServiceTime: true,
            noImmediaPick: noImmediaPick,
            tostoreDateTime: _this.data.tostoreDateTime ? _this.data.tostoreDateTime : tostoreDateTime,
            tostoreWeekTime: _this.data.tostoreWeekTime ? _this.data.tostoreWeekTime : tostoreWeekTime,
            businessTimeRule: businessTimeRule.type == 1 ? '' : businessTimeRule.custom.business_time,
            advanceAppointmentInfo: advanceAppointmentInfo,
            noAppointmentShow: noAppointmentShow,
            showImmediatelyTime: showImmediatelyTime
          });
        }
        if (tostoreTimeType != 1) {
          _this.getTostoreTime();
        }
        businessTimeRule.type == 2 && _this.getNoAppointmentWord();
      }
    });
  },
  getNoAppointmentWord: function () {
    let a = '商家营业时间：';
    let b = '';
    let businessTimeRule = this.data.businessTimeRule;
    businessTimeRule.map((item) => {
      for (let i = 0; i < item.business_week.length; i++) {
        if (item.business_week[i] == 1) {
          switch(i){
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
    let appointment = this.data.getEcTostoredate.setting_data.appointment;
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
    this.setData({
      noAppointmentWorda: a,
      noAppointmentWordb: b
    })
  },
  selectTostoreTime: function (e) {
    let dateArr = this.data.getEcTostoredate.date_arr;
    let index = e.currentTarget.dataset.index;
    let tostoreDateTime = dateArr[index].date;
    let tostoreWeekTime = dateArr[index].week;
    this.setData({
      tostoreOrderType: 2,
      dateIndex: index,
      tostoreDateTime: tostoreDateTime,
      tostoreWeekTime: tostoreWeekTime,
      isShowServiceTime: this.data.tostoreTimeType != 1 ? true : false
    })
    this.getTostoreTime();
  },
  getTostoreTime: function () {
    let currentMonth = new Date().getMonth() + 1;
    let currentMinute = new Date().getMinutes();
    let startHours = new Date().getHours();
    let currentDay = new Date().getDate();
    let currentDate = (currentMonth < 10 ? '0' + currentMonth : currentMonth) + '-' + (currentDay < 10 ? '0' + currentDay : currentDay);
    let tostoreHoursArr = [];
    let currentLimitFlag = true;
    let businessTimeRule = this.data.businessTimeRule;
    let tostoreWeekTime = Number(this.data.tostoreWeekTime);
    let businessTime;
    let showImmediatelyTime = this.businessTimeType == 1 ? true : false; //1为全年 2为自定义
    let advanceAppointmentInfo = this.data.advanceAppointmentInfo;
    let advanceTime = +advanceAppointmentInfo.num + startHours > 24 ? +advanceAppointmentInfo.num + startHours - 24 : +advanceAppointmentInfo.num + startHours;
    this.businessTimeType == 2 && businessTimeRule.map((item) => {
      if (tostoreWeekTime == 0) {
        tostoreWeekTime = 7;
      }
      if (item.business_week[tostoreWeekTime - 1] == 1) {
        businessTime = item.business_time_interval;
      }
    })
    if (currentDate === this.data.tostoreDateTime) {
      if (this.businessTimeType == 2) {
        businessTime &&　businessTime.map((item) => {
          let fSH = startHours; //是否要判断分钟，初始开始小时
          let fEH = Number(item.end_time.substring(0, 2)); //是否要判断分钟，初始结束小时
          let sH = Number(item.start_time.substring(0, 2));
          let eH = Number(item.end_time.substring(0, 2));
          let sT = Number(item.start_time.substring(3, 5));
          let eT = Number(item.end_time.substring(3, 5));
          if (startHours < advanceTime) { fSH = startHours = advanceTime };
          if (((startHours > sH && startHours < eH) || (startHours == sH && currentMinute >= sT)) && !advanceTime) { showImmediatelyTime = true }
          if (startHours < sH) {
            startHours = sH;
            currentMinute = 0;
          } else if (startHours > eH) {
            return;
          }
          for (; startHours <= eH; startHours++) {
            if (this.data.tostoreTimeType == 2) {
              if (startHours == fEH) { continue; }
              tostoreHoursArr.push(startHours + ':00-' + (startHours + 1) + ':00');
            } else {
              if (startHours == fSH && currentMinute <= 30 && currentMinute != 0) {
                tostoreHoursArr.push(startHours + ':30-' + (startHours + 1) + ':00');
                continue;
              } else if (startHours == fSH && currentMinute > 30) { continue }; //开始分钟数大于三十分钟则跳过当前时间段
              if (startHours == fEH && eT >= 30) {
                tostoreHoursArr.push(startHours + ':00-' + startHours + ':30');
                continue;
              } else if (startHours == fEH && eT == 0) { continue }; //结束分钟数等于0则跳过当前时间段
              tostoreHoursArr.push(startHours + ':00-' + startHours + ':30');
              tostoreHoursArr.push(startHours + ':30-' + (startHours + 1) + ':00');
            }
          }
        })
      } else {
        if (startHours < advanceTime) { startHours = advanceTime };
        for (; startHours < 24; startHours++) {
          if (this.data.tostoreTimeType == 2) {
            if (currentLimitFlag && currentMinute > 0) {
              currentLimitFlag = false;
              startHours++
            }
            if (startHours >= 24) { continue };
            tostoreHoursArr.push(startHours + ':00-' + (startHours + 1) + ':00');
          } else {
            if (currentLimitFlag && currentMinute > 0 && currentMinute <= 30) {
              currentLimitFlag = false;
              tostoreHoursArr.push(startHours + ':30-' + (startHours + 1) + ':00');
              continue;
            }
            if (currentLimitFlag && currentMinute > 30) {
              currentLimitFlag = false;
              startHours++
            }
            if (startHours >= 24) { continue };
            tostoreHoursArr.push(startHours + ':00-' + startHours + ':30');
            tostoreHoursArr.push(startHours + ':30-' + (startHours + 1) + ':00');
          }
        }
      }
    } else {
      if (this.businessTimeType == 2) {
        businessTime && businessTime.map((item) => {
          let fSH = Number(item.start_time.substring(0, 2)); //是否要判断分钟，初始开始小时
          let fEH = Number(item.end_time.substring(0, 2)); //是否要判断分钟，初始结束小时
          let sH = Number(item.start_time.substring(0, 2));
          if (this.data.getEcTostoredate.date_arr[1].date == this.data.tostoreDateTime && sH < advanceTime && +advanceAppointmentInfo.num + startHours > 24) { sH = advanceTime };
          let eH = Number(item.end_time.substring(0, 2));
          let sT = Number(item.start_time.substring(3, 5));
          let eT = Number(item.end_time.substring(3, 5));
          for (; sH <= eH; sH++) {
            if (this.data.tostoreTimeType == 2) {
              if (sH == fEH || (sH == fSH && sT > 0)) { continue }
              tostoreHoursArr.push(sH + ':00-' + (sH + 1) + ':00');
            } else {
              if (sH == fSH && sT <= 30 && sT != 0) {
                tostoreHoursArr.push(sH + ':30-' + (sH + 1) + ':00');
                continue;
              } else if (sH == fSH && sT > 30) { continue }; //开始分钟数大于三十分钟则跳过当前时间段
              if (sH == fEH && eT <= 30 && eT != 0) {
                tostoreHoursArr.push(sH + ':00-' + sH + ':30');
                continue;
              } else if (sH == fEH && eT == 0) { continue }; //结束分钟数等于0则跳过当前时间段
              tostoreHoursArr.push(sH + ':00-' + sH + ':30');
              tostoreHoursArr.push(sH + ':30-' + (sH + 1) + ':00');
            }
          }
        })
      } else {
        let i = 0;
        if (this.data.getEcTostoredate.date_arr[1].date == this.data.tostoreDateTime && i < advanceTime && +advanceAppointmentInfo.num + startHours > 24) { i = advanceTime };
        for (; i < 24; i++) {
          if (this.data.tostoreTimeType == 2) {
            tostoreHoursArr.push(i + ':00-' + (i + 1) + ':00');
          } else {
            tostoreHoursArr.push(i + ':00-' + i + ':30');
            tostoreHoursArr.push(i + ':30-' + (i + 1) + ':00');
          }
        }
      }
    }
    this.setData({
      tostoreHoursArr: tostoreHoursArr,
      showImmediatelyTime: showImmediatelyTime
    })
  },
  selectTostoreHourTime: function (e) {
    let tostoreHoursArr = this.data.tostoreHoursArr;
    let index = e.currentTarget.dataset.index;
    let tostoreHourTime = tostoreHoursArr[index];
    this.setData({
      tostoreOrderType: 2,
      tostoreHourTime: tostoreHourTime,
      isShowServiceTime: false
    })
    this.getTostoreTime();
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
    } else if (_this.isFranchisee) {
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
      data: params,
      success: function (res) {
        let storeList = res.data.store_list_data;
        if (!storeList.length) {
          app.showModal({
            content: '商家暂无自提门店',
            confirm: function() {
              app.turnBack();
            }
          })
          return;
        }
        if (storeList.length == 1) {
          _this.setData({
            selectDelivery: storeList[0]
          })
        }
        _this.getGoodsStoreSet(3);
      }
    })
  },
  tostoreImmediately: function () {
    this.setData({
      tostoreOrderType: 1,
      tostoreHourTime: '',
      isShowServiceTime: false
    })
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
            sub_shop_app_id: _this.franchisee_id
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
  inputPhone: function (e) {
    this.setData({
      phone: e.detail.value
    })
  },
  hidePerfectAddress: function () {
    this.setData({
      expressAddressNull: false
    })
  },
  manuallyAddAddress: function(){
    this.isFromSelectAddress = true;
    app.turnToPage('/eCommerce/pages/addAddress/addAddress');
  },
  importWeChatAddress: function(){
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
        })
        typeof callback == 'function' && callback();
      }
    })
  },
  checkIsAddDishing: function () {
    let that = this;
    if (that.data.account_type == 1) {
      that.getCalculationInfo();
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
          dining_mode: res.ec_dining_data ? res.ec_dining_data.dining_mode : that.data.dining_mode,
        })
        that.getCalculationInfo();
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
  selectedPayGift: function(e){
    const { detail } = e;
    this.setData({
      payGiftOptions: detail.options || {}
    })
    this.getCalculationInfo();
  },
  checkedPickRadioFn: function (e) {
    let type = e.currentTarget.dataset.type - 0;
    if (type == this.data.pickUpType) return;
    this.switchWayDataInitial(type);
  },
  switchWayDataInitial: function (type) {
    this.setData({
      pickUpType: type,
      selectDiscountInfo: {},
      sameJourneyTimeType: type == 2 ? 1 : '',
      cashOnDelivery: false
    })
    if (type == 3) {
      this.getSelfDeliveryList();
    } else if (type == 4) {  // 点餐
      this.getDiningFuncSetting(this.getDiningData);
    }
    type != 4 && this.getCalculationInfo();
  },
  confirmGoodsPick: function () {
    this.setData({
      isShowPickMask: false,
      ori_pick_up_type: this.data.pickUpType
    })
  },
  stopPropagation: function() {
  },
  getXcxUserInfo: function () {
    var that = this;
    console.log(app.getUserInfo());
    if (app.getUserInfo().phone) {
      app.sendRequest({
        url: '/index.php?r=AppData/getXcxUserInfo',
        success: res => {
          console.log(res);
          if (res.status == 0) {
            var data = res.data;
            that.setData({
              phone: data.phone ? (app.getUserInfo().phone || '') : '',
            });
          }
        }
      })
    }
  },
  showSameJourneyTime: function (type) {
    let _this = this;
    let dataObj = {};
    dataObj = this.data;
    let sameJourneyData = this.data.selectSameJourney || {};
    if (dataObj.sameJourneyConfig && +dataObj.sameJourneyConfig.appointment_setting_data.status === 0) {  // 没有开启预约
      return;
    }
    if (!sameJourneyData.id && type != 'onlyImme') {
      app.showModal({
        content: '请先选择地址'
      })
      return
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getIntraCityAppointmentDateList',
      data: {
        sub_shop_app_id: _this.franchisee_id || '',
        longitude: sameJourneyData.latitude || 1,
        latitude: sameJourneyData.longitude || 10
      },
      success: function (res) {
        let data = res.data;
        let { appointment_setting_data } = data;
        let sameJourneyTimeType = 3;
        let sameJourneyDateTime = dataObj.sameJourneyDateTime;
        let sameJourneyHoursArr;
        let dateArr = data.date_arr;
        let advanceAppointmentInfo = appointment_setting_data.advance_appointment_info || { type: 3, num: 1 };
        let businessTimeRule = data.business_time_rule; // 门店的营业时间
        let sameJourneyImmediatelyState = 1;
        let noAppointmentShow = appointment_setting_data.status == 1;     // 是否显示暂无营业时间
        sameJourneyTimeType = appointment_setting_data.status == 1 ? appointment_setting_data.appointment_time_type : 3;       // 0为无预约 1为天 2为时 3为半小时
        if (_this.data.intraCityData.in_business_time  ==  0 || (appointment_setting_data.status == 1 && +advanceAppointmentInfo.num >= 1))  {
          sameJourneyImmediatelyState = 0;
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
        noAppointmentShow && _this.getNoAppointmentWord();
      }
    });
  },
  selectSameJourneyTimeHour: function (e) {
    let { type, index } = e.currentTarget.dataset;
    let sameJourneyHoursArr = this.data.sameJourneyHoursArr;
    let sameJourneyHourTime = sameJourneyHoursArr[index];
    this.setData({
      sameJourneyImmediatelyState: type == 'immedia' ? 1 : 2,
      sameJourneyHourTime: type == 'immedia' ? '' : sameJourneyHourTime,
      isShowSameJourneyTime: false
    });
  },
  _mapIntraCityOptions() {
    let appointmentTime = '';
    let year = new Date().getFullYear();
    let dataObj = {}
    dataObj = this.data;
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
  getDefaultPickUpType: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetNormalDefaultPickUpType',
      method: 'get',
      success: function (res) {
        if (res.data && res.data != 4) {
          _this.getDefaultPickUpTypeVal = res.data;
          _this.setData({
            pickUpType : res.data
          })
        }
      }
    });
  },
})
