var Element = require('../../utils/element.js');
var app = getApp();
var goodsList = new Element({
  events: {
    goodsScrollFunc: function (e) {
      this.goodsScrollFunc(e);
    },
    turnToGoodsDetail: function (e) {
      app.turnToGoodsDetail(e);
    },
    showGoodsShoppingcart: function (e) {
      app.showGoodsShoppingcart(e);
    },
    showAddShoppingcart: function (e) {
      if (e.currentTarget.dataset.appId && e.currentTarget.dataset.appId !== app.getAppId()) {
        app.showModal({
          content: '子店商品添加到购物车需要在商品详情页购物车购买',
          confirm: () => {
            app.showAddShoppingcart(e);
          }
        });
      } else {
        app.showAddShoppingcart(e);
      }
    },
  },
  methods: {
    init: function(compid, pageInstance){
      let compData = pageInstance.data[compid];
      let customFeature = compData.customFeature;
      let param = typeof compData.param == 'string' ? JSON.parse(compData.param) : compData.param;
      let newInitData = {};
      newInitData[compid + '.goods_data'] = [];
      newInitData[compid + '.is_more'] = 1;
      newInitData[compid + '.loadingFail'] = false;
      newInitData[compid + '.loading'] = true;
      newInitData[compid + '.curpage'] = 0;
      pageInstance.setData(newInitData);
      let re_compid = app.getInvolvedFromRefreshObject(customFeature.id, "new-classify");
      let re_compData = pageInstance.data[re_compid];
      let re_newdata = {};
      if (re_compData && re_compData.customFeature.topHover) {
        re_compData.classify_observer && re_compData.classify_observer.disconnect();
        this.topHover(pageInstance, compid, re_compid);
      }
      if (re_compData && re_compData.customFeature.topHover) {
        re_compData.list_observer && re_compData.list_observer.disconnect();
        this.bottomHover(pageInstance, compid, re_compid);
      }
      if (re_compid && re_compData.customFeature.topHover) {
        let style_arr = re_compData.style.split(';');
        for (let i=0; i<style_arr.length; i++) {
          if (style_arr[i].split(':')[0] == 'height') {
            let height = style_arr[i].split(':')[1].match(/(\S*)rpx/)[1] / 2.34375;
            re_newdata[compid + '.topNavBarHeight'] = app.globalData.topNavBarHeight + height;
            re_newdata[compid + '.re_height'] = height;
          }
        }
        pageInstance.setData(re_newdata);
      }
      param.show_package_goods = customFeature.isShowSetMeal ? 2 : 0; // 2:显示全部 1:只显示套餐 0:不显示套餐
      param.page = 1;
      if (customFeature.controlCheck) {
        param.is_integral = 3;
      } else {
        if (param.goods_type != 10) { // 非行业预约商品
          if (customFeature.isIntegral) {
            param.is_integral = 1;
          } else {
            param.is_integral = 5;
          }
        } else {
          if (customFeature.isIntegral) {
            param.is_integral = 5;
          } else {
            param.is_integral = 2;
          }
        }
      }
      if(customFeature.isShowGroupBuyGoods){
        param.is_group_buy = 1;
      }
      if (customFeature.isShowSellOut) {
        param.is_stock_gte_zero = 1;
      }
      param.is_count = 0;
      param.page_size = customFeature.loadingNum || 10;
      if (customFeature.source && customFeature.source != 'none') {
        param.idx_arr = {
          "idx": "category",
          "idx_value": customFeature.source
        }
      }
      if (param.form === 'goods' && customFeature.pickUpArr){
        param.pick_up_type = [];
        if (customFeature.pickUpArr.express){
          param.pick_up_type.push(1);
        }
        if (customFeature.pickUpArr.sameJourney) {
          param.pick_up_type.push(2);
        }
        if (customFeature.pickUpArr.selfLifting) {
          param.pick_up_type.push(3);
        }
        if (customFeature.pickUpArr.dining) {
          param.pick_up_type.push(4);
        }
      }
      if (customFeature.form === 'goods' && customFeature.isShowFranchiseeGoods && !pageInstance.franchiseeId) { // 显示子店商品
        param['is_app_shop_cate_goods'] = 1;
        param['is_app_shop'] = 1;
      }
      if (pageInstance.franchiseeId || app.getChainId()) {
        param['is_parent_shop_goods'] = 1;
        param['parent_app_id'] = app.getAppId();
      }
      if (customFeature.form === 'goods' && customFeature.goodsType === 'electronicGoods') {
        param['show_virtual_goods'] = 1;
      }
      pageInstance.setData({
        [compid + '.param']: param
      });
      if(param.form === 'tostore'){
        this.tostoreInit(compid, pageInstance, param);
      }else if (param.form == 'new_appointment') {
        this.newAppointmentInit(compid, pageInstance, param);
      }else {
        this.goodsListInit(compid, pageInstance, param);
      }
    },
    tostoreInit: function(compid, pageInstance, param){
      let customFeature = pageInstance.data[compid].customFeature;
      if (app.getInvolvedFromRefreshObject(customFeature.id, "new-classify", "refresh_object", pageInstance)){
        return;
      }
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppShop/GetGoodsList',
        data: param,
        method: 'post',
        chain: true,
        subshop: pageInstance.franchiseeId || '',
        success: function (res) {
          let newdata = {};
          let goodslist = res.data;
          if (app.getHomepageRouter() == pageInstance.page_router) {
            let second = new Date().getMinutes().toString();
            if (second.length <= 1) {
              second = '0' + second;
            }
            let currentTime = new Date().getHours().toString() + second,
                showFlag = true,
                showTime = '';
            app.sendRequest({
              hideLoading: true,
              url: '/index.php?r=AppShop/getBusinessTime',
              method: 'post',
              data: {
              },
              chain: true,
              subshop: pageInstance.franchiseeId || '',
              success: function (res) {
                let businessTime = res.data.business_time;
                if(businessTime && businessTime.length){
                  for (let i = 0; i < businessTime.length; i++) {
                    showTime += businessTime[i].start_time.substring(0, 2) + ':' + businessTime[i].start_time.substring(2, 4) + '-' + businessTime[i].end_time.substring(0, 2) + ':' + businessTime[i].end_time.substring(2, 4) + (businessTime.length == 1 ? '' : (i <= businessTime.length - 1 ? ' / ' : ''));
                    if (+currentTime > +businessTime[i].start_time && +currentTime < +businessTime[i].end_time) {
                      showFlag = false;
                    }
                  }
                }
                if (showFlag) {
                  app.showModal({
                    content: '店铺休息中,暂时无法接单。营业时间为：' + showTime
                  })
                }
              }
            });
          }
          goodslist.map((item) => {
            item.form_data.goods_model && delete item.form_data.goods_model
          })
          newdata[compid + '.goods_data'] = goodslist;
          newdata[compid + '.is_more'] = res.is_more;
          newdata[compid + '.curpage'] = 1;
          newdata[compid + '.loadingFail'] = false;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        },
        fail: function (res) {
          let newdata = {};
          newdata[compid + '.loadingFail'] = true;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        }
      });
    },
    getAptGoodsList(compid, pageInstance, param, customFeature){
      let noAppointTpl = {};
      noAppointTpl[compid + '.param'] = param;
      noAppointTpl[compid + '.customFeature.tpl_id'] = param.tpl_id;
      noAppointTpl[compid + '.customFeature.unit'] = param.unit;
      noAppointTpl[compid + '.customFeature.tpl_style'] = param.tpl_style;
      noAppointTpl[compid + '.customFeature.now_date'] = new Date().getTime();
      delete param.tpl_style; //不知道为啥就多了 也不知道找谁 反正不传就行
        if (!param.tpl_id){
          noAppointTpl[compid +'.goods_data'] = [];
          noAppointTpl[compid + '.is_more'] = 0;
          noAppointTpl[compid + '.loadingFail'] = false;
          noAppointTpl[compid + '.loading'] = false;
          pageInstance.setData(noAppointTpl);
          return
        }
        pageInstance.setData(noAppointTpl);
        if (app.getInvolvedFromRefreshObject(customFeature.id, "new-classify", "refresh_object", pageInstance)){
          return;
        }
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=AppShop/GetGoodsList',
          data: param,
          method: 'post',
          chain: true,
          subshop: pageInstance.franchiseeId || '',
          success: function (res) {
            if (res.status == 0) {
              for (let i in res.data) {
                let tamp = res.data[i].form_data;
                if(tamp.is_experience_goods == 1){ //体验价
                  tamp.price = tamp.experience_min_price;
                }else{
                  res.data[i].form_data.price = res.data[i].form_data.min_price;
                }
                delete res.data[i].form_data.description;
              }
              let newdata = {};
              newdata[compid + '.goods_data'] = res.data;
              newdata[compid + '.is_more'] = res.is_more;
              newdata[compid + '.curpage'] = 1;
              newdata[compid + '.loadingFail'] = false;
              newdata[compid + '.loading'] = false;
              pageInstance.setData(newdata);
            }
          },
          fail: function (res) {
            let newdata = {};
            newdata[compid + '.loadingFail'] = true;
            newdata[compid + '.loading'] = false;
            pageInstance.setData(newdata);
          }
        });
    },
    newAppointmentInit: function(compid, pageInstance, param){
      let self = this;
      let customFeature = pageInstance.data[compid].customFeature;
      if(customFeature.trade_apt_id){
        param.tpl_id = customFeature.trade_apt_id;
        param.unit = customFeature.unitType;
        let tpl_style = +customFeature.tpl_style || '';
        switch (+tpl_style) {
          case 6: tpl_style = 3; break;
          case 7: tpl_style = 4; break;
          case 8: tpl_style = 1; break;
         }
        param.tpl_style = tpl_style
        self.getAptGoodsList(compid, pageInstance, param, customFeature)
      }else{
        app.showModal({
          content: '未绑定数据模板，请在编辑器进行绑定。如若有页面结构改变，则需要重新打包。'
        })
      }
    },
    goodsListInit: function(compid, pageInstance, param){
      let customFeature = pageInstance.data[compid].customFeature;
      if (param.form === 'goods'){
        app.getAppECStoreConfig((res)=> {
          let newdata = {};
          newdata[compid + '.storeStyle'] = res.color_config;
          newdata[compid + '.detail_type'] = res.detail_type;
          if (res.detail_fields_one) {
            newdata[compid + '.vip_price'] = res.detail_fields_one.vip_price;
          }
          pageInstance.setData(newdata);
        })
      }
      if (app.getInvolvedFromRefreshObject(customFeature.id, "new-classify", "refresh_object", pageInstance)){
        return;
      }
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppShop/GetGoodsList',
        data: param,
        method: 'post',
        chain: true,
        subshop: pageInstance.franchiseeId || '',
        success: function (res) {
          let appId = app.getAppId();
          let chainAppId = app.getChainAppId();
          if (res.status == 0) {
            for(let i in res.data){
              let formData = res.data[i].form_data;
              if (formData.goods_model) {
                let price, virtuaPrice;
                switch (customFeature.priceOption) {
                  case '1':
                    price = formData.min_price;
                    break;
                  case '2':
                    price = formData.max_price;
                    break;
                  case '3':
                    if (formData.min_price === formData.max_price) {
                      price = formData.min_price;
                      break;
                    }
                    price = formData.min_price + '~' + formData.max_price;
                    break;
                }
                switch (customFeature.virtualPriceOption) {
                  case '1':
                    virtuaPrice = formData.virtual_min_price;
                    break;
                  case '2':
                    virtuaPrice = formData.virtual_max_price;
                    break;
                  case '3':
                    virtuaPrice = formData.virtual_max_price == 0 ? 0 : formData.virtual_min_price + '~' + formData.virtual_max_price;
                    break;
                }
                formData.virtual_price = virtuaPrice;
                formData.price = price;
              }
              formData.discount = (formData.price * 10 / (customFeature.virtualPriceOption == 3 ? formData.virtual_max_price : formData.virtual_price)).toFixed(2);
              let vip_discount = (formData.vip_min_price * 10 / (customFeature.virtualPriceOption == 3 ? formData.virtual_max_price : formData.virtual_price)).toFixed(2);
              formData.vip_discount = vip_discount < 0.01 ? 0.01 : vip_discount;
              delete formData.description;
              if (+param['is_app_shop_cate_goods'] === 1 && formData.app_id !== appId && !pageInstance.franchiseeId && chainAppId !== formData.app_id) {
                formData.isSubShopGoods = true;
              }else {
                formData.isSubShopGoods = false;
              }
            }
          }
          let newdata = {};
          res.data.forEach(good=>{
            if (Number(good.form_data.max_can_use_integral) != 0) {
              let discountStr = Number(good.form_data.max_can_use_integral) + '积分抵扣' + (Number(good.form_data.max_can_use_integral) / 100) + '元';
              good.discountStr = discountStr;
            } 
            good.form_data.min_price_arr = good.form_data.min_price.split('.');
            good.form_data.max_price_arr = good.form_data.max_price.split('.');
            if (good.form_data.vip_min_price){
              good.form_data.vip_min_price_arr = good.form_data.vip_min_price.split('.');
              good.form_data.vip_max_price_arr = good.form_data.vip_max_price.split('.');
            }
          })
          newdata[compid + '.goods_data'] = res.data;
          newdata[compid + '.is_more'] = res.is_more;
          newdata[compid + '.curpage'] = 1;
          newdata[compid + '.loadingFail'] = false;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        },
        fail: function (res) {
          let newdata = {};
          newdata[compid + '.loadingFail'] = true;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        }
      });
    },
    goodsScrollFunc : function(event) {
      let pageInstance = app.getAppCurrentPage();
      let compid       = typeof event == 'object' ? event.currentTarget.dataset.compid : event;
      let compData     = pageInstance.data[compid];
      if(!compData){
        return;
      }
      let curpage      = compData.curpage + 1;
      let customFeature = compData.customFeature;
      let newdata      = {};
      let param        = compData.param;
      if(customFeature.vesselAutoheight == 2){    // 0自定义高度， 1自定义定义高度 ， 2自定义条数
        return;
      }
      if(!compData.is_more && typeof event == 'object' && event.type == 'tap'){
        app.showModal({
          content: '已经加载到最后了'
        });
      }
      if (compData.loading || !compData.is_more) {
        return;
      }
      newdata[compid + '.loading'] = true;
      newdata[compid + '.loadingFail'] = false;
      pageInstance.setData(newdata);
      if(param.form == 'new_appointment' && !param.tpl_id){
        let noAppointTpl = {};
        noAppointTpl[compid +'.goods_data'] = [];
        noAppointTpl[compid + '.is_more'] = 0;
        pageInstance.setData(noAppointTpl)
        return
      }
      param.page = curpage;
      app.sendRequest({
        url: '/index.php?r=AppShop/GetGoodsList',
        hideLoading: true,
        data: param,
        method: 'post',
        chain: true,
        subshop: pageInstance.franchiseeId || '',
        success: function (res) {
          let newdata = {};
          let appId = app.getAppId();
          let chainAppId = app.getChainAppId();
          for (let i in res.data) {
            let formData = res.data[i].form_data;
            if (formData.goods_model) {
              let price, virtuaPrice;
              switch (customFeature.priceOption) {
                case '1':
                  price = formData.min_price;
                  break;
                case '2':
                  price = formData.max_price;
                  break;
                case '3':
                  if (formData.min_price === formData.max_price) {
                    price = formData.min_price;
                    break;
                  }
                  price = formData.min_price + '~' + formData.max_price;
                  break;
                default:
                  price = formData.min_price;
                  break;
              }
              switch (customFeature.virtualPriceOption) {
                case '1':
                  virtuaPrice = formData.virtual_min_price;
                  break;
                case '2':
                  virtuaPrice = formData.virtual_max_price;
                  break;
                case '3':
                  virtuaPrice = formData.virtual_max_price == 0 ? 0 : formData.virtual_min_price + '~' + formData.virtual_max_price;
                  break;
                default:
                  virtuaPrice = formData.virtual_min_price;
                  break;
              }
              formData.virtual_price = virtuaPrice;
              formData.price = price;
            }
            formData.discount = (formData.price * 10 / formData.virtual_price).toFixed(2);
            let vip_discount = (formData.vip_min_price * 10 / formData.virtual_price).toFixed(2);
            formData.vip_discount = vip_discount < 0.01 ? 0.01 : vip_discount;
            delete formData.description;
            formData.goods_model && delete formData.goods_model;
            if (+param['is_app_shop_cate_goods'] === 1 && res.data[i].form_data.app_id !== appId && !pageInstance.franchiseeId && chainAppId !== res.data[i].form_data.app_id) {
              res.data[i].form_data.isSubShopGoods = true;
            }else {
              formData.isSubShopGoods = false;
            }
          }
          if (res.current_page == 1 || res.current_page == 0){
            compData.goods_data = [];
          }
          res.data.forEach(good => {
            if (Number(good.form_data.max_can_use_integral) != 0) {
              let discountStr = Number(good.form_data.max_can_use_integral) + '积分抵扣' + (Number(good.form_data.max_can_use_integral) / 100) + '元';
              good.discountStr = discountStr;
            }
            good.form_data.min_price_arr = good.form_data.min_price.split('.');
            good.form_data.max_price_arr = good.form_data.max_price.split('.');
            if (good.form_data.vip_min_price) {
              good.form_data.vip_min_price_arr = good.form_data.vip_min_price.split('.');
              good.form_data.vip_max_price_arr = good.form_data.vip_max_price.split('.');
            }
          })
          newdata[compid + '.goods_data'] = compData.goods_data.concat(res.data);
          newdata[compid + '.is_more'] = res.is_more;
          newdata[compid + '.curpage'] = res.current_page;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        },
        fail: function () {
          let newdata = {};
          newdata[compid + '.loadingFail'] = true;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        },
        complete: function () {
        }
      })
    },
    topHover: function (pageInstance, compid, re_compid) {
      let compData = pageInstance.data[compid];
      compData.classify_observer = wx.createIntersectionObserver();
      let top = 0;
      if (pageInstance.data.page_hasNavBar) {
        top = 0 - app.globalData.topNavBarHeight;
      }
      compData.classify_observer.relativeToViewport({ top: top }).observe('.topHover', (res) => {
        if (res.boundingClientRect.top < Math.abs(top) && res.intersectionRect.top == 0) {
          pageInstance.setData({
            [re_compid + '.topHover']: res.intersectionRatio == 1 ? false : true,
            [compid + '.customFeature.topHover']: res.intersectionRatio == 1 ? false : true
          })
        } else {
          pageInstance.setData({
            [re_compid + '.topHover']: false,
            [compid + '.customFeature.topHover']: false
          })
        }
      })
    },
    bottomHover: function (pageInstance, compid, re_compid) {
      let compData = pageInstance.data[compid];
      compData.list_observer = wx.createIntersectionObserver();
      compData.list_observer.relativeToViewport().observe('.bottomHover', (res) => {
        if (!(res.intersectionRatio > 0) && res.boundingClientRect.top < 0) {
          pageInstance.setData({
            [re_compid + '.topHover']: false,
            [compid + '.customFeature.topHover']: false
          })
        }
      })
    },
  }
})
module.exports = goodsList;
