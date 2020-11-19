var app = getApp();
Page({
  data: {
    deliveryList: [],
    currLat: 0,
    currLng: 0,
    markers: [],
    mapCircle: [],
    deliveryId: '',
    showAddress: false,
    currentLocationData: '',
    statusFail: true,
    searchStatus: 0,
    tabList: [
      { label: '选择门店', value: 0 },
      { label: '常去门店', value: 1 },
    ],
    currentTab: 0,
    selfLocation: {
      lat: 0,
      lng: 0
    },
    searchValue: '',
    searchPageStatus: false,
    searchDeliveryList: [],
    loading: true,
    isMore: false,
  },
  callout: {
    content: '',
    fontSize: 14,
    color: '#333333',
    borderRadius: 4,
    bgColor: '#ffffff',
    padding: 10,
    display: 'ALWAYS',
    textAlign: 'center'
  },
  franchiseeId: '',
  onLoad: function (options) {
    this.isFranchisee = options.isFranchisee ? true : false;
    this.franchiseeId = options.franchiseeId || '';
    this.setData({
      deliveryId: options.deliveryId || ''
    })
    this.dataInitial();
  },
  onShow: function () {
    this.setData({
      loading: true
    })
  },
  dataInitial: function () {
    this.isShowAddress();
    this.getCurrentLocation();
    this.getAppECStoreConfig();
  },
  getSelfDeliveryList: function () {
    let { lat, lng } = this.data.selfLocation;
    let _this = this;
    this.setData({
      loading: true
    })
    app.sendRequest({
      url: '/index.php?r=AppShop/getSelfDeliveryList',
      hideLoading: true,
      data: {
        page: 1,
        page_size: 10,
        sub_shop_app_id: this.franchiseeId,
        longitude: lng,
        latitude: lat,
        priority_store_id: this.data.deliveryId || '',
        search: this.data.searchValue,
        is_commonly_used_stores: this.data.currentTab
      },
      success: function ({ data, is_more }) {
        if (data.store_list_data && data.store_list_data.length) {
          _this.calculationDistance(data.store_list_data);
        } else {
          if (!_this.data.searchPageStatus) {
            _this.setData({
              deliveryList: [],
            });
          } else {
            _this.setData({
              searchDeliveryList: []
            });
          }
        }
        if (data.self_delivery_setting) {
          _this.setData({
            searchStatus: !+data.self_delivery_setting.search_store
          })
        }
        _this.setData({
          loading: false,
          isMore: !!+is_more
        })
      }
    })
  },
  calculationDistance: function (deliveryList) {
    for (let i = 0; i < deliveryList.length; i++) {
      let distance = parseInt(app.calculationDistanceByLatLng(this.data.selfLocation.lat, this.data.selfLocation.lng, deliveryList[i].latitude, deliveryList[i].longitude));
      let item = deliveryList[i];
      item.distance = distance;
      item.distanceText = distance > 1000 ? (distance / 1000).toFixed(1) + 'km' : distance + 'm';
      if (item.region_data.country_region_id === 1) {
        item.region_data.region_string = item.region_data.region_string.replace(/\s+/g, "");
      }
    }
    deliveryList = deliveryList.sort((x, y) => x.distance > y.distance ? 1 : -1);
    if (!this.data.searchPageStatus) {
      deliveryList[0].recentlyStore = true;
      this.setData({
        showMap: true
      });
      this.showCallout(deliveryList);
    } else {
      this.setData({
        searchDeliveryList: deliveryList
      });
    }
  },
  showCallout: function (deliveryList) {
    let deliveryId = this.data.deliveryId;
    let index = 0;
    let setDataObj = {};
    let markers = [];
    let deliveryInfo = {};
    for (let i = 0; i < deliveryList.length; i++) {
      if (deliveryList[i].id == deliveryId) {
        index = i;
      }
    };
    if(index !== 0) {
      deliveryList = [...deliveryList.splice(index, 1), ...deliveryList];
    }
    deliveryInfo = deliveryList[0];
    this.callout.content = deliveryInfo.title;
    markers = deliveryList.map((item, index) => {
      return {
        latitude: item.latitude,
        longitude: item.longitude,
        iconPath: 'http://develop.zhichiwangluo.com/static/webapp/images/self-delivery.png',
        width: 24,
        height: 28,
        callout: ''
      }
    })
    markers[0].callout = this.callout;
    setDataObj['deliveryList'] = deliveryList;
    setDataObj['markers'] = markers;
    setDataObj['currLat'] = deliveryInfo.latitude;
    setDataObj['currLng'] = deliveryInfo.longitude;
    setDataObj['deliveryId'] = deliveryInfo.id;
    this.setData(setDataObj);
  },
  selectDelivery: function (event) {
    let index = event.currentTarget.dataset.index;
    let deliveryList = !this.data.searchPageStatus ? this.data.deliveryList : this.data.searchDeliveryList;
    let deliveryInfo = deliveryList[index];
    let _this = this;
    let setDataObj = {};
    let config_data = {};
    this.callout.content = deliveryInfo.title;
    setDataObj[`markers[${index}].callout`] = this.callout;
    setDataObj['currLat'] = deliveryInfo.latitude;
    setDataObj['currLng'] = deliveryInfo.longitude;
    setDataObj['deliveryId'] = deliveryInfo.id;
    config_data['app_store_id'] = deliveryInfo.id;
    app.app_store_id = deliveryInfo.id;
    this.setData(setDataObj);
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/setAppUserConfigData',
      method: 'post',
      data: {
        name: 'priority_self_delivery_shop',
        config_data: config_data
      },
      success: function () {
        _this.sureDelivery();
      }
    })
  },
  sureDelivery: function () {
    let _this = this;
    let deliveryId = this.data.deliveryId;
    let pages = getCurrentPages();
    let prePage = pages[pages.length - 2];
    let deliveryList = !this.data.searchPageStatus ? this.data.deliveryList : this.data.searchDeliveryList;
    for (let i = 0; i < deliveryList.length; i++) {
      if (deliveryList[i].id == deliveryId) {
        let setDataObj = {};
        if (_this.isFranchisee) {
          setDataObj[`mulShopsInfo.${_this.franchiseeId}.selectDelivery`] = deliveryList[i];
          setDataObj[`mulShopsInfo.${_this.franchiseeId}.tostoreOrderType`] = '';
          setDataObj[`mulShopsInfo.${_this.franchiseeId}.dateIndex`] = '';
          setDataObj[`mulShopsInfo.${_this.franchiseeId}.tostoreDateTime`] = '';
          setDataObj[`mulShopsInfo.${_this.franchiseeId}.tostoreWeekTime`] = '';
        } else {
          setDataObj['selectDelivery'] = deliveryList[i];
          setDataObj['tostoreOrderType'] = '';
          setDataObj['dateIndex'] = '';
          setDataObj['tostoreDateTime'] = '';
          setDataObj['tostoreWeekTime'] = '';
        }
        prePage.setData(setDataObj);
      }
    };
    app.turnBack();
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      if (res.color_config) {
        res.color_config.theme = res.color_config.theme || '#ff7100';
      }
      this.setData({
        storeStyle: res.color_config
      })
    }, this.franchiseeId);
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
            showAddress: res.data == 1 ? true : false,
          })
        }
      }
    })
  },
  getCurrentLocation: function () {
    let _this = this;
    app.getLocation({
      type: 'gcj02',
      success(res) {
        let { latitude, longitude } = res;
        _this.setData({
          'selfLocation.lat': latitude,
          'selfLocation.lng': longitude,
          'mapCircle[0].latitude': latitude,
          'mapCircle[0].longitude': longitude,
          'mapCircle[0].radius': 10000,
          statusFail: false
        })
        _this.getAreaInfoByLatAndLng(latitude, longitude);
      },
      fail(res) {
        wx.showModal({
          title: '当前未开启定位权限，是否去授权',
          confirmText: '授权',
          success: function (res) {
            if (res.cancel) {
              wx.showToast({
                title: '拒绝授权',
                icon: 'none',
                duration: 1000
              })
            } else if (res.confirm) {
              _this.openAuth();
            }
          }
        })
        _this.getAreaInfoByLatAndLng(0, 0);
      }
    })
  },
  getAreaInfoByLatAndLng: function (lat, lng) {
    let _this = this;
    let params = {
      latitude: lat,
      longitude: lng
    }
    app.sendRequest({
      url: '/index.php?r=Map/getAreaInfoByLatAndLng',
      method: 'post',
      data: params,
      success: function (res) {
        _this.setData({
          currentLocationData: res.data,
        })
      }
    });
    this.getSelfDeliveryList();
  },
  getLocationByInput(e) {
    let value = e.detail.value;
    this.setData({
      searchValue: value
    });
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      if (!this.data.searchValue) {
        this.setData({
          searchDeliveryList: []
        })
      } else {
        this.getSelfDeliveryList();
      }
    }, 500)
  },
  openAuth() {
    let _this = this;
    wx.openSetting({
      success: function (res) {
        if (res.authSetting["scope.userLocation"] == true) {
          wx.showToast({
            title: '授权成功',
            icon: 'success',
            duration: 1000
          })
          _this.getCurrentLocation()
          return; // 成功则中止-不成功则获取默认列表
        } else {
          wx.showToast({
            title: '授权失败',
            icon: 'none',
            duration: 1000
          })
        }
      }
    })
  },
  changeTabItem(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      currentTab: value
    })
    this.getSelfDeliveryList();
  },
  toggleSearchPageStatus() {
    this.setData({
      deliveryId: '',
      searchPageStatus: !this.data.searchPageStatus,
      searchValue: '',
      searchDeliveryList: []
    })
  },
  clearSearchValue() {
    this.setData({
      searchValue: ''
    })
  }
})