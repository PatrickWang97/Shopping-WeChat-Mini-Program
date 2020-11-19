var app = getApp()
var util = require('../../../utils/util.js');
var WxParse = require('../../../components/wxParse/wxParse.js');
const customEvent = require('../../../utils/custom_event.js');
Page({
  data: {
    goodsId: '',
    goodsInfo: {},
    modelStrs: {},
    selectAttrInfo: {
      attrs: []
    },
    selectModelInfo: {
      models: [],
      stock: '',
      price: '',
      virtualPrice: '',
      buyCount: 1,
      models_text : ''
    },
    pageQRCodeData:{
      shareDialogShow: "100%",
      shareMenuShow: false,
    },
    commentArr: [],
    commentNums: [],
    commentExample: '',
    commentPage: 1,
    commnetType: 0,
    commentTotalPage: '',
    defaultPhoto: '',
    allStock: '',
    addToShoppingCartHidden: true,
    ifAddToShoppingCart: true,
    priceDiscountStr: '',
    priceDiscountStrOne:'',
    page_hidden: true,
    appointmentPhone:'',
    detailCommetType: 'detail',
    carouselCurrentIndex: 1,
    imageOrVideo: 'image',
    storeStyle: '',
    showFreight:false,
    activityCareStatus:false,
    showCouponsList: false,
    couponName: '',
    viewGoodsUserCount: 0,
    showSelfDeliveryShopList: true,
    store_list_data: [],
    is_more: 0,
    onSaleGoodsCount: 0,
    popular_goods_list: [],
    scrollTop: 0,
    titleList: [{
      title: '商品',
      select: true
    },
    {
      title: '评价',
      select: false
    },
    {
      title: '详情',
      select: false
    }],
    titleListOne: [
      {
        title: '商品详情',
        select: false
      },
    ],
    viewGoodsUserList: [],
    showShare: false,
    isVipLimit: false, // 是否达商品会员限购
    isGoodsLimit: false, // 是否商品件数限购
    leader_list: [],   //团长列表
    scene: null
  },
  goodDetailTop: [],
  page_size: 2,
  page: 1,
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
    var goodsId = options.id,
    seckill_activity_id = options.seckill_activity_id || options.sec_act_id || 0,
    seckill_activity_time_id = options.seckill_activity_time_id || options.sec_t_id || 0,
    seckillType = options.seckillType ||  options.secType || 0,
        contact = options.contact || '',
        franchiseeId = options.franchisee || '',
        cartGoodsNum = options.cart_num || 0,
        defaultPhoto = app.getDefaultPhoto(),
        goodsType = options.goodsType || 0,
        userToken = options.user_token || '',
        hidestock = options.hidestock || '',
        isShowVirtualPrice = options.isShowVirtualPrice || '';
    this.setData({
      communityType: options.communityType || options.ct,  //ct为海报分享所带参数
      goodsId: goodsId,
      seckill_activity_id: seckill_activity_id,
      seckill_activity_time_id: seckill_activity_time_id,
      seckillType : seckillType,
      contact: contact,
      defaultPhoto: defaultPhoto,
      franchiseeId: franchiseeId,
      cartGoodsNum: cartGoodsNum,
      goodsType : goodsType,
      isSeckill : true,
      hidestock : hidestock == 'true' ? true : false,
      isShowVirtualPrice: isShowVirtualPrice == 'true' ? true : false,
      sessionFrom: options.franchisee || app.getAppId() || '',
    })
    this.dataInitial();
    this.showActivityCare();
    if(userToken){
      app.globalData.PromotionUserToken = userToken;
    }
    this.videoContext = wx.createVideoContext('goodsDetail-video');
    this.getOnSaleGoodsCount();
    this.getViewGoodUserInfo();
    let _this = this;
    setTimeout(function () {
      var query = wx.createSelectorQuery();
      query.select('#goodDetail').boundingClientRect()
      query.select('#goodComment').boundingClientRect()
      query.selectViewport().scrollOffset()
      query.exec(function (res) {
        _this.goodDetailTop = res
      })
    }, 1000)
    this.getShareToMomentsSwitch();
  },
  onReachBottom: function(){
    if (this.data.detailCommetType == 'comment' && this.data.commentPage <= this.data.commentTotalPage){
      this.getAssessList(this.data.commentType, this.data.commentPage, 1);
    }
  },
  onShareTimeline: function (e) {
    return {
      imageUrl: this.data.goodsInfo.share_img || '',
      title: this.data.goodsInfo.share_title || this.data.goodsInfo.title,
      query: app.getShareQuery(this.data.options || Object.assign(this.data.franchiseeInfo || {}, {isSubShop: true}))
    }
  },
  dataInitial: function () {
    var that = this;
    if (!this.data.franchiseeId){
      this.getAppECStoreConfig();
    }
    this.getGoodsLimit();
    let data ={};
    if (this.data.seckillType == 1){
      data = {
        data_id: this.data.goodsId,
        sub_shop_app_id: this.data.franchiseeId,
        is_seckill: 1,
        seckill_activity_arr: {
          seckill_activity_id: this.data.seckill_activity_id,
          seckill_activity_time_id: this.data.seckill_activity_time_id,
        },
        is_seckill_activity: this.data.seckillType
      }
    }else{
      data = {
        data_id: this.data.goodsId,
        sub_shop_app_id: this.data.franchiseeId,
        is_seckill: 1,
        is_seckill_activity: this.data.seckillType
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data:data,
      method: 'post',
      success:function(res){
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
        contact = this.data.contact,
        franchiseeId = this.data.franchiseeId,
        cartGoodsNum = this.data.cart_num || '',
        isSeckill = this.data.isSeckill,
        title = this.data.goodsInfo.share_title,
        shareImage = this.data.goodsInfo.share_image ? this.data.goodsInfo.share_image : this.data.goodsInfo.img_urls && this.data.goodsInfo.img_urls[0] ? this.data.goodsInfo.img_urls[0]:this.data.goodsInfo.cover,
        urlSeckill = isSeckill ? '&goodsType=seckill' : '',
        urlPromotion = app.globalData.PromotionUserToken ? '&user_token=' + app.globalData.PromotionUserToken : '',
        path = '/seckill/pages/seckillDetail/seckillDetail?id=' + goodsId + '&contact=' + contact + (franchiseeId ? '&franchisee=' + franchiseeId + '&cart_num=' + cartGoodsNum : '') + urlSeckill + urlPromotion + '&seckill_activity_id=' + that.data.seckill_activity_id + '&seckill_activity_time_id=' + that.data.seckill_activity_time_id + '&seckillType=' + that.data.seckillType + '&communityType=' + this.data.communityType;
    app.sendUseBehavior([{goodsId: goodsId}],2);
    return app.shareAppMessage({
      path: path,
      title: title,
      imageUrl: shareImage,
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
  onUnload: function () {
    if(this.downcount){
      this.downcount.clear();
    }
  },
  goToMyOrder: function(){
    var franchiseeId = this.data.franchiseeId,
        pagePath = '/eCommerce/pages/myOrder/myOrder?goodsType=' + this.data.goodsInfo.goods_type + '&currentIndex=0' + (franchiseeId ? '&franchisee='+franchiseeId : '');
    app.turnToPage(pagePath, true);
  },
  goToShoppingCart: function(){
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/shoppingCart/shoppingCart'+(franchiseeId ? '?franchisee='+franchiseeId : '');
    app.turnToPage(pagePath, true);
  },
  goToHomepage: function(){
    let that = this;
    let franchiseeId = that.data.franchiseeId;
    let chainId = app.getChainId();
    if (franchiseeId && franchiseeId != chainId){
      let pages = getCurrentPages();
      let p = pages[pages.length-2];
      if (p && p.route == 'franchisee/pages/goodsMore/goodsMore') {
        app.turnBack({ delta: 2 });
      }else{
        customEvent.clickEventHandler['to-franchisee']({'franchisee-id': franchiseeId});
      }
    }else{
      var router = app.getHomepageRouter();
      app.reLaunch({url: '/pages/'+router+'/'+router});
    }
  },
  goToCommentPage: function(){
    var franchiseeId = this.data.franchiseeId,
      pagePath = '/eCommerce/pages/goodsComment/goodsComment?detail='+this.data.goodsId+(franchiseeId ? '&franchisee='+franchiseeId : '');
    app.turnToPage(pagePath);
  },
  goodsCoverOnload: function(e){
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
        selectStock, selectPrice, selectModelId, matchResult,selectVirtualPrice,selectText = '',
        selectImgurl = '',
        appointment_desc,
        appointmentPhone;
        goods.pick_up_type.forEach(getType => {
          if (getType == 1) {
            this.setData({
              showFreight: true
            })
          }
        });
        this.setData({
          unitType: unitType,
          appointmentDesc: goods.appointment_info && goods.appointment_info.appointment_desc ? goods.appointment_info.appointment_desc.replace(/<br \/>/g, "\r\n") : '更多优惠资讯详情请联系商家!',
          appointmentPhone: goods.appointment_info && goods.appointment_info.appointment_phone ? goods.appointment_info.appointment_phone:'',
          displayComment:goods.appointment_info &&  goods.appointment_info.display_comment == '1' ?goods.appointment_info.display_comment : ''
        });
        makePhone:
    WxParse.wxParse('wxParseDescription', 'html', description, _this, 10);
    for(var key in goods.model){
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
          selectModels.push(model.subModelId[0]);
          modifySelectModels = selectModels.toString();
          selectText += '“' + model.subModelName[0] + '” ';
        }
      }
    }
    if(goods.model_items.length){
      var items = goods.model_items;
      for (let i = 0; i < items.length; i++) {
        let seckill_price = +items[i].seckill_price;
        let modifyGoodsmodelseckill = items[i].model;
        goods.seckill_highPrice = goods.seckill_highPrice >= seckill_price ? goods.seckill_highPrice : seckill_price;
        goods.seckill_lowPrice = goods.seckill_lowPrice <= seckill_price ? goods.seckill_lowPrice : seckill_price;
        allStock += Number(items[i].seckill_stock);
        if(modifyGoodsmodelseckill == modifySelectModels){
          selectPrice = items[i].seckill_price;
          selectStock = items[i].seckill_stock;
          selectModelId = items[i].id;
          selectImgurl = items[i].img_url;
        }
      }
    } else {
      selectPrice = goods.seckill_price;
      selectStock = goods.seckill_stock;
      allStock = goods.seckill_stock;
      selectImgurl = goods.cover;
    }
    goods.model = goodsModel;
    if (Number(goods.max_can_use_integral) != 0 ) {
        discountStr = '（积分可抵扣' + (Number(goods.max_can_use_integral) / 100) + '元）';
        discountStrOne = (Number(goods.max_can_use_integral) / 100) + '元';
    }
    let expressSort = goods.goods_express_data.express_fee_sort;
    if (expressSort.length == 1) {
      let express = expressSort[0];
      if (express == 0) {
        goods.express_fee = '包邮';
      } else {
        goods.express_fee = express + '元';
      }
    } else {
      goods.express_fee = expressSort[0] + '~' + expressSort[1] + '元';
    }
    if(goods.is_seckill == 1){
      goods.downCount = {
        hours : '00' ,
        minutes : '00' ,
        seconds : '00'
      };
      if(goods.seckill_start_state == 0){
        _this.downcount = app.beforeSeckillDownCount(goods , _this , 'goodsInfo');
      }else if(goods.seckill_start_state == 1){
        _this.downcount = app.duringSeckillDownCount(goods , _this , 'goodsInfo');
      }
    }
    if (goods.recommend_type && +goods.recommend_type === 0) {
      goods.recommend_info = [];
    } else {
      this._setRecommendInfo(goods);
    }
    let loaclDayTime = new Date(new Date().toLocaleDateString()).getTime()/1000;
    let tomorrowTime = loaclDayTime + 86400 ;
    let afterTomorrowTime = tomorrowTime + 86400;
    let date = new Date(goods.seckill_start_timestamp * 1000);
    let m = date.getMonth()+1;
    let d = date.getDate();
    let h = date.getHours();
    let min = date.getMinutes();
    goods.seckill_startTime='';
    if (goods.seckill_start_timestamp <= tomorrowTime){
      goods.startDay = 1;
    }else if (goods.seckill_start_timestamp > tomorrowTime && goods.seckill_start_timestamp <= afterTomorrowTime){
      goods.startDay = 2;
      if (min == '00') {
        goods.seckill_startTime = '明日' + h + '点整开抢';
      } else if (min != '00' && min < 10) {
        goods.seckill_startTime = '明日' + h + ':0' + min + '开抢'
      } else {
        goods.seckill_startTime = '明日' + h + ':' + min + '开抢'
      }
    } else if (goods.seckill_start_timestamp > afterTomorrowTime){
      goods.startDay = 2;
      if (min == '00') {
        goods.seckill_startTime = m + '月' + d + '日' + h + '点整开抢';
      } else if (min != '00' && min < 10) {
        goods.seckill_startTime = m + '月' + d + '日' + h + ':0' + min + '开抢';
      } else {
        goods.seckill_startTime = m + '月' + d + '日' + h + ':' + min + '开抢';
      }
    }
    if (this.data.seckillType == 1) { // 配送方式过滤活动秒杀
      for (let i = 0; i < goods.pick_up_type.length;i++) {
        goods.pick_up_type[i] == 4 && goods.pick_up_type.splice(i,1);
      }
    }
    if (this.data.communityType != 1) { 
      for (let i = 0; i < goods.pick_up_type.length;i++) {
        goods.pick_up_type[i] == 5 && goods.pick_up_type.splice(i,1);
      }
    }
    _this.setData({
      goodsInfo: goods,
      modelStrs: modelStrs,
      'selectModelInfo.imgurl' : selectImgurl || '',
      allStock: allStock || '',
      priceDiscountStr: discountStr || '',
      priceDiscountStrOne: discountStrOne || '',
    });
    if (!goods.model.length) {
      _this.setData({
        'selectModelInfo.models': selectModels || '',
        'selectModelInfo.stock': selectStock || '',
        'selectModelInfo.price': selectPrice || '',
        'selectModelInfo.modelId': selectModelId || '',
        'selectModelInfo.models_text': selectText || '',
        'selectModelInfo.imgurl': selectImgurl || '',
        'selectModelInfo.virtualPrice': selectVirtualPrice || '',
      })
    }
    if (goods.model && goods.model.length) {
      _this.initSelectSubModel(goods); 
    }
    _this.getAssessList(0, 1);
  },
  initSelectSubModel: function(goods) {
    let items = Object.values(goods.model_items_object); // 转成数组
    let defaultGoods = items.find(item => item.seckill_stock > 0);
    let selectModelInfo = {};
    selectModelInfo.models_text = defaultGoods.model_name.split('|').map(item=> `“${item}” `).join('');
    selectModelInfo.models = defaultGoods.model.split(',');
    selectModelInfo.price = defaultGoods.seckill_price;
    selectModelInfo.stock = defaultGoods.seckill_stock;
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
  showBuyDirectly: function(e){
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    let goodsInfo = this.data.goodsInfo;
    if (goodsInfo.model.length == 0 && (!goodsInfo.attributes || goodsInfo.attributes.length == 0)) {
      this.buyDirectlyNextStep();
      return;
    }
    if(this.data.isSeckill && this.data.goodsInfo.seckill_start_state != 1){
      app.showModal({content: '当前秒杀商品不在秒杀时间范围内，不能立即购买'});
      return ;
    }
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: false,
      imageOrVideo: 'image'
    })
  },
  showAddToShoppingCart: function(e){
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    if(this.data.isSeckill && this.data.goodsInfo.seckill_start_state == 2){
      app.showModal({content: '当前秒杀已结束，不能加入购物车'});
      return ;
    }
    this.setData({
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: true,
      imageOrVideo: 'image'
    })
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
        data = {},
        selectModels = this.data.selectModelInfo.models,
        model = this.data.goodsInfo.model,
        text = '';
    selectModels[modelIndex] = model[modelIndex].subModelId[submodelIndex];
    for (let i = 0; i < selectModels.length; i++) {
      let selectSubModelId = model[i].subModelId;
      for (let j = 0; j < selectSubModelId.length; j++) {
        if( selectModels[i] == selectSubModelId[j] ){
          text += '“' + model[i].subModelName[j] + '” ';
        }
      }
    }
    data['selectModelInfo.models'] = selectModels;
    data['selectModelInfo.models_text'] = text;
    this.setData(data);
    this.resetSelectCountPrice();
  },
  resetSelectCountPrice: function(){
    var _this = this,
        selectModelIds = this.data.selectModelInfo.models.join(','),
        modelItems = this.data.goodsInfo.model_items,
        data = {};
    for (var i = modelItems.length - 1; i >= 0; i--) {
      if(modelItems[i].model == selectModelIds){
        if(_this.data.isSeckill){  //假如是秒杀
          data['selectModelInfo.stock'] = modelItems[i].seckill_stock;
          data['selectModelInfo.price'] = modelItems[i].seckill_price;
          data['selectModelInfo.modelId'] = modelItems[i].id;
          data['selectModelInfo.imgurl'] = modelItems[i].img_url;
          data['seckill_activity_goods_id'] = modelItems[i].seckill_activity_goods_id
        }else{
          data['selectModelInfo.stock'] = modelItems[i].stock;
          data['selectModelInfo.price'] = modelItems[i].price;
          data['selectModelInfo.modelId'] = modelItems[i].id;
          data['selectModelInfo.imgurl'] = modelItems[i].img_url;
          data['selectModelInfo.virtualPrice'] = modelItems[i].virtual_price;
        }
        break;
      }
    }
    this.setData(data);
  },
  clickMinusButton: function(e){
    var count = this.data.selectModelInfo.buyCount;
    if(count <= 1){
      return;
    }
    this.setData({
      'selectModelInfo.buyCount': count - 1
    });
  },
  clickPlusButton: function(e){
    var selectModelInfo = this.data.selectModelInfo,
        goodsInfo = this.data.goodsInfo,
        count = selectModelInfo.buyCount,
        stock = selectModelInfo.stock;
    if(count >= stock) {
      app.showModal({content: '购买数量不能大于库存'});
      return;
    }
    if(this.data.isSeckill && count >= goodsInfo.seckill_buy_limit){
      app.showModal({content: '购买数量不能大于秒杀限购数量'});
      return ;
    }
    this.setData({
      'selectModelInfo.buyCount': count + 1
    });
  },
  sureAddToShoppingCart: function(){
    var param ={};
    if (this.data.seckillType == 0) {
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: this.data.franchiseeId || '',
        is_seckill: 1
      };
    } else {
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: this.data.franchiseeId || '',
        is_seckill: 1,
        form_data: {
          seckill_activity_id: this.data.seckill_activity_id,
          seckill_activity_time_id: this.data.seckill_activity_time_id,
          seckill_activity_goods_id: this.data.seckill_activity_goods_id
        }
      };
    }
    if(this.data.communityType == 1){
      app.globalData.groupRefreshList = true;  //为了更新社区团购组件的购物车气泡
      this.detailParam(param).then((param) => {
        this.subAddSeckillCart(param)
      })
    }else{
      this.subAddSeckillCart(param)
    }
  },
  subAddSeckillCart: function(param){
    let _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppShop/addCart',
      data: param,
      method:'post',
      success: function(res){
        _this.hiddeAddToShoppingCart();
        app.showToast({
          title: '添加成功',
          icon: 'success'
        });
        app.sendUseBehavior([{goodsId: _this.data.goodsId}], 4);
      },
      successShowModalConfirm: function(res){
        if(res.status == 3){  //该团长对此商品无权限，请选择其他团长
          _this.showLeaderDialog();
        }
      }
    })
  },
  buyDirectlyNextStep: function(e){
    var franchiseeId = this.data.franchiseeId,
        param = {};
    if (this.data.seckillType == 0){
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: franchiseeId || '',
        is_seckill: 1,
      };
    }else{
      param = {
        goods_id: this.data.goodsId,
        model_id: this.data.selectModelInfo.modelId || '',
        num: this.data.selectModelInfo.buyCount,
        sub_shop_app_id: franchiseeId || '',
        is_seckill: 1,
        form_data: {
          seckill_activity_id: this.data.seckill_activity_id,
          seckill_activity_time_id: this.data.seckill_activity_time_id,
          seckill_activity_goods_id: this.data.seckill_activity_goods_id,
        },
      };
    }
    if(this.data.communityType == 1){
      this.detailParam(param).then((param) => {
        this.addSeckillCart(param);
      });
    }else{
      this.addSeckillCart(param);
    }
  },
  detailParam: function(param){
    return new Promise((resolve, reject) => {
      if(this.data.resetSelectLeaderInfor){
        Object.assign(param, {
          leader_token: app.globalData.leaderInfo.user_token,
          pick_up_type: [5],
          is_single_goods: 1,
          dis_group_id: -1
        })
        resolve(param);
        return;
      }
      if(app.isLogin()){
        this.getDistributorGroupLeaderLocking().then((res) => {
          if(res){
            Object.assign(param, {
              leader_token: app.globalData.leaderInfo.user_token,
              pick_up_type: [5],
              is_single_goods: 1,
              dis_group_id: -1
            })
            resolve(param);
          }else{
            this.showLeaderDialog();
          }
        })
        return;
      }
      app.goLogin({
        success: () => {
          this.detailParam(param);
        }
      })
    })
  },
  addSeckillCart: function(param){
    let _this = this;
    let franchiseeId = this.data.franchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: param,
      method: 'post',
      success: function(res){
        var cart_arr = [res.data],
          pagePath = '/seckill/pages/previewSeckillOrder/previewSeckillOrder?cart_arr=' + encodeURIComponent(cart_arr) + '&secType=' + _this.data.seckillType;
        if(_this.data.communityType == 1){
          let { selectModelInfo } = _this.data;
          cart_arr = [{
            num: selectModelInfo.buyCount,
            id: res.data,
          }]
          pagePath = `/promotion/pages/communityGroupOrderSubmit/communityGroupOrderSubmit`;
        }
        franchiseeId && (pagePath += '&franchisee='+franchiseeId);
        _this.hiddeAddToShoppingCart();
        let urlOptions = {
          cart_arr: cart_arr
        }
        app.turnToPage(pagePath, '', urlOptions);
      },
      successShowModalConfirm: function(res){
        if(res.status == 3){  //该团长对此商品无权限，请选择其他团长
          _this.showLeaderDialog();
        }
      }
    })
  },
  getDistributorGroupLeaderLocking() {
    let _this = this;
    return new Promise((resolve, reject) => {
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppDistributionExt/getDistributorGroupLeaderByUserToken',
        success: function (res) {
          if(res.data){
            let leaderInfo = res.data.leader_info;
            app.globalData.leaderInfo = leaderInfo
            _this.setData({leaderInfo})  //社区团购结算页需要用到
            resolve(true);
          }else {
            resolve(false);
          }
        }
      })
    })
  },
  makeAppointment: function(){
    var franchiseeId = this.data.franchiseeId,
        unitTime = this.data.modelStrs[0] && this.data.modelStrs[0].substring(this.data.modelStrs[0].length-1),
        unitType = unitTime == '分' ? 1:(unitTime == '时'? 2 : 3),
        pagePath = '/eCommerce/pages/makeAppointment/makeAppointment?detail='+this.data.goodsId+(franchiseeId ? '&franchisee='+franchiseeId : '') +('&param=' + unitType)
    app.turnToPage(pagePath);
  },
  inputBuyCount: function(e){
    var count = +e.detail.value,
        selectModelInfo = this.data.selectModelInfo,
        goodsInfo = this.data.goodsInfo,
        stock = +selectModelInfo.stock;
    if (this.data.isSeckill && count > +goodsInfo.seckill_buy_limit) {
      count = goodsInfo.seckill_buy_limit;
      app.showModal({ content: '购买数量不能大于秒杀限购数量' });
    } else if(count > stock) {
      count = stock;
      app.showModal({content: '购买数量不能大于库存'});
    }
    this.setData({
      'selectModelInfo.buyCount': +count
    });
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
        obj_id: that.data.goodsId,
        text: goodsInfo.share_title || goodsInfo.title,
        price: (goodsInfo.highPrice > goodsInfo.lowPrice && goodsInfo.lowPrice != 0 ? (goodsInfo.lowPrice + ' ~ ' + goodsInfo.highPrice) : goodsInfo.price),
        goods_img: goodsInfo.img_urls ? goodsInfo.img_urls[0] : goodsInfo.cover,
        sub_shop_id: that.data.franchiseeId,
        type:that.data.seckillType == 0?5:21,
        seckill_activity_arr:{
          seckill_activity_id: that.data.seckillType == 1?this.data.seckill_activity_id:'',
          seckill_activity_time_id: that.data.seckillType == 1 ?this.data.seckill_activity_time_id:'',
        },
        ct: this.data.communityType  //社区团购
      },
      method:'post',
      success: function (res) {
        let canvasStyle = goodsInfo.poster_css == 2 ? { width: 492, height: 780 } : { width: 616, height: 996 };
        res.data.stock = goodsInfo.seckill_activity_goods_stock ? goodsInfo.seckill_activity_goods_stock : goodsInfo.seckill_stock;
        animation.bottom("0").step();
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.goodsInfo.isSeckill":1,
          "pageQRCodeData.goodsInfo.seckill_price": goodsInfo.seckill_price,
          "pageQRCodeData.goodsInfo.seckill_stock": goodsInfo.seckill_activity_goods_stock ? goodsInfo.seckill_activity_goods_stock : goodsInfo.seckill_stock,
          "pageQRCodeData.animation": animation.export(),
          "pageQRCodeData.goodsType": 2,
          "pageQRCodeData.drawType": goodsInfo.poster_css || 1,
          "pageQRCodeData.canvasStyle": canvasStyle
        })
      }
    })
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
  getAssessList: function (commnetType, page, append) {
    var that = this;
    app.getAssessList({
      method: 'post',
      data: {
        goods_id: that.data.goodsId,
        idx_arr: {
          idx: 'level',
          idx_value: commnetType
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
  clickCommentLabel: function (e) {
    var commentType = e.target.dataset.type,
      data = {};
    data.commentPage = 1;
    data.commnetType = commentType;
    this.setData(data);
    this.getAssessList(commentType, 1);
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
  changeImageOrVideo: function(event){
    this.setData({
      videoPoster: false,
      imageOrVideo: event.currentTarget.dataset.type
    })
  },
  toRecommendGoodsDetail: function(event){
    app.turnToGoodsDetail(event);
  },
  getAppECStoreConfig: function(){
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
    });
  },
  startPlayVideo: function () {
    let video = wx.createVideoContext('carousel-video');
    this.setData({
      videoPoster: true
    })
    video.play();
  },
  formSubmitRemind: function (e) {
    let data = e.currentTarget.dataset;
    let goodsInfo = data.goods;
    let that = this;
    if (data.is_deleted == 0 && goodsInfo.seckill_activity_id == 0) {
      app.requestSubscribeMessage([{
        type: 16, 
        obj_id: data.goods.id,
      }]).then(()=> {
        that.newFormSubmitRemind(e)
      })
    } else {
      that.newFormSubmitRemind(e);
    }
  },
  newFormSubmitRemind:function(e){
    let _this = this;
    let formid = '';
    let goodsInfo = e.currentTarget.dataset.goods
    if (e.detail.formId !='the formId is a mock one'){
      formid = e.detail.formId
    };
    let loaclDayTime = new Date(new Date().toLocaleDateString()).getTime() / 1000;
    let seventDay = 86400 * 7;
    if (goodsInfo.seckill_start_timestamp > loaclDayTime + seventDay) {
      wx.showModal({ content: '请于开抢前7天来设置哦' });
      return;
    }
    let data = e.currentTarget.dataset;
    let newData={};
      app.sendRequest({
        url: '/index.php?r=AppShop/setActivityGoodsCare',
        method: 'post',
        data: {
          data_id: goodsInfo.id,
          activity_type:1,                                                                                                                   
          activity_id: goodsInfo.seckill_activity_id,
          seckill_activity_arr:{
            seckill_activity_time_id: goodsInfo.seckill_activity_time_id,
            form_id: formid
          },
          is_deleted: data.is_deleted,
        },
        success: function (res) {
          if (!res.status) {
            if (data.is_deleted == 0) {
              wx.showModal({
                title: '提示',
                content: '开抢前3分钟提醒你哦',
                showCancel: false,
              })
              newData['goodsInfo.is_seckill_activity_care'] = 1;
              newData['goodsInfo.seckill_activity_care'] = Number(goodsInfo.seckill_activity_care) + 1
            } else {
              wx.showModal({
                title: '提示',
                content: '提醒已取消，到时你会抢不到哦!',
                showCancel: false,
              })
              newData['goodsInfo.is_seckill_activity_care'] = 0;
              newData['goodsInfo.seckill_activity_care'] = Number(goodsInfo.seckill_activity_care) - 1
            }
            _this.setData(newData);
          }
        },
      })
  },
   addFavoriteGoods: function (event) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/addFavoriteGoods',
      data: {
        form_id: event.detail.formId,
        goods_id: _this.data.goodsId,
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        _this.setData({
          'goodsInfo.is_favorite': 1
        })
      },
      complete: function () {
        wx.showToast({
          title: '收藏成功!',
          image: '/images/favorites.png'
        })
      }
    })
  },
  deleteFavoriteGoods: function () {
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
      },
      complete: function () {
        wx.showToast({
          title: '取消收藏!',
          image: '/images/cancel-favorites.png'
        })
      }
    })
  },
  showActivityCare:function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetAppSeckillConfig',
      method: 'post',
      data: {},
      success: function (res) {
        if(res.data){
          _this.setData({
            'activityCareStatus': res.data.config_data.switch == 1?true:false
          })
        }
      },
    })
  },
  joinGroupChat: function () {
    this.setData({
      showGroupModal: true
    })
  },
  closeGroupChat: function () {
    this.setData({
      showGroupModal: false
    })
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
          let couponTypeName = ['满减券', '打折券', '代金券', '兑换券', '储值券', '通用券', '次数券'];
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
  gotoVipBenefits: function (e) {
    let franchiseeId = this.data.franchiseeId;
    let id = e.currentTarget.dataset.id;
    let cardtype = e.currentTarget.dataset.cardtype;
    app.turnToPage('/eCommerce/pages/vipBenefits/vipBenefits?id=' + id + '&cardtype=' + cardtype + (franchiseeId ? '&franchisee=' + franchiseeId : ''));
  },
  getDeliveryList: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getSelfDeliveryList',
      data: {
        sub_shop_app_id: _this.data.franchiseeId,
        page_size: _this.page_size,
        page: _this.page
      },
      success: function (res) {
        if (res.data) {
          _this.setData({
            store_list_data: _this.data.store_list_data.concat(res.data.store_list_data),
            is_more: res.is_more
          })
        }
      }
    })
  },
  getmoreshop: function () {
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
  srcollToTop: function (e) {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  }, 
  getOnSaleGoodsCount: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetExtraGoodsDetail',
      method: 'get',
      data: {
        sub_shop_app_id: _this.data.franchiseeId
      },
      success: function (res) {
        console.log(res)
        _this.setData({
          onSaleGoodsCount: res.data.on_sale_goods_count,
          popular_goods_list: res.data.popular_goods_list,
        })
      }
    });
  },
  typeThreeSelectGoods: function (e) {
    let formId = [];
    formId.push(e.detail.formId);
    app.saveUserFormId({ form_id: formId });
    this.setData({
      threeselectGood: true,
      addToShoppingCartHidden: false,
      ifAddToShoppingCart: false,
      imageOrVideo: 'image'
    })
  },
  changeNav: function (e) {
    this.setData({
    })
    if (e.detail[2].select) {
      var miss = this.goodDetailTop[2].scrollTop + this.goodDetailTop[0].top - 85;
      wx.pageScrollTo({
        scrollTop: miss,
        duration: 300
      });
    } else if (e.detail[0].select) {
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 300
      });
    } else {
      var miss = this.goodDetailTop[2].scrollTop + this.goodDetailTop[1].top - 85;
      wx.pageScrollTo({
        scrollTop: miss,
        duration: 300
      });
    }
  },
  getViewGoodUserInfo: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getViewGoodsUserInfoByGoodsId',
      method: 'get',
      hideLoading: true,
      data: {
        goods_id: this.data.goodsId,
        page_size: 6,
        page: 1,
        sub_shop_app_id: _this.data.franchiseeId,
      },
      success: function (res) {
        let viewGoodsUserList = res.data.length > 5 ? res.data.slice(0, 5) : res.data;
        _this.setData({
          viewGoodsUserList: viewGoodsUserList
        })
      }
    });
  },
  showAllshoppingCartBtn: function () {
    this.setData({
      showAllCarBtn: true,
      addToShoppingCartHidden: false
    })
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
    const params = {
      page: -1,
      form: 'goods',
    };
    Object.assign(params, options);
    app.sendRequest({
      url: '/index.php?r=AppShop/GetGoodsList',
      data: params,
      method: 'post',
      success: ({ data, status }) => {
        if (status === 0) {
          this.setData({
            'goodsInfo.recommend_info': data
          })
        }
      }
    })
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
  showLeaderDialog: function (type) {
    let _this = this;
    this.setData({
      isshowLeaderDialog: true
    })
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
      data: {
        goods_id: _this.data.goodsId,
        page: -1,
        agent_check: 1,
        is_audit: 1,
        group_id: -1
      },
      success: function (res) {
        _this.setData({
          leader_list: res.data
        })
      }
    })
  },
  selectLeader: function (e) {
    let index = e.currentTarget.dataset.index;
    let leaderList = this.data.leader_list;
    let leaderInfo = leaderList[index];
    app.globalData.leaderInfo = leaderInfo;
    this.distributorGroupLeaderLocking();
    this.setData({
      isshowLeaderDialog: false,
      leaderInfo: leaderInfo,
      resetSelectLeaderInfor: true
    })
  },
  hideLeaderDialog: function () {
    this.setData({
      isshowLeaderDialog: !this.data.isshowLeaderDialog
    })
  },
  distributorGroupLeaderLocking() {
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/distributorGroupLeaderLocking',
      data: {
        leader_token: app.globalData.leaderInfo.user_token
      }
    })
  },
})
