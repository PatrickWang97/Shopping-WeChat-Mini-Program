var app = getApp();
Component({
  properties: {
    franchisee: {
      type: String,
      value: ''
    },
    orderId: {
      type: String,
      value: ''
    },
    orderType: {                         // 1-已付款 2->已完成
      type: Number,
      value: 1,
      observer: function (val) {
        if (+val === 2) {
          this.setData({
            isShowRewardDialog: true
          })
        }
      }
    }
  },
  data: {
    payGiftInfo: {                       // 支付有礼
      activity: {},
      rewards: []
    },
    isShowRuleDialog: false,             // 活动规则弹窗
    isShowRewardDialog: false,           // 奖励获取弹窗 
    rewardTypeOptions: [
      { key: 'coupon', type: '1', path: '/eCommerce/pages/couponList/couponList' },
      { key: 'integral', type: '2', path: '/userCenter/pages/myIntegral/myIntegral' },
      { key: 'balance', type: '3', path: '/eCommerce/pages/balance/balance' },
      { key: 'vipcard_permission', type: '4', path: '/eCommerce/pages/vipBenefits/vipBenefits' },
      { key: 'vipcard_permission', type: '5', path: '/eCommerce/pages/vipBenefits/vipBenefits' },
      { key: 'collectme', type: '6', path: '/awardManagement/pages/collectStars/collectStars' },
      { key: 'lucky_wheel', type: '7', path: '/awardManagement/pages/luckyWheelDetail/luckyWheelDetail' },
      { key: 'scratch_card', type: '8', path: '/awardManagement/pages/scratch/scratch' },
      { key: 'golden_eggs', type: '9', path: '/awardManagement/pages/goldenEggs/goldenEggs' },
    ]
  },
  ready: function (options) {
    this.getPayGiftReward();
  },
  methods: {
    getPayGiftReward: function () {        // 获取支付有礼奖励
      app.sendRequest({
        url: '/index.php?r=paidGift/WillReceiveOrReceivedRewards',
        method: 'post',
        hideLoading: true,
        data: {
          order_id: this.data.orderId,
          sub_app_id: this.data.franchisee
        },
        success: (res) => {
          const { data, status } = res;
          if (status === 0) {
            const { rewards, activity } = data;
            if (!rewards || !rewards.length) { return }
            data.rewards = rewards.map((item) => {
              item.rewardType = this.data.rewardTypeOptions.find((reward) => reward.type == item.type).key;
              item.status = data.type;
              return item;
            })
            data.activity = activity || {};
            if (activity.rewards_config && activity.rewards_config[0].threshold.greater_equal) {   // 是否有阶梯门槛
              data.activity.condition = 1;
            } else {
              data.activity.condition = 0;
            }
            data.activity.rewards_config = this.handleRewardConfig(activity.rewards_config || []);
            this.setData({
              payGiftInfo: data
            })
          }
        }
      })
    },
    handleRewardConfig(rewardsConfig) {
      return rewardsConfig.map((config) => {
        const { rewards, threshold } = config;
        const rewardArr = rewards.map((reward) => {
          return reward.title;
        });
        if (threshold.greater_equal) {
          config.stairText = `交易金额大于等于${threshold.greater_equal}元`;
          if (+threshold.less_than !== -1) {
            config.stairText += `，且小于${threshold.less_than}元`;
          }
        }
        config.rewardText = rewardArr.join('、');
        return config;
      });
    },
    receiveReward: function (e) {
      let { rewards } = this.data.payGiftInfo;
      const index = e.currentTarget.dataset.index;
      const { type, value, status } = rewards[index] || {};
      if (status === 4) { return };
      app.sendRequest({
        url: '/index.php?r=paidGift/ReceiveReward',
        method: 'post',
        data: {
          order_id: this.data.orderId,
          sub_app_id: this.data.franchisee,
          reward_type: type,
          reward_value: value
        },
        success: () => {
          wx.showToast({
            title: '领取成功',
            icon: 'success',
            duration: 1000
          })
          rewards = rewards.map((v, i) => {
            v.status = index === i ? 5 : 4;
            return v;
          })
          this.setData({
            'payGiftInfo.rewards': rewards,
            'payGiftInfo.type': 3
          })
        }
      })
    },
    checkReward: function (e) {
      const index = e.currentTarget.dataset.index;
      const { rewards } = this.data.payGiftInfo;
      const { type, value } = rewards[index] || {};
      const currentType = this.data.rewardTypeOptions.find((item) => item.type == type);
      let path = currentType && currentType.path;
      if (type == 4) {
        path = path + '?id=' + value;
      }else if(type == 5){
        path = path + '?id=' + value + '&is_paid_card=1';
      }
      app.turnToPage(path);
    },
    handleRuleDialog() {
      this.setData({
        isShowRuleDialog: !this.data.isShowRuleDialog
      })
    },
    closeRewardDialog() {
      this.setData({
        isShowRewardDialog: false
      })
    },
  }
})
