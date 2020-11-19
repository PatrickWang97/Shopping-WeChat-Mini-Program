var app = getApp()
Page({
  data: {
    orderList: [],
    currentTabIndex: 0,
    currentGoodsType: '',
    types: [undefined, 0, 1, 2, 3, 4],
    statusTitle: ['待成单', '待发货', '待团长收货', '团员提货中', '已完成']
  },
  page: 1,
  isMore: 1,
  onLoad(options) {
    this.initData();
  },
  onReachBottom: function() {
    if (!this.isMore) {
      return
    };
    this.page++;
    this.initData();
  },
  initData() {
    let _this = this;
    let data = {
      page: this.page,
      page_size: 25,
    }
    if (this.data.currentTabIndex != 0) {
      data.status = this.data.types[this.data.currentTabIndex]
    }
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetDistributionGroupOrderByleader',
      method: 'post',
      data: data,
      success: function(res) {
        _this.isMore = res.is_more;
        res.data = [..._this.data.orderList, ...res.data];
        for(let item of res.data) {
          item.group_info.start_date = item.group_info.start_date.replace(/\-/g, '.');
          item.group_info.end_date = item.group_info.end_date.replace(/\-/g, '.');
        }
        _this.setData({
          orderList: res.data,
          isMore: res.is_more
        })
      }
    })
  },
  sureReceipt: function(e) {
    let group_order_id = e.currentTarget.dataset.id;
    let index = e.currentTarget.dataset.index;
    let orderList = this.data.orderList;
    let _this = this;
    app.showModal({
      content: '确认已收到货物?',
      showCancel: true,
      confirm: function() {
        app.sendRequest({
          url: "/index.php?r=AppDistributionExt/ConfirmGroupOrderReceipt",
          method: 'post',
          data: {
            group_order_id,
            status: 3
          },
          success: function(res) {
            if (res.status == 0) {
              if (_this.data.currentTabIndex == 0) {
                _this.page = 1;
                _this.setData({ orderList: [] });
                _this.initData();
              }else {
                orderList.splice(index, 1);
                _this.setData({
                  orderList: orderList
                })
              }
            } else {
              app.showModal({
                content: res.data
              })
            }
          }
        })
      }
    })
  },
  clickOrderTab(e) {
    let index = e.target.dataset.index;
    let data = {
      currentTabIndex: index,
      orderList: []
    };
    this.setData(data);
    this.page = 1;
    this.initData();
  },
  childOrder(e) {
    let group_order_id = e.currentTarget.dataset.id;
    let status = e.currentTarget.dataset.status;
    let start = e.currentTarget.dataset.start;
    let end = e.currentTarget.dataset.end;
    let title = e.currentTarget.dataset.title;
    wx.navigateTo({
      url: `/promotion/pages/groupOrderDeta/groupOrderDeta?group_order_id=${group_order_id}&status=${status}&start=${start}&end=${end}&activeTitle=${title}`,
    })
  },
  checkWriteOffCode: function(e) {
    app.turnToPage("/promotion/pages/communityGroupWriteOff/communityGroupWriteOff");
  }
})