var app = getApp();
Page({
  data: {
    notices: '团长信息用于社区商品配送，请填写真实信息。',
    btnTitle: '提交申请',
    refuse: '',
    colonelInfo: {
      region_address: '请选择所在的地区',
      logo: 'https://cdn.jisuapp.cn/static/jisuapp_editor/images/zhichi-default.png',
      nick_name: '',
      phone: '',
      region_id: '',
      address_detail: '',
      longitude: '',
      latitude: '',
      housing_estate: '',
      express_fee: '',
      distributor_info: ''
    },
    extraInfo: [], //附加信息
    showLeader: false,
    explain: '',
    notice: true,
    showSuccessModal: false,
    successModal: '请耐心等待商家审核~',
    pickUpObj: {
      0: true,
      1: false
    }
  },
  fromPage: '',
  user_token: '',
  onLoad: function (options) {
    this.getUserToken();
    let that = this;
    if (options.colonelInfo) {
      let colonelInfo = JSON.parse(decodeURIComponent(options.colonelInfo));
      let pickUpObj = this.data.pickUpObj;
      if (colonelInfo.ship_type instanceof Array && colonelInfo.ship_type.length == 2){
        pickUpObj = {
          0: true,
          1: true
        }
      } else if (colonelInfo.ship_type instanceof Array && colonelInfo.ship_type[0] == 1){
        pickUpObj = {
          0: false,
          1: true
        }
      }
      this.setData({
        colonelInfo: colonelInfo,
        pickUpObj: pickUpObj
      })
      this.getShopExplain();
      this.checkExtraInfo();
    } else {
      if (app.globalData.getDistributionInfo) { //如果存在
        this.getColoneInfo();
        this.checkExtraInfo();
        this.getShopExplain();
      } else {
        this.getDistributionInfo(() => {
          app.sendRequest({
            url: '/index.php?r=AppDistribution/getDistributorInfo',
            success: function (res) {
              app.globalData.getDistributorInfo = res.data;
              that.getShopExplain();
              that.getColoneInfo();
              that.checkExtraInfo();
            }
          })
        });
      }
    }
    this.getLeaderExplaxin();   //获取配送方式
    if (options.fromPage) {
      this.fromPage = options.fromPage;
    }
  },
  getColoneInfo: function() { //获取coloneInfo
    this.setData({
      'colonelInfo.phone': (app.globalData.getDistributorInfo && app.globalData.getDistributorInfo.user_info) ? app.globalData.getDistributorInfo.user_info.phone : '',
      'colonelInfo.logo': app.getUserInfo().cover_thumb ? app.getUserInfo().cover_thumb : '',
      'colonelInfo.nick_name': app.getUserInfo().nickname ? app.getUserInfo().nickname : '',
      'colonelInfo.distributor_info': app.globalData.getDistributionInfo.distributor_info
    })
  },
  checkExtraInfo: function(){ //附加信息处理
    if (this.data.colonelInfo.distributor_info) {
      let extraInfo = [],
        distributor_info = this.data.colonelInfo.distributor_info,
        extra_fileds = this.data.colonelInfo.extra_fields || {};
      Object.keys(distributor_info).map((item, index) => {
        if (item != 'phone') {
          extraInfo.push({ type: item, value: extra_fileds[item] || '', txt: distributor_info[item] })
        }
      })
      this.setData({
        extraInfo: extraInfo
      })
    }
  },
  apply: function () {
    let _this = this;
    let colonelInfo = this.data.colonelInfo;
    let pickUpObj = this.data.pickUpObj;
    colonelInfo.ship_type = [];
    colonelInfo.extra_fields = {}; //附加信息
    Object.keys(pickUpObj).map((item) => {
      if (pickUpObj[item]){
        colonelInfo.ship_type.push(item);
      }
    })
    if (colonelInfo.nick_name == '') {
      app.showModal({
        content: '请输入团长姓名或昵称'
      });
      return;
    }
    if (colonelInfo.phone == '') {
      app.showModal({
        content: '请输入正确的手机号'
      });
      return;
    }
    if (colonelInfo.region_address == '请选择所在的地区' || colonelInfo.housing_estate == '' || colonelInfo.latitude == '' || colonelInfo.longitude == '') {
      app.showModal({
        content: '请输入要代理的小区'
      });
      return;
    }
    if (colonelInfo.address_detail == '') {
      app.showModal({
        content: '请填写详细的提货地址'
      });
      return;
    }
    if (colonelInfo.region_id == '') {
      app.showModal({
        content: '地区异常，请重新选择地区'
      });
      return;
    }
    if (colonelInfo.ship_type.length == 0) {
      app.showModal({
        content: '请至少选择一种配送方式'
      });
      return;
    }
    if (colonelInfo.ship_type.indexOf('1') > -1){
      let express = colonelInfo.express_fee;
      if (express.substring(express.indexOf("."), express.length).length > 3){
        app.showModal({
          content: '请输入正确的团长配送费范围0~100'
        });
        return;
      }
    }
    if ( _this.data.extraInfo.length > 0) {
      let value =  _this.data.extraInfo.every((item) => {
        if (item.value.trim()) {
          colonelInfo.extra_fields[item.type] = item.value;
          return true;
        } else {
          return false;
        } 
      })
      if(!value) {
        app.showModal({
          content: '附加信息请填写完整'
        });
        return;
      } 
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/SaveDistributorExt',
      method: 'post',
      data: colonelInfo,
      success: res => {
        if (res.status == 0) {
          app.requestSubscribeMessage([{
            type: 512, obj_id: '',
          }]).then(()=> {
            if (+app.globalData.getDistributionInfo['role_setting'][6]['is_need_audit'] === 0) {
              _this.setData({
                successModal: '恭喜你成为团长'
              })
            } else {
              _this.setData({
                successModal: '请耐心等待商家审核~'
              })
            }
            _this.setData({
              showSuccessModal: true,
            })
          })
        }
      }
    })
  },
  changeExtraValue(e) {
    let index = e.target.dataset.index;
    let extraInfo = this.data.extraInfo;
    extraInfo[index].value = e.detail.value;
    this.setData({
      extraInfo: extraInfo 
    });
  },
  changeTagValue(e) {
    let target = e.target.dataset.id;
    switch (target) {
      case 'nick_name':
        this.setData({
          "colonelInfo.nick_name": e.detail.value
        });
        break;
      case 'phone':
        this.setData({
          "colonelInfo.phone": e.detail.value
        });
        break;
      case 'housing_estate':
        this.setData({
          "colonelInfo.housing_estate": e.detail.value
        });
        break;
      case 'address_detail':
        this.setData({
          "colonelInfo.address_detail": e.detail.value
        });
        break;
      case 'express_fee':
        this.setData({
          "colonelInfo.express_fee": e.detail.value
        });
        break;
    }
  },
  chooseLocation() {
    app.turnToPage(`/promotion/pages/communityGroupSearchAddress/communityGroupSearchAddress`)
  },
  backToStatus: function () {
    app.turnToPage('/communityGroup/pages/communityGroupApplyStatus/communityGroupApplyStatus', 1)
  },
  getShopExplain: function () {
    let shopMessage = app.getCommunityActiveMessage();
    if (shopMessage) {
      this.setData({
        explain: shopMessage
      })
      if (+app.globalData.getDistributionInfo['role_setting'][6]['pop_up_type'] === 1) { //如果是弹窗式，首次进入才弹窗
        this.setData({
          showLeader: true
        })
      }
    }
  },
  getUserToken: function () {
    this.user_token = app.getUserInfo().user_token;
  },
  modifyLogo() {
    app.chooseImage(res => {
      this.setData({
        "colonelInfo.logo": res[0]
      })
    })
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
  closeNotice: function () {
    this.setData({
      notice: false
    })
  },
  saveFormId: function (e) {
    if (e.detail.formId != 'the formId is a mock one') {
      app.sendRequest({
        url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
        data: { form_id: e.detail.formId },
        method: 'post',
        success: res => {
          this.apply()
        }
      })
    }else {
      this.apply()
    }
  },
  selectedPickUp: function(e){
    let type = e.currentTarget.dataset.type;
    let pickUpObj = this.data.pickUpObj;
    pickUpObj[type] = !pickUpObj[type];
    this.setData({
      pickUpObj: pickUpObj
    });
  },
  getLeaderExplaxin: function() {
    let distributionInfo = app.globalData.getDistributionInfo
    let expressFee = distributionInfo.role_setting[6].express_fee;
    let expressObj;
    if (!expressFee) {
      expressObj = {
        selfDelivery: true,
        express: false
      }
    } else {
      expressObj = {
        selfDelivery: false,
        express: false
      }
      for (let item of expressFee) {
        if (item == 1) {
          expressObj.express = true;  //自提点自提
        } else if (item == 0) {
          expressObj.selfDelivery = true;   //团长配送
        }
      }
    }
    this.setData({
      expressObj: expressObj
    })
  },
  getDistributionInfo: function(callback){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributionInfo',
      success: function (res) {
        if (res.data && res.data.app_id) {
          app.globalData.getDistributionInfo = res.data;
          that.getLeaderExplaxin();
          callback();
        } else {
          that.showModal({
            content: '暂未开启推广'
          })
        }
      }
    })
  }
})