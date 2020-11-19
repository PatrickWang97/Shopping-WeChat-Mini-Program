var app = getApp()
Page({
  data: {
    selectAddressId: '',
    addressList: [],
    address_id: '',
    localAddress: '',
    selectProCityDirs: true,
    selectRegion: [0, 0, 0],
    selectRegionId: [0, 0, 0]
  },
  onLoad: function(options) {
    var that = this;
    this.getArea(0, (res) => {
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
    this.getLocation();
  },
  selectAddress: function(e) {
    let pages = getCurrentPages(),
      prePage = pages[pages.length - 2],
      data = {},
      addressInfo = e.currentTarget.dataset.info;
    app.globalData.takeoutAddressSelected = addressInfo;
    data[this.compid + '.location_address'] = addressInfo.address_info.detailAddress;
    prePage.setData(data)
    app.globalData.takeoutLocate.lat = addressInfo.latitude || '';
    app.globalData.takeoutLocate.lng = addressInfo.longitude || '';
    app.turnBack();
  },
  showProDialog: function() {
    this.setData({
      selectProCityDirs: false,
      regionStr: this.oldRegionStr || ''
    })
    this.region = this.data.selectRegion;
    this.regionid = this.data.selectRegionId;
    this.oldRegionStr = this.data.regionStr;
  },
  changeRegion: function(e) {
    let that = this;
    let province = this.data.province;
    let value = e.detail.value;
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
  getArea: function(id, callBack) {
    app.sendRequest({
      url: '/index.php?r=Region/getRegionList',
      data: {
        pid: id
      },
      success: (res) => {
        res.data = res.data.reverse()
        callBack(res.data);
      }
    })
  },
  hideProCityDirs: function() {
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
  submitRegion: function() {
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
            region = that.data.regionStr.join('');
            break;
        }
        app.sendRequest({
          url: '/index.php?r=Map/suggestion&keyword=',
          data: {
            keyword: region + that.data.searchInput,
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
  getLocation: function() {
    let that = this;
    if (app.globalData.locationInfo.latitude) {
      let location = app.globalData.locationInfo;
      let info = location.info;
      let lacalAddresss = info.formatted_addresses.recommend;
      let region_id;
      if (info.ad_info.district == '梁溪区'){
        region_id = 1132;
      } else if (info.ad_info.district == '莲池区'){
        region_id = 500;
      } else if (info.ad_info.district == '南城街道') {
        region_id = 3625;
      } else if (info.ad_info.district == '那大镇') {
        region_id = 3600;
      } else {
        region_id = info.region_id;
      }
      let selectRegionId = [0, 0, region_id];
      that.oldRegionStr = [info.ad_info.province, info.ad_info.city, info.ad_info.district];
      that.setData({
        regionStr: that.oldRegionStr,
        localAddress: lacalAddresss,
        selectRegionId: selectRegionId
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
            let lacalAddresss = data.data.formatted_addresses.recommend;
            let region_id = (data.data.ad_info.district == '梁溪区') ? 1132 : data.data.region_id;
            let selectRegionId = [0, 0, region_id];
            that.oldRegionStr = [data.data.ad_info.province, data.data.ad_info.city, data.data.ad_info.district];
            that.setData({
              regionStr: that.oldRegionStr,
              localAddress: lacalAddresss,
              selectRegionId: selectRegionId
            })
            that.locateAddress = lacalAddresss;
            that.nearbyAddress({
              lat: res.latitude,
              lng: res.longitude,
              keyword: that.locateAddress
            })
          })
        }
      })
    }
  },
  searchAddress: function(e) {
    let that = this;
    if (e.detail.value.trim() != '') {
      clearTimeout(this.searchFunc);
      this.searchFunc = setTimeout(() => {
        let region = '';
        switch (that.data.regionStr[1]) {
          case '县':
          case '自治区直辖县级行政区划':
          case '省直辖县级行政区划':
            region = that.data.regionStr[0] + that.data.regionStr[2];
            break;
          default:
            region = that.data.regionStr.join('');
            break;
        }
        app.sendRequest({
          url: '/index.php?r=Map/suggestion&keyword=',
          data: {
            keyword: region + e.detail.value,
            region: region
          },
          success: function(res) {
            that.setData({
              searchInput: e.detail.value,
              searchAddress: res.data
            })
          }
        })
      }, 1000)
    } else {
      that.setData({
        searchAddress: []
      })
    }
  },
  nearbyAddress: function(option) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=Map/searchAreaInfo',
      data: {
        keyword: option.keyword,
        boundary: 'nearby(' + option.lat + ',' + option.lng + ',2000)'
      },
      success: (res) => {
        this.setData({
          'nearbyAddress': res.data
        })
      }
    })
  },
  turnBackPage: function(e) {
    let pages = getCurrentPages(),
      prePage = pages[pages.length - 2],
      addressDetail = e.currentTarget.dataset.addressinfo;
    let regionId = this.data.selectRegionId;
    let regionStr = this.data.regionStr;
    prePage.setData({
      "colonelInfo.region_address": regionStr.join(""),
      "colonelInfo.region_id": regionId[2],
      "colonelInfo.address_detail": addressDetail.title,
      "colonelInfo.longitude": addressDetail.location.lng,
      "colonelInfo.latitude": addressDetail.location.lat
    })
    app.turnBack();
  },
})