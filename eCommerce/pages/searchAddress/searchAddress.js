var app = getApp()
Page({
  data: {
    nationId: '',
    selectAddressId: '',
    addressList: [],
    afterInitial: false,
    isFromBack: false,
    from: '',
    fromAddAdress: false,
    address_id: '',
    localAddress: '',
    selectProCityDirs: true,
    nationname: '',
    nationId: '',
    selectRegion: [0, 0, 0],
    selectRegionId: [0, 0, 0],
    latitude: '',
    longitude: '',
    showMap:true,
    show: false,
    handle_nations: ['Japan', 'Singapore'],  // 需要处理的国家
  },
  subShopId: '',
  timer: 0,
  onLoad: function (options) {
    console.log(options);
    var that = this,
    from = options.from,
    locateAddress = options.locateAddress || '',
    pid = options.nationId == '1' ? '0' : options.nationId;
    var newdata = {};
    if (options.nationId !== undefined && options.nationname !== undefined) {
      newdata.nationId = options.nationId;
      newdata.nationname = options.nationname;
    }
    if (options.latitude) {
      newdata.latitude = options.latitude;
      newdata.longitude = options.longitude;
    }
    newdata.from = from;
    newdata.locateAddress = locateAddress;
    this.setData(newdata);
    this.getArea(pid, (res) => {
      let initData = [{
        id: 0,
        name: '请选择',
        city: [{
          id: 0,
          name: '请选择',
          dirstrict: [{
            id: 0,
            name: '请选择'
          }]
        }]
      }]
      initData = initData.concat(res)
      that.setData({
        province: initData
      })
    });
    this.compid = options.compid || '';
    this.locateAddress = locateAddress;
    if (from == 'addAddress') {
      wx.setNavigationBarTitle({
        title: '选择收货地址'
      })
    } else if (from == 'takeout') {
      wx.setNavigationBarTitle({
        title: '选择定位地址'
      })
    } else {
      wx.setNavigationBarTitle({
        title: '搜索地址'
      })
    }
    this.subShopId = options.sub_shop_id || '';
    if (from == 'addAddress' || from == 'TYStandard'){
      this.isInCountry(this.data.nationId);
    }else{
      this.getLocation();
    }
    this.getAddressList(from)
  },
  onShow: function () {
    if (this.data.isFromBack) {
      var that = this;
    } else {
      this.setData({
        isFromBack: true
      })
    };
  },
  isInCountry: function (id, callBack) {
    let that = this;
    app.getLocation({
      success: (res) => {
        if (!res.latitude) {
          that.setData({
            localAddress: '定位失败'
          })
          return;
        }
        app.sendRequest({
          url: '/index.php?r=map/IsInCountry',
          data:{
            nation_id: id,
            longitude: res.longitude,
            latitude: res.latitude
          },
          success: (res) => {
            if(res.data === true){
              that.getLocation();
            }else {
              that.showMap = false;
            }
          }
        })
      }
    })
  },
  getAddressList: function (from) {
    let that = this;
    let takeoutLocate = app.globalData.takeoutLocate;
    let shopInfo = app.globalData.takeoutShopInfo
    let addressList = [];
    let hasInDistance = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/addressList',
      success: (res) => {
        let address = res.data;
        for (var i = 0, j = address.length - 1; i <= j; i++) {
          if (from == 'takeout') {
            address[i].is_distance = app.calculationDistanceByLatLng(shopInfo.latitude, shopInfo.longitude, address[i].latitude, address[i].longitude) < shopInfo.deliver_distance ? 1 : 0;
          }
          if (address[i].latitude == 0) {
            hasInDistance = false;
          }
          addressList.push(address[i]);
        }
        that.setData({
          addressList: addressList,
          from: from,
          hasInDistance: hasInDistance
        })
      }
    })
  },
  selectAddress: function (e) {
    let pages = getCurrentPages(),
      prePage = pages[pages.length - 2],
      data = {},
      addressInfo = e.currentTarget.dataset.info;
    app.globalData.takeoutAddressSelected = addressInfo;
    data[this.compid + '.location_address'] = addressInfo.address_info.detailAddress;
    prePage.setData(data)
    app.globalData.takeoutLocate.lat = addressInfo.latitude || '';
    app.globalData.takeoutLocate.lng = addressInfo.longitude || '';
    app.globalData.takeoutLocate.id = addressInfo.id || '';
    app.globalData.takeoutRefresh = true;
    app.turnBack();
  },
  showProDialog: function () {
    this.setData({
      selectProCityDirs: false,
      regionStr: this.oldRegionStr || ''
    })
    this.region = this.data.selectRegion;
    this.regionid = this.data.selectRegionId;
    this.oldRegionStr = this.data.regionStr;
  },
  changeRegion: function (e) {
    let that = this;
    let province = this.data.province;
    let value = e.detail.value;
    if (value[0] === undefined || value[1] === undefined || value[2] === undefined) { return };
    let splitList = ['1','2','9','32','33'];
    if (splitList.includes(province[value[0]].id)) {
      this.setData({
        hideSecond: true
      })
    }else {
      this.setData({
        hideSecond: false,
      })
    }
    if (!province[value[0]].city) {
      this.getArea(province[value[0]].id, (res) => {
        province[value[0]].city = res;
        that.getArea(province[value[0]].city[0].id, (res) => {
          province[value[0]].city[0].dirstrict = res;
          that.setData({
            province: province,
            selectRegion: [value[0], 0, 0],
            selectRegionId: [province[value[0]].id, province[value[0]].city[0].id, province[value[0]].city[0].dirstrict[0].id],
            regionStr: [province[value[0]].name, province[value[0]].city[0].name, province[value[0]].city[0].dirstrict[0].name]
          })
        })
      })
    } else {
      if (!province[value[0]].city[value[1]].dirstrict) {
        this.getArea(province[value[0]].city[value[1]].id, (res) => {
          province[value[0]].city[value[1]].dirstrict = res;
          that.setData({
            province: province,
            selectRegion: [value[0], value[1], 0],
            selectRegionId: [province[value[0]].id, province[value[0]].city[value[1]].id, province[value[0]].city[value[1]].dirstrict[0].id],
            regionStr: [province[value[0]].name, province[value[0]].city[value[1]].name, province[value[0]].city[value[1]].dirstrict[0].name]
          })
        })
      } else {
        that.setData({
          selectRegion: [value[0], value[1], value[2]],
          selectRegionId: [province[value[0]].id, province[value[0]].city[value[1]].id, province[value[0]].city[value[1]].dirstrict[value[2]].id],
          regionStr: [province[value[0]].name, province[value[0]].city[value[1]].name, province[value[0]].city[value[1]].dirstrict[value[2]].name]
        })
      }
    }
  },
  getArea: function (id, callBack) {
    var nationId = this.data.nationId;
    app.sendRequest({
      url: '/index.php?r=Region/getRegionList',
      data: {
        country_region_id: nationId,
        pid: id
      },
      success: (res) => {
        res.data = res.data.reverse();
        callBack(res.data);
      }
    })
  },
  hideProCityDirs: function () {
    wx.showLoading({
      title: '请稍等...'
    })
    setTimeout(() => {
      wx.hideLoading()
      this.setData({
        selectRegionId: this.regionid,
        selectProCityDirs: true,
        regionStr: this.oldRegionStr || ""
      })
    }, 1000);
  },
  submitRegion: function () {
    wx.showLoading({
      title: '请稍等...'
    })
    let that = this;
    setTimeout(() => {
      wx.hideLoading()
      that.setData({
        selectProCityDirs: true
      })
      that.oldRegionStr = that.data.regionStr
      if (that.data.searchInput) {
        let region = '';
        switch (that.data.regionStr[1]) {
          case '县':
          case '自治区直辖县级行政区划':
          case '省直辖县级行政区划':
            region = that.data.regionStr[0] + that.data.regionStr[2];
            break;
          default:
            let regionAry = [];
            that.data.regionStr.forEach(item => {
              if (regionAry.indexOf(item) < 0) {
                regionAry[regionAry.length] = item;
              }
            })
            region = regionAry.join(' ');
            break;
        }
        app.sendRequest({
          url: '/index.php?r=Map/suggestion&keyword=',
          data: {
            country_region_id: that.data.nationId,
            keyword: region + ' ' + that.data.searchInput,
            region: region
          },
          success: (res) => {
            that.setData({
              searchInput: that.data.searchInput,
              searchAddress: res.data
            })
          }
        })
      }
    }, 1000)
  },
  getLocation: function () {
    let that = this;
    let selectRegionId = that.data.selectRegionId;
    let province = that.data.province;
    if (app.globalData.locationInfo.latitude) {
      let location = app.globalData.locationInfo;
      let info = location.info;
      let lacalAddresss = info.formatted_addresses ? info.formatted_addresses.recommend : info.address;
      that.oldRegionStr = [info.ad_info.province, info.ad_info.city, info.ad_info.district];
      getRegionId();
      that.setData({
        regionStr: info.formatted_addresses ? that.oldRegionStr : [info.address_component.nation,info.address_component.ad_level_3],
        localLatLng: info,
        localAddress: lacalAddresss,
        latitude: location.latitude,
        longitude: location.longitude,
        markers: [{
          latitude: location.latitude,
          longitude: location.longitude,
          iconPath: '/images/circle.png',
          width: 20,
          height: 20
        },{
            latitude: location.latitude,
            longitude: location.longitude,
            iconPath: '/images/location.png',
          width: 20,
          height: 30
        }]
      })
      that.locateAddress = lacalAddresss;
      that.nearbyAddress({
        lat: location.latitude,
        lng: location.longitude,
        keyword: lacalAddresss
      })
    } else {
      app.getLocation({
        success: (res) => {
          if (!res.latitude) {
            that.setData({
              localAddress: '定位失败'
            })
            return;
          }
          app.getAddressByLatLng({
            lat: res.latitude,
            lng: res.longitude
          }, (data) => {
            let lacalAddresss = data.data.formatted_addresses ? data.data.formatted_addresses.recommend : data.data.address;
            that.oldRegionStr = [data.data.ad_info.province, data.data.ad_info.city, data.data.ad_info.district];
            getRegionId();
            that.setData({
              regionStr: that.oldRegionStr,
              localLatLng: data.data,
              localAddress: lacalAddresss,
              latitude: res.latitude,
              longitude: res.longitude,
              markers: [{
                latitude: res.latitude,
                longitude: res.longitude,
                iconPath: '/images/circle.png',
                width: 20,
                height: 20
              }, {
                  latitude: res.latitude,
                  longitude: res.longitude,
                  iconPath: '/images/location.png',
                  width: 20,
                  height: 30
                }]
            })
            that.locateAddress = lacalAddresss;
            that.nearbyAddress({
              lat: res.latitude,
              lng: res.longitude,
              keyword: that.locateAddress
            })
            app.setLocationInfo({
              latitude: res.latitude,
              longitude: res.longitude,
              address: data.data.formatted_addresses ? data.data.formatted_addresses.recommend : data.data.address,
              info: data.data
            });
          })
        },
        fail: (res) => {
          console.log(res);
        }
      })
    }
    function getRegionId () {
      province.forEach(item=> { 
        if (item.name == that.oldRegionStr[0]) {
          selectRegionId[0] = item.id;
          if (selectRegionId[0] > 0) {
            that.getArea(selectRegionId[0],function(itemData) {
              if(that.oldRegionStr[1] === "万宁市"){
                that.oldRegionStr[1] = "省直辖县级行政区划";
              }
              itemData.forEach(subItem=> {
                if (subItem.name == that.oldRegionStr[1]) {
                  selectRegionId[1] = subItem.id;
                  if (selectRegionId[1] > 0) {
                    that.getArea(selectRegionId[1],function(childData) {
                      childData.forEach(childItem=> {
                        if (childItem.name == that.oldRegionStr[2]) {
                          selectRegionId[2] = childItem.id;
                          that.setData({
                            selectRegionId,
                          })
                        }
                      })
                    })
                  }else {
                    that.setData({
                      selectRegionId
                    })
                  }
                }
              })
            })
          }else {
            that.setData(
              selectRegionId,
            )
          }
        }
      })
    }
  },
  searchAddress: function (e) {
    let that = this;
    if (e.detail.value.trim() != '') {
      clearTimeout(this.searchFunc);
      this.searchFunc = setTimeout(() => {
        if ((that.data.regionStr === undefined) ||(!that.data.regionStr[1] && !that.data.regionStr[2]) || (that.data.regionStr[1] == '请选择' && that.data.regionStr[2] == '请选择')) {
          app.showModal({
            content: '请先选择地区，再输入地址',
            confirmText: '好的',
            confirmColor: '#3091F2',
          })
          return;
        }
        let region = '';
        switch (that.data.regionStr[1]) {
          case '县':
          case '自治区直辖县级行政区划':
          case '省直辖县级行政区划':
            region = that.data.regionStr[0] + that.data.regionStr[2];
            break;
          default:
            let regionAry = [];
            that.data.regionStr.forEach(item => {
              if (regionAry.indexOf(item) < 0) {
                regionAry[regionAry.length] = item;
              }
            })
            region = regionAry.join(' ');
            break;
        }
        app.sendRequest({
          url: '/index.php?r=Map/suggestion&keyword=',
          data: {
            country_region_id: that.data.nationId,
            keyword: region + ' ' + e.detail.value,
            region: region
          },
          success: function (res) {
            that.setData({
              searchInput: e.detail.value,
              searchAddress: res.data,
              showMap:false
            })
          }
        })
      }, 1000)
    } else {
      that.setData({
        searchAddress: [],
        showMap:true
      })
    }
  },
  relocate: function (e) {
    let that = this;
    this.setData({
      localAddress: ''
    })
    app.getLocation({
      success: (res) => {
        app.getAddressByLatLng({
          lat: res.latitude,
          lng: res.longitude
        }, (data) => {
          let lacalAddresss = data.data.formatted_addresses ?  data.data.formatted_addresses.recommend : data.data.address
          that.setData({
            localLatLng: data.data,
            localAddress: lacalAddresss
          })
          that.nearbyAddress({
            lat: res.latitude,
            lng: res.longitude,
            keyword: lacalAddresss
          });
          app.setLocationInfo({
            latitude: res.latitude,
            longitude: res.longitude,
            address: data.data.formatted_addresses ? data.data.formatted_addresses.recommend : data.data.address,
            info: data.data
          });
        })
      }
    })
  },
  selectTakeoutRelocate: function (e) {
    let info = e.currentTarget.dataset.info
    app.globalData.takeoutLocate = {
      lat: info.latitude,
      lng: info.longitude
    }
    app.globalData.takeoutRefresh = true;
    app.turnBack();
  },
  turnBackPageByLoacl: function (e) {
    app.globalData.takeoutAddressSelected = '';
    let pages = getCurrentPages(),
        prePage = pages[pages.length - 2],
        data = {},
        addressDetail = e.currentTarget.dataset.addressinfo;
        data[this.compid + '.location_address'] = addressDetail.formatted_addresses ? addressDetail.formatted_addresses.recommend : addressDetail.address
    prePage.setData(data)
    app.globalData.takeoutLocate.lat = addressDetail.location.lat;
    app.globalData.takeoutLocate.lng = addressDetail.location.lng;
    app.globalData.takeoutRefresh = true;
    app.turnBack();
  },
  turnBackPage: function (e) {
    app.globalData.takeoutAddressSelected = '';
    let pages = getCurrentPages(),
        prePage = pages[pages.length - 2],
        type = e.currentTarget.dataset.type,
        addressDetail = e.currentTarget.dataset.addressinfo;
    let regionId = this.data.selectRegionId;
    let handle_nations = this.data.handle_nations;
    let {
      regionStr,
      nationId,
      nationname
    } = this.data;
    let address_info = prePage.data.address_info;
    let default_address = {
      name: address_info.name,
      contact: address_info.contact,
      detailAddress: address_info.detailAddress,
      sex: address_info.sex,
      label: address_info.label,
      province: {}
    }
    if ((this.data.from == 'addAddress' || this.data.from == 'TYStandard')  && type == 'search'){
      let addressInfo = addressDetail;
      let province = regionStr[0];
      let city = regionStr[1];
      let district = regionStr[2];
      if (nationname != '中国') {
        district = '';
      }
      if (handle_nations.indexOf(nationname) > -1) {
        city = '';
      }
      let addressText = new Set([
        province,
        city,
        district
      ]);
      prePage.setData({
        'chooseGAT': false,
        'address_info.country.id': nationId,
        'address_info.province.id': regionId[0],
        'address_info.city.id': regionId[1],
        'address_info.district.id': regionId[2],
        'address_info.country.text': nationname,
        'address_info.province.text': province,
        'address_info.city.text': city,
        'address_info.district.text': district,
        'address_info.detailAddress': addressInfo.title || '',
        'address_info.regionInfoText': [...addressText].join('') || province + city + district,
        'address_info.address': addressInfo.address,
        'latitude': addressInfo.location.lat,
        'longitude': addressInfo.location.lng
      })
      if (province == '香港特别行政区' || province == '澳门特别行政区' || province == '台湾省') {
        prePage.setData({
          'chooseGAT': true,
          'oldAddress.CN': default_address,
        })
      }else {
        prePage.setData({
          'oldAddress.GAT': default_address,
        })
      }
    } else if ((this.data.from == 'addAddress' || this.data.from == 'TYStandard')  && type == 'nearby'){
      let { province, city, district} = addressDetail.ad_info;
      let addressText = new Set([
        province,
        city,
        district
      ]);
      if (nationname != '中国') {
        district = '';
      }
      if (handle_nations.indexOf(nationname) > -1) {
        city = '';
      }
      prePage.setData({
        'chooseGAT': false,
        'address_info.country.id': this.data.nationId,
        'address_info.province.text': province,
        'address_info.city.text': city,
        'address_info.district.text': district,
        'address_info.detailAddress': addressDetail.title,
        'address_info.regionInfoText': [...addressText].join('') || province + city + district,
        'address_info.address': addressDetail.address,
        'latitude': addressDetail.location.lat,
        'longitude': addressDetail.location.lng
      })
      if (province == '香港特别行政区' || province == '澳门特别行政区' || province == '台湾省') {
        prePage.setData({
          'chooseGAT': true,
          'oldAddress.CN': default_address,
        })
      }else {
        prePage.setData({
          'oldAddress.GAT': default_address,
        })
      }
      let provinceList = this.data.province;
      provinceList.forEach(item => {
        if (item.name == province && item.id > 0) {
          regionId[0] = item.id;
          this.getArea(item.id, (itemData) => {
            itemData.forEach(subItem => {
              if (subItem.name == city && subItem.id > 0) {
                regionId[1] = subItem.id;
                this.getArea(subItem.id, (subItemData) => {
                  subItemData.forEach(childItem => {
                    if (childItem.name == district && childItem.id > 0) {
                      regionId[2] = childItem.id;
                      prePage.setData({
                        'address_info.province.id':  regionId[0],
                        'address_info.city.id':  regionId[1],
                        'address_info.district.id':  regionId[2],
                      })
                      app.globalData.takeoutRefresh = true;
                      prePage.selectAddressBack = true;
                      prePage.location = addressDetail.location;
                      app.turnBack();
                    }
                  })
                })
              }
            })
          })
        }
      })
      return;
    } else if (this.data.from == 'takeout'){
      let data = {};
      data[this.compid + '.location_address'] = addressDetail.title;
      prePage.setData(data)
      app.globalData.takeoutLocate.lat = addressDetail.location.lat;
      app.globalData.takeoutLocate.lng = addressDetail.location.lng;
    } else if (this.data.from == 'franchisee' && this.compid) {
      let {
        location,
        address
      } = e.currentTarget.dataset.addressinfo;
      let franchiseeCompid = this.compid;
      prePage.setData({
        [franchiseeCompid + '.location_address']: address,
        [franchiseeCompid + '.param.latitude']: location.lat,
        [franchiseeCompid + '.param.longitude']: location.lng
      });
      app.globalData.locationInfo.address = address;
      app.globalData.locationInfo.latitude = location.lat;
      app.globalData.locationInfo.longitude = location.lng;
      app.globalData.franchiseeListCompsRefresh = true;
    }
    app.globalData.takeoutRefresh = true;
    prePage.selectAddressBack = true;
    prePage.location = addressDetail.location;
    app.turnBack();
  },
  nearbyAddress: function (option) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=Map/searchAreaInfo',
      data: {
        country_region_id: that.data.nationId,
        keyword: option.keyword,
        boundary: 'nearby('+option.lat+','+option.lng+',2000)'
      },
      success: (res) => {
        this.setData({
          'nearbyAddress': res.data || [],
          showMap: true,
          show: true
        })
      }
    })
  },
  regionchange(e) {
    if (e.type == 'end' && (e.causedBy == 'scale' || e.causedBy == 'drag')) {
      clearTimeout(this.timer);
      let that = this;
      let markers = this.data.markers;
      this.mapCtx = wx.createMapContext("map");
      this.mapCtx.getCenterLocation({
        type: 'gcj02',
        success: function (res) {
          console.log(res);
          markers[1] = {
            latitude: res.latitude,
            longitude: res.longitude,
            iconPath: '/images/location.png',
            width: 20,
            height: 30
          }
          that.setData({
            latitude: res.latitude,
            longitude: res.longitude,
            circles: [{
              latitude: res.latitude,
              longitude: res.longitude,
              color: '#FF0000DD',
              fillColor: '#d1edff88',
              radius: 300,//定位点半径
              strokeWidth: 1
            }],
            markers: markers
          })
          that.timer = setTimeout(() => {
            app.sendRequest({
              url: '/index.php?r=Map/getAreaInfoByLatAndLng',
              data: {
                latitude: res.latitude,
                longitude: res.longitude
              },
              success: (result) => {
                that.nearbyAddress({
                  keyword: result.data.formatted_addresses.recommend,
                  lat: res.latitude,
                  lng: res.longitude
                })
              }
            })
          },500);
        }
      })
    }
  },
  addNewAddress: function() {
    let pages = getCurrentPages(),
        prePage = pages[pages.length - 2];
    let nationname = this.data.nationname;
    let handle_nations = this.data.handle_nations;
    let regionStr = this.data.regionStr;
    let province = regionStr[0];
    let city = regionStr[1];
    let district = regionStr[2];
    if (nationname != '中国') {
      district = '';
    }
    if (handle_nations.indexOf(nationname) > -1) {
      city = '';
    }
    prePage.setData({
      'address_info.country.text': nationname,
      'address_info.country.id': this.data.nationId,
      'address_info.province.text': province,
      'address_info.city.text': city,
      'address_info.district.text': district,
      'address_info.regionInfoText': province + city + district,
      'detailAddress': '',
      'address_info.detailAddress': ''
    })
    app.turnBack();
  },
  reset: function() {
    let markers = this.data.markers;
    let that = this;
    markers[1].latitude = this.data.markers[0].latitude;
    markers[1].longitude = this.data.markers[0].longitude;
    this.setData({
      markers: markers,
      latitude: that.data.markers[0].latitude,
      longitude: that.data.markers[0].longitude
    })
    app.sendRequest({
      url: '/index.php?r=Map/getAreaInfoByLatAndLng',
      data: {
        latitude: that.data.markers[0].latitude,
        longitude: that.data.markers[0].longitude
      },
      success: (result) => {
        that.nearbyAddress({
          keyword: result.data.formatted_addresses.recommend,
          lat: that.data.markers[0].latitude,
          lng: that.data.markers[0].longitude
        })
      }
    })
  }
})
