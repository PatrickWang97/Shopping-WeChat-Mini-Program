var app = getApp()
Page({
  data: {
    invoiceStatus: false,
    invoiceList: [],
    page: 1,
    page_size: 10,
    noMore: false,
    invoiceInfo: {
      'invoice_type': 1
    },
  },
  onLoad: function (options) {
  },
  onReady: function () {
  },
  onShow: function () {
    this.setData({
      invoiceList: [],
    })
    this.getInvoiceList();
  },
  onHide: function () {
  },
  onUnload: function () {
  },
  onPullDownRefresh: function () {
  },
  onReachBottom: function () {
    this.scrollToListBottom();
  },
  onShareAppMessage: function () {
  },
  scrollToListBottom: function () {
    if (!this.data.noMore) {
      this.data.page++;
      this.getInvoiceList();
    }
  },
  getInvoiceList: function () {
    let _this = this;
    let param = {
      page: _this.data.page,
      page_size: _this.data.page_size,
    }
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetUserInvoiceLog',
      data: param,
      method: 'get',
      success: function (res) {
        if (res.status === 0) {
          let invoiceList = _this.data.invoiceList.concat(res.data)
          _this.setData({
            invoiceList: invoiceList,
            noMore: res.is_more == 0 ? true : false,
          })
        } else {
          app.showToast({
            title: res.data,
            icon: none
          })
        }
      }
    })
  },
  checkInvoice: function (e) {
    let orderId = e.currentTarget.dataset.orderId;
    let invoiceType = e.currentTarget.dataset.invoiceType;
    let pagePath = '/eCommerce/pages/invoiceDetails/invoiceDetails?orderId=' + orderId + '&invoiceType=' + invoiceType;
    app.turnToPage(pagePath);
  },
  goInvoicePage: function (e) {
    let index = e.currentTarget.dataset.index;
    let orderId = e.currentTarget.dataset.orderId;
    this.data.invoiceInfo = this.data.invoiceList[index]['invoice_info'];
    let pagePath = '/eCommerce/pages/invoice/invoice?from=invoiceList&orderId=' + orderId;
    app.turnToPage(pagePath);
  },
  resetInvoice: function (e) {
    let _this = this;
    let invoiceList = this.data.invoiceList;
    let index = e.currentTarget.dataset.index;
    let param = {
      order_id: e.currentTarget.dataset.orderId,
      liberal_invoice_type: e.currentTarget.dataset.invoiceType,
    }
    app.sendRequest({
      url: '/index.php?r=AppInvoice/PatchInvoiceWithLiberalInvoiceType',
      data: param,
      success: function (res) {
        app.showToast({
          title: res.data,
          icon: 'success'
        })
        invoiceList[index]['status'] = 0;
        _this.setData({
          invoiceList: invoiceList
        })
      }
    })
  },
  saveInWeChat: function (e) {
    let orderId = e.currentTarget.dataset.orderId;
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAuthInfo',
      data: {
        order_id: orderId
      },
      success: function (res) {
        app.navigateToXcx({
          appId: res.data.appid,
          path: res.data.auth_url
        })
      }
    })
  },
})