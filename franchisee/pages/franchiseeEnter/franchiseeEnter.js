var app = getApp()
const dataType = function (data) {
  return Object.prototype.toString.call(data).match(/^\[object\s(\w+)\]$/)[1];
}
const checkDataType = function (data, typeString) {
  return (dataType(data)).toLowerCase() === typeString.toLowerCase();
}
const hasOwnProperty = function (data, property) {
  if (typeof data.hasOwnProperty === 'function') {
    return data.hasOwnProperty(property);
  }
  return Object.prototype.hasOwnProperty.call(data, property);
}
const ifHasDataType = function (data, typeArr) {
  return typeArr.some(_type => {
    return checkDataType(data, _type);
  });
}
const getRightAttrVal = function (path, target) {
  /\]$/.test(path) && (path = path.slice(0, -1));
  let pathArr = path.replace(/\]?\[|\]\.?/g, '.').split(/\./);
  let len = pathArr.length;
  let key;
  let result = target;
  while (ifHasDataType(result, ['object', 'array']) && len > 0) {
    key = pathArr.shift();
    result = result[key];
    len--;
  }
  return result;
}
const pickAttrObject = function (attrs, target) {
  let result = {};
  if (checkDataType(attrs, 'object') && checkDataType(target, 'object')) {
    for (let k in attrs) {
      if (hasOwnProperty(attrs, k)) {
        result[k] = getRightAttrVal(attrs[k], target);
      }
    }
  }
  return result;
}
const countryId = (function () {
  let country_region_id = 1; // 中国
  let _update = function (id) {
    country_region_id = id;
  }
  let _get = function () {
    return country_region_id;
  }
  return {
    get: _get,
    update: _update
  }
})()
Page({
  data: {
    regionList: [],
    region: [0],
    allRegionData: [], // 所有的地区数据
    address: '',
    showCategoryPickView: false, // 是否显示店铺分类选择
    categorySource: [], // 店铺分类数据
    categoryList: [], // 展示的店铺分类数组
    categoryIdxs: [], // 选中的店铺分类下标
    categoryIds: [], // 选中的店铺分类id数组
    lastCategoryIdxs: [], // 上一次保存的店铺分类下标
    categoryNames: [], // 选中的店铺分类名称
    isOperateShopCate: false, // 是否选择了店铺分类
    industryList: [], // 行业分类数据
    industry: [], // 动态行业分类选中下标
    industryIds: [], // 选中行业分类id
    industryNames: [], // 选中行业分类的名称
    selectedIndustry: [], // 选中的行业分类下标
    allIndustryData: [], // 所有的行业数据
    showIndustryPickView: false, // 控制是否显示行业分类选择picker-view
    shopLogo : '',
    phone : '', // 用户手机号
    hasGetPhoneNumber: false, // 是否获取过手机号
    isGetPhoneNumber: true, // 是否是获取的手机号
    codeBtnText: '验证',
    canSendCode: true ,
    successPop : true,
    longitude: '',
    latitude: '',
    appType: 1,
    appList: [],
    appIndex: -1,
    isUser: false,
    newApp: '',
    shopId: '',
    appShopInfo: {},
    cdnUrl: app.getCdnUrl(),
    showRegionPickView: false, // 是否显示店铺地址选择弹窗
    confirmRegionSelect: false, // 判断是否确认过地区选择
    countryPreFix: [], // 用户电话前缀
    aPPreFixValue: [0], // 当前选中的用户电话前缀
    sPPreFixValue: [0], // 当前选中的客服电话前经
    isDefaultAPP: true, // 是否是默认的电话前缀
    paid_config: {
      price: 0,
      switch: false,
      enterAudit: true,
    },  // 入驻配置
  },
  onLoad: function(options){
    let that = this;
    this.getAppShopCateList(function (data) {
      const haveData = !!(Array.isArray(data) && data[0]);
      if (!haveData) {
        return;
      }
      let categorySource = that.shopCateListForm(data);
      let categoryIdxs = that.initShopCategoryIdxs(categorySource);
      let categoryList = that.initShopCateList(categorySource, categoryIdxs);
      let categoryNames = that.getShopCategoryNames(categoryList, categoryIdxs);
      let categoryIds = that.getShopCategoryIds(categoryList, categoryIdxs);
      that.setData({
        categorySource,
        categoryList,
        categoryIds,
        categoryIdxs,
        categoryNames,
        lastCategoryIdxs: categoryIdxs
      });
    });
    this.getPhonePrefix();
    this.initRegionData(function (allRegionData) {
      that.setData({
        allRegionData
      });
      let region = that.creatRegion([0]);
      let regionList = that.creatRegionList(region);
      that.setData({
        region,
        regionList
      });
      that.getLocation().then(({ latitude, longitude }) => {
        if (latitude) {
          app.sendRequest({
            url: '/index.php?r=Map/getAreaInfoByLatAndLng',
            data: {
              longitude: longitude,
              latitude: latitude
            },
            success: function ({ data }) {
              let nationCode = getRightAttrVal('ad_info.nation_code', data);
              if (nationCode == 156) { // 代表中国
                let province = getRightAttrVal('address_component.province', data);
                let city = getRightAttrVal('address_component.city', data);
                let district = getRightAttrVal('address_component.district', data);
                that.textToRegion(province, city, district);
              }
            }
          });
        }
      }).catch(err => {
        console.log(err);
      });
      that.getAppShopInfo().then(
        (data) => {
          let countryRegionId = +getRightAttrVal('country_region_id', data);
          if (countryRegionId && (countryRegionId !== 1)) {
            countryId.update(countryRegionId);
            let preFixIdx = that.data.countryPreFix.findIndex(country => country.id == countryRegionId);
            if (preFixIdx > -1) {
              that.setData({
                ['sPPreFixValue[0]']: preFixIdx,
                ['aPPreFixValue[0]']: preFixIdx
              });
            }
          }
        }
      ).catch((err) => {
        console.log(err);
      });
    });
    this.industryTypeInit(function (allIndustryData) {
      let industry = that.creatIndustry([0]);
      let industryList = that.creatIndustryList(industry);
      that.setData({
        industry,
        industryList
      });
    });
    this.getParentConfigData();
  },
  initRegionData: function (callback) {
    const getNationList = function () {
      return new Promise((resolve, reject) => {
        app.sendRequest({
          url: '/index.php?r=Region/getNationList',
          data: { page_size: 1000 },
          success: resolve,
          fail: reject
        })
      })
    }
    const getNationRegionList = function (countryRegionId) {
      return new Promise((resolve, reject) => {
        app.sendRequest({
          url: '/index.php?r=AppShop/getAllRegionInfo',
          data: {
            country_region_id: countryRegionId
          },
          success: resolve,
          fail: reject
        })
      })
    }
    const hasOwnProperty = function (obj, key) { 
      return Object.prototype.hasOwnProperty.call(obj, key);
    };
    const objectToArray = function (obj) {
      return Object.keys(obj).filter((key) => key > 0).map((key) => {
        let item = obj[key];
        if (hasOwnProperty(item, 'cities')) {
          item.child = objectToArray(item.cities);
          delete item.cities;
        }
        else if (hasOwnProperty(item, 'towns')) {
          item.child = objectToArray(item.towns);
          delete item.towns;
        }
        return item;
      })
    }
    const formateData = function (list) {
      if (!Array.isArray(list)) {
        return [];
      }
      return list.map((item) => {
        let result = {
          id: item.id,
          name: item.name,
        }
        if (hasOwnProperty(item, 'child')) {
          result.child = formateData(item.child)
        }
        return result;
      })
    }
    getNationList().then(
      ({ data }) => {
        const nationList = data.map((nation) => {
          return {
            id: nation.oversea_region_id,
            name: nation.nation_name,
            nation_code: nation.nation_code
          }
        }).reverse();
        const allNationRegionPromise = nationList.map((nation) => getNationRegionList(nation.id));
        Promise.all(allNationRegionPromise).then(
          (dataArr) => {
            dataArr.forEach(({ data }, index) => {
              let countryRegionData = formateData(objectToArray(data));
              nationList[index].child = countryRegionData;
            });
            typeof callback === 'function' && callback(nationList);
          }
        ).catch((err) => {
          console.log(err);
        })
      }
    ).catch((err) => {
      console.log(err)
    });
  },
  getRegionChild: function (region) {
    const allRegionData = this.data.allRegionData;
    return region.reduce((p, c) => {
      return p[c].child || [];
    }, allRegionData);
  },
  creatRegion: function (region) {
    const getChild = this.getRegionChild;
    region = region || [0];
    while (!!getChild(region).length) {
      region = region.concat(0);
    }
    return region;
  },
  creatRegionList: function (region) {
    const allRegionData = this.data.allRegionData;
    const getChild = this.getRegionChild;
    const formate = function (list) {
      return list.map((item) => {
        return {
          id: item.id,
          name: item.name
        }
      });
    }
    let regionList = [formate(allRegionData)];
    let i = 1;
    let list = null;
    do {
      list = getChild(region.slice(0, i)).concat();
      !!list.length && regionList.push(formate(list));
      i++;
    } while (!!list.length);
    return regionList;
  },
  getAppShopInfo: function (nationList, callback) {
    let that = this;
    return new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppShop/GetAppShopInfo',
        data: {
        },
        success: function ({ data }) {
          that.setData({
            appShopInfo: data
          });
          resolve(data);
        },
        fail: reject
      });
    });
  },
  getCountryId: function () {
    let {
      region,
      regionList
    } = this.data;
    if (region.length !== regionList.length) {
      app.showModal({
        content: '店铺位置选择有问题，请刷新重试'
      });
      return '';
    }
    let lastIndex = region.length - 1;
    if (lastIndex >= 0 && regionList[lastIndex] && regionList[lastIndex][region[lastIndex]]) {
      return regionList[lastIndex][region[lastIndex]].id;
    } else {
      return '';
    }
  },
  textToRegion: function (province, city, town) {
    const getChild = this.getRegionChild;
    let region = this.data.region;
    let regionList = this.data.regionList;
    let fn = function (name, list) {
      let l = list.length;
      let index = null;
      name = name.slice(0, -1);
      for (let i = 0; i < l; i++) {
        if (list[i].name.slice(0, -1) === name) {
          index = i;
          break;
        }
      }
      return index;
    }
    let regionNames = [province, city, town].filter((name) => name.trim());
    let findAll = true;
    if (region[0] !== 0) {
      region[0] = 0;
    }
    regionNames.forEach((name, i) => {
      let list = [];
      list = getChild(region.slice(0, i + 1));
      let index = fn(name, list);
      if (index !== null) {
        region[i + 1] = index;
        regionList[i + 1] = list;
      } else {
        findAll = false;
      }
    });
    if (!findAll) {
      return;
    }
    region = region.slice(0, 4);
    regionList = regionList.slice(0, 4);
    this.setData({
      region,
      regionList
    });
  },
  bindRegionColumnChange: function (e) {
    let detail = e.detail;
    let value = detail.value;
    let region = this.data.region;
    let regionList = this.data.regionList;
    let column = 0;
    let vl = value.length;
    let findDiff = false;
    for (; column < vl; column++) {
      if (value[column] !== region[column]) {
        findDiff = true;
        break;
      }
    }
    if (!findDiff) {
      return;
    }
    if (column === 0) {
      countryId.update(regionList[0][value[0]].id);
    }
    region = this.creatRegion(value.slice(0, column).concat(value[column]));
    regionList = this.creatRegionList(region);
    this.setData({
      region,
      regionList
    });
  },
  showRegionPickerTap: function () {
    this.setData({
      showRegionPickView: true
    });
    this.originRegion = this.data.region.concat([]);
    this.originRegionList = this.data.regionList.map(item => item.concat([]));
  },
  bindRegionPickerStart: function () {
    this.regionPickerTouchMoving = true;
  },
  bindRegionPickerEnd: function () {
    this.regionPickerTouchMoving = false;
    if (this.regionPickerComfirmTapping) {
      this.setData({
        showRegionPickView: false
      });
      this.regionPickerComfirmTapping = false;
    }
  },
  cancelRegionSelect: function () {
    this.setData({
      region: this.originRegion,
      regionList: this.originRegionList,
      showRegionPickView: false
    });
    this.originRegion = null;
    this.originRegionList = null;
  },
  confirmRegionSelect: function () {
    if (this.regionPickerTouchMoving) {
      this.regionPickerComfirmTapping = true;
      return;
    }
    this.setData({
      showRegionPickView: false,
      confirmRegionSelect: true
    });
    this.regionPickerComfirmTapping = false;
    this.originRegion = null;
    this.originRegionList = null;
  },
  industryTypeInit: function (callback) {
    const getIndustryType = () => new Promise((resolve, reject) => {
      app.sendRequest({
        url: '/index.php?r=AppShopManage/GetAllIndustryTypeList',
        data: {
        },
        success: resolve,
        fail: reject
      });
    });
    const hasOwnProperty = function (obj, key) { 
      return Object.prototype.hasOwnProperty.call(obj, key);
    };
    const objectToArray = function (obj) {
      return Object.keys(obj).filter((key) => key > 0).map((key) => {
        let item = obj[key];
        if (hasOwnProperty(item, 'subcat')) {
          item.child = objectToArray(item.subcat);
          delete item.subcat;
        }
        return item;
      })
    }
    const formateData = function (list) {
      if (!Array.isArray(list)) {
        return [];
      }
      return list.map((item) => {
        let result = {
          id: item.id,
          name: item.name,
        }
        if (hasOwnProperty(item, 'child')) {
          result.child = formateData(item.child)
        }
        return result;
      })
    }
    getIndustryType().then(({ data }) => {
      let allIndustryData = formateData(objectToArray(data));
      this.setData({ allIndustryData });
      typeof callback === 'function' && callback(allIndustryData);
    }).catch((err) => {
      console.error(err.data || err.message);
    });
  },
  getIndustryChild: function (industry) {
    const allIndustryData = this.data.allIndustryData;
    return industry.reduce((p, c) => {
      return p[c].child || [];
    }, allIndustryData);
  },
  creatIndustry: function (industry) {
    const getChild = this.getIndustryChild;
    industry = industry || [0];
    while (!!getChild(industry).length) {
      industry = industry.concat(0);
    }
    return industry;
  },
  creatIndustryList: function (industry) {
    const allIndustryData = this.data.allIndustryData;
    const getChild = this.getIndustryChild;
    const formate = function (list) {
      return list.map((item) => {
        return {
          id: item.id,
          name: item.name
        }
      });
    }
    let industryList = [formate(allIndustryData)];
    let i = 1;
    let list = null;
    do {
      list = getChild(industry.slice(0, i)).concat();
      !!list.length && industryList.push(formate(list));
      i++;
    } while (!!list.length);
    return industryList;
  },
  generateIndustryIds: function (industry) {
    const getChild = this.getIndustryChild;
    let ids = [];
    let list = null;
    industry = industry || this.data.industry;
    while (ids.length < industry.length && (list = getChild(industry.slice(0, ids.length))).length) {
      ids = ids.concat(list[industry[ids.length]].id);
    }
    return ids;
  },
  generateIndustryNames: function(industry) {
    const getChild = this.getIndustryChild;
    let names = [];
    let list = null;
    industry = industry || this.data.industry;
    while (names.length < industry.length && (list = getChild(industry.slice(0, names.length))).length) {
      names = names.concat(list[industry[names.length]].name);
    }
    return names;
  },
  bindIndustryColumnChange: function (e) {
    let detail = e.detail;
    let value = detail.value;
    let industry = this.data.industry;
    let industryList = this.data.industryList;
    let column = 0;
    let vl = value.length;
    let findDiff = false;
    for (; column < vl; column++) {
      if (value[column] !== industry[column]) {
        findDiff = true;
        break;
      }
    }
    if (!findDiff) {
      return;
    }
    industry = this.creatIndustry(value.slice(0, column).concat(value[column]));
    industryList = this.creatIndustryList(industry);
    this.setData({
      industry,
      industryList
    });
  },
  tapSelectIndustryType: function () {
    this.setData({
      showIndustryPickView: true
    });
  },
  bindIndustryPickerStart: function () {
    this.industryPickerTouchMoving = true;
  },
  bindIndustryPickerEnd: function () {
    this.industryPickerTouchMoving = false;
    if (this.industryPickerConfirmTapping) {
      let industry = this.data.industry;
      this.setData({
        selectedIndustry: industry,
        showIndustryPickView: false
      });
      this.industryPickerConfirmTapping = false;
    }
  },
  cancelIndustryType: function () {
    let {
      selectedIndustry
    } = this.data;
    let industryList = this.creatIndustryList(selectedIndustry);
    this.setData({
      industry: selectedIndustry,
      industryList,
      showIndustryPickView: false
    });
  },
  confirmIndustryType: function () {
    if (this.industryPickerTouchMoving) {
      this.industryPickerConfirmTapping = true;
      return;
    }
    let industry = this.data.industry;
    let industryIds = this.generateIndustryIds(industry);
    let industryNames = this.generateIndustryNames(industry);
    this.setData({
      industryIds,
      industryNames,
      selectedIndustry: industry,
      showIndustryPickView: false
    });
    this.industryPickerConfirmTapping = false;
  },
  getAppShopCateList: function (callback) {
    app.sendRequest({
      url: '/index.php?r=AppShop/GetAppShopCateList',
      data: {
        common_type: 1,
        form: 'app_shop'
      },
      success: function (res) {
        typeof callback === 'function' && callback(res.data);
      }
    });
  },
  shopCateListForm: function (list) {
    let _self = this;
    let res = [];
    if (Array.isArray(list) && list[0]) {
      res = list.map(function (item) {
        let obj = {
          id: item.id,
          name: item.name
        }
        if (item.subclass) {
          obj.subclass = _self.shopCateListForm(item.subclass);
        }
        return obj;
      });
    }
    if (!!list[0] && list[0].pid > 0) {
      res = [{
        name: '全部',
        id: list[0].pid
      }].concat(res);
    }
    return res;
  },
  initShopCategoryIdxs: function (list, init = [0]) {
    if (!Array.isArray(list) || list.length === 0) {
      return init;
    }
    let getChild = function (pathArr = [], target) {
      for (let i = 0, index; index = pathArr[i++], index !== undefined;) {
        target = target[index] && target[index].subclass || [];
        if (!target.length) {
          break;
        }
      }
      return target;
    }
    while (!!getChild(init, list).length) {
      init.push(0);
    }
    let copyInit = init.concat();
    while (!getChild(copyInit, list).length) {
      copyInit.pop();
    }
    if (init.length - copyInit.length > 1) {
      init = copyInit.concat(0);
    }
    return init;
  },
  initShopCateList: function (list, category) {
    let cateList = [];
    let next = list.concat();
    for (let i = 0, idx; idx = category[i++], idx !== undefined;) {
      cateList.push(next.map((item) => ({ id: item.id, name: item.name })));
      next = next[idx] && next[idx].subclass || [];
      if (!next.length) {
        break;
      }
    }
    return cateList;
  },
  getShopCategoryNames: function (categoryList, category) {
    let nameArr = [];
    let lastName = '';
    let lastCate = '';
    let curName = '';
    let curCate = '';
    category.forEach(function (v, i) {
      curCate = categoryList[i][v];
      if (lastCate === '' || (lastCate && !!(lastCate.id - curCate.id))) {
        curName = curCate.name;
        curName = !!i ? (lastName + '/' + curName) : curName;
        nameArr.push(curName);
      }
      lastCate = curCate;
      lastName = curName;
    });
    return nameArr;
  },
  getShopCategoryIds: function (categoryList, category) {
    let ids = [];
    let lastCate = '';
    let curCate = '';
    category.forEach(function (v, i) {
      curCate = categoryList[i][v];
      if (lastCate === '' || (lastCate && !!(lastCate.id - curCate.id))) {
        ids.push(curCate.id);
      }
      lastCate = curCate;
    });
    return ids;
  },
  bindPhoneInput: function(e){
    let phone = e.detail.value;
    let that = this;
    this.data.phone = phone;
    if (phone == that.phoneNumber && phone != ''){
      that.setData({
        isGetPhoneNumber: true,
        hasGetPhoneNumber: true
      });
    } else if (phone == ''){
      that.setData({
        isGetPhoneNumber: true,
        isUser: false,
        hasGetPhoneNumber: false
      });
    }else{
      that.setData({
        isGetPhoneNumber: false,
        isUser: false,
        hasGetPhoneNumber: true
      });
    }
  },
  bindPhoneBlur: function(e){
    let phone = e.detail.value;
    let that = this;
    that.setData({
      phone: phone
    })
    if (phone == that.phoneNumber && phone != '') {
      that.checkPhoneIsUser();
    }
  },
  bindCategoryColumnChange: function (e) {
    let detail = e.detail;
    let value = detail.value;
    let categoryIdxs = this.data.categoryIdxs;
    let vl = value.length;
    let column = 0;
    let findDiff = false;
    for (; column < vl; column++) {
      if (value[column] - categoryIdxs[column] !== 0) {
        findDiff = true;
        break;
      }
    }
    if (!findDiff) {
      return;
    }
    let categorySource = this.data.categorySource;
    categoryIdxs = this.data.categoryIdxs.slice(0, column).concat(value[column]);
    categoryIdxs = this.initShopCategoryIdxs(categorySource, categoryIdxs);
    let categoryList = this.initShopCateList(categorySource, categoryIdxs);
    this.setData({
      categoryIdxs,
      categoryList
    });
  },
  bindCategoryChange: function (e) {
    this.setData({
      categoryIdxs,
      categoryList
    });
  },
  tapSelectShopCategory: function (e) {
    this.setData({
      showCategoryPickView: true
    });
  },
  confirmCategorySelect: function (e) {
    if (this.categoryPickerTouchMoving) {
      this.categoryPickerConfirmTapping = true;
      return;
    }
    let categoryIdxs = this.data.categoryIdxs;
    let categoryList = this.data.categoryList;
    let categoryNames = this.getShopCategoryNames(categoryList, categoryIdxs);
    let categoryIds = this.getShopCategoryIds(categoryList, categoryIdxs);
    let isOperateShopCate = this.data.isOperateShopCate;
    let newData = {
      lastCategoryIdxs: categoryIdxs,
      categoryNames,
      categoryIds,
      showCategoryPickView: false
    };
    if (!isOperateShopCate) {
      newData.isOperateShopCate = true;
    }
    this.setData(newData);
    this.categoryPickerConfirmTapping = false;
  },
  cancelCategorySelect: function (e) {
    let lastCategoryIdxs = this.data.lastCategoryIdxs;
    let categorySource = this.data.categorySource;
    let categoryList = this.initShopCateList(categorySource, lastCategoryIdxs);
    this.setData({
      categoryIdxs: lastCategoryIdxs,
      categoryList,
      showCategoryPickView: false
    });
  },
  bindCategoryPickerStart: function (e) {
    this.categoryPickerTouchMoving = true;
  },
  bindCategoryPickerEnd: function (e) {
    this.categoryPickerTouchMoving = false;
    if (this.categoryPickerConfirmTapping) {
      this.categoryPickerConfirmTapping = false;
      this.confirmCategorySelect(e);
    }
  },
  hasSubmit: false,
  enterSubmit : function(e){
    let that = this;
    if(that.hasSubmit){
      app.showModal({
        content: '该店铺已申请入驻'
      });
      return;
    }
    let val = e.detail.value;
    let param = {
      name: val.name,
      account_phone: val.account_phone,
      code: val.code,
      address_detail: val.address_detail
    };
    param.apply_type = that.data.isUser ? that.data.appType : 0;
    if (param.apply_type == 1 && that.data.appIndex != -1) {
      param.app_id = that.data.appList[that.data.appIndex].app_id;
    }
    param.picture = that.data.shopLogo;
    param.parent_app_id = app.getAppId();
    param.category = that.data.isOperateShopCate ? that.data.categoryIds : [];
    param.longitude = that.data.longitude;
    param.latitude = that.data.latitude;
    param.county_id = that.getCountryId();
    param.check_type = that.data.isGetPhoneNumber ? 1 : 0;
    param.p_u = app.globalData.p_u || '';
    param.country_region_id = countryId.get();
    let industryIds = this.data.industryIds;
    if (industryIds.length > 0) {
      param.industry_type = industryIds.slice(-1)[0];
    }
    let {
      countryPreFix,
      aPPreFixValue,
      sPPreFixValue
    } = this.data;
    if(!param.name){
      app.showModal({
        content: '请输入店铺名称'
      });
      return;
    }
    if (!param.picture) {
      app.showModal({
        content: '请上传店铺logo'
      });
      return;
    }
    if (!param.account_phone) {
      app.showModal({
        content: '请输入登录手机号'
      });
      return;
    }
    if (!/^\d+$/.test(param.account_phone)) {
      app.showModal({
        content: '请输入正确的登录手机号'
      });
      return;
    }
    if (countryPreFix[aPPreFixValue[0]]['value'] != 86) { // 非中国手机号要加上前缀
      param.account_phone = countryPreFix[aPPreFixValue[0]]['value'] + '-' + param.account_phone;
    }
    if (!param.code && param.check_type == 0) {
      app.showModal({
        content: '请输入验证码'
      });
      return;
    }
    if (!this.data.confirmRegionSelect) {
      let {
        region,
        regionList
      } = that.data,
      lastIndex = region.length - 1,
      lastRegionText = regionList[lastIndex][region[lastIndex]].name;
      app.showModal({
        showCancel: true,
        content: '请确认选择的店铺位置:'+lastRegionText,
        confirm: res => {
          that.setData({
            confirmRegionSelect: true
          });
          that.enterSubmit(e);
        }
      })
      return;
    }
    if (!param.longitude) {
      app.showModal({
        content: '请去定位一下店铺位置'
      });
      return;
    }
    if (!param.address_detail) {
      app.showModal({
        content: '请填写详细地址'
      });
      return;
    }
    if (countryPreFix[sPPreFixValue[0]]['value'] != 86) {
      param.phone = countryPreFix[sPPreFixValue[0]]['value'] + '-' + param.phone;
    }
    if (!param.industry_type) {
      app.showModal({
        content: '请选择行业分类'
      });
      return;
    }
    if (that.data.categoryList.length > 0 && param.category.length <= 0) {
      app.showModal({
        content: '请选择店铺分类'
      });
      return;
    }
    if (param.apply_type == 1 && that.data.appIndex == -1){
      app.showModal({
        content: '请选择关联小程序'
      });
      return;
    }
    if (this.data.paid_config.switch) {
      this.getPayOrder(this.applySubShopApp, param);
    } else {
      this.applySubShopApp(param);
    }
  },
  applySubShopApp : function (param) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/ApplySubShopApp',
      data: param ,
      method: 'POST',
      success: function (res) {
        that.hasSubmit = true;
        that.setData({
          newApp: res.data.app_id,
          shopId: res.data.shop_id,
          successPop: false
        });
        that.getFAppIdModeByCategoryId({
          apply_type: param.apply_type,
          app_id: res.data.app_id,
          shop_id: res.data.shop_id
        });
      },
      successStatusAbnormal: function(){
        that.hasSubmit = false;
      },
      fail: function(){
        that.hasSubmit = false;
      }
    })
  },
  getFAppIdModeByCategoryId : function(data){
    let that = this;
    if (data.apply_type == 1){
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetFAppIdModeByCategoryId',
      data: {
        shop_id: data.shop_id,
        app_id: data.app_id,
        apply_type: data.apply_type
      },
      method: 'POST',
      hideLoading: true,
      success: function (res) {
      }
    })
  },
  uploadLogo: function(){
    let that = this;
    app.chooseImage(function(res){
      that.setData({
        shopLogo : res[0]
      });
    }, 1);
  },
  getLocation: function () {
    return new Promise((resolve, reject) => {
      app.getLocation({
        success: resolve,
        fail: reject
      })
    })
  },
  chooseLocation : function(){
    let that = this;
    app.chooseLocation({
      success: function(res){
        if(!res.longitude){
          app.showModal({
            content: '请点选择具体的地址'
          });
          return;
        }
        app.sendRequest({
          url: '/index.php?r=Map/getAreaInfoByLatAndLng',
          data: {
            longitude: res.longitude,
            latitude: res.latitude
          },
          success: function ({ data }) {
            let nationCode = getRightAttrVal('ad_info.nation_code', data);
            if (nationCode == 156) { // 代表中国
              let province = getRightAttrVal('address_component.province', data);
              let city = getRightAttrVal('address_component.city', data);
              let district = getRightAttrVal('address_component.district', data);
              that.textToRegion(province, city, district);
              countryId.update(1);
            } else if (nationCode == 124) { // 加拿大
              countryId.update(89);
            } else if (nationCode == 458) { // 马来西亚
              countryId.update(233);
            } else if (nationCode == 702) { // 新加坡
              countryId.update(266);
            } else if (nationCode == 392) { // 日本
              countryId.update(298);
            } else if (nationCode == 36) { // 澳大利亚
              countryId.update(468);
            }
          }
        });
        that.setData({
          address: res.name || '',
          longitude: res.longitude,
          latitude: res.latitude
        });
      },
      fail: function(res){
        console.log(res);
        app.addLog(res);
      }
    });
  },
  getPhoneCode: function () {
    var that = this;
    if (!that.data.canSendCode) {
      return;
    }
    if (!/^\d+$/.test(that.data.phone)) {
      app.showModal({
        content: '请输入正确的手机号'
      });
      return;
    }
    that.setData({
      canSendCode: false
    });
    let {
      phone,
      aPPreFixValue,
      countryPreFix
    } = this.data;
    let accountPhone = countryPreFix[aPPreFixValue[0]]['value'] + '-' + phone;
    app.sendRequest({
      url: '/index.php?r=AppShop/SendPhoneCode',
      data: {
        phone : accountPhone
      },
      success: function () {
        that.codeBtncountDown();
        that.checkPhoneIsUser();
      },
      successStatusAbnormal: function(){
        that.setData({
          canSendCode: true
        });
      },
      fail: function(){
        that.setData({
          canSendCode: true
        });
      },
      complete: function () {
      }
    })
  },
  timeInterval : '',
  codeBtncountDown: function () {
    let that = this,
        time = 60;
    clearInterval(that.timeInterval);
    this.setData({
      codeBtnText: '60s',
      canSendCode: false
    });
    that.timeInterval = setInterval(function () {
      time--;
      if (time < 0) {
        that.setData({
          codeBtnText: '验证',
          canSendCode: true
        });
        clearTimeout(that.timeInterval);
      } else {
        that.setData({ codeBtnText: time + 's' });
      }
    }, 1000);
  },
  successPopHidden: function(){
    this.setData({
      successPop : true
    });
  },
  getObjectFirst: function(obj){
    for (let i in obj) {
      return obj[i];
    }
  },
  appRadioChange: function (e) {
    this.setData({
      appType: e.detail.value
    });
  },
  bindAppChange: function (e) {
    this.setData({
      appIndex: e.detail.value
    })
  },
  getCanApplyShopList: function(){
    let that = this;
    let {
      phone,
      aPPreFixValue,
      countryPreFix
    } = this.data;
    let accountPhone = phone;
    if (countryPreFix[aPPreFixValue[0]]['value'] != 86) { // 非中国手机号要加前缀
      accountPhone = countryPreFix[aPPreFixValue[0]]['value'] + '-' + phone;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/GetCanApplyShopList',
      data: {
        parent_app_id: app.getAppId(),
        account_phone: accountPhone
      },
      success: function (res) {
        let list = res.data;
        that.setData({
          appList: list,
          appType: list.length == 0 ? 2 : 1
        });
      }
    });
  },
  checkPhoneIsUser: function(){
    let that = this;
    let {
      phone,
      aPPreFixValue,
      countryPreFix
    } = this.data;
    let accountPhone = phone;
    if (countryPreFix[aPPreFixValue[0]]['value'] != 86) { // 非中国手机号要加前缀
      accountPhone = countryPreFix[aPPreFixValue[0]]['value'] + '-' + phone;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/CheckPhoneIsUser',
      data: {
        account_phone: accountPhone
      },
      success: function (res) {
        that.setData({
          isUser: res.is_user == 1
        });
        if (res.is_user == 1){
          that.getCanApplyShopList();
        }
      }
    });
  },
  turnToFranchiseeDetail: function(){
    app.turnToPage('/franchisee/pages/franchiseeDetail/franchiseeDetail?detail=' + this.data.newApp + '&shop_id=' + this.data.shopId, true);
  },
  makePhoneCall: function (e) {
    var phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
  },
  phoneNumber: '',
  getPhoneNumber: function(e){
    let that = this;
    if (/getPhoneNumber:fail/.test(e.detail.errMsg)) {
      that.getPhoneNumberFail();
      return;
    }
    app.checkSession(function(){
      app.sendRequest({
        url: '/index.php?r=AppUser/GetPhoneNumber',
        data: {
          encryptedData: e.detail.encryptedData,
          iv: e.detail.iv
        },
        success: function (res) {
          let newData = {};
          let matchRes = res.data.match(/^(\d+)\D+(\d+)$/);
          if (matchRes) {
            that.phoneNumber = matchRes[2];
            let _value = that.data.countryPreFix.findIndex(cpf => cpf.value == matchRes[1]);
            if (_value > -1) {
              that.bindAPPreFixChange({
                detail: {
                  value: _value
                }
              })
            }
          } else {
            that.phoneNumber = res.data;
            if (+that.data.countryPreFix[that.data.aPPreFixValue[0]].value !== 86) {
              let aValue = that.data.countryPreFix.findIndex(cpf => cpf.value == 86);
              if (aValue > -1) {
                newData['aPPreFixValue[0]'] = aValue;
                newData['sPPreFixValue[0]'] = aValue;
              }
            }
          }
          newData.phone = that.phoneNumber;
          newData.isGetPhoneNumber = true;
          newData.hasGetPhoneNumber = true;
          that.setData(newData);
          that.checkPhoneIsUser();
        },
        successStatusAbnormal: function () {
          that.getPhoneNumberFail();
        },
        fail: function () {
          that.getPhoneNumberFail();
        },
        successStatus5: function(){
          app.goLogin({
            success: function () {
              app.showModal({
                content: '获取手机号失败，请再次点击授权获取'
              });
            },
            fail: function () {
              app.showModal({
                content: '获取手机号失败，请再次点击授权获取'
              });
            }
          });
        }
      });
    });
  },
  getPhoneNumberFail : function(){
    app.showModal({
      content: '获取失败，请手动填写'
    });
    this.setData({
      isGetPhoneNumber: false,
      hasGetPhoneNumber: true
    });
  },
  bindAPPreFixChange: function (e) {
    let that = this;
    let {
      value
    } = e.detail;
    let {
      isDefaultAPP,
      region,
      regionList
    } = this.data;
    let newdata = {};
    newdata['aPPreFixValue[0]'] = value;
    if (isDefaultAPP) {
      let nationId = this.data.countryPreFix[value].id;
      let nationList = regionList[0];
      let index = nationList.findIndex(it => it.id == nationId);
      if (region[0] != index) {
        region = that.creatRegion([index]);
        regionList = that.creatRegionList(region);
        newdata.region = region;
        newdata.regionList = regionList;
        countryId.update(nationId);
      }
      newdata['isDefaultAPP'] = false;
      newdata['sPPreFixValue[0]'] = value;
    }
    this.setData(newdata);
  },
  updateLatAndLng: function(e) {
    let that = this;
    let {
      region,
      regionList
    } = this.data;
    let {
      value
    } = e.detail;
    let address = '';
    if (region.length !== regionList.length) {
      return;
    }
    for (var i = 0, len = region.length; i < len; i++) {
      if (!regionList[i][region[i]]) {
        return;
      }
      if (address) {
        address += ' ' + regionList[i][region[i]].name;
      } else {
        address += regionList[i][region[i]].name;
      }
    }
    address += ' ' + value;
    if (countryId.get() == 1) { // 代表中国
      address = address.replace(/\s/g, '');
    }
    app.sendRequest({
      url: '/index.php?r=Map/GetLatAndLngByAreaInfo',
      data: {
        location_info: address,
        country_region_id: countryId.get()
      },
      success: ({ data }) => {
        let latitude = getRightAttrVal('location.lat', data);
        let longitude = getRightAttrVal('location.lng', data);
        if (latitude && longitude) {
          that.setData({
            latitude,
            longitude
          })
        }
      }
    })
  },
  getPhonePrefix: function (e) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppConfig/GetInternationalPhonePrefix',
      data: {},
      success: function ({data}) {
        if (Array.isArray(data) && data.length > 0) {
          let countryPreFix = data.map(item => pickAttrObject(
            {
              'name': 'countryName',
              'text': 'countryPhonePrefixText',
              'value': 'countryPhonePrefixValue',
              'id': 'country_region_id'
            },
            item));
          that.setData({
            countryPreFix: countryPreFix
          })
        }
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  stoppropgation: function () {},
  getParentConfigData: function () {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShopManage/GetParentConfigData',
      data: {},
      success: function ({data}) {
        let title = '免费入驻';
        let info = data && data.config_data && data.config_data.paid_config;
        if (info) {
          let price = parseFloat(info.price);
          that.setData({
            paid_config: {
              enterAudit: info.enterAudit == '1',
              switch: info.switch == '1' && price > 0,
              price
            }
          })
          title = info.switch == '1' ? '立即入驻' : '免费入驻';
        }
        wx.setNavigationBarTitle({
          title: title
        })
      },
      fail: function (err) {
        console.log(err);
      }
    })
  },
  getPayOrder: function (callback, param) {
    let that = this;
    let options = {
      form_data: {
        app_id: '1'
      },
    }
    if (param.code) {
      options.phone = param.account_phone;
      options.code = param.code;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/AddAppShopPaidImOrder',
      data: options,
      method: 'post',
      success: function (res) {
        if (res.data) {
          that.afterPayOrder(res.data.order_id, callback, param);
        }
      },
    })
  },
  afterPayOrder: function (order_id, callback, add_param) {
    let that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetWxWebappPaymentCode',
      method: 'post',
      data: {
        order_id
      },
      success: function (res) {
        var param = res.data;
        param.success = function () {
          app.showModal({
            content: "支付成功",
            complete: function () {
              add_param.extra = {
                order_id: order_id
              };
              callback(add_param);
            }
          })
        };
        param.fail = function (res1) {
          app.showModal({
            content: "支付失败",
          })
        }
        app.wxPay(param);
      },
      fail: function () {
      }
    })
  },
})
