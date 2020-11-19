const app = getApp();
Page({
  data: {
    attentionList: [],
    listInfo: {
      is_more: 1,
      page: 1,
      loading: false
    }
  },
  onLoad: function (options) {
    this.getAttentionList();
  },
  getAttentionList: function () {
    let that = this;
    let _listInfo = that.data.listInfo;
    if (_listInfo.loading){
      return;
    }
    this.setData({ "listInfo.loading": true });
    app.sendRequest({
      url: '/index.php?r=AppShopManage/UserFavoriteShop',
      data: {
        parent_app_id: app.getAppId(),
        page_num: that.data.listInfo.page,
        page_size: 10,
      },
      success: (res) => {
        that.setData({
          attentionList: that.data.attentionList.concat(res.data),
          'listInfo.is_more': res.is_more,
          'listInfo.page': _listInfo.page + 1,
          'listInfo.loading': false
        })
      }
    })
  },
  changeShopFavorite: function (e) {
    let that = this;
    let dataset = e.currentTarget.dataset;
    let ind = dataset.index;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/UpdateShopFavorite',
      data: {
        app_id: dataset.appid,
        parent_app_id: dataset.parentappid
      },
      success: (res) => {
        if(res.data){
          let _list = that.data.attentionList;
          _list[ind].status = _list[ind].status == '1' ? '0' : '1';
          that.setData({
            attentionList: _list
          })
        }
      }
    })
  },
  goToFranchiseeDetail: function (e) {
    let dataset = e.currentTarget.dataset;
    let pageLink = dataset.newpage || 'franchiseeDetail';
    let franchiseeId = dataset.appid;
    switch (pageLink.trim()) {
      case 'franchiseeWaimai':
        app.turnToPage('/franchisee/pages/franchiseeWaimai/franchiseeWaimai?detail=' + franchiseeId);
        return;
      case 'franchiseeTostore':
        app.turnToPage('/franchisee/pages/franchiseeTostore/franchiseeTostore?detail=' + franchiseeId);
        return;
      case 'franchiseeDetail4':
        app.turnToPage('/franchisee/pages/franchiseeDetail4/franchiseeDetail4?detail=' + franchiseeId);
        return;
      case 'franchiseeDetail':
        app.turnToPage('/franchisee/pages/franchiseeDetail/franchiseeDetail?detail=' + franchiseeId);
        return;
      default:
        break;
    }
    let url = '';
    if (app.pageRoot[pageLink]) {
      url = app.pageRoot[pageLink];
    } else {
      url = '/franchisee/pages/' + pageLink + '/' + pageLink;
    }
    let queryStr = franchiseeId ? '?franchisee=' + franchiseeId : '';
    app.turnToPage(url + queryStr);
  },
  onReady: function () {
  },
  onShow: function () {
  },
  onHide: function () {
  },
  onUnload: function () {
  },
  onPullDownRefresh: function () {
  },
  onReachBottom: function () {
    this.getAttentionList();
  },
  onShareAppMessage: function () {
  }
})