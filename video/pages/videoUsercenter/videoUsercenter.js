var app = getApp();
var util = require('../../../utils/util.js');
Page({
  data: {
    activeTab: "purchased",
    purchased: {
      init: true,
      page: 1,
      isNoMore: false,
      isLoading: false
    },
    favorited: {
      init: false,
      page: 1,
      isNoMore: false,
      isLoading: false
    },
    browsing: {
      init: false,
      page: 1,
      isNoMore: false,
      isLoading: false
    },
    purchasedVideo: [],
    favoritedVideo: [],
    browsingHistory: []
  },
  onLoad: function(options) {
    this.getPurchasedVideo();
  },
  getPurchasedVideo: function () {
    let purchased = this.data.purchased;
    if (purchased.isNoMore || purchased.isLoading) {
      return;
    }
    this.setData({
      "purchased.isLoading": true
    });
    app.sendRequest({
      url: "/index.php?r=AppVideo/GetPurchasedVideo",
      data: {
        page: purchased.page
      },
      chain: true,
      success: res => {
        let purchasedVideo = this.data.purchasedVideo;
        purchased.page++;
        purchased.isNoMore = res.is_more ? false : true;
        this.setData({
          purchasedVideo: purchasedVideo.concat(res.data),
          purchased: purchased
        });
      },
      complete: res => {
        this.setData({
          "purchased.isLoading": false
        })
      }
    })
  },
  getFavoritedVideo: function () {
    let favorited = this.data.favorited;
    if (favorited.isNoMore || favorited.isLoading) {
      return;
    }
    this.setData({
      "favorited.isLoading": true
    });
    app.sendRequest({
      url: "/index.php?r=AppVideo/GetFavoritedVideo",
      data: {
        page: favorited.page
      },
      chain: true,
      success: res => {
        let favoritedVideo = this.data.favoritedVideo;
        favorited.page++;
        favorited.isNoMore = res.is_more ? false : true;
        if (!favorited.init) {
          favorited.init = true;
        }
        this.setData({
          favoritedVideo: favoritedVideo.concat(res.data),
          favorited: favorited
        });
      },
      complete: res => {
        this.setData({
          "favorited.isLoading": false
        });
      }
    })
  },
  getBrowsingHistory: function () {
    let browsing = this.data.browsing;
    if (browsing.isNoMore || browsing.isLoading) {
      return;
    }
    this.setData({
      "browsing.isLoading": true
    });
    app.sendRequest({
      url: "/index.php?r=AppVideo/GetBrowsingHistory",
      data: {
        page: browsing.page
      },
      chain: true,
      success: res => {
        let browsingHistory = this.data.browsingHistory;
        browsing.page++;
        browsing.isNoMore = res.is_more ? false : true;
        if (!browsing.init) {
          browsing.init = true;
        }
        this.setData({
          browsingHistory: browsingHistory.concat(res.data),
          browsing: browsing
        });
      },
      complete: res => {
        this.setData({
          "browsing.isLoading": false
        });
      }
    })
  },
  tabChange: function (e) {
    var index = e.currentTarget.dataset.index,
      init = this.data[index].init;
    this.setData({
      activeTab: index
    });
    if (init) {
      return;
    }
    this.sendRequest();
  },
  turnToVideoDetail: function (e) {
    app.turnToVideoDetail(e);
  },
  scrollBottom: function (e){
    this.sendRequest();    
  },
  sendRequest: function () {
    let activeTab = this.data.activeTab;
    switch (activeTab) {
      case "purchased":
        this.getPurchasedVideo();
        break;
      case "favorited":
        this.getFavoritedVideo();
        break;
      case "browsing":
        this.getBrowsingHistory();
        break;
      default:
        break;
    }
  }
})
