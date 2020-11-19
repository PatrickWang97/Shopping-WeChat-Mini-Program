var app = getApp()
Page({
  data: {
    topNavBarData: {
      isDefault: 0,
      title: '优惠券列表',
    },
    franchiseeId:'',
    franchiseeInfo:'',
    couponList: []
  },
  onLoad: function (options) {
    var franchiseeId = options.franchisee,
      that = this;
    this.setData({
      franchiseeId: franchiseeId
    })
    app.sendRequest({
      url:"/index.php?r=AppShop/GetAllShopCouponList",
      method: 'post',
      data: { 
        sub_app_id: franchiseeId,
        parent_app_id: app.getAppId(),
        page: -1,
        alliance_coupon: [0, 1],
      },
      success: function (res) {
        that.setData({
          couponList : res.data || []
        });
      }
    })
  },
  turnToCouponDetail:function(e){
    let id = e.currentTarget.dataset.id;
    app.turnToPage('/pages/couponDetail/couponDetail?detail=' + id + '&franchisee=' + this.data.franchiseeId)
  }
})