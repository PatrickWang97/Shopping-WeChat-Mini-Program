var WxParse = require('../../../components/wxParse/wxParse.js');
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
    isReEdit: false,
    shopId: '',
    franchiseeId: '',
    shopImg: [],
    IDCardImg: [],
    BlicenseImg: [],
    OlicenseImg: [],
    facilities : [
      { name: 'WIFI', value: '1', checked: false },
      { name: '停车位', value: '2', checked: false },
      { name: '微信支付', value: '3', checked: false },
      { name: '支付宝', value: '4', checked: false },
    ],
    cdnUrl: app.getCdnUrl(),
    tplUrls : [
      app.getCdnUrl() + '/static/webapp/images/franchisee/tpl-1.jpg',
      app.getCdnUrl() + '/static/webapp/images/franchisee/tpl-2.jpg',
      app.getCdnUrl() + '/static/webapp/images/franchisee/tpl-3.jpg',
      app.getCdnUrl() + '/static/webapp/images/franchisee/tpl-4.jpg',
    ],
    tplId: 0,
    tplHidden : true,
    tplDetailHidden: true,
    tplText: ['门店', '外卖', '商城', '到店'],
    chooseTplId: '',
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
    shopLogo: '',
    longitude: '',
    latitude: '',
    franchiseeInfo: {},
    appShopInfo: {},
    showRegionPickView: false, // 是否显示店铺地址选择弹窗
    confirmRegionSelect: false, // 判断是否确认过地区选择
    countryPreFix: [
      {name: '中国', text: '+86', value: 86, id: 1},
      {name: 'Canada', text: '+1', value: 1, id: 89},
      {name: 'Malaysia', text: '+60', value: 60, id: 233}
    ], // 用户电话前缀
    sPPreFixValue: [0], // 当前选中的客服电话前经
  },
  onLoad: function(options){
    let franchiseeId = options.franchisee || '';
    let shopId = options.shop_id || '';
    let edit = options.edit || '';
    let type = options.type || 0;
    this.setData({
      franchiseeId: franchiseeId,
      shopId: shopId,
      isReEdit: edit,
      type : type
    });
    if (edit){
      app.setPageTitle('编辑资料');
      this.getSubShopData();
    }else{
      this.getOldTpl();
    }
    this.getPhonePrefix();
  },
  enterSubmit : function(e){
    let that = this;
    let val = e.detail.value;
    let param = {
      description: val.description,
      per_capita: val.per_capita,
      fields_data: {
        shop_facility: {
          wifi_account: val.wifi_account,
          wifi_password: val.wifi_password
        }
      }
    };
    param.mode_id = that.data.chooseTplId;
    param.parent_app_id = app.getAppId();
    param.app_id = that.data.franchiseeId;
    param.shop_id = that.data.shopId;
    param.type = 0;
    param.carousel_imgs = that.data.shopImg;
    param.shop_facility = that.getFacilities();
    let IDCardImg = that.data.IDCardImg;
    let BlicenseImg = that.data.BlicenseImg;
    let OlicenseImg = that.data.OlicenseImg;
    param.certif_pics = [IDCardImg,BlicenseImg, OlicenseImg];
    param.country_region_id = countryId.get();
    param.business_time = that.data.franchiseeInfo.business_time.map(item => {
      return {
        start_time: item.start_time,
        end_time: item.end_time
      }
    });
    if (this.data.descIsRichText) { // 富文本描述
      param.description = this.data.franchiseeInfo.description;
      if (param.fields_data) {
        param.fields_data.desc_show_type = 1;
      }else {
        param.fields_data = {
          desc_show_type: 1
        }
      }
    }else {
      if (param.fields_data) {
        param.fields_data.desc_show_type = 0;
      }else {
        param.fields_data = {
          desc_show_type: 0
        }
      }
    }
    if (param.mode_id === '') {
      app.showModal({
        content: '请选择模板'
      });
      return;
    }
    if (!param.business_time[0].start_time || !param.business_time[0].end_time) {
      app.showModal({
        content: '请输入营业时间'
      });
      return;
    }
    if (!param.description && !this.data.descIsRichText) {
      app.showModal({
        content: '请输入门店介绍'
      });
      return;
    }
    if (!param.carousel_imgs.length) {
      app.showModal({
        content: '请上传店铺环境图片'
      });
      return;
    }
    if (param.per_capita && (!/(^[1-9]\d*(\.\d{1,2})?$)|(^0(\.\d{1,2})?$)/.test(param.per_capita))){
      app.showModal({
        content: '请输入正确的人均消费'
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/UpdateAppSubShop',
      data: param,
      method: 'POST',
      success: function (res) {
        app.showToast({
          title: '保存成功',
          icon: 'success'
        });
        let pages = getCurrentPages();
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].page_router) {
            app.globalData['franchiseeTplChange-' + pages[i].page_router] = true;
          }
        }
        let tabBarPagePathArr = app.getTabPagePathArr();
        for (let i = 0; i < tabBarPagePathArr.length; i++) {
          let router = tabBarPagePathArr[i].split('/')[2];
          if (router) {
            app.globalData['franchiseeTplChange-' + router] = true;
          }
        }
        app.turnToPage("/franchisee/pages/franchiseeEnterStatus/franchiseeEnterStatus?franchisee=" + that.data.franchiseeId , true);
      }
    })
  },
  uploadLicenseImg: function (e) {
    let that = this;
    let length = e.currentTarget.dataset.length || 6;
    let field = e.currentTarget.dataset.field;
    let num = length - that.data[field].length;
    app.chooseImage(function (res) {
      let newdata = {};
      newdata[field] = that.data[field].concat(res);
      that.setData(newdata);
    }, num);
  },
  deleteLicenseImg: function (e) {
    let index = e.currentTarget.dataset.index;
    let field = e.currentTarget.dataset.field;
    let img = this.data[field];
    img.splice(index, 1);
    let newdata = {};
    newdata[field] = img;
    this.setData(newdata);
  },
  bindStartTimeChange: function(e){
    let {
      index
    } = e.currentTarget.dataset;
    this.setData({
      ['franchiseeInfo.business_time[' + index + '].start_time']: e.detail.value
    })
  },
  bindEndTimeChange: function (e) {
    let {
      index
    } = e.currentTarget.dataset;
    this.setData({
      ['franchiseeInfo.business_time[' + index + '].end_time']: e.detail.value
    })
  },
  previewImage: function(e){
    let src = e.currentTarget.dataset.src;
    app.previewImage({
      current: src
    });
  },
  facilitiesSwitch: function(e){
    let i = e.currentTarget.dataset.index;
    let newdata = {};
    newdata['facilities[' +i+ '].checked'] = e.detail.value;
    this.setData(newdata);
  },
  getFacilities: function(){
    let facility = this.data.facilities;
    let fArr = [];
    for (let i = 0; i < facility.length; i++) {
      if (facility[i].checked) {
        fArr.push(facility[i].value);
      }
    }
    return fArr;
  },
  tplPopShow: function(){
    this.setData({
      tplHidden: false
    });
  },
  tplPopHidden: function(){
    this.setData({
      tplHidden: true
    });
  },
  tplDetailShow: function (e) {
    let id = e.currentTarget.dataset.id;
    this.setData({
      tplDetailHidden: false,
      tplId: id
    });
  },
  tplDetailHidden: function () {
    this.setData({
      tplDetailHidden: true
    });
  },
  tplDetailConfirm: function(){
    let that = this;
    this.setData({
      tplHidden: true,
      tplDetailHidden: true,
      chooseTplId: that.data.tplId
    });
    if (that.data.tplId == 1){
      app.showModal({
        content: '外卖商品未绑定分类将无法显示'
      });
    } else if (that.data.tplId == 3) {
      app.showModal({
        content: '到店商品未绑定分类将无法显示'
      });
    }
  },
  uploadLogo: function () {
    let that = this;
    app.chooseImage(function (res) {
      that.setData({
        shopLogo: res[0]
      });
    }, 1);
  },
  getLocation: function () {
    let that = this;
    app.chooseLocation({
      success: function (res) {
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
          success: function ({data}) {
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
      fail: function (res) {
        console.log(res);
      }
    });
  },
  getObjectFirst: function (obj) {
    for (let i in obj) {
      return obj[i];
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
  getIndustryById: function (id) {
    const allIndustryData = this.data.allIndustryData;
    const fn = (list, idxs = []) => {
        let i = 0;
        let item = null;
      for (; item = list[i++];) {
        if (item.id - id === 0) {
          idxs = idxs.concat(i - 1);
          break;
        } else if (Array.isArray(item.child) && item.child[0]) {
          let nIdxs = fn(item.child, idxs.concat(i - 1));
          if (nIdxs.length - idxs.length > 1) {
            idxs = nIdxs;
          }
        }
      }
      return idxs;
    }
    return fn(allIndustryData);
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
  getCategoryIdxsByIds: function(list, ids) {
    let getIdxs = function (list1, ids1, idxs1 = []) {
      if (ids1.length > idxs1.length) {
        list1.some((item, index) => {
          let flag = !(item.id - ids1[idxs1.length]);
          if (flag) {
            idxs1 = idxs1.concat(index);
            if (Array.isArray(item.subclass)) {
              idxs1 = getIdxs(item.subclass, ids1, idxs1);
            }
          }
          return flag;
        })
      }
      return idxs1;
    }
    return getIdxs(list, ids);
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
  reEditSubmit: function(e){
    let that = this;
    let val = e.detail.value;
    let param = {
      name: val.name,
      address_detail: val.address_detail,
      description: val.description,
      per_capita: val.per_capita,
      fields_data:{
        shop_facility: {
          wifi_account: val.wifi_account,
          wifi_password: val.wifi_password
        }
      }
    };
    let industryIds = this.data.industryIds;
    if (industryIds.length > 0) {
      param.industry_type = industryIds.slice(-1)[0];
    }
    param.parent_app_id = app.getAppId();
    param.app_id = that.data.franchiseeId;
    param.shop_id = that.data.shopId;
    param.picture = that.data.shopLogo;
    param.category = that.data.isOperateShopCate ? that.data.categoryIds : [];
    param.longitude = that.data.longitude;
    param.latitude = that.data.latitude;
    param.county_id = that.getCountryId();
    param.mode_id = that.data.chooseTplId;
    param.carousel_imgs = that.data.shopImg;
    param.type = that.data.type == 2 ? 2 : 1;
    let IDCardImg = that.data.IDCardImg;
    let BlicenseImg = that.data.BlicenseImg;
    let OlicenseImg = that.data.OlicenseImg;
    param.certif_pics = [IDCardImg, BlicenseImg, OlicenseImg];
    param.shop_facility = that.getFacilities();
    param.country_region_id = countryId.get();
    param.business_time = that.data.franchiseeInfo.business_time.map(item => {
      return {
        start_time: item.start_time,
        end_time: item.end_time
      }
    });
    if (this.data.descIsRichText) { // 富文本描述
      param.description = this.data.franchiseeInfo.description;
      if (param.fields_data) {
        param.fields_data.desc_show_type = 1;
      }else {
        param.fields_data = {
          desc_show_type: 1
        }
      }
    }else {
      if (param.fields_data) {
        param.fields_data.desc_show_type = 0;
      }else {
        param.fields_data = {
          desc_show_type: 0
        }
      }
    }
    let {
      countryPreFix,
      sPPreFixValue
    } = this.data;
    if (!param.name) {
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
    if (countryPreFix[sPPreFixValue[0]]['value'] != 86) { // 非中国手机号添加前缀
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
    if (!param.description && !this.data.descIsRichText) {
      app.showModal({
        content: '请输入门店介绍'
      });
      return;
    }
    if (!param.carousel_imgs.length) {
      app.showModal({
        content: '请上传店铺环境图片'
      });
      return;
    }
    if (param.per_capita && (!/(^[1-9]\d*(\.\d{1,2})?$)|(^0(\.\d{1,2})?$)/.test(param.per_capita))) {
      app.showModal({
        content: '请输入正确的人均消费'
      });
      return;
    }
    app.sendRequest({
      url: '/index.php?r=AppShop/UpdateAppSubShop',
      data: param,
      method: 'POST',
      success: function (res) {
        app.showToast({
          title: '保存成功',
          icon: 'success'
        });
        if (that.data.type == 2){
          app.globalData.franchiseeListRefresh = true;
        }
        let pages = getCurrentPages();
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].page_router) {
            app.globalData['franchiseeTplChange-' + pages[i].page_router] = true;
          }
        }
        let tabBarPagePathArr = app.getTabPagePathArr();
        for (let i = 0; i < tabBarPagePathArr.length; i++) {
          let router = tabBarPagePathArr[i].split('/')[2];
          if (router) {
            app.globalData['franchiseeTplChange-' + router] = true;
          }
        }
        app.turnToPage("/franchisee/pages/franchiseeEnterStatus/franchiseeEnterStatus?franchisee=" + that.data.franchiseeId, true);
      }
    })
  },
  getSubShopData: function () {
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetSubShopData',
      data: {
        parent_app_id: app.getAppId(),
        app_id: that.data.franchiseeId,
        shop_id: that.data.shopId,
        p_u: app.globalData.p_u || ''
      },
      success: function (res) {
        let data = res.data[0];
        let newdata = {};
        data.description = data.description ? data.description.replace(/\n|\\n/g, '\n') : data.description;
        if (data.fields_data && Number(data.fields_data.desc_show_type) === 1) {
          newdata['descIsRichText'] = true;
          WxParse.wxParse('wxParseDescription', 'html', data.description, that, 10); // 解析富文本
        }
        if (~data.phone.indexOf('-')) {
          let phoneAry = data.phone.split('-');
          data.phone = phoneAry[1];
          let sPPreFixValue = that.data.countryPreFix.findIndex(c => c.value == phoneAry[0]);
          newdata['sPPreFixValue[0]'] = sPPreFixValue;
        }
        newdata.shopLogo = data.picture;
        newdata.longitude = data.longitude;
        newdata.latitude = data.latitude;
        newdata.address = data.address_detail;
        newdata.chooseTplId = +data.mode_id;
        if (!Array.isArray(data.business_time) || !data.business_time.length) {
          data.business_time = [{
            start_time: '00:00',
            end_time: '23:59'
          }]
        }
        newdata.shopImg = data.carousel_imgs;
        newdata.IDCardImg = data.certif_pics[0] || [];
        newdata.BlicenseImg = data.certif_pics[1] || [];
        newdata.OlicenseImg = data.certif_pics[2] || [];
        newdata.franchiseeInfo = data;
        let facilities = that.data.facilities;
        for (let i = 0; i < facilities.length; i++){
          if (data.shop_facility.indexOf( facilities[i].value ) > -1){
            newdata['facilities['+i+'].checked'] = true;
          }
        }
        that.setData(newdata);
        that.getAppShopCateList(function(listData){
          let categoryIds = data.category;
          if (categoryIds.length === 1) {
            categoryIds = categoryIds.concat(categoryIds);
          }
          let categorySource = that.shopCateListForm(listData);
          let categoryIdxs = that.getCategoryIdxsByIds(categorySource, categoryIds);
          let categoryList = that.initShopCateList(categorySource, categoryIdxs);
          let categoryNames = that.getShopCategoryNames(categoryList, categoryIdxs);
          that.setData({
            categorySource,
            categoryList,
            categoryIds,
            categoryIdxs,
            categoryNames,
            lastCategoryIdxs: categoryIdxs,
            isOperateShopCate: true
          });
        });
        that.industryTypeInit(function (allIndustryData) {
          if (data.industry_type === undefined) {
            return;
          }
          let industry = that.getIndustryById(data.industry_type);
          let industryList = that.creatIndustryList(industry);
          let industryIds = that.generateIndustryIds(industry);
          let industryNames = that.generateIndustryNames(industry);
          that.setData({
            industry,
            industryIds,
            industryNames,
            industryList,
            selectedIndustry: industry
          });
        });
        that.initRegionData(function (allRegionData) {
          that.setData({
            allRegionData
          });
          let region = that.creatRegion([0]);
          let regionList = that.creatRegionList(region);
          that.setData({
            region,
            regionList
          });
          that.textToRegionById(data.country_region_id, data.province_id, data.city_id, data.county_id);
          countryId.update(data.country_region_id);
          that.getAppShopInfo();
        });
      }
    });
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
      }
    });
    region = region.slice(0, 4);
    regionList = regionList.slice(0, 4);
    this.setData({
      region,
      regionList,
      confirmRegionSelect: true
    });
  },
  textToRegionById: function (nationId, provinceId, cityId, townId) {
    const getChild = this.getRegionChild;
    let region = this.data.region;
    let regionList = this.data.regionList;
    let fn = function (id, list) {
      let l = list.length;
      let index = null;
      for (let i = 0; i < l; i++) {
        if (list[i].id - id === 0) {
          index = i;
          break;
        }
      }
      return index;
    }
    let regionIds = [nationId, provinceId, cityId, townId].filter((id) => /^\d+$/.test('' + id));
    let regionIdsLen = regionIds.length;
    regionIds.forEach((id, i) => {
      let list = [];
      if (i === 0) {
        list = regionList[0];
      } else {
        list = getChild(region.slice(0, i));
      }
      let index = fn(id, list);
      if (index !== null) {
        region[i] = index;
        regionList[i] = list;
      }
    });
    region = region.slice(0, regionIdsLen);
    regionList = regionList.slice(0, regionIdsLen);
    this.setData({
      regionList: regionList,
      region: region,
      confirmRegionSelect: true
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
  getOldTpl : function(){
    var that = this;
    app.sendRequest({
      url: '/index.php?r=AppShop/GetSubShopData',
      data: {
        parent_app_id: app.getAppId(),
        app_id: that.data.franchiseeId,
        shop_id: that.data.shopId,
        p_u: app.globalData.p_u || ''
      },
      success: function (res) {
        let data = res.data[0];
        let newdata = {};
        newdata.chooseTplId = +data.mode_id;
        newdata['franchiseeInfo.business_time'] = [{
          start_time: '00:00',
          end_time: '23:59'
        }]
        if (data.country_region_id) { // 更新国家id
          countryId.update(data.country_region_id);
        }
        that.setData(newdata);
      }
    });
  },
  makePhoneCall: function (e) {
    var phone = e.currentTarget.dataset.phone;
    app.makePhoneCall(phone);
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
            longitude,
            ['franchiseeInfo.latitude']: latitude,
            ['franchiseeInfo.longitude']: longitude
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
  stoppropgation: function () {}
})
