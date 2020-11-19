var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '优惠券领取列表',
    },
    couponList: [],
    receiveSuccess: 0,  // 领取成功弹窗是否显示
    receiveCount: 0,    // 已领取数量
    receiveLimitNum: 0, // 领取限制数量
    userInfo: {},
    couponsAndDiscount: {},
    totalUser: 0,
    category: {},
    currentCate: '',
    latitude: '',
    longitude: '',
    isParentShop: false,
    headquartersId: '',
    recvCouponPopFranchisee: false,
    recvCouponPopAppId: '',
    recvCouponPopAppMode: '',
    recvCouponPopAppBiz: '',
    couponNoMore: false,
    recving: false,       // 领取中
    addLabelText: '',     // 兑换码 
    hiddenmodalput: false, // 兑换弹窗
    totalCount: 0,
    receiveCountInfo: {}, //兑换优惠券信息
    hiddenmodalInfo: false, // 兑换优惠券弹窗
    recvCouponPopSubBar: {},  // 优惠券所属店铺底部导航信息
    recvCouponPopHisData: {},  // 连锁数据  
  },
  onLoad: function() {
    let that = this;
    let isParent = app.globalData.hasFranchiseeList || app.globalData.hasFranchiseeChain;
    that.setData({
      headquartersId: app.globalData.appId,
      isParentShop: isParent
    });
    if (isParent){
      if (app.isLogin()) {
        that.setData({
          userInfo: app.globalData.userInfo
        });
      } else {
        app.goLogin({
          success: function () {
            that.setData({
              userInfo: app.globalData.userInfo
            });
          }
        });
      }
      that.getLocation();
      that.getCategoryForCoupon();
      that.getDiscountCut();
      that.getTotalUser();
    }else{
      that.getCoupons();
    }
  },
  onShow: function() {
    this.getCouponCount();
  },
  getCoupons: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getCoupons',
      data: {
        in_use_date: 1, //0是全部，1是只显示可领取的优惠券
        in_show_list: 1,  //0:不在列表内 1:在列表内
        enable_status: 1, //0:下架 1:上架
        stock: 1,         //0:没有库存的 1:有库存的
        page: -1
      },
      hideLoading: true,
      success: function (res) {
        let data = res.data;
        for(let item of data){
          if (parseInt(item.value) == item.value) {
            item.value = parseInt(item.value);
          };
          item.start_use_date = util.formatTimeYMD(item.start_use_date, 'YYYY.MM.DD');
          item.end_use_date = util.formatTimeYMD(item.end_use_date, 'YYYY.MM.DD');
          if(item.type == 5){
            item.extra_condition = item.extra_condition.replace(/\\n/g, '');
          }
          _this.isShowCouponMore(item)
        }
        _this.setData({
          couponList: data
        });
      }
    })
  },
  gotoCouponDetail: function(event){
    let couponId = event.currentTarget.dataset.couponId;
    let appid = event.currentTarget.dataset.appid;
    let franisee = '';
    if (this.data.headquartersId != appid && this.data.isParentShop){
      franisee = '&franchisee=' + appid;
    }
    let url = '/pages/couponDetail/couponDetail?detail=' + couponId + franisee;
    app.turnToPage(url, false);
  },
  formSubmit: function(event){
    let _this = this,
        couponId = event.currentTarget.dataset.couponId,
        category = event.currentTarget.dataset.category,
        formId = event.detail.formId,
        index = event.currentTarget.dataset.index,
        item = _this.data.couponList[index];
    if(this.data.recving){
      return
    }        
    this.setRecving(true);
    app.requestSubscribeMessage([{
      type: '4097',
      obj_id: couponId
    },{
      type: '4098',
      obj_id: couponId
    },{
      type: '4099',
      obj_id: couponId
    }]).then(()=> {
      app.sendRequest({
        url: '/index.php?r=AppShop/recvCoupon',
        data: {
          coupon_id: couponId,
          form_id: formId,
          alliance_coupon: category == 1 ? 1 : 0,
        },
        hideLoading: true,
        success: function(res) {
          let newdata = {};
          app.sendUseBehavior([{'goodsId': couponId}],18); // 行为记录
          if(res.data.is_already_recv == 1){
            newdata['couponList[' + index + '].recv_status'] = 0;
          }
          if (item.type != 0 && item.type != 4 && item.type != 6 && item.wx_card_id) {
            app.addToWxCard(item.wx_card_id, res.data.user_coupon_id);
          }
          newdata['receiveSuccess'] = 1;
          newdata['receiveCount'] = res.data.recv_count;
          newdata['receiveLimitNum'] = res.data.limit_num;
          _this.setData(newdata);
          setTimeout(()=>{
            newdata['receiveSuccess'] = 0;
            newdata['totalCount'] = ++_this.data.totalCount;
            _this.setData(newdata);
          },2000)
        },
        complete: function () {
          _this.setRecving(false);
        }
      })
    })
  },
  setRecving: function(bool){
    this.setData({
      recving: bool
    })
  },
  formSubmitFranchisee: function (event) {
    let that = this,
      dataset = event.currentTarget.dataset,
      index = dataset.index,
      category = dataset.category,
      formId = event.detail.formId,
      item = that.data.couponList[index],
      couponId = item.id,
      appid = item.app_id,
      mode = item.mode_id;
    if(this.data.recving){
      return
    }   
    this.setRecving(true);    
    app.requestSubscribeMessage([{
      type: '4097',
      obj_id: couponId
    },{
      type: '4098',
      obj_id: couponId
    },{
      type: '4099',
      obj_id: couponId
    }]).then(()=> {
      app.sendRequest({
        url: '/index.php?r=AppShop/recvCoupon',
        data: {
          coupon_id: couponId,
          form_id: formId,
          sub_app_id: appid,
          alliance_coupon: category == 1 ? 1 : 0, // 是否为联盟优惠券
        },
        hideLoading: true,
        success: function (res) {
          let newdata = {};
          app.sendUseBehavior([{'goodsId': couponId}],18); // 行为记录
          if (res.data.is_already_recv == 1) {
            newdata['couponList[' + index + '].recv_status'] = 0;
          }
          if (item.type != 0 && item.type != 4 && item.type != 6 && item.wx_card_id) {
            app.addToWxCard(item.wx_card_id, res.data.user_coupon_id);
          }
          newdata['recvCouponPopFranchisee'] = true;
          newdata['recvCouponPopAppId'] = appid;
          newdata['recvCouponPopAppMode'] = mode;
          newdata['recvCouponPopAppBiz'] = item.is_biz_shop;
          newdata['couponsAndDiscount.coupons'] = that.data.couponsAndDiscount.coupons + 1;
          newdata['totalCount'] = ++that.data.totalCount;
          newdata['recvCouponPopSubBar'] = item.sub_app_bar || {};
          newdata['recvCouponPopHisData'] = item.s_his_data || {};
          that.setData(newdata)
        },
        complete: function () {
          that.setRecving(false);
        }
      })
    })
  },
  gotoCouponList: function(){
    let url = '/eCommerce/pages/couponList/couponList';
    app.turnToPage(url, false);
  },
  hideToast: function(){
    this.setData({
      receiveSuccess: 0,
      receiveCount: 0,
      receiveLimitNum: 0
    });
  },
  stopPropagation: function () {},
  getDiscountCut: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCouponsAndDiscountCutTotalPrice',
      data: {
      },
      hideLoading: true,
      success: function (res) {
        that.setData({
          couponsAndDiscount: res.data
        });
      }
    })
  },
  getTotalUser: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetTotalUser',
      data: {
      },
      hideLoading: true,
      success: function (res) {
        that.setData({
          totalUser: res.data
        });
      }
    })
  },
  getCategoryForCoupon: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCategoryForCoupon',
      data: {
      },
      hideLoading: true,
      success: function (res) {
        that.setData({
          category: res.data
        });
      }
    })
  },
  getLocation: function(){
    let that = this;
    app.getLocation({
      success: function (res) {
        that.setData({
          longitude: res.longitude,
          latitude: res.latitude
        });
        that.getAllShopCouponList();
      },
      fail: function(){
        that.getAllShopCouponList();
      }
    })
  },
  allCouponData: {
    page: 1,
    loading: false,
    nomore: false
  },
  getAllShopCouponList: function(){
    let that = this;
    if (that.allCouponData.loading || that.allCouponData.nomore){
      return;
    }
    that.allCouponData.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAllShopCouponList',
      method: 'post',
      data: {
        parent_app_id: app.globalData.appId,
        latitude: that.data.latitude,
        longitude: that.data.longitude,
        industry_type: that.data.currentCate,
        page: that.allCouponData.page,
        page_size: 10,
        alliance_coupon: [0, 1],
      },
      success: function (res) {
        let oldList = that.data.couponList;
        let data = res.data;
        for (let item of data) {
          if (parseInt(item.value) == item.value) {
            item.value = parseInt(item.value);
          };
          if (item.type == 5) {
            item.extra_condition = item.extra_condition.replace(/\\n/g, '');
          }
          item.start_use_date = util.formatTimeYMD(item.start_use_date, 'YYYY.MM.DD');
          item.end_use_date = util.formatTimeYMD(item.end_use_date, 'YYYY.MM.DD');
          that.isShowCouponMore(item)
        }
        if (that.allCouponData.page == 1){
          oldList = [];
        }
        for (let index in data) {
          let distance = data[index].distance;
          data[index].distance = util.formatDistance(distance);
        }
        that.setData({
          couponList: oldList.concat(data),
          couponNoMore: res.is_more == 0
        });
        that.allCouponData.page++;
        that.allCouponData.nomore = res.is_more == 0;
      },
      complete: function(){
        that.allCouponData.loading = false
      }
    })
  },
  gotoShop: function(e){
    let dataset = e.currentTarget.dataset;
    let appid = dataset.appid;
    let mode = dataset.mode;
    let biz = dataset.biz;
    let index = dataset.index;
    let chainId = app.getChainId();
    let home = app.getHomepageRouter();
    if (app.globalData.hasFranchiseeChain && chainId !== appid) {
      let s_his_data = index > -1 ? this.data.couponList[index].s_his_data : this.data.recvCouponPopHisData;
      let options = {s_his_data, appId: appid};
      app.couponChangeStore(options);
    } else if (this.data.headquartersId == appid || chainId == appid || biz == 1){
      app.reLaunch({
        url: '/pages/' + home + '/' + home
      })
    } else {
      let subAppBar = {},
          pageLink = '',
          param = {};
      param.detail = appid;
      if (index > -1) {
        subAppBar = this.data.couponList[index].sub_app_bar || {};
      } else {
        subAppBar = this.data.recvCouponPopSubBar;
      }
      pageLink = subAppBar['homepage-router'] || '';
      if (pageLink){
        mode = Number(subAppBar.mode_id || 0);
        let options = { mode, pageLink, franchiseeId: appid, param};
        app.turnToFranchiseePage(options);
        return;
      }
      app.goToFranchisee(mode, param);
    }
  },
  closeRecvCouponPopFranchisee: function(){
    this.setData({
      recvCouponPopFranchisee: false
    })
  },
  clickLoading: false,
  changeTab: function(e){
    let id = e.currentTarget.dataset.id;
    if (id == this.data.currentCate){
      return;
    }
    if (this.clickLoading){
      app.showModal({content: '请勿频繁点击分类'});
      return;
    }
    this.clickLoading = true;
    setTimeout(()=>{
      this.clickLoading = false;
    }, 500);
    this.setData({
      currentCate : id,
      couponNoMore: false
    });
    this.allCouponData.page = 1;
    this.allCouponData.nomore = false;
    this.allCouponData.loading = false;
    this.getAllShopCouponList();
  },
  onReachBottom: function(e){
    let that = this;
    if (that.data.isParentShop){
      that.getAllShopCouponList();
    }
  },
  isShowCouponMore: function (data) {
    data.showMore = false;
    if (data.type == 0 || data.type == 3 || data.type == 5) {
      data.showMore = true;
    } else if (data.type == 1 || data.type == 2 || data.type == 4 || data.type == 6) {
      if (data.extra_goods && data.extra_goods !='null') {
        data.showMore = true;
      }
    }
  },
  isShowCouponMoreData: function (e) {
    let index = e.currentTarget.dataset.index;
    this.data.couponList[index].showMoreData = !this.data.couponList[index].showMoreData;
    this.setData({
      'couponList': this.data.couponList
    })
  },
  confirm: function () {
    let couponInfo = this.data.receiveCountInfo;
    app.sendRequest({
      url: '/index.php?r=AppShop/recvCoupon',
      data: {
        coupon_id: couponInfo.id,
        generalize_code: this.data.addLabelText,
        alliance_coupon: couponInfo.category == 1 ? 1 : 0, // 是否为联盟优惠券
        recv_type: 17
      },
      hideLoading: true,
      success: res => {
        app.sendUseBehavior([{'goodsId': couponInfo.id}],18); // 行为记录
        this.cancelInfo();
        if (couponInfo.type != 0 && couponInfo.type != 4 && couponInfo.type != 6 && couponInfo.wx_card_id) {
          app.addToWxCard(couponInfo.wx_card_id, res.data.user_coupon_id);
        }
        app.showToast({
          title: '领取成功！',
          icon: 'none',
          success: res=> {
            this.setData({
              totalCount: ++this.data.totalCount,
              addLabelText: ''
            })
          }
        })
      }
    })
  },
  cancel: function () {
    let show = this.data.hiddenmodalput;
    this.setData({ hiddenmodalput: !show, addLabelText: '' })
  },
  cancelInfo: function() {
    let show = this.data.hiddenmodalInfo;
    this.setData({ hiddenmodalInfo: !show })
  },
  addLabelInput: function (e) {
    this.setData({ 'addLabelText': e.detail.value })
  },
  getCouponInfo: function () {
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCouponInfo',
      data: {
        generalize_code: this.data.addLabelText
      },
      hideLoading: true,
      success: res => {
        let data = res.data;
        let useCondition = '';
        let useTitle = '';
        if (data.type == 0) {
          useCondition = '满' + data.condition + '，减' + data.value + '元';
          useTitle = '满' + data.condition + '，减' + data.value + '元';
        } else if (data.type == 1) {
          useCondition = '打' + data.value + '折';
          useTitle = data.value + '折折扣券';
        } else if (data.type == 2) {
          useCondition = '可抵扣' + data.value + '元';
          useTitle = data.value + '元代金券';
        } else if (data.type == 3) {
          if (data.extra_condition == '') {
            useCondition = '直接兑换' + data.coupon_goods_info.title;
          } else if (data.extra_condition.price) {
            useCondition = '消费满' + data.extra_condition.price + '元可兑换' + data.coupon_goods_info.title;
          } else if (data.extra_condition.goods_id) {
            useCondition = '购买' + data.condition_goods_info.title + '可兑换' + data.coupon_goods_info.title;
          }
          useTitle = '兑换券';
        } else if (data.type == 4) {
          useCondition = '储值金可充值' + data.value + '元';
          useTitle = data.value + '元储值券';
        } else if (data.type == 5) {
          useCondition = data.extra_condition.replace(/\\n/g, '\n');
          useTitle = '通用券';
        } else if (data.type == 6) {
          useCondition = '可使用' + parseInt(data.value) + '次';
          useTitle = data.value + '次次数券';
        }
        let newData = data;
        newData['useCondition'] = useCondition;
        newData['useTitle'] = useTitle;
        this.setData({
          receiveCountInfo: newData,
          hiddenmodalput: false
        })
        this.cancelInfo();
      }
    });
  },
  getCouponCount: function() {
    app.sendRequest({
      url: '/index.php?r=appVipCard/getUserAccountSurvey',
      success: res => {
        let data = res.data;
        this.setData({
          totalCount: data.coupon_count || 0
        })
      }
    })
  },
})
