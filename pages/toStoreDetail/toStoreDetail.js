var app = getApp()
var util = require('../../utils/util.js')
var WxParse = require('../../components/wxParse/wxParse.js');
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '商品详情',
    },
    goodsInfo: {},
    addToShoppingCartCount: 0,
    selectModelInfo: {
      models: [],
      stock: '',
      price: '',
      buyCount: 0
    },
    pageQRCodeData:{
      shareDialogShow: "100%",
      shareMenuShow: false,
    },
    defaultPhoto: '',
    addToShoppingCartHidden: true,
    ifAddToShoppingCart: true,
    priceDiscountStr: '',
    cartGoodsNum: 0,
    cartGoodsTotalPrice: 0,
    pageNavigating: false,
  },
  numChangeTimeout: '',
  goodsId: '',
  models: '', // 初始的多规格的个数
  cartData: '', // 购物车的数据
  cart_id: '',
  fromBack: false,
  franchiseeId: '',
  touchStartPos: {},
  onLoad: function(options){
    var contact = options.contact || '',
        defaultPhoto = app.getDefaultPhoto(),
        userToken = options.user_token;
    this.setData({
      contact: contact,
      defaultPhoto: defaultPhoto,
    })
    if (userToken) {
      app._getPromotionUserToken({
        user_token: userToken
      });
    }
    this.goodsId = options.detail || '';
    this.franchiseeId = options.franchisee || '';
    this.dataInitial();
  },
  dataInitial: function() {
    this.getGoodsDetail();
  },
  getGoodsDetail: function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: this.goodsId,
        sub_shop_app_id: this.franchiseeId
      },
      success: function(res){
        that.modifyGoodsDetail(res);
        that.getCartList();
      }
    })
  },
  getCartList: function(){
    var that = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 100,
        sub_shop_app_id: this.franchiseeId,
        parent_shop_app_id: this.franchiseeId?app.globalData.appId:''
      },
      success: function(res){
        var price = 0,
            num = 0,
            addToShoppingCartCount = 0,
            tostoreTypeFlag = false;
        that.cartData = res.data
        for (var i = res.data.length - 1; i >= 0; i--) {
          var data = res.data[i];
          if (data.goods_type == 3) {
            tostoreTypeFlag = true;
            price += +data.num * +data.price;
            num   += +data.num;
          }
          if(that.goodsId == data.goods_id){
            if (data.model){
              if (data.model == that.models) {
                addToShoppingCartCount = data.num;
                that.cart_id = data.id;
              }
            } else {
              addToShoppingCartCount = data.num;
              that.cart_id = data.id;
            }
          }
        }
        that.setData({
          tostoreTypeFlag: tostoreTypeFlag,
          cartGoodsNum: num,
          cartGoodsTotalPrice: price.toFixed(2),
          addToShoppingCartCount: addToShoppingCartCount
        });
      }
    })
  },
  onShow: function(){
    if(this.fromBack){
      this.getCartList();
      this.resetSelectCountPrice();
    }
    else
      this.fromBack = true;
  },
  onShareAppMessage: function(){
    let that = this,
        goodsId = this.goodsId,
        contact = this.data.contact,
        franchiseeId = this.franchiseeId,
        urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
        url = '/pages/toStoreDetail/toStoreDetail?detail=' + goodsId + (franchiseeId ? '&franchisee=' + franchiseeId : '') + urlPromotion + (app.globalData.pageShareKey ? ('&psid=' + app.globalData.pageShareKey) : '');
    return app.shareAppMessage({ 
      path: url,
      success: function (addTime) {
        app.showToast({ title: '转发成功', duration: 500 });
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=appShop/getIntegralLog',
          data: { add_time: addTime },
          success: function (res) {
            if (res.status == 0) {
              res.data && that.setData({
                'rewardPointObj': {
                  showModal: true,
                  count: res.data,
                  callback: ''
                }
              });
            }
          }
        })
      }
    });
  },
  goToShoppingCart: function(){
    var franchiseeId = this.franchiseeId,
        pagePath = '/eCommerce/pages/shoppingCart/shoppingCart'+(franchiseeId ? '?franchisee='+franchiseeId : '');
    app.turnToPage(pagePath);
  },
  modifyGoodsDetail: function(res){
    var pages = getCurrentPages(),
        _this = pages[pages.length - 1],
        goods = res.data[0].form_data,
        description = goods.description,
        goodsModel = [],
        selectModels = [],
        price = 0,
        discountStr = '',
        data = {},
        that = this,
        selectStock, selectPrice, selectModelId, matchResult,
        i, j;
    WxParse.wxParse('wxParseDescription', 'html', description, _this, 34);
    if (goods.business_time && goods.business_time.business_time){
      var goodBusinesssTime = goods.business_time.business_time,
        businesssTimeString = '';
      for (var i = 0; i < goodBusinesssTime.length;i++){
        businesssTimeString += goodBusinesssTime[i].start_time.substring(0, 2) + ':' + goodBusinesssTime[i].start_time.substring(2, 4) + '-' + goodBusinesssTime[i].end_time.substring(0, 2) + ':' + goodBusinesssTime[i].end_time.substring(2, 4) + '/';
      }
      businesssTimeString = '出售时间：'+businesssTimeString.substring(0, businesssTimeString.length - 1);
      that.setData({
        businesssTimeString: businesssTimeString
      })
    }
    if(goods.model_items.length){
      this.models = goods.model_items[0].model
      var items = goods.model_items;
      selectPrice = items[0].price;
      selectStock = items[0].stock;
      selectModelId = items[0].id;
    } else {
      selectPrice = goods.price;
      selectStock = goods.stock;
    }
    for(var key in goods.model){
      if(key){
        var model = goods.model[key];
        goodsModel.push(model);
        selectModels.push(model.subModelId[0]);
      }
    }
    goods.model = goodsModel;
    if (Number(goods.max_can_use_integral) != 0 ) {
      discountStr = '（积分可抵扣' + (Number(goods.max_can_use_integral) / 100) + '元）';
    }
    data = {
      goodsInfo: goods,
      'selectModelInfo.models': selectModels,
      'selectModelInfo.stock': selectStock,
      'selectModelInfo.price': selectPrice,
      'selectModelInfo.modelId': selectModelId || '',
      priceDiscountStr: discountStr,
      goodsRate: (goods.goods_rate.level_1 * 100).toFixed(0),
    };
    goods.model.length ? (data.showSelectModel = true) : (data.showChangeCount = true);
    _this.setData(data);
  },
  hiddeAddToShoppingCart: function(){
    this.setData({
      addToShoppingCartHidden: true
    })
  },
  selectSubModel: function(e){
    var dataset = e.target.dataset,
        modelIndex = dataset.modelIndex,
        submodelIndex = dataset.submodelIndex,
        addToShoppingCartCount = 0,
        data = {};
        let firstModels = this.models.split(',')
        firstModels[modelIndex] = dataset.submodelId
        this.models = firstModels.join(',')
        for (var i = this.cartData.length - 1; i >= 0; i--) {
          let data = this.cartData[i];
          if(this.goodsId == data.goods_id){
            if (data.model){
              if (data.model == this.models) {
                addToShoppingCartCount = data.num;
                this.cart_id = data.id;
              }
            } else {
              addToShoppingCartCount = data.num;
              this.cart_id = data.id;
            }
          }
        }
        this.setData({
          addToShoppingCartCount: addToShoppingCartCount
        });
    data['selectModelInfo.models['+modelIndex+']'] = this.data.goodsInfo.model[modelIndex].subModelId[submodelIndex];
    this.setData(data);
    this.resetSelectCountPrice();
  },
  resetSelectCountPrice: function(){
    var selectModelIds = this.data.selectModelInfo.models.join(','),
        modelItems = this.data.goodsInfo.model_items,
        data = {};
    for (var i = modelItems.length - 1; i >= 0; i--) {
      if(modelItems[i].model == selectModelIds){
        data['selectModelInfo.stock'] = modelItems[i].stock;
        data['selectModelInfo.price'] = modelItems[i].price;
        data['selectModelInfo.modelId'] = modelItems[i].id;
        break;
      }
    }
    this.setData(data);
  },
  clickMinusButton: function(e){
    if(+this.data.addToShoppingCartCount <= 0) return;
    this.changeCartGoodsNum('minus');
  },
  clickPlusButton: function(e){
    this.changeCartGoodsNum('plus');
  },
  changeCartGoodsNum: function(type){
    if (this.numChangeTimeout){
      clearTimeout(this.numChangeTimeout);
    }
    var goods = this.data.goodsInfo,
        currentGoodsNum = +this.data.addToShoppingCartCount,
        targetGoodsNum = type == 'plus' ? currentGoodsNum + 1 : currentGoodsNum - 1,
        currentCartNum = +this.data.cartGoodsNum,
        targetCartNum = type == 'plus' ? currentCartNum + 1 : currentCartNum - 1,
        currentTotalPrice = +this.data.cartGoodsTotalPrice,
        targetTotalPrice = type == 'plus' ? currentTotalPrice + +goods.price : currentTotalPrice - +goods.price,
        that = this,
        param;
    if (targetGoodsNum > +goods.stock){
      app.showModal({
        content: '库存不足'
      });
      return;
    }
    if(targetGoodsNum == 0 && type == 'minus'){
      app.sendRequest({
        hideLoading: true,
        url : '/index.php?r=AppShop/deleteCart',
        method: 'post',
        data: {
          cart_id_arr: [that.cart_id],
          sub_shop_app_id: that.franchiseeId
        },
        success:function(res){
          that.getCartList();
        },
        fail: function(res){
          that.setData({
            addToShoppingCartCount: currentGoodsNum,
            cartGoodsNum: currentCartNum,
            cartGoodsTotalPrice: currentTotalPrice
          });
        }
      });
      return;
    }
    param = {
      goods_id: goods.id,
      model_id: goods.modelId || '',
      num: targetGoodsNum,
      sub_shop_app_id: that.franchiseeId
    };
    this.numChangeTimeout = setTimeout(()=>{
      app.sendRequest({
        url: '/index.php?r=AppShop/addCart',
        data: param,
        success: function (res) {
          that.cart_id = res.data;
          that.getCartList();
        },
        successStatusAbnormal: function(res){
          that.setData({
            'addToShoppingCartCount': 0
          });
        }
      })
    },300)
  },
  clickModelMinusButton: function(){
    var count = +this.data.addToShoppingCartCount,
        that = this;
    if (count <= 0){
      return;
    }
    if(count <= 1){
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppShop/deleteCart',
        method: 'post',
        data: {
          cart_id_arr: [that.cart_id],
          sub_shop_app_id: that.franchiseeId
        },
        success: function () {
          that.setData({
            'addToShoppingCartCount': count - 1
          })
          that.getCartList();
        },
        fail: function (res) {
          that.setData({
            addToShoppingCartCount: currentGoodsNum,
            cartGoodsNum: currentCartNum,
            cartGoodsTotalPrice: currentTotalPrice
          });
        }
      });
      return;
    }
    this.sureAddToShoppingCart();
  },
  clickModelPlusButton: function(){
    var selectModelInfo = this.data.selectModelInfo,
        count = +this.data.addToShoppingCartCount;
    if (count + 1 > +selectModelInfo.stock){
      app.showModal({
        content: '库存不足'
      });
      return;
    }
    this.sureAddToShoppingCart('plus');
  },
  sureAddToShoppingCart: function(type){
    var that = this,
        addcount = +this.data.addToShoppingCartCount;
        if(type == 'plus'){
          addcount = addcount + 1;
        }else{
          addcount = addcount - 1;
        }
    var param = {
          goods_id: this.goodsId,
          model_id: this.data.selectModelInfo.modelId || '',
          num: addcount,
          sub_shop_app_id: this.franchiseeId || ''
        };
    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      success: function (res) {
        that.cart_id = res.data.data;
        that.setData({
          'addToShoppingCartCount': addcount
        });
        that.getCartList();
      },
      successStatusAbnormal: function(res){
        that.setData({
          'addToShoppingCartCount': 0
        });
      }
    })
  },
  readyToPay: function(){
    if (this.data.cartGoodsNum <= 0 || !this.data.tostoreTypeFlag) return;
    var franchiseeId = this.franchiseeId,
      pagePath = '/orderMeal/pages/previewOrderDetail/previewOrderDetail'+(franchiseeId ? '?franchisee='+franchiseeId : '');
    app.turnToPage(pagePath);
  },
  goTostoreComment:function(){
    var franchiseeId = this.franchiseeId,
      pagePath = '/orderMeal/pages/tostoreComment/tostoreComment?detail=' + this.goodsId + (franchiseeId ? '&franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  showQRCodeComponent:function(){
    let that = this;
    let goodsInfo = this.data.goodsInfo;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    })
    app.sendRequest({
      url: '/index.php?r=AppDistribution/DistributionShareQRCode',
      data: {
        obj_id: that.goodsId,
        type: 3,
        text: goodsInfo.title,
        price: (that.data.showChangeCount ? goodsInfo.price : that.data.selectModelInfo.price),
        goods_img: goodsInfo.img_urls ? goodsInfo.img_urls[0] : goodsInfo.cover,
        sub_shop_id: that.franchiseeId,
        p_id: app.globalData.p_id || ''
      },
      success: function (res) {
        animation.bottom("0").step();
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.animation": animation.export()
        })
      }
    })
  },
  getValidateTostore: function () {
    var that = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/precheckShoppingCart',
      data: {
        sub_shop_app_id: that.franchiseeId || '',
        parent_shop_app_id: that.franchiseeId ? app.getAppId() : ''
      },
      success: function (res) {
        that.readyToPay();
      },
      successStatusAbnormal: function(res){
        app.showModal({
          content: res.data,
          confirm: function () {
            res.status == 1 && that.goToShoppingCart();
          }
        })
      }
    })
  },
  pageTouchStart: function(e){
    var touches = e.touches;
    if(touches.length > 1)
      return;
    this.touchStartPos = {
      clientX: touches[0].clientX,
      clientY: touches[0].clientY
    };
  },
  pageTouchMove: function(e){
  },
  stopPropagation: function(){}
})
