var app = getApp();
Page({
  data: {
    search_focus: false,
    search_value: '',
    searchResultNav: 0,
    searchListData: {
      goodsList: [],
      franchiseeList: []
    }
  },
  onLoad: function () {
    this.getTradingArea();
  },
  onReachBottom: function () {
    let { searchResultNav } = this.data;
    if (searchResultNav == 1) {
      this.getMultiAppGoods();
    } else {
      this.getAppShopByPage();
    }
  },
  inputFocus: function () {
    this.setData({
      search_focus: true
    })
  },
  searchBlur: function () {
    if (!this.data.search_value) {
      this.setData({
        search_focus: false
      })
    }
  },
  searchClear: function () {
    this.setData({
      search_value: '',
      search_focus: true
    })
  },
  searchCancel: function () {
    this.setData({
      searchResultNav: 0,
      search_focus: false,
      search_value: '',
      searchListData: {
        goodsList: [],
        franchiseeList: []
      }
    })
  },
  searchInput: function (e) {
    this.data.search_value = e.detail.value;
  },
  searchValue: function () {
    this.setData({
      search_value: this.data.search_value,
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
  getTradingArea: function () {
    let that = this;
    app.getLocation({
      success: function (res) {
        that.setData({
          latitude: res.latitude,
          longitude: res.longitude
        });
      }
    });
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
  getMultiAppGoods: function () {
    let that = this;
    let searchValue = that.data.search_value
    let isSearch = !!searchValue;
    let getInfo = that.getInfoData.normal;
    if (isSearch) {
      getInfo = that.getInfoData.goods;
    }
    if (getInfo.loading || getInfo.is_more == 0) {
      return;
    }
    getInfo.loading = true;
    searchValue = searchValue.replace(/(^\s*)|(\s*$)/g, '');
    app.sendRequest({
      url: '/index.php?r=AppShop/GetMultiAppGoods',
      method: 'post',
      data: {
        filter_only_pick_up_type: 4,
        parent_app_id: app.globalData.appId,
        idx_arr: {
          'idx': 'title',
          'idx_value': searchValue
        },
        is_audit: 1,
        is_biz_shop: 0,
        form: 'app_shop',
        page: getInfo.page,
        page_size: 10
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
  getAppShopByPage: function () {
    let that = this;
    let searchValue = that.data.search_value
    let isSearch = !!searchValue;
    let getInfo = that.getInfoData.normal;
    if (isSearch) {
      getInfo = that.getInfoData.franchisee;
    }
    if (getInfo.loading || getInfo.is_more == 0) {
      return;
    }
    getInfo.loading = true;
    searchValue = searchValue.replace(/(^\s*)|(\s*$)/g, '');
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      method: 'post',
      data: {
        name: searchValue,
        is_audit: 1,
        is_biz_shop: 0,
        order_by: 'distance',
        order: 'asc',
        get_least_coup: 2,
        latitude: that.data.latitude,
        longitude: that.data.longitude,
        page: getInfo.page,
        page_size: 10
      },
      success: function (res) {
        let data = res.data || [];
        if (data && data.length > 0) {
          data.forEach((item) => { // 商品只取需要的字段，防止setData数据量过大
            if (item.good_list && item.good_list.length > 0) {
              let tempArr = [];
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
        if (that.data.search_value) {
          data = that.data.searchListData.franchiseeList.concat(data);
          that.setData({
            'searchListData.franchiseeList': data
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
  turnToHomePage: function () {
    let router = app.getHomepageRouter();
    wx.reLaunch({ url: '/pages/' + router + '/' + router })
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
    if (type == 3) {
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + '&franchisee=' + franchiseeId);
    } else if (group == 1) {
      let { groupId } = e.currentTarget.dataset;
      app.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + id + '&activity_id=' + groupId + '&franchisee=' + franchiseeId);
    } else {
      let { cartGoodsNum } = e.currentTarget.dataset;
      cartGoodsNum = cartGoodsNum ? cartGoodsNum : 0;      
      app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + '&franchisee=' + franchiseeId + '&cart_num=' + cartGoodsNum);
    }
  },
  turnToFranchiseeDetail: function (event) {
    let dataset = event.currentTarget.dataset;
    let franchiseeId = dataset.appid;
    let mode = dataset.mode;
    let pageLink = dataset.newpage;
    let param = {};
    param.detail = franchiseeId;
    if (dataset.audit == 2) {
      param.shop_id = dataset.id;
    }
    if (pageLink) {
      mode = dataset.newmode;
      let options = { mode, pageLink, franchiseeId, param };
      app.turnToFranchiseePage(options);
      return;
    }
    app.goToFranchisee(mode, param);
  }
})