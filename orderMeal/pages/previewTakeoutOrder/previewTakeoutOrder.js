var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    takeoutShopName: '',
    takeoutShopImg: '',
    goodsList: [],
    selectAddress: {},
    discountList: [],
    selectDiscountInfo: {},
    selectDiscountIndex: '',
    orderRemark: '',
    is_self_delivery: 0,
    express_fee: '',
    balance: '',
    useBalance: true,
    deduction: '',
    discount_cut_price: '',
    original_price: '',
    totalPayment: '',
    shopAddress: '',
    noAdditionalInfo: true,
    fullTimeList:[],
    leagueBenefitList: [],  // 联盟优惠券列表
    selectedLeagueBenefitInfo: {},  // 选中的联盟优惠券
    selectedLeagueBenefitIndex: -1, // 联盟优惠下标
    leagueBenefitPrice: '' // 联盟优惠券优惠价格
  },
  isFromBack: false,
  franchisee_id: '',
  cart_id_arr: [],
  cart_data_arr: [],
  requesting: false,
  additional_info: {},
  takeoutShopInfo: {},
  onLoad: function (options) {
    this.franchisee_id = options.franchisee || '';
    let isFranchisee = options.isFranchisee ? true : false;
    if (!this.isFranchisee) {
      let { goodsStoreConfig, hasFranchiseeList, hasFranchiseeChain } = app.globalData;
      if (goodsStoreConfig['cart_config'] && goodsStoreConfig['cart_config'].is_merge_shoppingcart == 1) { // 是否开启合并购物车
        if (hasFranchiseeList || hasFranchiseeChain) {
          isFranchisee = true;
        }
      }
    }
    this.isFranchisee = isFranchisee;
    this.cart_id_arr = options.cart_arr ? decodeURIComponent(options.cart_arr).split(',') : [];
    this.isFranchiseeCoupon = this.isFranchisee ? true : this.franchisee_id ? true : !this.isFranchisee && !this.franchisee_id && (app.globalData.hasFranchiseeList || app.globalData.hasFranchiseeChain) ? true : false;     // 子店 总店 多店结算均可使用联盟优惠券
    let that = this;
    this.getTakeoutShopInfo(function (data) {
      app.globalData.takeoutShopInfo = data.data;
      that.takeoutShopInfo = data.data;
      that.dataInitial();
    })
  },
  dataInitial: function () {
    this.getCalculationInfo();
    this.getShopAddress();
    this.getCartList();
  },
  onShow: function () {
    if(this.isFromBack){
      this.getCalculationInfo();
      this.isFromBack = false;
    }
  },
  getTakeoutShopInfo: function (successFn) {
    let that = this;
    let franchiseeId = that.franchisee_id;
    app.sendRequest({
      url: '/index.php?r=AppShop/getTakeOutInfo',
      data: {
        sub_app_id: franchiseeId
      },
      success: function (res) {
        that.setData({
          takeoutInfo: res.data
        })
        typeof successFn == 'function' && successFn(res);
      }
    });
  },
  getCartList: function () {
    var that = this,
      franchisee_id = this.franchisee_id;
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 100,
        sub_shop_app_id: franchisee_id,
        parent_shop_app_id: franchisee_id ? app.globalData.appId : ''
      },
      success: function (res) {
        var data = [];
        if (that.cart_id_arr.length) {
          for (var i = 0; i <= res.data.length - 1; i++) {
            if (that.cart_id_arr.indexOf(res.data[i].id) >= 0) {
              data.push(res.data[i]);
            }
          }
        } else {
          data = res.data;
        }
        for (var i = 0; i <= data.length - 1; i++) {
          var goods = data[i],
            modelArr = goods.model_value;
          goods.model_value_str = modelArr && modelArr.join ? '(' + modelArr.join('|') + ')' : '';
          that.cart_data_arr.push({
            cart_id: goods.id,
            goods_id: goods.goods_id,
            model_id: goods.model_id,
            num: goods.num
          });
        }
        that.setData({
          goodsList: data,
          takeoutShopName: res.take_out_info.title,
          takeoutShopImg: res.take_out_info.cover,
        });
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
        address_id: this.data.selectAddress.id || app.globalData.takeoutLocate.id,
        cart_id_arr: this.cart_id_arr,
        is_balance: this.data.useBalance ? 1 : 0,
        is_self_delivery: this.data.is_self_delivery,
        selected_benefit: this.data.selectDiscountInfo,
        superimposed: this.isFranchiseeCoupon ? 1 : 0,
        extra_selected_benefit: this.data.selectedLeagueBenefitInfo
      },
      success: function (res) {
        if(res.status === 0){
          var info = res.data,
            benefits = info.can_use_benefit.data,
            goods_info = info.goods_info,
            additional_info_goods = [],
            additional_goodsid_arr = [],
            selectDiscountIndex,
            selectDiscountInfo,
            arriveTime = new Date().getTime() + res.data.deliver_time * 60000,
            arriveTimeList = [],
            endTime = _this.takeoutShopInfo.business_time[_this.takeoutShopInfo.business_time.length - 1].end_time + '',
            newData = {};
            arriveTimeList = _this.timeList(arriveTime, endTime);
          if (benefits.length) {
            benefits.unshift({
              title: '不使用优惠',
              name: '无',
              no_use_benefit: 1
            });
          }
          if (_this.data.selectDiscountInfo && _this.data.selectDiscountInfo.no_use_benefit == 1) {
            selectDiscountInfo = _this.data.selectDiscountInfo;
            selectDiscountIndex = 0;
          } else {
            selectDiscountInfo = info.selected_benefit_info;
            if (selectDiscountInfo && selectDiscountInfo.discount_type) {
              for (var i = 0; i <= benefits.length - 1; i++) {
                if (selectDiscountInfo.discount_type === benefits[i].discount_type) {
                  if (selectDiscountInfo.discount_type === 'coupon') {
                    if (selectDiscountInfo.coupon_id === benefits[i].coupon_id) {
                      selectDiscountIndex = i;
                      break;
                    }
                  } else {
                    selectDiscountIndex = i;
                    break;
                  }
                }
              }
            }
          }
          for (var i = 0; i <= goods_info.length - 1; i++) {
            if (goods_info[i].delivery_id && goods_info[i].delivery_id != 0 && additional_goodsid_arr.indexOf(goods_info[i].id) == -1) {
              additional_goodsid_arr.push(goods_info[i].id);
              additional_info_goods.push(goods_info[i]);
            }
          }
          let shopInfo = _this.takeoutShopInfo;
          if (app.globalData.takeoutAddressSelected && !info.address) {
            info.address = app.globalData.takeoutAddressSelected
          }
          if (info.address.latitude) {
            info.address.is_distance = app.calculationDistanceByLatLng(shopInfo.latitude, shopInfo.longitude, info.address.latitude, info.address.longitude) < shopInfo.deliver_distance ? 1 : 0;
          } else {
            info.address = {};
          }
          newData['disablePay'] = info.is_take_deliver;
          newData['selectAddress'] = info.address;
          newData['discountList'] = benefits;
          newData['selectDiscountIndex'] = selectDiscountIndex || '';
          newData['selectDiscountInfo'] = selectDiscountInfo;
          newData['express_fee'] = info.deliver_fee;
          newData['discount_cut_price'] = +info.discount_cut_price || 0;
          newData['balance'] = info.balance;
          newData['deduction'] = info.use_balance;
          newData['original_price'] = info.original_price;
          newData['totalPayment'] = info.price;
          newData['takeoutShopName'] = _this.takeoutShopInfo.title;
          newData['takeoutShopImg'] = _this.takeoutShopInfo.cover;
          newData['noAdditionalInfo'] = additional_info_goods.length ? false : true;
          newData['arriveTime'] = _this.formatDate(arriveTime);
          newData['arriveTimeList'] = arriveTimeList;
          newData['box_fee'] = info.box_fee;
          newData['totalDiscountCutPrice'] = +info.total_benefit_price || 0;
          if (_this.isFranchiseeCoupon) { // 联盟优惠
            let leagueBenefitList = info.extra_can_use_benefit.data,
              selectedLeagueBenefitIndex = '',
              selectedLeagueBenefitInfo;
            if (leagueBenefitList && leagueBenefitList.length) {
              leagueBenefitList.unshift({
                title: '不使用优惠',
                name: '无',
                no_use_benefit: 1
              });
            }
            if (_this.data.selectedLeagueBenefitInfo && _this.data.selectedLeagueBenefitInfo.no_use_benefit) {
              selectedLeagueBenefitInfo = _this.data.selectedLeagueBenefitInfo;
              selectedLeagueBenefitIndex = 0;
            } else {
              selectedLeagueBenefitInfo = info.extra_selected_benefit;
              if (selectedLeagueBenefitInfo && selectedLeagueBenefitInfo.discount_type) {
                leagueBenefitList.forEach((coupon, index) => {
                  if (selectedLeagueBenefitInfo.discount_type === coupon.discount_type) {
                    if (selectedLeagueBenefitInfo.discount_type === 'coupon') {
                      if (selectedLeagueBenefitInfo.coupon_id == coupon.coupon_id) {
                        selectedLeagueBenefitIndex = index;
                      }
                    }
                  } else {
                    selectedLeagueBenefitIndex = index;
                  }
                });
              }
            }
            newData['leagueBenefitList'] = leagueBenefitList;
            newData['selectedLeagueBenefitIndex'] = selectedLeagueBenefitIndex;
            newData['selectedLeagueBenefitInfo'] = selectedLeagueBenefitInfo;
            newData['leagueBenefitPrice'] = +info.extra_discount_cut_price || 0;
          }
          _this.setData(newData);
          app.setPreviewGoodsInfo(additional_info_goods);
        }
      },
      complete: function(res){
        if(res.status === 1){
          _this.setData({
            selectAddress: {}
          })
        }
      }
    });
  },
  getShopAddress: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getAppShopLocationInfo',
      success: (res) => {
        that.setData({
          shopAddress: res.data
        });
      }
    });
  },
  remarkInput: function (e) {
    var value = e.detail.value;
    if (value.length > 30) {
      value = value.slice(0, 30)
    }
    this.setData({
      orderRemark: value
    });
  },
  previewImage: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src
    });
  },
  clickMinusButton: function (e) {
    var index = e.currentTarget.dataset.index,
      goods = this.data.goodsList[index];
    if (+goods.num <= 0) return;
    this.changeGoodsNum(index, 'minus');
  },
  clickPlusButton: function (e) {
    var index = e.currentTarget.dataset.index;
    this.changeGoodsNum(index, 'plus');
  },
  changeGoodsNum: function (index, type) {
    var goods = this.data.goodsList[index],
      currentNum = +goods.num,
      targetNum = type == 'plus' ? currentNum + 1 : currentNum - 1,
      that = this,
      data = {},
      param;
    if (targetNum == 0 && type == 'minus') {
      app.showModal({
        content: '确定从购物车删除该商品？',
        showCancel: true,
        confirm: () => {
          that.cart_data_arr[index].num = targetNum;
          data['goodsList[' + index + '].num'] = targetNum;
          that.setData(data);
          that.deleteGoods(index);
        }
      })
      return;
    }
    that.cart_data_arr[index].num = targetNum;
    data['goodsList[' + index + '].num'] = targetNum;
    that.setData(data);
    param = {
      goods_id: goods.goods_id,
      model_id: goods.model_id || '',
      num: targetNum,
      sub_shop_app_id: that.franchisee_id
    };
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function (res) {
        that.getCalculationInfo();
      },
      fail: function (res) {
        data = {};
        that.cart_data_arr[index].num = currentNum;
        data['goodsList[' + index + '].num'] = currentNum;
        that.setData(data);
      }
    })
  },
  deleteGoods: function (index) {
    var goodsList = this.data.goodsList,
      that = this,
      listExcludeDelete;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: [this.cart_data_arr[index].cart_id],
        sub_shop_app_id: this.franchisee_id
      },
      success: (res) => {
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
        if (noSameGoodsId) {
          delete that.additional_info[deleteGoodsId];
        }
        that.cart_data_arr.splice(index, 1);
        that.setData({
          goodsList: listExcludeDelete,
        })
        that.getCalculationInfo();
      }
    });
  },
  confirmPayment: function (e) {
    var list = this.data.goodsList,
      that = this,
      selected_benefit = this.data.selectDiscountInfo,
      selectedLeagueBenefitInfo = this.data.selectedLeagueBenefitInfo,
      hasWritedAdditionalInfo = false;
    if ((this.data.is_self_delivery == 0 && this.data.selectAddress.is_distance == 0) || !this.data.selectAddress.id || this.data.selectAddress.is_distance == 0) {
      app.showModal({
        content: '请选择地址'
      });
      return;
    }
    for (var key in this.additional_info) {
      if (key !== undefined) {
        hasWritedAdditionalInfo = true;
        break;
      }
    }
    if (this.requesting) {
      return;
    }
    this.requesting = true;
    let utc = new Date().getTimezoneOffset() / 60;
    let time_difference = 8 + utc;
    let timezone_name = utc > 0 ? '西' + utc + '区' : '东' + (utc * -1) + '区';
    app.sendRequest({
      url: '/index.php?r=AppShop/addCartOrder',
      method: 'post',
      data: {
        cart_arr: that.cart_data_arr,
        formId: e.detail.formId,
        sub_shop_app_id: that.franchisee_id,
        selected_benefit: selected_benefit,
        is_balance: that.data.useBalance ? 1 : 0,
        is_self_delivery: that.data.is_self_delivery,
        remark: that.data.orderRemark,
        address_id: that.data.selectAddress.id,
        additional_info: that.additional_info,
        takeout_appointment_arrive_time: that.data.arriveTime,
        time_difference: time_difference,
        timezone_name: timezone_name,
        superimposed: that.isFranchiseeCoupon ? 1 : 0,
        is_multi: that.isFranchiseeCoupon ? 1 : 0,
        extra_selected_benefit: that.data.selectedLeagueBenefitInfo,
      },
      success: (res) => {
        app.sendUseBehavior([{goodsId: res.data}],5); // 行为轨迹埋点 提交订单
        app.globalData.takeoutRefresh = true;
        that.payOrder(res.data);
      },
      complete: () => {
        that.requesting = false;
      }
    });
  },
  payOrder: function (orderId) {
    var that = this;
    function paySuccess() {
      var pagePath = '/orderMeal/pages/takeoutOrderDetail/takeoutOrderDetail?detail=' + orderId + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : '');
      app.turnToPage(pagePath, 1);
    }
    function payFail() {
      app.turnToPage('/orderMeal/pages/takeoutOrderDetail/takeoutOrderDetail?detail=' + orderId + (that.franchisee_id ? '&franchisee=' + that.franchisee_id : ''), 1);
    }
    if (this.data.totalPayment == 0) {
      app.sendRequest({
        url: '/index.php?r=AppShop/paygoods',
        data: {
          order_id: orderId,
          total_price: 0
        },
        success: (res) => {
          paySuccess();
        },
        fail: () => {
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
      success: (res) => {
        var param = res.data;
        param.orderId = orderId;
        param.goodsType = 2;
        param.success = paySuccess;
        param.fail = payFail;
        app.wxPay(param);
      },
      fail: () => {
        payFail();
      },
      successStatusAbnormal: function () {
        payFail();
      }
    })
  },
  discountChange: function (e) {
    var index = e.detail.value;
    this.setData({
      selectDiscountInfo: this.data.discountList[index],
      selectDiscountIndex: index
    })
    this.getCalculationInfo();
  },
  leagueDiscountChange: function (e) {
    let that = this;
    let index = e.detail.value;
    setTimeout(function () {
      that.setData({
        'selectedLeagueBenefitInfo': that.data.leagueBenefitList[index],
        'selectDiscountIndex': index,
      })
      that.getCalculationInfo();
    }, 500);
  },
  goToMyAddress: function () {
    var addressId = this.data.selectAddress.id;
    this.isFromBack = true;
    app.turnToPage('/eCommerce/pages/myAddress/myAddress?from=previewtakeout&id=' + addressId);
  },
  showAddAddress: function () {
    var _this = this;
    app.chooseAddress({
      success: (res) => {
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
            _this.dataInitial();
          },
        })
      }
    })
  },
  makeStorePhoneCall: function () {
    app.makePhoneCall(this.data.shopAddress.shop_contact);
  },
  openStoreLocation: function () {
    var infor = this.data.shopAddress.region_string + this.data.shopAddress.shop_location;
    infor = infor.replace(/\s/g, '');
    app.sendRequest({
      url: '/index.php?r=Map/GetLatAndLngByAreaInfo',
      data: {
        location_info: infor
      },
      success: (res) => {
        if (res.result) {
          wx.openLocation({
            latitude: res.result.location.lat,
            longitude: res.result.location.lng
          })
        }
      }
    });
  },
  useBalanceChange: function (e) {
    this.setData({
      useBalance: e.detail.value
    });
    this.getCalculationInfo();
  },
  deliveryWayChange: function (e) {
    this.setData({
      is_self_delivery: e.detail.value
    })
    this.getCalculationInfo();
  },
  goToAdditionalInfo: function () {
    app.setGoodsAdditionalInfo(this.additional_info);
    app.turnToPage('/eCommerce/pages/goodsAdditionalInfo/goodsAdditionalInfo');
  },
  turnBackPage: function () {
    app.turnBack();
  },
  returnDeliveryTime: function (time) {
    let HM = (new Date(time).toISOString().split('T')[0] + ' ' + new Date(time).toTimeString().split(' ')[0]).split(' ')[1];
    HM = HM.split(':')[0] + ':' + HM.split(':')[1]
    return HM
  },
  timeChange: function(e) {
    var index = e.detail.value,
        that = this;
    this.setData({
      arriveTime: that.data.fullTimeList[index]
    })
  },
  timeList: function (arriveTime, endTime) {
    let arriveTimeList = [],
        arriveDeliveryTime = this.returnDeliveryTime(arriveTime);
    let arriveH = (arriveDeliveryTime + '').split(':')[0],
        arriveM = (arriveDeliveryTime + '').split(':')[1],
        firstTime = 0;
    if (arriveM % 15 === 0){
      firstTime = new Date(new Date().setHours(arriveH, arriveM, 0, 0)).getTime();
    }else {
      arriveTimeList.push('尽快送达 | 预计' + arriveDeliveryTime);
      this.data.fullTimeList.push(this.formatDate(arriveTime));
      if (Math.ceil(arriveM / 15) * 15 > 60) {
        arriveH = (arriveH - 0) + 1;
        firstTime = new Date(new Date().setHours(arriveH, 0, 0, 0)).getTime();
      } else {
        arriveM = Math.ceil(arriveM / 15) * 15;
        firstTime = new Date(new Date().setHours(arriveH, arriveM, 0, 0)).getTime();
      }
    }
    let timeStamp = new Date(new Date().setHours(+(endTime.split(':')[0]), +(endTime.split(':')[1]), 0, 0)).getTime() - firstTime;
    if (timeStamp > 15 * 60000){
      let temp = Math.ceil(timeStamp / 15 / 60000);
      for (let i = 0; i < temp; i++) {
        if (i == 0 && ((arriveDeliveryTime + '').split(':')[1] % 15 === 0)){
          arriveTimeList.push('尽快送达 | 预计' + this.returnDeliveryTime(firstTime));
          this.data.fullTimeList.push(this.formatDate(firstTime));
        }else{
          arriveTimeList.push(this.returnDeliveryTime(firstTime + 15 * 60000 * i));
          if (firstTime >= arriveTime) {
            this.data.fullTimeList.push(this.formatDate(firstTime + 15 * 60000 * i));
          } else {
            this.data.fullTimeList.push(this.formatDate(firstTime + 15 * 60000 * i + 24 * 60 * 60000));
          }
        }
      }
    }
    return arriveTimeList;
  },
  formatDate: function (time){
    function add0(m) { return m < 10 ? '0' + m : m }
    var time = new Date(time);
    var y = time.getFullYear();
    var m = time.getMonth() + 1;
    var d = time.getDate();
    var h = time.getHours();
    var mm = time.getMinutes();
    var s = time.getSeconds();
    return y + '-' + add0(m) + '-' + add0(d) + ' ' + add0(h) + ':' + add0(mm);
  }
})
