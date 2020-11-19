var app = getApp()
Page({
  data: {
    currentBalance: 0, // 当前储值金
    nowTime:'',
    year:'',
    month:'',
    earlyTime:'',
    messageData: {},
    messageParam: {},
    systemHeight:0,
    balanceHeight:0,
    booleanData: {
      isHideCouponNav: true,
      isHideRecordNav: true,
    },
    recordsListData: {
      type: 0,
      text: '全部'
    },
    invoiceStatus: {
      '-1': '申请开票',
      '0': '开票中，请稍等',
      '1': '查看发票',
      '3': '开票失败'
    },
    invoiceColor: {
      '-1': 'color309',
      '0': 'color666',
      '1': 'color333',
      '3': 'colorf23'
    },
    subShopsListStr: '',
  },
  onLoad: function(options){
    this.setData({
      franchisee: options.franchisee ? options.franchisee : '',
    })
    this.getSystemHeight();
    this.getNowMonth();
    this.getBalanceData();
    this.getBalanceTime();
    this.getAppECStoreConfig();
    this.getSubShopsList();
    this.getAppInvoiceStatus();
  },
  gotoRecharge: function(){
    app.turnToPage('/eCommerce/pages/recharge/recharge', true);
  },
  gotoShopsList: function() {
    app.turnToPage('/eCommerce/pages/balanceShopsList/balanceShopsList');
  },
  getBalanceData: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getAppUserBalance',
      hideLoading: true,
      success: function(res){
        that.setData({
          'currentBalance': res.data.balance
        });
      }
    });
  },
  getBalanceTime:function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetUserEarliestStoredLog',
      hideLoading: true,
      data:{
        type: that.data.recordsListData.type
      },
      success: function (res) {
        if(!res.status && res.data){
          that.setData({
            'earlyTime': res.data.month ||''
          });
          that.getMessageData();
        }else{
          that.setData({
            'earlyTime':  ''
          });
        }
      }
    });
  },
  getMessageData: function(){
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/getStoredLogByUserToken',
      hideLoading: true,
      data: {
        'page': that.data.messageParam.currentPage || 1,
        'type': that.data.recordsListData.type,
        'month': that.data.nowTime,
      },
      success: function(res){
        let messageData = that.data.messageData;
        let data = messageData['time' + that.data.nowTime] = that.data.messageData['time'+that.data.nowTime] || {};
        data['data'] = (that.data.messageData['time' + that.data.nowTime].data ? that.data.messageData['time' + that.data.nowTime].data.concat(that.parseMessageData(res.data)) : that.parseMessageData(res.data)) || "",
        data['month'] = that.data.month;
        data['year'] = that.data.year;
        data['add'] = res.add || that.data.messageData['time' + that.data.nowTime].add || 0,
          data['reduce'] = res.reduce || that.data.messageData['time' + that.data.nowTime].reduce || 0,
        that.setData({
          'messageData': messageData,
          'messageParam.isMore': res.is_more,
          'messageParam.currentPage': res.current_page || "",
          'messageParam.onload': false,
        });
        if(that.data.balanceHeight <= that.data.systemHeight){
          that.getBalanceHeight();
        }
      }
    });
  },
  parseMessageData: function(data){
    var that = this;
    let array = [];
    let item = {};
    for (var i = 0; i < data.length; i++) {
      let type = data[i].type;
      let content = JSON.parse(data[i].stored_content);
      let num = '';
      let title = '';
      if(type == 1 ) { 
        num = Number(content.price) + Number(content.g_price);
      } else if(type == 2 || type == 3 || type == 4){
        num = Number(content.price);
        if (type == 3) {
          title = data[i].app_shop_name ? `${data[i].app_shop_name}消费储值金` : '商品买卖';
        }
      } else if(type == 5){
        num = Number(content.g_price);
      } else if(type == 6 || type == 10 || type == 11 || type == 12 || type == 13 || type == 14 || type == 15){
        num = Number(content.price) + Number(content.g_price);
      } else if (type == 7 || type == 8 || type == 9 || type == 16 || type == 17 || type == 18 || type == 19 || type == 20 || type == 21){
        num = Number(content.price);
      }
      let remark = content.remark;
      remark = remark?remark.replace('\\n','\n'):'';
      item = {
        type: type,
        num: num ? num.toFixed(2) : num,
        time: data[i].add_time,
        remark: remark || '',
        invoice_status: data[i].invoice_status,
        order_id: data[i].order_id,
        app_shop_name: title,
        invoiceType: data[i].liberal_invoice_type,
      }
      array.push(item);
    }
    return array;
  },
  checkMoreMessageData: function(){
    let that = this;
    if ((that.data.messageParam.isMore != 0) && (!that.data.messageParam.onload)) {
      that.data.messageParam.currentPage++;
      that.getMessageData();
      that.setData({
        'messageParam.onload': true
      });
    } else if ((that.data.messageParam.isMore == 0) && (that.data.nowTime != that.data.earlyTime) && (!that.data.messageParam.onload)){
      that.data.messageParam.currentPage = 0;
      that.computeTimeGetData();
      that.setData({
        'messageParam.onload': true
      });
    }; 
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    });
  },
  getNowMonth:function(){
    let myDate = new Date();
    let month = myDate.getMonth()+1;
    month = month < 10 ? '0' + month : month;
    let year = String(myDate.getFullYear()); 
    this.data.year = year;
    this.data.month = month;
    this.data.nowTime = year + String(month)
  },
  getSystemHeight:function(){
    let that =this;
    wx.getSystemInfo({
      success: function(res) {
        that.setData({
          systemHeight:res.windowHeight,
        })
      },
    })
  },
  getBalanceHeight:function(){
    let that = this;
    wx.createSelectorQuery().select('#balanceContent').boundingClientRect().exec((res)=>{
      that.setData({
        balanceHeight:res[0].height,
      });
      if(that.data.balanceHeight <= that.data.systemHeight){
        that.computeTimeGetData();
      }
    })
  },
  computeTimeGetData:function(){
    if(this.data.nowTime !=this.data.earlyTime){
      let month = Number(this.data.month);
      if(month == 1){
        this.data.month = 12;
        this.data.year = this.data.year - 1;
        this.data.nowTime = String(this.data.year)+String(this.data.month);
      }else{
        month = month -1;
        this.data.month = month<10?'0'+String(month):String(month);
        this.data.nowTime = this.data.nowTime - 1;
      };
      this.getMessageData();
    }
  },
    toggleMoreType: function (e) {
      let dataObj = this.data;
      let dataName = '';
      if (typeof e === 'string') { // js调用
        dataName = e;
      }
      if (typeof e === 'object' && e.currentTarget) { // wxml调用
        let datasetObj = e.currentTarget.dataset;
        dataName = datasetObj.name;
      }
      let isHide = dataObj.booleanData[dataName];
      isHide = isHide === true ? false : true;
      this.setData({
        ['booleanData.' + [dataName]]: isHide
      });
    },
  selectRecordType: function (e) {
    let tempArr = ['全部', '充值', '消费'];
    let index = e.currentTarget.dataset.index;
    if(this.data.recordsListData.type != index){
      this.getNowMonth();
      this.setData({
        'recordsListData.type': index,
        'recordsListData.text': tempArr[index],
        'messageParam.currentPage': 1,
        messageData: {},
        balanceHeight: 0,
      });
      this.getBalanceTime();
    }
    this.toggleMoreType('isHideRecordNav');
  },
  goInvoicePage: function (e) {
    let orderId = e.currentTarget.dataset.orderId;
    let pagePath = '/eCommerce/pages/invoice/invoice?from=balance&orderId=' + orderId;
    app.turnToPage(pagePath);
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
  checkInvoice: function (e) {
    let orderId = e.currentTarget.dataset.orderId;
    let invoiceType = e.currentTarget.dataset.invoiceType;
    let pagePath = '/eCommerce/pages/invoiceDetails/invoiceDetails?orderId=' + orderId + '&invoiceType=' + invoiceType;
    app.turnToPage(pagePath);
  },
  getSubShopsList: function() {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/GetAppStoredShopIdxList',
      data: {
        page: 1,
        page_size: 10,
      },
      success: function(res) {
        let returnList = res.data;
        let tempArr = [];
        if(returnList && returnList.length) {
          tempArr = returnList.map((item) => item.name);
        }
        let subShopsStr = tempArr.join('、');
        that.setData({
          subShopsStr: subShopsStr
        });
      }
    });
  },
  getAppInvoiceStatus: function () {
    let _this = this;
    let { franchiseeId } = this.data;
    app.sendRequest({
      url: '/index.php?r=AppInvoice/GetAppInvoiceStatus',
      data: {
        sub_shop_app_id: _this.data.franchisee
      },
      success: function (res) {
        _this.setData({
          isOpenInvoice: res.data.is_invoice == 1 ? true : false
        })
      }
    })
  },
})
