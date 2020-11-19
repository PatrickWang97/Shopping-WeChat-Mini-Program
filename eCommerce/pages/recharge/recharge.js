var app = getApp()
const util = require('../../../utils/util.js');
Page({
  data: {
    type: '', // 1:购买储值项 ／ 5: 储值券充值 / 6: 自定义金额充值
    itemList: [],
    selectedItem: {
      index: -1,
      id: '',
      description: '',
      price: 0,
      description_type: '1',
    },
    customItemInfo: {
      status: 0,
      tip: ''
    },
    customPrice: '',
    couponItemList: [],
    selectedCouponItem: {
      index: -1,
      id: '',
    },
    isPaying: false,
    storedId: 0,
    subShopsList: [], // 适用店铺列表
  },
  onLoad: function (options) {
    this.data.storedId = options.storedId || 0;
    this.getBalanceData();
    this.getItemInfo();
    this.getSubShopsList();
  },
  getBalanceData: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getAppUserBalance',
      hideLoading: true,
      success: function (res) {
        that.setData({
          'currentBalance': res.data.balance
        });
      }
    });
  },
  getItemInfo: function () {
    let that = this;
    let param = {
      ver: '2.2'
    }//版本
    app.sendRequest({
      url: '/index.php?r=AppShop/getStoredItems',
      data: param,
      hideLoading: true,
      success: function (res) {
        if (res.data.length != 0) {
          that.setData({
            'type': 1,
            'itemList': that.parseItemData(res.data),
            'selectedItem.index': 0,
            'selectedItem.id': res.data[0].id,
            'selectedItem.description': res.data[0].description
          });
          that.defaultSelect(that.data.itemList);
        } else if (res.data.length == 0) {
          that.setData({
            'type': 1,
            'selectedItem.index': -1
          });
        }
        that.setData({
          'customItemInfo': that.parseCustomItemData(res.stored_custom_info),
          'couponItemList': that.parseCouponItemData(res.user_coupon_list)
        })
      }
    });
  },
  parseItemData: function (data) {
    let array = [];
    let item = {};
    data = this.givingInstructions(data);
    for (var i = 0; i < data.length; i++) {
      item = {};
      item.id = data[i].id;
      item.rechargeMoney = Number(data[i].price);
      item.instructions = data[i].instructions;
      item.description = data[i].description;
      item.description_type = data[i].description_type;
      array.push(item);
    }
    return array;
  },
  givingInstructions: function (data) {
    for (let item of data) {
      let dataArr = [];
      let instructions = '';
      item.g_price = Number(item.g_price);
      if (item.g_price) {
        dataArr.push(item.g_price + '元');
      }
      item.g_integral = Number(item.g_integral);
      if (item.g_integral) {
        dataArr.push(item.g_integral + '积分');
      }
      if (item.g_vip_card && item.g_vip_card.title) {
        dataArr.push(item.g_vip_card.title);
      }
      if (item.g_coupon_list && item.g_coupon_list.length) {
        dataArr.push(item.g_coupon_list[0].num + '张' + item.g_coupon_list[0].title);
      }
      for (let i = 0; i < dataArr.length; i++) {
        if (i != dataArr.length - 1) {
          instructions = instructions + dataArr[i] + '、';
        } else {
          instructions = instructions + dataArr[i];
        }
      }
      if (instructions) {
        item.instructions = '赠送' + instructions;
      }
    }
    return data
  },
  selectActiveItem: function (event) {
    let that = this;
    let index = event.currentTarget.dataset.index;
    that.setData({
      'type': 1,
      'selectedItem.index': index,
      'selectedItem.id': that.data.itemList[index].id,
      'selectedItem.description': that.data.itemList[index].description,
      'selectedItem.price': that.data.itemList[index].rechargeMoney,
      'selectedItem.description_type': that.data.itemList[index].description_type,
    });
  },
  parseCustomItemData: function (data) {
    return (function (object) {
      object = data;
      if (data.type == 1) {
        object['tip'] = '按充值金额x' + data.value + '比例赠送储值金';
      } else if (data.type == 2) {
        object['tip'] = '每充值' + data.condition + '元，赠送' + data.value + '元';
      } else {
        object['tip'] = '';
      }
      return object;
    })({});
  },
  selectCustomItem: function () {
    let that = this;
    that.setData({
      'type': 6
    });
  },
  confirmCustomPrice: function (e) {
    let that = this;
    let price = e.detail.value;
    let customItemInfo = that.data.customItemInfo;
    let tip = '';
    if (price == '') {
      if (customItemInfo.type == 1) {
        tip = '按充值金额x' + customItemInfo.value + '比例赠送储值金';
      } else if (customItemInfo.type == 2) {
        tip = '每充值' + customItemInfo.condition + '元，赠送' + customItemInfo.value + '元';
      } else {
        tip = '';
      }
    } else if (!(/^[0-9]+([.]{1}[0-9]{1,2})?$/.test(price))) {
      tip = '充值的金额必须>=0，精确到小数点后2位!';
    } else {
      if (customItemInfo.type == 1) {
        tip = '赠送储值金' + (price * customItemInfo.value).toFixed(2) + '元';
      } else if (customItemInfo.type == 2) {
        tip = '赠送储值金' + (Math.floor(price / customItemInfo.condition) * customItemInfo.value).toFixed(2) + '元';
      } else {
        tip = '';
      }
    }
    that.setData({
      'customPrice': e.detail.value,
      'customItemInfo.tip': tip
    });
  },
  parseCouponItemData: function (data) {
    return (function (array) {
      let item = {};
      for (var i = 0; i < data.length; i++) {
        item = {};
        item.id = data[i].id;
        item.price = Number(data[i].value);
        item.dateDuration = data[i].start_use_date.split('-').join('.') + '-' + data[i].end_use_date.split('-').join('.');
        item.otherCase = (data[i].exclude_holiday == 1 ? '除法定节假日' : '') + ' ' + (data[i].exclude_weekend == 1 ? '周一至周五' : '');
        item.timeDuration = data[i].start_use_time + '-' + data[i].end_use_time;
        array.push(item);
      }
      return array;
    })([]);
  },
  selectActiveCouponItem: function (event) {
    let that = this;
    let index = event.currentTarget.dataset.index;
    that.setData({
      'type': 5,
      'selectedCouponItem.index': index,
      'selectedCouponItem.id': that.data.couponItemList[index].id
    });
  },
  payLoading: false,
  gotoRecharge: function (event) {
    let that = this;
    let type = that.data.type;
    if (type == 1 && that.data.selectedItem.index == -1) {
      if (that.data.selectedItem.id == '') {
        return false;
      }
      app.showToast({
        'title': '商家尚未建立储值项',
        'icon': 'loading',
        'success': function () {
        }
      });
      return false;
    } else if (type == 6 && that.data.customPrice == '') {
      app.showToast({
        'title': '请输入充值的金额',
        'icon': 'loading',
        'success': function () {
        }
      });
      return false;
    }
    let param = {
      type: type,
      form_id: event.detail.formId
    }
    if (this.payLoading) {
      return;
    }
    this.payLoading = true;
    if (type == 1) {
      param['stored_id'] = that.data.selectedItem.id;
    } else if (type == 5) {
      param['user_coupon_id'] = that.data.selectedCouponItem.id;
    } else if (type == 6) {
      param['price'] = that.data.customPrice;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/creatStoredItemOrder',
      data: param,
      hideLoading: true,
      success: function (res) {
        let orderId = res.data;
        if (type == 1 || type == 6) {
          app.sendRequest({
            url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
            data: {
              order_id: orderId
            },
            hideLoading: true,
            success: function (res) {
              var param = res.data;
              param.orderId = orderId;
              param.success = function () {
                app.showToast({
                  title: '充值成功',
                  success: function () {
                    setTimeout(function () {
                      app.turnToPage('/eCommerce/pages/balance/balance');
                    }, 1500);
                  }
                });
                that.payLoading = false;
              };
              param.fail = function(){
                that.payLoading = false;
              }
              app.wxPay(param);
            },
            fail: function () {
              that.payLoading = false;
            }
          });
        } else if (type == 5) {
          app.showToast({
            title: '充值成功',
            success: function () {
              setTimeout(function () {
                app.turnToPage('/eCommerce/pages/balance/balance');
              }, 1500);
              that.payLoading = false;
            }
          });
        };
      },
      fail: function () {
        that.payLoading = false;
      }
    });
  },
  defaultSelect: function (data) {
    let newData = {
      currentTarget: {
        dataset: {
          index: 0
        }
      }
    };
    if (this.data.storedId) {
      for (let i = 0; i < data.length; i++) {
        if (data[i].id == this.data.storedId) {
          newData.currentTarget.dataset.index = i;
        }
      }
    }
    this.selectActiveItem(newData);
  },
  turnToRecords: function () {
    app.turnToPage('/eCommerce/pages/balance/balance')
  },
  turnToShopsList: function () {
    app.turnToPage('/eCommerce/pages/balanceShopsList/balanceShopsList');
  },
  getSubShopsList: function () {
    let that = this;
    let { locationInfo } = app.globalData;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/GetAppStoredShopIdxList',
      data: {
        page: 1,
        page_size: 2,
        longitude: locationInfo.longitude,
        latitude: locationInfo.latitude,
      },
      success: function (res) {
        let returnList = res.data;
        let setDataObj = {};
        if (returnList && returnList.length) {
          returnList.forEach((shop) => shop.distance = util.formatDistance(shop.distance));
          setDataObj['subShopsList'] = returnList;
          setDataObj['subShopsCount'] = res.count || 0;
        }
        that.setData(setDataObj);
      }
    });
  }
})
