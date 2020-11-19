var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    tabIndex: 0,
    colonelInfo: {},//团长信息
    userName: '',
    currentIndex: 0,
    userLevels: [],
    explain: '',//团长说明
    showLeader: false
  },
  extraInfo: [], //附加信息
  user_token: '',
  levelId: '',
  onLoad: function (options) {
    this.getUserToken();
    this.initApplyStatus();
    this.getShopExplain();
  },
  showLeader: function () {
    if (this.data.explain) {
      if (+app.globalData.getDistributionInfo['role_setting'][6]['pop_up_type'] === 0) {
        app.turnToPage('/communityGroup/pages/communityRecruit/communityRecruit?isAudit=1');
      } else {
        let show = !this.data.showLeader;
        this.setData({
          showLeader: show
        })
      }
    } else {
      app.showModal({ content: '商家暂未填写团长说明' });
    } 
  },
  applyModify: function() {
    let _this = this;
    let colonelInfo = encodeURIComponent(JSON.stringify(this.data.colonelInfo));
    app.showModal({
      content: '修改信息需重新审核，期间买家无法通过您的社区团下单，确认修改？',
      showCancel: true,
      confirmColor: "#ff7100",
      confirm: function () {
        wx.navigateTo({
          url: `/communityGroup/pages/communityGroupApply/communityGroupApply?colonelInfo=${colonelInfo}&user_token=${_this.data.user_token}&fromPage=shop`,
        })
      }
    })
  },
  changeTab: function (e) {
    let index = e.currentTarget.dataset.index;
    this.page = 1;
    this.setData({
      tabIndex: index,
    })
  },
  getUserToken: function () {
    this.user_token = app.getUserInfo().user_token;
  },
  getLeaderExplaxin: function(){
    let shopMessage = app.getCommunityActiveMessage();
    if (shopMessage != '') {
      this.setData({
        explain: shopMessage
      })
    }
  },
  getShopExplain: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributionInfo',
      success: function (res) {
        if (res.data && res.data.app_id) {
          app.globalData.getDistributionInfo = res.data;
          that.getLeaderExplaxin()
        } else {
          that.showModal({
            content: '暂未开启推广'
          })
        }
      }
    })
  },
  initApplyStatus: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
      method: 'post',
      data: { leader_token: _this.user_token },
      success: function (res) {
        if (res.data.length && res.data[0].is_deleted == 1 && res.data[0].is_audit != 3) res.data[0].is_audit = 0;
        let colonelInfo = res.data[0];
        colonelInfo['distributor_info'] = app.globalData.getDistributionInfo.distributor_info;
        if (colonelInfo.distributor_info && colonelInfo.extra_fields) {
          let extraInfo = [], distributor_info = colonelInfo.distributor_info, extra_fileds = colonelInfo.extra_fields;
          Object.keys(distributor_info).map((item, index) => {
            if (item != 'phone') {
              extraInfo.push({ type: item, value: extra_fileds[item] || '', txt: distributor_info[item] })
            }
          })
          _this.setData({
            extraInfo: extraInfo
          })
        }
        _this.setData({ colonelInfo: colonelInfo})
      }
    })
  },
  getPromotionLevelInfo: function () {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributionLevelInfo',
      data: {
        page: -1
      },
      success: function (res) {
        let currentIndex = 0;
        if (res.data) {
          for (let i = 0; i < res.data.length; i++) {
            if (res.data[i].id == _this.levelId) {
              currentIndex = i;
            }
          }
        }
        _this.setData({
          userLevels: res.data,
          currentIndex: currentIndex
        })
      }
    })
  }
})