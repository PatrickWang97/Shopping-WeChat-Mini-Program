var app = getApp()
const customEvent = require('../../../utils/custom_event.js');
Page({
  data: {
    showDiscountDetailModal: false,    // 优惠明细弹窗
    originGoodsList: [],
    cartType: 0,
    deliveryMethod: -1,
    editing: false,
    goodsCount: 0,
    goodsCountToPay: 0,
    priceToPay: 0.00,
    goodsList: [],
    unableData: [],
    isFromBack: false,
    selectAll: false,
    notBussinessTimeGoodId: [],
    showDeleteWindow: false,
    currentSelectGoodsType: '',
    showFastGoods: true,
    showAddress: false,//是否显示地址
    isFranchisee: false,          // 是否是多商家小程序
    showMoreUnableGoods: false,   // 是否显示更多失效商品
    requestFinish: false,         // 是否请求完成
    isGoodsPickUpType: 1,
    delid: '',
    allTypeNum: 1,   //购物车所有商品支持的配送方式的总数
    toPayGoodsList: [],
    selectAttrInfo: {
      attrs: []
    },
    isSeparatePay: true,  // 多商家合并购物车店铺是否单独结算
  },
  modelId: '',
  goodsNumbefore: '',
  attributesbefore: '',
  isFromBack: false,
  franchiseeId: '',
  isFromUserCenterEle: '',
  onLoad: function (options) {
    this.franchiseeId = options.franchisee || app.globalData.chainAppId || '';
    this.isFromUserCenterEle = options.from || '';
    this.goodsScanCode = options.goodsScanCode;
    let isFranchisee = false,
      isSeparatePay = false;  // 合并购物车的结算方式是否为单独结算
    let { goodsStoreConfig, hasFranchiseeList, hasFranchiseeChain } = app.globalData;
    if (goodsStoreConfig['cart_config'] && goodsStoreConfig['cart_config'].is_merge_shoppingcart == 1) { // 是否开启合并购物车
      if ((hasFranchiseeList || hasFranchiseeChain) && (app.getAppId() === this.franchiseeId)) {
        isFranchisee = true;
      }
      isSeparatePay = goodsStoreConfig['cart_config']['is_separate_pay'] == 1 ? true : false;
    }
    this.setData({
      franchiseeId: this.franchiseeId,
      isFranchisee: isFranchisee,
      isSeparatePay: isSeparatePay,
    })
    if (app.isLogin()) {
      this.dataInitial();
      this.setData({
        hasLogin: true
      })
    } else {
      this.setData({
        hasLogin: false
      })
    }
  },
  onShow: function () {
    if (this.isFromBack && app.isLogin()) {
      this.dataInitial();
      this.setData({
        selectAll: false,
        deliveryMethod: -1
      });
    } else {
      this.isFromBack = true
    }
    this.getAppECStoreConfig();
  },
  onReady: function () {
    if (this.goodsScanCode) {
      this.scanShopping();
    }
  },
  dataInitial: function () {
    this.getShoppingCartData('first');
    this.getAppECStoreConfig();
    this.isShowAddress();
  },
  getAppECStoreConfig: function () {
    let pickUpType = '';
    let that = this;
    app.getAppECStoreConfig((res) => {
      if (that.data.deliveryMethod == '-1') {
        if (res.express == 1) {
          pickUpType = 1;
        } else if (res.intra_city == 1) {
          pickUpType = 2;
        } else if (res.is_self_delivery == 1) {
          pickUpType = 3;
        } else if (res.dining == 1) {
          pickUpType = 4;
        }
      } else {
        pickUpType = that.data.deliveryMethod;
      }
      this.setData({
        pickUpType: pickUpType,
        cartConfig: res.cart_config,
        storeStyle: res.color_config,
        tabExpress: res.express,
        tabIntraCity: res.intra_city,
        tabDelivery: res.is_self_delivery,
        tabDining: this.franchiseeId ? false : (res.dining || 0)   //暂时不兼容子店(如果是子店 不显示堂食tab选项)
      })
    }, this.franchiseeId);
  },
  getShoppingCartData: function (frequency) {
    var _this = this,
      franchiseeId = this.franchiseeId,
      fromUserCenterEle = this.data.isFromUserCenterEle;
    let { isFranchisee } = this.data;
    let parentAppId = app.getAppId();
    if (isFranchisee) { // 多店结算接口比较慢，只有数据返回才能点击结算按钮
      _this.setData({
        requestFinish: false
      });
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 1000,
        sub_shop_app_id: isFranchisee ? '' : franchiseeId,
        dis_group_id: -2,
        app_id_type: franchiseeId || '',
        parent_shop_app_id: (franchiseeId || isFranchisee) ? parentAppId : '',
        is_app_shop: isFranchisee ? 1 : 0,
      },
      success: function (res) {
        let originGoodsList = res.data || [];
        let hasGoodsTypeObj = {}
        let cartType = 0;
        let goodsList = [];
        let setDataObj = {};
        let pickUpType = -1;
        let allTypeArr = []
        originGoodsList.map((item) => {
          switch (item.goods_type) {
            case '0':
              if (item.dis_group_id != 0){
                hasGoodsTypeObj['hasCommunity'] = true;
                _this.communityLeadetroken = item.form_data.leader_token;
              }else{
                hasGoodsTypeObj['hasGoods'] = true;
              }
              break;
            case '2':
              if ((franchiseeId || parentAppId) == item.app_id) {
                hasGoodsTypeObj['hasWaimai'] = true;
              }
              break;
            case '3':
              if ((franchiseeId || parentAppId) == item.app_id) {
                hasGoodsTypeObj['hasTostore'] = true;
              }
              break;
          }
        })
        if (hasGoodsTypeObj['hasGoods']) {
          cartType = 0;
          frequency == 'first';
          if (_this.data.showAddress) { _this.getCurrentLocation(); }
        } else if (hasGoodsTypeObj['hasCommunity']){
          cartType = 'community';
        } else if (hasGoodsTypeObj['hasTostore']) {
          cartType = 3;
        } else if (hasGoodsTypeObj['hasWaimai']) {
          cartType = 2;
        }
        if(hasGoodsTypeObj['hasCommunity']){
          _this.getGroupGoodsLeader(_this.communityLeadetroken);
        }
        originGoodsList.map((item) => {
          if (item.goods_type == cartType) {
            (item.pick_up_type.length == 1 && item.pick_up_type[0] == 4 && this.franchiseeId) || item.dis_group_id != 0 ? '' : goodsList.push(item);        // 不兼容子店(如果该商品的配送方式只有堂食，并且是子店，不显示)   社区团购商品分开显示
          }else if(cartType == 'community'){
            item.dis_group_id != 0 ? goodsList.push(item) : ''; 
          }
          if (isFranchisee && cartType == 0) {
            if (item.pick_up_type.includes('1')) {
              pickUpType = '1';
            } else if (item.pick_up_type.includes('2') && pickUpType != 1) {
              pickUpType = '2';
            } else if (item.pick_up_type.includes('3') && pickUpType != 1 && pickUpType != 2) {
              pickUpType = '3';
            }
          }
        });
        let selecteds = [];
        goodsList.forEach(goods => {
          if (goods.is_package_goods == 1) {
            goods.showPackageInfo = false;
          }
          if (!Array.isArray(goods.package_goods)) {
            goods.package_goods = [];
          }
          if (goods.attributes) {
            for (let attr in goods.attributes) {
              for (let _goods in goods.attributes[attr].goods_list) {
                goods.package_goods.push(goods.attributes[attr].goods_list[_goods])
              }
            }
          }
          let totalVal = '';
          if (goods.model_value) {
            goods.model_value.forEach(val => {
              totalVal = totalVal + val + ','
            })
          }
          let totalValLength = 0;
          for (var i = 0; i < totalVal.length; ++i) {
            var c = totalVal.charCodeAt(i);
            if ((c >= 0x0001 && c <= 0x007e) || (0xff60 <= c && c <= 0xff9f)) {
              totalValLength++;
            } else {
              totalValLength += 2;
            }
          }
          goods.modelVal = totalValLength > 26;
          goods.pick_up_type.forEach(val=>{
            allTypeArr.push(val)
          })
          goods.selected = true;
          selecteds.push(goods.id);
        })
        app.shoppingCardGoodsArr = selecteds;
        let setallTypeArr = new Set(allTypeArr)
        _this.data.allTypeNum = setallTypeArr.size > 1 ? setallTypeArr.size : 1;
        setDataObj['allTypeNum'] = _this.data.allTypeNum;
        setDataObj['typeNum'] = Object.keys(hasGoodsTypeObj).length;
        setDataObj['cartType'] = cartType;
        setDataObj['originGoodsList'] = originGoodsList;
        setDataObj['goodsList'] = goodsList;
        setDataObj['hasGoodsTypeObj'] = hasGoodsTypeObj;
        setDataObj['takeoutInfo'] = res.take_out_info;
        setDataObj['goodsCount'] = originGoodsList.length;
        setDataObj['unableData'] = res.unable_data;
        setDataObj['deliveryMethod'] = -1;
        if (isFranchisee) { // 多商家多店
          let listData = JSON.parse(JSON.stringify(res.appShopData));
          let deliveryMethod = pickUpType == -1 ? '1' : pickUpType;
          if (listData && listData.length) {
            listData.map((shop) => {
              shop.cartList = shop.cartList.filter((goods) => goods.pick_up_type.indexOf(deliveryMethod) >= 0 && goods.dis_group_id == 0);
            });
            setDataObj['shopsList'] = listData.filter((shop) => shop.cartList.length > 0);
          } else {
            setDataObj['shopsList'] = [];
          }
          setDataObj['hasGoodsTypeArray'] = Object.getOwnPropertyNames(hasGoodsTypeObj);
          setDataObj['originShopsList'] = res.appShopData;
          setDataObj['shopsListConfig'] = res.appBECStoreConf;
          setDataObj['deliveryMethod'] = deliveryMethod;
          setDataObj['shopsBenefit'] = res.tpmPickUp;
          setDataObj['requestFinish'] = true;
        }
        _this.setData(setDataObj);
        _this.clickSelectAll('firstTime');
        _this.getTostoreNotBusinessTime();
        _this.recalculateCountPrice();
      }
    })
  },
  switchToEdit: function () {
    let { editing } = this.data;
    this.setData({
      editing: !editing
    });
  },
  clickSelectShops: function(e) {
    let { index } = e.currentTarget.dataset;
    let { shopsList } = this.data;
    let selectAll = true;
    shopsList[index].selected = !shopsList[index].selected;
    shopsList[index].cartList.forEach((goods) => goods.selected = shopsList[index].selected);
    selectAll = shopsList.every((shop) => shop.selected == true);
    this.setData({
      shopsList: shopsList,
      selectAll: selectAll,
    });
    this.recalculateCountPrice();
  },
  clickSelectGoods: function (e) {
    let { index, isFranchisee, activityId } = e.currentTarget.dataset;
    let { goodsList } = this.data.newCartList[activityId] || this.data;
    let selectAll = true;
    let setDataObj = {};
    let shoppingCardGoodsArr = [];
    if(!isFranchisee) {
      goodsList[index].selected = !goodsList[index].selected;
      let allGoodsList = [];
      for (let item in this.data.newCartList) {
        allGoodsList = allGoodsList.concat(this.data.newCartList[item].goodsList);
      }
      selectAll = allGoodsList.every((goods) => goods.selected == true);
      allGoodsList.forEach((goods) => {
        if (goods.selected) {
          shoppingCardGoodsArr.push(goods.id)
        }
      });
      setDataObj[`newCartList.${activityId}.goodsList`] = goodsList;
      app.shoppingCardGoodsArr = shoppingCardGoodsArr;
      setDataObj['selectAll'] = selectAll;
    }
    if (isFranchisee) { // 多商家多店
      let { shopIndex } = e.currentTarget.dataset;
      let { shopsList } = this.data;
      let currentShop = shopsList[shopIndex];
      let currentGoods = currentShop.cartList[index];
      currentGoods.selected = !currentGoods.selected;
      currentShop.selected = currentShop.cartList.every(goods => goods.selected == true);
      selectAll = shopsList.every(shop => shop.selected == true);
      setDataObj['selectAll'] = selectAll;
      setDataObj['shopsList'] = shopsList;
    }
    this.setData(setDataObj);
    this.recalculateCountPrice();
  },
  clickSelectAll: function(time){
    let { selectAll, goodsList, isFranchisee, cartType } = this.data;
    let setDataObj = {}, shoppingCardGoodsArr = [];
    if (app.shoppingCardGoodsArr && time == 'firstTime') {
      if (!isFranchisee || cartType != 0) { // 单店
        goodsList.map((item) => {
          app.shoppingCardGoodsArr.map(goods => {
            if (item.id == goods) {
              item.selected = true
            }
          })
        });
        setDataObj['goodsList'] = goodsList;
        selectAll = true;
        goodsList.map((goods) => { 
          if (!goods.selected)
          selectAll = false 
        });
        setDataObj['selectAll'] = selectAll;
      }
    }else {
      setDataObj = {
        'selectAll': !selectAll,
      };
      if (!isFranchisee || cartType != 0) { // 单店
        goodsList.map((item) => {
          item.selected = !selectAll;
        });
        setDataObj['goodsList'] = goodsList;
      }
    }
    goodsList.forEach((goods) => {
      if (goods.selected) {
        shoppingCardGoodsArr.push(goods.id)
      }
    });
    app.shoppingCardGoodsArr = shoppingCardGoodsArr;
    if (isFranchisee && cartType == 0) { // 多店
      let { shopsList } = this.data;
      shopsList.forEach((shop) => {
        shop.selected = !selectAll;
        shop.cartList.forEach((goods) => {
          goods.selected = !selectAll;
        });
      });
      setDataObj['shopsList'] = shopsList;
    }
    this.setData(setDataObj);
    this.recalculateCountPrice();
  },
  recalculateCountPrice: function () {
    let { goodsList, isFranchisee, cartType, shopsList } = this.data;
    let totalCount = 0,
      price = 0;
    if (!isFranchisee || cartType != 0) { // 单店计算总价
      goodsList.map((item) => {
        if (item.selected) {
          totalCount += +item.num;
          price += +item.price * +item.num;
        }
      });
    }
    if (isFranchisee && cartType == 0) { // 多店计算总价
      let { shopsList } = this.data;
      shopsList.forEach(shop => {
        let shopCartPirce = 0;
        shop.cartList.forEach((goods) => {
          if (goods.selected) {
            totalCount += +goods.num;
            price += +goods.price * +goods.num;
            shopCartPirce += +goods.price * +goods.num;
          }
        });
        shop['priceToPay'] = shopCartPirce.toFixed(2);
      });
    }
    this.setData({
      shopsList: shopsList || [],
      goodsCountToPay: totalCount,
      priceToPay: price.toFixed(2)
    });
    this.getGoodsDiscountInfoInCart();
  },
  getTostoreNotBusinessTime: function (payIdArr, sucfn) {
    let that = this;
    let { isFranchisee, cartType } = this.data;
    let parentAppId = app.getAppId();
    app.sendRequest({
      url: '/index.php?r=AppShop/precheckShoppingCart',
      hideLoading: true,
      method: 'post',
      data: {
        sub_shop_app_id: that.franchiseeId,
        cart_arr: payIdArr || '',
        parent_shop_app_id: (that.franchiseeId || isFranchisee) ? parentAppId : '',
        is_multi: (isFranchisee && cartType == 0) ? 1 : 0, // 是否多店返回
        app_id_arr: payIdArr || ''
      },
      success: function (res) {
        sucfn && sucfn();
      },
      successStatusAbnormal: function (res) {
        if (res.status == 1) {
          var goodsId = res.expired_goods_arr || [],
            list = that.data.goodsList;
          if (goodsId && goodsId.length) {
            for (var i = 0; i < goodsId.length; i++) {
              var id = goodsId[i].goods_id;
              for (var j = list.length - 1; j >= 0; j--) {
                if (id == list[j].goods_id) {
                  list[j].selected = false;
                }
              };
            }
            that.setData({
              selectAll: false,
              goodsList: list,
              notBussinessTimeGoodId: goodsId
            });
            that.recalculateCountPrice();
          }
        }
      }
    })
  },
  goToPay: function (e) {
    let needPayAppId = e.currentTarget.dataset.appId;
    let { goodsList, cartType, isFranchisee, isSeparatePay } = this.data;
    let that = this;
    let payIdArr = [];
    let cartIdArray = [];
    let goodsIdArray = [];
    let notBusinessTimeFlag = false;
    let formId = [];
    let toPayGoodsList = [];
    let limitData = {
      flag: true,     // 是否全部商品限购
      goodsName: '',  // 限购商品名称
      goodsNum: 0,    // 限购商品数量
    };
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    if (!isFranchisee || cartType != 0) {
      goodsList.map((item) => {
        if (item.selected && !that.isLimitGoodsCanBuy(item)) {  // isLimitGoodsCanBuy返回false则商品限购
          limitData['goodsName'] = item.title;
          limitData['goodsNum'] += 1;
        }
        if (item.selected && that.isLimitGoodsCanBuy(item)) {  // 商品选中且不限购才加入购物车
          limitData['flag'] = false;
          toPayGoodsList.push(item)
          cartIdArray.push(item.id);
          goodsIdArray.push(item.goods_id);
          payIdArr.push({
            cart_id: item.id,
            goods_id: item.goods_id,
            model_id: item.model_id,
            model: item.model,
            num: item.num,
            goods_type: item.goods_type,
            is_seckill: item.is_seckill,
            seckill_start_state: item.seckill_start_state ? item.seckill_start_state : '',
          });
        }
      });
    }
    if (isFranchisee && cartType == 0) {
      let { shopsList } = this.data;
      if (isSeparatePay && needPayAppId) {
        shopsList = shopsList.filter((shop) => shop.app_id === needPayAppId);
      }
      payIdArr = shopsList.map((shop) => {
        let cartIdArr = shop['cartList'].map((cart) => {
          if (cart.selected && !that.isLimitGoodsCanBuy(cart)) {  // 判断是否有限购商品
            limitData['goodsName'] = cart.title;
            limitData['goodsNum'] += 1;
          }
          if (cart.selected && that.isLimitGoodsCanBuy(cart)) {  // 商品选中且不限购才加入购物车
            limitData['flag'] = false;
            cartIdArray.push(cart.id);
            return {
              'cart_id': cart.id,
              'goods_id': cart.goods_id,
              'model_id': cart.model_id,
              'model': cart.model,
              'num': cart.num,
              'goods_type': cart.goods_type,
              'is_seckill': cart.is_seckill,
              'seckill_start_state': cart.seckill_start_state ? cart.seckill_start_state : '',
            };
          }
        });
        return {
          'app_id': shop.app_id,
          'cart_arr': cartIdArr,
        };
      });
      payIdArr = payIdArr.filter((shop) => shop['cart_arr'].length > 0);
    }
    if (!cartIdArray.length && !limitData['goodsNum']) {
      app.showModal({
        content: '请选择结算的商品'
      });
      return;
    }
    if (limitData['goodsNum']) { // goodsNum大于0则有限购商品
      if (limitData['flag']) {   // flag为true则购物车全部商品都限购
        app.showModal({
          content: `【${limitData['goodsName']}】已达最大限购数量`,
          confirmText: '我知道了'
        });
        return;
      } else {  // 部分商品限购
        app.showModal({
          content: `【${limitData['goodsName']}】已达最大限购数量`,
          showCancel: true,
          confirmText: '结算其他',
          confirm: function () {
            let goodsIdArrayOnly = [...new Set(goodsIdArray)];
            that.getDefaultPickUpType(payIdArr, cartIdArray, goodsIdArrayOnly, needPayAppId)
          }
        })
        return;
      }
    }
    that.setData({
      toPayGoodsList: toPayGoodsList
    })
    let goodsIdArrayOnly = [...new Set(goodsIdArray)];
    if (that.data.cartType == 'community') {
      app.globalData.leaderInfo = that.data.leaderInfo;
    }
    that.getDefaultPickUpType(payIdArr, cartIdArray, goodsIdArrayOnly, needPayAppId)
  },
  clickMinusButton: function (e) {
    this.changeGoodsNum(e, 'minus');
  },
  clickPlusButton: function (e) {
    this.changeGoodsNum(e, 'plus');
  },
  inputGoodsCount: function (e) {
    let count = e.detail.value;
    if (count == '') {
      return;
    }
    if (count == 0) {
      app.showModal({
        content: '请输入大于0的数字',
      })
      return;
    }
    this.changeGoodsNum(e, 'number', count);
  },
  changeGoodsNum: function (e, type, numberCount) {
    let { index, isFranchisee, appId, activityId } = e.currentTarget.dataset;
    let { goodsList } = this.data.newCartList[activityId] || this.data;
    let shopsList = this.data.shopsList;
    let currentGoods = goodsList[index];
    if (isFranchisee) {
      let { shopIndex } = e.currentTarget.dataset;
      this.shopAppId = appId;
      currentGoods = shopsList[shopIndex].cartList[index];
    }
    let currentNum = +currentGoods.num,
      targetNum,
      _this = this,
      param;
    if (type == 'plus') {
      targetNum = currentNum + 1;
      app.sendUseBehavior([{ goodsId: currentGoods.goods_id }], 4);
    } else if (type == 'minus') {
      targetNum = currentNum - 1;
      if (+targetNum < +currentGoods.min_sales_nums || targetNum <= 0) {
        this.setData({
          singelDeleteId: currentGoods.id,
          delete_min_sales_nums: targetNum > 0 ? currentGoods.min_sales_nums : '',
        })
        this.showDeleteWindow('singel');
        return;
      }
    } else {
      targetNum = numberCount;
    }
    if (+targetNum < +currentGoods.min_sales_nums) {
      app.showModal({
        content: '当前数量不能小于最小起卖数'
      })
      _this.setData({
        goodsList: goodsList
      })
      return;
    }
    if (+targetNum > +currentGoods.stock) {
      app.showModal({
        content: '库存不足'
      });
      return;
    }
    if (currentGoods.form_data && currentGoods.form_data.seckill_activity_id) {
      param = {
        goods_id: currentGoods.goods_id,
        model_id: currentGoods.model_id || '',
        num: targetNum,
        sub_shop_app_id: this.franchiseeId,
        is_seckill: 1,
        form_data: {
          seckill_activity_id: currentGoods.form_data.seckill_activity_id,
          seckill_activity_time_id: currentGoods.form_data.seckill_activity_time_id,
        }
      }
    } else {
      param = {
        goods_id: currentGoods.goods_id,
        model_id: currentGoods.model_id || '',
        num: targetNum,
        sub_shop_app_id: isFranchisee ? (appId || app.getAppId()) : this.franchiseeId,
        is_seckill: currentGoods.is_seckill == 1 ? 1 : '',
        form_data: {
          attributes: []
        },
        message_notice_type: 1
      }
    }
    if (this.data.cartType == 'community'){
      param.leader_token = this.communityLeadetroken;
      param.dis_group_id = -1;
      if(currentGoods.is_seckill == 1){
        param.is_single_goods = 1;
      }else{
        param.group_id = currentGoods.form_data.dis_group_id;
      }
    }
    if (currentGoods.is_package_goods == 1) {
      param.form_data.is_package_goods = 1;
      if (Array.isArray(currentGoods.package_goods)) {
        currentGoods.package_goods.forEach(packageItem => {
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
      }
    } else if (currentGoods.attributes) {
      currentGoods.form_data.attributes.forEach(item => {
        param.form_data.attributes.push(item);
      })
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      method: 'post',
      success: function (res) {
        currentGoods.num = targetNum;
        let { cartType } = _this.data;
        let setDataObj = {};
        if (isFranchisee && cartType == 0) {
          setDataObj['shopsList'] = shopsList;
        } else {
          if (_this.data.newCartList[activityId]) {
            setDataObj[`newCartList.${activityId}.goodsList`] = goodsList;
          }else {
            setDataObj['goodsList'] = goodsList;
            setDataObj['showGoodsModelValue'] = false;
          }
        }
        _this.setData(setDataObj);
        _this.recalculateCountPrice();
        if (cartType === 'community') {
          app.globalData.groupRefreshList = true;
        }
      },
      successStatusAbnormal: function (res) {
        app.showModal({
          content: res.data
        });
      }
    })
  },
  goToHomepage: function () {
    let router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  showDeleteWindow: function (type) {
    this.setData({
      deleteType: type,
      showDeleteWindow: true
    })
  },
  cancelDelete: function () {
    this.setData({
      showDeleteWindow: false
    })
  },
  sureDeleteGoods: function (e) {
    let { type } = e.currentTarget.dataset;
    let { isFranchisee, singelDeleteId, goodsList, cartType } = this.data;
    let _this = this;
    let deleteArr = [];
    if (type == 'singel') {
      deleteArr.push(singelDeleteId);
    } else {
      if (!isFranchisee || cartType != 0) { // 单店
        goodsList.map((item) => {
          if (item.selected) {
            deleteArr.push(item.id);
          }
        });
      } else { // 多店
        let { shopsList } = this.data;
        shopsList.map((shop) => {
          shop['cartList'].filter((cart) => cart.selected).map((cart) => deleteArr.push(cart.id));
        });
      }
    }
    if (deleteArr.length == 0) {
      _this.setData({
        showDeleteWindow: false,
        selectAll: false,
        currentSelectGoodsType: ''
      });
      app.showModal({
        content: '没有选择商品'
      });
      return;
    }
    this.deleteGoods(deleteArr);
    let goodsArr = [];
    deleteArr.forEach((a) => {
      goodsArr.push({ goodsId: a });
    })
    app.sendUseBehavior(goodsArr, 4, 2);
  },
  deleteGoods: function (deleteArr) {
    let { isFromUserCenterEle, isFranchisee, cartType } = this.data;
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: deleteArr,
        sub_shop_app_id: isFromUserCenterEle ? '' : (isFranchisee && cartType == 0 ? (_this.shopAppId || app.getAppId()) : _this.franchiseeId),
        is_all: isFranchisee ? 1 : 0,
      },
      success: function (res) {
        _this.setData({
          showDeleteWindow: false,
          selectAll: false,
          currentSelectGoodsType: '',
          delete_min_sales_nums: '',
          showGoodsModelValue: false,
        });
        _this.getShoppingCartData();
        if (cartType === 'community') {
          app.globalData.groupRefreshList = true;
        }
      }
    });
  },
  deleteUnableGoods: function (event) {
    let index = event.currentTarget.dataset.index;
    let deleteId = this.data.unableData[index].id;
    this.shopAppId = this.data.unableData[index].app_id;
    this.setData({
      singelDeleteId: deleteId
    })
    this.showDeleteWindow('singel');
  },
  stopPropagation: function () {
  },
  changeCartType: function (e) {
    let { type, isFranchisee } = e.currentTarget.dataset;
    let { originGoodsList, deliveryMethod, cartType } = this.data;
    let appId = this.franchiseeId || app.getAppId();
    let goodsList = [];
    let setDataObj = {}, shoppingCardGoodsArr = [];
    if (type == cartType) { return }
    originGoodsList.map((item) => {
      item.selected = true;  // 默认全部选中
      if (item.app_id == appId){
        if (type == 0 && item.goods_type == 0 && item.dis_group_id == 0) {
          goodsList.push(item);
        } else if (type == 'community' && item.goods_type == 0 && item.dis_group_id != 0) {
          goodsList.push(item);
        } else if (type != 0 && item.goods_type == type) {
          goodsList.push(item);
        }
      }
    })
    if (deliveryMethod != -1 && type == 0) {
      let filterGoodsList = [];
      goodsList.map((item) => {
        if (item.pick_up_type.indexOf(deliveryMethod) >= 0) {
          filterGoodsList.push(item);
        }
      })
      goodsList = filterGoodsList;
    }
    goodsList.forEach((goods) => {
      if (goods.selected) {
        shoppingCardGoodsArr.push(goods.id)
      }
    });
    app.shoppingCardGoodsArr = shoppingCardGoodsArr;
    setDataObj['cartType'] = type;
    setDataObj['selectAll'] = false;
    setDataObj['goodsList'] = goodsList;
    if (isFranchisee) { // 多商家多店
      let { shopsList } = this.data;
      shopsList.forEach(shop => {
        shop.selected = false;
        shop['cartList'].forEach((cart) => cart.selected = false);
      });
      setDataObj['shopsList'] = shopsList;
    }
    this.setData(setDataObj);
    this.recalculateCountPrice();
  },
  goCommodityDetail: function (event) {
    let franchiseeParam = this.franchiseeId ? '&franchisee=' + this.franchiseeId : '';
    app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + event.currentTarget.dataset.id + franchiseeParam);
  },
  stopPropagation: function () {
  },
  filterDeliveryMethod: function (e) {
    let { type, isFranchisee } = e.currentTarget.dataset;
    let { originGoodsList } = this.data;
    let goodsList = [];
    let setDataObj = {
      'deliveryMethod': type,
    };
    setDataObj['pickUpType'] = type;
    originGoodsList.map((item) => {
      if (item.goods_type == 0 && item.dis_group_id == 0) {
        goodsList.push(item);
      }
    })
    if (!goodsList) { return };
    if (type != -1) {
      let filterGoodsList = [];
      goodsList.map((item) => {
        if (item.pick_up_type.indexOf(type) >= 0) {
          filterGoodsList.push(item);
        }
      })
      goodsList = filterGoodsList;
    }
    setDataObj['goodsList'] = goodsList;
    goodsList.map(item => {
      if (item.selected == false) {
        setDataObj['selectAll'] = false;
      }
    })
    if (isFranchisee) {
      let { originShopsList } = this.data;
      let shopsList = JSON.parse(JSON.stringify(originShopsList));
      if (type != '-1') {
        shopsList.forEach((shop) => {
          shop.selected = true;
          if (shop.cartList.length) {
            shop.cartList = shop['cartList'].filter((goods) => goods.pick_up_type.indexOf(type) >= 0 && goods.dis_group_id == 0);
            shop.cartList.forEach((goods) => {
              goods.selected = true;
            });
          }
        });
      }
      setDataObj['shopsList'] = shopsList.filter((shop) => shop.cartList.length);
      setDataObj['selectAll'] = true;
    }
    this.setData(setDataObj);
    this.recalculateCountPrice();
  },
  getCurrentLocation: function () {
    let _this = this;
    wx.getLocation({
      success(res) {
        const latitude = res.latitude;
        const longitude = res.longitude;
        app.sendRequest({
          url: '/index.php?r=Map/getAreaInfoByLatAndLng',
          hideLoading: true,
          method: 'post',
          data: {
            latitude: latitude,
            longitude: longitude
          },
          success: function (res) {
            _this.setData({
              currentLocationData: res.data
            })
          }
        });
      },
      fail: function (res) {
      }
    })
  },
  selectGoodsSameJourney: function (event) {
    let appId = event.currentTarget.dataset.appId;
    let { selectSameJourney, isFranchisee } = this.data;
    this.closeSettlement();
    app.turnToPage('/eCommerce/pages/goodsSameJourney/goodsSameJourney?sameJourneyId=' + (selectSameJourney ? selectSameJourney.id : '') + '&franchiseeId=' + (isFranchisee ? appId : this.franchiseeId));
  },
  showSettlement: function () {
    let _this = this;
    let goodsList = this.data.goodsList;
    let goodsIds = [];
    let expressData = {
      goodsIds: [],
      totalPrice: 0
    };
    let sameCityData = {
      goodsIds: [],
      totalPrice: 0
    };
    let selfLiftData = {
      goodsIds: [],
      totalPrice: 0
    };
    let currentLocationData = this.data.currentLocationData;
    let selectSameJourney = this.data.selectSameJourney;
    let lat = selectSameJourney ? selectSameJourney.latitude : (currentLocationData ? currentLocationData.location.lat : '');
    let lng = selectSameJourney ? selectSameJourney.longitude : (currentLocationData ? currentLocationData.location.lng : '');
    let regionId = selectSameJourney ? selectSameJourney.address_info.district.id : (currentLocationData ? currentLocationData.region_id : '');
    goodsList.map((item) => {
      if (item.selected && _this.isLimitGoodsCanBuy(item)) {
        if (item.pick_up_type.indexOf('1') >= 0) {
          expressData.goodsIds.push(item.id);
          expressData.totalPrice += +item.price
        }
        if (item.pick_up_type.indexOf('2') >= 0) {
          sameCityData.goodsIds.push(item.id);
          sameCityData.totalPrice += +item.price
        }
        if (item.pick_up_type.indexOf('3') >= 0) {
          selfLiftData.goodsIds.push(item.id);
          selfLiftData.totalPrice += +item.price
        }
        goodsIds.push(+item.id);
      }
    })
    if (!goodsIds.length) {
      app.showModal({
        content: '请选择商品'
      })
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getCanUsePickUpTypeAtCart',
      method: 'post',
      data: {
        latitude: lat,
        longitude: lng,
        region_id: regionId,
        cart_id_arr: goodsIds,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let data = res.data;
        if (_this.franchiseeId && data.hasOwnProperty(4)) {
          delete data[4]
        }
        let cartIdArray;
        if (data.hasOwnProperty(1) && !data.hasOwnProperty(2) && !data.hasOwnProperty(3) && !data.hasOwnProperty(4)) {
          cartIdArray = data[1].cart_list;
        }
        if ((!data.hasOwnProperty(1) && data.hasOwnProperty(2) && !data.hasOwnProperty(3) && !data.hasOwnProperty(4) && data[2] && data[2].intra_city_data) || (goodsIds.length == 1 && _this.data.pickUpType == 2 && data.hasOwnProperty(2)) ) {
          let incity_data = data[2].intra_city_data;
          if (incity_data.in_business_time != 1) {
            app.showModal({
              content: '不在营业时间'
            })
            return
          }
          cartIdArray = data[2].cart_list;
        }
        if ((_this.data.isGoodsPickUpType == 0 && goodsIds.length > 1 && data.hasOwnProperty(_this.data.pickUpType))) {
          cartIdArray = data[_this.data.pickUpType].cart_list;
        }
        if (!data.hasOwnProperty(1) && !data.hasOwnProperty(2) && data.hasOwnProperty(3) && !data.hasOwnProperty(4)) {
          cartIdArray = data[3].cart_list;
        }
        if (!data.hasOwnProperty(1) && !data.hasOwnProperty(2) && !data.hasOwnProperty(3) && data.hasOwnProperty(4)) {
          cartIdArray = data[4].cart_list;
        }
        let pickUpType = _this.data.pickUpType;
        function checkHasType(pickUpType) {
          if (!data[pickUpType]) {
            for (var key in data) {
              if (key == 2 && data[3]) {
                return 3
              }
              return key
            }
          }
          return pickUpType
        }
        let type = checkHasType(pickUpType);
        if (_this.data.isGoodsPickUpType == 0 && data.hasOwnProperty(type)) {
          cartIdArray = data[type].cart_list;
        }
        if (cartIdArray) {
          let franchiseeId = _this.franchiseeId;
          let addressId = this.data.selectSameJourneyId;
          let pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cartIdArray);
          franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
          addressId && (pagePath += '&addressId=' + addressId);
          type && (pagePath += '&type=' + type);
          app.turnToPage(pagePath);
          return;
        }
        if (_this.data.deliveryMethod != -1 && data.hasOwnProperty(_this.data.deliveryMethod)) {
          _this.checkedPickRadioFn(null, _this.data.deliveryMethod, data[_this.data.deliveryMethod].cart_list)
        } else {
          _this.checkedPickRadioFn(null, type, data[type].cart_list)
        }
        _this.setData({
          pickUpType: type,
          canUsePickUpType: data,
          intraCityData: data[2] && data[2].intra_city_data || '',
          diningData: data[4] && data[4].dining_data || '',
          showSettlementMask: true,
          showDiscountDetailModal: false,
        })
      }
    });
  },
  closeSettlement: function () {
    this.setData({
      showSettlementMask: false
    })
  },
  closeGoodsModelValue: function () {
    this.setData({
      showGoodsModelValue: false
    })
  },
  openGoodsModelValue: function (e) {
    var _this = this;
    let { id, modelId, num, index, cartid, attributes } = e.currentTarget.dataset;
    this.data.selectAttrInfo.attrs = []
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: id,
        sub_shop_app_id: _this.franchiseeId,
        message_notice_type: 1,
        not_group_buy_goods: 1
      },
      success: function (res) {
        _this.modelId = modelId;
        _this.goodsNumbefore = num;
        _this.attributesbefore = attributes;
        _this.modifyGoodsDetail(res, modelId, num, index, cartid, attributes),
          _this.setData({
            showGoodsModelValue: true,
          })
      },
    })
  },
  modifyGoodsDetail: function (res, model_id, num, index, cartid, attributes) {
    let _this = this;
    if (res.status == 0) {
      let goods = res.data[0].form_data;
      let defaultSelect;
      goods.model_items.forEach(model => {
        if (model.id == model_id) {
          defaultSelect = model
        }
      })
      let goodsModel = [];
      let selectModels = [];
      let goodprice = 0;
      let goodstock = 0;
      let goodid;
      let selectText = '';
      let goodimgurl = '';
      let virtual_price = '';
      let is_vip_goods = goods.is_vip_goods;
      let is_package_goods = goods.is_package_goods;
      let vipprice = 0;
      let min_sales_nums = 1;
      goodprice = defaultSelect.price;
      goodstock = defaultSelect.stock;
      vipprice = defaultSelect.vip_price || defaultSelect.price;
      goodid = defaultSelect.id;
      goodimgurl = defaultSelect.img_url;
      virtual_price = defaultSelect.virtual_price;
      min_sales_nums = +defaultSelect.min_sales_nums || 1;
      let defaultSelectModelArr = defaultSelect.model.split(",");
      for (let key in goods.model) {
        if (key) {
          let model = goods.model[key];
          goodsModel.push(model);
          for (let modelKey = 0; modelKey < defaultSelectModelArr.length; modelKey++) {
            for (let subModelKey = 0; subModelKey < model.subModelId.length; subModelKey++) {
              if (defaultSelectModelArr[modelKey] == model.subModelId[subModelKey]) {
                selectModels.push(model.subModelId[subModelKey]);
                selectText += '“' + model.subModelName[subModelKey] + '” ';
              }
            }
          }
        }
      }
      let attrs = goods.attributes || [];
      if (attributes) {
        attributes.forEach((attrS, idx) => {
          attrs.forEach((attrsA, index) => {
            if (attrS.id == attrsA.id) {
              attrsA.elem.forEach((res, i) => {
                attrS.elem.forEach((callback) => {
                  if (callback.id == res.id) {
                    res.is_selected = true
                  }
                })
              })
            }
          })
        })
      }
      goods.model = goodsModel;
      _this.setData({
        isVisibled: true,
        goodsInfo: goods,
        delid: cartid,
        'selectGoodsModelInfo.price': goodprice,
        'selectGoodsModelInfo.index': index,
        'selectGoodsModelInfo.is_vip_goods': is_vip_goods,
        'selectGoodsModelInfo.vipprice': vipprice,
        'selectGoodsModelInfo.stock': goodstock,
        'selectGoodsModelInfo.buyCount': num,
        'selectGoodsModelInfo.buyTostoreCount': 0,
        'selectGoodsModelInfo.cart_id': '',
        'selectGoodsModelInfo.models': selectModels,
        'selectGoodsModelInfo.modelId': goodid || '',
        'selectGoodsModelInfo.models_text': selectText,
        'selectGoodsModelInfo.imgurl': goodimgurl,
        'selectGoodsModelInfo.virtual_price': virtual_price,
        'selectGoodsModelInfo.max_can_use_integral': goods.max_can_use_integral,
        'selectGoodsModelInfo.min_sales_nums': min_sales_nums || 1,
        'selectGoodsModelInfo.is_package_goods': is_package_goods,
        'selectAttrInfo.attrs': attrs || [] // 清空已选属性
      });
    }
  },
  selectGoodsSubModel: function (event) {
    let dataset = event.target.dataset;
    let modelIndex = dataset.modelIndex;
    let submodelIndex = dataset.submodelIndex;
    let sales = dataset.sales;
    let data = {};
    let selectModels = this.data.selectGoodsModelInfo.models;
    let model = this.data.goodsInfo.model;
    let text = '';
    let goodsInfo = this.data.goodsInfo;
    selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];
    goodsInfo.model_items.forEach(item => {
      if (item.model == selectModels.join(',')) {
        data['selectGoodsModelInfo'] = item;
      }
    })
    for (let i = 0; i < selectModels.length; i++) {
      let selectSubModelId = model[i].subModelId;
      for (let j = 0; j < selectSubModelId.length; j++) {
        if (selectModels[i] == selectSubModelId[j]) {
          text += '“' + model[i].subModelName[j] + '” ';
        }
      }
    }
    data['selectGoodsModelInfo.models'] = selectModels;
    data['selectGoodsModelInfo.models_text'] = text;
    this.setData(data);
    this.resetSelectCountPrice(sales);
  },
  selectSubAttrs: function (e) {
    var dataset = e.target.dataset,
      attrIndex = dataset.attrIndex,
      subAttrIndex = dataset.subattrIndex,
      status = dataset.status,
      data = {},
      selectAttrInfo = this.data.selectAttrInfo,
      selectAttrs = selectAttrInfo.attrs,
      attrs = this.data.goodsInfo.attributes;
    if (attrs[attrIndex].selected_type == 0) {
      selectAttrs[attrIndex] = Array.isArray(selectAttrs[attrIndex].elem) ? selectAttrs[attrIndex] : [];
    } else {
      selectAttrs[attrIndex] = Object.prototype.toString.call(selectAttrs[attrIndex].elem) == "[object Array]" ? selectAttrs[attrIndex] : {};
      selectAttrs[attrIndex].elem.forEach(res => {
        res.is_selected = false
      })
    }
    attrs[attrIndex].elem[subAttrIndex].is_selected = status == 0 ? true : false;
    selectAttrs[attrIndex].elem[subAttrIndex] = attrs[attrIndex].elem[subAttrIndex];
    data['selectAttrInfo.attrs'] = selectAttrs;
    this.setData(data);
  },
  selectGoodsPackage: function (e) {
    let { status } = e.target.dataset;
    app.turnToPage("/eCommerce/pages/setMeal/setMeal.wxml?status=" + status);
  },
  resetSelectCountPrice: function (sales) {
    let selectGoodsModelInfo = this.data.selectGoodsModelInfo;
    let selectModelIds = selectGoodsModelInfo.models.join(',');
    let modelItems = this.data.goodsInfo.model_items;
    let data = {};
    let cover = this.data.goodsInfo.cover;
    let defaultCount = sales;
    modelItems.forEach(item => {
      if (item.model == selectModelIds && +item.min_sales_nums && defaultCount < item.min_sales_nums) {
        defaultCount = item.min_sales_nums;
      }
    })
    data['selectGoodsModelInfo.buyCount'] = defaultCount;
    data['selectGoodsModelInfo.buyTostoreCount'] = 0;
    for (let i = modelItems.length - 1; i >= 0; i--) {
      if (modelItems[i].model == selectModelIds) {
        data['selectGoodsModelInfo.stock'] = modelItems[i].stock;
        data['selectGoodsModelInfo.price'] = modelItems[i].price;
        data['selectGoodsModelInfo.modelId'] = modelItems[i].id || '';
        data['selectGoodsModelInfo.imgurl'] = modelItems[i].img_url || cover;
        data['selectGoodsModelInfo.virtual_price'] = modelItems[i].virtual_price;
        data['selectGoodsModelInfo.vipprice'] = modelItems[i].vip_price || ''
        break;
      }
    }
    this.setData(data);
  },
  inputBuyCount: function (e) {
    var count = +e.detail.value,
      selectGoodsModelInfo = this.data.selectGoodsModelInfo,
      goodsInfo = this.data.goodsInfo,
      stock = +selectGoodsModelInfo.stock;
    if (count >= stock) {
      count = stock;
      app.showModal({ content: '购买数量不能大于库存' });
      this.setData({
        'selectGoodsModelInfo.buyCount': e.detail.value
      })
      return;
    }
    if (count < selectGoodsModelInfo.min_sales_nums) {
      count = +selectGoodsModelInfo.min_sales_nums;
      app.showModal({ content: '购买数量不能少于起卖数' });
      this.setData({
        'selectGoodsModelInfo.buyCount': count
      })
      return;
    }
  },
  clickGoodsMinusButton: function (event) {
    let count = this.data.selectGoodsModelInfo.buyCount;
    let min_sales_nums = +this.data.selectGoodsModelInfo.min_sales_nums;
    if (count <= 1 || count <= min_sales_nums) {
      return;
    }
    this.setData({
      'selectGoodsModelInfo.buyCount': count - 1
    });
  },
  clickGoodsPlusButton: function (event) {
    let selectGoodsModelInfo = this.data.selectGoodsModelInfo;
    let count = +selectGoodsModelInfo.buyCount;
    let stock = +selectGoodsModelInfo.stock;
    if (count >= stock) {
      return;
    }
    this.setData({
      'selectGoodsModelInfo.buyCount': count + 1
    });
  },
  checkGoodsAttribute: function (e) {
    var that = this,
      param = {
        action: 2,
        form_data: {
          attributes: []
        },
        goods_id: this.data.goodsInfo.id,
        model_id: this.data.selectGoodsModelInfo.modelId || '',
        num: this.data.selectGoodsModelInfo.buyCount,
        sub_shop_app_id: this.franchiseeId || '',
        message_notice_type: 1
      };
    if (this.data.goodsInfo.attributes) {
      this.data.selectAttrInfo.attrs.forEach(item => {
        if (Array.isArray(item.elem)) {
          item.elem.forEach(subItem => {
            if (subItem.is_selected) {
              param.form_data.attributes.push({
                id: subItem.id,
                num: 1,
              });
            }
          })
        } else if (typeof item.elem == 'object') {
          for (let i in item.elem) {
            if (item.elem[i].is_selected) {
              param.form_data.attributes.push({
                id: item.elem[i].id,
                num: 1,
              });
            }
          }
        } else if (item.is_selected) {
          param.form_data.attributes.push({
            id: item.id,
            num: 1,
          });
        }
      })
    }
    if(this.data.cartType == 'community'){
      if(this.data.goodsInfo.is_seckill == 1){
        param.is_seckill = 1;
        param.is_single_goods = 1;
      }
      param.leader_token = this.communityLeadetroken;
      param.dis_group_id = -1;
    }
    return param;
  },
  sureAddToShoppingCart: function (e) {
    let _this = this;
    let goodsAttrsIsSame = true;
    if (_this.attributesbefore || _this.data.selectAttrInfo.attrs) {
      goodsAttrsIsSame = _this.compareGoodsAttr(_this.attributesbefore, _this.data.selectAttrInfo.attrs)
    }
    if (_this.modelId == _this.data.selectGoodsModelInfo.modelId && _this.goodsNumbefore == _this.data.selectGoodsModelInfo.buyCount && goodsAttrsIsSame) {
      _this.setData({
        showGoodsModelValue: false,
      })
      return
    } else if (_this.modelId == _this.data.selectGoodsModelInfo.modelId && _this.goodsNumbefore != _this.data.selectGoodsModelInfo.buyCount) {
      _this.changeGoodsNum(e, 'number', _this.data.selectGoodsModelInfo.buyCount);
      return
    }
    _this.setData({
      singelDeleteId: e.currentTarget.dataset.cartid
    })
    _this.sureDeleteGoods(e)
    let param = this.checkGoodsAttribute(e);
    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      method: 'post',
      success: function (res) {
        _this.getShoppingCartData();
        _this.clickSelectAll('firstTime');
      }
    })
  },
  compareGoodsAttr(attributesbefore, selectAttrInfo) {
    let selectArr = [], attributesArr = [];
    if (attributesbefore == null || selectAttrInfo == null) {
      return false
    }
    selectAttrInfo.forEach(selectAttr => {
      selectAttr.elem.forEach(select => {
        selectArr.push(select.id)
      })
    })
    attributesbefore.forEach(attrbefore => {
      attrbefore.elem.forEach(res => {
        attributesArr.push(res.id)
      })
    })
    if (selectArr.length != attributesArr.length) {
      return false
    }
    for (var i = 0; i < selectArr.length; i++) {
      if (attributesArr.indexOf(selectArr[i]) == -1) {
        return false
      }
    }
    return true
  },
  goodsPay: function (e) {
    var franchiseeId = this.franchiseeId,
      cartIdArray = [],
      type = e.currentTarget.dataset.type,
      cartId = e.currentTarget.dataset.cartId,
      addressId = this.data.selectSameJourneyId;
    cartIdArray = cartId;
    var pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?type=' + type + '&cart_arr=' + encodeURIComponent(cartIdArray);
    franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
    addressId && (pagePath += '&addressId=' + addressId);
    this.closeSettlement();
    app.turnToPage(pagePath);
  },
  scanShopping: function () {
    let _this = this;
    wx.scanCode({
      success: function (res) {
        app.sendRequest({
          url: '/index.php?r=AppShop/addCartByGoodsCode',
          data: {
            code: res.result,
            sub_shop_app_id: _this.franchiseeId
          },
          success: function (res) {
            _this.afterSelectedGoods();
          }
        })
      },
      fail: function (res) {
        app.showModal({
          content: '未检索到商品'
        })
      }
    })
  },
  afterSelectedGoods: function () {
    this.setData({
      selectAll: false
    })
    this.getShoppingCartData();
  },
  scanMove: function (event) {
    let y = event.changedTouches[0].clientY;
    let width = wx.getSystemInfoSync().windowWidth;
    let maxHeight = wx.getSystemInfoSync().windowHeight - 208 / 750 * width
    y = y < 0 ? 0 : (y > maxHeight ? maxHeight : y);
    this.setData({
      widowTop: y
    })
  },
  addFavoriteGoods: function (e) {
    let { isFranchisee } = e.currentTarget.dataset;
    let { goodsList } = this.data;
    let _this = this;
    let goodsIds = [];
    let deleteArr = [];
    let params = {
      form_id: e.detail.formId,
    };
    if (!isFranchisee) { // 单店
      goodsList.map((item) => {
        if (item.selected) {
          goodsIds.push(+item.goods_id);
          deleteArr.push(+item.id);
        }
      });
    } else { // 多店
      let { shopsList } = this.data;
      goodsIds = shopsList.map((shop) => {
        return {
          'app_id': shop.app_id,
          'goods_ids': shop['cartList'].filter((goods) => goods.selected).map((goods) => goods.goods_id)
        }
      }).filter((shop) => shop.goods_ids.length > 0);
    }
    if (!goodsIds.length) {
      app.showModal({
        content: '未选中商品'
      });
      return;
    }
    params['goods_ids'] = goodsIds;
    if (_this.franchiseeId) {
      params['sub_shop_app_id'] = _this.franchiseeId;
    }
    if (isFranchisee) {
      params['is_multi'] = 1;
      params['sub_shop_app_id'] = '';
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/addFavoriteGoods',
      method: 'post',
      data: params,
      success: function (res) {
        app.showModal({
          content: '成功加入收藏夹'
        });
        _this.deleteGoods(deleteArr)
      }
    })
  },
  showFastGoods: function () {
    let _this = this;
    this.setData({
      showFastGoods: !_this.data.showFastGoods
    })
  },
  selectGoodsDetail: function (event) {
    let newData = {
      goodsId: event.currentTarget.dataset.goodsId,
      franchisee: this.data.isFranchisee ? event.currentTarget.dataset.appId : this.franchiseeId
    }
    this.selectComponent('#component-goodsShoppingCart').showDialog(newData);
  },
  isShowAddress: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getSwitchBySwitchName',
      hideLoading: true,
      method: 'post',
      data: {
        switch_name: 'intra_city_address_position'
      },
      success: function (res) {
        if (!res.status) {
          that.setData({
            showAddress: res.data == 1 ? true : false
          })
        }
      }
    })
  },
  goToCouponListPage: function (e) {
    let { appId } = e.currentTarget.dataset;
    app.turnToPage('/eCommerce/pages/couponReceiveListPage/couponReceiveListPage?franchisee=' + appId);
  },
  goToSubShopPage: function (e) {
    let { appId } = e.currentTarget.dataset;
    if (appId == app.getAppId()) {
      this.goToHomepage();
    } else {
      customEvent.clickEventHandler['to-franchisee']({ 'franchisee-id': appId });
    }
  },
  toggleMoreUnableData: function () {
    let { showMoreUnableGoods } = this.data;
    this.setData({
      showMoreUnableGoods: !showMoreUnableGoods
    });
  },
  turnToPreviewGoodsOrderPage: function (cartIdArray, needPayAppId) {
    let franchiseeId = this.franchiseeId;
    let { deliveryMethod, selectSameJourneyId, isSeparatePay } = this.data;
    let pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?is_merge_shoppingcart=1&type=' + deliveryMethod + '&cart_arr=' + encodeURIComponent(cartIdArray);
    needPayAppId ? (pagePath += `&franchisee=${needPayAppId}`) : (franchiseeId && (pagePath += `&franchisee=${franchiseeId}`));
    selectSameJourneyId && (pagePath += `&addressId=${selectSameJourneyId}`);
    isSeparatePay && (pagePath += `&is_separate_pay=1`);
    app.turnToPage(pagePath);
  },
  shoppingCartGoLogin: function () {
    let that = this;
    app.goLogin({
      success: function () {
        that.dataInitial();
        that.setData({
          hasLogin: true
        })
      }
    });
  },
  checkedPickRadioFn: function (e, pickUpType, cart_id_arr) {
    let that = this;
    let type = pickUpType || e.currentTarget.dataset.type;
    let originGoodsList = this.data.originGoodsList;
    this.cart_id_arr = cart_id_arr || e.currentTarget.dataset.cartId;
    let goodsList = [];
    let setDataObj = {
      'deliveryMethod': type,
      'pickUpType': type
    };
    originGoodsList.map((item) => {
      if (item.goods_type == 0 && item.dis_group_id == 0) {
        goodsList.push(item);
      }
    })
    if (!goodsList) { return };
    let filterGoodsList = [], toPayGoodsList = [];
    goodsList.map((item) => {
      item.pick_up_type.map(i => {
        if (i == type && item.selected && that.isLimitGoodsCanBuy(item)) {
          toPayGoodsList.push(item);
        }
        if (i == type) {
          filterGoodsList.push(item);
        }
      })
    })
    setDataObj.goodsList = filterGoodsList;
    setDataObj.toPayGoodsList = toPayGoodsList;
    this.setData(setDataObj);
    this.recalculateCountPrice();
  },
  confirmGoodsPick: function () {
    var franchiseeId = this.franchiseeId,
      type = this.data.pickUpType,
      cartIdArray = this.cart_id_arr,
      addressId = this.data.selectSameJourneyId;
    var pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?type=' + type + '&cart_arr=' + encodeURIComponent(cartIdArray);
    franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
    addressId && (pagePath += '&addressId=' + addressId);
    this.closeSettlement();
    app.turnToPage(pagePath);
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
  turnToGoodsDetail: function (e) {
    let index = e.currentTarget.dataset.index;
    let goodsList = this.data.goodsList;
    if (goodsList[index].dis_group_id != 0 && goodsList[index].goods_type == 0){return};
    app.turnToGoodsDetail(e);
  },
  getDefaultPickUpType: function (payIdArr, cartIdArray, goodsIdArray, needPayAppId) {
    let that = this;
    let franchiseeId = this.franchiseeId;
    let { goodsList, cartType, isFranchisee } = this.data;
    that.goodsPickUpType(payIdArr, goodsIdArray);
    app.sendRequest({
      url: '/index.php?r=AppShop/GetNormalDefaultPickUpType',
      method: 'get',
      success: function (res) {
        that.getTostoreNotBusinessTime(payIdArr, function () {
          if (isFranchisee && cartType == 0) {
            let { deliveryMethod } = that.data;
            if (deliveryMethod == 2) { // 同城配送，判断是否达到起送价
              let cartIds = [];
              let { currentLocationData, selectSameJourney, shopsList } = that.data;
              let lat = selectSameJourney ? selectSameJourney.latitude : (currentLocationData ? currentLocationData.location.lat : '');
              let lng = selectSameJourney ? selectSameJourney.longitude : (currentLocationData ? currentLocationData.location.lng : '');
              let regionId = selectSameJourney ? selectSameJourney.address_info.district.id : (currentLocationData ? currentLocationData.region_id : '');
              cartIds = shopsList.map((shop) => {
                return {
                  'app_id': shop.app_id,
                  'cart_id_arr': shop['cartList'].filter((cart) => cart.selected).map((cart) => cart.id),
                }
              }).filter(shop => shop['cart_id_arr'].length > 0);
              if (needPayAppId) {
                cartIds = cartIds.filter(shop => shop.app_id === needPayAppId);
              }
              app.sendRequest({
                url: '/index.php?r=AppEcommerce/getCanUsePickUpTypeAtCart',
                method: 'post',
                data: {
                  latitude: lat,
                  longitude: lng,
                  region_id: regionId,
                  cart_id_arr: cartIds,
                  sub_shop_app_id: that.franchiseeId,
                  is_multi: 1,
                },
                success: function (res) {
                  let returnList = res.data;
                  returnList = returnList.filter((shop) => {
                    return (shop['2'].intra_city_data.is_enough_price == 0 || shop['2'].intra_city_data.in_business_time == 0 || shop['2'].intra_city_data.in_distance == 0)
                  });
                  if (returnList.length) { // 有店铺没有达到起送价或者不在营业时间
                    that.setData({
                      showSettlementMask: true,
                      canUsePickUpType: returnList,
                      showDiscountDetailModal: false,
                    });
                  } else {
                    that.turnToPreviewGoodsOrderPage(cartIdArray, needPayAppId);
                  }
                }
              });
              return;
            } else {
              that.turnToPreviewGoodsOrderPage(cartIdArray, needPayAppId);
              return;
            }
          }
          if (cartType == 0) {
            let tabExpress = that.data.tabExpress;
            let tabDelivery = that.data.tabDelivery;
            let tabIntraCity = that.data.tabIntraCity;
            let tabDining = that.data.tabDining;
            let addressId = that.data.selectSameJourneyId;
            let intraCityData = that.data.intraCityData;
            let isGoodsPickUpType = that.data.isGoodsPickUpType;
            if (res.data) {
              that.data.pickUpType = that.data.deliveryMethod == -1 ? res.data : that.data.deliveryMethod;
              if (that.data.deliveryMethod == -1) {
                that.setData({
                  deliveryMethod: res.data
                })
              }
              let { currentLocationData, selectSameJourney } = that.data;
              let lat = selectSameJourney ? selectSameJourney.latitude : (currentLocationData ? currentLocationData.location.lat : '');
              let lng = selectSameJourney ? selectSameJourney.longitude : (currentLocationData ? currentLocationData.location.lng : '');
              let regionId = selectSameJourney ? selectSameJourney.address_info.district.id : (currentLocationData ? currentLocationData.region_id : '');
              app.sendRequest({
                url: '/index.php?r=AppEcommerce/getCanUsePickUpTypeAtCart',
                method: 'post',
                data: {
                  latitude: lat,
                  longitude: lng,
                  region_id: regionId,
                  cart_id_arr: cartIdArray,
                },
                success: function (res) {
                  let data = res.data;
                  var arr = Object.keys(data);
                  if (arr.length == 1 || isGoodsPickUpType == 1 || (isGoodsPickUpType == 0 && arr.length == 1) || arr.indexOf('2') > -1) {
                    that.showSettlement();
                    return;
                  } else if (isGoodsPickUpType == 0 && arr.length > 1) {    // 配送方式不一致大于1种
                    let type = checkHasType(that.data.pickUpType);
                    function checkHasType(pickUpType) {
                      if (!data[pickUpType]) {
                        for (var key in data) {
                          if (key == 2 && data[3]) {
                            return 3
                          }
                          return key
                        }
                      }
                      return pickUpType
                    }
                    let pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cartIdArray);
                    franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
                    addressId && (pagePath += '&addressId=' + addressId);
                    type && (pagePath += '&type=' + type);
                    app.turnToPage(pagePath);
                    return;
                  }
                }
              });
            } else if (cartIdArray.length == 1 || isGoodsPickUpType == 0) { // 商品唯一 或 所选中商品的配送方式一致
              let { currentLocationData, selectSameJourney } = that.data;
              let lat = selectSameJourney ? selectSameJourney.latitude : (currentLocationData ? currentLocationData.location.lat : '');
              let lng = selectSameJourney ? selectSameJourney.longitude : (currentLocationData ? currentLocationData.location.lng : '');
              let regionId = selectSameJourney ? selectSameJourney.address_info.district.id : (currentLocationData ? currentLocationData.region_id : '');
              app.sendRequest({
                url: '/index.php?r=AppEcommerce/getCanUsePickUpTypeAtCart',
                method: 'post',
                data: {
                  latitude: lat,
                  longitude: lng,
                  region_id: regionId,
                  cart_id_arr: cartIdArray,
                },
                success: function (res) {
                  let data = res.data;
                  var arr = Object.keys(data);
                  if (arr.length == 1) {
                    that.showSettlement();
                    return;
                  } else {
                    let type = checkHasType(that.data.pickUpType);
                    function checkHasType(pickUpType) {
                      if (!data[pickUpType]) {
                        for (var key in data) {
                          if (key == 2 && data[3]) {
                            return 3
                          }
                          return key
                        }
                      }
                      return pickUpType
                    }
                    let pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cartIdArray);
                    franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
                    addressId && (pagePath += '&addressId=' + addressId);
                    type && (pagePath += '&type=' + type);
                    app.turnToPage(pagePath);
                    return;
                  }
                }
              });
            } else {
              that.showSettlement();
              return;
            }
          } else if (cartType == 1) {
            var pagePath = '/eCommerce/pages/previewAppointmentOrder/previewAppointmentOrder?cart_arr=' + encodeURIComponent(cartIdArray);
            franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
            app.turnToPage(pagePath);
          } else if (cartType == 3) {
            var pagePath = '/orderMeal/pages/previewOrderDetail/previewOrderDetail?cart_arr=' + encodeURIComponent(cartIdArray);
            franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
            isFranchisee && (pagePath += '&isFranchisee=1');
            app.turnToPage(pagePath);
          } else if (cartType == 2) {
            if (+that.data.takeoutInfo.min_deliver_price > +that.data.priceToPay) {
              app.showModal({
                content: '没有达到起送价(' + that.data.takeoutInfo.min_deliver_price + '元)'
              });
              return;
            }
            var pagePath = '/orderMeal/pages/previewTakeoutOrder/previewTakeoutOrder?cart_arr=' + encodeURIComponent(cartIdArray);
            franchiseeId && (pagePath += '&franchisee=' + franchiseeId);
            isFranchisee && (pagePath += '&isFranchisee=1');
            app.turnToPage(pagePath);
          }else if(cartType == 'community'){
            that.communityPreviewPay();
            app.globalData.groupRefreshList = true;
          }
        });
      },
    })
  },
  goodsPickUpType: function (payIdArr, cartIdArray) {
    if (cartIdArray.length > 0 && !this.data.isFranchisee) {
      let _this = this;
      app.sendRequest({
        url: '/index.php?r=AppShop/CompareGoodsPickUpType',
        method: 'post',
        data: {
          goods_id_arr: cartIdArray,
          sub_shop_app_id: _this.franchiseeId,
        },
        chain: true,
        success: function (res) {
          _this.setData({
            isGoodsPickUpType: res.data
          })
        }
      });
    }
  },
  goSeckillDetail: function (e) {
    if(this.data.cartType == 'community'){return}
    let data = e.currentTarget.dataset;
    let appId = e.currentTarget.dataset.appId;
    let index = data.index;
    let franchisee = app.getPageFranchiseeId();
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    if (appId && appId !== app.getAppId() && chainParam === '') { // 子店秒杀商品
      chainParam = '&franchisee=' + appId;
    }
    if (data.seckill_start_state != 2) {
      let formData = this.data.goodsList[index].form_data;
      let path = '/seckill/pages/seckillDetail/seckillDetail?id=' + data.id + '&sec_act_id=' + (formData ? formData.seckill_activity_id : '') + '&sec_t_id=' +  (formData ? formData.seckill_activity_time_id : '') + '&secType=' + (formData && formData.seckill_activity_id ? 1 : '') + chainParam;
      app.turnToPage(path);
    } else {
      app.showModal({ content: '该商品秒杀活动已结束' });
    }
  },
  getGroupGoodsLeader(userToken) {
    let _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistributionExt/CheckIsDistributorGroupLeaderInfo',
      data: {
        leader_token: userToken
      },
      success: function (res) {
        let newdata = {};
        newdata['leaderInfo'] = res.data.learder_info;
        _this.setData(newdata);
      },
    })
  },
  communityPreviewPay: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/CheckIsDistributorGroupLeader',
      method: 'post',
      hideLoading: true,
      data: {
        leader_token: _this.communityLeadetroken,
      },
      success: function (res) {
        if (res.data == 1) {
          _this.communitySettlement();
        } else {
          app.showModal({
            content: '团长审核中或被停用，请切换团长购买',
            confirmText: '去切换',
            confirm: function (res) {
              app.turnToPage('/promotion/pages/communityGroupSearchVillage/communityGroupSearchVillage');
            }
          })
        }
      }
    })
  },
  communitySettlement: function () {
    let _this = this;
    let cart_arr = [];
    let cartList = [];
    _this.data.goodsList.map((item) => {
      if (item.selected) {
        cartList.push(item);
      }
    })
    if (!cartList.length) {
      app.showModal({
        content: '购物车暂无商品，请添加商品后再结算~'
      })
      return;
    }
    wx.showToast({
      title: '提交中...',
      icon: 'loading',
      mask: true
    });
    cartList.map((item) => {
      cart_arr.push({
        num: item.num,
        id: item.id
      })
    })
    let urlOptions = {
      cart_arr: cart_arr
    }
    let pagePath = `/promotion/pages/communityGroupOrderSubmit/communityGroupOrderSubmit`;
    app.turnToPage(pagePath, '', urlOptions);
    app.globalData.communityGroupRefresh = true;
  },
  isLimitGoodsCanBuy: function (goods) {
    if (goods.limit_num === 0) {
      return true;
    } else {
      if ((goods.limit_num - goods.bought_num) >= goods.num) {
        return true;
      } else {
        return false;
      }
    }
  },
  toAddOnItem: function(event) {
    let id = event.currentTarget.dataset.id; //  当前满减商品 活动id
    app.turnToPage('/default/pages/classifyGoodsListPage/classifyGoodsListPage?priceBreakDiscountId=' + id);
  },
  toCheckDiscountInfo: function(event) {
    let id = event.currentTarget.dataset.id;
    let priceBreakDiscountData = app.globalData.priceBreakDiscountData;
    let priceBreakDisModal = {
      time: '',
      rule: [],
      show: true,
    }
    for (let item of priceBreakDiscountData) {
      if (item.id == id) {
        if (item.ladder.length) {
          priceBreakDisModal.rule = item.ladder.map(subItem => {
            return `满${subItem.least_amount}元` + (subItem.reduce_amount ? `减${subItem.reduce_amount}元` : `打${subItem.reduce_discount}折`);
          })
        }else {
          priceBreakDisModal.rule = [`每满${item.cycle.least_amount}元减${item.cycle.reduce_amount}元`];
        }
        priceBreakDisModal.time = item.start_time == '0' ? '长期' : item.start_time + '至'  + item.end_time;
      }
    }
    this.setData({
      priceBreakDisModal: priceBreakDisModal,
    })
  },
  closePriceBreakModal: function() {
    this.setData({
      'priceBreakDisModal.show': false
    })
  },
  closeDiscountDetailModal: function() {
    this.setData({
      showDiscountDetailModal: !this.data.showDiscountDetailModal
    })
  },
  getGoodsDiscountInfoInCart: function() {
    let goodsList = this.data.goodsList;
    let priceBreakDiscountData = app.globalData.priceBreakDiscountData; 
    let newData = {};
    let actIdArr = [0];
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
      actIdArr.push(item.id);
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
          if (goods.selected) {
            newCartList[
              goods.price_break_discounts_activity_id
            ]['totalPrice'] += (goods.price * goods.num);
          }
          newCartList[
            goods.price_break_discounts_activity_id
          ]['goodsList'].push(goods);
        }else {
          if (goods.selected) {
            newCartList[0]['totalPrice'] += (goods.price * goods.num);
          }
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
      totalPrice += newCartList[key].totalPrice;
      totalCutPrice += newCartList[key].cutPrice;
    }
    newData['TotalPrice'] = (totalPrice - totalCutPrice).toFixed(2);
    newData['totalCutPrice'] = totalCutPrice.toFixed(2);
    newData['actIdArr'] = actIdArr;
    newData['newCartList'] = newCartList;
    this.setData(newData)
  }
})
