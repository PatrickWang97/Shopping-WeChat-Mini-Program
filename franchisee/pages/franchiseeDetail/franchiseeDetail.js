var app = getApp();
var thisPage = '';
var WxParse = require('../../../components/wxParse/wxParse.js');
var customEvent = require('../../../utils/custom_event.js');
const dataType = function (data) {
  return Object.prototype.toString.call(data).match(/^\[object\s(\w+)\]$/)[1];
}
const checkDataType = function (data, typeString) {
  return (dataType(data)).toLowerCase() === typeString.toLowerCase();
}
const hasOwnProperty = function (data, property) {
  if (typeof data.hasOwnProperty === 'function') {
    return data.hasOwnProperty(property);
  }
  return Object.prototype.hasOwnProperty.call(data, property);
}
const ifHasDataType = function (data, typeArr) {
  return typeArr.some(_type => {
    return checkDataType(data, _type);
  });
}
const getRightAttrVal = function (path, target) {
  /\]$/.test(path) && (path = path.slice(0, -1));
  let pathArr = path.replace(/\]?\[|\]\.?/g, '.').split(/\./);
  let len = pathArr.length;
  let key;
  let result = target;
  while (ifHasDataType(result, ['object', 'array']) && len > 0) {
    key = pathArr.shift();
    result = result[key];
    len--;
  }
  return result;
}
const pickAttrObject = function (attrs, target) {
  let result = {};
  if (checkDataType(attrs, 'object') && checkDataType(target, 'object')) {
    for (let k in attrs) {
      if (hasOwnProperty(attrs, k)) {
        result[k] = getRightAttrVal(attrs[k], target);
      }
    }
  }
  return result;
}
const getDiviceWidth = function (fn) {
  let dw = app.getSystemInfoData()['windowWidth'];
  let self = this;
  return function () {
    let args = Array.prototype.slice.call(arguments, 0);
    args.unshift(dw);
    return fn.apply(self, args);
  }
}
const transformRpxToPx = getDiviceWidth(function (dw, num) {
  return num * dw / 750;
})
const downLoadImage = function (imgUrl) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url: imgUrl,
      success: resolve,
      fail: reject
    })
  });
}
const drawImage = function (ctx, url, x, y, w, h) {
  x = transformRpxToPx(x);
  y = transformRpxToPx(y);
  w = transformRpxToPx(w);
  h = transformRpxToPx(h);
  return downLoadImage(`${app.globalData.siteBaseUrl}/index.php?r=Download/DownloadResourceFromUrl&url=${url}`).then(({tempFilePath}) => {
    if (tempFilePath) {
      ctx.drawImage(tempFilePath, x, y, w, h);
      ctx.draw(true);
      return Promise.resolve();
    }
  }).catch(err => {
    console.log(err);
  })
}
const drawText = function (ctx, text, x, y, s, color) {
  x = transformRpxToPx(x);
  y = transformRpxToPx(y);
  s = transformRpxToPx(s);
  ctx.setFontSize(s);
  ctx.setFillStyle(color);
  ctx.fillText(text, x, y);
  return Promise.resolve();
}
const drawMultiLineText = function (ctx, text, w, x, y, s, color, ml) {
  let textArr = [],
    everyNum = Math.ceil(w / s),
    textLen = text.length,
    lh = s * 1.5,
    i = 0;
  while (i < textLen) {
    textArr.push(text.substr(i, everyNum));
    i += everyNum;
  }
  if (ml && textArr.length > ml) {
    textArr = textArr.slice(0, ml);
    textArr[textArr.length - 1] = textArr[textArr.length - 1].slice(0, everyNum - 3) + '...';
  }
  return Promise.all(textArr.map(function (v, k) {
    return drawText(ctx, v, x, y + (k * lh), s, color);
  }));
}
const drawRect = function (ctx, x, y, w, h, color) {
  x = transformRpxToPx(x);
  y = transformRpxToPx(y);
  w = transformRpxToPx(w);
  h = transformRpxToPx(h);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.setFillStyle(color);
  ctx.fill()
  return Promise.resolve();
}
const drawRoundRect = function (ctx, x, y, w, h, r, color) {
  x = transformRpxToPx(x);
  y = transformRpxToPx(y);
  w = transformRpxToPx(w);
  h = transformRpxToPx(h);
  r = transformRpxToPx(r);
  ctx.beginPath()
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.lineTo(x + w, y + r)
  ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)
  ctx.lineTo(x + w, y + h - r)
  ctx.lineTo(x + w - r, y + h)
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)
  ctx.lineTo(x + r, y + h)
  ctx.lineTo(x, y + h - r)
  ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x + r, y)
  ctx.setFillStyle(color);
  ctx.fill()
  ctx.closePath()
  return Promise.resolve();
}
const drawLine = function (ctx, x1, y1, x2, y2, color) {
  x1 = transformRpxToPx(x1);
  y1 = transformRpxToPx(y1);
  x2 = transformRpxToPx(x2);
  y2 = transformRpxToPx(y2);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.setStrokeStyle(color);
  ctx.stroke();
  return Promise.resolve();
}
const drawAngelArrow = function (ctx, x, y, w, h, l, color) {
  let pointsAry = [
    [x, y, x + l, y],
    [x, y, x, y + l],
    [x + w, y, x + w - l, y],
    [x + w, y, x + w, y + l],
    [x, y + h, x + l, y + h],
    [x, y + h, x, y + h - l],
    [x + w, y + h, x + w - l, y + h],
    [x + w, y + h, x + w, y + h - l]
  ];
  return Promise.all(pointsAry.map(item => {
    item.unshift(ctx);
    item.push(color);
    return drawLine.apply(null, item);
  }))
}
Page({
  data: {
    topNavBarData:{
      title:'商家详情',
      isDefault: 0,
    },
    franchiseeId: '',
    franchiseeInfo: {},
    goodsList: [],
    appointmentList:[],
    tostoreList:[],
    onBusiness: true ,
    tabType: 'info',
    showGoodsTab: false,
    franchiseeTplPop: false,
    shopId: '',
    cateTab: 0,
    couponMore: true,
    incompleteCrossband: true,
    goodsCategroyList: [],
    vipCardInfo: '',
    pageQRCodeData: {
      shareDialogShow: "100%",
      shareMenuShow: false,
    },
    cdnUrl: app.getCdnUrl(),
    carousel: [],
    carouselPic: '',
    appShopConfig: {
      bottom_bar_type: 1, // 1: APP导航模板、2：带优惠买单模板
      float_window: {
        hidden: true, // 悬浮窗是否隐藏
      }
    },
    recomPlaceShow: true, // 是否显示推荐位
    hasSetCoupon: '',
    couponList: [],
    fixedTab: false,
    sub_qr_code: '',
    friendType: true,
    sectionList: [],
    SNSID: '',
    getSectionData: {
      page: 1,
      loading: false,
      nomore: false
    },
    elements: {}, // 页面元素
    carouselVideo: {}, // 轮播视频
    previewImages: [], // 预览图片(包含视频封面)
    withinDistribution: false, // 是否参与子店分销
    distributionInfo: {
      "first_commission": "",
      "second_commission": "",
      "distribution_type": ""
    }, // 参与子店分销的情况
    distributionShareData: {
      image_url: '',
      description: ''
    }, // 子店分享设置
    pId: '', // 分销员id
    isOnline: false, // 是否为线上版本
    promoIsDrawing: false, // 是否正在绘图
    promoModalShow: false, // 分销分享弹窗显示
    promoFriShareShow: false, // 分销分享朋友圈显示
    customPageHeight: '', // 自定义导航页面高度
    isAttention: false, //用户是否关注店铺
    favoriteMsg: '',
    activityFavorList: [],//关注动态列表
    attentionList: [], //关注列表
    attentionCount: 0,
    commentNums: [],//用户评论数
    commentArr: [],//用户评论列表
    commentType: 0,
    recommendFoods: [],
    productDefaultImgs: [ // 产品列表默认图
      {imageUrl: 'http://cdn.jisuapp.cn/zhichi_frontend/static/agent_mgt/product/product1.png'},
      {imageUrl: 'http://cdn.jisuapp.cn/zhichi_frontend/static/agent_mgt/product/product2.png'},
      {imageUrl: 'http://cdn.jisuapp.cn/zhichi_frontend/static/agent_mgt/product/product3.png'}
    ],
  },
  tabHeight: 38,
  onLoad: function(options){
    let franchiseeId = options.detail || options.franchisee;
    let that = this;
    let shopId = options.shop_id || '';
    let {
      windowHeight
    } = wx.getSystemInfoSync();
    let newdata = {};
    thisPage = this;
    newdata.franchiseeId = franchiseeId;
    newdata.shopId = shopId;
    newdata.incompleteCrossband = shopId ? true : false;
    newdata.requestFranchiseeId = shopId ? '5rdPq5605h' : franchiseeId;
    newdata["topNavBarData.topNavBarHeight"] = app.globalData.topNavBarHeight || 0;
    newdata.franchiseeIdInfo = {
      id: franchiseeId
    };
    this.setData(newdata);
    this.getAppShopConfig();
    if (shopId){ //预览店铺
      this.checkAppSubShopIsEdit();
      wx.hideShareMenu();
    }
    this.getVIPCardList();
    let query = wx.createSelectorQuery()
    query.select('#franchisee-tab').boundingClientRect();
    query.selectViewport();
    query.exec(function (res) {
      if (res[0]){
        that.tabHeight = res[0].height;
      }
    });
    app.globalData.franchiseeCommunity = false;
    this.getFavoriteMsg();
    this.getUserFavoriteList();
    this.getRecommendFoods();
  },
  onShow: function(){
    let that = this;
    if (app.globalData.franchiseeCommunity) {
      this.setData({
        getSectionData: {
          page: 1,
          loading: false,
          nomore: false
        },
        sectionList: []
      });
      app.globalData.franchiseeCommunity = false;
      this.getSectionList();
    }
    if(app.globalData.isPromotion && this.data.pId == ""){
      app.getPromotionPersonId(function (res) {
        that.setData({
          pId: getRightAttrVal('id', res.data),
        })
      })
    }
  },
  onUnload: function() {
    if (this._observerMain) this._observerMain.disconnect();
    if (this._observerGoods) this._observerGoods.disconnect();
    if (this._observerComment) this._observerComment.disconnect();
    if (this._observerInfo) this._observerInfo.disconnect();
    if (this._observerCommunity) this._observerCommunity.disconnect();
  },
  getAppShopByPage: function(elements){
    let that = this;
    let franchiseeId = this.data.franchiseeId;
    let tradeInfo = wx.getStorageSync('tradeInfo') || {};
    let param = {};
    param.sub_shop_app_id = franchiseeId;
    if(tradeInfo.app_id) param.biz_app_id = tradeInfo.app_id;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      data: param,
      success: function (res) {
        let newdata = {},
            data = res.data[0],
            has_goods_type = data.has_goods_type;
        data.business_time_str = data.business_time_str.replace(/\,/g, '；');
        data.description = data.description ? data.description.replace(/\n|\\n/g, '\n') : data.description;
        if (data.fields_data && Number(data.fields_data.desc_show_type) === 1) {
          newdata['descIsRichText'] = true;
          WxParse.wxParse('wxParseDescription', 'html', data.description, that, 10); // 解析富文本
        }
        if (data.industry_type_name && (~data.industry_type_name.search(/\-/))) { // 设定一级行业分类名称
          data.industry_type_short_name = data.industry_type_name.split(/\-/)[0];
        }
        newdata['franchiseeInfo'] = data;
        app.setPageTitle(data.name);
        newdata['topNavBarData.title'] = data.name;
        let config = that.data.appShopConfig.goods_cate;                     //goods_cate获取后已做兼容处理
        if ((elements === null || (elements.goodsShow && elements.goodsShow.isShow)) && has_goods_type.length) {
          config.forEach(item => {
            switch (item.id) {
              case 'ecommerce':
                that.getGoodsList('goods', item.form_data, item.goods_sort);
                break;
              case 'booking':
                that.getGoodsList('appointment', item.form_data, item.goods_sort);
                break;
              case 'tostore':
                that.getGoodsList('tostore', item.form_data, item.goods_sort);
                break;
            }
          })
        }else{
          newdata['tabType'] = 'info';
        }
        that.setData(newdata);
        that.getFranchiseeQRCode();
      }
    })
  },
  getGoodsList: function (form, form_data, goodsSort){
    let that = this;
    let { requestFranchiseeId, appShopConfig } = that.data;
    let key = goodsSort ? goodsSort.sort_key :  appShopConfig.goods_sort ? appShopConfig.goods_sort.sort_key : '';
    let direction = goodsSort ? goodsSort.sort_direction : appShopConfig.goods_sort ? appShopConfig.goods_sort.sort_direction : '';
    let params = {
      sub_shop_app_id: requestFranchiseeId,
      form: form,
      page: 1,
      page_size: 4,
      is_group_buy: 0,
      is_sub_shop: 1,
      sort_key: key,
      sort_direction: direction,
      is_parent_shop_goods: 1,
    }
    let idx = {
      idx: 'category',
      idx_value: ''
    };
    if (form == 'goods' && form_data ){
      idx.idx_value = form_data.id;
      params.show_package_goods = 2;
    } else if (form == 'appointment' && form_data) {
      idx.idx_value = form_data.id;
    } else if (form == 'tostore' && form_data) {
      idx.idx_value = form_data.id;
    }
    params.idx_arr = idx;
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoodsList',
      data: params,
      method: 'POST',
      success: function(res){
        let goodsList = res.data,
            newdata = {};
        if(form == 'goods'){
          newdata['goodsList'] = goodsList;
        } else if (form == 'appointment'){
          newdata['appointmentList'] = goodsList;
        } else if(form == 'tostore'){
          newdata['tostoreList'] = goodsList;
        }
        if (goodsList.length == 0 && that.data.goodsList.length == 0 && that.data.appointmentList.length == 0 && that.data.tostoreList.length == 0){
          newdata['tabType'] = 'info';
        }else{
          newdata['tabType'] = 'goods';
          newdata['showGoodsTab'] = true;
        }
        that.setData(newdata);
      }
    })
  },
  getFranchiseeQRCode: function () {
    let that = this;
    let franchiseeId = this.data.franchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShop/GenerateFranchiseeQRCode',
      data: {
        sub_app_id: franchiseeId,
        parent_app_id: app.getAppId(),
        p_u: app.globalData.p_u || ''
      },
      success: function (res) {
        let data = res.data;
        that.drawFranchiseeQRCode(data);
      }
    })
  },
  drawFranchiseeQRCode: function(QRcode) {
    let that = this;
    let { franchiseeInfo  } = this.data;
    let qrUrl = `${app.getSiteBaseUrl()}/index.php?r=Download/DownloadResourceFromUrl&url=${QRcode}`;
    let logoUrl = `${app.getSiteBaseUrl()}/index.php?r=Download/DownloadResourceFromUrl&url=${franchiseeInfo.picture}`;
    let context = wx.createCanvasContext('franchisee-qrcode');
    let imgSize = {
      width: 220,
      height: 220
    };
    drawBgImg(qrUrl, context, imgSize).then(() => {
      drawLogo(logoUrl, context, imgSize).then((codeUrl) => {
        that.setData({
          sub_qr_code: codeUrl || QRcode
        });
      }, () => {
        that.setData({
          sub_qr_code: QRcode
        });
      });
    });
    function drawBgImg(qrUrl, context, imgSize) {
      return new Promise((resolve, reject) => {
        wx.downloadFile({
          url: qrUrl,
          success(res) {
            context.drawImage(res.tempFilePath, 0, 0, imgSize.width, imgSize.height);
            context.save();
            resolve();
          },
        })
      });
    }
    function drawLogo(url, context, imgSize) {
      return new Promise((resolve, reject) => {
        wx.downloadFile({
          url: url,
          success(res) {
            context.arc(imgSize.width / 2, imgSize.height / 2, (24 / 110) * imgSize.width, 0, 2 * Math.PI);
            context.clip();
            context.drawImage(res.tempFilePath, (31 / 110) * imgSize.width, (31 / 110) * imgSize.width, (48 / 110) * imgSize.width, (48 / 110) * imgSize.width);
            context.restore();
            context.draw(true, function () {
              wx.canvasToTempFilePath({
                x: 0,
                y: 0,
                width: imgSize.width,
                height: imgSize.height,
                destHeight: imgSize.width * 2.6,
                destWidth: imgSize.width * 2.6,
                quality: 1,
                fileType: 'png',
                canvasId: 'franchisee-qrcode',
                success(res) {
                  resolve(res.tempFilePath);
                }
              })
            })
          },
          fail() {
            reject();
          }
        })
      });
    }
  },
  turnToGoodsMore:function(e){
    const { form, sort } = e.currentTarget.dataset;
    let { requestFranchiseeId, appShopConfig, elements } = this.data;
    const goodsSort = sort || appShopConfig.goods_sort;
    let paramsStr = `detail=${form}&franchisee=${requestFranchiseeId}&goodsSort=${encodeURIComponent(JSON.stringify(goodsSort))}`;
    app.turnToPage(`/franchisee/pages/goodsMore/goodsMore?${paramsStr}`);
  },
  turnToGoodsDetail: function (e) {
    const { id, type, group, groupId } = e.currentTarget.dataset;
    let { requestFranchiseeId, franchiseeInfo } = this.data;
    let paramsStr = `&franchisee=${requestFranchiseeId}`;
    if (type == 3) {
      paramsStr += `&detail=${id}`;
      app.turnToPage(`/pages/toStoreDetail/toStoreDetail?${paramsStr}`);
     } else if (type == 10) {
      app.toTradeGoodsDetail({ goodsId: id, franchiseeId: requestFranchiseeId });
      return;
    } else if (group == 1){
      paramsStr += `&goods_id=${id}&activity_id=${groupId}`;
       app.turnToPage(`/group/pages/gpgoodsDetail/gpgoodsDetail?${paramsStr}`);
    } else {
      const cartNum = franchiseeInfo.cart_goods_num || 0;
      paramsStr += `&detail=${id}&cart_num=${cartNum}`;
      app.turnToPage(`/detailPage/pages/goodsDetail/goodsDetail?${paramsStr}`);
    }
  },
  turnToCouponList:function(){
    app.turnToPage('/eCommerce/pages/couponListPage/couponListPage?franchisee=' + this.data.requestFranchiseeId);
  },
  turnToFranchiseePerfect: function () {
    app.turnToPage('/franchisee/pages/franchiseePerfect/franchiseePerfect?franchisee=' + this.data.franchiseeId + '&shop_id=' + this.data.shopId);
  },
  turnToTransferPage: function(){
    app.turnToPage('/eCommerce/pages/transferPage/transferPage?franchisee=' + this.data.franchiseeId);
  },
  turnToVipCard: function (e) {
    let { id, isPaidVip, isLeague } = e.currentTarget.dataset;
    isPaidVip = isPaidVip || '';
    app.turnToPage('/eCommerce/pages/vipCard/vipCard?detail=' + id + '&franchisee=' + this.data.requestFranchiseeId + '&is_paid_vip=' + isPaidVip + '&is_league=' + isLeague);
  },
  makePhoneCall: function(e){
    var phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  turnToFranchiseeFacility: function(){
    app.turnToPage('/franchisee/pages/franchiseeFacility/franchiseeFacility?franchisee=' + this.data.requestFranchiseeId);
  },
  turnToUsercenter: function(){
    app.turnToPage('/franchisee/pages/userCenterComponentPage/userCenterComponentPage?franchisee=' + this.data.requestFranchiseeId + '&fmode=0');
  },
  turnToShoppingCart: function(){
    var franchiseeId = this.data.requestFranchiseeId,
      pagePath = '/eCommerce/pages/shoppingCart/shoppingCart' + (franchiseeId ? '?franchisee=' + franchiseeId : '');
    app.turnToPage(pagePath);
  },
  navigateToXcx: function(e){
    let app = e.currentTarget.dataset.app;
    app.navigateToXcx({
      appId: app
    })
  },
  franchiseeAddress: function(e){
    let info = this.data.franchiseeInfo;
    app.openLocation({
      latitude: +info.latitude,
      longitude: +info.longitude,
      scale: 18,
      address: info.address_detail
    });
  },
  tabChange: function(e){
    let type = e.currentTarget.dataset.type;
    let that = this;
    let query = wx.createSelectorQuery();
    query.select('#franchisee-tab-' + type).boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(function (res) {
      let top = res[0].top + res[1].scrollTop;
      app.pageScrollTo(top - that.tabHeight - (app.globalData.topNavBarHeight || 0));
    })
  },
  showChangeTpl: function(){
    this.setData({
      franchiseeTplPop: true
    });
  },
  hiddenChangeTpl: function () {
    this.setData({
      franchiseeTplPop: false
    });
  },
  changeTpl: function (e) {
    let id = e.currentTarget.dataset.id;
    let franchiseeId = this.data.franchiseeId;
    let shopId = this.data.shopId;
    let that = this;
    if (id == 0) {
      that.setData({
        franchiseeTplPop: false
      });
    }else{
      app.goToFranchisee(id, {
        detail: franchiseeId,
        shop_id: shopId
      }, true);
    }
  },
  changeTplConfirm: function (e) {
    let franchiseeId = this.data.franchiseeId;
    let shopId = this.data.shopId;
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/UpdatModeByShopId',
      data: {
        parent_app_id: app.getAppId(),
        sub_app_id: franchiseeId,
        shop_id: shopId,
        mode_id: 0
      },
      success: function (data) {
        app.globalData.franchiseeEnterStatusRefresh = true;
        let pages = getCurrentPages();
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].page_router) {
            app.globalData['franchiseeTplChange-' + pages[i].page_router] = true;
          }
        }
        let tabBarPagePathArr = app.getTabPagePathArr();
        for (let i = 0; i < tabBarPagePathArr.length; i++) {
          let router = tabBarPagePathArr[i].split('/')[2];
          if (router) {
            app.globalData['franchiseeTplChange-' + router] = true;
          }
        }
        app.turnToPage('/franchisee/pages/franchiseeEnterStatus/franchiseeEnterStatus?franchisee=' + franchiseeId );
      }
    });
  },
  getSubShopData: function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetSubShopData',
      data: {
        parent_app_id: app.getAppId(),
        app_id: that.data.franchiseeId,
        shop_id: that.data.shopId,
        p_u: app.globalData.p_u || ''
      },
      success: function (res) {
        let data = res.data[0];
        let newdata = {};
        data.description = data.description ? data.description.replace(/\n|\\n/g, '\n') : data.description;
        if (data.fields_data && Number(data.fields_data.desc_show_type) === 1) {
          newdata['descIsRichText'] = true;
          WxParse.wxParse('wxParseDescription', 'html', data.description, that, 10); // 解析富文本
        }
        if (data.industry_type_name && (~data.industry_type_name.search(/\-/))) { // 设定一级行业分类名称
          data.industry_type_short_name = data.industry_type_name.split(/\-/)[0];
        }
        newdata['franchiseeInfo'] = data;
        that.setData(newdata);
        app.setPageTitle(data.name);
        newdata['topNavBarData.title'] = data.name;
        that.getGoodsList('goods');
        that.getGoodsList('appointment');
        that.getGoodsList('tostore');
        that.getCoupons();
      }
    });
  },
  checkAppSubShopIsEdit: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/CheckAppSubShopIsEdit',
      data: {
        parent_app_id: app.getAppId(),
        sub_app_id: that.data.franchiseeId,
        shop_id: that.data.shopId
      },
      success: function (res) {
        let is_edit = res.data.is_edit;
        that.setData({
          incompleteCrossband: is_edit == 0
        });
      }
    });
  },
  previewImage: function (e) {
    let that = this;
    let src = e.currentTarget.dataset.src;
    app.previewImage({
      current: src
    });
  },
  previewCarouselImage: function (e) {
    let that = this;
    let src = e.currentTarget.dataset.src;
    app.previewImage({
      current: src,
      urls: that.data.franchiseeInfo.carousel_imgs
    });
  },
  lookCouponMore: function () {
    this.setData({
      couponMore: !this.data.couponMore
    });
  },
  receiveCouponLoading: false,
  receiveCoupon: function (e) {
    let that = this;
    let params = {};
    let { id, index, category } = e.currentTarget.dataset;
    if (this.data.shopId) {
      app.showModal({
        content: '这是预览数据，无法领取!'
      });
      return;
    }
    if (this.receiveCouponLoading) {
      return;
    }
    this.receiveCouponLoading = true;
    params['coupon_id'] = id;
    params['sub_app_id'] = that.data.requestFranchiseeId;
    if (+category) { // 领取联盟优惠券需要带的参数
      params['alliance_coupon'] = 1;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/RecvCoupon',
      data: params,
      success: function (res) {
        app.sendUseBehavior([{'goodsId': id}],18); // 行为记录
        app.showModal({
          content: '领取成功!'
        });
        if (res.data.is_already_recv == 1){
          let newdata = {};
          newdata['franchiseeInfo.coupon_list['+index+'].recv_status'] = 0;
          newdata['couponList['+index+'].recv_status'] = 0;
          that.setData(newdata);
        }
        let currentCoupon = that.data.couponList.find(
          item => item.id === id
        )
        if (currentCoupon.type != 0 && currentCoupon.type != 4 && currentCoupon.type != 6 && currentCoupon.wx_card_id) {
          app.addToWxCard(currentCoupon.wx_card_id, res.data.user_coupon_id);
        }
      },
      complete: function () {
        that.receiveCouponLoading = false;
      }
    });
  },
  tapPrevewPictureHandler: function (event) {
    app.tapPrevewPictureHandler(event);
  },
  closeIncomplete: function () {
    this.setData({
      incompleteCrossband: false
    });
  },
  getVIPCardList: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPCardList',
      data: {
        'parent_app_id': app.getAppId(),
        'sub_app_id': that.data.requestFranchiseeId
      },
      success: function (res) {
        that.setData({
          vipCardInfo: res.data.length ? res.data[0] : null
        });
      },
      complete: function () {
      }
    });
  },
  getVIPCardForUser: function () {
    let that = this;
    if (this.data.shopId) {
      app.showModal({
        content: '这是预览数据，无法领取!'
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPCardForUser',
      data: {
        'parent_app_id': app.getAppId(),
        'sub_app_id': that.data.requestFranchiseeId
      },
      success: function (res) {
        app.showModal({
          content: '领取成功!'
        });
        that.setData({
          'vipCardInfo.is_owner': 1
        });
      },
      complete: function () {
      }
    });
  },
  getAppSubShopCarouselPhoto: function (elements) {
    let that = this;
    if (elements && elements.carousel && elements.carousel.version > 0) {
      let carousel = elements.carousel.content;
      carousel = carousel.map(item => {
        let {pic, customFeature} = item;
        if (checkDataType(customFeature, 'object')) {
          if (customFeature.action !== 'video-play') {
            customFeature.pic = pic;
          }
        }else {
          customFeature = {pic};
        }
        return {
          form_data: customFeature
        };
      });
      that.setData({
        carousel: carousel,
        carouselPic: carousel.length == 0
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppSubShopCarouselPhoto',
      data: {
        'sub_app_id': that.data.requestFranchiseeId
      },
      success: function (res) {
        let carousel = [];
        for (let i = 0; i < res.data.length; i++) {
          let c = res.data[i];
          if (c.form_data.isShow == 1) {
            carousel.push(c);
          }
        }
        that.setData({
          carousel: carousel,
          carouselPic: carousel.length == 0
        });
      },
      complete: function () {
      }
    });
  },
  clickEventHandler: function (e) {
    let form = e.currentTarget.dataset.form;
    let action = form.action;
    let franchiseeId = this.data.requestFranchiseeId;
    if(this.clickEventList[action]){
      this.clickEventList[action](form, franchiseeId);
    }else if(customEvent.clickEventHandler[action]){
      customEvent.clickEventHandler[action](form, franchiseeId, e);
    }
  },
  clickEventList: {
    'inner-link': function (form, franchiseeId) {
      let pageLink = form['page-link'] || form['inner-page-link'];
      let url = app.pageRoot[pageLink] ? app.pageRoot[pageLink] : '/franchisee/pages/' + pageLink + '/' + pageLink;
      app.turnToPage(url + '?franchisee=' + franchiseeId + '&fmode=0');
    },
    'share': function (form) {
      thisPage.showQRCodeComponent( '' , {
        goods_img: form.pageShareImgUrl || '',
        text: form.pageShareCustomText || ''
      });
    },
    'page-share': function(form){
      thisPage.showQRCodeComponent( '' , {
        goods_img: form.pageShareImgUrl || '',
        text: form.pageShareCustomText || ''
      });
    },
    'goods-classify': function (form, franchiseeId){
      let type = 'goods';
      if (form.goods_type == 0){
        type = 'goods';
      } else if (form.goods_type == 3) {
        type = 'tostore';
      } else if (form.goods_type == 1) {
        type = 'appointment';
      }
      let categroyName = form.categoryName || form.name;
      let isOpenSearch = form.isOpenSearch || false;
      app.turnToPage('/franchisee/pages/goodsMore/goodsMore?detail=' + type + '&franchisee=' + franchiseeId + '&categroy=' + form.id + '&categroyName=' + categroyName + '&isOpenSearch=' + isOpenSearch);
    },
    'video-play': function (form) {
      thisPage.getVideoUrlById(form['video-id']).then(({data}) => {
        thisPage.setData({
          ['carouselVideo.videoUrl']: data
        });
      })
    },
    'distribution-share': function (form) {
      app._isOpenPromotion((res) => {
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=AppDistribution/getDistributorInfo',
          success: function (res) {
            if (res.data && res.data.is_audit == 1 && thisPage.firstCommission) {
              thisPage.setData({
                promoModalShow: true
              });
              app.globalData.isPromotion = true;
            } else {
              if (!thisPage.firstCommission){
                app.showModal({
                content: "暂未开启推广！"
                })
                return;
              }
              app.turnToPage('/promotion/pages/promotionApply/promotionApply?isAudit=' + (res.data && res.data.is_audit) || '');
            }
          }
        })
      })
    },
    'to-promotion': function (form) {
      thisPage.clickEventList['distribution-share'](form);
    }
  },
  showQRCodeComponent: function (event, params) {
    let that = this;
    if (that.data.shopId){
      app.showModal({
        content: '店铺未审核通过，不能分享'
      })
      return;
    }
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    });
    params = params || {};
    let goods_img = params.goods_img || that.data.franchiseeInfo.picture;
    let text = params.text || that.data.franchiseeInfo.name;
    let franchiseeId = this.data.franchiseeId;
    let tabbarInfo = app.globalData.tabbarInfo[franchiseeId];
    let type = 15;
    if (tabbarInfo['homepage-router']) {
      let homeRouter = tabbarInfo['homepage-router'];
      switch (homeRouter.trim()) {
        case 'franchiseeWaimai':
          type = 14;
          break;
        case 'franchiseeTostore':
          type = 13;
          break;
        case 'franchiseeDetail4':
          type = 16;
          break;
        case 'franchiseeDetail':
          type = 15;
          break;
        default:
          break;
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppDistribution/DistributionShareQRCode',
      data: {
        obj_id: franchiseeId,
        type: type,
        text: text,
        goods_img: goods_img
      },
      success: function (res) {
        let bot = that.data.isShowBottom ? '100rpx' : '0';
        animation.bottom(bot).step();
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.animation": animation.export()
        })
      }
    })
  },
  getAppShopConfig: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShopConfig/GetAppShopConfig',
      data: {
        'sub_app_id': that.data.requestFranchiseeId,
        mode_id: 0
      },
      success: function (res) {
        let data = res.data[0] || {};
        let newdata = {};
        let elements = null;
        if (data.share_qr_data && checkDataType(data.share_qr_data, 'object')) { // 分销分享设置
          newdata.distributionShareData = {
            image_url: data.share_qr_data.cover,
            description: data.share_qr_data.title
          }
          delete data.share_qr_data;
        }
        if (data.object_data) {
          if (typeof data.object_data === 'string') {
            elements = JSON.parse(data.object_data);
          }else if (checkDataType(data.object_data, 'object')) {
            elements = data.object_data;
          }
          if (elements) {
            delete data.object_data;
            if (elements.recomPlaceStore){
              for (let place of elements.recomPlaceStore){
                place['showRecommend'] = false;
                if(place['is_show']){
                  place['showRecommend'] = true;
                }
                for (let list of place['recom_place']){
                  if (list['is_show']) {
                    place['showRecommend'] = true;
                    break;
                  }
                }
              }
              elements.recommend.content = elements.recomPlaceStore;
              delete elements.recomPlaceStore;
            }
            newdata.elements = elements;
            that.initProductPresent(elements.product || {});
            if (elements.userComment && elements.userComment.isShow) {
              that.getAssessList(0);           
            }
          }
        }
        let _goodsCate = [
          {
            title: '商品',
            id: 'ecommerce',
            is_show: true,
            form_data: {
              id: ''
            },
            goods_sort: {
              sort_key: '',
              sort_direction: 0
            }
          },
          {
            title: '预约',
            id: 'booking',
            is_show: true,
            form_data: {
              id: ''
            },
            goods_sort: {
              sort_key: '',
              sort_direction: 0
            }
          },
          {
            title: '到店',
            id: 'tostore',
            is_show: true,
            form_data: {
              id: ''
            },
            goods_sort: {
              sort_key: '',
              sort_direction: 0
            }
          }
        ]
        if (data.goods_cate && data.goods_cate.length > 0) {
          data.goods_cate.forEach((item,index) => {
            if(!item.id) {
              item.title = _goodsCate[index].title;
              item.id = _goodsCate[index].id;
            }
          })
        } else {
          data.goods_cate = _goodsCate;
        }
        that.getAppSubShopCarouselPhoto(elements); // 获取轮播数据
        that.setFloatWindow(data.float_window); // 设置悬浮窗数据
        delete data.float_window;
        newdata['recomPlaceShow'] = that.showRecomPlace(data.recom_place_type, data.recom_place);
        newdata['appShopConfig'] = data;
        that.setData(newdata);
        if (that.data.shopId) { //预览店铺
          that.getSubShopData();
        } else {
          that.getAppShopByPage(elements);
        }
        if (data.coupon_con) {
          let coupon = [];
          for (let i = 0; i < data.coupon_con.length; i++) {
            if (data.coupon_con[i].form_data) {
              coupon.push(data.coupon_con[i].form_data['coupon-id']);
            }
          }
          that.getCouponList(coupon);
        } else {
          that.getCoupons();
        }
        if (elements && !elements.ranking) {
          elements.ranking = {
            isShow: (data.sib_pos && data.sib_pos[0] && data.sib_pos[0].is_show) || false,
            name: '排行'
          }
        }
        if (elements && elements.ranking.isShow) {
          that.getGoodsRanking();
        }
        if ((elements === null || (elements.shopDynamic && elements.shopDynamic.isShow)) && data.sns_cate && data.sns_cate[0] && data.sns_cate[0].form_data && data.sns_cate[0].form_data['cate-id']){
          that.setData({
            SNSID: data.sns_cate[0].form_data['cate-id']
          })
          that.getSectionList();
        }
        that.bindObserver(elements);
      },
      complete: function () {
      }
    });
  },
  showRecomPlace: function (type, recoms) {
    if (!Array.isArray(recoms)) {
      return false;
    }
    if (type === undefined || type == 1) {
      return true;
    }
    var len = type - 0,
      checkRecoms = recoms.slice(0, len);
    for (var i = 0; i < len; i++) {
      if (+checkRecoms[i]['is_show'] === 1) {
        return true;
      }
    }
    return false;
  },
  getCouponList: function (coupon) {
    let that = this;
    let franchiseeId = this.data.requestFranchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShopConfig/GetCouponList',
      data: {
        sub_app_id: franchiseeId,
        mode_id: 0,
        ids_arr: coupon
      },
      method: 'post',
      success: function (res) {
        let data = res.data;
        that.setData({
          couponList: data,
          hasSetCoupon: data.length > 0 ? 1 : 0
        });
      }
    })
  },
  getCoupons: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAllShopCouponList',
      method: 'post',
      data: {
        sub_app_id: that.data.requestFranchiseeId,
        parent_app_id: app.getAppId(),
        page: -1,
        alliance_coupon: [0, 1],
      },
      success: function (res) {
        let newdata = {},
          data = res.data;
        newdata['couponList'] = data || [];
        newdata['hasSetCoupon'] = data.length > 0 ? 1 : 0;
        that.setData(newdata);
      }
    })
  },
  getGoods: function (id) {
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    if(!id){
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        sub_shop_app_id: franchiseeId,
        form: 'goods',
        page: 1,
        data_id: id
      },
      success: function (res) {
        var goods = res.data[0],
            newdata = {};
        newdata['appShopConfig.recom_place[0].name'] = goods.form_data.title;
        newdata['appShopConfig.recom_place[0].price'] = goods.form_data.price;
        that.setData(newdata);
      }
    })
  },
  getGoodsRanking: function () {
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    let key = that.data.appShopConfig.sib_pos && that.data.appShopConfig.sib_pos[0] ? that.data.appShopConfig.sib_pos[0].sort_key : '';
    let direction = that.data.appShopConfig.sib_pos && that.data.appShopConfig.sib_pos[0] ? that.data.appShopConfig.sib_pos[0].sort_direction : '';
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoodsList',
      data: {
        sub_shop_app_id: franchiseeId,
        is_sub_shop: franchiseeId ? 1 : 0,
        form: 'app_shop',
        page: 1,
        page_size: 5,
        goods_type: [0, 3],
        sort_key: key,
        sort_direction: direction,
      },
      method: 'post',
      success: function (res) {
        var goodsList = res.data,
            newdata = {};
        newdata['rankingGoods'] = goodsList;
        that.setData(newdata);
      }
    })
  },
  getGroupGoods: function () {
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    let id = [];
    let idObject = {};
    let group = that.data.appShopConfig.group_buy;
    for(let i = 0; i < group.length; i++){
      if (group[i].is_show == 1 && group[i].form_data){
        let goodsId = group[i].form_data['goods-id'];
        id.push(goodsId);
        idObject[goodsId] = i;
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/getGoods',
      data: {
        sub_shop_app_id: franchiseeId,
        form: 'goods',
        page: 1,
        data_ids: id
      },
      method: 'post',
      success: function (res) {
        var goods = res.data,
          newdata = {};
      }
    })
  },
  onPageScroll: function(event){
  },
  bindObserver: function(elements){
    let hasGoods = true;
    let hasShopDynamic = true;
    let hasUserComment = true;
    if (elements) {
      if (elements.goodsShow && hasOwnProperty(elements.goodsShow, 'isShow')) {
        hasGoods = elements.goodsShow.isShow;
      }
      if (elements.shopDynamic && hasOwnProperty(elements.shopDynamic, 'isShow')) {
        hasShopDynamic = elements.shopDynamic.isShow;
      }
      if (elements.userComment && hasOwnProperty(elements.userComment, 'isShow')) {
        hasUserComment = elements.userComment.isShow;
      }
    }
    let _this = this;
    let wheight = app.getSystemInfoData().windowHeight;
    _this._observerMain = wx.createIntersectionObserver(_this)
    _this._observerMain
      .relativeToViewport({
        bottom: 2-wheight
      })
      .observe('#main-section', (res) => {
        if (res.intersectionRatio > 0) {
          _this.setData({
            fixedTab: true
          })
        }else{
          _this.setData({
            fixedTab: false
          })
        }
      });
    if (hasGoods) {
      _this._observerGoods = wx.createIntersectionObserver(_this)
      _this._observerGoods
        .relativeToViewport({ top: -250, bottom: -250 })
        .observe('#franchisee-tab-goods', (res) => {
          if (res.intersectionRatio > 0) {
            _this.setData({
              tabType: 'goods'
            })
          }
        });
    }
    if (hasUserComment) {
      _this._observerComment = wx.createIntersectionObserver(_this)
      _this._observerComment
        .relativeToViewport({ top: -250, bottom: -250 })
        .observe('#franchisee-tab-score', (res) => {
          if (res.intersectionRatio > 0) {
            _this.setData({
              tabType: 'score'
            })
          }
        });
    }
    _this._observerInfo = wx.createIntersectionObserver(_this)
    _this._observerInfo
      .relativeToViewport({ top: -250, bottom: -250 })
      .observe('#franchisee-tab-info', (res) => {
        if (res.intersectionRatio > 0) {
          _this.setData({
            tabType: 'info'
          })
        }
      });
    if (hasShopDynamic && _this.data.appShopConfig.sns_cate && _this.data.appShopConfig.sns_cate[0] && _this.data.appShopConfig.sns_cate[0].form_data && _this.data.appShopConfig.sns_cate[0].form_data['cate-id']){
      _this._observerCommunity = wx.createIntersectionObserver(_this)
      _this._observerCommunity
        .relativeToViewport({ top: -250, bottom: -250 })
        .observe('#franchisee-tab-community', (res) => {
          if (res.intersectionRatio > 0) {
            _this.setData({
              tabType: 'community'
            })
          }
        });
    }
  },
  onShareAppMessage: function (event) {
    let that = this;
    let title = that.data.franchiseeInfo.name;
    let path = '/franchisee/pages/franchiseeDetail/franchiseeDetail?detail=' + that.data.franchiseeId;
    let form = event && event.target ? event.target.dataset.form : '';
    let desc = form ? form.desc : '';
    let image = form ? form.shareImage : '';
    let fromWhere = '';
    if (event.from === 'button' && event.target.dataset && (fromWhere = event.target.dataset.fromWhere)) {
      if (fromWhere === 'distribution') {
        let {
          distributionShareData: {
            image_url,
            description
          },
          franchiseeInfo: {
            picture
          }
        } = this.data;
        image = image_url || picture;
        if (!description) {
          let nickname = app.globalData.userInfo.nickname;
          description = nickname + '向你推荐了' + title + '，好店不容错过'
        }
        title = desc = description;
      }
      that.tapClosePromoModal();
    }
    if (this.data.pId != '') {
      let pId = this.data.pId;
      path += '&p_id=' + pId;
    }
    return app.shareAppMessage({
      path: path,
      title: title,
      desc: desc,
      imageUrl: image,
      franchisee: this.data.franchiseeId,
      success: function () {
      }
    })
  },
  getSectionList: function () {
    let that = this,
      sdata = that.data.getSectionData;
    let franchiseeId = that.data.requestFranchiseeId;
    if (sdata.loading || sdata.nomore) {
      return;
    }
    sdata.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppSNS/GetArticleByPage',
      data: {
        page: sdata.page,
        section_id: that.data.SNSID,
        category_id: 0,
        article_style: 1,
        article_id: '',  // （如果传了这个话题id就能获取单条话题信息）
        top_flag: 0,  //如果为1 筛选置顶帖
        hot_flag: 0,  //如果为1 筛选精品贴
        start_date: '',  // 查询开始日期
        end_date: '',   //查询结束日期
        search_value: that.data.search_value,  // 查询值
        page_size: 10,
        sub_app_id: franchiseeId
      },
      method: 'post',
      success: function (res) {
          let info = res.data,
            oldData = that.data.sectionList,
            newData = [];
          for (let i = 0; i < res.data.length; i++) {
            let idata = res.data[i],
              ctext = that.showEllipsis(idata.content.text || '');
            idata.title = unescape(idata.title.replace(/\\u/g, "%u"));
            idata.content_text = ctext.text;
            idata.isellipsis = ctext.isellipsis;
            idata.likeAnimateShow = true;
            if (idata.content.type == 2) {
              if (idata.content.url.article) {
                delete idata.content.url.article.body;
                if (idata.content.url.article.type == 3) {
                  idata.content.url.article.cover = app.globalData.cdnUrl + '/zhichi_frontend/static/webapp/images/audio_default.png';
                }
              }
            }
            let listRecomItem = getRightAttrVal('form_data.list_recommend.recommend_goods[0]', idata);
            if (listRecomItem) {
              idata.form_data.list_recommend.recommend_goods[0] = pickAttrObject({
                name: 'title',
                price: 'price',
                image: 'cover',
                id: 'id',
                goods_type: 'goods_type'
              }, listRecomItem)
            }
            newData.push(idata);
          }
          newData = oldData.concat(newData);
          that.setData({
            sectionList: newData,
            'getSectionData.page': sdata.page + 1
          });
        that.setData({
          'getSectionData.loading': false,
          'getSectionData.nomore': res.is_more == 0 ? true : false
        });
      },
      fail: function (res) {
        that.setData({
          'getSectionData.loading': false
        });
      }
    });
  },
  imgLoad: function (event) {
    let owidth = event.detail.width,
      oheight = event.detail.height,
      oscale = owidth / oheight,
      cwidth = 290,
      cheight = 120,
      ewidth, eheight,
      index = event.currentTarget.dataset.index,
      newData = {};
    if (this.data.friendType) {
      cwidth = 240;
    }
    if (oscale > cwidth / cheight) {
      ewidth = cwidth;
      eheight = cwidth / oscale;
    } else {
      ewidth = cheight * oscale;
      eheight = cheight;
    }
    newData['imgData.' + index] = {
      imgWidth: ewidth * 2.34,
      imgHeight: eheight * 2.34
    }
    this.setData(newData);
  },
  showEllipsis: function (oldtext) {
    let that = this,
      padding = that.data.friendType ? 70 : 25,
      newtext = '',
      newtextarr = [],
      textarr = oldtext.split(/\n|\\n/),
      eachline = (app.getSystemInfoData().windowWidth - padding) / 12 * 2,
      total_line_num = 2,
      has_line_num = 0,
      isellipsis = false;
    for (let i = 0; i < textarr.length; i++) {
      let len = that.stringLength(textarr[i]),
        lenline = Math.ceil(len / eachline);
      if (has_line_num + lenline >= total_line_num) {
        let spare_line = total_line_num - has_line_num;
        newtextarr.push(that.subString(textarr[i], (spare_line * eachline - 16)) + '...');
        isellipsis = true;
        break;
      } else {
        has_line_num += lenline;
        newtextarr.push(textarr[i]);
      }
    }
    if (isellipsis) {
      newtext = newtextarr;
    } else {
      newtext = textarr;
    }
    return { text: newtext, isellipsis: isellipsis };
  },
  stringLength: function (str) {
    let realLength = 0, len = str.length, charCode = -1;
    for (let i = 0; i < len; i++) {
      charCode = str.charCodeAt(i);
      if (charCode > 128) {
        realLength += 2;
      } else {
        realLength += 1;
      }
    }
    return realLength;
  },
  subString: function (str, len) {
    let newLength = 0,
      newStr = "",
      chineseRegex = /[^\x00-\xff]/g,
      singleChar = "",
      strLength = str.replace(chineseRegex, "**").length;
    for (let i = 0; i < strLength; i++) {
      singleChar = str.charAt(i).toString();
      if (singleChar.match(chineseRegex) != null) {
        newLength += 2;
      } else {
        newLength++;
      }
      if (newLength > len) {
        break;
      }
      newStr += singleChar;
    }
    if (strLength > len) {
      newStr += "...";
    }
    return newStr;
  },
  turnToCommunityDetail: function (event) {
    let id = event.currentTarget.dataset.id,
      dataLiked = event.currentTarget.dataset.liked,
      phoneNumber = event.currentTarget.dataset.phone,
      article_style = this.data.article_style,
      communityId = this.data.communityId;
    let newData = {};
    newData.sectionList = this.data.sectionList.map(function (item, idx) {
      if (item.showCom) {
        delete item.showCom;
      }
      if (item.id === id) {
        item.read_count = +item.read_count + 1;
      }
      return item;
    });
    this.setData(newData);
    let franchiseeParam = this.data.requestFranchiseeId ? ('&franchisee=' + this.data.requestFranchiseeId) : '';
    app.turnToPage('/informationManagement/pages/communityDetail/communityDetail?detail=' + id + '&articleStyle=' + article_style + '&dataLiked=' + dataLiked + '&phoneNumber=' + phoneNumber + '&sectionid=' + communityId + franchiseeParam);
  },
  onReachBottom: function(){
    let sns = this.data.appShopConfig.sns_cate;
    let shopDynamic = this.data.elements.shopDynamic;
    if ((shopDynamic === undefined || shopDynamic.isShow) && sns && sns[0] && sns[0].form_data && sns[0].form_data['cate-id']){
      this.getSectionList();
    }
  },
  carouselVideoClose: function () {
    this.setData({
      carouselVideo: {}
    });
  },
  initProductPresent: function ({video, image}) {
    let that = this;
    let imageAry = [];
    let newdata = {};
    if (video && video[0] && video[0].imageUrl) {
      imageAry[0] = Object.assign({}, pickAttrObject({
        imageUrl: 'imageUrl',
        id: 'id'
      }, video[0]), { type: 'video' });
      this.getVideoUrlById(video[0].id).then(({ data }) => {
        if (data) {
          that.setData({
            ['previewImages[0].videoUrl']: data
          });
        }
      })
    }
    imageAry = imageAry.concat(image.map(img => Object.assign({}, img, { type: 'image' })));
    newdata.previewImages = imageAry;
    this.setData(newdata);
  },
  getVideoUrlById: function (id) {
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppVideo/GetVideoLibURL',
        data: {
          id
        },
        success: resolve,
        error: reject
      });
    })
  },
  previewVideo: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    let {
      franchiseeInfo: {
        name
      },
      franchiseeId,
      previewImages
    } = this.data;
    app.globalData.viewImgOrVideo = {
      images: previewImages,
      index: index,
      count: previewImages.length,
      title: name
    }
    app.turnToPage('/franchisee/pages/imgVideoView/imgVideoView?modeid=0&franchisee='+franchiseeId+'&index='+index);
  },
  tapShareWXFriends: function () {
    this.setData({
      promoModalShow: true
    });
  },
  setFloatWindow: function (fwData) {
    let that = this;
    if (!fwData || (fwData instanceof Array)) { // 确保有悬浮窗参数
      fwData = {"hidden":false,"content":[{"customFeature":{"action":"contact"},"pic":"https://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/suspension-customer.png","title":"客服"},{"customFeature":{"action":"inner-link","inner-page-link":"myOrder","pageRouterName":"电商页面组 / 订单管理"},"pic":"https://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/suspension-myOrder.png","title":"我的订单"},{"customFeature":{"action":"inner-link","inner-page-link":"shoppingCart","pageRouterName":"电商页面组 / 购物车"},"pic":"https://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/suspension-shopping-cart.png","title":"购物车"},{"customFeature":{"action":"top"},"pic":"https://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/suspension-top.png","title":"回到顶部"}]};
    }else if (typeof fwData === 'string') {
      fwData = JSON.parse(fwData);
    }
    Promise.all([this.getSubShopDistribution(), this.ifPromotionPerson()]).then(
      ([{data: data1}, {data: data2}]) => {
        let distributionInfo = data1,
          firstCommission = getRightAttrVal('first_commission', distributionInfo),
          pId = getRightAttrVal('id', data2),
          newdata = {};
        that.firstCommission = firstCommission;
        if (firstCommission > 0) {
          fwData.content.unshift({
            "customFeature": { "action": "distribution-share" },
            "pic": fwData.systemPic || 'https://cdn.jisuapp.cn/static/webapp/images/promotion/distribution.png',
            "title": "客服"
          });
          newdata.withinDistribution = true;
          newdata.distributionInfo = distributionInfo;
          newdata.pId = pId || '';
          that.compareHisIdWithOnline();  // 判断当前版本是否为线上版本
        }
        newdata['appShopConfig.float_window'] = fwData;
        that.setData(newdata);
      }
    ).catch(err => {
      console.log(err);
    });
  },
  getSubShopDistribution: function () {
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppDistribution/GetSubShopDistributionList',
        data: {
          app_id: this.data.franchiseeId,
          parent_app_id: app.getAppId()
        },
        success: resolve,
        fail: reject
      })
    })
  },
  tapShowPromoFriShare: function () {
    let that = this;
    this.setData({
      promoFriShareShow: true
    });
    this.createFriendsCircleShareImage()
      .then(res => {
        that.setData({
          promoIsDrawing: false
        });
      }).catch(err => {
      console.log(err);
    })
  },
  tapClosePromoModal: function () {
    this.setData({
      promoModalShow: false,
      promoFriShareShow: false
    });
  },
  getOnlineHistoryData: function () {
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppData/GetOnlineHisId',
        data: {
          page: 1
        },
        success: resolve,
        fail: reject
      })
    });
  },
  compareHisIdWithOnline: function () {
    let that = this;
    let localHisId = app.globalData.historyDataId;
    return this.getOnlineHistoryData().then(({data}) => {
      let {online_his_id} = data;
      let result = online_his_id == localHisId;
      that.setData({
        isOnline: result
      });
      return Promise.resolve(result);
    }).catch(err => {
      console.log(err);
    })
  },
  createFriendsCircleShareImage: function () {
    if (this.data.promoIsDrawing) {
      return;
    }
    let {
        distributionShareData: {
          image_url,
          description
        },
        franchiseeInfo: {
          name,
          industry_type_name,
          industry_type_short_name,
          picture
        }
      } = this.data,
      ctx = wx.createCanvasContext('promotion-canvas'),
      tagText = '',
      titleText = '',
      tagW = 0,
      tagH = 0,
      titleLeft = 0,
      step1 = null,
      step2 = null,
      step3 = null,
      step4 = null,
      step5 = null,
      step6 = null,
      step7 = null,
      step8 = null,
      step9 = null;
    image_url = image_url || picture;
    if (!description) {
      description = '新店推荐，快来体验';
    }
    industry_type_name = industry_type_short_name || industry_type_name || '其他';
    tagText = industry_type_name.length > 4 ? industry_type_name.slice(0,4) : industry_type_name;
    titleText = name.length > 7 ? (name.slice(0, 7) + '...') : name;
    tagW = tagText.length * 20 + 20;
    tagH = 32;
    titleLeft = tagW + 33;
    step1 = drawRoundRect(ctx, 0, 0, 560, 780, 10, 'rgba(255, 255, 255, 1)');
    step2 = drawImage(ctx, image_url, 20, 20, 520, 520);
    step3 = drawRect(ctx, 20, 590, tagW, tagH, 'rgba(255, 54, 0, 0.06)')
    step4 = drawText(ctx, tagText, 30, 613, 20, 'rgba(255, 54, 0, 1)');
    step5 = drawText(ctx, titleText, titleLeft, 618, 28, 'rgba(51, 51, 51, 1)');
    step6 = drawMultiLineText(ctx, description, 320, 20, 660, 22, 'rgba(153, 153, 153, 1)', 2);
    step7 = this.getWXQrcode({}).then(res => {
      return drawImage(ctx, res.data.qrcode_img_url, 379, 573, 140, 147);
    }).catch(err => {
      console.log(err);
    });
    step8 = drawAngelArrow(ctx, 367, 573, 164, 183, 16, 'rgba(255, 101, 0, 1)');
    step9 = drawText(ctx, '扫描或长按二维码', 387, 745, 16, 'rgba(102, 102, 102, 1)');
    this.setData({
      promoIsDrawing: true
    });
    return Promise.all([step1, step2, step3, step4, step5, step6, step7, step8, step9]);
  },
  savePosterIntoAlbum: function () {
    if (this.isSaving) {
      app.showToast({title: '正在保存'});
      return;
    }
    let that = this;
    this.isSaving = true;
    app.showLoading({
      title: '保存中...'
    });
    wx.canvasToTempFilePath({
      canvasId: 'promotion-canvas',
      success({tempFilePath}) {
        wx.saveImageToPhotosAlbum({
          filePath: tempFilePath,
          success: function (data) {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            });
            that.isSaving = false;
            that.tapClosePromoModal();
          },
          fail: function (res) {
            if (res && (res.errMsg === "saveImageToPhotosAlbum:fail auth deny" || res.errMsg === "saveImageToPhotosAlbum:fail:auth denied")) {
              wx.showModal({
                title: '提示',
                content: '您已经拒绝授权保存图片到您的相册，这将影响您使用小程序，您可以点击右上角的菜单按钮，选择关于。进入之后再点击右上角的菜单按钮，选择设置，然后将保存到相册按钮打开，返回之后再重试。',
                showCancel: false,
                confirmText: "确定",
                success: function (res) {
                }
              })
            }
            that.isSaving = false;
          }
        })
      }
    },this)
  },
  getWXQrcode: function (params) {
    let that = this;
    return new Promise((resolve, reject) => {
      if (that.data.shopId){
        app.showModal({
          content: '店铺未审核通过，不能分享'
        })
        reject('店铺未审核通过，不能分享');
      }
      params = params || {};
      let goods_img = params.goods_img || that.data.franchiseeInfo.picture;
      let text = params.text || that.data.franchiseeInfo.name;
      let franchiseeId = that.data.franchiseeId;
      let pId = this.data.pId;
      let tabbarInfo = app.globalData.tabbarInfo[franchiseeId];
      let type = 15;
      if (tabbarInfo['homepage-router']) {
        let homeRouter = tabbarInfo['homepage-router'];
        switch (homeRouter.trim()) {
          case 'franchiseeWaimai':
            type = 14;
            break;
          case 'franchiseeTostore':
            type = 13;
            break;
          case 'franchiseeDetail4':
            type = 16;
            break;
          case 'franchiseeDetail':
            type = 15;
            break;
          default:
            break;
        }
      }
      app.sendRequest({
        url: '/index.php?r=AppDistribution/DistributionShareQRCode',
        data: {
          obj_id: franchiseeId,
          sub_shop_id: franchiseeId,
          p_id: pId,
          type: type,
          text: text,
          goods_img: goods_img
        },
        success: resolve,
        fail: reject
      })
    })
  },
  ifPromotionPerson: function () {
    let pIdInGolbal = app.globalData.p_id;
    return new Promise((resolve, reject) => {
      if (pIdInGolbal) {
        resolve({status: 0, data:{id: pIdInGolbal}});
        return;
      }
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppDistribution/getDistributorInfo',
        success: resolve,
        fail: reject
      })
    })
  },
  toCouponDetail: function (e){
    let detail = e.currentTarget.dataset.id;
    app.turnToPage('/pages/couponDetail/couponDetail?detail=' + detail + '&franchisee=' + this.data.franchiseeId);
  },
  getFavoriteMsg: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/FavoriteMsg',
      data: {
        app_id: that.data.franchiseeId,
        parent_app_id: app.getAppId()
      },
      success: (res) => {
        if(res.data && res.data.app_id){
          that.setData({
            isAttention: res.data.status == "1" ? true : false,
            favoriteMsg: res.data
          })
        }
      }
    })
  },
  changeShopFavorite: function () {
    let that = this;
    let _isAttention = that.data.isAttention;
    let _favoriteMsg = that.data.favoriteMsg;
    let url = '/index.php?r=AppShopManage/UpdateShopFavorite';
    if (!_favoriteMsg) {
      url = '/index.php?r=AppShopManage/AddShopFavorite';
    }
    app.sendRequest({
      url: url,
      data: {
        app_id: that.data.franchiseeId,
        parent_app_id: app.getAppId()
      },
      success: (res) => {
        if(res.data){
          that.setData({
            isAttention: !_isAttention
          })
        }
        if(!_favoriteMsg){
          that.getFavoriteMsg();
        }
      }
    })
  },
  getUserFavoriteList: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/UserFavoriteBar',
      data: {
        app_id: that.data.franchiseeId,
        parent_app_id: app.getAppId()
      },
      success: (res) => {
        res.data.forEach((item, index) => {
          let len = item.nickname.length;
          if(len > 3){
            item.nickname = item.nickname[0] + "**" +item.nickname[len-1];
          }else if (len === 3) {
            item.nickname = item.nickname[0] + "*" +item.nickname[len-1];
          }else if (len === 2) {
            item.nickname = item.nickname[0] + "*";
          }
        })
        that.setData({
          activityFavorList: res.data,
          attentionList: res.extra_data,
          attentionCount: res.count,
        })    
      }
    })
  },
  toAllComment: function () {
    let _showStar = this.data.elements.userComment.isOpen ? 1 : 0;
    app.turnToPage('../franchiseeComment/franchiseeComment?showStar=' + _showStar + '&franchisee=' + this.data.franchiseeId + '&commentType=' + this.data.commentType);
  },
  clickCommentLabel: function (e) {
    let _val = e.currentTarget.dataset.type;
    this.setData({
      commentType: _val
    })
    this.getAssessList(_val);
  },
  clickPlusImages: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  getAssessList: function (type) {
    let that = this;
    app.sendRequest({
      loading: true,
      url: '/index.php?r=AppShop/GetAssessList',
      data: {
        obj_name: 'app_id',
        page_size: 10,
        page: 1,
        sub_shop_app_id: this.data.franchiseeId,
        'idx_arr[0][idx]': 'level',
        'idx_arr[0][idx_value]': type,
        'screening_arr[0][field]': 'goods_type',
        'screening_arr[0][value]': [0, 1, 3],
        'screening_arr[0][symbol]': 'in',
      },
      method: "post",
      success: res => {
        let _commentArr = res.data || [];
        let total_num = (572 / 26 * 2) * 3;
        _commentArr.map((item) => {
          let info = item.assess_info;
          let strLen = app.stringLengthComment(info.content);
          item.assess_info.score = info.score || info.tostore_score || info.appointment_score;
          if(total_num + 1 < strLen){
            item.assess_info.short_content = app.subStringComment(info.content , total_num -16) ;
            item.isShowShort = true;
          }
        })
        that.setData({
          commentArr: _commentArr,
          commentNums: res.num
        })
      }
    })
  },
  toShowAll: function (e) {
    let ind = e.currentTarget.dataset.index;
    let commentArr = 'commentArr[' + ind + '].isShowShort'
    this.setData({
      [commentArr]: false
    })
  },
  getRecommendFoods: function () {
    let that = this;
    app.sendRequest({
      url:'/index.php?r=AppShop/GetGoodsList',
      data:{
        page: 1,
        page_size: 20,
        form: 'goods',
        goods_type: [0,3],
        sub_shop_app_id: that.data.franchiseeId,
        select_type: 1,
        is_sub_shop: 1,
        is_seckill: 3,
        sort_key: 'approval'
      },
      method:"post",
      success: function (res){
        let listArr = res.data;
        listArr.forEach(item => {
          let str = item.form_data.title;
          let strLength = str.length;
          if(strLength > 10){
            item.form_data.title = str.slice(0, 9) + "...";
          }
        })
        that.setData({
          recommendFoods: listArr,
          netizensNum: res.count
        })
      }
    })
  },
  turnToRecommFood: function (e) {
    let type = e.currentTarget.dataset.type;
    app.turnToPage("/franchisee/pages/franchiseeRecomFood/franchiseeRecomFood?franchiseeId=" + this.data.franchiseeId +'&goods_type=' + type);
  },
  toRecommendDetail: function (e) {
    let _id = e.currentTarget.dataset.id;
    let ind = e.currentTarget.dataset.index;
    app.turnToPage('/franchisee/pages/franchiseeRecomDetail/franchiseeRecomDetail?id=' + _id + '&franchiseeId=' + this.data.franchiseeId + '&itemIndex=' + ind);
  },
  turnTopVipBenefits: function () {
    let { franchiseeId, vipCardInfo } = this.data;
    let pathName = vipCardInfo.is_app_shop == 1 ? 'leagueVipAdvertise' : 'vipBenefits';
    app.turnToPage(`/eCommerce/pages/${pathName}/${pathName}?franchisee=` + franchiseeId);
  }
})
