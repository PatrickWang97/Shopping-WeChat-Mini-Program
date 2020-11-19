var app = getApp();
Page({
  data: {
    goodslist: [],
    search: '',
    selectAll: false
  },
  page: 1,
  isMore: 1,
  onLoad: function () {
    this.dataInitial();
  },
  onReady: function () {
  },
  onShow: function () {
  },
  dataInitial: function(){
    this.getGoodsViewRecordList();
    this.getAppECStoreConfig();
  },
  getGoodsViewRecordList: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/goodsViewRecordList',
      data: {
        page: _this.page,
        page_size: 10,
        search: _this.data.search
      },
      chain: app.globalData.hasFranchiseeChain,
      success: function (res) {
        _this.setData({
          goodslist: _this.data.goodslist.concat(res.data)
        })
        _this.isMore = res.is_more;
      }
    })
  },
  footPrintOperat: function(){
  },
  footPrintOperat: function () {
    this.setData({
      showCheckedBox: true
    })
  },
  footPrintComplete: function () {
    this.setData({
      showCheckedBox: false
    })
  },
  addShoppingCart: function(event){
    this.selectComponent('#component-goodsShoppingCart').showDialog({goodsId: event.currentTarget.dataset.id});
  },
  goGoodsDetail: function(event){
    let appId = event.currentTarget.dataset.appId;
    let url = '/detailPage/pages/goodsDetail/goodsDetail?detail=' + event.currentTarget.dataset.id;
    let franchisee = appId === app.globalData.appId ? '' : '&franchisee=' + appId;
    app.turnToPage(url + franchisee);
  },
  selectGoods: function(event){
    let index = event.currentTarget.dataset.index;
    let goodslist = this.data.goodslist;
    let selectAll = true;
    goodslist[index].selected = !goodslist[index].selected;
    goodslist.map((item) => {
      if (!item.selected){
        selectAll = false;
      }
    })
    this.setData({
      goodslist: goodslist,
      selectAll: selectAll
    })
  },
  clickSelectAll: function(){
    let selectAll = this.data.selectAll;
    let goodslist = this.data.goodslist;
    goodslist.map((item) => {
      item.selected = !selectAll;
    })
    this.setData({
      goodslist: goodslist,
      selectAll: !selectAll
    })
  },
  onReachBottom: function () {
    if (!this.isMore){return};
    this.page++;
    this.getGoodsViewRecordList();
  },
  deleteGoods: function () {
    let _this = this;
    let deleteIdArr = [];
    let goodslist = this.data.goodslist;
    for (let i = 0; i < goodslist.length;i++){
      if (goodslist[i].selected) {
        deleteIdArr.push(goodslist[i].id);
        goodslist.splice(i, 1);
        i--;
      }
    }
    if (deleteIdArr.length <= 0){
      app.showToast({title: '未选择商品', icon: 'none'});
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/deleteGoodsViewRecord',
      method: 'post',
      data: {
        goods_id_arr: deleteIdArr
      },
      chain: app.globalData.hasFranchiseeChain,
      success: function (res) {
        _this.setData({
          goodslist: goodslist,
          showCheckedBox: false
        })
      }
    })
  },
  searchGoods: function (event) {
    this.page = 1;
    this.setData({
      search: event.detail.value,
      goodslist: []
    })
    this.getGoodsViewRecordList();
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    });
  }
})