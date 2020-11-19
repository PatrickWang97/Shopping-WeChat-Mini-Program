var app = getApp()
var util = require('../../../utils/util.js')
var WxParse = require('../../../components/wxParse/wxParse.js');
const customEvent = require('../../../utils/custom_event.js');
Page({
  data: {
    goodsId: '',
    franchiseeId: '',
    isShowMask: false,
    listType: '',
    cartList: {},
    status: 0,
    totleNum: 0,
    attrPrice: 0,
    totalPrice: 0,
    showAttrGoods: false,
    attrGoodsTitle: ''
  },
  onLoad: function (options) {
    console.log(options);
    this.data.goodsId = options.goods_id;
    this.data.franchiseeId = options.franchisee || '';
    this.listType = options.listType || 'vertical';
    this.setData({
      status: +options.status || 0,
      listType: options.listType || 'vertical'
    })
  },
  onReady: function () {
  },
  onShow: function () {
    this.setData({
      cartList: {},
      totleNum: 0,
      attrPrice: 0,
      totalPrice: 0,
      showAttrGoods: false,
      attrGoodsTitle: ''
    })
    this.dataInitial();
  },
  onHide: function () {
  },
  onUnload: function () {
  },
  onPullDownRefresh: function () {
  },
  onReachBottom: function () {
  },
  onShareAppMessage: function () {
  },
  dataInitial: function () {
    var that = this;
    this.getAppECStoreConfig();
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: that.data.goodsId,
        sub_shop_app_id: that.data.franchiseeId || '',
        message_notice_type: 1,
        not_group_buy_goods: 1
      },
      success: function (res) {
        let goodsDetail = res.data[0].form_data;
        goodsDetail.package.map((item) => {
          item.totleNum = 0;
        })
        that.setData({
          goodsDetail: goodsDetail,
          totalPrice: goodsDetail.goods_price
        })
      },
      complete: function () {
      }
    })
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config,
        showStock: (res.detail_fields && res.detail_fields.stock == 1) ? true : false,
        isShowVirtualPrice: (res.detail_fields && res.detail_fields.virtual_price == 1) ? true : false
      })
    }, this.data.franchiseeId);
  },
  closeMask: function (e) {
    e.stopPropagation;
    this.setData({
      isShowMask: false,
      attrData: null,
      attrPrice: '0.00'
    });
  },
  showMask: function (e) {
    let dataset = e.currentTarget.dataset;
    let package_index = dataset.package;
    let goods_id = dataset.id;
    let attributes = this.data.goodsDetail.package[package_index].goods_list[goods_id].attributes;
    let addPrice = dataset.addprice > 0 ? Number(dataset.addprice) : 0;
    let totleNum = this.clone(this.data.goodsDetail.package[package_index]).totleNum || 0;
    let attrNum = 0;
    let minSale = 1;
    if (+this.data.goodsDetail.package[package_index].goods_list[goods_id].min_sales_nums > 1 && !(+this.data.goodsDetail.package[package_index].goods_list[goods_id].min_sales_nums)) {
      minSale = +this.data.goodsDetail.package[package_index].goods_list[goods_id].min_sales_nums;
    }
    if ((this.data.goodsDetail.package[package_index].totleNum + minSale) > this.data.goodsDetail.package[package_index].max_sales_num) {
      app.showModal({
        content: '已超过可选数量'
      })
      return;
    }
    if (!(+this.data.goodsDetail.package[package_index].goods_list[goods_id].is_multi_select) && +this.data.goodsDetail.package[package_index].goods_list[goods_id].num > 0) {
      app.showModal({
        content: '不可复选商品'
      })
      return;
    }
    if ((+this.data.goodsDetail.package[package_index].goods_list[goods_id].stock) < minSale) {
      app.showModal({
        content: '库存不足'
      })
      return;
    }
    if (this.data.cartList[goods_id] && this.data.cartList[goods_id][goods_id + '-0']) {
      attrNum = this.data.cartList[goods_id][goods_id + '-0'].num;
    }
    this.setData({
      isShowMask: true,
      attributes: attributes,
      selectId: goods_id,
      package_index: package_index,
      attrNum: attrNum || 0,
      addPrice: addPrice,
      attrGoodsTitle: this.data.goodsDetail.package[package_index].goods_list[goods_id].title
    });
  },
  minus: function (e) {
    let dataset = e.currentTarget.dataset;
    let package_index = dataset.package;
    let goods_id = dataset.id;
    let num = this.clone(this.data.goodsDetail.package[package_index].goods_list[goods_id]).num || 0;
    if (num <= 0) return;
    let newData = {};
    let totleNum = this.clone(this.data.goodsDetail.package[package_index]).totleNum || 0;
    let totalPrice = Number(this.data.totalPrice);
    let packageData = this.clone(this.data.goodsDetail.package);
    let minSale = 1;  //最小起卖数
    let isRequire = +packageData[package_index].goods_list[goods_id].is_require; //是否必选商品
    let added_price = +packageData[package_index].goods_list[goods_id].added_price || 0;  //加价价格
    if (+packageData[package_index].goods_list[goods_id].num <= +packageData[package_index].goods_list[goods_id].min_sales_nums) {
      minSale = +packageData[package_index].goods_list[goods_id].num;
    }
    newData['goodsDetail.package'] = packageData;
    newData['goodsDetail.package[' + package_index + '].goods_list.' + goods_id + '.num'] = num - minSale;
    newData['goodsDetail.package[' + package_index + '].totleNum'] = totleNum - minSale;
    if (isRequire) {
      if (minSale >= +packageData[package_index].goods_list[goods_id].num) {
        newData['totalPrice'] = (Number(this.data.totalPrice)).toFixed(2);
      } else {
        newData['totalPrice'] = Number(this.data.totalPrice - Number(added_price) * minSale).toFixed(2);
      }
    } else {
      newData['totalPrice'] = (Number(this.data.totalPrice) - Number(added_price) * minSale).toFixed(2);
    }
    if (this.data.cartList[goods_id][goods_id + '-0']) {
      newData['cartList.' + goods_id + '.' + goods_id + '-0.num'] = this.data.cartList[goods_id][goods_id + '-0'].num - minSale;
    }
    this.setData(newData);
  },
  plus: function (e) {
    let dataset = e.currentTarget.dataset;
    let package_index = dataset.package;
    let goods_id = dataset.id;
    let newData = {};
    let totleNum = this.clone(this.data.goodsDetail.package[package_index]).totleNum || 0;
    let stock = dataset.stock;
    let goodsNum = +this.clone(this.data.goodsDetail.package[package_index].goods_list[goods_id]).num || 0;
    let packageData = this.data.goodsDetail.package;
    let isRequire = +packageData[package_index].goods_list[goods_id].is_require;
    let added_price = +packageData[package_index].goods_list[goods_id].added_price || 0;
    let minSale = 1;
    if (packageData[package_index].goods_list[goods_id].min_sales_nums > 1 && !(+packageData[package_index].goods_list[goods_id].num)) {
      minSale = +packageData[package_index].goods_list[goods_id].min_sales_nums;
    }
    if (this.data.goodsDetail.package[package_index].totleNum + minSale > this.data.goodsDetail.package[package_index].max_sales_num) {
      app.showModal({
        content: '已超过可选数量'
      })
      return;
    }
    if (!(+this.data.goodsDetail.package[package_index].goods_list[goods_id].is_multi_select) && goodsNum > 0) {
      app.showModal({
        content: '不可复选商品'
      })
      return;
    }
    newData['goodsDetail.package'] = packageData;
    if (stock < +minSale + +packageData[package_index].goods_list[goods_id].num) {
      app.showModal({
        content: '该商品库存不足'
      })
      return;
    }
    newData['goodsDetail.package[' + package_index + '].goods_list.' + goods_id + '.num'] = +goodsNum + +minSale;
    newData['goodsDetail.package[' + package_index + '].totleNum'] = +totleNum + minSale;
    if (this.data.cartList[goods_id] && this.data.cartList[goods_id][goods_id + '-0']) {
      newData['cartList.' + goods_id + '.' + goods_id + '-0.num'] = this.data.cartList[goods_id][goods_id + '-0'].num + minSale;
    } else {
      newData['cartList.' + goods_id + '.' + goods_id + '-0'] = this.clone(packageData[package_index].goods_list[goods_id]);
      newData['cartList.' + goods_id + '.' + goods_id + '-0.num'] = minSale;
    }
    if (isRequire) {
      if (+goodsNum === 0) {
        newData['totalPrice'] = Number(this.data.totalPrice).toFixed(2);
      } else {
        newData['totalPrice'] = (Number(this.data.totalPrice) + Number(added_price) * minSale).toFixed(2);
      }
    } else {
      newData['totalPrice'] = (Number(this.data.totalPrice) + Number(added_price) * minSale).toFixed(2);
    }
    this.setData(newData);
  },
  chooseAttr: function (e) {
    let dataset = e.currentTarget.dataset;
    let pIndex = dataset.pindex;
    let index = dataset.elemindex;
    let newdata = {};
    let attrData = this.data.attributes[pIndex];
    let price = Number(dataset.price);
    let that = this;
    newdata['attrData'] = this.data.attrData || {};
    if (attrData.selected_type === "1") {
      for (let i in this.data.attrData) {
        if (this.data.attrData[i] && this.data.attrData[i].attributes_id === attrData.id) {
          newdata['attrData.' + attrData.id + '_' + this.data.attrData[i].id] = null;
        }
      }
    }
    if (newdata['attrData'][attrData.id + '_' + attrData.elem[index].id]) {
      newdata['attrData.' + attrData.id + '_' + attrData.elem[index].id] = null;
    } else {
      newdata['attrData.' + attrData.id + '_' + attrData.elem[index].id] = attrData.elem[index];
      newdata['attrData.' + attrData.id + '_' + attrData.elem[index].id].pName = attrData.name;
    }
    this.setData(newdata, function () {
      let attrIdArr = [];
      let attrIdStr = '';
      let attrNum = 0;
      let attrPrice = 0;
      for (let i in that.data.attrData) {
        if (that.data.attrData[i]) {
          attrIdArr.push(that.data.attrData[i].id);
        }
        if (that.data.attrData[i] && that.data.attrData[i].price) {
          attrPrice += (+that.data.attrData[i].price);
        }
      }
      attrPrice = (+attrPrice).toFixed(2);
      attrIdStr = attrIdArr.sort().join('_');
      if (that.data.cartList[that.data.selectId] && that.data.cartList[that.data.selectId][that.data.selectId + '-' + attrIdStr] && that.data.cartList[that.data.selectId][that.data.selectId + '-' + attrIdStr].num) {
        attrNum = that.data.cartList[that.data.selectId][that.data.selectId + '-' + attrIdStr].num;
      }
      that.setData({
        'attrNum': attrNum || 0,
        'attrPrice': attrPrice || '0.00'
      })
    })
  },
  addCart: function () {
    let cartList = this.data.cartList;
    let franchiseeId = app.getPageFranchiseeId();
    let cartInfo = [];
    let data = {
      attributes: []
    };
    let that = this;
    if (Object.getOwnPropertyNames(cartList).length == 0) {
      app.showModal({
        content: '请选择套餐商品'
      })
      return;
    }
    for (let k in cartList) {
      let cartInfo = cartList[k];
      for (let i in cartInfo) {
        let elem = [];
        if (cartInfo[i].attrIdArr && cartInfo[i].attrIdArr.length) {
          for (let j = 0; j < cartInfo[i].attrIdArr.length; j++) {
            if (cartInfo[i].attrIdArr[j] > 0) {
              elem.push({
                id: cartInfo[i].attrIdArr[j],
                num: 1
              })
            }
          }
          if (cartInfo[i].num > 0) {
            data.attributes.push({
              id: cartInfo[i].goods_id,
              model_id: cartInfo[i].model_id,
              num: cartInfo[i].num,
              elem: elem
            })
          }
        } else {
          if (cartInfo[i].num > 0) {
            data.attributes.push({
              id: cartInfo[i].goods_id,
              model_id: cartInfo[i].model_id,
              num: cartInfo[i].num
            })
          }
        }
      }
    }
    let cart_info = [{
      goods_id: this.data.goodsId,
      model_id: '0',
      form_data: data,
      num: 1
    }];
    let postData = {
      cart_info: cart_info,
      goods_type: 0,
      sub_app_id: franchiseeId || '',
      action: 2
    }
    if (app.globalData.ec_location_id) {
      postData.location_id = app.globalData.ec_location_id;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/addVerticalCart',
      method: 'post',
      hideLodaing: false,
      data: postData,
      success: function (res) {
        if (res.status === 0) {
          if (that.data.status) {
            var cartId = res.data[that.data.goodsId]['0'].cart_id;
            var pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + cartId;
            franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
            app.turnToPage(pagePath);
          } else {
            app.turnBack();
          }
        } else {
          console.log(res)
        }
      }
    })
  },
  addAttr: function (e) {
    let attrIdArr = [];
    let attrIdStr = '';
    let goods_id = this.data.selectId;
    let package_index = this.data.package_index;
    let attrData = this.data.attrData;
    let newData = {};
    let that = this;
    let packageData = this.data.goodsDetail.package;
    let totleNum = +(this.clone(this.data.goodsDetail.package[package_index]).totleNum) || 0;
    let goodsNum = +(this.clone(this.data.goodsDetail.package[package_index].goods_list[goods_id]).num) || 0;
    let added_price = Number(packageData[package_index].goods_list[goods_id].added_price);
    let isRequire = +packageData[package_index].goods_list[goods_id].is_require;;
    let minSale = 1;
    for (let i in attrData) {
      if (attrData[i]) {
        attrIdArr.push(attrData[i].id);
      }
    }
    if (!attrIdArr.length) {
      attrIdArr = ['0'];
    }
    attrIdStr = attrIdArr.sort().join('_');
    if (packageData[package_index].goods_list[goods_id].min_sales_nums > 1 && (!(+packageData[package_index].goods_list[goods_id].num) || !this.data.cartList || !this.data.cartList[goods_id] || !this.data.cartList[goods_id][goods_id + '-' + attrIdStr] || !this.data.cartList[goods_id][goods_id + '-' + attrIdStr].num)) {
      minSale = +packageData[package_index].goods_list[goods_id].min_sales_nums;
    }
    if (this.data.goodsDetail.package[package_index].totleNum + minSale > this.data.goodsDetail.package[package_index].max_sales_num) {
      app.showModal({
        content: '已超过可选数量'
      })
      return;
    }
    if (!(+packageData[package_index].goods_list[goods_id].is_multi_select) && +this.data.goodsDetail.package[package_index].goods_list[goods_id].num > 0) {
      app.showModal({
        content: '不可复选商品'
      })
      return;
    }
    if (packageData[package_index].goods_list[goods_id].stock < +this.data.goodsDetail.package[package_index].goods_list[goods_id].num + minSale) {
      app.showModal({
        content: '该商品库存不足'
      })
      return;
    }
    newData['goodsDetail.package'] = packageData;
    newData['goodsDetail.package[' + package_index + '].goods_list.' + goods_id + '.num'] = goodsNum + minSale;
    if (this.data.cartList[goods_id] && this.data.cartList[goods_id][goods_id + '-' + attrIdStr]) {
      newData['cartList.' + goods_id + '.' + goods_id + '-' + attrIdStr + '.num'] = this.data.cartList[goods_id][goods_id + '-' + attrIdStr].num + minSale;
    } else {
      newData['cartList.' + goods_id + '.' + goods_id + '-' + attrIdStr] = this.clone(packageData[package_index].goods_list[goods_id]);
      newData['cartList.' + goods_id + '.' + goods_id + '-' + attrIdStr + '.num'] = minSale;
    }
    newData['cartList.' + goods_id + '.' + goods_id + '-' + attrIdStr + '.attrPrice'] = this.data.attrPrice;
    newData['cartList.' + goods_id + '.' + goods_id + '-' + attrIdStr + '.attrIdArr'] = attrIdArr;
    newData['goodsDetail.package[' + package_index + '].totleNum'] = totleNum + minSale;
    if (isRequire){
      if (goodsNum == 0){
        newData['totalPrice'] = (Number(this.data.totalPrice) + Number(this.data.attrPrice) * minSale);
      }else {
        newData['totalPrice'] = (Number(this.data.totalPrice) + Number(this.data.attrPrice) * minSale + added_price);
      }
    }else {
      newData['totalPrice'] = (Number(this.data.totalPrice) + Number(this.data.attrPrice) * minSale + added_price * minSale);
    }
    newData['totalPrice'] = newData['totalPrice'].toFixed(2);
    this.setData(newData, function () {
      let attrNum = that.data.attrNum ? that.data.attrNum + minSale : minSale;
      that.setData({ attrNum: attrNum })
    });
  },
  minusAttr: function (e) {
    let attrIdArr = [];
    let attrIdStr = '';
    let goods_id = this.data.selectId;
    let package_index = this.data.package_index;
    let num = this.clone(this.data.goodsDetail.package[package_index].goods_list[goods_id]).num || 0;
    let attrData = this.data.attrData;
    let newData = {};
    let that = this;
    let totleNum = this.data.goodsDetail.package[package_index].totleNum || 0;
    let packageData = this.clone(this.data.goodsDetail.package);
    let added_price = Number(packageData[package_index].goods_list[goods_id].added_price);
    let isRequire = +packageData[package_index].goods_list[goods_id].is_require;
    let goodsNum = +(this.clone(this.data.goodsDetail.package[package_index].goods_list[goods_id]).num) || 0;
    for (let i in attrData) {
      if (attrData[i]) {
        attrIdArr.push(attrData[i].id);
      }
    }
    if (!attrIdArr.length) {
      attrIdArr = ['0'];
    }
    attrIdStr = attrIdArr.sort().join('_');
    let minSale = 1;
    if (+this.data.cartList[goods_id][goods_id + '-' + attrIdStr].num <= +packageData[package_index].goods_list[goods_id].min_sales_nums) {
      minSale = +this.clone(this.data.cartList[goods_id][goods_id + '-' + attrIdStr]).num;
    }
    newData['goodsDetail.package'] = packageData;
    newData['goodsDetail.package[' + package_index + '].goods_list.' + goods_id + '.num'] = num - minSale;
    newData['cartList.' + goods_id + '.' + goods_id + '-' + attrIdStr + '.num'] = this.data.cartList[goods_id][goods_id + '-' + attrIdStr].num - minSale;
    newData['cartList.' + goods_id + '.' + goods_id + '-' + attrIdStr + '.attrPrice'] = this.data.attrPrice;
    newData['cartList.' + goods_id + '.' + goods_id + '-' + attrIdStr + '.attrIdArr'] = attrIdArr;
    newData['totalPrice'] = (Number(this.data.totalPrice) - Number(this.data.attrPrice * minSale)).toFixed(2);
    newData['goodsDetail.package[' + package_index + '].totleNum'] = totleNum - minSale;
    if (isRequire){
      if (goodsNum - minSale <= 0) {
        newData['totalPrice'] = (Number(this.data.totalPrice) - Number(this.data.attrPrice) * minSale);
      }else {
        newData['totalPrice'] = (Number(this.data.totalPrice) - Number(this.data.attrPrice) * minSale - added_price);
      }
    }else {
      newData['totalPrice'] = (Number(this.data.totalPrice) - Number(this.data.attrPrice) * minSale - added_price * minSale);
    }
    newData['totalPrice'] = newData['totalPrice'].toFixed(2);
    this.setData(newData, function () {
      let attrNum = that.data.attrNum ? that.data.attrNum - minSale : 0;
      that.setData({ attrNum: attrNum })
    });
  },
  minusGoods: function (e) {
    let dataset = e.currentTarget.dataset;
    let package_index = dataset.package;
    let goods_id = dataset.id;
    let goodsArr = [];
    let cartList = this.data.cartList[goods_id];
    for (let k in cartList) {
      let attrArr = [];
      if (k.indexOf(goods_id) !== -1) {
        for (let j = 0; j < cartList[k].attrIdArr.length; j++) {
          for (let i = 0; i < cartList[k].attributes.length; i++) {
            for (let o = 0; o < cartList[k].attributes[i].elem.length; o++) {
              let elem = cartList[k].attributes[i].elem;
              if (elem[o].id == cartList[k].attrIdArr[j]) {
                attrArr.push(elem[o]);
              }
            }
          }
        }
        cartList[k].attrArr = attrArr;
        cartList[k].package_index = package_index;
        cartList[k].attrIdStr = cartList[k].attrIdArr.join('_');
        if (cartList[k].num > 0) {
          goodsArr.push(cartList[k]);
        }
      }
    }
    this.setData({
      attrGoods: goodsArr,
      showAttrGoods: true
    })
  },
  closeAttrMask: function (e) {
    this.setData({
      showAttrGoods: false
    })
  },
  attrMinus: function (e) {
    let dataset = e.currentTarget.dataset;
    let goods = dataset.goods;
    let index = dataset.index;
    let newData = {};
    let minusNum = 1;
    let id = goods.goods_id + '_' + goods.model_id;
    let cartGoodsId = id + '-' + goods.attrIdStr;
    let added_price = Number(this.data.goodsDetail.package[goods.package_index].goods_list[id].added_price);
    let isRequire = +this.data.goodsDetail.package[goods.package_index].goods_list[id].is_require;
    if (goods.num <= goods.min_sales_nums) {
      minusNum = goods.num;
    }
    let attrPrice = 0;
    for (let i = 0; i < goods.attrArr.length; i++) {
      attrPrice += +goods.attrArr[i].price;
    }
    newData['cartList.' + id + '.' + cartGoodsId + '.num'] = this.clone(this.data.cartList[id][cartGoodsId]).num - minusNum;
    newData['attrGoods.[' + index + '].num'] = this.clone(this.data.attrGoods[index]).num - minusNum;
    newData['goodsDetail.package[' + goods.package_index + '].goods_list.' + id + '.num'] = this.clone(this.data.goodsDetail.package[goods.package_index].goods_list[id]).num - minusNum;
    newData['goodsDetail.package[' + goods.package_index + '].totleNum'] = this.clone(this.data.goodsDetail.package[goods.package_index]).totleNum - minusNum;
    if (isRequire) {
      if (this.data.goodsDetail.package[goods.package_index].goods_list[id].num - minusNum <= 0){
        newData['totalPrice'] = (Number(this.data.totalPrice) - Number(attrPrice) * minusNum);
      }else {
        newData['totalPrice'] = (Number(this.data.totalPrice) - Number(attrPrice) * minusNum - added_price);
      }
    }else {
      newData['totalPrice'] = (Number(this.data.totalPrice) - Number(attrPrice) * minusNum - added_price * minusNum);
    }
    newData['totalPrice'] = Number(newData['totalPrice']).toFixed(2);
    this.setData(newData);
  },
  attrPlus: function (e) {
    let dataset = e.currentTarget.dataset;
    let goods = dataset.goods;
    let index = dataset.index;
    let newData = {};
    let minusNum = 1;
    let id = goods.goods_id + '_' + goods.model_id;
    let cartGoodsId = id + '-' + goods.attrIdStr;
    let packageData = this.data.goodsDetail.package[goods.package_index];
    let added_price = Number(this.data.goodsDetail.package[goods.package_index].goods_list[id].added_price);
    let isRequire = +this.data.goodsDetail.package[goods.package_index].goods_list[id].is_require;
    if (goods.min_sales_nums > 0 && goods.num == 0) {
      minusNum = +goods.min_sales_nums;
    }
    let attrPrice = 0;
    for (let i = 0; i < goods.attrArr.length; i++) {
      attrPrice += +goods.attrArr[i].price;
    }
    if (+packageData.totleNum + minusNum > +this.data.goodsDetail.package[goods.package_index].max_sales_num) {
      app.showModal({
        content: '已超过可选数量'
      })
      return;
    }
    if (!(+packageData.goods_list[id].is_multi_select) && +packageData.goods_list[id].num > 0) {
      app.showModal({
        content: '不可复选商品'
      })
      return;
    }
    if (+packageData.goods_list[id].stock < (+packageData.totleNum + minusNum)) {
      app.showModal({
        content: '该商品库存不足'
      })
      return;
    }
    newData['cartList.' + id + '.' + cartGoodsId + '.num'] = this.clone(this.data.cartList[id][cartGoodsId]).num + minusNum;
    newData['attrGoods.[' + index + '].num'] = this.clone(this.data.attrGoods[index]).num + minusNum;
    newData['goodsDetail.package[' + goods.package_index + '].goods_list.' + id + '.num'] = this.clone(this.data.goodsDetail.package[goods.package_index].goods_list[id]).num + minusNum;
    newData['goodsDetail.package[' + goods.package_index + '].totleNum'] = this.clone(this.data.goodsDetail.package[goods.package_index]).totleNum + minusNum;
    if (isRequire){
      if (this.data.goodsDetail.package[goods.package_index].goods_list[id].num == 0){
        newData['totalPrice'] = (Number(this.data.totalPrice) + Number(attrPrice) * minusNum);
      }else {
        newData['totalPrice'] = (Number(this.data.totalPrice) + Number(attrPrice) * minusNum + added_price);
      }
    }else {
      newData['totalPrice'] = (Number(this.data.totalPrice) + Number(attrPrice) * minusNum + added_price * minusNum);
    }
    newData['totalPrice'] = Number(newData['totalPrice']).toFixed(2);
    this.setData(newData);
  },
  clone: function (obj) {
    return JSON.parse(JSON.stringify(obj));
  },
  stopPropagation: function (e) {
  }
})