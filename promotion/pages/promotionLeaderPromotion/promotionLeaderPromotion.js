var app = getApp()
var util = require('../../../utils/util.js')
Page({
  data: {
    commissionArray: [],
    activeType: 'recruit',
    distributorInfo:''
  },
  onLoad: function (options) {
    this.dataInitial();
  },
  dataInitial: function () {
    this.getMyTeamMem();
    this.getDistributorInfo();
  },
  SwitchMenuBar:function(e){
    this.setData({
      activeType: e.currentTarget.dataset.type
    })
  },
  getMyTeamMem:function(param){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getMyTeamMembersInfo',
      data: param || '',
      success: function (res) {
        that.setData({
          commissionArray: res.data,
          totalPage: res.total_page,
          currentPage: res.current_page
        })
      }
    })
  },
  phoneCall:function(e){
    app.makePhoneCall(e.currentTarget.dataset.number)
  },
  nextPage: function () {
    var that = this;
    if (that.data.currentPage >= that.data.totalPage) return;
    this.getMyTeamMem({
      page: that.data.currentPage + 1
    })
  },
  prevPage: function () {
    var that = this;
    if (that.data.currentPage <= 1) return;
    this.getMyTeamMem({
      page: that.data.currentPage - 1
    })
  },
  getDistributorInfo: function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppDistribution/getDistributorInfo',
      success: function (res) {
        that.setData({
          distributorInfo: res.data
        })
      }
    })
  }
})
