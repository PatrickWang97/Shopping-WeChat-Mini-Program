var app = getApp()
Page({
  data: {
    selectAddressId: '',
    orderId: '',
    addressList: [],
    afterInitial: false,
    isFromBack: false,
    from: '',
    fromAddAdress: false,
    showNewAddressDialog: true,
    address_id: '',
    changeLocal: 0,
    localAddress: '',
    selectProCityDirs: true
  },
  subShopId: '',
  onLoad: function(options){
    let selectAddressId = options.id || '',
        orderId = options.oid || '',
        preTakeout = options.preTakeout || '',
        locateAddress = options.locateAddress || '',
        localLatLng = app.globalData.takeoutAddressInfoByLatLng || '',
        from = options.from || '';
    this.syncUserAddress = options.syncUserAddress || '';
    this.locateAddress = locateAddress;
    this.setData({
      orderId: orderId,
      preTakeout: preTakeout,
      localAddress: locateAddress,
      localLatLng: localLatLng,
      from: from
    })
    this.selectAddressId = selectAddressId;
    this.from = from;
    this.subShopId = options.sub_shop_id || '';
    this.getAppECStoreConfig();
    this.getAddressList(selectAddressId, orderId, from)
  },
  onShow: function(){
    if(this.data.isFromBack){
      this.getAddressList(this.selectAddressId, this.data.orderId, this.from)
    } else {
      this.setData({
        isFromBack: true
      })
    };
  },
  getAddressList: function (selectAddressId, orderId, from){
    let that = this;
    let shopInfo = app.globalData.takeoutShopInfo
    let addressList = [];
    let hasInDistance = true;
    app.sendRequest({
      url: '/index.php?r=AppShop/addressList',
      success: function(res){
        let address = res.data;
        for(var i = 0, j = address.length-1 ; i <= j; i++){
          if (from == 'previewtakeout') {
            address[i].is_distance = app.calculationDistanceByLatLng(shopInfo.latitude, shopInfo.longitude, address[i].latitude, address[i].longitude) < shopInfo.deliver_distance ? 1 : 0;
          }
          if (address[i].is_distance == 0) {
            hasInDistance = false;
          }
          var addressInfo = address[i].address_info;
          var addressAry = [
            addressInfo.province && addressInfo.province.text || '',
            addressInfo.city && addressInfo.city.text || '',
            addressInfo.district && addressInfo.district.text || ''
          ];
          var joinStr = '';
          if (+addressInfo.country.id !== 1) {
            if (addressAry[1] === addressAry[2] || addressAry[2] === '') {
              addressAry.pop();
            }
            joinStr = ' ';
          }
          addressAry.push(addressInfo.detailAddress || '');
          addressInfo.addressString = [...new Set(addressAry)].join(joinStr);
          addressList.push(address[i]);
        }
        if (selectAddressId || orderId || from) {
          that.setData({
            addressList: addressList,
            selectAddressId: selectAddressId || '',
            orderId: orderId || '',
              from: from,
              hasInDistance: hasInDistance
          })
        }else{
          that.setData({
            addressList: addressList,
            hasInDistance: hasInDistance
          })
        }
      }
    })
  },
  deleteAddress: function(e){
    var that = this,
        deleteId = e.target.dataset.id;
    app.showModal({
      content: '确定要删除地址？',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      confirm: function(){
        app.sendRequest({
          url: '/index.php?r=AppShop/delAddress',
          data: {
            address_id: deleteId
          },
          success: function(res){
            var addressList = that.data.addressList;
            for (var i = 0; i <= addressList.length - 1; i++) {
              if(addressList[i].id == deleteId){
                addressList.splice(i, 1);
              }
            }
            that.setData({
              addressList: addressList
            })
          }
        })
      }
    })
  },
  addNewAddress:function(){
    app.turnToPage('/eCommerce/pages/addAddress/addAddress');
  },
  addWechatAddress: function(){
    let _this = this;
    app.chooseAddress({ 
      success: function (res) {
        app.sendRequest({
          method: 'post',
          url: '/index.php?r=AppShop/AddWxAddress',
          data: {
            detailInfo: res.detailInfo || '',
            cityName: res.cityName || '',
            provinceName: res.provinceName || '',
            UserName: res.userName || '',
            telNumber: res.telNumber || '',
            district: res.district || '',
            countyName: res.countyName || ''
          },
          success: function () {
            let pages = getCurrentPages();
            let currPage = null;
            if (pages.length) {
              currPage = pages[pages.length - 2];
            }
            let route = currPage.route
            console.log(route)
            if (route == 'eCommerce/pages/previewGoodsOrder/previewGoodsOrder' || route == 'eCommerce/pages/goodsSameJourney/goodsSameJourney') {
              app.sendRequest({
                url: '/index.php?r=AppShop/addressList',
                success: function (res) {
                  let addressInfo = res.data[0].address_info;
                  let addressId = res.data[0].id;
                  currPage.setData({
                    selectAddress: addressInfo,
                    selectAddressId: addressId
                  });
                  typeof currPage.selectAddressCallback === 'function' && currPage.selectAddressCallback(addressInfo);
                  if (route == 'eCommerce/pages/previewGoodsOrder/previewGoodsOrder') {
                    app.turnBack();
                  } else {
                    wx.navigateBack({
                      delta: 2
                    })
                  }
                }
              })
              return
            }
            _this.getAddressList(undefined, undefined, _this.data.from)
          }
        })
      }
    })
  },
  selectAddress: function(e){
    var addressId = e.currentTarget.dataset.id,
        that = this, 
        pages = getCurrentPages(),
        prePage = pages[pages.length - 2],
        addressList = this.data.addressList;
    this.setData({
      selectAddressId: addressId || ''
    })
    for (var i = addressList.length - 1; i >= 0; i--) {
      if(addressList[i].id == addressId){
        prePage.setData({
          selectAddress: addressList[i],
          selectAddressId: addressList[i].id
        });
        typeof prePage.selectAddressCallback === 'function' && prePage.selectAddressCallback(addressList[i]);
      }
    };
    let page = getCurrentPages();
    app.turnBack();
  },
  changeFreightWay:function(){
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/ChangeOrder',
      data: {
        order_id: _this.data.orderId || '',
        sub_shop_app_id: _this.subShopId
      },
      success: function (res) {
        let url = '/pages/orderDetail/orderDetail?detail=' + res.data[0].form_data.order_id +'&franchisee=' + _this.subShopId;
        app.turnToPage(url, true);
      }
    });
  },
  editAddress: function(e){
    let dataset = e.currentTarget.dataset;
    let addressId = dataset.id;
    let countryId = dataset.countryId;
    app.turnToPage('/eCommerce/pages/addAddress/addAddress?id='+addressId+'&countryId='+countryId);
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    }, this.subShopId);
  },
})
