var app = getApp()
var WxParse = require('../../../components/wxParse/wxParse.js');
const customEvent = require('../../../utils/custom_event.js');
const util = require('../../../utils/util.js');
Page({
  data: {
    goodsId: '',
    cardtype: '',
    goodsInfo: {},
    vipCardStatus: 1,
    modelStrs: {},
    selectModelInfo: {
      models: [],
      stock: '',
      price: '',
      virtualPrice: '',
      buyCount: 1,
      models_text : ''
    },
    selectAttrInfo: {
      attrs: []
    },
    pageQRCodeData:{
      shareDialogShow: "100%",
      shareMenuShow: false,
    },
    commentArr: [],
    commentNums: [],
    commentExample: '',
    commentPage: 1,
    commentType: 0,
    commentTotalPage: '',
    defaultPhoto: '',
    allStock: '',
    addToShoppingCartHidden: true,
    ifAddToShoppingCart: true,
    priceDiscountStr: '',
    priceDiscountStrOne: '',
    page_hidden: true,
    appointmentPhone:'',
    detailCommetType: 'detail',
    carouselCurrentIndex: 1,
    storeStyle: '',
    footPrintIndex: 0,
    showFootPrint: false,
    animationData: {},
    pageStaySeconds: 0,
    userSetEventsArr: [],
    showFreight:false,
    deliver:0,
    express:0,
    scrollTop: 0,
    couponName: '',
    showCouponsList: false,
    store_list_data: [],
    showGroupModal:false,
    viewGoodsUserList:[],
    viewGoodsUserCount:0,
    onSaleGoodsCount:0,
    popular_goods_list:[],
    showSelfDeliveryShopList:true,
    is_more:0,
    showShare: false,
    threeselectGood:false,
    windowHeight:'',
    isVipLimit: false, // 是否达商品会员限购
    isGoodsLimit: false, // 是否商品件数限购
    scene: null,
    s_his_data: {}, // 连锁子店信息
    showEvoucherIntroDialog: false,  // 是否展示电子卡券商品说明
    isEvoucher: true,   // 是否是电子卡券
    pageTitle: '',      // 页面标题
    evoucherNotVaild: false,  // 电子卡券是否失效
  },
  page_size:2,
  page:1,
  getDefaultPickUpTypeVal: -1,
  evoucherIntroLong: '',  // 电子卡券超长度说明
  evoucherIntroShort: '', // 电子卡券带省略说明
  onLoad: function(options){
    if (app.globalData.appScene === 1154) {
      this.setData({
        scene: app.globalData.appScene
      })
    } else {
      this.setData({
        options: options
      })
    }
    let goodsId = options.detail,
        franchiseeId = options.franchisee || '',
        cartGoodsNum = options.cart_num || 0,
        defaultPhoto = app.getDefaultPhoto(),
        goodsType = options.goodsType || 0,
        sessionFrom = options.franchisee || app.getAppId() || '';
        this.p_id = options.p_id || app.globalData.p_id;
    this.setData({
      goodsId: goodsId,
      defaultPhoto: defaultPhoto,
      franchiseeId: franchiseeId,
      cartGoodsNum: cartGoodsNum,
      goodsType : goodsType,
      sessionFrom: sessionFrom
    })
    this.getDefaultPickUpType();
    this.dataInitial();
    this.videoContext = wx.createVideoContext('goodsDetail-video');
    this.getViewGoodUserInfo();
    this.getOnSaleGoodsCount();
    this.getShareToMomentsSwitch();
  },
  onReachBottom: function(){
    if (this.data.detailCommetType == 'comment' && this.data.commentPage <= this.data.commentTotalPage){
      this.getAssessList(this.data.commentType, this.data.commentPage, 1);
    }
  },
  dataInitial: function () {
    var that = this;
    this.getAppECStoreConfig();
    this.getUserSetEvents();
    this.getGoodsLimit();
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        data_id: this.data.goodsId,
        sub_shop_app_id: this.data.franchiseeId ,
        message_notice_type: 1,
        not_group_buy_goods: 1
      },
      success: function (res) {
        that.modifyGoodsDetail(res),
        that.setData({
          viewGoodsUserCount: res.data[0].form_data.viewed_count
        })
      },
      complete: function(){
        that.setData({
          page_hidden: false
        })
      }
    })
  },
  onShareAppMessage: function(){
    this.setData({
      pageQRCodeData: {
        shareDialogShow: "100%",
        shareMenuShow: false,
      }
    })
    let that = this,
        goodsId = this.data.goodsId,
        franchiseeId = this.data.franchiseeId,
        cartGoodsNum = this.data.cart_num || '',
        title = this.data.goodsInfo.share_title || this.data.goodsInfo.title,
        shareImage = this.data.goodsInfo.share_img || this.data.goodsInfo.cover,
        urlPromotion = this.p_id ? '&p_id=' + this.p_id : '',
      path = '/detailPage/pages/goodsDetail/goodsDetail?detail=' + goodsId + (franchiseeId ? '&franchisee=' + franchiseeId + '&cart_num=' + cartGoodsNum : '') + urlPromotion + (app.globalData.pageShareKey ? ('&psid=' + app.globalData.pageShareKey) : '');
    app.sendUseBehavior([{goodsId: goodsId}],2);
    return app.shareAppMessage({
      path: path,
      title: title,
      imageUrl: shareImage,
      success: function (addTime) {
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
  onUnload: function () {
    if(this.downcount){
      this.downcount.clear();
    }
  },
  getCoupons: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getCoupons',
      data: {
        in_use_date: 1, //0是全部，1是只显示可领取的优惠券
        in_show_list: 1, //0:不在列表内 1:在列表内
        enable_status: 1, //0:下架 1:上架
        stock: 1, //0:没有库存的 1:有库存的
        page: -1
      },
      success: function (res) {
        if (res.data.length > 0) {
          let couponTypeName = ['满减券','打折券','代金券','兑换券','储值券','通用券','次数券'];
          let data = res.data[0];
          _this.setData({
            couponTypeName: couponTypeName[data.type],
            couponName: data.title,
            showCouponsList: true
          })
        }
      }
    })
  },
  getDeliveryList: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getSelfDeliveryList',
      data: {
        sub_shop_app_id: _this.data.franchiseeId,
        page_size:_this.page_size,
        page:_this.page
      },
      success: function (res) {
        if(res.data){
          _this.setData({
            store_list_data: _this.data.store_list_data.concat(res.data.store_list_data),
            is_more: res.is_more
          })
        }
      }
    })
  },
  onShareTimeline: function (e) {
    return {
      imageUrl: this.data.goodsInfo.share_img || '',
      title: this.data.goodsInfo.share_title || this.data.goodsInfo.title,
      query: app.getShareQuery(this.data.options || Object.assign(this.data.franchiseeInfo || {}, {isSubShop: true}))
    }
  },
  getmoreshop:function(){
    this.page++;
    this.getDeliveryList();
  },
  phoneCall: function (e) {
    let phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone)
  },
  openMap: function (e) {
    let {
      longitude,
      latitude,
      address,
      title
    } = e.currentTarget.dataset
    wx.openLocation({
      latitude: Number(latitude), // 纬度，范围为-90~90，负数表示南纬
      longitude: Number(longitude), // 经度，范围为-180~180，负数表示西经
      scale: 18, // 缩放比例
      name: title,
      address: address,
    })
  },
 srcollToTop:function(e) {
   wx.pageScrollTo({
     scrollTop: 0,
     duration: 300
   });
 }, 
  goToMyOrder: function(){
    var franchiseeId = this.data.franchiseeId,
        pagePath = '/eCommerce/pages/myOrder/myOrder?goodsType=' + this.data.goodsInfo.goods_type + '&currentIndex=0' + (franchiseeId ? '&franchisee='+franchiseeId : '');
    app.turnToPage(pagePath, true);
  },
  goToShoppingCart: function(){
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/shoppingCart/shoppingCart'+(franchiseeId ? '?franchisee='+franchiseeId : '');
    app.turnToPage(pagePath);
  },
  gotoVipBenefits: function (e) {
    let franchiseeId = this.data.franchiseeId;
    let id = e.currentTarget.dataset.id;
    let cardtype = e.currentTarget.dataset.cardtype;
    app.turnToPage('/eCommerce/pages/vipBenefits/vipBenefits?id=' + id + '&cardtype=' + cardtype + (franchiseeId ? '&franchisee=' + franchiseeId : ''));
  },
  goToHomepage: function(){
    let that = this;
    let franchiseeId = that.data.franchiseeId;
    let chainId = app.getChainId();
    let appId = app.globalData.appId;
    let homePage = app.getHomepageRouter();
    if ((franchiseeId && franchiseeId != chainId) || chainId){  //开启锁定店铺返回首页需切换成当前商品所属门店 总店/子店---总店/子店商品
      let pages = getCurrentPages();
      let p = pages[pages.length - 2];
      if (p && p.route == 'franchisee/pages/goodsMore/goodsMore') {
        app.turnBack({ delta: 2 });
      } else if (p && p.route == 'franchisee/pages/searchStore/searchStore' && franchiseeId === appId) {
        app.reLaunch({ url: '/pages/' + homePage + '/' + homePage });
      } else if (app.globalData.hasFranchiseeChain) {
          app.reLaunch({url: '/pages/'+homePage+'/'+homePage});
      } else{
        customEvent.clickEventHandler['to-franchisee']({'franchisee-id': franchiseeId});
      }
    }else{
      app.reLaunch({url: '/pages/'+homePage+'/'+homePage});
    }
  },
  goToCommentPage: function(){
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/goodsComment/goodsComment?detail='+this.data.goodsId+(franchiseeId ? '&franchisee='+franchiseeId : '');
    app.turnToPage(pagePath);
  },
  modifyGoodsDetail: function(res){
    var _this = this,
      goods = res.data[0].form_data,
      unitType = (goods.appointment_info && goods.appointment_info.unit_type) || '',
      description = goods.description,
      goodsModel = [],
      selectModels = [],
      modifySelectModels = '',
      modelStrs = {},
      price = 0,
      discountStr = '',
      discountStrOne = '',
      allStock = 0,
      select_min_sales_nums,
      selectStock, selectPrice, selectModelId, selectVirtualPrice, selectText = '',
      vipPrice,
      selectImgurl = '',
      imgsArr = goods.img_urls || [];
      goods.img_urls = imgsArr.length > 0 ? imgsArr : [goods.cover, ...imgsArr];
      goods.auto_carousel = goods.auto_carousel === 2 ? false : true; // 1是自动播放，2是关闭自动播放
      for (let i = 0; i < goods.pick_up_type.length; i++) {
        goods.pick_up_type[i] == 5 && goods.pick_up_type.splice(i,1);
      }
      goods.pick_up_type.forEach(getType => {
        if(getType == 1 || getType == 2){
          this.setData({
            showFreight:true
          })
        }
        if(getType == 2){
          if (goods.goods_express_data.deliver_fee > 0) {
            this.setData({
              deliver:2
            })
          } else if (goods.goods_express_data.deliver_fee == 0) {
           this.setData({
             deliver: 1
           })
          }
        }
      })
      if (goods.goods_express_data.express_fee > 0) {
         this.setData({
           express:2
         })
      } else if (goods.goods_express_data.express_fee == 0) {
        this.setData({
          express: 1
        })
       }
    this.setData({
      unitType: unitType || '',
      appointmentDesc: goods.appointment_info && goods.appointment_info.appointment_desc ? goods.appointment_info.appointment_desc.replace(/<br \/>/g, "\r\n") : '更多优惠资讯详情请联系商家!',
      appointmentPhone: goods.appointment_info && goods.appointment_info.appointment_phone ? goods.appointment_info.appointment_phone:'',
      displayComment:goods.appointment_info &&  goods.appointment_info.display_comment == '1' ?goods.appointment_info.display_comment : ''
    });
    description = description ? description.replace(/\u00A0|\u2028|\u2029|\uFEFF/g, '') : description;
    goods.description = description
    WxParse.wxParse('wxParseDescription', 'html', description, _this, 10);
    goods.vip_price = goods.vip_min_price == goods.vip_max_price ? goods.vip_min_price : goods.vip_min_price + '~' + goods.vip_max_price;
    for (var key in goods.model) {
      if(key){
        var model = goods.model[key];
        goodsModel.push(model);
        if(model && model.subModelName){
          if (key == '1' && goods.goods_type == '1'){
            for(var index in model.subModelName){
              var adjustTime =  model.subModelName[index].split('-'),
              submodel = model.subModelName[index].substring(6,8),
              endHours = (submodel - 24) >= 10 ?  (submodel-24) : '0'+ (submodel - 24);
              model.subModelName[index] = submodel >= 24 ?  adjustTime[0] + '-' + '次日' + endHours + ':' + adjustTime[1].split(':')[1]  :adjustTime[0] +  '-当日' + adjustTime[1] ;
            }
          }
          if(goods.goods_type == '1' && model.id == '0'){
            for(var index in model.subModelName){
              model.subModelName[index] = model.subModelName[index] + (goods.appointment_info && goods.appointment_info.unit);
            }
          }
          modelStrs[model.id] = model.subModelName.join('、');
          if (model.subModelId.length == 1){
            selectModels.push(model.subModelId[0]);
            modifySelectModels = selectModels.toString();
            selectText += '“' + model.subModelName[0] + '” ';
          }else {
            selectModels.push('');
          } 
        }
      }
    }
    if (selectModels.indexOf('') != -1) {
      selectText = '';
    }
    if(goods.model_items.length){
      let items = goods.model_items;
      for (let i = 0; i < items.length; i++) {
        price = Number(items[i].price);
        let virtualPrice = Number(items[i].virtual_price);
        let modifyGoodsmodel = items[i].model;
        goods.virtual_price = goods.virtual_price > virtualPrice ? goods.virtual_price : virtualPrice;
        allStock += Number(items[i].stock);
        if(modifyGoodsmodel == modifySelectModels){
          selectPrice = items[i].price;
          select_min_sales_nums = +items[i].min_sales_nums;
          selectStock = items[i].stock;
          selectModelId = items[i].id;
          vipPrice = items[i].vip_price || items[i].price;
          selectImgurl = items[i].img_url;
          selectVirtualPrice = items[i].virtual_price;
        }
      }
    } else {
      selectPrice = goods.price;
      selectStock = goods.stock;
      select_min_sales_nums = +goods.min_sales_nums;
      selectVirtualPrice = goods.virtual_price;
      vipPrice = goods.vip_goods_price || goods.price;
      selectImgurl = goods.cover;
    }
    goods.model = goodsModel;
    if (Number(goods.max_can_use_integral) != 0 ) {
      discountStr = '积分可抵扣' + (Number(goods.max_can_use_integral) / 100) + '元';
      discountStrOne =  (Number(goods.max_can_use_integral) / 100) + '元';
    }
    let expressSort = goods.goods_express_data.express_fee_sort;
    if (expressSort.length == 1){
      let express = expressSort[0];
      if (express == 0){
        goods.express_fee = '包邮';
      }else{
        goods.express_fee = express + '元';
      }
    }else{
      goods.express_fee = expressSort[0] + '~' + expressSort[1] + '元';
    }
    if(goods.recommend_type && +goods.recommend_type === 0){
      goods.recommend_info = [];
    }
    if (goods['is_virtual_goods'] == 1) { // 1为电子卡券
      let validDateObj = {
        1: '长期有效',
        2: `${util.formatTimeYMD(goods['start_date_time'], 'YYYY-MM-DD')}至${util.formatTimeYMD(goods['end_date_time'], 'YYYY-MM-DD')}`,
        3: goods['after_buy_x_days'] > 0 ? `购买后${goods['after_buy_x_days']}天后生效，有效期${goods['after_buy_continued_x_days']}天` : `购买后当天生效，有效期${goods['after_buy_continued_x_days']}天`
      };
      let validDateStr = validDateObj[goods['valid_date_type']];
      goods['validDateStr'] = validDateStr;
      let availableHolidayStr = `${goods['valid_date_array']['exclude_holiday'] == 1 ? '节假日不可用' : '节假日可用'}`;
      goods['availableHolidayStr'] = availableHolidayStr;
      let tempObj = {monday: '星期一', tuesday: '星期二',tuesday: '星期二', wednesday: '星期三', thursday: '星期四', friday: '星期五', saturday: '星期六', sunday: '星期日'};
      let tempArr = [];
      let weekObj = goods['valid_date_array'];
      delete weekObj.exclude_holiday;
      Object.keys(weekObj).forEach((item) => {
        let w = weekObj[item];
        if (w == 1) { // 1代表可以用
          tempArr.push(tempObj[item]);
        }
      });
      if (tempArr.length != 7) {  // 全选不展示
        let tempStr = tempArr.join('、');
        goods['availableWeekStr'] = tempStr;
      } else {
        goods['availableWeekStr'] = '';
      }
      let evoucherIntro = `${validDateStr}${goods['availableWeekStr'] ? '，' + goods['availableWeekStr'] + '可用' : ''}${'，' + availableHolidayStr}${ goods['is_refundable'] == 0 ? '，不可申请退款' : ''}`;
      goods['evoucherIntro'] = evoucherIntro
    }
    _this.setData({
      goodsInfo: goods,
      modelStrs: modelStrs,
      'selectModelInfo.models': selectModels || '',
      'selectModelInfo.stock': selectStock || '',
      'selectModelInfo.price': selectPrice || '',
      'selectModelInfo.modelId': selectModelId || '',
      'selectModelInfo.models_text': selectText || '',
      'selectModelInfo.imgurl': selectImgurl || '',
      'selectModelInfo.virtualPrice': selectVirtualPrice || '',
      'selectModelInfo.vipPrice': vipPrice || '',
      'selectModelInfo.buyCount': select_min_sales_nums || 1,
      'selectModelInfo.min_sales_nums': select_min_sales_nums || 1,
      allStock: allStock || '',
      priceDiscountStr: discountStr || '',
      priceDiscountStrOne: discountStrOne || '',
      isEvoucher: goods['is_virtual_goods'] == 1,                          // 判断是否是虚拟商品
      pageTitle: goods['is_virtual_goods'] == 1 ? '电子卡券' : '商品详情',  // 页面标题
    })
    if (!goods.recommend_type || +goods.recommend_type !== 0) {
      this._setRecommendInfo(goods);
    }
    _this.getAssessList(0, 1);
    if (goods.model && goods.model.length) {
      _this.initSelectSubModel(goods); 
    }
  },
  _setRecommendInfo: function (data) {
    let { recommend_type, recommend_id, recommend_title, recommend_cond_set } = data;
    recommend_type = recommend_type ? +recommend_type : 0;
    recommend_cond_set = recommend_cond_set || {};
    if (recommend_type === 1 && recommend_id.length) {
      this._setRecommendGoods({ data_ids: recommend_id });
    } else if (recommend_type === 3 && recommend_cond_set.category) {
      if (recommend_cond_set.category == -1) {
        this._setRecommendGoods();
      } else {
        const categoryIds = recommend_cond_set.category.split(/,|，/);
        this._setRecommendGoods({ category_arr: categoryIds });
      }
    } 
  },
  _setRecommendGoods: function (options = {}) {
    let sortOptions = {
      sort_key: 'weight',
      sort_direction: 0
    };
    let params = {
      page: -1,
      form: 'goods'
    };
    Object.assign(params, options);
    const { recommend_cond_set } = this.data.goodsInfo;
    if (recommend_cond_set && recommend_cond_set.orderby){
      const { orderby } = recommend_cond_set;
      if (orderby === 'view_count') {
        sortOptions.sort_key = 'viewed_count';
      }else {
        sortOptions.sort_key = orderby;
      }
    }
    Object.assign(params, sortOptions);
    app.sendRequest({
      url: '/index.php?r=AppShop/GetGoodsList',
      data: params,
      method: 'post',
      success: ({ data, status }) => {
        if(status === 0){
          this.setData({
            'goodsInfo.recommend_info': data
          })
        }
      }
    })
  },
  showBuyDirectly: function(e){
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    let goodsInfo = this.data.goodsInfo;
    if (goodsInfo.model.length == 0 && (!goodsInfo.attributes || goodsInfo.attributes.length == 0)) {
      this.buyDirectlyNextStep();
      return;
    }
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: false,
      threeselectGood: false,
    })
  },
  showAddToShoppingCart: function(e){
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId});
    let goodsInfo = this.data.goodsInfo;
    if (goodsInfo.model.length == 0 && (!goodsInfo.attributes || goodsInfo.attributes.length == 0)) {
      this.sureAddToShoppingCart();
      return;
    }
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: true,
      threeselectGood: false,
    })
  },
  typeThreeSelectGoods:function(e){
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    this.setData({
      threeselectGood:true,
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: false,
      imageOrVideo: 'image'
    })
  },
  hiddeAddToShoppingCart: function(){
    this.setData({
      addToShoppingCartHidden: true,
      showAllCarBtn: false
    })
  },
  initSelectSubModel: function (goods) {
    let items = Object.values(goods.model_items_object); // 转成数组
    let defaultGoods = items.find(item => item.stock > 0);
    let selectModelInfo = {};
    selectModelInfo.models_text = defaultGoods.model_name.split('|').map(item=> `“${item}” `).join('');
    selectModelInfo.models = defaultGoods.model.split(',');
    selectModelInfo.price = defaultGoods.price;
    selectModelInfo.stock = defaultGoods.stock;
    selectModelInfo.modelId = defaultGoods.id;
    selectModelInfo.imgurl = defaultGoods.img_url == "" ? goods.cover : defaultGoods.img_url;
    selectModelInfo.virtualPrice = defaultGoods.price;
    selectModelInfo.min_sales_nums = defaultGoods.min_sales_nums;
    selectModelInfo.vipPrice =  defaultGoods.vip_price ||  defaultGoods.price;
    selectModelInfo.buyCount = 1 < defaultGoods.min_sales_nums ? defaultGoods.min_sales_nums : 1;
    selectModelInfo.goods_id = goods.id;
    selectModelInfo.goods_type = goods.goods_type;
    this.setData({
      selectModelInfo,
    })
  },
  selectSubModel: function(e){
    var dataset = e.target.dataset,
        modelIndex = dataset.modelIndex,
        submodelIndex = dataset.submodelIndex,
        data = {},
        selectModels = this.data.selectModelInfo.models,
        model = this.data.goodsInfo.model,
        text = '',
        goodsInfo = JSON.parse(JSON.stringify(this.data.goodsInfo));
    if (selectModels[modelIndex] == model[modelIndex].subModelId[submodelIndex]){
      selectModels[modelIndex] = '';
    }else{
      selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];
    }
    goodsInfo.model_items.forEach(item => {
      if (item.model == selectModels.join(',')) { 
        data['selectModelInfo'] = item;
        data['selectModelInfo.min_sales_nums'] = +item.min_sales_nums || 1;
      } 
    })
    if (selectModels.indexOf('') != -1){
      data['selectModelInfo'] = {};
    }else {
      for (let i = 0; i < selectModels.length; i++) {
        let selectSubModelId = model[i].subModelId;
        for (let j = 0; j < selectSubModelId.length; j++) {
          if (selectModels[i] == selectSubModelId[j]) {
            text += '“' + model[i].subModelName[j] + '” ';
          }
        }
      }
      data['selectModelInfo.models_text'] = text;
    }
    data['selectModelInfo.models'] = selectModels;
    this.setData(data);
    this.resetSelectCountPrice();
  },
  selectSubAttrs: function(e) {
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
      }else {
        selectAttrs[attrIndex] = Object.prototype.toString.call(selectAttrs[attrIndex]) === "[Object Object]" ? selectAttrs[attrIndex] : {};
      }
      attrs[attrIndex].elem[subAttrIndex].is_selected = status == 0 ? true : false;
      selectAttrs[attrIndex][subAttrIndex] = attrs[attrIndex].elem[subAttrIndex];
      data['selectAttrInfo.attrs'] = selectAttrs;
    this.setData(data);
  },
  selectGoodsPackage: function(e) {
    let { status,goodsId } = e.target.dataset;
    let param = 'goods_id=' + goodsId + '&status=' + status + '&franchisee=' + this.data.franchiseeId;
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    app.turnToPage("/eCommerce/pages/setMeal/setMeal?" + param);
  },
  resetSelectCountPrice: function(){
    var selectModelIds = this.data.selectModelInfo.models.join(','),
        modelItems = this.data.goodsInfo.model_items,
        data = {};
    let defaultCount = 1;
    modelItems.forEach(item => {
      if (item.model == selectModelIds && +item.min_sales_nums) {
        defaultCount = item.min_sales_nums;
      }
    })
    data['selectModelInfo.buyCount'] = defaultCount;
    for (var i = modelItems.length - 1; i >= 0; i--) {
      if(modelItems[i].model == selectModelIds){
        data['selectModelInfo.stock'] = modelItems[i].stock;
        data['selectModelInfo.price'] = modelItems[i].price;
        data['selectModelInfo.modelId'] = modelItems[i].id;
        data['selectModelInfo.imgurl'] = modelItems[i].img_url;
        data['selectModelInfo.vipPrice'] = modelItems[i].vip_price || modelItems[i].price;
        data['selectModelInfo.virtualPrice'] = modelItems[i].virtual_price;
        data['selectModelInfo.buyCount'] = +modelItems[i].min_sales_nums || 1;
        break;
      }
    }
    this.setData(data);
  },
  clickMinusButton: function(e){
    var count = this.data.selectModelInfo.buyCount;
    let min_sales_nums = this.data.goodsInfo.min_sales_nums;
    if(count <= min_sales_nums || count <= 1){
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count - 1
    });
  },
  clickPlusButton: function(e){
    var selectModelInfo = this.data.selectModelInfo,
        count = selectModelInfo.buyCount - 0,
        stock = selectModelInfo.stock - 0;
    if (!selectModelInfo.price){
      app.showModal({ content: '请选择规格' });
      return;
    }
    if(count >= stock) {
      app.showModal({content: '购买数量不能大于库存'});
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count + 1
    });
  },
  checkGoodsAttribute: function() {
    var param = {
        form_data: {
          attributes: []
        },
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: this.data.franchiseeId || '',
        message_notice_type: 1
      };
    let goodsInfo = this.data.goodsInfo;
    if (goodsInfo.model_items.length && !param.model_id){
      app.showModal({
        content: '请选择规格'
      })
      return;
    }
    if (goodsInfo.attributes) {
      this.data.selectAttrInfo.attrs.forEach(item => {
        if (Array.isArray(item)) {
          item.forEach(subItem=> {
            if (subItem.is_selected) {
              param.form_data.attributes.push({
                id: subItem.id,
                num: 1,
              });
            }
          })
        }else if (typeof item == 'object') {
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
    return param;
  },
  sureAddToShoppingCart: function(){
    var that = this;
    let param = this.checkGoodsAttribute();
    if(!param){return};
    param.action = 2;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      method: 'post',
      success: function(res){
        app.showToast({
          title: '添加成功',
          icon: 'success'
        });
        app.sendUseBehavior([{goodsId: that.data.goodsId}], 4);
        setTimeout(function(){
          that.hiddeAddToShoppingCart();
        }, 1000);
      }
    })
  },
  buyDirectlyNextStep: function(e){
    if (this.data.isEvoucher) {
      this.evoucherBuyDirectlyNextStep();
      return;
    }
    var { franchiseeId, isEvoucher} = this.data,
        that = this;
    let param = this.checkGoodsAttribute();
    if(!param){return};
    app.sendRequest({ 
      url: '/index.php?r=AppShop/addCart',
      data: param,
      method: 'post',
      success: function(res){
        var cart_arr = [res.data],
          pagePath = '/eCommerce/pages/previewGoodsOrder/previewGoodsOrder?cart_arr='+ encodeURIComponent(cart_arr);
        franchiseeId && (pagePath += '&franchisee='+franchiseeId);
        that.hiddeAddToShoppingCart();
        if (that.getDefaultPickUpTypeVal != -1 && that.data.goodsInfo.pick_up_type.indexOf(that.getDefaultPickUpTypeVal) > -1) {
          pagePath += '&type=' + that.getDefaultPickUpTypeVal;
        }
        if (isEvoucher) {
          pagePath = `${pagePath}&isEvoucher=1`;
        }
        app.turnToPage(pagePath);
      }
    })
  },
  evoucherBuyDirectlyNextStep: function() {
    let that = this;
    let { selectModelInfo, goodsId, franchiseeId, goodsInfo } = this.data;
    let goodsParams = {
      goods_id: goodsId, // 商品ID
      model_id: selectModelInfo.modelId || 0,  // 商品规格
      num: selectModelInfo.buyCount,           // 商品数量
      stock: selectModelInfo.stock             // 商品库存
    };
    let param = this.checkGoodsAttribute();
    if (!param) { return };
    if (goodsInfo.valid_date_type == 2) {
      let endDate = goodsInfo.end_date_time * 1000;
      let timestamp = new Date().getTime();
      if (timestamp > endDate) {
        app.showModal({
          content: '卡券已过期，无法购买',
          confirmText: '知道了',
          confirm: function () {
            that.hiddeAddToShoppingCart();
            that.setData({
              evoucherNotVaild: true
            });
          }
        });
        return;
      }
    }
    if (app.isLogin()) {
      turnToOrderPreview();
    } else {
      app.goLogin({
        success: () => {
          turnToOrderPreview();
        }
      });
    }
    function turnToOrderPreview() {
      let pagePath =  `/evoucher/pages/evoucherOrderPreview/evoucherOrderPreview?cart_goods_arr=${encodeURIComponent(JSON.stringify(goodsParams))}`;
      franchiseeId && (pagePath += '&franchisee='+ franchiseeId);
      app.turnToPage(pagePath);
      that.hiddeAddToShoppingCart();
    }
  },
  makeAppointment: function(){
    let that = this;
    if(!app.isLogin()){
      app.goLogin({
        success: function () {
          that.makeAppointment();
        }
      });
      return;
    }
    let franchiseeId = this.data.franchiseeId,
        unitTime = this.data.modelStrs[0] && this.data.modelStrs[0].substring(this.data.modelStrs[0].length-1),
        unitType = this.data.unitType != 6 ? (unitTime == '分' ? 1 : (unitTime == '时' ? 2 : 3)) : '6',
        pagePath = '/eCommerce/pages/makeAppointment/makeAppointment?detail='+this.data.goodsId+(franchiseeId ? '&franchisee='+franchiseeId : '') +('&param=' + unitType)
    app.turnToPage(pagePath);
  },
  inputBuyCount: function(e){
    var count = +e.detail.value,
        selectModelInfo = this.data.selectModelInfo,
        goodsInfo = this.data.goodsInfo,
        stock = +selectModelInfo.stock;
    if(count >= stock) {
      count = stock;
      app.showModal({content: '购买数量不能大于库存'});
    }
    if (count < goodsInfo.min_sales_nums) {
      count = +goodsInfo.min_sales_nums;
      app.showModal({ content: '购买数量不能少于起卖数' });
    }
    this.setData({
      'selectModelInfo.buyCount': +count
    });
  },
  showQRCodeComponent:function(e){
    if (e.detail.userInfo) {
      let that = this;
      let goodsInfo = this.data.goodsInfo;
      let userInfo = e.detail.userInfo;
      let animation = wx.createAnimation({
        timingFunction: "ease",
        duration: 400,
      });
      let param = {
        obj_id: that.data.goodsId,
        type: this.data.isSeckill ? 5 : 1,
        text: goodsInfo.title,
        price: goodsInfo.goods_price,
        goods_img: goodsInfo.img_urls ? goodsInfo.img_urls[0] : goodsInfo.cover,
        max_can_use_integral: goodsInfo.max_can_use_integral,
        integral: goodsInfo.integral,
        sub_shop_id: that.data.franchiseeId,
        p_id: app.globalData.p_id || '',
        virtual_price: goodsInfo.virtual_price != 0 ? goodsInfo.max_virtual_price > goodsInfo.min_virtual_price ? goodsInfo.min_virtual_price + '-' + goodsInfo.max_virtual_price : goodsInfo.virtual_price : ''
      }
      app.sendRequest({
        url: '/index.php?r=AppDistribution/DistributionShareQRCode',
        data: param,
        success: function (res) {
          animation.bottom("0").step();
          let canvasStyle = goodsInfo.poster_css == 2 ? { width: 542, height: 905 } : { width: 553, height: 896 };
          that.setData({
            "pageQRCodeData.shareDialogShow": 0,
            "pageQRCodeData.shareMenuShow": true,
            "pageQRCodeData.goodsInfo": res.data,
            "pageQRCodeData.userInfo": userInfo,
            "pageQRCodeData.animation": animation.export(),
            "pageQRCodeData.recommend_status": that.data.goodsInfo.recommend_status,
            "pageQRCodeData.couponTypeName": that.data.couponTypeName || '',
            "pageQRCodeData.couponName": that.data.couponName || '',
            "pageQRCodeData.goodsType": 0,
            "pageQRCodeData.drawType": goodsInfo.poster_css || 1,
            "pageQRCodeData.canvasStyle": canvasStyle
          })
          that.selectComponent('#pageQRCodeData').showPageCode()
        }
      })
    }
  },
  showShareMenu: function(){
    app.showShareMenu();
  },
  makePhoneCall: function(){
    app.makePhoneCall(this.data.appointmentPhone);
  },
  hideShareMenu: function(){
    this.setData({
      hideShareMenu: true
    })
  },
  showPageCode: function(){
  },
  oneSelectDetailCommet: function(e){
    this.setData({
      detailCommetType: e.target.dataset.type
    })
  },
  getAssessList: function (commentType, page, append) {
    var that = this;
    app.getAssessList({
      method: 'post',
      data: {
        goods_id: that.data.goodsId,
        idx_arr: {
          idx: 'level',
          idx_value: commentType
        },
        page: page,
        page_size: 20,
        sub_shop_app_id: this.data.franchiseeId
      },
      success: function (res) {
        var commentData = res.data;
        if (append) {
          commentData = that.data.commentArr.concat(commentData);
        }
        that.setData({
          commentArr: commentData,
          commentNums: res.num,
          commentPage: that.data.commentPage + 1,
          commentExample: res.data[0] || '',
          commentTotalPage: res.total_page,
          displayComment: that.data.goodsInfo.goods_type === '0' ? (+res.num[0] > 0 ? false : true) : (that.data.goodsInfo.appointment_info && that.data.goodsInfo.appointment_info.display_comment == '1' ? that.data.goodsInfo.appointment_info.display_comment : '')
        })
      }
    });
  },
  clickPlusImages: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  carouselIndex: function (event){
    this.setData({
      carouselCurrentIndex: event.detail.current + 1
    })
  },
  toCouponList: function (){
    app.turnToPage('/eCommerce/pages/couponReceiveListPage/couponReceiveListPage');
  },
  toRecommendGoodsDetail: function(event){
    app.turnToGoodsDetail(event);
  },
  getAppECStoreConfig: function () {
    let _this = this;
    app.getAppECStoreConfig((res) => {
      let cardtype = res.card_type;
      cardtype = cardtype && cardtype.length == 1 ? cardtype[0] : 0
      _this.setData({
        appBECStoreConfig: res,
        cardtype: cardtype,
        storeStyle: res.color_config,
        showStock: (res.detail_fields && res.detail_fields.stock == 1) ? true : false,
        isShowVirtualPrice: (res.detail_fields && res.detail_fields.virtual_price == 1) ? true : false,
      })
      if (_this.data.appBECStoreConfig.recv_coupon_switch == 1) {
        _this.getCoupons();
      }
      if (res.detail_fields_shop_list && res.detail_fields_shop_list.self_delivery_shop_list == 1) {
        _this.setData({
          showSelfDeliveryShopList: (res.detail_fields && res.detail_fields_shop_list.self_delivery_shop_list == 1) ? true : false
        })
        _this.getDeliveryList();
      }
    }, _this.data.franchiseeId);
  },
  startPlayVideo: function () {
    let video = wx.createVideoContext('carousel-video');
    this.setData({
      videoPoster: true
    })
    video.play();
  },
  footPrintRight: function(){
    let index = this.data.footPrintIndex - 1;
    if (index + this.data.goodsViewRecordList.length <= 0){return};
    this.setData({
      footPrintIndex: index
    })
  },
  footPrintLeft: function(){
    let index = this.data.footPrintIndex + 1;
    if (index > 0) { return };
    this.setData({
      footPrintIndex: index
    })
  },
  hideCompeletFoot: function(event){
    this.setData({
      showFootPrint: !this.data.showFootPrint
    })
  },
  hideFootPrint: function(){
    let animation = this.animation;
    animation.top('-100%').step();
    this.setData({
      animationData: animation.export()
    })
    setTimeout(() => {
      this.setData({
        footPrintIndex: 0,
        showFootPrint: false
      })
    },400)
  },
  stopPropagation: function(event){
  },
  onPullDownRefresh: function(){
    if(this.data.franchiseeId){
      wx.stopPullDownRefresh();
      return;
    }
    this.getGoodsViewRecordList();
  },
  toGoodsFootPrint: function(){
    this.hideFootPrint();
    app.turnToPage('/eCommerce/pages/goodsFootPrint/goodsFootPrint');
  },
  getGoodsViewRecordList: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/goodsViewRecordList',
      data: {
        page: 1,
        page_size: 10,
        goods_id: _this.data.goodsId
      },
      chain: app.globalData.hasFranchiseeChain,
      success: function (res) {
        if(!res.data.length){return};
        let animation = wx.createAnimation({
          duration: 500,
          timingFunction: 'linear',
        })
        _this.animation = animation;
        animation.top(0).step();
        _this.setData({
          showFootPrint: true,
          goodsViewRecordList: res.data
        })
        _this.setData({
          animationData: animation.export()
        })
      },
      complete: function(){
        wx.stopPullDownRefresh()
      }
    })
  },
  goFootPrintDetail: function(event){
    this.hideFootPrint();
    let appId = event.currentTarget.dataset.appId;
    let url = '/detailPage/pages/goodsDetail/goodsDetail?detail=' + event.currentTarget.dataset.id;
    let franchisee = appId === app.globalData.appId ? '' : '&franchisee=' + appId;
    app.turnToPage(url + franchisee);
  },
  addFavoriteGoods: function(event){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/addFavoriteGoods',
      data: {
        form_id: event.detail.formId,
        goods_id: _this.data.goodsId,
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        wx.showToast({
          title: '收藏成功!',
          image: '/images/favorites.png'
        })
        _this.setData({
          'goodsInfo.is_favorite': 1
        })
        app.sendUseBehavior([{goodsId: _this.data.goodsId}],3);
      },
      complete: function(){
      }
    })
  },
  deleteFavoriteGoods: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteFavoriteGoods',
      method: 'post',
      data: {
        goods_id_arr: [_this.data.goodsId],
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        _this.setData({
          'goodsInfo.is_favorite': 0
        })
        app.sendUseBehavior([{goodsId: _this.data.goodsId}],3,2);
      },
      complete: function () {
        wx.showToast({
          title: '取消收藏!',
          image: '/images/cancel-favorites.png'
        })
      }
    })
  },
  getUserSetEvents: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=EventMessage/getEventByBehavior',
      hideLoading: true,
      data: {
        behavior: 14,
        sub_shop_app_id: that.data.franchiseeId
      },
      success: function (res) {
        if (+res.status === 0) {
          let eventsData = res.data;
          let eventsDataLen = eventsData && eventsData.length;
          let eventsDataArr = [];
          if (eventsData && eventsDataLen) {
            for (let i = 0; i < eventsDataLen; i++) {
              let tempObj = {};
              let trigger = eventsData[i].trigger;
              tempObj.id = eventsData[i].id;
              tempObj.tally = trigger.condition.tally;
              eventsDataArr.push(tempObj);
            }
          }
          that.setData({
            userSetEventsArr: eventsDataArr
          });
          that.countPageStaySeconds();
        } else {
          console.log(res.data);
        }
      },
    });
  },
  countPageStaySeconds: function () {
    let that = this;
    let dataObj = this.data;
    let userEventsArr = dataObj.userSetEventsArr;
    let userEventsLen = userEventsArr && userEventsArr.length;
    let timerSeconds = dataObj.pageStaySeconds || 0;
    if (userEventsArr && userEventsLen) {
      let countPageStaySecondsTimer = setInterval(function () {
        timerSeconds += 1;
        for (let i = 0; i < userEventsLen; i++) {
          let eventId = userEventsArr[i].id;
          let currentTimer = userEventsArr[i].tally;
          if (+currentTimer === timerSeconds) {
            that.timerTriggerEvent(eventId);
          }
          if (timerSeconds > userEventsArr[userEventsLen - 1].tally) {
            clearInterval(countPageStaySecondsTimer);
            that.setData({
              countPageStaySecondsTimer: ''
            });
          }
        }
        that.setData({
          pageStaySeconds: timerSeconds,
        });
      }, 1000);
      this.setData({
        countPageStaySecondsTimer: countPageStaySecondsTimer
      });
    }
  },
  timerTriggerEvent: function (eventId) {
    if (eventId) {
      let dataObj = this.data;
      let goodsId = dataObj.goodsId || '';
      let goodsName = dataObj.goodsInfo.title;
      app.sendRequest({
        url: '/index.php?r=EventMessage/triggerEvent',
        method: 'post',
        hideLoading: true,
        data: {
          event_id: eventId,
          form_data: {
            'goods_id': goodsId,
            'goods_name': goodsName,
          },
          sub_shop_app_id: dataObj.franchiseeId,
        },
        success: function (res) {}
      });
    }
  },
  getGoodsLimit: function () {
    let that = this;
    app.getGoodsLimit(this.data.goodsId, this.data.franchiseeId).then((data) => {
      if (data) {
        that.setData({
          isVipLimit: !data.vip_limit, // 会员限购
          isGoodsLimit: !data.goods_limit, // 商品限购
        });
      }
    });
  },
  startFoot: function(event){
    let startX = event.changedTouches[0].clientX;
    this.footStartX = startX;
  },
  endFoot: function(event){
    let endX = event.changedTouches[0].clientX;
    let currentIndex = this.data.footPrintIndex;
    if (endX - this.footStartX > 0){
      currentIndex++;
      if (currentIndex > 0) { return };
    } else if(endX - this.footStartX < 0){
      currentIndex--;
      if (currentIndex + this.data.goodsViewRecordList.length <= 0) { return };
    }
    this.setData({
      footPrintIndex: currentIndex
    })
  },
  turnToGoodsRecommend: function () {
    let data = this.data;
    app.sendRequest({
      url: '/index.php?r=AppShop/UpdateGoods',
      data: {
        form_data: JSON.stringify(data.goodsInfo),
      },
      method:'post',
      success: function(res){
        if (res.status){
          wx.showToast({
            title: res.data,
          })
        }else{
          if (wx.openBusinessView) {
            wx.openBusinessView({
              businessType: 'friendGoodsRecommend',
              extraData: {
                product: {
                  item_code: data.goodsInfo.id,
                  title: data.goodsInfo.title,
                  image_list: data.goodsInfo.img_urls
                }
              },
              success: function (res) {
              },
              fail: function (res) {
              }
            })
          }
        }
      },
    })
  },
  joinGroupChat:function(){
    this.setData({
      showGroupModal: true
    })
  },
  closeGroupChat:function(){
    this.setData({
      showGroupModal: false
    })
  },
  getViewGoodUserInfo:function() {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getViewGoodsUserInfoByGoodsId',
      method: 'get',
      hideLoading: true,
      data: {
        goods_id: this.data.goodsId,
        page_size:6,
        page:1,
        sub_shop_app_id: _this.data.franchiseeId,
      },
      success: function (res) {
        let viewGoodsUserList = res.data.length > 5 ? res.data.slice(0, 5) : res.data;
        _this.setData({
          viewGoodsUserList:viewGoodsUserList
        })
      }
    });
  },
  getOnSaleGoodsCount:function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetExtraGoodsDetail',
      method: 'get',
      data: {
        sub_shop_app_id: _this.data.franchiseeId,
        is_parent_shop_goods: 1 // 多商家显示从总店复制到子店的商品
      },
      success: function (res) {
        _this.setData({
          onSaleGoodsCount: res.data.on_sale_goods_count,
          popular_goods_list: res.data.popular_goods_list,
        })
      }
    });
  },
  getShareToMomentsSwitch: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppData/GetShareToMomentsSwitch',
      data: {
      },
      success: function (res) {
        that.setData({
          showShare: res.data
        });
      }
    });
  },
  showAllshoppingCartBtn: function(){
    this.setData({
      showAllCarBtn: true,
      addToShoppingCartHidden: false
    })
  },
  getDefaultPickUpType: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetNormalDefaultPickUpType',
      method: 'get',
      success: function (res) {
        if (res.data) {
          _this.getDefaultPickUpTypeVal = res.data
        }
      }
    });
  },
  turnToGoodsDetail: function (event) {
    let dataset = event.currentTarget.dataset;
    let id = dataset.id;
    let style = dataset.style;
    let appId = dataset.appId;
    let franchiseeId = appId === app.getAppId() ? this.data.franchiseeId : appId;
    let franchiseeParam = franchiseeId ? ('&franchisee=' + franchiseeId) : '';
    if (style == 3) {
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + franchiseeParam);
    } else {
      app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + franchiseeParam);
    }
  },
  bindEventTapHandler: function (e) {
    let form = e.currentTarget.dataset.eventParams;
    let action = form.action;
    let args = [form];
    if (this.data.franchiseeId) {
      args.push(this.data.franchiseeId);
    }
    customEvent.clickEventHandler[action] && customEvent.clickEventHandler[action].apply(null, args);
  },
  turnToArticle: function (event) {
    if (event.currentTarget.dataset.articleType == 3) {
      this.bindEventTapHandler(event);
      return;
    }
    let id = event.currentTarget.dataset.id;
    let franchiseeId = this.data.franchiseeId || app.getChainId() || '';
    let franchiseeParam = franchiseeId ? ('&franchisee=' + franchiseeId) : '';
    app.turnToPage('/informationManagement/pages/newsDetail/newsDetail?detail=' + id + franchiseeParam);
  },
  gotoCouponDetail: function (event) {
    let id = event.currentTarget.dataset.couponId;
    let franchiseeParam = this.data.franchiseeId ? ('&franchisee=' + this.data.franchiseeId) : '';
    app.turnToPage('/pages/couponDetail/couponDetail?couponStatus=recieve&detail=' + id + franchiseeParam);
  },
  goLivePlay: function(e) {
    let liveId = e.currentTarget.dataset.id;
    let paramstr = '';
    if(app.globalData.PromotionUserToken){
      paramstr = '&custom_params=' + encodeURIComponent(JSON.stringify({
        user_token: app.globalData.PromotionUserToken
      }));
    }
    app.turnToPage('plugin-private://wx2b03c6e691cd7370/pages/live-player-plugin?room_id=' + liveId + paramstr);
  },
  turnToBack: function() {
    app.turnBack();
  },
  toggleEvoucherIntroDialog: function(){
    this.setData({
      showEvoucherIntroDialog: !this.data.showEvoucherIntroDialog
    });
  },
  showGoodsIntro: function () {
    let { showMoreIntro } = this.data;
    this.setData({
      showMoreIntro: !showMoreIntro
    });
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
})
