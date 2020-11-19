var app = getApp();
Page({
  data: {
    centerLat: '',
    centerLng: '',
    addressListMakers: [],
    circles: [{
      latitude: '',
      longitude: '',
      fillColor: '#ff710033',
      radius: 2000
    }],
    sameJourneyId: '',
    notInRange: false,
    showAddress:false,
    showAddressList:false,
  },
  callout: {
    content: '门店地址',
    fontSize: 14,
    color: '#333333',
    borderRadius: 4,
    bgColor: '#ffffff',
    padding: 10,
    display: 'ALWAYS',
    textAlign: 'center',
    notInRange: false
  },
  franchiseeId: '',
  onLoad: function (options) {
    this.franchiseeId = options.franchiseeId || '';
    this.setData({
      from: options.from || '',
      sameJourneyId: options.sameJourneyId || '',
      compid: options.compid || ''
    })
    this.dataInitial();
  },
  onShow: function () {
    if(this.isBack){
      this.getAddressList();
    }
  },
  dataInitial: function () {
    this.getAppECStoreConfig();
    this.getAddressList();
    this.getPickUpGoodsType();
    this.isShowAddress();
  },
  getPickUpGoodsType: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getPickUpGoodsTypeSetting',
      data: {
        pick_up_type: 2,
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        if (!res.data.app_store_data){return};
        let centerLng = res.data.app_store_data.longitude;
        let centerLat = res.data.app_store_data.latitude;
        let addressListMakers = _this.data.addressListMakers;
        addressListMakers.push({
          latitude: centerLat,
          longitude: centerLng,
          iconPath: '/images/delivery.png',
          width: 20,
          height: 20,
          label: {
            content: '门店地址',
            color: '#000307',
            bgColor: '#ffffff',
            padding: 4,
            textAlign: 'center',
            borderRadius: 4,
            borderColor: '#ffffff',
            anchorX: -28,
            anchorY: -45,
          }
        })
        _this.setData({
          centerLng: centerLng,
          centerLat: centerLat,
          "circles[0].longitude": centerLng,
          "circles[0].latitude": centerLat,
          "circles[0].radius": +res.data.config_data.deliver_distance,
          addressListMakers: addressListMakers,
          showMap: true
        })
      }
    })
  },
  getAddressList: function () {
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/addressList',
      data: {
        sub_shop_app_id: _this.franchiseeId
      },
      success: function (res) {
        let addressList = res.data;
        let addressListMakers = _this.data.addressListMakers;
        let notInRange = false;
        let showAddressList = false;
        addressList.map((item) => {
          let iconPath;
          if (item.address_info.label == 0) {
            iconPath = 'http://cdn.jisuapp.cn/static/webapp/images/xcx-goods/same-city-home.png';
          } else if (item.address_info.label == 1) {
            iconPath = 'http://cdn.jisuapp.cn/static/webapp/images/xcx-goods/same-city-school.png';
          } else if (item.address_info.label == 2) {
            iconPath = 'http://cdn.jisuapp.cn/static/webapp/images/xcx-goods/same-city-company.png';
          } else {
            iconPath = 'http://cdn.jisuapp.cn/static/webapp/images/xcx-goods/same-city-other.png';
          }
          addressListMakers.push({
            latitude: item.latitude,
            longitude: item.longitude,
            iconPath: iconPath,
            width: 24,
            height: 28,
          })
          if (item.config && item.config.intra_city != 1){
            notInRange = true;
          }
          if (item.config && item.config.intra_city == 1){
            showAddressList = true;
          }
        })
        let sameJourneyId = _this.data.sameJourneyId ? _this.data.sameJourneyId : (addressList.length && addressList[0].id);
        _this.setData({
          notInRange: notInRange,
          showAddressList: showAddressList,
          addressList: addressList,
          sameJourneyId: sameJourneyId,
          addressListMakers: addressListMakers
        })
      }
    })
  },
  selectDelivery: function (event) {
    let index = event.currentTarget.dataset.index;
    let addressList = this.data.addressList;
    this.setData({
      sameJourneyId: addressList[index].id
    });
    this.sureDelivery();
  },
  sureDelivery: function () {
    let sameJourneyId = this.data.sameJourneyId;
    let pages = getCurrentPages();
    let prePage = pages[pages.length - 2];
    let addressList = this.data.addressList;
    if (!sameJourneyId){
      app.showModal({
        content: '请选择配送点'
      });
      return;
    }
    if (this.data.compid && /vertical_list/.test(this.data.compid)){
      let compid = this.data.compid;
      for (let i = 0; i < addressList.length; i++) {
        if (addressList[i].id == sameJourneyId) {
          prePage.setData({
            [compid + '.selectSameJourneyId']: sameJourneyId,
            [compid + '.selectSameJourney']: addressList[i],
            [compid + '.sameJourneyTimeType']: '',
            [compid + '.sameJourneyDateTime']: ''
          });
        }
      };
    }else {
      for (let i = 0; i < addressList.length; i++) {
        if (addressList[i].id == sameJourneyId) {
          prePage.setData({
            selectSameJourneyId: sameJourneyId,
            selectSameJourney: addressList[i],
            sameJourneyTimeType: '',
            sameJourneyDateTime: ''
          });
        }
      };
    }
    app.turnBack();
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
  },
  getCurrentLocation: function (show) {
    let _this = this;
    wx.getLocation({
      success(res) {
        const latitude = res.latitude;
        const longitude = res.longitude;
        app.sendRequest({
          url: '/index.php?r=Map/getAreaInfoByLatAndLng',
          method: 'post',
          data: {
            latitude: latitude,
            longitude: longitude
          },
          success: function (res) {
            let addressListMakers = _this.data.addressListMakers;
            addressListMakers.push({
              latitude: latitude,
              longitude: longitude,
              iconPath: 'http://cdn.jisuapp.cn/static/webapp/images/xcx-goods/same-city-me.png',
              width: 20,
              height: 20
            })
            _this.setData({
              currentLocationData: res.data,
              addressListMakers: addressListMakers
            })
          }
        });
      },
      fail(res) {
        if (res.errMsg == 'getLocation:fail auth deny' && show != 1) {
          wx.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: function (res) {
              if (res.cancel) {
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (res.confirm) {
                wx.openSetting({
                  success: function (res) {
                    if (res.authSetting["scope.userLocation"] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      _this.getCurrentLocation();
                    } else {
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        }
      }
    })
  },
  opratAddress: function () {
    this.isBack = true;
    app.turnToPage('/eCommerce/pages/myAddress/myAddress?from=form');
  },
  isShowAddress: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/getSwitchBySwitchName',
      method: 'post',
      data: {
        switch_name: 'intra_city_address_position'
      },
      success: function (res) {
        if (!res.status) {
          that.setData({
            showAddress: res.data == 1 ? true : false
          })
          if (res.data == 1) {
            that.getCurrentLocation(res.data);
          } 
        }
      }
    })
  }
})