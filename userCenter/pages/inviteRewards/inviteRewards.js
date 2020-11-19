const app = getApp();
Page({
  data: {
    inviteData: {}, // 拉新活动详情数据
    QRCoderNum: 0, // 扫二维码成为新人用户数量
    total_chance_num: 0, // 领取机会次数
    noData: false, // 是否拉新成功
    hadRewards: false, // 有过奖励记录
    describe_switch: 1, // 是否展示规则
    no_activity: false, // 有无进行中的活动
  },
  onLoad: function(options) {
    let id = options.id || app.globalData.inviterId;
    let that = this;
    if (!app.isLogin()) {
      app.goLogin({
        success: function () {
          that.initActivity(id)
        },
        fail: function(){
          app.turnBack();
        }
      });
    }else {
      that.initActivity(id)
    }
  },
  initActivity: function (id) {
    this.getActivityDetail(id);
    this.generateQRCode(id);
    this.getQRCodeUserNum(id);
  },
  stopPropagation: function() {},
  getInviterActivity: function() {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=pullUserGift/GetActivity',
      data: {},
      method: 'post',
      success: function(res) {
        if (res.status == 0) {
          that.selectComponent('#newcomer-gift').inviterInit(res.data);
          that.setData({
            inviter: res.data
          })
        }
      }
    })
  },
  getActivityDetail: function(id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=PullUserGift/GetActivityDetaile',
      data: {
        id: id
      },
      success: function(res) {
        if (res.data == '') {
          that.setData({
            'no_activity': true
          })
        }else {
          let hadRewards = false;
          if (res.data.rewards) {
            for (let i in res.data.rewards) {
              if (i != 'first_num' && i != 'second_num' && i != 'invite_num' && res.data.rewards[i] > 0) {
                hadRewards = true
              }
            }
          }
          that.setData({
            describe_switch: res.data.activity.describe_switch, 
            hadRewards: hadRewards,
            inviteData: res.data.rewards || {},
            total_chance_num: res.data.total_chance_num || '',
          })
        }
      }
    })
  },
  generateQRCode: function(id) {
    let that = this;
    let homeRouter = app.getHomepageRouter();
    app.sendRequest({
      url: '/index.php?r=PullUserGift/GenerateQRCode',
      data: {
        activity_id: id,
        path: 'pages/'+ homeRouter + '/' + homeRouter + '?psid=' +app.globalData.pageShareKey,
      },
      success: function(res) {
        that.setData({
          tempFilePath: res.data
        })
      }
    })
  },
  getQRCodeUserNum: function(id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=PullUserGift/GetQRCodeUserNum',
      data: {
        activity_id: id,
      },
      success: function (res) {
        if (res.data) {
          that.setData({
            QRCoderNum: res.data
          })
        }
      }
    })
  },
  onShareAppMessage: function () {
    let pageInstance = app.getAppCurrentPage();
    let pagePath = '/' + pageInstance.route;
    return  app.shareAppMessage({
      path: pagePath,
    })
  },
  checkRule: function () {
    app.turnToPage("/eCommerce/pages/inviteNewIntro/inviteNewIntro");
  },
  checkInviteDetail: function () {
    app.turnToPage("/eCommerce/pages/inviteNewList/inviteNewList");
  },
  checkInviteRecord: function () {
    app.turnToPage("/eCommerce/pages/inviteNewRecord/inviteNewRecord");
  },
  previewImage: function(e) {
    app.previewImage({
      current: this.data.tempFilePath,
      urls: [this.data.tempFilePath]
    })
  },
  inviterEvent: function(e) {
    let id = e.detail &&  e.detail.id || app.globalData.inviterId;
    this.getActivityDetail(id);
  },
})