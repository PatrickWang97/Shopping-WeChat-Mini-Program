var app = getApp()
Page({
  data: {
    areaCodeArr: [{    //区号
      title: '中国大陆 +86',
      value: 0
    },{
      title: '中国澳门 +853',
      value: 1
    },{
      title: '中国香港 +852',
      value: 2
    }, {
      title: '中国台湾 +886',
      value: 3
    }],
    overseasMap: {
      89: {
        areaName: 'Canada +1',
        areaCode: '1+'
      },
      233: {
        areaName: 'Malaysia +60',
        areaCode: '60+'
      },
      266: {
        areaName: 'Singapore +65',
        areaCode: '65+'
      },
      298: {
        areaName: 'Japan +81',
        areaCode: '81+'
      },
      468: {
        areaName: 'Commonwealth of Australia +61',
        areaCode: '61+'
      }
    },
    areaCodeIndex: 0,
    nationListMap: [], // 国家列表字典
    nationSelectedIndex: 0, // 当前展示的国家索引下标
    nationList: [], // 国家名称列表
    nationId: 1, // 国家海外地图id (oversea_region_id)
    nationname: '', // 当前展示的国家名称
    regionInfoText: '', // 显示地区字符
    addressId: '',
    orderId: '',
    detail: '',
    selectAddressId: '',
    isFromBack: false,
    from: '',
    showNewAddressDialog: true,
    address_id: '',
    localAddress: '',
    address_info: {
      name: '',
      contact: '',
      country: {
        text: '',
        id: ''
      },
      province: {
        text: '',
        id: ''
      },
      city: {
        text: '',
        id: ''
      },
      district: {
        text: '',
        id: ''
      },
      detailAddress: '',
      sex: 1,
      label: 3,
    },
    selectRegion: [0, 0, 0],
    selectRegionId: [0, 0, 0],
    detailAddress: '',
    showIntelligentAddress: false,
    isDefault: false,
    chooseTips: '选择省份/地区',
    chooseGAT: false,   // 是否选择港澳台
    showAddressType: 'province',
    provinceList: [],
    cityList: [],
    districtList: [],
    oldAddress: {
      GAT: {},
      CN: {}
    },
  },
  selectAddressBack: false,
  onLoad: function(options){
    var newData = {};
    var id = options.id || '';
    newData.addressId = id;
    var orderId = options.oid || '';
    newData.orderId = orderId;
    var countryId = options.countryId || false;
    if (countryId !== false) { newData.nationId = countryId; };
    if (id) { app.setPageTitle('编辑收货地址')};
    this.setData(newData);
    this.dataInitial();
  },
  onShow: function(){
    if (this.selectAddressBack){
      this.refreshAddress();
      this.getAllPickUpConfig();
    }
    this.data.detailAddress = this.data.address_info.detailAddress;
  },
  dataInitial: function(){
    this.getAppECStoreConfig();
    let id = this.data.addressId;
    this.getNationList(id);
  },
  getNationList: function (id) {
    var _this = this;
    app.sendRequest({
      url: '/index.php?r=Region/getNationList',
      data: {
        page: 1,
        page_size: 1000
      },
      success: res => {
        let nationListMap = res.data.reverse();
        let overseasMap = {};
        nationListMap.map(v => {
          overseasMap[v.oversea_region_id] = {
            areaName: `${v.nation_name} ${v.phone_area_code || ''}`,
            areaCode: v.phone_area_code || ''
          }
        })
        let nationList = nationListMap.map(it => it.nation_name);
        let nationSelectedIndex = nationListMap.findIndex(it => it.oversea_region_id == (_this.data.addressId ? _this.data.nationId : res.config.country_region_id));
        let defaultNation = nationListMap[(~nationSelectedIndex ? nationSelectedIndex : 0)];
        _this.setData({
          nationListMap,
          nationList,
          overseasMap,
          nationSelectedIndex,
          nationId: defaultNation.oversea_region_id,
          nationname: defaultNation.nation_name
        });
        if(id){
          _this.getAddressDetail(id);
        }else {
          _this.getArea();
        }
      }
    })
  },
  getAllPickUpConfig: function(){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppEcommerce/GetAllPickUpConfig',
      data: {
        latitude: _this.location.lat,
        longitude: _this.location.lng
       },
      success: function (res) {
        _this.setData({
          suportExpress: res.data.config_data.express,
          suportSameCity: res.data.config_data.intra_city,
          suportSelfDelivery: res.data.config_data.is_self_delivery
        })
      }
    });
  },
  getAddressDetail: function(id){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAddressById',
      data: { address_id: id },
      success: function(res){
        var data = res.data;
        var addressInfo = data.address_info;
        var regionAry = [
            addressInfo.province && addressInfo.province.text || '',
            addressInfo.city && addressInfo.city.text || '',
            addressInfo.district && addressInfo.district.text || ''
          ],
          joinStr = '';
        let areaCodeIndex = 0;
        let contact = addressInfo.contact || data.telphone;
        if (contact.indexOf('853+') === 0 || contact.indexOf('853-') === 0) {
          contact = contact.substring(4);
          areaCodeIndex = '1';
        } else if (contact.indexOf('852+') === 0 || contact.indexOf('852-') === 0) {
          contact = contact.substring(4);
          areaCodeIndex = '2';
        } else if (contact.indexOf('886+') === 0 || contact.indexOf('886-') === 0) {
          contact = contact.substring(4);
          areaCodeIndex = '3';
        } else if (contact.indexOf('1+') === 0 || contact.indexOf('1-') === 0) { // 加拿大
          contact = contact.substring(2);
        } else if (contact.indexOf('60+') === 0 || contact.indexOf('60-') === 0) { // 马来西亚
          contact = contact.substring(3);
        } else if (contact.indexOf('81+') === 0 || contact.indexOf('81-') === 0) { // 日本
          contact = contact.substring(3);
        } else if (contact.indexOf('65+') === 0 || contact.indexOf('65-') === 0) { // 新加坡
          contact = contact.substring(3);
        } else if (contact.indexOf('61+') === 0 || contact.indexOf('61-') === 0) { // 澳大利亚
          contact = contact.substring(3);
        }
        if (regionAry[1] === regionAry[2] || regionAry[2] === '') {
          regionAry.pop();
        }
        if (data.address_info.country && data.address_info.country.id != 1) {
          joinStr = ' ';
        }
        that.data.detailAddress = addressInfo.detailAddress;
        that.setData({
          areaCodeIndex: areaCodeIndex,
          'address_info.name': addressInfo.name,
          'address_info.contact': contact,
          'address_info.country': addressInfo.country || {'text': '','id': ''},
          'nationId': addressInfo.country ? addressInfo.country.id || 1 : 1,
          'address_info.province': addressInfo.province || { 'text': '', 'id': '' },
          'address_info.city': addressInfo.city || {'text':'','id':''},
          'address_info.district': addressInfo.district || { 'text': '', 'id': '' },
          'address_info.detailAddress': addressInfo.detailAddress || data.detail_address,
          'address_info.sex': addressInfo.sex || 2,
          'address_info.label': addressInfo.label || 3,
          'address_info.regionInfoText': [...new Set(regionAry)].join(joinStr),
          latitude: data.latitude,
          longitude: data.longitude,
          isDefault: +data.is_default === 1
        })
        that.location = {
          lat: data.latitude,
          lng: data.longitude
        }
        that.getAllPickUpConfig();
        that.refreshAddress();
      }
    });
  },
  nameInput: function(e){
    this.setData({
      name: e.detail.value
    })
  },
  contactInput: function(e){
    this.setData({
      contact: e.detail.value
    })
  },
  detailInput: function(e){
    this.setData({
      detail: e.detail.value
    })
  },
  setAddress: function(addressId){
    var orderId = this.data.orderId;
    app.sendRequest({
      url: '/index.php?r=AppShop/setAddress',
      data: {
        order_id: orderId,
        address_id: addressId
      },
      success: function(res){
        app.turnBack();
      }
    });
  },
  sureAddAddress: function () {
    let _this = this;
    let addressInfo = _this.data.address_info;
    let addressId = _this.data.addressId;
    let nationIsChina = +_this.data.nationId === 1;
    let areaCodeIndex = this.data.areaCodeIndex;
    if (!addressInfo.name) {
      app.showModal({
        content: '联系人不能为空',
      })
      return;
    }
    if (!addressInfo.contact) {
      app.showModal({
        content: '电话不能为空',
      })
      return;
    }
    if (nationIsChina && ((areaCodeIndex == 0 && !/^1[0-9]{10}$/.test(addressInfo.contact)) || (areaCodeIndex != 1 && !/^\d+$/.test(addressInfo.contact)))) {
      app.showModal({
        content: '请填写正确的手机号',
      })
      return;
    }
    if (!(addressInfo.province && addressInfo.province.text)) {
      app.showModal({
        content: '请选择收货地址',
      })
      return;
    }
    if (!addressInfo.detailAddress) {
      app.showModal({
        content: '详细地址不能为空',
      })
      return;
    }
    if ((nationIsChina && ~['89', '233'].indexOf(addressInfo.country.id)) || (!nationIsChina && addressInfo.country.id == '1')){
      app.showModal({
        content: '所在地区与国家不匹配',
      })
      return;
    }
    if (nationIsChina && areaCodeIndex) {
      switch (areaCodeIndex){
        case '1':
          addressInfo.contact = '+853-' + addressInfo.contact;
          break;
        case '2':
          addressInfo.contact = '+852-' + addressInfo.contact;
          break;
        case '3':
          addressInfo.contact = '+886-' + addressInfo.contact;
          break;
      }
    }
    if (this.data.nationId != 1) {
      addressInfo.contact = this.data.overseasMap[this.data.nationId]['areaCode'] + addressInfo.contact;
    }
    let addressInfoCopy = JSON.parse(JSON.stringify(addressInfo));
    if (addressInfoCopy.detailAddress) {
      addressInfoCopy.detailAddress = addressInfoCopy.address + addressInfoCopy.detailAddress;
      let index = addressInfoCopy.detailAddress.indexOf("区");
      addressInfoCopy.detailAddress = addressInfoCopy.detailAddress.substring(index + 1, addressInfoCopy.detailAddress.length);
    }
    if (addressInfoCopy.address) { delete addressInfoCopy.address;}
    if (this.data.address_info.detailAddress.indexOf(this.data.detailAddress) !== -1){
      addressInfo.latitude = this.data.latitude;
      addressInfo.longitude = this.data.longitude;
    }else {
      delete addressInfo.latitude;
      delete addressInfo.longitude;
    }
    let pages = getCurrentPages();
    let currPage = null;
    if (pages.length) {
      currPage = pages[pages.length - 3];
    }
    let route = currPage.route
    app.sendRequest({
      url: '/index.php?r=AppShop/addAddress',
      method: 'post',
      data: { 
        address_info: addressInfo,
        address_id: addressId,
        is_default: this.data.isDefault ? 1 : 0
      },
      success: function (res) {
        app.showToast({ 
          title: '保存成功'
        })
        if (route == 'eCommerce/pages/previewGoodsOrder/previewGoodsOrder' || route == 'eCommerce/pages/goodsSameJourney/goodsSameJourney') {
          app.sendRequest({
            url: '/index.php?r=AppShop/addressList',
            success: function (res) {
              let address = res.data[0];
              if (_this.data.addressId) {
                address = res.data.find((item) => item.id === _this.data.addressId) || res.data[0];
              }
              currPage.setData({
                selectAddress: address.address_info,
                selectAddressId: address.id
              });
              typeof currPage.selectAddressCallback === 'function' && currPage.selectAddressCallback(addressInfo);
              if (route == 'eCommerce/pages/previewGoodsOrder/previewGoodsOrder') {
                wx.navigateBack({
                  delta: 2
                })
              }else {
                wx.navigateBack({
                  delta: 3
                })
              }
            }
          })
        }else {
          app.turnBack();
        }
      },
      successStatusAbnormal: function(res){
        console.log(res);
        if (res.data == '获取经纬度失败'){
          app.showModal({
            content: '该地址定位不到，请检查地址是否正确'
          })
          return false;
        }
      }
    });
  },
  deleteAddress: function (e) {
    var _this = this;
    app.showModal({
      content: '确定要删除地址？',
      showCancel: true,
      confirmText: '确定',
      cancelText: '取消',
      confirm: function () {
        app.sendRequest({
          url: '/index.php?r=AppShop/delAddress',
          data: {
            address_id: _this.data.addressId
          },
          success: function (res) {
            app.turnBack();
          }
        })
      }
    })
  },
  addAdressName: function (e) {
    this.setData({
      'address_info.name': e.detail.value
    })
  },
  addAdressContact: function (e) {
    this.setData({
      'address_info.contact': e.detail.value
    })
  },
  addAdressDetailAddress: function (e) {
    this.setData({
      'address_info.detailAddress': e.detail.value
    });
  },
  selectAddressLabel: function (e) {
    this.setData({
      'address_info.label': e.currentTarget.dataset.label
    })
  },
  selectAddressSex: function (e) {
    this.setData({
      'address_info.sex': e.currentTarget.dataset.sex
    })
  },
  addSelectAddress: function () {
    let _this = this;
    if (this.data.nationId == '266') {
      app.getLocation({
        success: (res) => {
          if (!res.latitude) {
            that.setData({
              localAddress: '定位失败'
            })
            return;
          }
          wx.chooseLocation({
            latitude: res.latitude,
            longitude: res.longitude,
            success: (address) => {
              _this.selectAddressBack = true;
              let ad = {
                lat: address.latitude,
                lng: address.longitude
              }
              _this.location = ad;
              this.getAreaInfo(ad, (item) => {
                let regionId = item['data']['region_id'];
                _this.setData({
                  'address_info.country.id': _this.data.nationId,
                  'address_info.province.id': regionId,
                  'address_info.city.id': regionId,
                  'address_info.district.id': regionId,
                  'address_info.country.text': 'Singapore',
                  'address_info.province.text': 'Singapore',
                  'address_info.city.text': address.name,
                  'address_info.district.text': '',
                  'address_info.detailAddress': address.name || '',
                  'address_info.regionInfoText': 'Singapore',
                  'address_info.address': 'Singapore' + (address.address || ''),
                  'latitude': address.latitude,
                  'longitude': address.longitude
                })
              })
            },
          })
        },
        fail: (res) => {
          app.showModal({
            title: '提示',
            content: '请先授权/打开定位服务'
          })
        }
      })
    } else {
      app.turnToPage('/eCommerce/pages/searchAddress/searchAddress?from=addAddress&nationId=' + this.data.nationId + '&nationname=' + this.data.nationname);
    }
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    });
  },
  getAppECStoreConfig: function () {
    app.getAppECStoreConfig((res) => {
      this.setData({
        storeStyle: res.color_config
      })
    });
  },
  selectNation: function (e) {
    var _this = this,
      index = e.detail.value,
      data = this.data.nationListMap[index];
    _this.setData({
      nationSelectedIndex: index,
      nationId: data.oversea_region_id,
      nationname: data.nation_name,
      'address_info.regionInfoText': '',
      'address_info.province.id': '',
      'address_info.province.text': '',
      'chooseGAT': false,
      'showAddressType': 'province',
      'provinceList': [],
      'cityList': [],
      'districtList': [],
    });
    let id = data.oversea_region_id == 1 ? 0 : data.oversea_region_id;
    this.getArea(id);
  },
  changeAreaCode: function(e){
    this.setData({
      areaCodeIndex: e.detail.value
    })
  },
  intelligentAddress: function(){
    this.setData({
      showIntelligentAddress: true
    })
  },
  hideIntelligentAddress: function(){
    this.setData({
      showIntelligentAddress: false
    })
  },
  inputIntelligentAddress: function(e){
    this.setData({
      intelligentAddress: e.detail.value
    })
  },
  submitIntelligentAddress: function(){
    let _this = this;
    let intelligentAddress = this.data.intelligentAddress;
    if (!intelligentAddress){
      app.showModal({
        content: '收货地址信息不能为空'
      })
      return;
    }
    intelligentAddress = intelligentAddress.replace(/\s/g,',');
    intelligentAddress = intelligentAddress.replace(/，/g, ',');
    app.sendRequest({
      url: '/index.php?r=AppShop/IntelligentResolveAddress',
      data: {
        text: intelligentAddress
      },
      success: function (res) {
        let data = res.data;
        let areaInfo = data.area_info;
        let index = data.address.indexOf(areaInfo.district);
        let regionInfoText = data.address.substring(0, index + areaInfo.district.length);
        let detail = data.address.substring(index + areaInfo.district.length);
        if(data.address){
          _this.getLatAndLngByAreaInfo(data.address);
        }
        _this.setData({
          'address_info.name': data.name,
          'address_info.contact': data.mobile,
          'address_info.detailAddress': detail,
          'address_info.regionInfoText': regionInfoText,
          'address_info.country': { text: '', id: 1},
          'address_info.province': { text: areaInfo.province,id: ''},
          'address_info.district': { text: areaInfo.district,id: ''},
          'address_info.city': { text: areaInfo.city,id: ''},
          showIntelligentAddress: false
        })
      }
    });
  },
  getLatAndLngByAreaInfo: function (address){
    let _this = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetLatAndLngByAreaInfo',
      data: {
        address: address
      },
      success: function (res) {
        _this.location = {
          lat: res.data.latitude,
          lng: res.data.longitude
        }
        _this.getAllPickUpConfig();
      }
    });
  },
  getAreaInfo: function(options,callback) {
    app.sendRequest({
      url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
      data: {
        latitude: options.lat,
        longitude: options.lng,
        country_region_id: '266'
      },
      success: (res) => {
        typeof callback == 'function' && callback(res);
      }
    })
  },
  setDefault: function(e){
    this.setData({
      isDefault: e.detail.value
    })
  },
  stopPropagation: function(){},
  getArea: function (pid = 0, type = 0,addressType = 'province') {
    var nationId = this.data.nationId;
    app.sendRequest({
      url: '/index.php?r=Region/getRegionList',
      data: {
        country_region_id: nationId,
        pid: pid
      },
      hideLoading: true,
      success: (res) => {
        if (this.data.showAddressType == 'province' && res.data.length == 1) {
          this.setData({
            'address_info.city.id' : res.data[0].id,
            showAddressType: 'city',
          })
          this.getArea(res.data[0].id,this.data.chooseGAT ? 1 : 0,'district');
          return;
        }
        if (this.data.showAddressType == 'city' && res.data.length == 1) {
          this.setData({
            chooseAddressModal: false,
          })
          return;
        }
        if (res.status == 0 && res.data.length) {
          function toUpperCase(str = '') {
            return str.slice(0,1).toUpperCase();
          }
          let newData = {};
          let checkoutList = ['34','33','32'];
          let list = []
          let { address_info } = this.data;
          if (nationId == 1) {          // 选择中国
            let tempName = [];
            let sortList = res.data.map(item=> {
              let pName = toUpperCase(item.pinyin);
              if (item.pinyin != "xianggang" && item.pinyin != "taiwan" && item.pinyin != "aomen" && tempName.findIndex(a => a == pName) < 0) {
                tempName.push(pName)
                return item.f_name = pName;
              }else {
                return item.f_name = '';
              }
            })
            sortList = res.data.sort((a,b)=> {
              let nameA = toUpperCase(a.pinyin); // 取第一位
              let nameB = toUpperCase(b.pinyin);
              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            })
            newData['chooseGAT'] = false;
            if (type == 0) {     // 🇨🇳 中国大陆 去掉台湾，香港，澳门 模板单独列 港澳台 ；
              list = sortList.filter(item => {
                return checkoutList.indexOf(item.id) < 0;
              })
              newData[`oldAddress.CN`] = address_info;
            }else {                     // 选择港澳台
              list = sortList;
              if (addressType == 'province') {
                list = sortList.filter(item => {
                  return checkoutList.indexOf(item.id) >= 0;
                })
              }
              newData['chooseGAT'] = true;
              newData[`oldAddress.GAT`] = address_info;
            }
            if (addressType == 'city') {
              newData['cityList'] = list;
              newData['showAddressType'] = 'city';
              newData['chooseTips'] = '选择城市';
            }else if (addressType == 'district') {
              newData['districtList'] = list;
              newData['showAddressType'] = 'district';
              newData['chooseTips'] = '选择区/县';
            }else {
              newData['provinceList'] = list;
              newData['showAddressType'] = 'province';
              newData['chooseTips'] = '选择省份/地区';
            }
            this.setData(newData);
          }else {                       // 选择国外
            let newData = {};
            let tempName = [];
            let sortList = res.data.map(item=> {
              let pName = toUpperCase(item.name);
              if (tempName.findIndex(a => a == pName) < 0) {
                tempName.push(pName)
                return item.f_name = pName;
              }else {
                return item.f_name = '';
              }
            })
            sortList = res.data.sort((a,b)=> {
              let nameA = toUpperCase(a.name); // 取第一位
              let nameB = toUpperCase(b.name);
              if (nameA < nameB) return -1;
              if (nameA > nameB) return 1;
              return 0;
            })
            if (sortList.length == 1 && addressType != 'province') {
              newData['chooseAddressModal'] = false;
              this.setData(newData);
              return;
            }
            if (addressType == 'city') {
              newData['cityList'] = sortList;
              newData['showAddressType'] = 'city';
              newData['chooseTips'] = '选择城市';
            }else if (addressType == 'district') {
              newData['districtList'] = sortList;
              newData['showAddressType'] = 'district';
              newData['chooseTips'] = '选择区/县';
            }else {
              newData['provinceList'] = sortList;
              newData['showAddressType'] = 'province';
              newData['chooseTips'] = '选择省份/地区';
            }
            newData[`oldAddress.CN`] = address_info;
            this.setData(newData);
          }
        }
      }
    })
  },
  chooseAddress: function () {
    let GAT_LIST = ['32','33','34'];
    let { cityList, districtList, oldAddress, chooseGAT } = this.data;
    let showAddressType = 'province';
    if (districtList.length) {
      showAddressType = 'district';
    }else if (cityList.length){
      showAddressType = 'city'
    }
    let flag = GAT_LIST.includes(this.data.address_info.province.id) || chooseGAT;
    let currentAddress = JSON.parse(JSON.stringify(flag ? oldAddress.GAT : oldAddress.CN));
    currentAddress.currentChoose = flag;// 保存选择港澳台还是大陆
    let newData = {};
    flag ? newData['oldAddress.CN'] = {} : newData['oldAddress.GAT'] = '';
    newData['currentAddress'] = currentAddress;
    newData['showAddressType'] = showAddressType;
    newData['chooseAddressModal'] = true;
    newData['chooseGAT'] = flag;
    this.setData(newData);
  },
  closeChooseAddressModal: function () {
    let { oldAddress, currentAddress, address_info } = this.data;
    let newData = {};
    newData['chooseAddressModal'] = false;
    if (oldAddress.CN.district && oldAddress.CN.district.id) {
      newData['chooseGAT'] = false;
      newData['showAddressType'] = 'district';
      newData['address_info'] = oldAddress.CN;
      this.getArea(oldAddress.CN.city.id,'0','district');
    }else if (oldAddress.GAT.district && oldAddress.GAT.district.id) {
      newData['chooseGAT'] = true;
      newData['showAddressType'] = 'district';
      newData['address_info'] = oldAddress.GAT;
      this.getArea(oldAddress.GAT.city.id,'1','district');
    }
    if (!address_info.district.id) {
      newData['address_info'] = currentAddress;
      newData['chooseGAT'] = currentAddress.currentChoose;
      this.getArea(currentAddress.city.id,currentAddress.currentChoose,'district');
    }
    this.setData(newData);
  },
  chooseCNOrGAT: function (event) {
    let type = event.currentTarget.dataset.type;
    let { address_info, oldAddress } = this.data;
    if (type == 1 && !Object.keys(oldAddress.GAT).length) {
      oldAddress.GAT = {
        name: address_info.name,
        contact: address_info.contact,
        detailAddress: address_info.detailAddress,
        sex: address_info.sex,
        label: address_info.label,
        province: {},
        city: {},
        district: {}
      }
    }
    if (type == 0 && !Object.keys(oldAddress.CN).length) {
      oldAddress.CN = {
        name: address_info.name,
        contact: address_info.contact,
        detailAddress: address_info.detailAddress,
        sex: address_info.sex,
        label: address_info.label,
        province: {},
        city: {},
        district: {}
      }
    }
    address_info = type == 1 ? oldAddress.GAT : oldAddress.CN;
    this.setData({
      'provinceList': [],
      'districtList': [],
      'cityList': [],
      'address_info': address_info,
    })
    let splitList = ['378','377'];// 剔除 澳门 香港
    if (type == 1) {
      if (oldAddress.GAT.district && oldAddress.GAT.district.id) {
        this.getArea(oldAddress.GAT.city.id, type, 'district');
        return;
      }else if (oldAddress.GAT.city && oldAddress.GAT.city.id && !splitList.includes(oldAddress.GAT.city.id)) {
        this.getArea(oldAddress.GAT.province.id, type, 'city');
        return;
      }
      this.getArea('',type,)
    }else {
      if (oldAddress.CN.district && oldAddress.CN.district.id) {
        this.getArea(oldAddress.CN.city.id, type, 'district');
        return;
      }else if (oldAddress.CN.city && oldAddress.CN.city.id) {
        this.getArea(oldAddress.CN.province.id, type, 'city')
        return;
      }
      this.getArea('',type,)
    }
  },
  chooseNextAddress: function (event) {
    let id = event.currentTarget.dataset.id;
    let type = event.currentTarget.dataset.type;
    let chooseGAT = this.data.chooseGAT;
    let GAT_LIST = ['32','33','34'];
    if (GAT_LIST.includes(id)) {
      this.getArea(id,chooseGAT ? 1 : 0,type);
      return;
    }
    if (id === '378') {
      type = 'district';
      this.setData({
        'address_info.district.id': '',
        'address_info.district.text': '',
      })
    }
    this.getArea(id,chooseGAT ? 1 : 0,type);
  },
  chooseInGAT: function(event) {
    let index = event.currentTarget.dataset.index;
    let provinceList = this.data.provinceList;
    let id = provinceList[index].id;
    provinceList.map(item=> item.selected = false);
    provinceList[index].selected = true;
    this.setData({
      provinceList,
      'address_info.country.text' : this.data.nationname,
      'address_info.country.id' : 1,
      'address_info.province.text' : provinceList[index].name,
      'address_info.province.id' : id,
      'address_info.city.text': '',
      'address_info.city.id': '',
      'address_info.district.text': '',
      'address_info.district.id': '',
      'address_info.regionInfoText': provinceList[index].name,
    });
    this.getArea(id, '1', 'city');
  },
  chooseProvince: function(event) {
    let index = event.currentTarget.dataset.index;
    let id = event.currentTarget.dataset.id;
    let {
      provinceList, nationname, nationId, 
    } = this.data;
    let newData = {};
    newData['address_info.province.id'] = provinceList[index].id;
    newData['address_info.province.text'] = provinceList[index].name;
    newData['address_info.regionInfoText'] = provinceList[index].name;
    newData['address_info.country.text'] = nationname;
    newData['address_info.country.id'] = nationId;
    newData['address_info.city.id'] = '';
    newData['address_info.city.text'] = '';
    newData['address_info.district.text'] = '';
    newData['address_info.district.id'] = '';
    this.setData(newData);
    this.getArea(id, 0,'city');
  },
  chooseCity: function(event) {
    let index = event.currentTarget.dataset.index;
    let {
      chooseGAT,
      cityList,
      address_info
    } = this.data;
    let newData = {};
    newData['address_info.city.id'] = cityList[index].id;
    newData['address_info.city.text'] = cityList[index].name;
    newData['address_info.regionInfoText'] = address_info.province.text + cityList[index].name;
    newData['address_info.district.text'] = '';
    newData['address_info.district.id'] = '';
    this.getArea(cityList[index].id, chooseGAT ? 1 : 0, 'district');
    this.setData(newData);
  },
  chooseDistrict: function(event) {
    let index = event.currentTarget.dataset.index;
    let {
      chooseGAT,
      districtList,
      address_info
    } = this.data;
    let newData = {};
    let temp = new Set([
      address_info.province.text,
      address_info.city.text,
      districtList[index].name
    ]);
    newData['address_info.district.id'] = districtList[index].id;
    newData['address_info.district.text'] = districtList[index].name;
    newData['address_info.regionInfoText'] = [...temp].join('');
    newData['chooseAddressModal'] = false;
    let type = chooseGAT ? 'CN' : 'GAT';
    newData[`oldAddress.${type}`] = {
      name: address_info.name,
      contact: address_info.contact,
      detailAddress: address_info.detailAddress,
      sex: address_info.sex,
      label: address_info.label,
      province: {},
      city: {},
      district: {}
    }
    this.setData(newData);
  },
  toGetArea: function(event) {
    let {
      chooseGAT,
      address_info
    } = this.data;
    let showAddressType = 'city';
    let id = 0;
    if (!address_info.province.id) {
      showAddressType = 'province';
      id = this.data.nationId;
    }else if (!address_info.city.id) {
      showAddressType = 'city';
      id = address_info.province.id;
    }else if (!address_info.district.id) {
      showAddressType = 'district';
      id = address_info.city.id;
    }
    this.getArea(id,chooseGAT ? 1 : 0, showAddressType);
  },
  refreshAddress: function() {
    let { nationListMap, nationSelectedIndex, showAddressType, nationId ,address_info} = this.data;
    let splitId = ['32','33','34'];
    let flag = 0;
    let id = nationId;
    if (splitId.includes(address_info.province.id)) {
      flag = 1;
      this.setData({
        chooseGAT: true,
      })
    }
    if (address_info.district.id && address_info.district.id != address_info.city.id) {  // 初始化进入页面有选择过地址 判断选择的地址 拿列表展示数据
      showAddressType = 'district';
      id = address_info.city.id;
    }else if (address_info.city.id && address_info.city.id != address_info.province.id) {
      showAddressType = 'city';
      id = address_info.province.id;
    }else {       // 初始化进入页面没有选择过地址 判断是国内国外
      id = nationId == 1 ? 0 : nationListMap[nationSelectedIndex].oversea_region_id;
    }
    let hideCityList = ['377','388','35','107'];
    if (hideCityList.includes(address_info.city.id)) {
      this.setData({
        'address_info.city.text': '',
      })
    }
    this.getArea(id,flag, showAddressType);  // 获取当前选中的地址列表
  }
})
