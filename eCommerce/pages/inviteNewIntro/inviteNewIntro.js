const app = getApp();
Page({
  data: {
  },
  onLoad: function () {
    this.getActivityDetail();
  },
  getActivityDetail: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=PullUserGift/GetActivityDetaile',
      data: {
        id: app.globalData.inviterId
      },
      success: function (res) {
        if (res.status == 0) {
          that.setData({
            activeData: res.data.activity,
          })
        }
      }
    })
  },
})