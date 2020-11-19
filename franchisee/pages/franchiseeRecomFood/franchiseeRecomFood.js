const app = getApp();
Page({
  data: {
    franchiseeId: '',
    foodList: [],
    totalNum: 0,
    loadInfo:{
      is_more: 1,
      page: 1,
      loading: false
    }
  },
  onLoad: function (options) {
    let franchiseeId = options.franchiseeId || '';
    let goods_type = options.goods_type || '';
    this.setData({
      franchiseeId: franchiseeId,
      goods_type: goods_type
    })
    this.getPageConfig();
    this.getFoodsList(1);
  },
  getPageConfig: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShopConfig/GetAppShopConfig',
      data: {
        'sub_app_id': that.data.franchiseeId,
        mode_id: 0
      },
      success: function (res) {
        let data = res.data[0] || {};
        let newdata = {};
        if(data.fields_data){
          newdata.recommendInfo = data.fields_data;
          let pageName = "特色推荐";
          if(data.fields_data.title.isOpen){
            pageName = data.fields_data.title.name;
          }else if(data.fields_data.sec_title.isOpen){
            pageName = data.fields_data.sec_title.name;            
          }
          app.setPageTitle(pageName);
        }
        that.setData(newdata);
      },
      complete: function () {
      }
    });
  },
  getFoodsList: function (page, refresh) {
    let that = this;
    let loadInfo = this.data.loadInfo;
    let goods_type = this.data.goods_type === '2' ? [1] : [0,3];
    if(loadInfo.loading){
      return;
    }
    let param = {
      page: page,
      page_size: 10,
      form: 'goods',
      goods_type: goods_type,
      sort_key: 'approval',
      sub_shop_app_id: that.data.franchiseeId,
      select_type: 1,
      is_sub_shop: 1,
      is_seckill: 3,
    };
    if (this.data.goods_type === '2') {
      param.appointment = 1;
      param.tpl_style = [2];
    }
    this.setData({
      "loadInfo.loading": true
    })
    app.sendRequest({
      url:'/index.php?r=AppShop/GetGoodsList',
      data: param,
      method:"post",
      success: function (res){
        let list = res.data;
        list.forEach((item) => {
          item.form_data.approval.status = Number(item.form_data.approval.status);
        })
        if(!refresh){
          list = that.data.foodList.concat(res.data)
        }else{
          wx.stopPullDownRefresh();
        }
        that.setData({
          foodList: list,
          totalNum: res.count,
          'loadInfo.loading': false,
          'loadInfo.is_more': res.is_more,
          'loadInfo.page': res.current_page + 1 
        })
      }
    })
  },
  onReachBottom: function () {
    let loadInfo = this.data.loadInfo;
    if(loadInfo.is_more === 0){
      return;
    }
    this.getFoodsList(loadInfo.page)
  },
  toRecommendDetail: function (e) {
    let _id = e.currentTarget.dataset.id;
    let ind = e.currentTarget.dataset.index;
    app.turnToPage('/franchisee/pages/franchiseeRecomDetail/franchiseeRecomDetail?id=' + _id + '&franchiseeId=' + this.data.franchiseeId + '&itemIndex=' + ind);
  },
  toRecommendThumb: function (e) {
    let _id = e.currentTarget.dataset.id;
    app.turnToPage('/franchisee/pages/franchiseeRecomThumb/franchiseeRecomThumb?id=' + _id + '&franchiseeId=' + this.data.franchiseeId);
  },
  clickThumb: function (e) {
    let that = this;
    let dataset = e.currentTarget.dataset; 
    let ind = dataset.index;
    let _id = dataset.id;
    let goods_type = dataset.goodstype
    let foodListStr = 'foodList[' + ind + '].form_data.approval.status';
    let foodListNum = 'foodList[' + ind + '].form_data.approval.total_approval';
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
          [foodListStr]: Number(res.data.status),
          [foodListNum]: res.data.total_approval
        })
      }
    })
  },
  onPullDownRefresh: function () {
    let loadInfo = this.data.loadInfo;
    this.getFoodsList(1, true)
  },
  turnToDetail: function (e) {
    let dataset = e.currentTarget.dataset;
    let id = dataset.id;
    let cart_num = 0;
    let type = dataset.type;
    if (type == 10) {
      app.toTradeGoodsDetail({ goodsId: id, franchiseeId: this.data.franchiseeId });
      return;
    }
    app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + '&franchisee=' + this.data.franchiseeId + '&cart_num=' + cart_num);
  },
  onShareAppMessage: function (event) {
    let url = '/franchisee/pages/franchiseeRecomFood/franchiseeRecomFood?franchiseeId=' + this.data.franchiseeId + '&goods_type=' + this.data.goods_type;
    return {
      path: url
    }
  }
})