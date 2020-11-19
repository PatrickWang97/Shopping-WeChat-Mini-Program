var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    commissionArray: [],
    showOrderStatusMask: false,
    selectedStatus: -1,
    orderId: '',
    orderStatus: ['进行中','已生效','无效'],
    is_audit: 0,
    orderRecord: false
  },
  page: 1,
  isMore: 1,
  onLoad: function (options) {
    this.setData({
      orderRecord: options.orderRecord || false,
      is_audit: options.is_audit || 0
    })
    this.dataInitial()
  },
  dataInitial: function () {
    this.getPromotionCommission()
  },
  getPromotionCommission:function(param){
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/GetDistributorCommissionOrderList',
      data: {
        page: _this.page,
        status: _this.data.selectedStatus == -1 ? '' : _this.data.selectedStatus,
        order_id: _this.data.orderId
      },
      success: function (res) {
        _this.isMore = res.is_more;
        _this.setData({
          commissionArray: [..._this.data.commissionArray,...res.data]
        })
      }
    })
  },
  toggleStatusOrderMask: function(){
    let _this = this;
    this.setData({
      showOrderStatusMask: !_this.data.showOrderStatusMask
    })
  },
  hideOrderStatusMask: function(){
    this.setData({
      showOrderStatusMask: false
    })
  },
  stopPropagation: function(event){
  },
  clickStatus: function(event){
    this.page = 1;
    this.setData({
      selectedStatus: event.currentTarget.dataset.index,
      orderId: '',
      commissionArray: [],
      showOrderStatusMask: false
    })
    this.getPromotionCommission();
  },
  copyOrderId: function(event){
    wx.setClipboardData({
      data: event.currentTarget.dataset.id,
      success(res) {
        app.showToast({
          title: '复制成功',
          icon: 'success'
        })
      }
    })
  },
  onReachBottom: function(){
    if(!this.isMore){return};
    this.page++;
    this.getPromotionCommission();
  },
  searchOrder: function(event){
    this.page = 1;
    this.setData({
      selectedStatus: -1,
      orderId: event.detail.value,
      commissionArray: []
    })
    this.getPromotionCommission();
  }
})
