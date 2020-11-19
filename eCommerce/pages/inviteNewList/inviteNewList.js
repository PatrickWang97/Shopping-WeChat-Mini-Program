const app = getApp();
Page({
  data: {
    type: 0,                    // 拉新用户列表 类型
    inviteType: 0,             // 显示的tab 0: 邀请用户   1:拉新用户
  },
  is_more: 0,               // 还有无数据
  page: 1,                 // 页码数
  page_size: 10,          // 页容量
  onLoad: function() {
    this.getInviteUser();
  },
  getPullNewUser: function (level = 0, nickname = '') {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=PullUserGift/GetPullNewUser',
      data: {
        activity_id: app.globalData.inviterId,
        level: level,
        nickname: nickname,
      },
      success: function (res) {
        if (res.data) {
          that.setData({
            userList: res.data.length ? res.data : [],
            consume: res.consume
          })
        }
      }
    })
  },
  checkUserByType: function(e) {
    let type = e.currentTarget.dataset.type;
    this.setData({
      type: type
    })
    this.getPullNewUser(type,'');
  },
  searchUserByName: function(e) {
    let nickname = e.detail.value;
    if (this.data.inviteType == 1) {
      this.getPullNewUser(this.data.type, nickname);
    }else if (this.data.inviteType == 0){
      this.getInviteUser(nickname);
    }
  },
  getInviteUser: function(nickname) {
    let that = this;
    let params = {
      activity_id: app.globalData.inviterId,
      page: this.page,
      page_size: this.page_size,
    }
    if (nickname) { 
      params.nickname = nickname;
    }
    app.sendRequest({
      url: '/index.php?r=PullUserGift/GetInviteUser',
      data: params,
      method: 'post',
      success: function(res) {
        if (res.status == 0) {
          that.is_more = res.is_more;
          that.setData({
            userList: res.data.length ? res.data : [],
          })
        }
      }
    })
  },
  changeTab: function(event) {
    let inviteType = event.currentTarget.dataset.type;
    this.setData({
      inviteType
    })
    if (inviteType == 0) {
      this.getInviteUser();
    }else if (inviteType == 1) {
      this.getPullNewUser();
    }
  },
  getMoreUser: function() {
    if (this.is_more == 0) {
      app.showToast({
        title: '没有更多数据了',
        icon: 'none'
      })
      return;
    }
    this.page += 1;
    this.getInviteUser();
  },
})