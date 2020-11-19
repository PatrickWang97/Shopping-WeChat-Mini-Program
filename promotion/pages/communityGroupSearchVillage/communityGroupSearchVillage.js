var app = getApp()
Page({
  data: {
    selectAddressId: '',
    addressList: [], //  附近自提点
    localAddress: '', //  当前定位地址
    regionStr: [],
    latitude: '',
    longitude: '',
    searchAddress: [],
    nowCommunityCity: '',
    inputValue: '',       // 搜索文字
    autoFocus: false,       // 聚焦
  },
  currentUserToken: '',
  page: 1,
  isMore: 1,
  onLoad: function (options) {
    let prePage = getCurrentPages()[getCurrentPages().length - 2];
    this.compId = options.compId;
    this.currentUserToken = prePage.data[this.compId].leaderInfo.user_token;
    this.getLocation();
  },
  initData: function () {
    let _this = this;
    if(!this.data.nowCommunityCity){
      this.nowCommunityGroup();
    }
    this.getDistributorExtList().then((res) => {
      if (!res.data.length) return;
      for (let item of res.data) {
        if(item.distance){
          if (item.distance >= 1000.00) {
            item.distance = (item.distance / 1000).toFixed(1) + 'KM';
          } else {
            item.distance = parseInt(item.distance) + 'M';
          }
        }
      }
      let data = [..._this.data.addressList, ...res.data];
      let index = data.findIndex((item) => {
        return item.user_token == _this.currentUserToken;
      })
      if (index >= 0) {
        data.splice(index, 1);
      }
      _this.isMore = res.is_more;
      _this.setData({
        addressList: data
      })
    })
  },
  nowCommunityGroup: function (nickname) {
    this.getDistributorExtList({userToken:this.currentUserToken,nickname:nickname}).then((res) => {
      let userInfo = res.data.length ? res.data[0] : '';
      if (userInfo && userInfo.distance) {
        if (userInfo.distance >= 1000.00) {
          userInfo.distance = (userInfo.distance / 1000).toFixed(1) + 'KM';
        } else {
          userInfo.distance = parseInt(userInfo.distance) + 'M';
        }
      }
      this.setData({
        nowCommunityCity: userInfo
      })
    });
  },
  getDistributorExtList: function(data){
    let userToken = data && data.userToken;
    let nickname = data && data.nickname;
    let param;
    if (userToken){
      param = {
        latitude: this.data.latitude,
        longitude: this.data.longitude,
        leader_token: userToken,
        with_distributor: 1
      }
    }else{
      param = {
        latitude: this.data.latitude,
        longitude: this.data.longitude,
        page: this.page,
        is_audit: 1,
        filter_deleted: 1,
        with_distributor: 1
      }
    }
    if (nickname) {
      param.nick_name = nickname;
    }
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppDistributionExt/GetDistributorExtList',
        method: 'post',
        data: param,
        success: function (res) {
          resolve(res);
        }
      })
    })
  },
  getLocation: function () {
    let _this = this;
    let location = app.globalData.locationInfo;
    if (location.latitude) {
      _this.setGlobalLocationInfo(location.latitude, location.longitude);
    } else {
      app.getLocation({
        success: (res) => {
          if (!res.latitude) {
            _this.setData({
              localAddress: '定位失败'
            })
            return;
          }
          _this.setGlobalLocationInfo(res.latitude, res.longitude);
        },
        fail: () => {
          _this.initData();
        }
      })
    }
  },
  changeLocation: function () {
    let _this = this;
    app.chooseLocation({
      success: function (res) {
        _this.setData({
          latitude: res.latitude,
          longitude: res.longitude,
          searchAddress: []
        })
        _this.setGlobalLocationInfo(res.latitude, res.longitude);
      }
    })
  },
  setGlobalLocationInfo: function (latitude, longitude, callback) {
    let _this = this;
    _this.page = 1;
    app.getAddressByLatLng({
      lat: latitude,
      lng: longitude
    }, (data) => {
      let lacalAddresss = data.data.address;
      let oldRegionStr = [data.data.ad_info.province, data.data.ad_info.city, data.data.ad_info.district];
      _this.setData({
        regionStr: oldRegionStr,
        localAddress: lacalAddresss,
        latitude: latitude,
        longitude: longitude
      });
      app.setLocationInfo({
        latitude: latitude,
        longitude: longitude,
        address: data.data.formatted_addresses.recommend,
        info: data.data
      });
      if (typeof callback == 'function') {
        callback && callback();
      } else {
        _this.setData({
          addressList: []
        })
        _this.initData();
      }
    })
  },
  changeHomeCommunity: function (e) {
    let data = {};
    let pages = getCurrentPages();
    let prePage = pages[pages.length - 2];
    let addressList = this.data.addressList;
    let index = e.currentTarget.dataset.index;
    data[this.compId + '.leaderInfo'] = addressList[index];
    data[this.compId + '.refreshList'] = true;
    app.globalData.groupRefreshList = true;
    app.globalData.leaderInfo = addressList[index];
    prePage.setData(data);
    this.distributorGroupLeaderLocking(addressList[index].user_token);
    this.clearCart();
  },
  userCenterTurnToPage: function (e) {
    app.userCenterTurnToPage(e);
  },
  onReachBottom: function(){
    if(!this.isMore){return};
    this.page++;
    this.initData();
  },
  turnBack: function(){
    app.turnBack();
  },
  clearCart: function(){
    app.sendRequest({
      url: '/index.php?r=AppShop/DeleteAllCart',
      data: {
        is_dis_group: 1
      },
      success: function (res) {
        app.turnBack();
      }
    })
  },
  distributorGroupLeaderLocking(user_token){
    app.sendRequest({
      url: '/index.php?r=AppDistributionExt/distributorGroupLeaderLocking',
      data: {
        leader_token: user_token
      }
    })
  },
  searchTimeId: 0,
  searchInputing: function(e) {
    let inputValue = e.detail.value;
    clearTimeout(this.searchTimeId);
    this.searchTimeId = setTimeout(() => {
      this.setData({
        inputValue,
      })
    }, 300);
  },
  searchLeaderFn: function(event) {
    let _this = this;
    let nickname = event.detail.value.trim();
    this.setData({
      nowCommunityCity: '',
      addressList: [],
      autoFocus: false
    })
    this.getDistributorExtList({nickname}).then((res)=>{
      for (let item of res.data) {
        if (item.distance >= 1000.00) {
          item.distance = (item.distance / 1000).toFixed(1) + 'KM';
        } else {
          item.distance = parseInt(item.distance) + 'M';
        }
      }
      let data = [..._this.data.addressList, ...res.data];
      let index = data.findIndex((item) => {
        return item.user_token == _this.currentUserToken;
      })
      if (index >= 0) {
        data.splice(index, 1);
      }
      _this.isMore = res.is_more;
      _this.setData({
        addressList: data
      })
      _this.nowCommunityGroup(nickname);
    });
  },
  clearInputText: function() {
    setTimeout(() => {
      this.setData({
        inputValue: '',
        autoFocus: true
      })
    });
  },
})
