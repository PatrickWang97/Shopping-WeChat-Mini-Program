var app = getApp()
Page({
  data: {
    franchiseeInfo: {},
    franchiseeService: [],
    franchiseePay: []
  },
  onLoad: function(options){
    let franchisee = options.franchisee;
    this.setData({
      franchiseeId: franchisee
    });
    this.getAppShopByPage();
  },
  onShow: function(){
  },
  getAppShopByPage: function () {
    let that = this;
    let franchiseeId = this.data.franchiseeId;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopByPage',
      data: {
        sub_shop_app_id: franchiseeId
      },
      success: function (res) {
        let newdata = {},
          data = res.data[0];
        if (!data) { // 防止未完善信息报错
          return;
        }
        data.business_time_str = data.business_time_str.replace(/\,/g, '\n');
        newdata['franchiseeInfo'] = data;
        let pay = [];
        let service = [];
        for (let i = 0; i <= data.shop_facility.length; i++ ){
          let d = data.shop_facility[i];
          if (d == 1 || d == 2){
            service.push(d);
          }else if(d == 3 || d == 4){
            pay.push(d);
          }
        }
        newdata['franchiseeService'] = service;
        newdata['franchiseePay'] = pay;
        that.setData(newdata);
      }
    })
  }
})
