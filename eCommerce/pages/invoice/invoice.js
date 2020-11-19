var app = getApp()
Page({
  data: {
    invoiceTypeArr: [{
      name: '公司',
      value: 2,
    },
    {
      name: '个人',
      value: 1
    }],
    invoiceInfo: {
      'invoice_type': 1
    },
    isPatch: 0,
    liberalInvoiceType: '',
  },
  onLoad: function (options) {
    this.franchiseeId = options.franchiseeId || '';
    let pages = getCurrentPages();
    let prePage = pages[pages.length - 2];
    let invoiceInfo = prePage.data.invoiceInfo;
    this.invoiceFrom = options.from;
    this.orderId = options.orderId;
    this.data.isPatch = options.isPatch ? 1 : 0;
    this.getAppInvoiceStatus();
    if (!invoiceInfo || !invoiceInfo['liberal_invoice_type'] || !invoiceInfo['add_time'] || options.isPatch == '1') {
      this.getLiberalInvoiceType();
    } else {
      this.data.liberalInvoiceType = invoiceInfo['liberal_invoice_type'];
    }
    if (!invoiceInfo || invoiceInfo.invoice_status == -1 || invoiceInfo.invoice_status == 4){return};
    this.setData({
      invoiceInfo: JSON.parse(JSON.stringify(invoiceInfo)),
    })
  },
  onReady: function () {
  },
  onShow: function () {
  },
  changeInvoiceType: function(e){
    let type = e.currentTarget.dataset.type
    let invoiceInfo = {
      'invoice_type': type
    };
    this.setData({
      invoiceInfo: invoiceInfo
    })
  },
  selectInvoiceHead: function(){
    let _this = this;
    wx.chooseInvoiceTitle({
      success(res) {
        _this.setData({
          'invoiceInfo.invoice_type': res.type == 0 ? 2 : 1,
          'invoiceInfo.buyer_name': res.title,
          'invoiceInfo.buyer_taxpayer_num': res.taxNumber
        })
      }
    })
  },
  inputInvoiceInfor: function(e){
    let invoiceInfo = this.data.invoiceInfo;
    let name = e.currentTarget.dataset.name;
    invoiceInfo[name] = e.detail.value;
    this.setData({
      invoiceInfo: invoiceInfo
    })
  },
  saveInvoice: function(){
    let _this = this;
    let pages = getCurrentPages();
    let prePage = pages[pages.length - 2];
    let invoiceInfo = this.data.invoiceInfo;
    invoiceInfo['liberal_invoice_type'] = this.data.liberalInvoiceType;
    if (!invoiceInfo.buyer_name) {
      app.showModal({
        content: '请输入抬头'
      });
      return true;
    }
    if (invoiceInfo.invoice_type == 2 && !invoiceInfo.buyer_taxpayer_num) {
      app.showModal({
        content: '请输入税号'
      });
      return true;
    }
    if (invoiceInfo.taker_email && !/^[a-zA-Z0-9_.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z0-9]{2,6}$/.test(invoiceInfo.taker_email)) {
      app.showModal({
        content: '请输入正确的邮箱'
      });
      return true;
    }
    if(!this.invoiceFrom){
      prePage.setData({
        invoiceInfo: invoiceInfo 
      })
      app.turnBack();
    }else{
      let url;
      let data = {
        order_id: this.orderId,
        invoice_info: this.data.invoiceInfo,
        is_storeditem: this.invoiceFrom == 'balance' ? 1 : 0,
        sub_shop_app_id: this.franchiseeId
      };
      if(this.invoiceFrom == "patch" || this.invoiceFrom == "order" || this.invoiceFrom == "transfer"){
        url = '/index.php?r=AppInvoice/PatchInvoice';  
      } else if (this.invoiceFrom == 'balance') {
        url = '/index.php?r=AppInvoice/PatchInvoice';
        prePage.setData({
          messageData: {},
          'messageParam.currentPage': ''
        })
        prePage.getBalanceTime();
      }else{
        url = '/index.php?r=AppShop/UpdateOrderInvoiceInfo';
        data.is_patch = this.data.isPatch;
        delete data.is_storeditem;
      }
      app.sendRequest({
        url: url,
        method: 'post',
        data: data,
        success: function (res) {
          if (this.invoiceFrom == "order") {
            wx.showLoading({
              title: '加载中',
            });
            let index = 0;
            let timer = setInterval(() => {
              index++;
              app.sendRequest({
                url:'/index.php?r=Appshop/GetInvoiceStatus',
                method: 'post',
                data: { order_id: this.orderId },
                success: function (res) {
                  if (res.data.status !=0 || index >= 5) {
                    clearInterval(timer);
                    app.turnBack();
                  }
                }
              })
            }, 1000)
          } else {
            app.turnBack();
          }
        }
      });
    }
  },
  getAppInvoiceStatus: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAppInvoiceStatus',
      data: {
        sub_shop_app_id: this.franchiseeId
      },
      success: function (res) {
        _this.setData({
          isDiningAudit: res.data.is_dining_audit == 1 ? true : false //堂食是否开启商家确认功能
        })
      }
    })
  },
  getLiberalInvoiceType: function () {
    let _this = this;
    let appId = app.getAppId();
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetLiberalInvoiceType',
      data: {
        app_id: appId
      },
      success: function (res) {
        _this.data.liberalInvoiceType = res.data.liberal_invoice_type;
      }
    })
  }
})
