var app = getApp();
var utils = require('../../../utils/util.js');
Page({
  data: {
    status: 4,
    formid: [],
    goodsData: {
      goods_list: []
    }
  },
  page: 1,
  isMore: 1,
  seckillFunc: [],
  onLoad: function (options) {
    var that = this;
    that.setData({
      franchiseeId: options.franchisee || '',
      franchiseeIdInfo: {
        id: options.franchisee || ''
      }
    })
    that.pageInit();
  },
  pageInit() {
    var that = this;
    if (app.isLogin()) {
      that.loadAll();
    } else {
      app.goLogin({
        success: function () {
          that.loadAll();
        }
      });
    }
  },
  loadAll() {
    var that = this;
    that.loadList();
  },
  loadList() {
    let that = this;
    let goodsData = this.data.goodsData;
    if (goodsData.is_more == 0 || goodsData.loading){
      return;
    }
    that.setData({
      'goodsData.loading': true
    });
    app.sendRequest({
      url: '/index.php?r=appGroupBuy/goodsList',
      data: {
        page: that.page,
        page_size: 10,
        status: 0,
        sub_shop_app_id: that.data.franchiseeId
      },
      success: res => {
        let rdata = res.data,
          newdata = {},
          oldData = that.data.goodsData.goods_list || [],
          oldLen = oldData.length,
          downcountArr = that.downcountArr || [];
        for (let i = 0; i < rdata.length; i++) {
          let f = rdata[i],
            dc;
          f.description = '';
          f.downCount = {
            hours: '00',
            minutes: '00',
            seconds: '00',
            day: '00',
          };
          f.server_time = rdata.current_time || (Date.parse(new Date()) / 1000);
          f.seckill_end_time = utils.formatTime(new Date(f.end_date * 1000));
          f.seckill_start_time = utils.formatTime(new Date(f.start_date * 1000));
          f.original_price = f.virtual_price == '0.00' ? f.original_price : f.virtual_price;
          if (f.status == 0 || f.status == 1 || f.status == 2) {
            dc = app.beforeGroupDownCount(f, that, 'goodsData.goods_list[' + (oldLen + i) + ']');
          } else if (f.status == 3) {
            if (f.end_date != '-1') {
              dc = app.duringGroupDownCount(f, that, 'goodsData.goods_list[' + (oldLen + i) + ']');
            }
          }
          dc && downcountArr.push(dc);
        }
        if (that.page == 1){
          oldData = [];
        }
        newdata['goodsData.goods_list'] = oldData.concat(rdata);
        newdata['goodsData.is_more'] = res.is_more;
        that.downcountArr = downcountArr;
        that.setData(newdata);
        that.page++;
      },
      complete: function(){
        let newdata = {};
        newdata['goodsData.loading'] = false;
        that.setData(newdata);
      }
    })
  },
  gotoDetail(e) {
    var that = this,
      data = e.currentTarget.dataset;
    let franchisee = that.data.franchiseeId;
    let chainParam = franchisee ? '&franchisee=' + franchisee : '';
    this.saveUserFormId(function() {
      var pageUrl = data.status == 4 ? '/detailPage/pages/goodsDetail/goodsDetail?detail=' + data.goodsid + chainParam : '/group/pages/gpgoodsDetail/gpgoodsDetail?goods_id=' + data.goodsid + '&activity_id=' + data.activityid + chainParam;;
      app.turnToPage(pageUrl)
    })
  },
  remainMe(e) {
    var that = this,
      data = e.currentTarget.dataset,
      index = data.index,
      goodsList = that.data.goodsData.goods_list;
    app.sendRequest({
      url: '/index.php?r=appShop/careActivity',
      data: {
        data_id: data.goodsid,
        activity_id: data.activityid,
        activity_type: 0,
        sub_shop_app_id: that.data.franchiseeId
      },
      success: res => {
        for (var i = 0; i < goodsList.length; i++) {
          if (index == i) {
            app.showToast({
              title: '设置开团提醒成功！',
              duration: 2000
            });
            var newdata = {};
            newdata['goodsData.goods_list[' + i + '].status'] = 2
            this.setData(newdata)
          }
        }
      }
    })
  },
  onReady: function () {
  },
  onShow: function () {
  },
  onHide: function () {
  },
  onUnload: function () {
    if (this.downcountArr && this.downcountArr.length) {
      this.downcountArr = this.downcountArr.concat().reverse();
      for (let i = 0; i < this.downcountArr.length; i++) {
        this.downcountArr[i] && this.downcountArr[i].clear();
      }
    }
  },
  formSubmit_collect(e) {
    let formid = this.data.formid;
    formid.push(e.detail.formId);
  },
  saveUserFormId(callback) {
    app.showLoading({
      title: '加载中'
    });
    var that = this;
    app.sendRequest({
      url: '/index.php?r=api/AppMsgTpl/saveUserFormId',
      method: 'post',
      data: {
        sub_shop_app_id: that.data.franchiseeId,
        form_id: that.data.formid || []
      },
      complete: function () {
        app.hideLoading();
        callback && callback();
        that.setData({
          formid: []
        })
      }
    })
  },
  onPullDownRefresh: function () {
    this.page = 1;
    this.loadList();
    this.pullRefreshTime = setTimeout(function () {
      wx.stopPullDownRefresh();
    }, 3000);
  },
  onReachBottom: function () {
    this.loadList();
  }
})