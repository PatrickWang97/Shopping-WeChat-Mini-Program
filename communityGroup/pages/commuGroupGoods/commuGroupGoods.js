var app = getApp();
var WxParse = require('../../../components/wxParse/wxParse.js');
import { DrawShare } from '../../../utils/drawShare.js';
Page({
  data: {
    tabIndex: 0,
    video_duration: '',
    showCark: true,             //  显示购物车
    showModel: true,         //  商品多规格选择
    communityGoodsList: {}, //商品信息
    selectGoodsModelInfo: {},   //  当前选中的多规格商品信息
    evaluateList: {             //  商品评价列表
      data: [],
      totalCount: 0, //总数
      is_more: 1
    },
    userLogList: { //用户购买数据
      data: [],
      count: 0,
      is_more: 1
    },
    cartList: [],//  购物车      
    nick_name: '', //
    logo: '', //
    shopCarkNumber: 0, //购物车数量
    pageQRCodeShow: false,
    pageQRCodeData: {
      shareDialogShow: "100%",
      shareMenuShow: false,
      community: {}
    },
    showShare: false,
    showPlayButton: false, //是否显示播放视频按钮
    siteBaseUrl: getApp().globalData.siteBaseUrl,
    leaderInfo: '', //团长信息
    imageOrVideo: 'image',
    commentType: 0, //评论
    isShowEvaluate: '1', //是否展示评论  1为展示
    isshowLeaderDialog: 0, //选择团长弹窗,
    leader_list: [], //团长列表
    latitude: '',
    longitude: '',
    type: '' ,
    isVipLimit: false, // 是否达商品会员限购
    isGoodsLimit: false, // 是否商品件数限购
  },
  leader_token: '',//团长token
  logPage: 1, //购买记录page
  page: 1, //评论page
  goodsId: '',//商品id,
  dpr: '',
  date: {
    startDate: '',
    endDate: ''
  },
  downcount: '',
  settlementType: 0, //去结算按钮类型： 1：结算；0：购物车加购
  onLoad: function (options) {
    let leaderInfo = app.globalData.leaderInfo || {};
    this.leader_token = leaderInfo.user_token || '';
    this.goodsId = options.goodsId || options.detail;
    this.getGoodsLimit();    // 商品限购
    this.getGoodsDetail();   //获取商品详情信息
    let newData = {
      nick_name: leaderInfo.nick_name || '',
      logo: leaderInfo.logo || '',
      leaderInfo: leaderInfo
    };
    this.setData(newData)
    let res = app.getSystemInfoData(),
      screenWidth = res.screenWidth,
      dpr = screenWidth / 750;
    this.dpr = dpr;
  },
  onShow: function () {
    this.getInitCar();
    this.getRoleInfo(); //是否需要展示详情页的评论
    this.setData({
      evaluateList: {
        data: [],
        count: 0,
        is_more: 1
      },
      userLogList: {
        data: [],
        count: 0,
        is_more: 1
      },
      commentType: 0
    })
    this.logPage = 1;
    this.page = 1;
    this.getUserEvalute(1, 5); //获取评论
    this.getAppGroupOrderLog(1, 10); //获取下单数
    this.settlementType = 0;
  },
  onUnload: function () {
    if (this.downcount) {
      this.downcount.clear();
    }
  },
  getGroupData: function () {
    let that = this;
    let data = {
      data_id: this.groupId
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetAppDistributionGroupList',
      method: 'post',
      data: data,
      success: function (res) {
        let communityInfo = res.data[0];
        if (!communityInfo) return;
        communityInfo.current_time = res.current_time;
        that.setData({
          communityInfo: communityInfo,
          status: communityInfo.status,
        })
        that.startCountDown();
      }
    })
  },
  startCountDown: function () {
    let that = this;
    let status = this.data.status;
    let communityInfo = this.data.communityInfo;
    communityInfo.downCount = {
      hours: '00',
      minutes: '00',
      seconds: '00',
      days: '00',
    };
    if (status == 0 || status == 3 || status == 4 || status == 5) {
      that.downcount = that.beforeGroupDownCount(communityInfo, 'communityInfo');
    } else if (status == 1) {
      that.downcount = that.duringGroupDownCount(communityInfo, 'communityInfo');
    } else {
      this.setData({
        groupTime: {
          days: '00',
          hour: '00',
          minute: '00',
          second: '00'
        }
      })
    }
    this.setData({
      communityInfo: communityInfo
    })
  },
  duringGroupDownCount: function (formData, path) {
    let _this = this,
      downcount;
    downcount = app.seckillDownCount({
      startTime: formData.current_time,
      endTime: formData.end_date,
      showDays: true,
      callback: function () {
        let newData = {};
        newData['status'] = 2;
        _this.setData(newData);
        _this.getGroupData();
      }
    }, _this, path + '.downCount');
    return downcount;
  },
  beforeGroupDownCount: function (formData, path) {
    let _this = this,
      downcount;
    downcount = app.seckillDownCount({
      startTime: formData.current_time,
      endTime: formData.start_date,
      showDays: true,
      callback: function () {
        let newData = {};
        newData['status'] = 1;
        newData[path + '.server_time'] = formData.start_date;
        _this.setData(newData);
        formData.server_time = formData.start_date;
        _this.duringGroupDownCount(formData, path);
      }
    }, _this, path + '.downCount');
    return downcount;
  },
  getGoodsDetail: function (e) {
    let that = this;
    let data = {
      goods_id: [this.goodsId],
      is_lost_group: 1
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetAppDistributionGroupGoodsList',
      method: 'post',
      data: data,
      success: function (res) {
        let communityGoodsList = res.data[0];
        if(!communityGoodsList){
          app.showModal({content: '商品暂未参加活动'});
        }
        that.groupId = communityGoodsList.group_id;  //活动id赋值
        that.getGroupData(); //获取当前商品所在的活动详情
        if (communityGoodsList && communityGoodsList.form_data) {
          let description = communityGoodsList.form_data.description || '';
          description = description ? description.replace(/\u00A0|\u2028|\u2029|\uFEFF/g, '') : description;
          communityGoodsList.form_data.description = description;
          WxParse.wxParse('wxParseDescription', 'html', description, that, 10);
          if (!!communityGoodsList.form_data.goods_model) {
            communityGoodsList.price = communityGoodsList.form_data.min_price;  //多规格有最小值
          }
          if (communityGoodsList.form_data.video_id) {// 存在视频则获取视频长度
            app.sendRequest({
              url: '/index.php?r=AppVideo/GetVideoDataByid',
              method: 'post',
              data: {
                video_id: communityGoodsList.form_data.video_id
              },
              success: function (res) {// 格式化视频长度
                let duration = parseInt(res.data.duration)
                let second = duration % 60
                let minute = parseInt(duration / 60)
                second = second > 10 ? '' + second : '0' + second
                minute = minute > 10 ? '' + minute : '0' + minute
                duration = minute + '‘' + second + '”'
                that.setData({
                  video_duration: duration
                })
              }
            }) 
          }
          that.setData({
            communityGoodsList: communityGoodsList,
            showPlayButton: communityGoodsList.form_data.video_url ? true : false
          })
        }
      }
    })
  },
  changeTab: function (e) {
    let index = e.currentTarget.dataset.index;
    this.page = 1;
    this.setData({
      tabIndex: index,
    })
  },
  goToHomepage: function () {
    let router = app.getHomepageRouter();
    app.turnToPage('/pages/' + router + '/' + router, true);
  },
  getInitCar() {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 1000,
        dis_group_id: -1,
        leader_token: this.leader_token
      },
      success: function (res) {
        let shopCarNum = 0;
        if (res.data) {
          res.data.map((item) => {
            shopCarNum += (+item.num);
            if (item.model_value) {
              item.models_text = item.model_value.join(',');
            }
            return item;
          })
        }
        that.setData({
          cartList: res.data || [],
          shopCarkNumber: shopCarNum
        })
        if(!that.leader_token){
          that.getGroupLeaderLocking();
        }
      }
    })
  },
  inputBuyCount: function (e) {
    this.setData({
      'selectGoodsModelInfo.num': +e.detail.value
    });
  },
  addGoods: function (e, number) { //购物车列表增加和删除
    let cartList = JSON.parse(JSON.stringify(this.data.cartList));
    let index = e.currentTarget.dataset.index;
    let currentGoods = cartList[index];
    let type = e.currentTarget.dataset.type;
    let shopCarkNumber = this.data.shopCarkNumber;
    if (type == 'plus') {
      +currentGoods.num++;
      +shopCarkNumber++;
      app.sendUseBehavior([{ goodsId: currentGoods.goods_id }], 4);
    } else if (type == 'minus') {
      +currentGoods.num--;
      +shopCarkNumber--;
      if (currentGoods.num == 0) {
        this.deleteGoods([currentGoods.id], () => {
          cartList.splice(index, 1);
          this.setData({
            cartList: cartList,
            shopCarkNumber: shopCarkNumber
          })
        });
        return;
      }
    }
    let data = {
      goods_id: currentGoods.goods_id,
      model_id: currentGoods.model_id,
      num: currentGoods.num,
      group_id: currentGoods.form_data.dis_group_id
    }
    this.settlementType = 1;
    this.addCartList(data).then((res) => {
      this.setData({
        cartList: cartList,
        shopCarkNumber: shopCarkNumber
      })
    })
  },
  deleteGoods: function (deleteArr, callBack) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteCart',
      method: 'post',
      data: {
        cart_id_arr: deleteArr
      },
      success: function (res) {
        callBack && callBack();
      }
    });
  },
  addCartList: function(param){
    let _this = this;
    return new Promise((resolve, reject) => {
      if(!this.leader_token){
        this.showLeaderDialog();
        return;
      }
      let cartList = JSON.parse(JSON.stringify(this.data.cartList));
      if(this.settlementType != 1){
        cartList.map((item) => {
          if (item.goods_id == param.goods_id && (!(+item.model_id) || (item.model_id && item.model_id == param.model_id))) {
            item.num = (+item.num) + param.num;
            param.num = item.num;
          }
        })
      }
      param.leader_token = this.leader_token;
      param.dis_group_id = -1;
      app.sendRequest({
        url: '/index.php?r=AppShop/addCart',
        method: 'post',
        hideLoading: true,
        data: param,
        success: function (res) {
          resolve(res);
          app.globalData.groupRefreshList = true;
          app.sendUseBehavior([{ goodsId: param.goods_id }], 4);
        },
        successShowModalConfirm: function(res){
          if(res.status == 3){  //该团长对此商品无权限，请选择其他团长
            _this.showLeaderDialog();
          }
        }
      })
    })
  },
  showQRCodeComponent: function () {
    if(this.groupId == -1){
      app.showModal({
        content: '商品暂未加入社区团购活动'
      })
      return
    }
    let that = this;
    let goodsInfo = this.data.communityGoodsList;
    let animation = wx.createAnimation({
      timingFunction: "ease",
      duration: 400,
    });
    let param = {
      obj_id: goodsInfo.id,
      type: 26,
      text: goodsInfo.title,
      price: goodsInfo.price,
      goods_img: goodsInfo.img_urls ? goodsInfo.img_urls[0] : goodsInfo.cover,
      max_can_use_integral: goodsInfo.max_can_use_integral,
      integral: goodsInfo.integral,
      sub_shop_id: '',
      p_id: app.globalData.p_id || '',
      leader_token: that.leader_token
    }
    app.sendRequest({
      url: '/index.php?r=AppDistribution/DistributionShareQRCode',
      data: param,
      success: function (res) {
        animation.bottom("0").step();
        let community = {
          imgIcon: 'http://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/community-group/community-group-goods.png',
          imgIconTxt: '社区优惠购',
          logo: that.data.logo,
          nickname: that.data.nick_name
        }
        let communityGoodsList = that.data.communityGoodsList;
        let canvasStyle = that.data.communityInfo.poster_css == 2 ? { width: 530, height: 515 } : { width: 530, height: 465 };
        res.data['virtual_price'] = communityGoodsList.virtual_price != 0 ? communityGoodsList.virtual_price : '';
        that.getShareToMomentsSwitch();
        that.setData({
          "pageQRCodeData.shareDialogShow": 0,
          "pageQRCodeData.shareMenuShow": true,
          "pageQRCodeData.goodsInfo": res.data,
          "pageQRCodeData.animation": animation.export(),
          "pageQRCodeData.community": community,
          "pageQRCodeData.goodsType": 4,
          "pageQRCodeData.drawType": that.data.communityInfo.poster_css || 1,
          "pageQRCodeData.canvasStyle": canvasStyle
        })
      }
    })
  },
  getAppGroupOrderLog: function (page, pageSize) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetAppDistributionGroupGoodsIdxList',
      data: {
        goods_id: _this.goodsId,
        page: this.logPage || 1,
        page_size: pageSize || 10
      },
      success: function (res) {
        res.data = [..._this.data.userLogList.data, ...res.data];
        _this.setData({
          userLogList: res,
          'userLogList.sliceData': res.data.length > 8 ? res.data.slice(0, 7) : res.data
        })
      }
    })
  },
  addLogMore: function (e) {
    if (!this.data.userLogList.is_more) {
      return;
    }
    this.logPage++;
    if (this.logPage == 1) {
      this.setData({
        'userLogList.data': []
      })
    }
    this.getAppGroupOrderLog(this.logPage, 10);
  },
  getUserEvalute: function (page, pageSize) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAssessList',
      method: 'post',
      data: {
        goods_id: _this.goodsId,
        idx_arr: {
          idx: 'level',
          idx_value: _this.data.commentType
        },
        page: _this.page || 1,
        page_size: pageSize || 5
      },
      success: function (res) {
        res.data = [..._this.data.evaluateList.data, ...res.data];
        _this.setData({
          showGood: false,
          'evaluateList.data': res.data,
          'evaluateList.is_more': res.is_more,
          'evaluateList.num': res.num,
        })
        if (_this.data.commentType == 0) {
          _this.setData({
            'evaluateList.totalCount': res.count
          })
        }
      }
    })
  },
  addMore: function (e) {
    if (!this.data.evaluateList.is_more) {
      return;
    }
    this.page++;
    if (this.page == 1) {
      this.setData({
        'evaluateList.data': []
      })
    }
    this.getUserEvalute();
  },
  clickPlusImages: function (e) {
    app.previewImage({
      current: e.currentTarget.dataset.src,
      urls: e.currentTarget.dataset.srcarr
    })
  },
  addCark: function () {
    let selectGoodsInfo = this.data.selectGoodsModelInfo;
    let option = {
      goods_id: this.goodsId,
      model_id: selectGoodsInfo.modelId,
      num: +selectGoodsInfo.num,
      group_id: this.groupId
    }
    this.addCartList(option).then((res) => {
      if(this.settlementType) {
        let cart_arr = [{
          id: res.data,
          num: +selectGoodsInfo.num,
        }];
        let urlOptions = {
          cart_arr: cart_arr,
        }
        let pagePath = `/promotion/pages/communityGroupOrderSubmit/communityGroupOrderSubmit`;
        app.turnToPage(pagePath, '', urlOptions);
      }else{
        this.getInitCar();
      }
    })
    this.closeGoodModel();
  },
  initSelectGoodsModelInfo: function (goods) {
    goods.form_data.cover = goods.cover;
    goods.form_data.title = goods.title;
    goods.form_data.id = goods.id;
    goods.form_data.goods_type = goods.goods_type;
    goods = goods.form_data;
    goods.model = Object.values(goods.model);
    let items = goods.goods_model; 
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
    selectModelInfo.num = 1 < defaultGoods.min_sales_nums ? defaultGoods.min_sales_nums : 1;
    selectModelInfo.id = goods.id;
    selectModelInfo.goods_type = goods.goods_type;
    selectModelInfo.title = goods.title,
    this.setData({
      goodsInfo: goods,
      showModel: false,
      selectGoodsModelInfo: selectModelInfo,
    })
    this.checkGoodsNumInCart(goods.id,defaultGoods.id);
  },
  selectGoodsSubModel: function (e) {
    let dataset = e.target.dataset;
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
          text += '“' + model[i].subModelName[j] + '”';
        }
      }
    }
    data['selectGoodsModelInfo.models'] = selectModels;
    data['selectGoodsModelInfo.models_text'] = text;
    this.resetSelectCountPrice(data);
  },
  resetSelectCountPrice: function (data) {
    let selectModelIds = this.data.selectGoodsModelInfo.models.join(',');
    let modelItems = this.data.goodsInfo.goods_model;
    let cover = this.data.goodsInfo.cover;
    for (let item of modelItems) {
      if (item.model == selectModelIds) {
        data['selectGoodsModelInfo.stock'] = item.stock;
        data['selectGoodsModelInfo.num'] = item.min_sales_nums > 1 ? item.min_sales_nums : 1;
        data['selectGoodsModelInfo.price'] = item.price;
        data['selectGoodsModelInfo.modelId'] = item.id || '';
        data['selectGoodsModelInfo.imgurl'] = item.img_url == "" ? cover : item.img_url;;
        data['selectGoodsModelInfo.virtualPrice'] = item.virtual_price;
        data['selectGoodsModelInfo.currentGoodsNum'] = 0;
        data['selectGoodsModelInfo.min_sales_nums'] = item.min_sales_nums;
        break;
      }
    }
    this.setData(data);
    let {id, modelId} = this.data.selectGoodsModelInfo
    this.checkGoodsNumInCart(id, modelId);
  },
  inputnum: function (e) {
    this.setData({
      'selectGoodsModelInfo.num': Number(e.detail.value)
    })
  },
  closeGoodModel: function () {
    this.setData({
      showModel: true
    })
  },
  clearShopCark: function () {
    let _this = this;
    let shopCark = this.data.cartList || [];
    let cart_id_arr = [];
    app.showModal({
      content: '确定清空购物车？',
      showCancel: true,
      confirm: function (res) {
        console.log(shopCark)
        for (let item of shopCark) {
          if (!!item.id) {
            cart_id_arr.push(item.id);
          }
        }
        if (cart_id_arr.length) {
          app.sendRequest({
            url: '/index.php?r=AppShop/deleteCart',
            method: 'post',
            data: {
              cart_id_arr: cart_id_arr
            },
            success: function () {
              _this.setData({
                showCark: true,
                shopCarkNumber: 0,
                cartList: []
              })
              app.globalData.groupRefreshList = true;
              _this.getInitCar()
            }
          })
        }
      }
    })
  },
  plus: function () {
    if(this.groupId == -1){
      app.showModal({
        content: '商品暂未加入社区团购活动'
      })
      return
    }
    this.settlementType = 0;
    if(!this.leader_token){
      this.showLeaderDialog('plus');
    }else{
      this.changeGoodsNum('plus');
    }
  },
  showLeaderDialog: function (type) {
    this.setData({
      isshowLeaderDialog: true,
      type: type
    })
    let _this = this;
    if (!this.data.latitude) {
      app.getLocation({
        success: (res) => {
          if (!res.latitude) {
            _this.setData({
              localAddress: '定位失败'
            })
            return;
          }
          _this.data.latitude = res.latitude;
          _this.data.longitude = res.longitude;
          _this.getLeaderList();
        }
      })
    } else {
      _this.getLeaderList();
    }
  },
  getLeaderList: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
      data: {
        goods_id: _this.goodsId,
        latitude: _this.data.latitude,
        longitude: _this.data.longitude,
        page: -1,
        agent_check: 1,
        is_audit: 1,
        group_id: this.groupId
      },
      success: function (res) {
        for (let item of res.data) {
          if (item.distance >= 1000.00) {
            item.distance = (item.distance / 1000).toFixed(1) + 'KM';
          } else {
            item.distance = parseInt(item.distance) + 'M';
          }
        }
        _this.setData({
          leader_list: res.data
        })
      }
    })
  },
  hideLeaderDialog: function () {
    let isshowLeaderDialog = !this.data.isshowLeaderDialog
    this.setData({
      isshowLeaderDialog: isshowLeaderDialog
    })
  },
  selectLeader: function (e) {
    let leaderInfo = e.currentTarget.dataset.item;
    this.leader_token = leaderInfo.user_token;
    this.setData({
      isshowLeaderDialog: false,
      leaderInfo: leaderInfo
    })
    this.distributorGroupLeaderLocking();
    if (this.settlementType == 1){
      this.goToPreviewPay();
    }else {
      this.plus();
    }
  },
  changeGoodsNum: function (type) {
    let goodsInfo = this.data.communityGoodsList
    if (goodsInfo.form_data.goods_model && type == 'plus') {
      this.initSelectGoodsModelInfo(goodsInfo);
      return;
    }
    let minSalesNums = goodsInfo.form_data.min_sales_nums; //起卖数
    let data = {
      goods_id: this.goodsId,
      num: 1 < minSalesNums ? minSalesNums : 1,
      group_id: this.groupId
    }
    this.addCartList(data).then((res) => {
      this.getInitCar();
    })
  },
  clickGoodsMinusButton: function () {
    let count = +this.data.selectGoodsModelInfo.num;
    if (count <= 1) {
      return;
    }
    this.setData({
      'selectGoodsModelInfo.num': count - 1
    });
  },
  clickGoodsPlusButton: function () {
    let selectGoodsModelInfo = this.data.selectGoodsModelInfo;
    let count = +selectGoodsModelInfo.num;
    let stock = +selectGoodsModelInfo.stock;
    if (count >= stock) {
      return;
    }
    this.setData({
      'selectGoodsModelInfo.num': count + 1
    });
  },
  stopPropagation: function () { },
  stopMove: function () { return; },
  isShowCark: function () {
    let showCark = !this.data.showCark
    this.setData({
      showCark: showCark
    })
  },
  goToPreviewPay: function(){
    if(this.groupId == -1){
      app.showModal({
        content: '商品暂未加入社区团购活动'
      })
      return
    }
    this.settlementType = 1;
    let goodsInfo = this.data.communityGoodsList;
    if (goodsInfo.form_data.goods_model) {  //  多规格商品
      this.initSelectGoodsModelInfo(goodsInfo);
      return;
    }
    let minSalesNums = goodsInfo.form_data.min_sales_nums; //起卖数
    let data = {
      goods_id: this.goodsId,
      num: 1 < minSalesNums ? minSalesNums : 1,
      group_id: this.groupId
    }
    this.addCartList(data).then((res) => {
      let cart_arr = [{
        id: res.data,
        num: 1 < minSalesNums ? minSalesNums : 1
      }];
      let urlOptions = {
        cart_arr: cart_arr,
      }
      let pagePath = `/promotion/pages/communityGroupOrderSubmit/communityGroupOrderSubmit`;
      app.turnToPage(pagePath, '', urlOptions);
    })
  },
  _previewPay: function (e) {
    let cartList = this.data.cartList;
    let cart_arr = [];
    if (!cartList.length) {
      app.showModal({
        content: '购物车暂无商品，请添加商品后再结算~'
      })
      return;
    }
    cartList.map((item) => {
      cart_arr.push({
        id: item.id,
        num: item.num
      })
    })
    let urlOptions = {
      cart_arr: cart_arr
    }
    let pagePath = `/promotion/pages/communityGroupOrderSubmit/communityGroupOrderSubmit`;
    app.turnToPage(pagePath, '', urlOptions);
  },
  drawing: function () {
    let _this = this;
    const ctx = wx.createCanvasContext('goodsImage', this);
    _this.setDrawImage(ctx, _this.data.pageQRCodeData.goodsInfo.goods_img, 10, 5, 260, 260, 1);
    _this.setDrawImage(ctx, _this.data.pageQRCodeData.goodsInfo.qrcode_img_url, 190, 280, 70, 70, 0);
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, 280, 390)
    ctx.font = 'normal bold 18px';
    ctx.setFontSize(30 * _this.dpr);
    ctx.setFillStyle('#333333');
    let nickname = '';
    if (_this.data.pageQRCodeData.community.nickname.length > 8) {
      nickname = _this.data.pageQRCodeData.community.nickname.substr(0, 8) + '...';
    } else {
      nickname = _this.data.pageQRCodeData.community.nickname;
    }
    ctx.fillText(nickname, 41, 300)
    _this.setFillText(ctx, _this.data.pageQRCodeData.goodsInfo.text, '#333333', 324);
  },
  setFillText: function (ctx, text, color, y) {
    let _this = this;
    let textString;
    if (text.length > 20) {
      textString = text.substr(0, 19) + '...';
    } else {
      textString = text;
    }
    let textRowArr = [];
    for (let tmp = 0; tmp < textString.length;) {
      textRowArr.push(textString.substr(tmp, 11))
      tmp += 11
    }
    for (let item of textRowArr) {
      ctx.setFontSize(26 * _this.dpr);
      ctx.setFillStyle(color);
      ctx.fillText(item, 10, y);
      y += 20;
    }
    let goodsInfo = this.data.pageQRCodeData.goodsInfo;
    let price = '';
    if (goodsInfo.price) {
      ctx.setFontSize(36 * _this.dpr);
      ctx.setFillStyle('#FF3600');
      let symbolIndex = goodsInfo.price.indexOf('~');
      price = symbolIndex !== -1 ? goodsInfo.price.substr(0, symbolIndex) : goodsInfo.price
      if (goodsInfo.integral == '2') {
        if (goodsInfo.price == '0.00') {
          ctx.fillText(goodsInfo.max_can_use_integral + '积分', 10, y + 10)
        } else {
          ctx.fillText('¥' + goodsInfo.price + '+' + goodsInfo.max_can_use_integral + '积分', 10, y + 10);
        }
      } else {
        ctx.fillText(price, 19, y + 10);
        ctx.beginPath();
        ctx.setFontSize(28 * _this.dpr);
        ctx.setFillStyle('#FF3600');
        ctx.fillText('¥', 10, y + 10);
      }
    }
    let virtual_price = goodsInfo.virtual_price;
    if (virtual_price) {
      let vx = (price.length + 1) * 9 + 20;
      ctx.setFontSize(28 * _this.dpr);
      ctx.setFillStyle('#999');
      ctx.fillText('¥' + virtual_price, vx, y + 10);
      ctx.beginPath();
      ctx.setStrokeStyle('#999');
      ctx.moveTo(vx, y + 6);
      ctx.lineTo(vx + (String(virtual_price).length + 1) * 6 + 12, y + 6);
      ctx.stroke();
    }
    ctx.setFontSize(10);
    ctx.setFillStyle('#666666');
    ctx.fillText('长按识别二维码', 190, 365)
    ctx.beginPath()
    ctx.setLineWidth(1)
    ctx.setLineJoin('miter')
    ctx.moveTo(260, 280)
    ctx.lineTo(270, 280)
    ctx.lineTo(270, 290)
    ctx.moveTo(260, 375)
    ctx.lineTo(270, 375)
    ctx.lineTo(270, 365)
    ctx.moveTo(190, 280)
    ctx.lineTo(180, 280)
    ctx.lineTo(180, 290)
    ctx.moveTo(190, 375)
    ctx.lineTo(180, 375)
    ctx.lineTo(180, 365)
    ctx.setStrokeStyle('#FF3600');
    ctx.stroke()
  },
  setDrawImage: function (ctx, src, x, y, w, h, number) {
    let _this = this;
    wx.getImageInfo({
      src: app.getSiteBaseUrl() + '/index.php?r=Download/DownloadResourceFromUrl&url=' + src,
      success: function (res) {
        ctx.save();
        if (number == 1) {
          _this.drawCanvasImg(ctx, res.path, x, y, w, h, function () {
            _this.setDrawImage(ctx, _this.data.pageQRCodeData.community.imgIcon, 10, 265 - 46 * _this.dpr, 200 * _this.dpr, 46 * _this.dpr, 3);
          });
        } else if (number == 2) { //如果是画头像原图
          ctx.arc(22, 292, 12, 0, Math.PI * 2)
          ctx.clip();
          _this.drawCanvasImg(ctx, res.path, x, y, w, h);
        } else if (number == 3) { //如果是画商品图上的宣传标志
          _this.drawCanvasImg(ctx, res.path, x, y, w, h, function () {
            ctx.setFontSize(26 * _this.dpr);
            ctx.setFillStyle('#ffffff');
            ctx.fillText(_this.data.pageQRCodeData.community.imgIconTxt, 39, 260);
            _this.setDrawImage(ctx, _this.data.pageQRCodeData.community.logo, 10, 280, 24, 24, 2)
          });
        } else {
          _this.drawCanvasImg(ctx, res.path, x, y, w, h);
        }
      }
    })
  },
  drawCanvasImg: function (ctx, path, x, y, w, h, callback) {
    ctx.drawImage(path, x, y, w, h);
    if (typeof callback == 'function') {
      ctx.draw(true, function () {
        callback();
      })
    } else {
      ctx.draw(true)
    }
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
  hideShareDialog: function () {
    let animation = wx.createAnimation({
      duration: 200,
      timingFunction: "ease"
    })
    this.animation = animation;
    animation.bottom("-320rpx").step()
    this.setData({
      "pageQRCodeData.shareDialogShow": "100%",
      "pageQRCodeData.shareMenuShow": false,
      "pageQRCodeData.animation": animation.export(),
      "pageQRCodeShow": false
    })
  },
  showPageCode: function () {
    let animation = wx.createAnimation({
      duration: 200,
      timingFunction: "ease"
    })
    this.animation = animation;
    animation.bottom("-320rpx").step()
    this.setData({
      "pageQRCodeData.shareMenuShow": false,
      "pageQRCodeData.animation": animation.export(),
      pageQRCodeShow: true
    }, () => {
      if (this.data.pageQRCodeData.drawType == 1) {
        this.drawing();
        return;
      }
      if (!this.data.canvas) {
        wx.createSelectorQuery().in(this).select('#canvas2d').fields({
          node: true,
          size: true,
        }).exec(this.initCanvas.bind(this))
      } else {
        this.drawShareImg()
      }
    });
  },
  savePageCode: function () {
    let _this = this;
    wx.canvasToTempFilePath({
      canvasId: 'goodsImage',
      success(res) {
        _this.pageCode(res.tempFilePath);
      }
    }, this)
  },
  onShareAppMessage: function () {
    this.setData({
      pageQRCodeData: {
        shareDialogShow: "100%",
        shareMenuShow: false,
      }
    })
    app.sendUseBehavior([{ goodsId: this.goodsId }], 2);
    let that = this,
      title = this.data.communityGoodsList.price + '团购【' + this.data.communityGoodsList.title + '】',
      shareImage = this.data.communityGoodsList.form_data.share_img || this.data.communityGoodsList.cover,
      path = `/communityGroup/pages/commuGroupGoods/commuGroupGoods?goodsId=${that.goodsId}&leaderToken=${that.leader_token}`;
    return app.shareAppMessage({
      path: path,
      title: title,
      imageUrl: shareImage,
      success: function (addTime) {
        console.log('转发成功')
      }
    });
  },
  pageCode: function (url) {
    let animation = wx.createAnimation({
      duration: 200,
      timingFunction: "ease"
    })
    this.animation = animation;
    animation.bottom("-320rpx").step()
    let that = this;
    wx.showLoading({ mask: true })
    wx.saveImageToPhotosAlbum({
      filePath: url,
      success: function (data) {
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 4000
        })
        that.animation = animation;
        that.animation.bottom("-320rpx").step();
        that.setData({
          "pageQRCodeData.shareDialogShow": "100%",
          "pageQRCodeData.shareMenuShow": false,
          "pageQRCodeData.animation": that.animation.export(),
          "pageQRCodeShow": false
        })
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
      },
      complete: function (res) {
        wx.hideLoading();
      }
    })
  },
  changeImageOrVideo: function (event) {
    if (event.currentTarget.dataset.type === 'video' && this.data.communityGoodsList.form_data.video_img || event.currentTarget.dataset.type === 'image') {
      this.setData({
        imageOrVideo: event.currentTarget.dataset.type,
        showPlayButton: !this.data.showPlayButton
      })
    }
  },
  clickCommentLabel: function (e) {
    var commentType = e.currentTarget.dataset.type,
      data = {};
    this.page = 1;
    data.commentType = commentType;
    data['evaluateList.data'] = [];
    this.setData(data);
    this.getUserEvalute();
  },
  getRoleInfo: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/GetDistributionRoleInfo',
      data: {
        role: 6  // 角色 6代表社区团购角色
      },
      success: function (res) {
        _this.setData({
          isShowEvaluate: res.data.goods_config.is_show_evaluate //0 不显示评价  1显示评价
        })
      }
    })
  },
  initCanvas(res) {
    const { width, height, node } = res[0]
    const ctx = node.getContext('2d')
    const dpr = wx.getSystemInfoSync().pixelRatio
    node.width = width * dpr
    node.height = height * dpr
    ctx.scale(dpr, dpr)
    this.setData({ "canvas": node })
    this.drawShareImg()
  },
  saveCanvas2DCode: function () {
    let canvas = this.data.canvas
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: canvas.width,
      height: canvas.height,
      destWidth: canvas.width,
      destHeight: canvas.height,
      canvas: canvas,
      quality: 1,
      success: res => {
        this.pageCode(res.tempFilePath);
      }
    })
  },
  drawShareImg() {
    let node = this.data.canvas
    let { drawType, goodsType, canvasStyle, goodsInfo } = this.data.pageQRCodeData;
    goodsInfo['leaderInfo'] = this.data.leaderInfo;
    goodsInfo['communityInfo'] = this.data.communityInfo;
    DrawShare.getInstance(node, goodsType, goodsInfo, drawType, {
      'canvas': canvasStyle
    }).init()
  },
  getGoodsLimit: function () {
    let that = this;
    app.getGoodsLimit(this.goodsId).then((data) => {
      if (data) {
        that.setData({
          isVipLimit: !data.vip_limit, // 会员限购
          isGoodsLimit: !data.goods_limit, // 商品限购
        });
      }
    });
  },
  checkGoodsNumInCart: function (goods_id, model_id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/cartList',
      data: {
        page: 1,
        page_size: 1000,
        dis_group_id: -1
      },
      success: function(res) {
        let cartList = res.data;
        if (cartList) {
          let data = {};
          data['selectGoodsModelInfo.currentGoodsNum'] = 0;
          for (let i=0; i<cartList.length; i++) {
            let item = cartList[i];
            if (item.goods_id == goods_id) {
              data['selectGoodsModelInfo.currentGoodsNum'] = +item.num;
              if (item.model_id > 0) {
                if (item.model_id == model_id) {
                  that.setData({
                    ['selectGoodsModelInfo.currentGoodsNum'] : +item.num
                  })
                  that.setData(data);
                  return;
                }else {
                  data['selectGoodsModelInfo.currentGoodsNum'] = 0;
                }
              }
            }
          }
          that.setData(data);
        }
      }
    })
  },
  getGroupLeaderLocking() {
    let _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistributionExt/getDistributorGroupLeaderByUserToken',
      success: function (res) {
        if(res.data){
          let leaderInfo = res.data.leader_info;
          _this.leader_token = leaderInfo.user_token;
          app.globalData.leaderInfo = leaderInfo;   //把团长信息存在全局，方便拿取
          _this.setData({leaderInfo});
        }
      }
    }) 
  },
  distributorGroupLeaderLocking() {
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/distributorGroupLeaderLocking',
      data: {
        leader_token: this.leader_token
      }
    })
  },
})