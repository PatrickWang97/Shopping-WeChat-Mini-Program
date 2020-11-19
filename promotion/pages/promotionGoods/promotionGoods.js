var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    currentTplId: 0,
    goodsArr: [],
    currentType: 0,
    goodsName: '',
    communityArr: [],
    is_audit: 0,
    status: ['未开始','进行中','已结束'],
    isShowTypeItems: false, // 是否展示type-items
    typeItems: {
      enable_commission_group_order:{ // 分销规则 参与分销的类型
      isShow: false,
      icon: 'message-pay',
      bgColor: 'yellow',
      name: '当面付' 
    },
    enable_self_buy_commission:{
      isShow: false,
      icon: 'integral-block',
      bgColor: 'blue',
      name: '储值' 
    },
    enable_commission_seckill_order:{
      isShow: false,
      icon: 'usercenter-gift-card-block',
      bgColor: 'pink',
      name: '礼品卡' 
    },
    enable_commission_paid_vip_card_order:{
      isShow: false,
      icon: 'row-number-fee',
      bgColor: 'orange',
      name: '付费会员卡' 
    }}
  },
  page: 1,
  isMore: 1,
  user_token: '',
  onLoad: function (options) {
    wx.hideShareMenu(); // 禁止分享当前页面，仅支持控件分享
    this.setData({
      is_audit: options.is_audit ? options.is_audit : 0,
      p_id: options.p_id || app.globalData.p_id // 带上分销参数
    })
    this.dataInitial()
  },
  onShow: function () {
  },
  dataInitial: function () {
    this.getDistributionInfo();
    this.getTplId().then(()=>{
      this.getCommissionGoodsList();
    })
    this.getUserToken();
  },
  getDistributionInfo: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributionInfo',
      method: 'post',
      success: function (res) {
        let { status, data } = res,
        typeItems = that.data.typeItems;
        if(status == 0){
          typeItems.enable_commission_group_order.isShow = data.enable_commission_group_order == 1
          typeItems.enable_self_buy_commission.isShow = data.enable_self_buy_commission == 1
          typeItems.enable_commission_seckill_order.isShow = data.enable_commission_seckill_order == 1
          typeItems.enable_commission_paid_vip_card_order.isShow = data.enable_commission_paid_vip_card_order == 1
          that.setData({
            typeItems
          })
        }
      }
    })
  },
  getTplId: function () {
    return new Promise((resolve, reject) => {
      if(this.data.currentType == 10){
        if(this.data.currentTplId){
          resolve(this.data.currentTplId)
        }else {
          let that = this;
          app.sendRequest({
            url: '/index.php?r=AppData/detail',
            success: function (res) {
              let status = res.status;
              let data = res.data;
              if(status == 0){
                let appData = JSON.parse(data.app_data);
                if(appData && appData.data && appData.data.additionalData && appData.data.additionalData.currentAppointmentTplId){
                  that.data.currentTplId = appData.data.additionalData.currentAppointmentTplId;
                }
                resolve(true)
              }else{
                reject(false)
              }
            }
          })
        }
      }else{
        resolve(true)
      }
    })
  },
  getCommissionGoodsList: function () {
    var _this = this;
    let params = {
      page: _this.page,
      goods_type: _this.data.currentType,
      idx_arr: {
        idx: 'title',
        idx_value: _this.data.goodsName
      }
    }
    if(_this.data.currentType == 0){
      Object.assign(params,{
        pick_up_type: [1,2,3,4]
      })
    }
    if(_this.data.currentType == 10){
      Object.assign(params,{
        tpl_id: _this.data.currentTplId
      })
    }
    if (_this.data.currentType == 'evoucher') {
      Object.assign(params,{
        show_virtual_goods: 1
      });
    }
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getCommissionGoodsList',
      method: 'post',
      data: params,
      success: function (res) {
        for (let i in res.data) {
          res.data[i].first_commission = (+res.data[i].first_commission).toFixed(3);
          res.data[i].second_commission ? res.data[i].second_commission = (+res.data[i].second_commission).toFixed(3) : '';
        }
        let finalGoodsArr = [..._this.data.goodsArr, ...res.data]
        finalGoodsArr.map((item)=>{
          item.first_data = _this.commissionPrice(item.first_commission, item,'first');
          item.second_data = _this.commissionPrice(item.second_commission, item,'second');
          return item;
        })
        _this.setData({
          isMore: res.is_more,
          goodsArr: finalGoodsArr
        })
      }
    })
  },
  changeMenu: function (e) {
    let currentType = e.currentTarget.dataset.type
    this.page = 1;
    this.setData({
      goodsArr: [],
      goodsName: '',
      currentType: currentType
    })
    this.getTplId().then(()=>{
      this.getCommissionGoodsList();
    })
  },
  onReachBottom: function () {
    if (!this.isMore) { return };
    this.page++;
    this.getTplId().then(()=>{
      this.getCommissionGoodsList();
    });
  },
  inputSearch: function (event) {
    this.setData({
      goodsName: event.detail.value
    })
  },
  searchGoods: function () {
    this.page = 1;
    this.setData({
      goodsArr: [],
    })
    this.getTplId().then(()=>{
      this.getCommissionGoodsList();
    })
  },
  getUserToken: function () {
    this.user_token = app.getUserInfo().user_token;
  },
  turnToGoodsDetail: function(e) {
    let { id, currentType } = e.currentTarget.dataset;
    let path = `/detailPage/pages/goodsDetail/goodsDetail?detail=${id}`;
    if (+currentType === 10) { // 若为行业预约
        return;
    }
    app.turnToPage(path);
  },
  firCommission: function (res) {
    let commission;
    if (res.commission_setting && res.commission_setting.is_custom_commission == 1) {
      if (res.goods_model_min_max_ommission) {
        commission = '¥' + res.goods_model_min_max_ommission.first_min_commission + '~' + '¥' + res.goods_model_min_max_ommission.first_max_commission
      } else {
        commission = res.commission_setting.commission_type == 0 ? (res.commission_setting.first_commission + '%') : res.commission_setting.first_commission
      }
    } else {
      commission = res.first_commission + '%'
    }
    return commission
  },
  secCommission: function (res) {
    let commission;
    if (res.commission_setting && res.commission_setting.is_custom_commission == 1) {
      if (res.goods_model_min_max_ommission) {
        commission = '¥' + res.goods_model_min_max_ommission.second_min_commission + '~' + '¥' + res.goods_model_min_max_ommission.second_max_commission
      } else {
        commission = res.commission_setting.commission_type == 0 ? (res.commission_setting.second_commission + '%') : res.commission_setting.second_commission
      }
    } else {
      commission = res.second_commission + '%'
    }
    return commission
  },
  changeToisShowTypeItems: function () {
    this.setData({
      isShowTypeItems: !this.data.isShowTypeItems
    })
  },
  onShareAppMessage: function (e) {
    let goodsInfo = e.target.dataset.info;
    let path = `/detailPage/pages/goodsDetail/goodsDetail?detail=${goodsInfo.id}&p_id=${this.data.p_id}`;
    if(this.data.currentType == 10){ // 若为行业预约
      let homepageRouter = app.getHomepageRouter();
      path = `/pages/${homepageRouter}/${homepageRouter}?p_id=${this.data.p_id}`
    }
    return {
      title: goodsInfo.title,
      path: path,
      imageUrl: goodsInfo.cover,
      success: function (res) {
        wx.showToast({
          title: "分享成功",
          icon: 'success',
          duration: 2000
        })
      },
      fail: function (res) {
      },
    }
  },
  commissionPrice: function (value,item,kind) {
    let { price,commission_setting,goods_model_min_max_ommission } = item;
    if(!commission_setting || (commission_setting && commission_setting.commission_type && +commission_setting.commission_type !== 1)){
      return (+price * +value / 100).toFixed(2) + '(' + (+value).toFixed(2)  + '%)'
    }
    if(!goods_model_min_max_ommission && commission_setting && commission_setting.commission_type && +commission_setting.commission_type === 1){
      return (+value).toFixed(2)
    }
    if(goods_model_min_max_ommission && commission_setting && commission_setting.commission_type && +commission_setting.commission_type === 1){
      if(goods_model_min_max_ommission.first_min_commission !== goods_model_min_max_ommission.first_max_commission){
       return goods_model_min_max_ommission.first_min_commission + '~' + goods_model_min_max_ommission.first_max_commission
      }else{
        return kind == 'first' ? goods_model_min_max_ommission.first_min_commission : goods_model_min_max_ommission.second_min_commission
      }
    }
  }
})
