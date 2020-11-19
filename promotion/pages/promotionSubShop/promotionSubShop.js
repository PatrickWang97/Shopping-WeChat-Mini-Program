const app = getApp();
Page({
  data: {
    shopList: [],
    shopListParam: {
      loading: false,
      isMore: true,
      loadingFail: false,
      page: 1
    },
    searchValue: ''
  },
  onLoad: function (options) {
    this.getAppShopList();
  },
  onPullDownRefresh: function () {
    this.refreshShopList(true);
  },
  onReachBottom: function () {
    this.getAppShopList();
  },
  getAppShopList: function () {
    let {
      shopList,
      shopListParam: {
        loading,
        isMore,
        page
      },
      searchValue
    } = this.data;
    if (!isMore || loading) {
      return;
    }
    this.setData({
      ['shopListParam.loading']: true
    });
    let param = {
      page,
      is_dis_sub_shop: 1,
      is_dis_sub_shop_audit: 1,
      orderby: 'weight'
    };
    let that = this;
    param.page_size = 10;
    if (searchValue = searchValue.trim()) {
      param.name = searchValue;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      method: 'POST',
      data: param,
      success: function ({data, current_page, is_more}) {
        if (page === 1) {
          shopList = data;
        }else {
          shopList = shopList.concat(data);
        }
        page = current_page + 1;
        isMore = is_more == 1;
        that.setData({
          shopList,
          ['shopListParam.loading']: false,
          ['shopListParam.isMore']: isMore,
          ['shopListParam.page']: page
        });
        wx.stopPullDownRefresh();
      },
      fail: function () {
        that.setData({
          ['shopListParam.loading']: false,
          ['shopListParam.loadingFail']: true
        });
        wx.stopPullDownRefresh();
      }
    })
  },
  refreshShopList: function (withSearchValue) {
    let newdata = {
      shopListParam: {
        loading: false,
        isMore: true,
        loadingFail: false,
        page: 1,
      }
    }
    if (!withSearchValue) {
      newdata.searchValue = '';
      this.searchValue = '';
    }
    this.setData(newdata);
    this.getAppShopList();
  },
  searchValue: '',
  searchInputHandle: function (e) {
    let value = e.detail.value;
    this.searchValue = value;
    this.setData({
      searchValue: value
    });
  },
  searchConfirmHandle: function () {
    let {searchValue} = this.data;
    if (searchValue !== this.searchValue) {
      this.setData({
        searchValue: this.searchValue
      });
    }
    this.refreshShopList(true);
  },
  clearInputHandle: function () {
    this.setData({
      searchValue: ''
    });
    this.refreshShopList(true);
  },
  turnToFranchiseeDetail: function (event) {
    let dataset = event.currentTarget.dataset;
    let appid = dataset.appid;
    let mode = dataset.mode;
    app.goToFranchisee(mode, {detail: appid});
  }
})
