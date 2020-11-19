var app = getApp()
Page({
  data: {
    orderList: [],
    currentTabIndex: 0,
    group_order_id: '',
    types: [undefined, 0, 1, 2, 10, 3, 4, 7],
    statusOrder: ['待付款', '已支付', '待收货', '待评价', '退款审核中', '正在退款中', '已完成', '已关闭', '', '', '待提货'],
    parentStatus: ['待结算', '待发货', '待团长收货', '团员提货中', '已完成'],
    status: 0
  },
  page: 1,
  isMore: 0,
  onLoad(options) {
    this.setData({
      group_order_id: options.group_order_id,
      status: options.status,
      start: options.start,
      end: options.end,
      activeTitle: options.activeTitle
    })
    this.getOrderList();
  },
  onReachBottom() {
    if (!this.isMore) {
      return;
    }
    this.page++;
    this.getOrderList();
  },
  getOrderList() {
    let _this = this;
    let data = {
      page: _this.page,
      page_size: 25,
      goods_type: 0,
      group_order_id: _this.data.group_order_id
    };
    if (_this.data.currentTabIndex != 0) {
      data.idx_arr = {
        idx: 'status',
        idx_value: _this.data.types[_this.data.currentTabIndex]
      }
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/orderList',
      method: 'post',
      data,
      success: function (res) {
        res.data = [..._this.data.orderList, ...res.data];
        _this.isMore = res.is_more;
        _this.setData({
          orderList: res.data
        })
      }
    })
  },
  clickOrderTab(e) {
    let index = e.currentTarget.dataset.index;
    let data = {
      currentTabIndex: index,
      orderList: []
    };
    this.page = 1;
    this.setData(data);
    this.getOrderList();
  },
  getWriteOffCodeBox: function (event) {
    let _this = this;
    let orderId = event.target.dataset.id;
    let franchiseeId = event.target.dataset.franchisee;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetOrderVerifyCode',
      data: {
        'sub_shop_app_id': franchiseeId,
        'order_id': orderId
      },
      success: function (res) {
        _this.finishCode(res.data.code);
      }
    })
  },
  finishCode: function (code) {
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/VerifyGroupOrder',
      method: 'post',
      data: {
        code: code
      },
      success: function (res) {
        if (res.status == 0) {
          app.showToast({
            title: '核销成功',
            icon: 'success'
          })
        } else {
          app.showToast({
            title: res.data,
            icon: 'none'
          })
        }
      }
    })
  },
  checkGoupOrderDetail: function (e) {
    let orderList = this.data.orderList;
    let index = e.currentTarget.dataset.index;
    let orderId = orderList[index].form_data.order_id
    app.turnToPage('/promotion/pages/communityGroupOrderDetail/communityGroupOrderDetail?formGroup=group&detail=' + orderId);
  },
  makePhoneCall: function(e) {
    let phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  }
})