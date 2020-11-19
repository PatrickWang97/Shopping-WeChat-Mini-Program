var app = getApp()
Page({
  data: {
    goodsList:[],
    franchiseeId:'',
    franchiseeInfo:{},
    categroyList: [{ id: '', name: '全部' }],
    categoryActive: '',
    form:'',
    goodsType: '',
    hasCategroy: false,
    getSectionData: {
      page: 1,
      loading: false,
      nomore: false
    },
    goodsSort: null, // 商品排序
    inputValue: '',
    isOpenSearch: false, // 是否开启商品搜索开关
  },
  onLoad: function (options) {
    let formData = options.detail,
        franchiseeId = options.franchisee,
        categroy = options.categroy > 0 ? options.categroy : '',
        catename = options.categroyName || '',
        goodsSort = null,
        newdata = {},
        isOpenSearch = JSON.parse(options.isOpenSearch || 'false');
    let goods_type = this.getFormType(formData);
    if (options.goodsSort) {
      goodsSort = JSON.parse(decodeURIComponent(options.goodsSort));
      newdata.goodsSort = goodsSort;
    }
    newdata.form = formData;
    newdata.franchiseeId = franchiseeId;
    newdata.hasCategroy = categroy ? true : false;
    newdata.categoryActive = categroy;
    newdata.isOpenSearch = isOpenSearch;
    this.setData(newdata);
    if (categroy){
      this.getGoods();
    }else{
      this.categroyList(goods_type);
    }
    if (catename){
      app.setPageTitle(catename);
    }
  },
  getFormType: function (form) {
    let type = 0;
    switch (form) {
      case 'goods':
        type = 0;
        break;
      case 'appointment':
        type = 1;
        break;
      case 'tostore':
        type = 3;
        break;
      default:
        type = 0;
        break;
    }
    return type;
  },
  categroyList:function(types){
    var that=this;
    app.sendRequest({
      url:'/index.php?r=AppShop/GetAppShopCateList',
     data:{
       form: 'goods',
       goods_type: types,
       app_id: that.data.franchiseeId,
       common_type: 0
     },
     success:function(res){
      var categroyList=res.data,
          data={};
      data.categroyList = that.data.categroyList.concat(categroyList);
       that.setData(data);
     }
   })
    this.getGoods();
  },
  getGoods:function(search){
    var that = this,
      sdata = that.data.getSectionData;
    if ((sdata.loading || sdata.nomore) && !search) {
      return;
    }
    sdata.loading = true;
    var param = {
      form: that.data.form,
      sub_shop_app_id: this.data.franchiseeId,
      is_sub_shop: this.data.franchiseeId ? 1 : 0,
      page: sdata.page,
      idx_arr: {
        idx: 'category',
        idx_value: that.data.categoryActive
      },
    };
    if (that.data.inputValue) {
      param.idx_arr = {
        idx: 'title',
        idx_value: that.data.inputValue
      }
      if (that.data.categoryActive) {
        param.category_arr = [that.data.categoryActive];
      }
    }
    if (this.data.goodsSort) {
      param = Object.assign({}, param, this.data.goodsSort);
    }
    if (this.data.franchiseeId || app.getChainId()) {
      param = Object.assign({}, param, {is_parent_shop_goods: 1});
    }
    if (that.data.form === 'goods') {
      param.show_package_goods = 2;
    }
    app.sendRequest({
      url:'/index.php?r=AppShop/GetGoodsList',
      data: param,
      method : 'POST',
      success: function (res) {
        var goodsList = res.data,
          goodsListData = that.data.goodsList;
        goodsListData = goodsListData.concat(goodsList || []);
        if (search) {
          goodsListData = goodsList;
        }
        that.setData({
          goodsList: goodsListData,
          'getSectionData.page': sdata.page+1 ,
          'getSectionData.loading' : false,
          'getSectionData.nomore' :  res.is_more == 0 ? true : false
        });
      },
      fail : function(res){
        that.setData({
          'getSectionData.loading' : false
        });
      }
    })
  },
  turnToGoodsDetail: function (e) {
    let dataset = e.currentTarget.dataset;
    let id = dataset.id;
    let form = dataset.type;
    let group = dataset.group;
    let groupId = dataset.groupId;
    if(form==3){
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + '&franchisee=' + this.data.franchiseeId );
    } if (group == 1) {
      app.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + id + '&activity_id=' + groupId + '&franchisee=' + this.data.franchiseeId);
    }else{
      let cart_goods_num = this.data.franchiseeInfo.cart_goods_num;
      let cart = '';
      if (cart_goods_num){
        cart = '&cart_num=' + cart_goods_num;
      }
      app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + '&franchisee=' + this.data.franchiseeId + cart );
    }
  },
  clickOrderTab:function(e){
    var that=this;
    var index = e.currentTarget.dataset.id;
    this.setData({
      categoryActive: index,
      goodsList: [],
      getSectionData: {
        page: 1,
        loading: false,
        nomore: false
      }
    })
    this.getGoods();
  },
  scrollfunc : function(){
    this.getGoods();
  },
  goodsSearch: function () {
    this.setData({
      getSectionData: {
        page: 1,
        loading: false,
        nomore: false
      },
    })
    this.getGoods(true);
  },
  inputbBlur: function (e) {
    let inputValue = e.detail.value;
    this.setData({
      inputValue
    })
  }
})
