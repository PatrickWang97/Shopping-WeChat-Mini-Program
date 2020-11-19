const app = getApp();
Page({
  data: {
    showFixBread: false,
    listType: 0, // 奖励类型
    rewards: {
      1:'优惠券',
      2:'积分',
      3:'储值',
      4:'会员卡',
      5:'会员卡',
      6:'集集乐',
      7:'大转盘',
      8:'刮刮乐',
      9:'砸金蛋',
    },
    name: '全部', // 默认分类名称
  },
  onLoad: function() {
    this.getPullNewRecord();
  },
  showFixBreadFn: function () {
    this.setData({
      showFixBread: !this.data.showFixBread
    })
  },
  getPullNewRecord: function(type) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=/PullUserGift/GetRewardRecord',
      data: {
        activity_id: app.globalData.inviterId,
        type: type,
      },
      success: function (res) {
        if (res.status == 0) {
          that.setData({
            rewardsList: res.data,
            activity: res.activity
          })
        }
      }
    })
  },
  checkListByType: function(e) {
    let { type,name } = e.currentTarget.dataset;
    this.getPullNewRecord(type);
    this.setData({
      listType: type,
      name: name,
      showFixBread: false
    })
  },
})