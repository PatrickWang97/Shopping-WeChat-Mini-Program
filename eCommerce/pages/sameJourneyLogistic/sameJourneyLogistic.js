var app = getApp()
Page({
  data: {
    info: {},
    logistics: [],
    arriveTime: '',
    sameCity: 0
  },
  orderId: '',
  franchiseeId: '',
  onLoad: function(options){
    let type = options.type;
    let sameCity = options.sameCity;
    this.orderId = options.orderId;
    this.franchiseeId = options.franchiseeId || '';
    this.getTransportOrderFlow();
    if(type == 0){
      this.getSameJourneySet();
    }else{
      this.getTransporterInfo();
    } 
    this.setData({
      type: type,
      arriveTime: options.arriveTime,
      sameCity: sameCity
    })
  },
  getTransporterInfo: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/queryTransporterInfo',
      data: {
        order_id: _this.orderId,
        sub_shop_app_id: _this.franchiseeId,
      },
      success: function (res) {
        let data = res.data;
        let riderMakers = [{
          latitude: data.transporterLat,
          longitude: data.transporterLng,
          iconPath: '/images/transport.png',
          width: 50,
          height: 50,
          callout: {
            content: '骑手距您' + data.arrive_buyer_distance + '米',
            fontSize: 11,
            color: '#333333',
            borderRadius: 4,
            bgColor: '#ffffff',
            padding: 10,
            display: 'ALWAYS',
            textAlign: 'center'
          },
        }]
        _this.setData({
          info: data,
          riderMakers: riderMakers,
          centerLatitude: +data.transporterLat + + 0.0004,
          centerLongitude: data.transporterLng,
          showMap: true
        })
      }
    })
  },
  getTransportOrderFlow: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppTransport/getTransportOrderFlow',
      data: {
        order_id: _this.orderId,
        sub_shop_app_id: _this.franchiseeId,
      },
      success: function (res) {
        _this.setData({
          logistics: res.data.reverse()
        })
      }
    })
  },
  getSameJourneySet: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getPickUpGoodsTypeSetting',
      data: {
        pick_up_type: 2,
        sub_shop_app_id: _this.franchiseeId,
      },
      success: function (res) {
        let storeData = res.data.app_store_data;
        let riderMakers = [{
          latitude: storeData.latitude,
          longitude: storeData.longitude,
          iconPath: 'http://cdn.jisuapp.cn/static/webapp/images/xcx-goods/merchant-delivery.png',
          width: 47,
          height: 51,
          callout: {
            content: '商家配送暂无配送信息',
            fontSize: 11,
            color: '#333333',
            borderRadius: 4,
            bgColor: '#ffffff',
            padding: 5,
            display: 'ALWAYS',
            textAlign: 'center'
          },
        }]
        _this.setData({
          riderMakers: riderMakers,
          centerLatitude: +storeData.latitude + 0.0004,
          centerLongitude: storeData.longitude,
          phone: storeData.contact_phone,
          showMap: true
        })
      }
    })
  },
  contactPhone: function(event){
    app.makePhoneCall(event.currentTarget.dataset.phone);
  }
})
