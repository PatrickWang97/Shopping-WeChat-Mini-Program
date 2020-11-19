const app = getApp();
Page({
  data: {
    current: 0,
    foodsInfo: {},
  },
  onLoad: function (options) {
    let id = options.id;
    let franchiseeId = options.franchiseeId;
    this.setData({
      foodId: id,
      franchiseeId: franchiseeId,
    })
    this.getFoodsInfo()
  },
  getFoodsInfo: function () {
    let that = this;
    app.sendRequest({
      url:'/index.php?r=AppShop/getGoods',
      data:{
        sub_shop_app_id: that.data.franchiseeId,
        data_id: that.data.foodId,
        sort_key: 'approval',
        'screening_arr[goods_type]': [0,3],
        'screening_arr[select_type]': 1,
      },
      method:"post",
      success: function (res){
        let goods = res.data[0].form_data;
        goods.approval.total_approval = Number(goods.approval.total_approval) > 999 ? parseInt(goods.approval.total_approval/1000) + 'k' : goods.approval.total_approval;
        that.setData({
          foodsInfo: goods,
        })
      }
    })
  },
  swiperChange: function (e) {
    let current = e.detail.current;
    this.setData({
      current: current
    })
  },
  clickThumb: function (e) {
    let that = this;
    let dataset = e.currentTarget.dataset; 
    let _id = dataset.id;
    let goods_type = dataset.goodstype;
    app.sendRequest({
      url:'/index.php?r=AppShopManage/GoodsApproval',
      data:{
        app_id: that.data.franchiseeId,
        parent_app_id: app.getAppId(),
        goods_id: _id,
        goods_type: goods_type,
      },
      method:"post",
      success: function (res){
        that.setData({
          'foodsInfo.approval.status': Number(res.data.status),
          'foodsInfo.approval.total_approval': res.data.total_approval > 999 ? parseInt(goods.approval.total_approval/1000) + 'k' : res.data.total_approval
        })
      }
    })
  },
  onShareAppMessage: function (event) {
    let url = '/franchisee/pages/franchiseeRecomFood/franchiseeRecomFood?franchiseeId=' + this.data.franchiseeId + '&id=' + this.data.foodId;
    return {
      path: url
    }
  }
})