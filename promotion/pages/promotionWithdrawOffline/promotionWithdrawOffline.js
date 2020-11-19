var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data:{
    hideWithdrawSuccess: true,
    distributor_withdraw_arr: {
      real_name: '',
      nickname: '',
      received_type: 0,
      bank_name: '',
      account: '',
      description: '',
      fromType: 0, // 1：代言人中心 2：团长中心
    },
    acceptTypeArray: ['支付宝收款', '银行卡收款'],
    index: 0
  },
  typeArray: ['alipay', 'bank'],
  onLoad: function (options) {
    let { fromType,withdrawCount } = options;
    this.setData({
      fromType: fromType,
      withdrawCount: withdrawCount
    })
    this.dataInitial()
  },
  dataInitial: function () {
    this.getWithdrawHistory();
  },
  getWithdrawHistory: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getRecordedDistributorWithdrawInfo',
      success: function (res) {
        if (res.data.alipay == '') {
          res.data.alipay = {
            real_name: '',
            nickname: '',
            received_type: 0,
            bank_name: '',
            account: '',
            description: ''
          }
        }
        if (res.data.bank == '') {
          res.data.bank = {
            real_name: '',
            nickname: '',
            received_type: 1,
            bank_name: '',
            account: '',
            description: ''
          }
        }
        that.setData({
          histotyWithdraw: res.data,
          distributor_withdraw_arr: res.data.alipay
        })
      }
    })
  },
  changeAcceptType: function (e) {
    this.setData({
      index: e.detail.value,
      distributor_withdraw_arr: this.data.histotyWithdraw[this.typeArray[e.detail.value]],
      'distributor_withdraw_arr.received_type': e.detail.value
    })
  },
  wantWithdraw: function () {
    let that = this;
    let distributor_withdraw_arr = this.data.distributor_withdraw_arr;
    let param = {
      withdraw: this.data.withdrawCount,
      withdraw_type: 1,
      distributor_withdraw_arr: distributor_withdraw_arr,
      from_type: that.data.fromType
    };
    if (distributor_withdraw_arr.real_name == '') {
      app.showModal({
        content: '请填写真实姓名',
        confirmColor: '#ff7100'
      })
      return;
    }
    if (distributor_withdraw_arr.real_name.length > 15) {
      app.showModal({
        content: '真实姓名字符最大长度为15',
        confirmColor: '#ff7100'
      })
      return;
    }
    if (distributor_withdraw_arr.received_type == 0) {
      if (distributor_withdraw_arr.nickname == '') {
        app.showModal({
          content: '请填写支付宝昵称',
          confirmColor: '#ff7100'
        })
        return;
      }
      if (distributor_withdraw_arr.nickname.length > 15) {
        app.showModal({
          content: '支付宝昵称字符最大长度为15',
          confirmColor: '#ff7100'
        })
        return;
      }
      if (distributor_withdraw_arr.account.trim().length > 20) {
        app.showModal({
          content: '支付宝账号字符最大长度为20',
          confirmColor: '#ff7100'
        })
        return;
      }
    } else {
      if (distributor_withdraw_arr.bank_name.trim() == '') {
        app.showModal({
          content: '请填写收款银行开户行',
          confirmColor: '#ff7100'
        })
        return;
      }
      if (!/^\d*$/g.test(distributor_withdraw_arr.account)) {
        app.showModal({
          content: '银行卡号只能输入数字',
          confirmColor: '#ff7100'
        })
        return;
      }
      if (distributor_withdraw_arr.account.length > 20) {
        app.showModal({
          content: '银行卡号字符最大长度为20',
          confirmColor: '#ff7100'
        })
        return;
      }
    }
    if (distributor_withdraw_arr.account.trim() == '') {
      app.showModal({
        content: '请填写账号',
        confirmColor: '#ff7100'
      })
      return;
    }
    if (distributor_withdraw_arr.description.trim().length > 50 ) {
      app.showModal({
        content: '备注字符最大长度为50',
        confirmColor: '#ff7100'
      })
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppDistribution/addWithdrawInfo',
      data: param,
      method: 'post',
      success: function (res) {
        that.setData({
          withdrawCount: '',
          hideOtherDialog: true,
          hideWithdrawSuccess: false
        })
      }
    })
  },
  hideWithdrawSuccess: function () {
    let pages = getCurrentPages(),
        prePage = pages[pages.length - 2];
    prePage.setData({
      withdrawCount: ''
    });
    app.turnBack();
  },
  realname: function (e) {
    let histotyWithdraw = this.data.histotyWithdraw
    histotyWithdraw[this.typeArray[this.data.index]].real_name = e.detail.value.trim()
    this.setData({
      'distributor_withdraw_arr.real_name': e.detail.value.trim(),
      'histotyWithdraw': histotyWithdraw
    })
  },
  nickname: function (e) {
    let histotyWithdraw = this.data.histotyWithdraw
    histotyWithdraw[this.typeArray[this.data.index]].nickname = e.detail.value.trim()
    this.setData({
      'distributor_withdraw_arr.nickname': e.detail.value.trim(),
      'histotyWithdraw': histotyWithdraw
    })
  },
  account: function (e) {
    let histotyWithdraw = this.data.histotyWithdraw
    histotyWithdraw[this.typeArray[this.data.index]].account = e.detail.value.trim()
    this.setData({
      'distributor_withdraw_arr.account': e.detail.value.trim(),
      'histotyWithdraw': histotyWithdraw
    })
  },
  bank: function (e) {
    let histotyWithdraw = this.data.histotyWithdraw
    histotyWithdraw[this.typeArray[this.data.index]].bank_name = e.detail.value.trim()
    this.setData({
      'distributor_withdraw_arr.bank_name': e.detail.value.trim(),
      'histotyWithdraw': histotyWithdraw
    })
  },
  desc: function (e) {
    let histotyWithdraw = this.data.histotyWithdraw
    histotyWithdraw[this.typeArray[this.data.index]].description = e.detail.value
    this.setData({
      'distributor_withdraw_arr.description': e.detail.value,
      'histotyWithdraw': histotyWithdraw
    })
  }
})