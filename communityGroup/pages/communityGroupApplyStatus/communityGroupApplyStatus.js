var app = getApp();
Page({
  data: {
    colonelInfo: {},
    showLeader: false,
    explain: '',
    showBtn: false,
    isShowReason: false, //是否显示弹窗,
    isCheckedReason: false,
    blockReason: [],
    extraInfo: []
  },
  user_token: '',
  onLoad: function(options) {
    this.getUserToken();
    this.initOrder();
  },
  onShow: function() {
    this.getShopExplain();
    this.initApplyStatus();
  },
  initApplyStatus: function() {
    let _this = this;
    let data = {
      leader_token: _this.user_token
    }
    let distributorInfo = app.globalData.getDistributorInfo;
    if (distributorInfo && distributorInfo.dis_group_info) {
      if (distributorInfo.dis_group_info.is_block_up && +distributorInfo.dis_group_info.is_block_up === 1) {
        data['is_from_admin'] = 1
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
      method: 'post',
      data: data,
      success: function(res) {
        if (res.data.length) {
          if (res.data[0].is_deleted == 1 && res.data[0].is_audit != 3) {
            res.data[0].is_audit = 0;
          } else if (+res.data[0].is_block_up === 1) { //团长被停用
            res.data[0].is_audit = 4;
          }
          res.data[0]['distributor_info'] = app.globalData.getDistributionInfo.distributor_info;
          _this.setData({ colonelInfo: res.data[0] })
          if (res.data[0].distributor_info && res.data[0].extra_fields) { //附加信息
            let extraInfo = [], 
                distributor_info = res.data[0].distributor_info, 
                extra_fileds = res.data[0].extra_fields || {};
            Object.keys(distributor_info).map((item, index) => {
              if (item != 'phone') {
                extraInfo.push({ type: item, value: extra_fileds[item] || '', txt: distributor_info[item] })
              }
            })
            _this.setData({
              extraInfo: extraInfo
            })
          }
          if (_this.data.colonelInfo.is_audit === 4) {
            if(app.globalData['isShowBlockReason']) {
              let reason = app.globalData['isShowBlockReason'];
              _this.setData({ isShowReason: reason === 1 ? true : false })
            } else {
              app.globalData['isShowBlockReason'] = 1;//1是显示,2是不显示
              _this.setData({ isShowReason: true})
            }
            _this.setData({
              blockReason: res.data[0].reason ? (res.data[0].reason.block ? res.data[0].reason.block.split('\n') : []) : []
            })
          }
        }
      }
    })
  },
  initOrder: function() {
    let _this = this;
    let data = {
      page: 1,
      page_size: 25,
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributionGroupOrderByleader',
      method: 'post',
      data: data,
      success: function(res) {
        if (res.data.length) {
          _this.setData({
            showBtn: true
          })
        }
      }
    })
  },
  getUserToken: function() {
    this.user_token = app.getUserInfo().user_token;
  },
  applyModify: function() {
    let colonelInfo = encodeURIComponent(JSON.stringify(this.data.colonelInfo));
    wx.navigateTo({
      url: `/communityGroup/pages/communityGroupApply/communityGroupApply?colonelInfo=${colonelInfo}`,
    })
  },
  showLeader: function() {
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
  turnToPage: function(e) {
    let type = e.currentTarget.dataset.type;
    if(type == 'order') {
      app.turnToPage('/promotion/pages/communityGroupOrder/communityGroupOrder')
    }else {
      app.turnToPage('/promotion/pages/communityGroupWriteOff/communityGroupWriteOff')
    }
  },
  showBlockReason: function(){
    if (this.data.isCheckedReason) {
      app.globalData['isShowBlockReason'] = 2;
    }
    this.setData({isShowReason: false})
  },
  checkboxChange: function(e){
    let checkStatus = !this.data.isCheckedReason
    this.setData({
      isCheckedReason: checkStatus
    });
  }
})