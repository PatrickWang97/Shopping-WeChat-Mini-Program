var app = getApp();
var util = require('../../../utils/util.js');
Page({
  data: {
    franchiseeId: ''
  },
  onLoad: function (options) {
    let account_type = options.type;
    let orderId = options.detail;
    this.setData({
      account_type: account_type,
      orderId: orderId,
      franchiseeId: options.franchisee || ''
    })
    account_type == 1 ? this.getRufundDetail() : this.getModifyOrderList();
  },
  getModifyOrderList: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getModifiedOrderList',
      data: {
        order_id: this.data.orderId
      },
      success: function (res) {
        for (let i=0;i<res.data.length;i++) {
          let goods = res.data[i].form_data.apply_goods;
          for (let j = 0; j <goods.length;j++) {
            if (goods[j].is_package_goods == 1) {
              goods[j].showPackageInfo = false;
            }
            if (!Array.isArray(goods[j].package_goods)) {
              goods[j].package_goods = [];
            }
            if (goods[j].attributes) {
              for (let attr in goods[j].attributes) {
                for (let _goods in goods[j].attributes[attr].goods_list) {
                  goods[j].package_goods.push(goods[j].attributes[attr].goods_list[_goods]);
                }
              }
            }
            if (!goods[j].model_value) continue;
            goods[j].model_value_str = goods[j].model_value.join('|');
          } 
        }
        that.setData({
          diningOrderList: res.data
        })
      }
    })
  },
  getRufundDetail: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=/AppEcommerce/getOrderRefundApplyByOrderId',
      data: {
        order_id: this.data.orderId,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function (res) {
        for (let i = 0; i < res.data.length; i++) {
          let goods = res.data[i].form_data.refund_goods;
          for (let j = 0; j < goods.length; j++) {
            if (goods[j].is_package_goods == 1) {
              goods[j].showPackageInfo = false;
            }
            if (!Array.isArray(goods[j].package_goods)) {
              goods[j].package_goods = [];
            }
            if (goods[j].attributes) {
              for (let attr in goods[j].attributes) {
                for (let _goods in goods[j].attributes[attr].goods_list) {
                  goods[j].package_goods.push(goods[j].attributes[attr].goods_list[_goods]);
                }
              }
            }
            if (!goods[j].model_value) continue;
            goods[j].model_value_str = goods[j].model_value.join('|');
          }
        }
        that.setData({
          diningOrderList: res.data
        })
        that.modifyTime(res.data[0].add_time);
      }
    })
  },
  modifyTime: function (time) {
    let add_time = util.formatTimeYMD(time);
    this.setData({
      add_time: add_time
    })
  },
  showPackageInfoFn: function (e) { // 展示商品套餐详情
    let status = e.currentTarget.dataset.status;
    let index = e.currentTarget.dataset.index;
    let subIndex = e.currentTarget.dataset.subIndex;
    let childIndex = e.currentTarget.dataset.childIndex;
    let diningOrderList = this.data.diningOrderList;
    let account_type = this.data.account_type;
    let newData = {};
    if (account_type == 1) {
      diningOrderList[index].form_data.refund_goods[subIndex].showPackageInfo = status == 1 ? true : false;
    }else {
      diningOrderList[index].form_data.apply_goods[subIndex].showPackageInfo = status == 1 ? true : false;
    }
    newData['diningOrderList'] = diningOrderList;
    this.setData(newData);
  }
})