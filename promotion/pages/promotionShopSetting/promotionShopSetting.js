var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    userInfo: {},
    hasShopCover: '',
    shopIntroduce: '',
    shopName: '',
    colonelInfo: {}
  },
  onLoad: function (options) {
    this.setData({
      userInfo: app.getUserInfo()
    })
    this.getDistributorInfo();
    this.getShopExplain();
  },
  onShow: function () {
    if (this.data.tabIndex == 1) {
      this.getDistributorInfo();
    }
  },
  uploadImage: function () {
    var that = this;
    app.chooseImage(function (image) {
      that.setData({
        hasShopCover: image[0]
      });
    })
  },
  submitInfo: function () {
    var that = this;
    if (that.data.shopName == '') {
      app.showModal({
        content: '店铺名称不能空'
      })
      return;
    }
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistribution/setDistributorShopInfo',
      data: {
        shop_name: that.data.shopName,
        shop_description: that.data.shopIntroduce,
        shop_img: that.data.hasShopCover
      },
      success: function (res) {
        app.showModal({
          content: '保存成功',
          confirm: function () {
            app.turnBack();
          }
        })
      }
    })
  },
  inputShopName: function (e) {
    this.data.shopName = e.detail.value
  },
  inputShopIntroduce: function (e) {
    this.data.shopIntroduce = e.detail.value
  },
  getDistributorInfo: function () {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      success: function (res) {
        if (!!res.data.dis_group_info && (res.data.dis_group_info.is_audit != 1 || res.data.dis_group_info.is_deleted == 1)) {
          _this.setData({
            tabIndex: 0
          })
        }
        _this.setData({
          shopIntroduce: res.data.shop_description || '',
          hasShopCover: res.data.shop_img || _this.data.userInfo.cover_thumb,
          shopName: res.data.shop_name || _this.data.userInfo.nickname,
          dis_group_info: res.data.dis_group_info || '',
          user_token: res.data.user_token
        })
      }
    })
  },
  changeTab: function (e) {
    let index = e.currentTarget.dataset.index;
    this.setData({
      tabIndex: index
    })
    if (index == 1) {
      this.initApplyStatus();
    }
  },
  initApplyStatus() {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
      method: 'post',
      data: {
        leader_token: _this.data.user_token
      },
      success: function (res) {
        if (res.data.length) {
          _this.setData({
            colonelInfo: res.data[0]
          })
        }
      }
    })
  },
  getShopExplain: function() {
    let shopMessage = app.getCommunityActiveMessage();
    this.setData({
      explain: shopMessage
    })
  },
  applyModify: function () {
    let _this = this;
    let colonelInfo = encodeURIComponent(JSON.stringify(this.data.colonelInfo));
    app.showModal({
      content: '修改信息需重新审核，期间买家无法通过您的社区团下单，确认修改？',
      showCancel: true,
      confirmColor: "#ff7100",
      confirm: function () {
        wx.navigateTo({
          url: `/promotion/pages/communityGroupApply/communityGroupApply?colonelInfo=${colonelInfo}&user_token=${_this.data.user_token}&fromPage=shop`,
        })
      }
    })
  },
  showLeader: function () {
    let show = !this.data.showLeader;
    this.setData({
      showLeader: show
    })
  }
})
