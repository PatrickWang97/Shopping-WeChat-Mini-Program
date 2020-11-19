var app = getApp();
Component({
  properties: {
    rewardPointObj: {
      type: Object,
      value: {
        showModal: false,
        count: '',
        callback: ''
      }
    },
    shareGiftsObj: {
      type: Object,
      value: {
        showRewardsModal: false,
        showExtraRewardModal: false,
        gifts: '',
        immediately: '',
        callback: ''
      }
    },
    collectGiftsObj: {
      type: Object,
      value: {
        showModal: false,
        gifts: '',
        callback: ''
      },
     observer: function (newVal) {
        console.log(newVal);
        if (newVal && newVal.showModal){
          var that = this;
          let pageInstance = app.getAppCurrentPage();
          if (pageInstance.data.page_hasNavBar) {
            that.setData({
              topNavBarHeight: app.globalData.topNavBarHeight
            })
          }
        }
      }
    },
    collectGetObj: {
      type: Object,
      value: {
        showModal: false,
        gifts: '',
        callback: ''
      }
    }
  },
  data: {
    rewardPointObj: {
      showModal: false,
      count: '',
      callback: ''
    }, 
    collectGiftsObj: {
      showModal: false,
      gifts: '',
      callback: ''
    },
    collectGetObj: {
      showModal: false,
      gifts: '',
      callback: ''
    },
    shareGiftsObj: {
      showRewardsModal: false,
      showExtraRewardModal: false,
      gifts: '',
      immediately: '',
      callback: ''
    },
    cdnUrl: app.getCdnUrl()
  },
  methods: {
    stopPropagation: function () { },
    closeModal: function () {
      this.setData({
        'rewardPointObj.showModal': false,
      });
      this.rewardPointCB(this.data.rewardPointObj.callback);
    },
    rewardPointCB: function (cbTy) {
      let pageInstance = app.getAppCurrentPage();
      if (typeof (cbTy) == 'function') {
        cbTy();
        return;
      }
      switch (cbTy) {
        case 'turnBack'://回到上一个页面
          app.turnBack();
          break;
        case 'showVip'://成为会员
          pageInstance.setData({
            'shopVipModal': {
              showModal: true,
              isUp: false
            }
          });
          break;
        case 'showVipUp'://会员升级
          pageInstance.setData({
            'shopVipModal': {
              showModal: true,
              isUp: true
            }
          });
          break;
        default:
          break;
      }
    },
    closeShareModal: function () {
      this.setData({
        'shareGiftsObj.showRewardsModal': false
      })
    },
    closeExtraGifts: function () {
      this.setData({
        'shareGiftsObj.showExtraRewardModal': false
      })
    },
    toshareGifts: function () {
      var shareGiftsObj = this.data.shareGiftsObj;
      this.setData({
        'rewardPointObj.showModal': false,
        'shareGiftsObj.showRewardsModal': false
      });
      app.turnToPage('/eCommerce/pages/shareGifts/shareGifts?ids=' + shareGiftsObj.gifts.appoint_ids + '&extraIds=' + shareGiftsObj.gifts.extra_appoint_ids);
    },
    toShowGifts: function (e) {
      let that = this,
          type = that.data.shareGiftsObj.extra_rewards[0].type,
          path;
      switch (type) {
        case '1':
          path = '/eCommerce/pages/couponList/couponList';
          break;
        case '2':
          path = '/userCenter/pages/myIntegral/myIntegral';
          break;
        case '3':
          path = '/eCommerce/pages/balance/balance';
          break;
        case '4':
          path = '/userCenter/pages/vipCardList/vipCardList';
          break;
        case '5':
          path = '/eCommerce/pages/vipBenefits/vipBenefits?id=' + that.data.shareGiftsObj.extra_rewards[0].value;
          break;
        case '6':
          path = '/awardManagement/pages/collectStars/collectStars';
          break;
        case '7':
          path = '/awardManagement/pages/luckyWheelDetail/luckyWheelDetail';
          break;
        case '8':
          path = '/awardManagement/pages/scratch/scratch';
          break;
        case '9':
          path = '/awardManagement/pages/goldenEggs/goldenEggs';
          break;
      }
      this.setData({
        'rewardPointObj.showModal': false,
        'shareGiftsObj.showExtraRewardModal': false
      });
      app.turnToPage(path)
    },
    toCollectGifts: function (e) {
      let that = this,
        data = e.currentTarget.dataset,
        type = data.type,
        path;
      switch (type) {
        case '1':
          path = '/eCommerce/pages/couponList/couponList';
          break;
        case '2':
          path = '/userCenter/pages/myIntegral/myIntegral';
          break;
        case '3':
          path = '/eCommerce/pages/balance/balance';
          break;
        case '4':
          path = '/userCenter/pages/vipCardList/vipCardList';
          break;
        case '5':
          path = '/eCommerce/pages/vipBenefits/vipBenefits';
          break;
        case '6':
          path = '/awardManagement/pages/collectStars/collectStars';
          break;
        case '7':
          path = '/awardManagement/pages/luckyWheelDetail/luckyWheelDetail';
          break;
        case '8':
          path = '/awardManagement/pages/scratch/scratch';
          break;
        case '9':
          path = '/awardManagement/pages/goldenEggs/goldenEggs';
          break;
      }
      this.setData({
        'rewardPointObj.showModal': false,
        'shareGiftsObj.showExtraRewardModal': false
      });
      app.turnToPage(path)
    },
    closeGiftsModal: function () {
      this.setData({
        'collectGiftsObj.showModal': false
      });
    },
    closeGetModal: function () {
      this.setData({
        'collectGetObj.showModal': false
      })
    },
  }
})
