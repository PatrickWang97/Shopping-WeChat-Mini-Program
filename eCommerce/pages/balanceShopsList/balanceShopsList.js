const app = getApp();
const util = require('../../../utils/util.js');
Page({
  data: {
    subShopsList: {
      list: [],
      loadingData: {
        isLoading: false,
        currentPage: 1,
        pageSize: 10,
        isMore: 1,
      },
      listNull: {
        tipTxt: '',
        tipImg: ''
      }
    }
  },
  onLoad: function (options) {
    let { isVip } = options;
    this.isVip = isVip;
    this.getSubShopsList();
  },
  onPullDownRefresh: function () {
    this.setData({
      'subShopsList.list': [],
      'subShopsList.loadingData': {
        isMore: 1,
        currentPage: 1,
        isLoading: false
      },
      'subShopsList.listNull': {
        tipTxt: '',
        tipImg: '',
      }
    });
    this.getSubShopsList();
  },
  onReachBottom: function () {
    this.getSubShopsList();
  },
  getSubShopsList: function () {
    let that = this;
    let { locationInfo } = app.globalData;
    let { list, loadingData, listNull } = this.data.subShopsList;
    if (loadingData.isLoading || !loadingData.isMore) {
      return false;
    }
    that.setData({
      'subShopsList.loadingData.isLoading': true
    });
    let params = {
      url: '/index.php?r=AppShopManage/GetAppStoredShopIdxList',
      data: {
        page: loadingData.currentPage,
        page_size: 10,
        longitude: locationInfo.longitude,
        latitude: locationInfo.latitude,
      }
    };
    if (this.isVip) {
      const pages = getCurrentPages();
      let prevPage = pages[pages.length - 2];  //上一个页面
      let cardInfo = prevPage.data.currentVipCard || prevPage.data.vipInfo //取上页data里的数据也可以修改
      params['url'] = '/index.php?r=AppShopManage/GetVipAppShopList';
      params['data']['card_id'] = cardInfo.id;
      params['data']['parent_app_id'] = app.getAppId();
      params['data']['is_paid_vip'] = cardInfo.condition_type == 2 ? 1 : 0;
    }
    app.sendRequest({
      url: params.url,
      data: params.data,
      success: function (res) {
        let returnList = res.data;
        if (returnList && returnList.length) {
          returnList.forEach((shop) => shop.distance = util.formatDistance(shop.distance));
          list = [...list, ...returnList];
        } else {
          listNull.tipImg = 'http://cdn.jisuapp.cn/zhichi_frontend/static/webapp/images/xcx-differentialMall/icon_data_null.png';
          listNull.tipTxt = '暂无数据喔~';
          that.setData({
            'subShopsList.listNull': listNull,
          });
          return;
        }
        loadingData.currentPage = (res.current_page || 0) +1;
        loadingData.isMore = +res.is_more;
        loadingData.isLoading = false;
        that.setData({
          'subShopsList.list': list,
          'subShopsList.loadingData': loadingData,
        });
      },
      complete: function() {
        wx.stopPullDownRefresh();
      }
    });
  },
  turnToFranchisee: function (event) {
    let dataset = event.currentTarget.dataset;
    let franchiseeId = dataset.appId;
    let mode = dataset.mode;
    let pageLink = dataset.newpage;
    let param = {};
    param.detail = franchiseeId;
    if (pageLink) {
      mode = dataset.newmode;
      let options = { mode, pageLink, franchiseeId, param };
      app.turnToFranchiseePage(options);
      return;
    }
    app.goToFranchisee(mode, param);
  },
})