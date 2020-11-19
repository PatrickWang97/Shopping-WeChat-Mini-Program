var app = getApp();
Page({
  data: {
  list: [],                      // 核销码集合
    code: '',                   // 单核销
    writeAll: false,           // 是否是多订单核销
    buyer_id: '',             // 团员id
  },
  params: {                  // 请求订单列表参数设置
    is_more: 1,
    page: 1,
    page_size: 10,
    leader_token: app.globalData.userInfo.user_token, 
    dis_buyer_id: '',
    goods_type: 0,
    screening_cond: {
      status: 10,
      is_distribution_order: 2,
    }
  },
  onLoad: function(options) {},
  onReachBottom: function() {
    if (this.params.is_more) {
      this.getWaitWriteOrderList();
    }
  },
  searchWrite: function(e) {
    let _this = this;
    let value = typeof e == 'object' ? e.detail.value : e;
    if (value != '') {
      app.sendRequest({
        url: '/index.php?r=AppDistributionExt/GetOrderInfoByVerifyCode',
        method: 'post',
        data: { code: value },
        success: function(res) {
          if (Array.isArray(res.data) && res.data.length  == 0) {
            app.showModal({
              content: '无待核销订单',
            })
          }else {
            _this.setData({
              list: [res.data],
              code: value,
              writeAll: false
            })
          }
        }
      })
    }
  },
  cancellation: function(e) {
    let id = e.currentTarget.dataset.id;
    let index = e.currentTarget.dataset.index;
    this.data.writeAll ? this.writeAllOff(id,index) : this.finishCode(this.data.code);
  },
  goToOrderDetail: function(e) {
    let orderId = e.currentTarget.dataset.id;
    let groupPath = '/promotion/pages/communityGroupOrderDetail/communityGroupOrderDetail?formGroup=group&detail=' + orderId;
    app.turnToPage(groupPath);
  },
  scan: function () {
    let _this = this;
    app.scanCode({
      success: function (res) {
        let data = JSON.parse(res.result);
        if (data.buyer_id) {
          _this.checkCodeIsInvalid(data);
        }else {
          _this.searchWrite(data.code);
        }
      }
    })
  },
  checkCodeIsInvalid(data) {
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/GetServerTimestamp',
      data: {},
      method: 'post',
      success: (res)=> {
        if (res.data - data.create_time > 30) {
          app.showModal({
            content: '二维码超过30s已失效,请重新扫码',
            showCancel: true,
          })
          return;
        }
        this.params.dis_buyer_id = data.buyer_id;
        this.getWaitWriteOrderList();
        this.setData({
          writeAll: true,
          buyer_id: data.buyer_id,
          code: ''
        })
      }
    })
  },
  finishCode: function(code) {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/VerifyGroupOrder',
      method: 'post',
      data: {
        code: code
      },
      hideLoading: true,
      success: function(res) {
        app.showToast({
          title: '核销成功!',
          icon: 'none',
          duration: 1500,
        })
        let list = _this.data.list;
        let index = list.findIndex(item=> { return item == code});
        list.splice(index,1);
        _this.setData({
          code: '',
          list: list
        })
      }
    })
  },
  getWaitWriteOrderList: function() {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/orderList',
      data: this.params,
      method: 'post',
      success: function(res) {
        if (res.data.length) {
          that.params.is_more = res.is_more;
          that.params.page += res.is_more ? 1 : 0;
          that.setData({
            list: that.data.list.concat(res.data),
          })
        }else {
          app.showModal({
            content: '无待核销订单',
          })
        }
      }
    })
  },
  writeAllOff: function(orderId,index) {
    let list = this.data.list;
    let that = this;
    let order_id_list = [];
    if (!!orderId) {
      list.splice(index,1);
    }else {
      order_id_list = list.map(item=> { return item.form_data.order_id})
      list = [];
    }
    let params = {
      order_id_list: !!orderId ? [orderId] : order_id_list,
      user_token: app.globalData.userInfo.user_token,
      buyer_id: this.data.buyer_id
    };
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/confirmDisGroupOrderByLeaderToken',
      data: params,
      method: 'post',
      hideLoading: true,
      success: function(res) {
        that.setData({
          code: '',
          list: list
        })
        app.showToast({
          title: '核销成功!',
          icon: 'none',
          duration: 1500,
        })
      }
    })
  },
  confirmWriteAll: function() {
    let that = this;
    app.showModal({
      content: '确定核销全部订单?',
      showCancel: true,
      confirm: function() {
        that.writeAllOff();
      },
    })
  },
})