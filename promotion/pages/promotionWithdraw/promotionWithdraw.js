var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    widthdrawData: '',
    hideOtherDialog: true,
    hideWithdrawSuccess: true,
    promotionInfo: '',
    withdrawWay: 'wechat',
    fromType: 0, // 1：代言人中心 2：团长中心
    distributionInfo:{
      withdraw_times_limit: 0,
      withdraw_requirement: 0
    }
    },
  onLoad: function (options) {
    let { fromType } = options;
    this.setData({
      fromType: fromType || 0
    })
  },
  onShow:function(){
    this.dataInitial()
  },
  dataInitial: function () {
    this.getCommissionInfo();
    this.getPromotionInfo();
  },
  inputWithdrawCount: function(e){
    let value = e.detail.value;
    this.setData({
      withdrawCount: value
    });
  },
  withdrawToWechat: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/addWithdrawInfo',
      data: {
        withdraw: _this.data.withdrawCount,
        withdraw_type: 0,
        from_type: _this.data.fromType
      },
      method: 'post',
      success: function (res) {
        _this.setData({
          withdrawCount: '',
          hideWithdrawSuccess: false
        })
        _this.getCommissionInfo();
      }
    })
  },
  stopPropagation: function () {
  },
  hideWithdrawSuccess: function () {
    this.setData({
      withdrawCount: '',
      hideWithdrawSuccess: true
    });
  },
  getCommissionInfo:function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getCommissionInfo',
      data:{
        from_type: that.data.fromType
      },
      method: 'post',
      success: function (res) {
        that.setData({
          widthdrawData: res.data,
          nowCommission: parseFloat( (+res.data.withdrew_commission + +res.data.can_withdraw_commission).toFixed(3) ),
          ToHitCommission: parseFloat( (+res.data.total_commission - +res.data.unsure_commission - +res.data.can_withdraw_commission - +res.data.withdrew_commission).toFixed(3) )
        })
      }
    })
  },
  getPromotionInfo:function(callback){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributionInfo',
      success: function (res) {
        let transfer_type_value;
        let withdrawWay = 'wechat';
        let transfer_type = that.data.fromType == 1 ? res.data.transfer_type : res.data.role_setting[6].withdraw_config.transfer_type;
        if(transfer_type){
          if (transfer_type.length == 2){
            transfer_type_value = 'all';
          }else if (transfer_type[0] == '0'){
            transfer_type_value = 'wechat'
          } else {
            transfer_type_value = 'offline';
            withdrawWay = 'offline';
          }
        }
        that.setData({
          promotionInfo: res.data,
          transfer_type_value: transfer_type_value,
          withdrawWay: withdrawWay
        })
        if(that.data.fromType == 1){
          that.setData({
            'distributionInfo.withdraw_times_limit': res.data.withdraw_times_limit,
            'distributionInfo.withdraw_requirement': res.data.withdraw_requirement
          })
        }else{
          that.setData({
            'distributionInfo.withdraw_times_limit': res.data.role_setting[6].withdraw_config.withdraw_times_limit,
            'distributionInfo.withdraw_requirement': res.data.role_setting[6].withdraw_config.withdraw_requirement
          })
        }
        callback && callback(res)
      }
    })
  },
  withdraw:function(){
    let _this = this;
    let withdrawCount = +this.data.withdrawCount;
    let withdraw_times_limit = this.data.distributionInfo.withdraw_times_limit;
    let withdraw_requirement = this.data.distributionInfo.withdraw_requirement;
    if (this.data.widthdrawData.withdrew_times > withdraw_times_limit){
      app.showModal({
        content: '当月提现次数已超过限制',
        confirmColor: '#ff7100'
      })
      return;
    }
    if (!withdrawCount || isNaN(withdrawCount)){
      app.showModal({
        content: '请填写正确的提现金额',
        confirmColor: '#ff7100'
      })
      return;
    }
    if (!/(^[0-9]+\.[0-9]{1,2}$)|(^[1-9]$)|^[1-9][0-9]+$/.test(withdrawCount)) {
      app.showModal({
        content: '提现金额最多可保留小数点后两位',
        confirmColor: '#ff7100'
      })
      return;
    }
    if (withdrawCount > this.data.widthdrawData.can_withdraw_commission){
      app.showModal({
        content: '提现金额不足',
        confirmColor: '#ff7100'
      })
      return;
    }
    if (withdrawCount < withdraw_requirement) {
      app.showModal({
        content: '提现金额需大于最小可提现金额',
        confirmColor: '#ff7100'
      })
      return;
    }
    if(this.data.withdrawWay === 'wechat'){
      this.withdrawToWechat();
    }else{
      app.turnToPage('/promotion/pages/promotionWithdrawOffline/promotionWithdrawOffline?withdrawCount=' + _this.data.withdrawCount + '&fromType=' + _this.data.fromType);
    }
  },
  selectWithdrawWay: function(event){
    this.setData({
      withdrawWay: event.currentTarget.dataset.type
    })
  }
})
