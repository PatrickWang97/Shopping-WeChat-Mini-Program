var app = getApp()
Page({
  data: {
    userInfo: {},
    firstData: [],
    secData: [],
    firstId: '',
    secId: '',
    phone: '',
    dialogCheck: true,
    userInfo:{}
  },
  onLoad: function (options) {
    let that = this;
    if (app.isLogin()) {
      that.setData({
        userInfo: app.globalData.userInfo,
        phone: app.globalData.userInfo.phone
      });
    } else {
      app.goLogin({
        success: function () {
          that.setData({
            userInfo: app.globalData.userInfo,
            phone: app.globalData.userInfo.phone
          });
        }
      });
    }
    app.sendRequest({
      url: '/index.php?r=pc/AppShopManage/GetIndustryTypeListByPid',
      data: {},
      success: function(res){
        that.setData({
          firstData: res.data,
          secId: ''
        })
      }
    });
  },
  bindPickerFisrtChange: function(e) {
    var index = e.detail.value,
        that = this;
    this.setData({
      firstId: index
    })
    app.sendRequest({
      url: '/index.php?r=pc/AppShopManage/GetIndustryTypeListByPid',
      data: {
        p_id: that.data.firstData[index].id
      },
      success: function(res){
        that.setData({
          secData: res.data
        })
      }
    })
  },
  bindPickerSecChange: function(e) {
    var index = e.detail.value
    this.setData({
      secId: index
    })  
  },
  callPhone: function() {
    wx.makePhoneCall({
      phoneNumber: '400-078-9990'
    })
  },
  openDialog: function() {
    this.setData({
      dialogCheck: false
    })
  },
  closeDialog: function() {
    this.setData({
      dialogCheck: true
    })   
  },
  getUser: function() {
    let that = this
    app.goLogin({
      success: function () {
        that.setData({
          userInfo: app.globalData.userInfo
        });
      }
    });
  },
  getPhone: function(e) {
    let that = this;
    if (/getPhoneNumber:fail/.test(e.detail.errMsg)) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppUser/GetPhoneNumber',
      data: {
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      },
      success: function (res) {
        app.setUserInfoStorage({
          phone: res.data
        })
        that.setData({
          phone: res.data
        });
      },
      successStatus5: function () {
        app.goLogin({
          success: function () {
            app.showModal({
              content: '获取手机号失败，请再次点击授权获取'
            });
          },
          fail: function () {
            app.showModal({
              content: '获取手机号失败，请再次点击授权获取'
            });
          }
        });
      }
    });
  },
  phoneInput: function(e) {
    let val = e.detail.value
    this.setData({
      phone: val
    })
  },
  getPhoneNumber: function(e) {
    let that = this;
    if (/getPhoneNumber:fail/.test(e.detail.errMsg)) {
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppUser/GetPhoneNumber',
      data: {
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv
      },
      success: function (res) {
        app.setUserInfoStorage({
          phone: res.data
        })
        that.setData({
          phone: res.data
        });
        that.postCrm()
      },
      successStatus5: function () {
        app.goLogin({
          success: function () {
            app.showModal({
              content: '获取手机号失败，请再次点击授权获取'
            });
          },
          fail: function () {
            app.showModal({
              content: '获取手机号失败，请再次点击授权获取'
            });
          }
        });
      }
    });
  },
  postCrm: function() {
    app.showLoading({title:'提交中'})
    let firName = this.data.firstData.length > 0 && this.data.firstId ? this.data.firstData[this.data.firstId].name : ''
    let secName = this.data.secData.length > 0 && this.data.secId? this.data.secData[this.data.secId].name : ''
    let that = this
    let userInfo = this.data.userInfo
    let data = {
      template_app_id: app.globalData.appId,
      phone: this.data.phone,
      first_industry: firName,
      second_industry: secName,
      nickname: userInfo.nickname,
      user_token: '09f8cf1a209553865949a00996069ea0'
    }
    app.sendRequest({
      url: '/index.php?r=crm/Crm/ApplyFreeProduction',
      data,
      hideLoading: true,
      success: function(res){
        app.showToast({
          title: '提交成功！',
          icon: 'success',
          duration: 2000
        });
      }
    });
  }
})
