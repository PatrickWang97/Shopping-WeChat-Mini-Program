var app = getApp()
Page({
  data: {
    cdnUrl: app.getCdnUrl(),
    scrollInto: '',
    isForm: false,
    userPhone: '',
    phone : '',
    nickName: '',
    conIndustry: '',
    configData: {}
  },
  onLoad: function(options){
    let that = this;
    this.getPromoteConfigData();
    var query = wx.createSelectorQuery()
    query.select('#franchiseeCoo-cooperation').boundingClientRect(function(res){
      that.cooTop = res.top - app.globalData.systemInfo.windowHeight;
    });
    query.exec();
    let phone = app.getUserInfo('phone') || '';
    this.setData({
      userPhone : phone
    });
    if (!app.isLogin()){
      app.goLogin({});
    }
  },
  cooTop: '', //合作联系与顶部距离
  franchiseeCooScroll: function(e){
    let scrollTop = e.detail.scrollTop;
    let that = this;
    if (scrollTop > that.cooTop){
      that.setData({
        isForm: true
      });
    }else{
      that.setData({
        isForm: false
      })
    }
  },
  goToForm: function(){
    this.setData({
      scrollInto: 'franchiseeCoo-cooperation',
      isForm: true
    });
  },
  makePhoneCall: function (e) {
    var phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  getUserPhone: function(){
    this.setData({
      phone : this.data.userPhone
    });
  },
  getPhoneNumber: function (e) {
    let that = this;
    if (/getPhoneNumber:fail/.test(e.detail.errMsg)){
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
      successStatus5: function(){
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
  formSubmit: function (e) {
    let that = this;
    let val = e.detail.value;
    let param = {
      nick_name: val.nick_name,
      phone: val.phone,
      con_industry: val.con_industry
    };
    param.agent_user_token = app.getUserInfo('user_token');
    if (!param.nick_name) {
      app.showModal({
        content: '请输入您的姓名'
      });
      return;
    }
    if (!param.phone) {
      app.showModal({
        content: '请输入您的联系电话'
      });
      return;
    }
    if (!/^(0|86|17951)?(1[1-9])[0-9]{9}$/.test(param.phone)) {
      app.showModal({
        content: '请输入正确的联系电话'
      });
      return;
    }
    if (!param.con_industry) {
      app.showModal({
        content: '请输入您要咨询的行业'
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AgentCooperate/addCooperateLog',
      data: param,
      method: 'POST',
      success: function (res) {
        app.showModal({
          content: '提交成功'
        });
        that.setData({
          phone: '',
          nickName: '',
          conIndustry: ''
        })
      }
    })
  },
  getPromoteConfigData: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AgentCooperate/GetPromoteConfigData',
      data: {
        agent_user_token: ''
      },
      success: function (res) {
        that.setData({
          configData: res.data
        })
      }
    })
  }
})
