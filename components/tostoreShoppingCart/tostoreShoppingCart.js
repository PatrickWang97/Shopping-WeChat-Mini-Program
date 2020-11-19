let app = getApp();
Component({
  properties: {},
  data: {
    addTostoreShoppingCartShow: false,
    goodsInfo: {},
    selectGoodsModelInfo: {
      buyCount: 0
    },
    cartGoodsNum: 0,
    cartGoodsTotalPrice: 0,
    tostoreTypeFlag: false,
    businesssTimeString: ''
  },
  goodsId: '',
  franchiseeId: '',
  methods: {
    showDialog: function(data){
      this.goodsId = data.goodsId;
      this.franchiseeId = data.franchisee || ''
      this.getGoodsDetail();
    },
    getGoodsDetail: function() {
      let _this = this;
      let pageInstance = app.getAppCurrentPage();
      app.sendRequest({
        url: '/index.php?r=AppShop/getGoods',
        data: {
          data_id: _this.goodsId,
          sub_shop_app_id: _this.franchiseeId
        },
        method: 'post',
        success: function (res) {
          let goods = res.data[0].form_data;
          let defaultSelect = goods.model_items[0];
          let goodsModel = [];
          let selectModels = [];
          let goodprice = 0;
          let goodstock = 0;
          let goodid;
          let selectText = '';
          let goodimgurl = '';
          if (goods.model_items.length) {
            goodprice = defaultSelect.price;
            goodstock = defaultSelect.stock;
            goodid = defaultSelect.id;
            goodimgurl = defaultSelect.img_url;
          } else {
            goodprice = goods.price;
            goodstock = goods.stock;
            goodimgurl = goods.cover;
          }
          for (let key in goods.model) {
            if (key) {
              let model = goods.model[key];
              goodsModel.push(model);
              selectModels.push(model.subModelId[0]);
              selectText += '“' + model.subModelName[0] + '” ';
            }
          }
          goods.model = goodsModel;
          let businesssTimeString = '';
          if (goods.business_time && goods.business_time.business_time) {
            let goodBusinesssTime = goods.business_time.business_time;
            for (let i = 0; i < goodBusinesssTime.length; i++) {
              businesssTimeString += goodBusinesssTime[i].start_time.substring(0, 2) + ':' + goodBusinesssTime[i].start_time.substring(2, 4) + '-' + goodBusinesssTime[i].end_time.substring(0, 2) + ':' + goodBusinesssTime[i].end_time.substring(2, 4) + '/';
            }
            businesssTimeString = '出售时间：' + businesssTimeString.substring(0, businesssTimeString.length - 1);
          }
          _this.getTostoreCartList();
          _this.setData({
            isShowBottom: pageInstance.data.isShowBottom,
            businesssTimeString: businesssTimeString,
            goodsInfo: goods,
            'addTostoreShoppingCartShow': true,
            'selectGoodsModelInfo.price': goodprice,
            'selectGoodsModelInfo.stock': goodstock,
            'selectGoodsModelInfo.buyTostoreCount': 0,
            'selectGoodsModelInfo.cart_id': '',
            'selectGoodsModelInfo.models': selectModels,
            'selectGoodsModelInfo.modelId': goodid || '',
            'selectGoodsModelInfo.models_text': selectText,
            'selectGoodsModelInfo.imgurl': goodimgurl
          });
        }
      });
    },
    hideAddShoppingcart: function () {
      this.setData({
        addTostoreShoppingCartShow: false
      });
    },
    selectGoodsSubModel: function (event) {
      let dataset = event.target.dataset;
      let modelIndex = dataset.modelIndex;
      let submodelIndex = dataset.submodelIndex;
      let data = {};
      let selectModels = this.data.selectGoodsModelInfo.models;
      let model = this.data.goodsInfo.model;
      let text = '';
      selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];
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
      this.resetSelectCountPrice();
    },
    resetSelectCountPrice: function () {
      let selectModelIds = this.data.selectGoodsModelInfo.models.join(',');
      let modelItems = this.data.goodsInfo.model_items;
      let data = {};
      let cover = this.data.goodsInfo.cover;
      data['selectGoodsModelInfo.buyCount'] = 1;
      data['selectGoodsModelInfo.buyTostoreCount'] = 0;
      for (let i = modelItems.length - 1; i >= 0; i--) {
        if (modelItems[i].model == selectModelIds) {
          data['selectGoodsModelInfo.stock'] = modelItems[i].stock;
          data['selectGoodsModelInfo.price'] = modelItems[i].price;
          data['selectGoodsModelInfo.modelId'] = modelItems[i].id || '';
          data['selectGoodsModelInfo.imgurl'] = modelItems[i].img_url || cover;
          data['selectGoodsModelInfo.virtual_price'] = modelItems[i].virtual_price
          break;
        }
      }
      this.setData(data);
    },
    clickTostoreMinusButton: function () {
      let _this = this;
      let count = _this.data.selectGoodsModelInfo.buyTostoreCount;
      if (count <= 0) {
        return;
      }
      if (count <= 1) {
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=AppShop/deleteCart',
          method: 'post',
          data: {
            cart_id_arr: [_this.data.selectGoodsModelInfo.cart_id],
            sub_shop_app_id: _this.franchiseeId || app.getChainId() || ''
          }
        });
        _this.setData({
          'selectGoodsModelInfo.buyTostoreCount': count - 1
        });
        _this.getTostoreCartList();
        return;
      }
      _this.setData({
        'selectGoodsModelInfo.buyTostoreCount': count
      });
      _this.sureAddTostoreShoppingCart('mins');
    },
    clickTostorePlusButton: function () {
      let selectGoodsModelInfo = this.data.selectGoodsModelInfo;
      let count = selectGoodsModelInfo.buyTostoreCount;
      let stock = selectGoodsModelInfo.stock;
      if (count >= stock) {
        app.showModal({
          content: '库存不足'
        });
        return;
      }
      this.setData({
        'selectGoodsModelInfo.buyTostoreCount': count
      });
      this.sureAddTostoreShoppingCart('plus');
    },
    sureAddTostoreShoppingCart: function (type) {
      let that = this;
      let goodsNum = that.data.selectGoodsModelInfo.buyTostoreCount;
      if (type == 'plus') {
        goodsNum = goodsNum + 1;
      } else {
        goodsNum = goodsNum - 1;
      }
      let franchiseeId = that.franchiseeId || app.getChainId();
      let param = {
        goods_id: that.data.goodsInfo.id,
        model_id: that.data.selectGoodsModelInfo.modelId || '',
        num: goodsNum,
        sub_shop_app_id: franchiseeId || ''
      };
      app.sendRequest({
        url: '/index.php?r=AppShop/addCart',
        data: param,
        success: function (res) {
          let data = res.data;
          that.setData({
            'selectGoodsModelInfo.cart_id': data,
            'selectGoodsModelInfo.buyTostoreCount': goodsNum
          });
          that.getTostoreCartList();
        },
        successStatusAbnormal: function (res) {
          that.setData({
            'selectGoodsModelInfo.buyTostoreCount': 0
          });
        }
      })
    },
    readyToTostorePay: function () {
      let franchiseeId = this.franchiseeId || app.getChainId();
      let pagePath = '/orderMeal/pages/previewOrderDetail/previewOrderDetail' + (franchiseeId ? '?franchisee=' + franchiseeId : '');
      if (this.data.cartGoodsNum <= 0 || !this.data.tostoreTypeFlag) {
        return;
      }
      this.hideAddShoppingcart();
      app.turnToPage(pagePath);
    },
    getValidateTostore: function () {
      let that = this;
      let franchiseeId = that.franchiseeId || app.getChainId();
      app.sendRequest({
        url: '/index.php?r=AppShop/precheckShoppingCart',
        data: {
          sub_shop_app_id: franchiseeId || '',
          parent_shop_app_id: franchiseeId ? app.getAppId() : ''
        },
        success: function (res) {
          that.readyToTostorePay();
        },
        successShowModalConfirm: function (res) {
          res.status === 1 && that.goToShoppingCart();
        }
      })
    },
    goToShoppingCart: function () {
      let franchiseeId = this.franchiseeId || app.getChainId();
      let pagePath = '/eCommerce/pages/shoppingCart/shoppingCart' + (franchiseeId ? '?franchisee=' + franchiseeId : '');
      this.hideAddShoppingcart();
      app.turnToPage(pagePath);
    },
    getTostoreCartList: function () {
      let that = this;
      let franchiseeId = this.franchiseeId || app.getChainId();
      app.sendRequest({
        url: '/index.php?r=AppShop/cartList',
        data: {
          page: 1,
          page_size: 100,
          sub_shop_app_id: franchiseeId || '',
          parent_shop_app_id: franchiseeId ? app.getAppId() : ''
        },
        success: function (res) {
          let price = 0,
            num = 0,
            addToShoppingCartCount = 0,
            tostoreTypeFlag = false;
          for (let i = res.data.length - 1; i >= 0; i--) {
            let data = res.data[i];
            if (data.goods_type == 3) {
              tostoreTypeFlag = true;
              price += +data.num * +data.price;
              num += +data.num;
            }
            if (that.goodsId == data.goods_id) {
              addToShoppingCartCount = data.num;
              that.cart_id = data.id;
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
    stopPropagation : function(){
    }
  }
})
