var app = getApp();
Page({
  data: {
    history: [],
    inputContent: ''
  },
  onLoad: function (options) {
    this.setData({
      searchConf: options.searchConf || '',                                         // 搜索结果页配置
      keyCodeMeta: options.keyCodeMeta == 'true' ? true : false,              // 搜索联想
      hotSearch: options.hotSearch == 'true' ? true : false,                  // 热门搜索
      hasQuickTags: options.hasQuickTags == 'true' ? true : false,            // 推荐搜索标签
      form: options.form || '',
      comeSearch: options.search ? true : false,
      inputContent: options.search || '',
      isHideStock: options.isHideStock || '',
      isHideSales: options.isHideSales || '',
      integral: options.integral || '',
      isShowVirtualPrice: options.isShowVirtualPrice || '',
      isShoppingCart: options.isShoppingCart || '',
      isBuyNow: options.isBuyNow || '',
      category: options.category || '',
      isShowFG: options.isShowFG || '',
      industry: options.industry || '',
      quickTags: options.quickTags ? options.quickTags.split(',') : [],
      bindType: options.bindType || '',                                       // true 全局 false 当前
      hotTags: [],
      associativeList: [],
      leaderToken: options.leader_token || (app.globalData.leaderInfo && app.globalData.leaderInfo.user_token) || '',
    });
    var _this = this;
    app.getStorage({
      key: 'history',
      success: function (res) {
        _this.setData({ history: res.data });
      }
    })
    this.getHotKeywords()
  },
  searchList: function () {
    let history = this.data.history;
    let content = this.data.inputContent;
    let index = history.indexOf(content);
    if (!content) {
      app.showToast({ title: '请输入搜索词', icon: 'none' })
      return
    }
    if (index > -1){
      history.splice(index, 1);
    }
    history.unshift(content);
    if (history.length > 10) history = history.slice(0, 10);
    this.setData({ history: history });
    app.setStorage({
      key: "history",
      data: history
    });
    this.addSearchKeywordStats(content);
    if(this.data.comeSearch){
      app.setStorage({
        key: "current-search",
        data: content
      });
      app.turnBack();
      app.globalData.classifyGoodsListPageRefresh = true;
    }else{
      this.turnToClassifyGoodsListPage(content);
    }
  },
  quickSearch: function (e) {
    let tag = e.target.dataset.tag;
    let history = this.data.history;
    let content = tag;
    let index = history.indexOf(content);
    this.setData({ inputContent: tag });
    if (!content) {
      app.showToast({ title: '请输入搜索词', icon: 'none' })
      return
    }
    if (index > -1){
      history.splice(index, 1);
    }
    history.unshift(content);
    if (history.length > 10) history = history.slice(0, 10);
    this.setData({ history: history }); // 更新历史搜索
    app.setStorage({
      key: "history",
      data: history
    });
    this.addSearchKeywordStats(tag);
    if (this.data.comeSearch) {
      app.setStorage({
        key: "current-search",
        data: tag
      });
      app.turnBack();
      app.globalData.classifyGoodsListPageRefresh = true;
    }else{
      this.turnToClassifyGoodsListPage(tag);
    }
  },
  turnToClassifyGoodsListPage: function (word){
    let data = this.data;
    let param = '';
    if (data.isHideStock != '') {
      param += '&isHideStock=' + data.isHideStock;
    }
    if (data.isHideSales != '') {
      param += '&isHideSales=' + data.isHideSales;
    }
    if (data.integral != '') {
      param += '&integral=' + data.integral;
    }
    if (data.isShowVirtualPrice != '') {
      param += '&isShowVirtualPrice=' + data.isShowVirtualPrice;
    }
    if (data.isShoppingCart != '') {
      param += '&isShoppingCart=' + data.isShoppingCart;
    }
    if (data.isBuyNow != '') {
      param += '&isBuyNow=' + data.isBuyNow;
    }
    if (data.category != '') {
      param += '&category_id=' + data.category;
    }
    if (+data.isShowFG === 1) {
      param += '&isShowFG=' + 1;
    }
    if(data.searchConf != ''){
      param += '&searchConf=' + data.searchConf;
    }
    if(data.industry != ''){
      param += '&industry=' + data.industry;
    }
    if(data.quickTags.length) {
      param += '&quickTags=' + data.quickTags.join(',');
    }else{
      param += '&quickTags='
    }
    if(data.keyCodeMeta) {
      param += '&keyCodeMeta=' + data.keyCodeMeta;
    }
    if(data.hotSearch) {
      param += '&hotSearch=' + data.hotSearch;
    }
    if(data.hasQuickTags) {
      param += '&hasQuickTags=' + data.hasQuickTags;
    }
    if(data.leaderToken) {
      param += '&leader_token=' + data.leaderToken;
    }
    param += '&bindType=' + data.bindType;
    app.turnToPage('/default/pages/classifyGoodsListPage/classifyGoodsListPage?form=' + data.form + '&search=' + word + param, true);
  },
  bindChange: function (e) {
    this.setData({ inputContent: e.detail.value });
    this.getAssociateSearchKeyword(e.detail.value);
  },
  clearSearch: function () {
    this.setData({
      inputContent: '',
      showResult: false,
      associativeList: []
    });
  },
  clearHistory: function () {
    let _this = this;
    app.removeStorage({
      key: 'history',
      success: function (res) {
        _this.setData({ history: [] });
      }
    })
  },
  navigateBack: function () {
    app.turnBack();
  },
  addSearchKeywordStats: function(keyword) {
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=/AppKeyword/AddSearchKeywordStats',
      data: {keyword: keyword},
      success: function (res) {
      }
    });
  },
  getHotKeywords: function() {
    let _this = this;
    let nowdate = new Date()
    let y = nowdate.getFullYear();
    let m = nowdate.getMonth() + 1;
    let d = nowdate.getDate();
    m = m < 10 ? '0'+ m : m;
    d = d < 10 ? '0'+ d : d;
    let end_date = `${y}${m}${d}`;
    nowdate.setMonth(nowdate.getMonth() - 1);
    y = nowdate.getFullYear();
    m = nowdate.getMonth() + 1;
    d = nowdate.getDate();
    m = m < 10 ? '0'+ m : m;
    d = d < 10 ? '0'+ d : d;
    let start_date = `${y}${m}${d}`;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=/AppKeyword/GetSearchKeywordStats',
      data: {start_date, end_date},
      success: function (res) {
        _this.setData({ hotTags: res.data })
      }
    });
  },
  getAssociateSearchKeyword: function(keyword) {
    if(!keyword) {
      this.setData({associativeList: []})
      return
    }
    let _this = this;
    app.sendRequest({
      hideLoading: true,
      url: '/index.php?r=/AppKeyword/AssociateSearchKeyword',
      data: {keyword: keyword},
      success: function (res) {
        _this.setData({associativeList: res.data})
      }
    });
  }
})
