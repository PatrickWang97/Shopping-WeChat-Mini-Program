var app = getApp();
var util = require('../../../utils/util.js');
var WxParse = require('../../../components/wxParse/wxParse.js');
const dataType = function (data) {
  return Object.prototype.toString.call(data).match(/^\[object\s(\w+)\]$/)[1];
}
const checkDataType = function (data, typeString) {
  return (dataType(data)).toLowerCase() === typeString.toLowerCase();
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
    shopId: '',
    franchiseeInfo: {},
    goodsList: [],
    onBusiness: true ,
    tabType: 'goods',
    franchiseeTplPop: false,
    currentAddress: '',
    specPop: true,
    goodsModel: {},
    goodsModelGoodId: 0,
    goodsModelPrice: 0,
    goodsModelTitle: '',
    shoppingcart: true,
    categoryList: [],
    currentCate: 0,
    scrollInto: '',
    goodsQuantity: {},
    cartList: [],
    cartQuantity: {},
    goodsTotal: 0,
    totalPrice: 0.00,
    waimaiDetailPop: true,
    waimaiDetail: {},
    couponMore : true,
    incompleteCrossband: true,
    waimaiGoodsScroll: false,
    assessList : [],
    assessNum: [],
    assessLoad: {
      page: 1,
      loading: false,
      no_more: false
    },
    assessLevel: 0,
    requestFranchiseeId: '',
    carousel_imgs : [],
    certif_pics: [],
    isSoMuch: false,
    withinDistribution: false, // 是否参与子店分销
    distributionInfo: {
      "first_commission": "8.000",
      "second_commission": "9.000",
      "distribution_type": "1"
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
    vipCardInfo: '', // 会员卡的信息
    goodsListScrollY: false,
  },
  onLoad: function(options){
    let franchiseeId = options.detail || options.franchisee;
    let shopId = options.shop_id || '';
    let that = this;
    let {
      windowHeight,
      screenHeight
    } = wx.getSystemInfoSync();
    let newdata = {};
    newdata.franchiseeId = franchiseeId;
    newdata.shopId = shopId;
    newdata.incompleteCrossband = shopId ? true : false;
    newdata.requestFranchiseeId = shopId ? '5rdPq5605h' : franchiseeId; //线上
    newdata.customPageHeight = windowHeight === screenHeight ? windowHeight - app.globalData.topNavBarHeight : windowHeight;
    newdata.franchiseeIdInfo = {
      id: franchiseeId,
      hiddenPlace: true
    }
    this.setData(newdata);
    app.globalData.franchiseeWaimaiRefresh = false;
    if (shopId){
      this.checkAppSubShopIsEdit();
      wx.hideShareMenu();
    }else{
      this.getVIPCardList();
    }
    this.getTakeoutShopInfo();
    this.getCartList();
    this.getAssessList();
    this.getAppShopInfo();
    let pxRatio = app.globalData.systemInfo.windowWidth ? 750 / app.globalData.systemInfo.windowWidth : 2;
    this.pxRatio = pxRatio;
    this.getAppShopConfig(); // 获取店铺配置信息
    Promise.all([this.getSubShopDistribution(), this.ifPromotionPerson()]).then(
      ([{data: data1}, {data: data2}]) => {
        let distributionInfo = data1,
          firstCommission = getRightAttrVal('first_commission', distributionInfo),
          pId = getRightAttrVal('id', data2),
          newdata = {};
        if (firstCommission > 0 && pId) {
          newdata.withinDistribution = true;
          newdata.distributionInfo = distributionInfo;
          newdata.pId = pId;
          that.compareHisIdWithOnline();  // 判断当前版本是否为线上版本
        }
        that.setData(newdata);
      }
    ).catch(err => {
      console.log(err);
    });
  },
  onShow: function () {
    if (app.globalData.franchiseeWaimaiRefresh){
      let address = this.data.location_address;
      if (address && address != this.data.currentAddress){
        this.setData({
          currentAddress: address,
          longitude: app.globalData.takeoutLocate.lng,
          latitude: app.globalData.takeoutLocate.lat
        });
        this.getWaimaiCateListIndex = 0;
        this.getWaimai();
      }
      this.getCartList();
    }
    app.globalData.franchiseeWaimaiRefresh = false;
  },
  pxRatio : 2, //px 与 rpx 的比例
  getCategoryList: function(){
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopCateList',
      data: {
        goods_type: 2,
        form: 'goods',
        app_id: franchiseeId,
        order_by: 'weight',
        order: 'desc'
      },
      success: function (res) {
        let data = res.data;
        let firstCate = 0;
        if(data.length > 0){
          firstCate = data[0].id;
        }else{
          return;
        }
        that.setData({
          categoryList: data,
          currentCate: firstCate,
          isSoMuch: data.length > 15
        });
        if(data.length <= 15){
          that.getWaimai();
        }else{
          that.getGoodsList({
            longitude: that.data.longitude,
            latitude: that.data.latitude,
            idx_value: firstCate
          });
        }
      }
    })
  },
  getTakeoutShopInfo: function () {
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShop/getTakeOutInfo',
      data: {
        sub_app_id: franchiseeId
      },
      success: function (res) {
        let data = res.data;
        let newdata = {};
        if (!data){
          app.showModal({
            content: '此店铺的外卖信息未设置'
          });
          return;
        }
        data.format_distance = util.formatDistance(data.deliver_distance);
        data.deliver_fee = +data.deliver_fee;
        data.description = data.description ? data.description.replace(/\n|\\n/g, '\n') : data.description;
        if (data.fields_data && Number(data.fields_data.desc_show_type) === 1) {
          newdata['descIsRichText'] = true;
          WxParse.wxParse('wxParseDescription', 'html', data.description, that, 10); // 解析富文本
        }
        if (data.industry_type_name && (~data.industry_type_name.search(/\-/))) { // 设定一级行业分类名称
          data.industry_type_short_name = data.industry_type_name.split(/\-/)[0];
        }
        app.setPageTitle(data.title);
        newdata['topNavBarData.title'] = data.title;
        newdata['franchiseeInfo'] = data;
        that.setData(newdata);
        app.globalData.takeoutShopInfo = data;
        that.getLocation();
        that.getFranchiseeQRCode();
      }
    });
  },
  getWaimaiCateListIndex: 0,
  requestNum: 0,
  getWaimai: function(){
    let categoryList = this.data.categoryList;
    let that = this;
    if (that.getWaimaiCateListIndex < categoryList.length){
      if (that.requestNum < 9){
        that.getGoodsList({
          longitude: that.data.longitude,
          latitude: that.data.latitude,
          idx_value: categoryList[that.getWaimaiCateListIndex].id
        });
        that.requestNum ++;
        that.getWaimaiCateListIndex ++;
      }
      setTimeout(function(){
        that.getWaimai();
      }, 100);
    }
  },
  goodsListLoad: {
    page: 1,
    loading: false,
    no_more: false
  },
  goodsObject: {},  // 商品列表对象， 索引值是商品id
  goodsCateHeight: {}, // 每个分类的商品列表高度
  getGoodsList: function (param) {
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    let idx = {
      idx: param.idx || 'category',
      idx_value: param.idx_value || ''
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetGoodsList',
      data: {
        form: 'takeout',
        goods_type: 2,
        sub_shop_app_id: franchiseeId,
        longitude: param.longitude ,
        latitude: param.latitude,
        idx_arr: idx,
        page: 1,
        page_size: 200
      },
      method: 'POST',
      success: function (res) {
        let newdata = {};
        let data = res.data;
        if (that.data.isSoMuch){
          newdata['goodsList'] = data;
          that.goodsObject = {};
        }else{
          newdata['goodsList.' + param.idx_value] = data;
          that.goodsCateHeight[param.idx_value] = {};
          that.goodsCateHeight[param.idx_value] = (data.length * 164 + 48) / that.pxRatio;
        }
        for (let i = 0; i < data.length; i++){
          let form_data = data[i].form_data;
          that.goodsObject[form_data.id] = form_data;
        }
        that.setData(newdata);
      },
      complete: function(){
        that.requestNum --;
      }
    });
  },
  getCartList: function(){
    let that = this;
    let franchiseeId = this.data.requestFranchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        sub_shop_app_id: franchiseeId,
        parent_shop_app_id: app.getAppId(),
        page: 1,
        page_size: 1000
      },
      success: function (res) {
        let resdata = res.data;
        let list = [];
        let newdata = {};
        let cq = {};
        let gq = {};
        for (let i = 0; i < resdata.length; i++) {
          let form_data = resdata[i];
          if (form_data.goods_type == 2) {
            list.push(form_data);
            cq[form_data.goods_id] = cq[form_data.goods_id] || {};
            cq[form_data.goods_id][form_data.model_id] = +form_data.num;
          }
        }
        newdata['cartList'] = list;
        for(let i in cq){
          let total = 0;
          for(let j in cq[i]){
            total += cq[i][j];
          }
          gq[i] = total;
        }
        newdata['cartQuantity'] = cq;
        newdata['goodsQuantity'] = gq;
        that.setData(newdata);
        that.calculateGoodsTotal();
      }
    })
  },
  getFranchiseeQRCode: function(){
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
  drawFranchiseeQRCode: function (QRcode) {
    let that = this;
    let { franchiseeInfo } = this.data;
    let qrUrl = `${app.getSiteBaseUrl()}/index.php?r=Download/DownloadResourceFromUrl&url=${QRcode}`;
    let logoUrl = `${app.getSiteBaseUrl()}/index.php?r=Download/DownloadResourceFromUrl&url=${franchiseeInfo.logo}`;
    let context = wx.createCanvasContext('franchisee-qrcode');
    let imgSize = {
      width: 220,
      height: 220
    };
    drawBgImg(qrUrl, context, imgSize).then(() => {
      drawLogo(logoUrl, context, imgSize).then((codeUrl) => {
        that.setData({
          'franchiseeInfo.sub_qr_code': codeUrl || QRcode
        });
      }, () => {
        that.setData({
          'franchiseeInfo.sub_qr_code': QRcode
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
  turnToFranchiseePerfect: function () {
    app.turnToPage('/franchisee/pages/franchiseePerfect/franchiseePerfect?franchisee=' + this.data.franchiseeId + '&shop_id=' + this.data.shopId);
  },
  turnToSearchAddress: function(){
    app.globalData.franchiseeWaimaiRefresh = true;
    app.turnToPage('/eCommerce/pages/searchAddress/searchAddress?from=takeout&locateAddress=' + this.data.currentAddress);
  },
  turnToCouponList: function () {
    app.turnToPage('/eCommerce/pages/couponListPage/couponListPage?franchisee=' + this.data.requestFranchiseeId);
  },
  makePhoneCall: function(e){
    var phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  closeIncomplete: function(){
    this.setData({
      incompleteCrossband: false
    });
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
    this.setData({
      tabType: type
    });
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
    if (id == 1) {
      this.setData({
        franchiseeTplPop: false
      });
    } else {
      app.goToFranchisee(id, {
        detail: franchiseeId,
        shop_id: shopId
      }, true);
    }
  },
  changeTplConfirm: function(){
    let franchiseeId = this.data.franchiseeId;
    let shopId = this.data.shopId;
    app.sendRequest({
      url: '/index.php?r=AppShop/UpdatModeByShopId',
      data: {
        parent_app_id: app.getAppId(),
        sub_app_id: franchiseeId,
        shop_id: shopId,
        mode_id: 1
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
        app.turnToPage('/franchisee/pages/franchiseeEnterStatus/franchiseeEnterStatus?franchisee=' + franchiseeId);
      }
    });
  },
  getLocation: function () {
    let that = this;
    let location = app.globalData.locationInfo;
    if (location.latitude) {
      that.setData({
        longitude: location.longitude,
        latitude: location.latitude,
        currentAddress: location.info.formatted_addresses && location.info.formatted_addresses.recommend
      });
      that.getCategoryList();
    } else {
      app.getLocation({
        success: function (res) {
          if(!res.longitude){
            that.setData({
              currentAddress: '定位失败'
            });
            that.getCategoryList();
            return;
          }
          app.sendRequest({
            url: '/index.php?r=Map/getAreaInfoByLatAndLng',
            data: {
              longitude: res.longitude,
              latitude: res.latitude
            },
            success: function (data) {
              let addressDetail = data.data;
              let recommendAddress = data.data.formatted_addresses && data.data.formatted_addresses.recommend;
              that.setData({
                longitude: res.longitude,
                latitude: res.latitude,
                currentAddress: recommendAddress
              });
              app.setLocationInfo({
                latitude: res.latitude,
                longitude: res.longitude,
                address: recommendAddress,
                info: data.data
              });
              that.getCategoryList();
            }
          });
        },
        fail: function (res) {
          console.log(res);
          that.setData({
            currentAddress: '定位失败'
          });
          that.getCategoryList();
        }
      });
    }
  },
  showSpecPop: function(e){
    let id = e.currentTarget.dataset.id;
    let model = this.goodsObject[id] ? this.goodsObject[id].model : {};
    let title = this.goodsObject[id].title;
    for(let i in model){
      model[i].chooseIndex = 0;
    }
    this.setData({
      goodsModel: model,
      goodsModelGoodId: id,
      goodsModelTitle: title,
      specPop: false,
      waimaiDetailPop: true
    });
    this.getModelPrice();
  },
  hiddenSpecPop: function () {
    this.setData({
      specPop: true
    });
  },
  goodsModelChoose: function (e) {
    let type = e.currentTarget.dataset.type;
    let index = e.currentTarget.dataset.index;
    let newdata = {};
    newdata['goodsModel.' + type + '.chooseIndex'] = index;
    this.setData(newdata);
    this.getModelPrice();
  },
  getModelPrice: function(){
    let model = this.data.goodsModel;
    let modelList = this.goodsObject[this.data.goodsModelGoodId].goods_model;
    let cm = [];
    let cmt = '';
    let price = 0;
    for(let i in model){
      let m = model[i];
      cm.push(m.subModelId[m.chooseIndex]);
    }
    cmt = cm.join(',');
    for (let i = 0; i < modelList.length; i++){
      if (cmt == modelList[i].model){
        price = modelList[i].price;
        break;
      }
    }
    this.setData({
      goodsModelPrice: price
    });
  },
  goodsModelConfirm: function(){
    let model = this.data.goodsModel;
    let id = this.data.goodsModelGoodId;
    let modelList = this.goodsObject[id].goods_model;
    let cm = [];
    let cmt = '';
    let stock = 0;
    let modelId = 0;
    let newdata = {};
    let goodsQuantity = this.data.goodsQuantity;
    let cartQuantity = this.data.cartQuantity;
    for (let i in model) {
      let m = model[i];
      cm.push(m.subModelId[m.chooseIndex]);
    }
    cmt = cm.join(',');
    for (let i = 0; i < modelList.length; i++) {
      if (cmt == modelList[i].model) {
        stock = modelList[i].stock;
        modelId = modelList[i].id;
        break;
      }
    }
    let num = (cartQuantity[id] && cartQuantity[id][modelId]) ? (cartQuantity[id][modelId] + 1) : 1;
    if (stock < 1 ){
      app.showModal({
        content: '商品库存不足'
      });
      return;
    } else if (num > stock){
      app.showModal({
        content: '添加数量已超过商品库存'
      });
      return;
    }
    newdata['goodsQuantity.' + id] = (goodsQuantity[id] || 0) + 1;
    newdata['cartQuantity.' + id + '.' + modelId] = num;
    newdata.specPop = true;
    this.setData(newdata);
    this.calculateGoodsTotal();
    this.addCart(id, modelId, 'add');
  },
  showShoppingCart: function(){
    this.setData({
      shoppingcart: !this.data.shoppingcart
    })
  },
  hideShoppingCart: function () {
    this.setData({
      shoppingcart: true
    })
  },
  categoryTab: function(e){
    let id = e.currentTarget.dataset.id;
    let newdata = {};
    let that = this;
    if (!this.data.goodsListScrollY) {
      this.setData({goodsListScrollY: true});
    }
    if (that.data.isSoMuch){
      that.getGoodsList({
        longitude: that.data.longitude,
        latitude: that.data.latitude,
        idx_value: id
      });
    }else{
      newdata['scrollInto'] = 'cate-' + id;
    }
    newdata['currentCate'] = id;
    that.setData(newdata);
    that.isChangeTab = true;
  },
  isChangeTab: false,
  goodsListScrollTop: 0,
  goodsListScroll: function(e){
    let scrollTop = e.detail.scrollTop;
    let cate = this.data.categoryList;
    let totalHeight = 0;
    let cateHeight = this.goodsCateHeight;
    let id = 0;
    if (this.isChangeTab){
      this.isChangeTab = false;
      return;
    }
    if (!this.data.isSoMuch) {
      for(let i = 0; i < cate.length; i++){
        totalHeight += cateHeight[cate[i].id];
        if (scrollTop < totalHeight){
          id = cate[i].id;
          break;
        }
      }
      if (this.data.currentCate != id){
        this.setData({
          currentCate : id
        });
      }
    }
    this.goodsListScrollTop = scrollTop;
  },
  touchMoveTimer: null,
  touchClientYs: [],
  touchmoveHandle: function (event) {
    if (this.scrollTimer) {
      clearTimeout(this.touchMoveTimer);
      this.touchMoveTimer = null;
    }
    const curTouchClientY = event.changedTouches[0].clientY;
    let touchClientYs = this.touchClientYs;
    if (touchClientYs.length > 1) {
      let lastTwo = touchClientYs.slice(-2);
      let lastTwoDelt = lastTwo[1] - lastTwo[0];
      let newDelt = curTouchClientY - lastTwo[1];
      let f = (newDelt > 0 && lastTwoDelt > 0) || (newDelt < 0 && lastTwoDelt < 0);
      if (f) {
        touchClientYs.pop();
        touchClientYs.push(curTouchClientY);
        let delt = curTouchClientY - touchClientYs[0];
        const goodsListScrollTop = this.goodsListScrollTop;
        if (Math.abs(delt) > 20) {
          const waimaiGoodsScroll = this.data.waimaiGoodsScroll;
          const newVal = delt < 0;
          if (waimaiGoodsScroll !== newVal && goodsListScrollTop < 10) {
            this.setData({
              goodsListScrollY: newVal
            });
            this.touchMoveTimer = setTimeout(() => {
              this.setData({
                waimaiGoodsScroll: newVal
              });
            }, 50);
          }
        }
      } else {
        this.touchClientYs = [];
      }
    } else {
      touchClientYs.push(curTouchClientY);
    }
  },
  assessScrollFlag: false,
  assessScroll: function(e){
    let scrollTop = e.detail.scrollTop;
    let that = this;
    if (this.assessScrollFlag){
      return ;
    }
    this.assessScrollFlag = true;
    setTimeout(function(){
      that.assessScrollFlag = false;
    }, 100);
    let waimaiGoodsScroll = this.data.waimaiGoodsScroll;
    if (scrollTop > 150 && !waimaiGoodsScroll) {
      this.setData({
        waimaiGoodsScroll: true
      });
    } else if (scrollTop < 50 && waimaiGoodsScroll) {
      this.setData({
        waimaiGoodsScroll: false
      });
    }
  },
  quantityAdd: function(e){
    let id = e.currentTarget.dataset.id;
    let newdata = {};
    let num = (this.data.goodsQuantity[id] || 0) + 1;
    let good = this.goodsObject[id];
    if (num > good.stock){
      app.showModal({
        content: '商品库存不足'
      });
      return;
    }
    newdata['goodsQuantity.' + id] = num;
    newdata['cartQuantity.' + id + '.0'] = num;
    this.setData(newdata);
    this.calculateGoodsTotal();
    this.addCart(id, '', 'add');
  },
  cartQuantityAdd: function (e) {
    let id = e.currentTarget.dataset.id;
    let model_id = e.currentTarget.dataset.modelid;
    let index = e.currentTarget.dataset.index;
    let newdata = {};
    let num = (this.data.goodsQuantity[id] || 0) + 1;
    let cartQuantity = this.data.cartQuantity;
    let cart_num = cartQuantity[id][model_id] + 1;
    let good = this.data.cartList[index];
    let stock = good.stock;
    if (cart_num > stock) {
      app.showModal({
        content: '商品库存不足'
      });
      return;
    }
    newdata['goodsQuantity.' + id] = num;
    newdata['cartQuantity.' + id + '.' + model_id] = cart_num;
    this.setData(newdata);
    this.calculateGoodsTotal();
    this.addCart(id, model_id, 'add');
  },
  quantityReduce: function (e) {
    let that = this;
    let id = e.currentTarget.dataset.id;
    let newdata = {};
    let num = that.data.goodsQuantity[id];
    let good = that.goodsObject[id];
    if (good.goods_model){
      app.showModal({
        content: '多规格的商品只能去购物车删除哦'
      });
    }else{
      num = num > 0 ? (num - 1) : 0;
      newdata['goodsQuantity.' + id] = num;
      newdata['cartQuantity.' + id + '.0'] = num;
      that.setData(newdata);
      that.calculateGoodsTotal();
      if (num <= 0){
        let cartId = [];
        let cartIndex = null;
        let cartList = that.data.cartList;
        for (let i = 0; i < cartList.length; i++) {
          let cl = cartList[i];
          if (cl.goods_id == id) {
            cartId.push(cl.id);
            cartIndex = i;
            break;
          }
        }
        this.deleteCart({
          cart_id_arr: cartId ,
          success: function(){
            cartIndex != null && cartList.splice(cartIndex, 1);
            that.setData({
              cartList: cartList
            });
          },
          fail: function(){
            let newdata2 = {};
            newdata2['goodsQuantity.' + id] = 1;
            newdata2['cartQuantity.' + id + '.0'] = 1;
            that.setData(newdata2);
            that.calculateGoodsTotal();
          }
        });
      }else{
        this.addCart(id, '', 'reduce');
      }
    }
  },
  cartQuantityReduce: function (e) {
    let that = this;
    let dataset = e.currentTarget.dataset;
    let id = dataset.id;
    let model_id = dataset.modelid;
    let newdata = {};
    let cnum = that.data.cartQuantity[id][model_id];
    let gnum = that.data.goodsQuantity[id];
    cnum = cnum > 0 ? (cnum - 1) : 0;
    gnum = gnum > 0 ? (gnum - 1) : 0;
    newdata['goodsQuantity.' + id] = gnum;
    newdata['cartQuantity.' + id + '.' + model_id] = cnum;
    that.setData(newdata);
    that.calculateGoodsTotal();
    if (cnum <= 0) {
      let cartId = [];
      let cartIndex = dataset.index;
      let cartList = that.data.cartList;
      cartId.push(dataset.cartid);
      that.deleteCart({
        cart_id_arr: cartId,
        success: function () {
          cartList.splice(cartIndex, 1);
          that.setData({
            cartList: cartList
          });
        },
        fail: function () {
          let newdata2 = {};
          newdata2['goodsQuantity.' + id] = 1;
          newdata2['cartQuantity.' + id + '.' + model_id] = 1;
          that.setData(newdata2);
          that.calculateGoodsTotal();
        }
      });
    } else {
      this.addCart(id, model_id, 'reduce');
    }
  },
  addCart: function(id, modelId, type){
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    let num = that.data.goodsQuantity[id];
    let cartQuantity = that.data.cartQuantity;
    modelId = modelId || 0;
    num = modelId ? ((cartQuantity[id] && cartQuantity[id][modelId]) ? cartQuantity[id][modelId] : 1) : (num || 1);
    app.sendRequest({
      url: '/index.php?r=AppShop/addCart',
      data: {
        goods_id: id,
        num: num,
        model_id: modelId,
        sub_shop_app_id: franchiseeId,
        parent_shop_app_id: app.getAppId()
      },
      success: function (res) {
        let data = res.data;
        let cartList = that.data.cartList;
        let has = false;
        for(let i = 0; i < cartList.length; i++){
          if (cartList[i].goods_id == id && cartList[i].model_id == modelId){
            has = true;
            break;
          }
        }
        if(!has){
          that.getCartList();
        }
      },
      fail: function(){
        this.successStatusAbnormal();
      },
      successStatusAbnormal: function () {
        let newdata = {};
        let newNum = that.data.goodsQuantity[id];
        let newCartQuantity = that.data.cartQuantity;
        if (type == 'reduce') {
          newdata['goodsQuantity.' + id] = newNum + 1;
          if (modelId) {
            newdata['cartQuantity.' + id + '.' + modelId] = cartQuantity[id][modelId] + 1;
          } else {
            newdata['cartQuantity.' + id + '.0'] = newNum + 1;
          }
        } else {
          newdata['goodsQuantity.' + id] = newNum - 1;
          if (modelId) {
            newdata['cartQuantity.' + id + '.' + modelId] = cartQuantity[id][modelId] - 1;
          } else {
            newdata['cartQuantity.' + id + '.0'] = newNum - 1;
          }
        }
        that.setData(newdata);
        that.calculateGoodsTotal();
      }
    })
  },
  deleteCart: function (options){
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteCart',
      data: {
        cart_id_arr: options.cart_id_arr,
        sub_shop_app_id: franchiseeId,
        parent_shop_app_id: app.getAppId()
      },
      method: 'POST',
      success: function (res) {
        typeof options.success === 'function' && options.success(res);
      },
      fail: function (res) {
        typeof options.fail === 'function' && options.fail(res);
      },
      successStatusAbnormal: function (res) {
        typeof options.fail === 'function' && options.fail(res);
      }
    })
  },
  clearCartList: function(){
    let that = this;
    let cartId = [];
    let cartList = that.data.cartList;
    for (let i = 0; i < cartList.length; i++) {
      let cl = cartList[i];
      cartId.push(cl.id);
    }
    that.deleteCart({
      cart_id_arr: cartId,
      success: function(){
        that.setData({
          cartList: [],
          goodsQuantity: {},
          cartQuantity: {},
          goodsTotal: 0,
          totalPrice: 0.00
        });
      }
    });
  },
  calculateGoodsTotal: function(){
    let that = this;
    let num = 0;
    let price = 0;
    let goodsQuantity = this.data.goodsQuantity;
    let cartQuantity = this.data.cartQuantity;
    let cartList = that.data.cartList;
    for (let i in goodsQuantity){
      num += goodsQuantity[i];
    }
    for (let i = 0; i < cartList.length; i++) {
      let cl = cartList[i];
      price += cl.price * cartQuantity[cl.goods_id][cl.model_id];
    }
    price = Math.round(price * 100) / 100;
    this.setData({
      goodsTotal: num,
      totalPrice: price
    });
  },
  clickChooseComplete: function(e){
    let allow = e.currentTarget.dataset.allow;
    let cartId = [];
    let cartList = this.data.cartList;
    if (cartList.length < 1){
      app.showModal({
        content: '请先选择商品!'
      });
      return;
    }
    for (let i = 0; i < cartList.length; i++) {
      let cl = cartList[i];
      cartId.push(cl.id);
    }
    if (allow){
      if(this.data.shopId){
        app.showModal({
          content: '这是预览数据，无法去结算!'
        });
        return;
      }
      app.globalData.franchiseeWaimaiRefresh = true;
      app.turnToPage('/orderMeal/pages/previewTakeoutOrder/previewTakeoutOrder?cart_arr=' + cartId + '&franchisee=' + this.data.franchiseeId)
    }
  },
  showWaimaiDetailPop: function(e){
    let id = e.currentTarget.dataset.id;
    let good = this.goodsObject[id];
    this.setData({
      waimaiDetailPop: false,
      waimaiDetail: good
    })
  },
  HiddenWaimaiDetailPop: function () {
    this.setData({
      waimaiDetailPop: true
    })
  },
  lookCouponMore: function(){
    this.setData({
      couponMore: false
    })
  },
  receiveCouponLoading: false,
  receiveCoupon: function (e) {
    let that = this;
    let franchiseeId = that.data.requestFranchiseeId;
    let params = {};
    let { id, category } = e.currentTarget.dataset;
    if (this.data.shopId) {
      app.showModal({
        content: '这是预览数据，无法领取!'
      });
      return;
    }
    if (this.receiveCouponLoading){
      return;
    }
    this.receiveCouponLoading = true;
    params['coupon_id'] = id;
    params['sub_app_id'] = franchiseeId;
    if (+category) {
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
      },
      complete: function(){
        that.receiveCouponLoading = false;
      }
    });
  },
  getAssessList: function(){
    let that = this;
    let assessLoad = that.data.assessLoad;
    let type = that.data.assessLevel;
    let franchiseeId = that.data.requestFranchiseeId;
    if(assessLoad.loading || assessLoad.no_more){
      return ;
    }
    that.setData({
      'assessLoad.loading':  true
    });
    app.sendRequest({
      url: '/index.php?r=AppShop/getAssessList',
      data: {
        'idx_arr[0][idx]': 'goods_type',
        'idx_arr[0][idx_value]': 2,
        'idx_arr[1][idx]': 'level',
        'idx_arr[1][idx_value]': type,
        page: assessLoad.page,
        page_size: 10,
        obj_name: 'app_id',
        sub_shop_app_id: franchiseeId
      },
      success: function (res) {
        let newdata = {};
        newdata['assessList'] = assessLoad.page == 1 ? res.data : that.data.assessList.concat(res.data);
        newdata['assessLoad.page'] = assessLoad.page + 1;
        newdata['assessNum'] = res.num;
        newdata['assessLoad.no_more'] = res.is_more == 0;
        that.setData(newdata);
      },
      complete: function () {
        that.data.assessLoad.loading = false;
      }
    });
  },
  assessScrollTolower: function(){
    this.getAssessList();
  },
  assessLevelChange: function(e){
    let type = e.currentTarget.dataset.type;
    let newdata = {};
    newdata['assessLoad.no_more'] = false;
    newdata['assessLoad.loading'] = false;
    newdata['assessLoad.page'] = 1;
    newdata['assessLevel'] = type;
    this.setData(newdata);
    this.getAssessList();
  },
  previewAssessImage: function(e){
    let src = e.currentTarget.dataset.src;
    let index = e.currentTarget.dataset.index;
    let urls = this.data.assessList[index].assess_info.img_arr;
    app.previewImage({
      current: src,
      urls: urls
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
  getAppShopInfo: function() {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopInfo',
      data: {
        app_id: that.data.franchiseeId
      },
      success: function (res) {
        let newdata = {};
        newdata['carousel_imgs'] = res.data.carousel_imgs || [];
        let certif_pics = [];
        let cp = res.data.certif_pics || [];
        for (let i in cp) {
          for (let j = 0; j < cp[i].length; j++) {
            certif_pics.push(cp[i][j]);
          }
        }
        newdata['certif_pics'] = certif_pics;
        that.setData(newdata);
      }
    });
  },
  previewImage: function (e) {
    let that = this;
    let src = e.currentTarget.dataset.src;
    let field = e.currentTarget.dataset.field;
    let urls = that.data[field] || '';
    app.previewImage({
      current: src,
      urls: urls
    });
  },
  getVIPCardList: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPCardList',
      data: {
        'parent_app_id': app.getAppId(),
        'sub_app_id': that.data.requestFranchiseeId
      },
      success: function (res) {
        let data = res.data;
        if (data && data.length){
          let vip = data[0];
          if (vip.is_owner != 1){
            that.getVIPCardForUser();
          }
          that.setData({
            vipCardInfo: vip
          });
        }
      },
      complete: function () {
      }
    });
  },
  getVIPCardForUser: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetVIPCardForUser',
      data: {
        'parent_app_id': app.getAppId(),
        'sub_app_id': that.data.requestFranchiseeId
      },
      success: function (res) {
      }
    });
  },
  stopPropagation: function(){
  },
  onShareAppMessage: function (event) {
    let that = this;
    let title = that.data.franchiseeInfo.title;
    let desc = that.data.franchiseeInfo.description;
    let path = '/franchisee/pages/franchiseeWaimai/franchiseeWaimai?detail=' + that.data.franchiseeId;
    let image = '';
    let fromWhere = '';
    if (event.from === 'button' && event.target.dataset && (fromWhere = event.target.dataset.fromWhere)) {
      if (fromWhere === 'distribution') {
        let {
          distributionShareData: {
            image_url,
            description
          },
          franchiseeInfo: {
            logo
          }
        } = this.data;
        image = image_url || logo;
        if (!description) {
          let nickname = app.globalData.userInfo.nickname;
          description = nickname + '向你推荐了' + title + '，好店不容错过'
        }
        title = desc = description;
      }
      that.tapClosePromoModal();
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
  getAppShopConfig: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShopConfig/GetAppShopConfig',
      data: {
        'sub_app_id': that.data.requestFranchiseeId,
        mode_id: 1
      },
      success: function ({data}) {
        let configData = data[0] || {};
        let shareQrData = configData.share_qr_data;
        let newdata = {};
        if (shareQrData && checkDataType(shareQrData, 'object')) {
          newdata.distributionShareData = {
            image_url: shareQrData.cover,
            description: shareQrData.title
          }
        }
        that.setData(newdata);
      }
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
  tapShowDistribution: function () {
    this.setData({
      promoModalShow: true
    });
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
          title,
          logo,
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
    image_url = image_url || picture || logo;
    name = name || title;
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
      let goods_img = params.goods_img || that.data.franchiseeInfo.logo;
      let text = params.text || that.data.franchiseeInfo.title;
      let franchiseeId = that.data.franchiseeId;
      let pId = this.data.pId;
      let tabbarInfo = app.globalData.tabbarInfo[franchiseeId];
      let type = 14;
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
  turnTopVipBenefits: function () {
    let { franchiseeId, vipCardInfo } = this.data;
    let pathName = vipCardInfo.is_app_shop == 1 ? 'leagueVipAdvertise' : 'vipBenefits';
    app.turnToPage(`/eCommerce/pages/${pathName}/${pathName}?franchisee=` + franchiseeId);
  },
})
