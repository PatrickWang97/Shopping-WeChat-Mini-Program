var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    userInfo: {},
    distributionInfo: '',
    distributorInfo: '',
    shopImg: '',
    orderRecord: false,
    dis_group_info: {
      is_audit: 0 // 1：审核通过 2：待审核 3：审核拒绝',
    },
    commissionArr: [{
      title: '分销佣金',
      price: '0.000'
    }, {
      title: '待打款佣金',
      price: 0
    },],
    shopTypeData: {} // 当前app_id角色
  },
  isClickShopset: false,
  onLoad: function (options) {
    this.isClickShopset = options.isClickShopset ? true : false;
    this.dataInitial();
    this.initOrder();
    this.setData({
      shopTypeData: app.getShopTypeData(),
      userInfo: app.getUserInfo()
    })
  },
  onShow: function () {
    this.getDistributorInfo();
    if(this.isClickShopset) {
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
      app.turnToPage('/promotion/pages/promotionWithdraw/promotionWithdraw?fromType=1');
      this.isClickShopset = true;
    }
  },
  checkCommission: function () {
    app.turnToPage(`/promotion/pages/promotionCommission/promotionCommission?orderRecord=${this.data.orderRecord}&is_audit=${this.data.dis_group_info.is_audit}`);
    this.isClickShopset = true;
  },
  checkWithdrawRecord: function () {
    app.turnToPage('/promotion/pages/promotionWithdrawRecord/promotionWithdrawRecord?fromType=1');
    this.isClickShopset = true;
  },
  checkGoods: function () {
    app.turnToPage(`/promotion/pages/promotionGoods/promotionGoods?is_audit=${this.data.dis_group_info.is_audit}`);
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
    app.turnToPage('/promotion/pages/promotionMyPromotion/promotionMyPromotion');
    this.isClickShopset = true;
  },
  checkShopSetting: function () {
    app.turnToPage(`/promotion/pages/promotionShopSetting/promotionShopSetting`);
    this.isClickShopset = true;
  },
  goMyShop: function () {
    let homepageRouter = app.getHomepageRouter();
    app.reLaunch({
      url: '/pages/' + homepageRouter + '/' + homepageRouter + '?promotionName=' + this.data.distributorInfo.shop_name || this.data.userInfo.nickname
    })
    app.globalData.PromotionUserToken = this.data.distributorInfo.user_token;
  },
  getDistributorInfo: function () {
    var that = this,
      nowCommission = 0.00, //  可提现总佣金
      commissionArr = [], //  佣金详细
      toHitCommission = 0; //  待打款佣金
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      success: function (res) {
        let data = res.data;
        if(!data){
          app.showModal({
            content: '暂时不是分销人员',
            confirm: function () {
              app.turnToPage('/promotion/pages/promotionApply/promotionApply', 1);
            }
          });
        }
        app.globalData.getDistributorInfo = data;
        toHitCommission = parseFloat((+data.total_commission - +data.unsure_commission - +data.can_withdraw_commission - +data.withdrew_commission).toFixed(3));
        toHitCommission = +toHitCommission <= 0 ? 0 : toHitCommission;
        nowCommission = data.can_withdraw_commission ? data.can_withdraw_commission : '0.000';
        commissionArr = [{
          title: '分销佣金',
          price: data.distributor_total_commission ? data.distributor_total_commission : '0.000'
        }, {
          title: '待打款佣金',
          price: toHitCommission || 0
        },]
        if (data.dis_group_info && data.dis_group_info.is_deleted == 1) {
          data.dis_group_info.is_audit = 3
        }
        that.setData({
          distributorInfo: data,
          nowCommission: nowCommission,
          userLevel: data.level_info ? data.level_info.level_name : '',
          dis_group_info: data.dis_group_info || { is_audit : 0 },
          commissionArr: commissionArr,
        })
      }
    })
  },
  checkApply: function () {
    if (this.data.dis_group_info.is_audit == 0) {
      app.turnToPage(`/promotion/pages/communityGroupApply/communityGroupApply?fromPage=shop`);
    } else {
      app.turnToPage(`/promotion/pages/communityGroupApplyStatus/communityGroupApplyStatus`);
    }
    this.isClickShopset = true;
  },
  checkOrder: function () {
    app.turnToPage('/promotion/pages/communityGroupOrder/communityGroupOrder');
    this.isClickShopset = true;
  },
  checkWriteOff: function () {
    app.turnToPage('/promotion/pages/communityGroupWriteOff/communityGroupWriteOff');
    this.isClickShopset = true;
  },
  initOrder: function() {
    let _this = this;
    let data = {
      page: 1,
      page_size: 25,
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributionGroupOrderByleader',
      method: 'post',
      data: data,
      success: function(res) {
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
  }
})
