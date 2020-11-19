var app = getApp();
var util = require('../../../utils/util.js');
Page({
  data: {
    search_status: false,
    search_focus: false,
    search_value: '',
    bizList: [],
    bizLog: [],
    mainStore: {
      name: ''
    },
    industry: '',
    idx: '',
    HisId: '',
    searchResultNav: 0,
    searchListData: {
      goodsList: [],
      franchiseeList: []
    }
  },
  onLoad: function (options) {
    let newdata = {};
    if (options.sourceType == 'industry' && options.source != 'none') {
      newdata['industry'] = options.source;
    } else if (options.sourceType == 'shop' && options.source != 'none') {
      newdata['idx'] = {
        "idx": "category",
        "idx_value": options.source
      };
    }
    newdata['HisId'] = app.globalData.historyDataId;
    this.setData(newdata);
    this.getChainArea();
    this.getBizShopViewLog();
  },
  onReachBottom: function(){
    let { searchResultNav } = this.data;
    if (searchResultNav == 1) {
      this.getMultiAppGoods();
    } else {
      this.getAppShopByPage();
    }
  },
  inputFocus: function(){
    this.setData({
      search_focus: true
    })
  },
  searchBlur: function(){
    if (!this.data.search_status && !this.data.search_value){
      this.setData({
        search_focus: false
      })
    }
  },
  searchClear: function(){
    this.setData({
      search_value: '',
      search_status: false,
      search_focus: true
    })
  },
  searchCancel: function () {
    this.setData({
      searchResultNav: 0,
      search_status: false,
      search_focus: false,
      search_value: '',
      searchListData: {
        goodsList: [],
        franchiseeList: []
      }
    })
  },
  searchInput: function(e){
    this.data.search_value = e.detail.value;
  },
  searchValue: function(){
    this.setData({
      search_value: this.data.search_value,
      search_status: true,
      searchListData: {
        goodsList: [],
        franchiseeList: []
      }
    });
    this.getInfoData = {
      normal: {
        page: 1,
        loading: false,
        is_more: 1
      },
      goods: {
        page: 1,
        loading: false,
        is_more: 1
      },
      franchisee: {
        page: 1,
        loading: false,
        is_more: 1
      }
    };
    let { searchResultNav } = this.data;
    if (searchResultNav == 1) {
      this.getMultiAppGoods();
    } else {
      this.getAppShopByPage();
    }
  },
  getInfoData: {
    normal: {
      page: 1,
      loading: false,
      is_more: 1
    },
    goods: {
      page: 1,
      loading: false,
      is_more: 1
    },
    franchisee: {
      page: 1,
      loading: false,
      is_more: 1
    }
  },
  getChainArea: function(){
    let that = this;
    let locationInfo = app.globalData.locationInfo;
    if (locationInfo.latitude) {
      that.setData({
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude
      });
      that.getAppShopByPage();
      that.getAppShopInfo();
    }else{
      app.getLocation({
        success: function(res){
          console.log(res);
          that.setData({
            latitude: res.latitude,
            longitude: res.longitude
          });
          that.getAppShopByPage();
          that.getAppShopInfo();
        },
        fail: function(res){
          console.log(res);
          that.getAppShopByPage();
          that.getAppShopInfo();
        }
      });
    }
  },
  getAppShopByPage: function () {
    let that = this;
    let searchValue = that.data.search_value;
    let isSearch = !!searchValue;
    let getInfo = that.getInfoData.normal;
    if (isSearch){
      getInfo = that.getInfoData.franchisee;
    }
    if (getInfo.loading || getInfo.is_more == 0){
      return;
    }
    getInfo.loading = true;
    searchValue = searchValue.replace(/(^\s*)|(\s*$)/g, '');
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      data: {
        is_show_chain: 1,
        sort_key: that.data.latitude ? 'distance' : '',
        sort_direction: 1,
        latitude: that.data.latitude,
        longitude: that.data.longitude,
        name: searchValue,
        industry_type: that.data.industry,
        idx_arr: that.data.idx,
        get_least_coup: 2,
        page: getInfo.page,
        page_size: 20
      },
      method: 'post',
      success: function (res) {
        let data = res.data;
        if (data && data.length > 0) {
          data.forEach((item) => {
            item.distance = util.formatDistance(item.distance);
            item.description = '';
            item.in_business = app.businessTimeCompare(item.business_time || []);
            let tempArr = [];
            if (item.good_list && item.good_list.length > 0) {
              item.good_list.forEach((goods) => {
                let goodsItem = {
                  id: goods.id,
                  goods_type: goods.goods_type,
                  is_group_buy: goods.is_group_buy,
                  group_buy_activity_id: goods.group_buy_activity_id,
                  app_id: goods.app_id,
                  cart_goods_num: goods.cart_goods_num || 0,
                  cover: goods.cover,
                  price: goods.price
                };
                tempArr.push(goodsItem);
              });
              item.good_list = tempArr;
            }
          });
        }
        if (that.data.search_value){
          if (getInfo.page != 1){
            data = that.data.searchListData.franchiseeList.concat(data);
          }
          that.setData({
            'searchListData.franchiseeList': data
          })
        }else{
          if (getInfo.page != 1){
            data = that.data.bizList.concat(data);
          }
          that.setData({
            bizList: data
          })
        }
        getInfo.loading = false;
        getInfo.is_more = res.is_more;
        getInfo.page += 1;
      },
      complete: function(){
        getInfo.loading = false;
      }
    });
  },
  getMultiAppGoods: function () {
    let that = this;
    let searchValue = that.data.search_value;
    let isSearch = !!searchValue;
    let getInfo = that.getInfoData.normal;
    if (isSearch) {
      getInfo = that.getInfoData.goods;
    }
    searchValue = searchValue.replace(/(^\s*)|(\s*$)/g, '');
    if (getInfo.loading || getInfo.is_more == 0) {
      return;
    }
    getInfo.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetMultiAppGoods',
      method: 'post',
      chain: true,
      data: {
        parent_app_id: app.globalData.appId,
        idx_arr: {
          'idx': 'title',
          'idx_value': searchValue
        },
        is_audit: 1,
        is_biz_shop: 0,
        form: 'app_shop',
        page: getInfo.page,
        page_size: 10,
        current_his_id: app.globalData.historyDataId,
        is_chain: 1,
        is_parent_shop_goods: 1
      },
      success: function (res) {
        let data = res.data || [];
        if (that.data.search_value) {
          data = that.data.searchListData.goodsList.concat(data);
          that.setData({
            'searchListData.goodsList': data
          });
        }
        getInfo.loading = false;
        getInfo.is_more = res.is_more;
        getInfo.page += 1;
      },
      complete: function () {
        getInfo.loading = false;
      }
    });
  },
  getAppShopInfo: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopInfo',
      data: {
        latitude: that.data.latitude || '',
        longitude: that.data.longitude || '',
      },
      success: function (res) {
        let data = res.data;
        if (!data.app_id) {
          return;
        }
        let dis = data.distance || 0;
        dis = util.formatDistance(dis);
        data.distance = dis;
        data.in_business = app.businessTimeCompare(data.business_time || []);;
        let newdata = {};
        newdata['mainStore'] = data;
        that.setData(newdata);
      }
    });
  },
  getBizShopViewLog: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppBizShop/GetBizShopViewLog',
      data: {
        page: 1,
        page_size: 10,
        view_type: 1
      },
      success: function (res) {
        let data = res.data;
        for (let index in data) {
          data[index].in_business = app.businessTimeCompare(data[index].business_time || []);
        }
        that.setData({
          bizLog: data
        })
      }
    });
  },
  addBizShopViewLog: function (id) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppBizShop/AddBizShopViewLog',
      data: {
        data_id: id,
        view_type: 1
      },
      success: function (res) {
      }
    });
  },
  chooseTrading: function (e) {
    let id = e.currentTarget.dataset.id;
    let index = +e.currentTarget.dataset.index;
    let from = e.currentTarget.dataset.from;
    let data = {};
    if (from === 'nearby') {
      data = this.data.bizList[index];
    } else {
      data = this.data.searchListData.franchiseeList[index];
    }
    if (data.app_id && data.parent_app_id === data.app_id) {
      this.chooseMainStore(e);
      return;
    }
    this.addBizShopViewLog(id);
    this.turnToHomePage(data);
  },
  chooseTradingbizLog: function(e){
    let index = e.currentTarget.dataset.index;
    let data = this.data.bizLog[index];
    data.app_id = data.data_id;
    data.picture = data.logo;
    this.turnToHomePage(data);
  },
  turnToHomePage: function(data){
    app.globalData.chainAppId = data.app_id;
    app.globalData.chainHistoryDataId = data.s_his_data.his_id;
    app.globalData.indexPageRefresh = true;
    app.globalData.chainNotLoading = false;
    app.setLockChainShop(data);
    let router = app.getHomepageRouter();
    wx.reLaunch({ url: '/pages/' + router + '/' + router });
  },
  chooseMainStore: function(){
    app.globalData.chainAppId = '';
    app.globalData.chainHistoryDataId = '';
    app.globalData.indexPageRefresh = true;
    app.globalData.chainNotLoading = false;
    app.removeStorage({
      key: 'chainStore',
      success: function(){
        app.setLockChainShop();
        let router = app.getHomepageRouter();
        wx.reLaunch({ url: '/pages/' + router + '/' + router });
      }
    });
  },
  searchResultTabSwitch: function (e) {
    let { index } = e.currentTarget.dataset;
    let { searchResultNav, search_value } = this.data;
    if (searchResultNav == index) {
      return;
    }
    this.setData({
      searchResultNav: index
    });
    if (search_value) {
      if (index == 1) {
        this.getMultiAppGoods();
      } else {
        this.getAppShopByPage();
      }
    } else {
      this.setData({
        searchListData: {
          goodsList: [],
          franchiseeList: []
        }
      });
    }
  },
  turnToGoodsDetail: function (e) {
    let { id, type, group, franchiseeId } = e.currentTarget.dataset;
    if (franchiseeId == app.getAppId()) {
      franchiseeId = '';
    }
    if (type == 3) {
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + '&franchisee=' + franchiseeId);
    } else if (type == 10) {
      app.toTradeGoodsDetail({ goodsId: id, franchiseeId: franchiseeId });
      return;
    } else if (group == 1) {
      let { groupId } = e.currentTarget.dataset
      app.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + id + '&activity_id=' + groupId + '&franchisee=' + franchiseeId);
    } else {
      let { cartGoodsNum } = e.currentTarget.dataset;
      cartGoodsNum = cartGoodsNum ? cartGoodsNum : 0;
      app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + '&franchisee=' + franchiseeId + '&cart_num=' + cartGoodsNum);
    }
  }
})
