const app = getApp()
Component({
  properties: {
    customtopnav: {
      type: null,
      value: "",
      observer: function (newVal, oldVal) {
        if (newVal != '') {
          let param = newVal.customFeature || {};
          let pageLink = param['inner-page-link'] || param['page-link'] || param['inner_page_link'];
          if (pageLink === 'myMessage') {
            this.getCount = true;
            this.getUserUnreadCount();
          }
        }
      }
    },
    topNavBarData: {
      type: null,
      value: "",
      observer: function (newVal, oldVal) {}
    }
  },
  data: {
    count: 0,
    paddingTop: app.globalData.topNavBarPaddingTop,
    height: app.globalData.topNavBarHeight - app.globalData.topNavBarPaddingTop,
  },
  getCount: false,
  attached: function() {
    this.setData({
        windowWidth: wx.getSystemInfoSync().windowWidth
    })
  },
  pageLifetimes: {
    show() {
      if (this.getCount) {
        this.getUserUnreadCount();
      }
    }
  },
  methods: {
    changePage: function (e) {
      let { index } = e.currentTarget.dataset;
      this.properties.topNavBarData.titleList.forEach(title => {
        title.select = false
      })
      this.properties.topNavBarData.titleList[index].select = true;
      this.triggerEvent('changeNav', this.properties.topNavBarData.titleList);
    },
    tapEventCommonHandler(e) {
      app.tapEventCommonHandler(e);
    },
    getUserUnreadCount: function () {
      let that = this;
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppNotify/GetNotifyMsgUnreadCount',
        data: {
          types: '5,6,16',
        },
        success: function (res) {
          let count = 0;
          for (let i in res.data) {
            count += res.data[i].unread_count;
          }
          that.setData({
            count
          });
        }
      })
    },
    turnToSearch(event) {
      app.turnToSearchPage(event);
    },
    _navback() {
      const pageInstance = app.getAppCurrentPage();
      if (pageInstance.data.communityPublishType && pageInstance.data.communityPublishType.show) {
        pageInstance.setData({
          'communityPublishType.show': false
        });
        return;
      }
      if (pageInstance.data.communityPublish && pageInstance.data.communityPublish.show) {
        pageInstance.setData({
          'communityPublish.show': false
        });
        return;
      }
      let pages = getCurrentPages();
      if (pages.length > 3) {
        let closestSameLastPageIndex = this.closestSameLastPageIndex(pages[pages.length - 2], pageInstance, pages);
        app.turnBack({ delta: pages.length - closestSameLastPageIndex - 1 });
      } else if (pages.length > 1) {
        app.turnBack();
      }
    },
    _backhome() {
      let pageInstance = app.getAppCurrentPage();
      let pageRoute = pageInstance.route;
      let pageOptions = pageInstance.options;
      let franchiseeId = '';
      app.globalData.leaderInfo = '';    // 返回首页清空社区团购信息
      if (/franchisee(Detail4?|Waimai|Tostore)$/.test(pageRoute)) {
        franchiseeId = pageOptions.detail || pageOptions.franchisee;
      } else if (pageOptions.franchisee) {
        franchiseeId = pageOptions.franchisee;
      }
      if (franchiseeId && app.getChainAppId() !== franchiseeId) {
        this.getFranchiseeIndexPage(franchiseeId).then(targetPage => {
          if (this.checkPagesIsSame(targetPage, pageInstance)) {
            this.turnToHomePage();
            return;
          }
          let pages = getCurrentPages();
          let closestSameLastPageIndex = this.closestSameLastPageIndex(targetPage, pageInstance, pages);
          if (closestSameLastPageIndex === undefined) {
            app.turnToPage('/' + targetPage.route + '?' + Object.keys(targetPage.options).map(key => key + '=' + targetPage.options[key]).join('&'));
          } else {
            app.turnBack({ delta: pages.length - closestSameLastPageIndex - 1 });
          }
        }).catch((err) => {
          if (err.status == 0) {
            this.turnToHomePage();
          }
        });
        return;
      }
      this.turnToHomePage();
    },
    turnToHomePage: function () {
      let tabBarPagePathArr = app.getTabPagePathArr();
      let url = '/pages/' + app.globalData.homepageRouter + '/' + app.globalData.homepageRouter;
      if (tabBarPagePathArr.indexOf(url) != -1) {
        if (app.isTabBarPage()) {
          wx.showTabBar();
          let pageInstance = app.getAppCurrentPage();
          pageInstance.setData({
            showGetUserInfo: false
          });
          app._logining = false;
        }
        app.turnToPage(url);
      } else {
        app.reLaunch({ url: url });
      }
    },
    getFranchiseeIndexPage: function(franchiseeId) {
      return new Promise((resolve, reject) => {
        app.sendRequest({
          hideLoading: true,
          url: '/index.php?r=AppShop/GetAppShopByPage',
          data: {
            sub_shop_app_id: franchiseeId
          },
          success: function (res) {
            if (Array.isArray(res.data) && res.data[0]) {
              let shopInfo = res.data[0];
              let subAppBar = shopInfo.sub_app_bar;
              let appid = franchiseeId;
              let audit = shopInfo.is_audit;
              let mode = shopInfo.mode_id;
              let id = shopInfo.id;
              let newmode = subAppBar.mode_id || '';
              let pageLink = subAppBar['homepage-router'] || '';
              let param = {};
              let route = '';
              param.detail = appid;
              if (audit == 2) {
                param.shop_id = id;
              }
              if (pageLink) {
                mode = newmode;
                switch (pageLink.trim()) {
                  case 'franchiseeWaimai':
                    route = '/franchisee/pages/franchiseeWaimai/franchiseeWaimai';
                    break;
                  case 'franchiseeTostore':
                    route = '/franchisee/pages/franchiseeTostore/franchiseeTostore';
                    break;
                  case 'franchiseeDetail4':
                    route = '/franchisee/pages/franchiseeDetail4/franchiseeDetail4';
                    break;
                  case 'franchiseeDetail':
                    route = '/franchisee/pages/franchiseeDetail/franchiseeDetail';
                    break;
                  default:
                    if (app.pageRoot[pageLink]) {
                      route = app.pageRoot[pageLink];
                    } else if (franchiseeId) {
                      route = '/franchisee/pages/' + pageLink + '/' + pageLink;
                    }
                    param = {
                      franchisee: franchiseeId,
                      fmode: mode
                    }
                    break;
                }
              }else if (mode == 1) {
                route = '/franchisee/pages/franchiseeWaimai/franchiseeWaimai';
              } else if (mode == 3) {
                route = '/franchisee/pages/franchiseeTostore/franchiseeTostore';
              } else if (mode == 2) {
                route = '/franchisee/pages/franchiseeDetail4/franchiseeDetail4';
              } else {
                route = '/franchisee/pages/franchiseeDetail/franchiseeDetail';
              }
              resolve({route: route.slice(1), options: param});
            } else {
              reject(res);
            }
          },
          fail: reject
        });
      });
    },
    checkPagesIsSame(p1, p2) {
      if (!p1 || !p1.route || !p2 || !p2.route) {
        return false;
      }
      if (p1.route !== p2.route) {
        return false;
      }
      if (Object.keys(p1.options).length !== Object.keys(p2.options).length) {
        return false;
      }
      return Object.keys(p1.options).every(key => p1.options[key] === p2.options[key]);
    },
    closestSameLastPageIndex(lastPage, curPage, pages) {
      let index;
      for (let i = pages.length - 1; i >= 0; i -= 2) {
        if (i > 1 && this.checkPagesIsSame(curPage, pages[i]) && this.checkPagesIsSame(lastPage, pages[i - 1])) {
          index = i - 1;
        }else {
          break;
        }
      }
      return index;
    }
  }
})