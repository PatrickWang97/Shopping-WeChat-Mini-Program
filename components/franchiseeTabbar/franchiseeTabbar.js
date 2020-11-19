var app = getApp();
var customEvent = require('../../utils/custom_event.js');
Component({
  properties: {
    franchiseeInfo: {
      type: Object,
      value: {},
      observer: function (newVal, oldVal, changedPath) {
        let that = this;
        if (newVal) {
          let newData = {};
          let tabbarInfo = app.globalData.tabbarInfo[newVal.id];
          if (tabbarInfo == false) return;
          if (!tabbarInfo){
            if (!newVal.id) return;
            that.getFranchiseeTabbar(newVal.id,function(data){
              newData['franchiseeId'] = newVal.id;
              newData['tabBar'] = data.type ? data.list.concat([data.other]) : data.list;
              newData['type'] = data.type;
              newData['hidddenPlace'] = newVal.hiddenPlace ? true : false;
              that.setData(newData);
              that.editTabBar();
            })
          }else{
            newData['franchiseeId'] = newVal.id;
            newData['tabBar'] = tabbarInfo.type ? tabbarInfo.list.concat([tabbarInfo.other]) : tabbarInfo.list;
            newData['type'] = tabbarInfo.type;
            newData['hidddenPlace'] = newVal.hiddenPlace ? true : false;
            that.setData(newData);
            that.editTabBar();
          }
        }
      }
    },
  },
  data: {
    franchiseeId: '',
    showTabbar: false,
    hidddenPlace: false, //避免影响外卖和到店页的滚动，不需要franchiseeTabbar-place
    tabBar: [],
    type:0,
  },
  methods: {
    editTabBar: function () {
      let curPage = app.getAppCurrentPage(),
          pageArr = curPage.__route__.split('/'),
          pageName = pageArr[pageArr.length - 1],
          tabBar = this.data.tabBar,
          tabLen = tabBar.length,
          newdata = {};
      for (let i = 0; i < tabLen; i++) {
        newdata['tabBar[' + i + '].active'] = false;
        let pageLink = tabBar[i].form_data['inner-page-link'] || tabBar[i].form_data['page-link'];
        if (tabLen === 1 && tabBar[i].isVisible) {//底部导航只有优惠买单时
          if (pageName !== 'transferPage'){
            newdata['showTabbar'] = true;
          }
        } else {
          if (pageLink == pageName) {
            newdata['showTabbar'] = true;          
            newdata['tabBar[' + i + '].active'] = true;//根据页面地址设置当前页面状态   
          } else if (pageName === 'transferPage' && tabBar[i].isVisible) {
            newdata['showTabbar'] = true;          
          }
        }
      }
      this.setData(newdata);
      if (newdata['showTabbar']) {
        curPage.setData({
          isShowBottom: true
        })
      }
    },
    tabBarTap: function(e){
      let index = e.currentTarget.dataset.index;
      let tab = this.data.tabBar[index];
      let curPage = app.getAppCurrentPage();
      let pageArr = curPage.__route__.split('/');
      let pageName = pageArr[pageArr.length-1];
      let pageLink = tab.form_data['inner-page-link'] || tab.form_data['page-link'] || ['inner_page_link'];
      if (pageName == pageLink){
        return;
      }
      if (pageLink){
        switch (pageLink.trim()) {
          case 'franchiseeWaimai':
            app.turnToPage('/franchisee/pages/franchiseeWaimai/franchiseeWaimai?detail=' + this.data.franchiseeId, true);
            return;
          case 'franchiseeTostore':
            app.turnToPage('/franchisee/pages/franchiseeTostore/franchiseeTostore?detail=' + this.data.franchiseeId, true);
            return;
          case 'franchiseeDetail4':
            app.turnToPage('/franchisee/pages/franchiseeDetail4/franchiseeDetail4?detail=' + this.data.franchiseeId, true);
            return;
          case 'franchiseeDetail':
            app.turnToPage('/franchisee/pages/franchiseeDetail/franchiseeDetail?detail=' + this.data.franchiseeId, true);
            return;
          default:
            break;
        }
      }else{
        app.showModal({
          content: '该页面未绑定跳转页面！',
        })
        return;
      }
      let url = '';
      if (app.pageRoot[pageLink]) {
        url = app.pageRoot[pageLink];
      } else {
        url = '/franchisee/pages/' + pageLink + '/' + pageLink;
      }
      let queryStr = '?franchisee=' + this.data.franchiseeId;
      app.turnToPage(url + queryStr, true);
    },
    turnToTransferPage: function(){
      app.turnToPage('/eCommerce/pages/transferPage/transferPage?franchisee=' + this.data.franchiseeId, true);
    },
    getFranchiseeTabbar: function (franchiseeId, callback) {
      let that = this;
      app.sendRequest({
        url: '/index.php?r=AppShopManage/GetSubAppShopBar',
        data: {
          'app_id': franchiseeId
        },
        success: function (res) {
          if (res.data && (res.data.type == 0 || res.data.type == 1)) {
            app.globalData.tabbarInfo[franchiseeId] = res.data;
            typeof callback == "function" && callback(res.data);
          } else{
            app.globalData.tabbarInfo[franchiseeId] = false;
          }
        }
      })
    },
  }
})