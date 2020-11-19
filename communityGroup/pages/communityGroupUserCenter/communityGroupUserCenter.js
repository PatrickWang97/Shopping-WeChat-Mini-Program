var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    userInfo: {},
    distributionInfo: '',
    distributorInfo: '',
    colonelInfo: '',
    shopImg: '',
    orderRecord: false,
    isShowReason: false, // 是否显示团长停用弹窗
    blockReason :'',  // 停用理由
    isCheckedReason: false,
    is_audit: 0, // 1：审核通过 2：待审核 3：审核拒绝',
    commissionArr: [{
      title: '累计收入',
      price: '0.000'
    }, {
      title: '累计社区佣金',
      price: 0
    },]
  },
  isClickShopset: false,
  onLoad: function (options) {
    this.isClickShopset = options.isClickShopset ? true : false;
    this.dataInitial();
    this.initOrder();
    this.setData({
      userInfo: app.getUserInfo()
    })
    let _this = this;
    let optionData = {
      leader_token: _this.data.userInfo.user_token
    }
    if (app.globalData.getDistributorInfo) {
      if (+app.globalData.getDistributorInfo.is_block_up === 1) {
        optionData['is_from_admin'] = 1
      }
    }
    this.getDistributorInfo(optionData);
  },
  onShow: function () {
    if (this.isClickShopset) {
      this.isClickShopset = false;
    }
  },
  dataInitial: function () {
    this.setData({
      distributionInfo: app.globalData.getDistributionInfo
    })
  },
  checkLevelRules: function () {
    app.turnToPage('/promotion/pages/promotionUserLevel/promotionUserLevel?levelId=' + this.data.distributorInfo.level_info.id);
  },
  withdraw: function () {
    if (!this.isClickShopset) {
      app.turnToPage('/promotion/pages/promotionWithdraw/promotionWithdraw?fromType=2');
      this.isClickShopset = true;
    }
  },
  checkCommission: function () {
    app.turnToPage(`/communityGroup/pages/communityCommission/communityCommission?orderRecord=${this.data.orderRecord}&is_audit=${this.data.is_audit}&distributorInfo=${this.data.distributorInfo}`);
    this.isClickShopset = true;
  },
  checkWithdrawRecord: function () {
    app.turnToPage('/promotion/pages/promotionWithdrawRecord/promotionWithdrawRecord?fromType=2');
    this.isClickShopset = true;
  },
  checkGoods: function () {
    let is_audit = this.data.is_audit;
    if (+this.data.is_block_up == 1) { //当团长被停用
      is_audit = 4
    } 
    app.turnToPage(`/communityGroup/pages/communityGoods/communityGoods?is_audit=${is_audit}`);
    this.isClickShopset = true;
  },
  checkIdentity: function () {
    app.turnToPage('/promotion/pages/promotionMyIdentity/promotionMyIdentity');
    this.isClickShopset = true;
  },
  checkTeam: function () {
    app.turnToPage('/promotion/pages/promotionTeam/promotionTeam');
    this.isClickShopset = true;
  },
  checkMyPromotion: function () {
    app.turnToPage('/communityGroup/pages/communityPromotion/communityPromotion');
    this.isClickShopset = true;
  },
  checkShopSetting: function () {
    app.turnToPage(`/promotion/pages/promotionShopSetting/promotionShopSetting`);
    this.isClickShopset = true;
  },
  goUserInfo: function() {
    if (+this.data.distributorInfo.is_block_up === 1) {
      app.turnToPage(`/communityGroup/pages/communityGroupApplyStatus/communityGroupApplyStatus`);
    } else {
      app.turnToPage(`/communityGroup/pages/communityGroupInfo/communityGroupInfo`);
    }
    this.isClickShopset = true;
  },
  goMyShop: function () {
    let homepageRouter = app.getHomepageRouter();
    app.reLaunch({
      url: '/pages/' + homepageRouter + '/' + homepageRouter + '?promotionName=' + this.data.distributorInfo.shop_name || this.data.userInfo.nickname
    })
    app.globalData.PromotionUserToken = this.data.distributorInfo.user_token;
  },
  getDistributorInfo: function (optionData) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
      data: optionData,
      success: function (res) {
        let data = res.data[0];
        if(data){
          if (data.is_block_up == 1) {
            if (app.globalData['isShowBlockReason']) {
              let reason = app.globalData['isShowBlockReason'];
              that.setData({ isShowReason: reason === 1 ? true : false })
            } else {
              app.globalData['isShowBlockReason'] = 1;//1是显示,2是不显示
              that.setData({ isShowReason: true })
            }
            that.setData({
              blockReason: data.reason ? (data.reason.block ? data.reason.block.split('\n') : []) : []
            })
          }
          app.globalData.getDistributorInfo = data;
          that.getInfoToData(data)
        }
      }
    })
  },
  getInfoToData: function(data){ //处理获得的团长信息
    var that = this,
        nowCommission = 0.00, //  可提现总佣金
        commissionArr = []; //  佣金详细
    nowCommission = data.distributor.can_withdraw_commission ? data.distributor.can_withdraw_commission : '0.000';
    commissionArr = [{
      title: '累计收入',
      price: (+data.leader_total_e_commission + (+data.leader_fee_total_e_commission)).toFixed(2) || '0.000'
    }, {
      title: '累计社区佣金',
      price:  (+data.leader_total_e_commission).toFixed(2) || '0.000'
    },]
    if (data && data.is_deleted == 1) {
      data.is_audit = 3
    }
    that.setData({
      distributorInfo: data,
      nowCommission: nowCommission,
      userLevel: data.level_info ? data.level_info.level_name : '',
      commissionArr: commissionArr,
    })
  },
  checkApply: function () {
    if (this.data.is_audit == 0) {
      app.turnToPage(`/promotion/pages/communityGroupApply/communityGroupApply?fromPage=shop`);
    } else {
      app.turnToPage(`/promotion/pages/communityGroupApplyStatus/communityGroupApplyStatus`);
    }
    this.isClickShopset = true;
  },
  checkOrder: function () {
    app.turnToPage('/communityGroup/pages/communityGroupOrder/communityGroupOrder');
    this.isClickShopset = true;
  },
  checkWriteOff: function () {
    app.turnToPage('/promotion/pages/communityGroupWriteOff/communityGroupWriteOff');
    this.isClickShopset = true;
  },
  initOrder: function () {
    let _this = this;
    let data = {
      page: 1,
      page_size: 25,
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributionGroupOrderByleader',
      method: 'post',
      data: data,
      success: function (res) {
        if (res.data.length) {
          _this.setData({
            orderRecord: true
          })
        }
      }
    })
  },
  turnToSubShop: function () {
    app.turnToPage('/promotion/pages/promotionSubShop/promotionSubShop')
  },
  showBlockReason: function () {
    if (this.data.isCheckedReason) {
      app.globalData['isShowBlockReason'] = 2;
    }
    this.setData({ isShowReason: false })
  },
  checkboxChange: function (e) {
    let checkStatus = !this.data.isCheckedReason
    this.setData({
      isCheckedReason: checkStatus
    });
  }
})
