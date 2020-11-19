let app = getApp();
Component({
  properties: {},
  data: {
    isVisibled: false,
    showBuyNow: false,
    showVirtualPrice: false,
    goodsInfo: {},
    selectGoodsModelInfo: {},
    isShowBottom: false,
    selectAttrInfo: {
      attrs: []
    },
    detailtype:'',
    showStock:''
  },
  goodsId: '',
  franchiseeId: '',
  dis_group_id: '',
  leader_token: '',
  ready: function () {
  },
  methods: {
    showDialog: function(data){
      this.goodsId = data.goodsId;
      this.dis_group_id = data.dis_group_id;
      this.leader_token = data.leader_token;
      this.franchiseeId = data.franchisee || ''
      this.setData({
        isShowBottom: app.getAppCurrentPage().data.isShowBottom || "",
        showBuyNow: data.showBuynow || '',
        showVirtualPrice: data.showVirtualPrice || '',
        franchisee: this.franchiseeId,
      })
      this.getGoodsDetail();
      this.getAppECStoreConfig();
    },
    getGoodsDetail: function () {
      let _this = this;
      app.sendRequest({
        url: '/index.php?r=AppShop/getGoods',
        data: {
          data_id: _this.goodsId,
          sub_shop_app_id: this.franchiseeId
        },
        method: 'post',
        success: function (res) {
          if (res.status == 0) {
            let goods = res.data[0].form_data;
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
            let allStock = 0;
            let selectStock, selectPrice, selectModelId, matchResult, selectVirtualPrice, modifySelectModels = '';
            let selectImgurl = '';
            for (let key in goods.model) {
              if (key) {
                let model = goods.model[key];
                goodsModel.push(model);
              }
            }
            if (goods.model && goods.model_items.length) {
              let items = Object.values(goods.model_items_object); // 转成数组
              let defaultGoods = items.find(item => item.stock > 0);
              selectPrice = defaultGoods.price;
              selectStock = defaultGoods.stock;
              selectModelId = defaultGoods.id;
              selectImgurl = defaultGoods.img_url;
              selectVirtualPrice = defaultGoods.virtual_price != '0.00' && defaultGoods.virtual_price ? defaultGoods.virtual_price : '';
              selectModels = defaultGoods.model.split(',');
              selectText = defaultGoods.model_name.split('|').map(item=> `“${item}” `).join('');
              min_sales_nums = defaultGoods.min_sales_nums;
            } else {
              goodprice = goods.price;
              vipprice = goods.vip_goods_price || goods.price;
              goodstock = goods.stock;
              goodimgurl = goods.cover;
              virtual_price = goods.virtual_price;
              min_sales_nums = +goods.min_sales_nums;
              selectStock = goods.stock;
            }
            goods.model = goodsModel;
            console.log(goods)
            _this.setData({
              isVisibled: true,
              goodsInfo: goods,
              allStock: allStock || '',
              'selectGoodsModelInfo.models': selectModels || '',
              'selectGoodsModelInfo.stock': selectStock || '',
              'selectGoodsModelInfo.price': selectPrice || '',
              'selectGoodsModelInfo.modelId': selectModelId || '',
              'selectGoodsModelInfo.models_text': selectText || '',
              'selectGoodsModelInfo.imgurl': selectImgurl || '',
              'selectGoodsModelInfo.virtualPrice': selectVirtualPrice || '',
              'selectGoodsModelInfo.vipprice': vipprice || '',
              'selectGoodsModelInfo.buyCount': min_sales_nums < 1 ? 1 : min_sales_nums,
              'selectGoodsModelInfo.min_sales_nums': min_sales_nums < 1 ? 1 : min_sales_nums,
              'selectAttrInfo.attrs': [] // 清空已选属性
            });
          }
        }
      });
    },
    selectGoodsSubModel: function (e) {
      var dataset = e.target.dataset,
        modelIndex = dataset.modelIndex,
        submodelIndex = dataset.submodelIndex,
        data = {},
        selectModels = this.data.selectGoodsModelInfo.models,
        model = this.data.goodsInfo.model,
        text = '',
        goodsInfo = JSON.parse(JSON.stringify(this.data.goodsInfo));
      if (selectModels[modelIndex] == model[modelIndex].subModelId[submodelIndex]) {
        selectModels[modelIndex] = '';
      } else {
        selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];
      }
      goodsInfo.model_items.forEach(item => {
        if (item.model == selectModels.join(',')) {
          data['selectGoodsModelInfo'] = item;
          data['selectGoodsModelInfo.min_sales_nums'] = +item.min_sales_nums || 1;
        }
      })
      if (selectModels.indexOf('') != -1) {
        data['selectGoodsModelInfo'] = {};
      } else {
        for (let i = 0; i < selectModels.length; i++) {
          let selectSubModelId = model[i].subModelId;
          for (let j = 0; j < selectSubModelId.length; j++) {
            if (selectModels[i] == selectSubModelId[j]) {
              text += '“' + model[i].subModelName[j] + '” ';
            }
          }
        }
        data['selectGoodsModelInfo.models_text'] = text;
      }
      data['selectGoodsModelInfo.models'] = selectModels;
      this.setData(data);
      this.resetSelectCountPrice();
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
        selectAttrs[attrIndex] = Array.isArray(selectAttrs[attrIndex]) ? selectAttrs[attrIndex] : [];
      } else {
        selectAttrs[attrIndex] = Object.prototype.toString.call(selectAttrs[attrIndex]) === "[Object Object]" ? selectAttrs[attrIndex] : {};
      }
      attrs[attrIndex].elem[subAttrIndex].is_selected = status == 0 ? true : false;
      selectAttrs[attrIndex][subAttrIndex] = attrs[attrIndex].elem[subAttrIndex];
      data['selectAttrInfo.attrs'] = selectAttrs;
      this.setData(data);
    },
    selectGoodsPackage: function (e) {
      let { status } = e.target.dataset;
      app.turnToPage("/eCommerce/pages/setMeal/setMeal.wxml?status=" + status);
    },
    resetSelectCountPrice: function () {
      let selectGoodsModelInfo = this.data.selectGoodsModelInfo;
      let selectModelIds = selectGoodsModelInfo.models.join(',');
      let modelItems = this.data.goodsInfo.model_items;
      let data = {};
      let cover = this.data.goodsInfo.cover;
      let defaultCount = 1;
      modelItems.forEach(item=> {
        if (item.model == selectModelIds && +item.min_sales_nums) {
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
      console.log('e:',e);
      var count = +e.detail.value,
        selectGoodsModelInfo = this.data.selectGoodsModelInfo,
        goodsInfo = this.data.goodsInfo,
        stock = +selectGoodsModelInfo.stock; // 库存
      if (count >= stock) {
        count = stock;
        app.showModal({ content: '购买数量不能大于库存' });
        this.setData({
          'selectGoodsModelInfo.buyCount': count
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
      this.setData({
        'selectGoodsModelInfo.buyCount': e.detail.value
      })
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
    checkGoodsAttribute: function () {
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
          if (Array.isArray(item)) {
            item.forEach(subItem => {
              if (subItem.is_selected) {
                param.form_data.attributes.push({
                  id: subItem.id,
                  num: 1,
                });
              }
            })
          } else if (typeof item == 'object') {
            for (let i in item) {
              if (item[i].is_selected) {
                param.form_data.attributes.push({
                  id: item[i].id,
                  num: 1,
                });
              }
            }
          }else if (item.is_selected) {
            param.form_data.attributes.push({
              id: item.id,
              num: 1,
            });
          }
        })
      }
      if (this.dis_group_id && this.leader_token) {
        Object.assign(param, {
          dis_group_id: -1,
          leader_token: this.leader_token,
          group_id: this.dis_group_id,
        })
      }
      return param;
    },
    sureAddToShoppingCart: function () {
      let _this = this;
      let param = this.checkGoodsAttribute();
      app.sendRequest({
        url: '/index.php?r=AppShop/addCart',
        data: param,
        method: 'post',
        success: function (res) {
          _this.triggerEvent('afterSelectedGoods', {});
          _this.hideDialog();
          app.sendUseBehavior([{goodsId: _this.goodsId}], 4);
        }
      })
    },
    hideDialog: function () {
      this.setData({
        isVisibled: false,
      });
    },
    getAppECStoreConfig: function () {
      app.getAppECStoreConfig((res) => {
        this.setData({
          storeStyle: res.color_config,
          detailtype: res.detail_type,
          showStock: res.detail_fields.stock,
          showVirtualPrice: (res.detail_fields && res.detail_fields.virtual_price == 1) ? true : false,
        })
      }, this.franchiseeId);
    },
    goPreviewGoodsOrder: function() {
      let _this = this;
      let param = {
        goods_id: _this.data.goodsInfo.id,
        model_id: _this.data.selectGoodsModelInfo.modelId || '',
        num: _this.data.selectGoodsModelInfo.buyCount,
        sub_shop_app_id: this.franchiseeId,
        message_notice_type: 1
      };
      app.sendRequest({
        url: '/index.php?r=AppShop/addCart',
        data: param,
        success: function (res) {
          let cart_arr = [res.data],
            pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr=' + encodeURIComponent(cart_arr) + '&franchisee=' + param.sub_shop_app_id;
            _this.hideDialog();
            app.turnToPage(pagePath);
        }
      })
    },
    turnToSetMeal: function() {
      let param = 'goods_id=' + this.data.goodsInfo.id + '&status=0';
      app.turnToPage("/eCommerce/pages/setMeal/setMeal?" + param);
    }
  }
})
