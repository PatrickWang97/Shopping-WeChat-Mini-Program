var app = getApp();
var util = require('../../../utils/util.js');
Page({
  data: {
    search_status: false,
    search_focus: false,
    search_value: '',
    bizList: [],
    search_result: [],
    bizLog: [],
    searchResultNav: 1,
    searchListData: {
      goodsList: [],
      franchiseeList: []
    },
  },
  onLoad: function (options) {
    let locationInfo = app.globalData.locationInfo;
    let pages = getCurrentPages();
    let prevPage = pages[pages.length - 2];
    let compId = options.compId;
    let compData = prevPage.data[compId];
    let newdata = {};
    newdata.fixedPosition = compData.customFeature.fixedPosition;
    newdata.posotionLevel = compData.customFeature.posotionLevel;
    this.setData(newdata);
    if (compData.customFeature.fixedPosition && !locationInfo.latitude){
      app.chooseLocation({
        success: function (res) {
          let latitude = res.latitude,
            longitude = res.longitude;
          app.sendRequest({
            url: '/index.php?r=Region/GetAreaInfoByLatAndLng',
            data: {
              latitude: latitude,
              longitude: longitude
            },
            success: function (res) {
              app.setLocationInfo({
                latitude: latitude,
                longitude: longitude,
                address: res.data.formatted_addresses.recommend,
                info: res.data
              });
            }
          })
        },
        fail: function () {}
      })
    }
  },
  onReachBottom: function () {
    let { searchResultNav, search_value } = this.data;
    if (searchResultNav == 1) {
      this.getFranchiseeShop();
    } else {
      this.getMultiAppGoods();
    }
  },
  inputFocus: function () {
    this.setData({
      search_focus: true
    })
  },
  searchBlur: function () {
    if (!this.data.search_status && !this.data.search_value) {
      this.setData({
        search_focus: false
      })
    }
  },
  searchClear: function () {
    this.setData({
      search_value: '',
      search_status: false,
      search_focus: true,
    })
  },
  searchCancel: function () {
    this.setData({
      searchResultNav: 1,
      search_focus: false,
      search_status: false,
      search_value: '',
      searchListData: {
        goodsList: [],
        franchiseeList: []
      }
    })
  },
  searchInput: function (e) {
    this.setData({
      search_value: e.detail.value
    })
  },
  searchValue: function (e) {
    this.setData({
      search_value: e.detail.value,
      search_status: true,
      searchListData: {
        goodsList: [],
        franchiseeList: [],
        bizList: []
      }
    });
    this.getInfoData.goods = {
      page: 1,
      loading: false,
      is_more: 1,
    };
    this.getInfoData.franchisee = {
      page: 1,
      loading: false,
      is_more: 1,
    };
    this.getInfoData.biz = {
      page: 1,
      loading: false,
      is_more: 1,
    };
    let { searchResultNav } = this.data;
    if (searchResultNav == 1) {
      this.getFranchiseeShop();
    } else {
      this.getMultiAppGoods();
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
    },
    biz: {
      page: 1,
      loading: false,
      is_more: 1
    }
  },
  getMultiAppGoods: function () {
    let that = this;
    let isSearch = !!that.data.search_value;
    let getInfo = that.getInfoData.normal;
    let parentAppId = app.globalData.chainAppId || app.globalData.appId;
    if (isSearch) {
      getInfo = that.getInfoData.goods;
    }
    if (getInfo.loading || getInfo.is_more == 0) {
      return;
    }
    getInfo.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetMultiAppGoods',
      method: 'post',
      data: {
        idx_arr: {
          'idx': 'title',
          'idx_value': that.data.search_value
        },
        is_audit: 1,
        is_biz_shop: 1,
        form: 'app_shop',
        page: getInfo.page,
        page_size: 10,
        parent_app_id: app.globalData.appId,
        current_his_id: app.globalData.historyDataId,
        is_parent_shop_goods: 1,
        special_biz_shop: 1,
      },
      chain: true,
      success: function (res) {
        let data = res.data || [];
        if (that.data.search_value) {
          data = that.data.searchListData.goodsList.concat(data);
          that.setData({
            'searchListData.goodsList': data
          });
        }
        getInfo.loading = false;
        getInfo.is_more = res.is_more || 0;
        getInfo.page += 1;
      },
      complete: function () {
        getInfo.loading = false;
      }
    });
  },
  getFranchiseeShop: function () {
    let that = this;
    let isSearch = !!that.data.search_value;
    let getInfo = that.getInfoData.normal;
    let appId = app.globalData.appId;
    let fposition = that.data.fixedPosition;
    let param = {};
    param.sort_key = fposition ? 'distance' : 'weight';
    param.sort_direction = fposition ? 1 : 0;
    param.is_biz_shop = 0;
    param.latitude = fposition ? app.globalData.locationInfo.latitude : '';
    param.longitude = fposition ? app.globalData.locationInfo.longitude : '';
    param.name = that.data.search_value;
    param.page = getInfo.page;
    param.page_size = 10;
    if (isSearch) {
      getInfo = that.getInfoData.franchisee;
    }
    if (getInfo.loading || getInfo.is_more == 0) {
      return;
    }
    getInfo.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      method: "post",
      data: param,
      success: function (res) {
        let data = res.data || [];
        if (data && data.length > 0) {
          data.forEach((item) => {
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
  getAppShopByPage: function () {
    let that = this;
    let isSearch = !!that.data.search_value;
    let getInfo = that.getInfoData.normal;
    let fposition = that.data.fixedPosition;
    let param = {};
    param.sort_key = fposition ? 'distance' : 'weight';
    param.sort_direction = fposition ? 1 : 0;
    param.is_biz_shop = 1;
    param.latitude = fposition ? app.globalData.locationInfo.latitude : '';
    param.longitude = fposition ? app.globalData.locationInfo.longitude : '';
    param.name = that.data.search_value;
    param.page = getInfo.page;
    param.page_size = 10;
    if (isSearch) {
      getInfo = that.getInfoData.biz;
    }
    if (getInfo.loading || getInfo.is_more == 0) {
      return;
    }
    getInfo.loading = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      data: param,
      success: function (res) {
        let data = res.data;
        if (data && data.length === 0) {
          that.setData({
            'searchListData.bizListNull': true
          });
          return;
        }
        for (let index in data) {
          let distance = data[index].distance;
          data[index].distance = util.formatDistance(distance);
          let desc = data[index].description || '';
          data[index].description = desc.replace(/<\/?.+?\/?>/g, '');
        }
        if (that.data.search_value) {
          if (getInfo.page != 1) {
            data = that.data.searchListData.bizList.concat(data);
          }
          that.setData({
            'searchListData.bizList': data
          })
        } else {
          if (getInfo.page != 1) {
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
    let { search_value, searchResultNav } = this.data;
    if (searchResultNav == index) {
      return;
    }
    this.setData({
      searchResultNav: index
    });
    if (search_value) {
      if (index == 1) {
        this.getFranchiseeShop();
      } else {
        this.getMultiAppGoods();
      }
    } else {
      this.setData({
        searchListData: {
          goodsList: [],
          franchiseeList: [],
          bizList: []
        }
      });
    }
  },
  turnToFranchiseeDetail: function (e) {
    let dataset = e.currentTarget.dataset;
    let mode = dataset.mode;
    let pageLink = dataset.newpage;
    let param = {};
    param.detail = dataset.appid;
    let opt = {
      param, pageLink, mode, franchiseeId: dataset.appid
    }
    if (!pageLink) {
      app.goToFranchisee(mode, param, true);
      return;
    }
    app.turnToFranchiseePage(opt, true);
  },
  turnToGoodsDetail: function (e) {
    let { id, type, group, groupId, franchiseeId } = e.currentTarget.dataset;
    if (type == 3) {
      app.turnToPage('/pages/toStoreDetail/toStoreDetail?detail=' + id + '&franchisee=' + franchiseeId);
    } else if (group == 1) {
      app.turnToPage('/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + id + '&activity_id=' + groupId + '&franchisee=' + franchiseeId);
    } else {
      app.turnToPage('/detailPage/pages/goodsDetail/goodsDetail?detail=' + id + '&franchisee=' + franchiseeId + '&cart_num=0');
    }
  },
})