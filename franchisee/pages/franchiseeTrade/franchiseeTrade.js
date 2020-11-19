let app = getApp();
let tradeInfo = {};
Page({
  data: {
    currentTab: 1,
    tradeList: [],  //所有一级商圈
    navBars: [],
    hotTradeList: [],  //热门商圈
    hideTrade: true,  //切换商圈
    showSearchWrap: false,
    hasTrade: false,  //是否已选商圈
    tabType: '',  //置顶字母
    allStrtoupper: [],
    tradeValue: [{},{},{}],
    secondeList: [],
    thirdList: [],
    searchResult: [],
    HisId: '', 
  },
  searchHeight: 52,
  onLoad: function(options) {
    let pages = getCurrentPages();
    let prevPage = pages[pages.length - 2];
    let compId = options.compId;   
    let compData = prevPage.data[compId];
    let newdata = {};
    tradeInfo =  wx.getStorageSync('tradeInfo') || {};
    newdata.fixedPosition = compData.customFeature.fixedPosition;
    newdata.posotionLevel = compData.customFeature.posotionLevel;
    newdata.tradeInfo = tradeInfo;
    newdata['HisId'] = app.globalData.historyDataId;
    this.setData(newdata);
    if (tradeInfo && tradeInfo.m_name) {
      let levelNum = tradeInfo.level;
      this.setData({
        hasTrade: true,
        currentTab: levelNum > 0 ? levelNum - 1 : 0,
        ['tradeValue[' + levelNum + ']']: tradeInfo,
      })
      if (levelNum == 0) {
        this.getTradeList({level: 1, p_id: tradeInfo.id});       //此时无上级商圈，通过1级id获取下级商圈
      } else {
        this.getPreTradeList({ data_id: tradeInfo.id });  //获取上级上圈
        this.getTradeList({ level: levelNum, p_id: tradeInfo.p_id }, tradeInfo.id);  //获取兄弟、子商圈
      }
    } 
    this.initData();
  },
  initData: function () {
    let that = this;
    this.getTradeList({level: 0, noLocal: true});
    this.getTradeList({ is_hot: 1, noLocal: true});
    let query = wx.createSelectorQuery()
    query.select('#franchisee-search').boundingClientRect();
    query.selectViewport();
    query.exec(function (res) {
      if (res[0]) {
        that.searchHeight = res[0].height;
      }
    });
  },
  getTradeList: function(options, nextId) {
    let that = this;
    let _data = that.data;
    let param = options || {};
    let fposition = that.data.fixedPosition;
    let locationInfo = app.globalData.locationInfo;
    if (fposition && !param.noLocal) {
      param.latitude = locationInfo.latitude;
      param.longitude = locationInfo.longitude;
    }
    if (param.noLocal) delete param.noLocal;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/GetBizShopLevelList',
      data: param,
      success: function(res) {
        let dataArr = res.data;
        let newdata = {};
        if (param.level == 0) { //获取一级商圈
          newdata.tradeList = dataArr;
          newdata.navBars = res.nav_bars;
          that.getAllStrtoupper(res.data);
        } else if (param.is_hot) {  //热门
          newdata.hotTradeList = dataArr;
        } else if (param.name) { //搜索
          let searchList = that.dataReset(dataArr);
          newdata.searchResult = searchList;
        } else if (param.p_id) { //获取当前商圈的兄弟
          if (param.level == 1) {
            let sList = that.dataReset(dataArr);
            newdata.secondeList = sList;
            if (_data.tradeValue[1].m_name && _data.thirdList.length == 0) {
              that.getTradeList({ level: 2, p_id: nextId})
            }
          } else if (param.level == 2) {
            let tList = that.dataReset(dataArr);
            newdata.thirdList = tList;
            if (_data.secondeList.length == 0) {
              that.getTradeList({ level: 1, p_id: _data.tradeValue[1].p_id });
            }
          }
        }
        that.setData(newdata);
      }
    });
  },
  getPreTradeList: function (options) {
    let that = this;
    let param = options || {};
    let fposition = that.data.fixedPosition;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/GetParentBizShopList',
      data: param,
      success: function (res) {
        let newdata = {};
        let data = res;
        let len = res.length;
        newdata['tradeValue[0]'] = data[0] || {};
        if (len > 1)  {
          newdata['tradeValue[1]'] = data[1] || {};
        }
        that.setData(newdata);
      }
    });
  },
  getAllStrtoupper: function (obj) {
    let strArr = [];
    let that = this;
    let HisId = this.data.HisId;
    obj.forEach(item =>{
      item.biz_shop_list.forEach( list => {
        if (list.s_his_data.online_his_id === HisId) {
          item.hasNewHisId = true;
          if (strArr.indexOf(item.strtoupper) < 0) {
            strArr.push(item.strtoupper);
          }
        }
      })
    })
    this.setData({
      tradeList: obj,
      allStrtoupper: strArr
    })
    setTimeout(function(){
      that.bindObserver(strArr);
    },1500)
  },
  bindObserver: function (obj) {
    let that = this;
    let wheight = app.getSystemInfoData().windowHeight;
    obj.forEach(item => {
      let idItem = item;
      if (item == '#') idItem = 'other';
      let str = '_observer' + idItem;
      that[str] = wx.createIntersectionObserver(that);
      that[str].relativeToViewport({
        bottom: 2 - wheight + 10
      })
      .observe('#' + idItem, (res) => {
        if (res.intersectionRatio > 0) {
          that.setData({
            tabType: item
          })
        }
      });
    });
    that._observerMain = wx.createIntersectionObserver(that);
    that._observerMain.relativeToViewport({
      bottom: that.searchHeight - wheight
    })
      .observe('#circle-list-wrap', (res) => {
        if (res.intersectionRatio <= 0) {
          that.setData({
            tabType: ''
          })
        }
      });
  },
  bindSearchBlur: function (e) {
    let val = e.detail.value;
    this.setData({
      searchValue: val
    })
    if(val){
      this.getTradeList({name: val})
    }
  },
  bindSearchFocus: function (e) {
    if (!this.data.showSearchWrap) {
      this.setData({
        showSearchWrap: true
      })
    }
  },
  clearValue: function () {
    this.setData({
      searchValue: ""
    })
  },
  toCloseResult: function () {
    this.searchValue = '';
    this.setData({
      showSearchWrap: false
    })
  },
  scrollToTrade: function (e) {
    let type = e.currentTarget.dataset.type;
    let that = this;
    let query = wx.createSelectorQuery();
    query.select('#' + type).boundingClientRect();
    query.selectViewport().scrollOffset();
    query.exec(function (res) {
      let top = res[0].top + res[1].scrollTop;
      app.pageScrollTo(top - that.searchHeight);
    })
  },
  clickTab: function (e) {
    let ind = e.currentTarget.dataset.id;
    this.setData({
      currentTab: ind
    })
  },
  chooseScrollTrade: function (e) {
    let dataset = e.currentTarget.dataset;
    let app_id = dataset.appId;
    let type = dataset.type;
    tradeInfo.app_id = app_id;
    tradeInfo.level = dataset.level;
    tradeInfo.id = dataset.id;
    tradeInfo.p_id = dataset.pId;
    tradeInfo.m_name = dataset.name;
    tradeInfo.his_id = dataset.hisId;
    tradeInfo.online_his_id = dataset.onlineHisId;
    app.setStorage({ key: 'tradeInfo', data: tradeInfo });
    app.globalData.chainAppId = app_id;
    app.globalData.newHistoryDataId = dataset.hisId;
    if (type == 0 || type == 2) {
      let pages = getCurrentPages();
      let prevPage = pages[pages.length - 2];
      app.reLaunch({ url: '/' + prevPage.route });
      return;
    }
    this.setData({
      ['tradeValue[' + type + ']']: tradeInfo,
      currentTab: type - 1
    })
    if (type == 1) {
      this.getTradeList(this.getTradeList({ level: 2, p_id: dataset.id }));
      return;
    }
  },
  hideTradeWrap: function () {
    this.setData({
      hideTrade: !this.data.hideTrade
    })
  },
  dataReset: function (dataArr) {
    let listArr = [];
    dataArr.map(item => {
      if (item && item.biz_shop_list){
        item.biz_shop_list.map(list => {
          listArr.push(list);
        })
      }
    });
    return listArr;
  },
  onUnload: function () {
    let that = this;
    let arr = this.data.allStrtoupper;
    arr.map(item => {
      let idItem = item;
      if (item == '#') idItem = 'other';
      let str = '_observer' + idItem;
      if (that[str]) {
        that[str].disconnect();
      }
    });
    if (that._observerMain) that._observerMain.disconnect();
  }
})