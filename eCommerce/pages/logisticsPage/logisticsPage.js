var app = getApp()
Page({
  data: {
    info: {},
    logistics: []
  },
  orderId: '',
  applyId: '',
  franchiseeId: '',
  isGroup: 0,
  packageId:'',//字段为空则全部发货，否则为部分发货
  onLoad: function(options){
    let form = options.form;
    this.orderId = options.detail;
    this.applyId = options.applyId;
    this.franchiseeId = options.franchiseeId || '';
    this.isGroup = options.isGroup || 0;
    this.packageId = options.package_id || ''
    if (form == 'afterSale'){
      this.getRefundExpress();
    }else{
      this.getExpressFlow();
    }
  },
  getExpressFlow: function(){
    let _this = this;
    let data = {
      order_id: _this.orderId,
      sub_shop_app_id: _this.franchiseeId,
      package_id: _this.packageId,
    };
    let url = '/index.php?r=AppShop/expressFlow';
    if(this.isGroup) {
      url = '/index.php?r=AppDistributionExt/GetGroupExpressFlow';
      data = {
        app_id: _this.franchiseeId,
        group_order_id: _this.orderId
      }
    }
    app.sendRequest({
      url: url,
      data: data,
      success: function (res) {
        let info = _this.packageId?res.data[0]:res.data;//部分发货和全部发货的数据格式是一样的，只是部分发货的为数组，全部的为对象
        if (!info){return};
        if (info.is_custom){
          let description = info.express_description.replace(/]/g ,'[');
          let desArr = description.split('[');
          _this.setData({
            info: info,
            desArr: desArr
          })
        }else{
          let logistics = info.Traces;
          if (info.waybill_id){
            info.path_item_list.map((item) => {
              item.AcceptTime = item.action_time;
              item.AcceptStation = item.action_msg;
            }) 
            logistics = info.path_item_list;
          }
          _this.setData({
            info: info,
            logistics: logistics
          })
        }
      }
    })
  },
  getRefundExpress: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=appShop/getRefundExpress',
      data: {
        apply_id: _this.applyId,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        _this.setData({
          info: res.data,
          logistics: res.data.Traces.reverse()
        })
      }
    })
  },
  dialNumber: function(event){
    app.makePhoneCall(event.currentTarget.dataset.phone);
  }
})
