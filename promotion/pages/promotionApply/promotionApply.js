var app = getApp();
var util = require('../../../utils/util.js')
Page({
  data: {
    promoterRequirement: false,
    requirementCount: '',
    consumption: '',
    consumptionGap: '',
    completePercent: 0,
    canApply: true,
    hideApplyDialog: true,
    hideSuccessDialog: true,
    applyInfoObj: {},
    isAudit: '',
    isGetPhoneNumber: false
  },
  applyInfo: {},
  onLoad: function (options) {
    this.setData({
      isAudit: options.isAudit || ''
    })
    this.dataInitial()
  },
  dataInitial: function () {
    this.getPromotionInfo();
    this.setData({
      applyInfoObj: app.globalData.getDistributionInfo.distributor_info
    })
  },
  showApplyDialog: function(){
    let that =this;
    app.requestSubscribeMessage([{
      type: 1024,
      obj_id: ''
    }]).then(() => {
      that.setData({
        hideApplyDialog: false
      })
    })
  },
  closeApplyDialog: function(){
    this.setData({
      hideApplyDialog: true
    })
  },
  goShopping: function(){
    let homepageRouter = app.getHomepageRouter();
    app.turnToPage('/pages/'+homepageRouter+'/'+homepageRouter,true)
  },
  inputApplyInfo: function(e){
    this.applyInfo[e.currentTarget.dataset.index] = e.detail.value;
  },
  sureApply: function(){
    this.applyToBePromotion()
  },
  showSuccessDialog: function(){
    this.setData({
      hideApplyDialog: true,
      hideSuccessDialog: false
    })
  },
  closeSuccessDialog: function(){
    this.setData({
      hideSuccessDialog: true
    })
  },
  goToMyStore: function(){
    app.turnToPage('/promotion/pages/promotionUserCenter/promotionUserCenter?isClickShopset=true', 1);
  },
  hideApplyDialog: function(){
    this.setData({
      hideApplyDialog: true
    })
  },
  stopBubble: function(){
  },
  applyToBePromotion:function(){
    var that = this;
    for (let name in that.data.applyInfoObj){
      if (!(that.applyInfo[name] && that.applyInfo[name].trim())){
        app.showModal({
          content: that.data.applyInfoObj[name] + '不能为空'
        });
        return;
      }
    }
    if (that.applyInfo['bank_num'] && !/^\d*$/.test(that.applyInfo['bank_num'].trim()) ){
      app.showModal({
        content: '银行卡只能为数字'
      });
      return;
    }
    if (!util.isPhoneNumber(that.applyInfo.phone)){
      app.showModal({
        content: '请填写正确的手机号码'
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppDistribution/applyToBeDistributor',
      method:'post',
      data:{
        user_info: that.applyInfo
      },
      success: function (res) {
        that.isPromotionPerson();
      }
    })
  },
  getPromotionInfo:function(){
    let that = this;
    let distributionInfo = app.globalData.getDistributionInfo;
    this.setData({
      promoterRequirement: distributionInfo.threshold_type == 1 ? false: true,
      requirementCount: distributionInfo.threshold_requirement
    })
    if (distributionInfo.threshold_type != 1){
      that.getTotalExpense();
    }
  },
  isPromotionPerson: function () {
    let _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      success: function (res) {
        if (res.data.is_audit == 1){
          app.globalData.isPromotion = true;
          _this.showSuccessDialog();
        }else{
          _this.setData({
            hideApplyDialog: true,
            isAudit: res.data.is_audit
          })
        }
      }
    })
  },
  getTotalExpense:function(){
    var that = this,
        canApply = '',
        requirementCount = that.data.requirementCount;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getTotalExpense',
      success: function (res) {
        if (res.data < requirementCount){
          canApply = false;
          that.setData({
            canApply: canApply
          })
        }
        that.setData({
          consumption: res.data,
          consumptionGap: (requirementCount - res.data).toFixed(2),
          completePercent: res.data / requirementCount * 100
        })
      }
    })
  },
  saveFormId: function (e) {
    if (e.detail.formId != 'the formId is a mock one') {
      app.sendRequest({
        url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
        data: { form_id: e.detail.formId },
        method: 'post',
        success: res => {
          this.sureApply()
        }
      })
    }else {
      this.sureApply()
    }
  },
  getPhoneNumber: function(e) {
      let _this = this;
      app.requestSubscribeMessage({
        type: 6, successFunction: function () {
        app.checkSession(function () {
          if (!e.detail.encryptedData) {
            return;
          }
          app.sendRequest({
            hideLoading: true,
            url: '/index.php?r=AppUser/GetPhoneNumber',
            data: {
              encryptedData: e.detail.encryptedData || '',
              iv: e.detail.iv || ''
            },
            success: function (res) {
              app.setUserInfoStorage({
                phone: res.data
              })
              _this.setData({
                isGetPhoneNumber: true
              })
              _this.applyInfo['phone'] = res.data;
              if (Object.keys(_this.data.applyInfoObj).length > 1){
                _this.showApplyDialog();
              }else {
                _this.sureApply();
              }
            },
          })
        });
        }
      })
  }
})