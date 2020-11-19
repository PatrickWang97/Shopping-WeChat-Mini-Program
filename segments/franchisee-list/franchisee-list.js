var Element = require('../../utils/element.js');
var util = require('../../utils/util.js');
var app = getApp();
var franchiseeList = new Element({
  events: {
    tapFranchiseeLocation: function (e) {
      this.tapFranchiseeLocation(e);
    },
    turnToFranchiseeDetail: function (e) {
      this.turnToFranchiseeDetail(e);
    },
    franchiseeScrollFunc: function (e) {
      this.franchiseeScrollFunc(e);
    },
    franchiseeHideNationList: function (e) {
      this.hideNationList(e);
    },
    franchiseeReLocalAddress: function (e) {
      this.reLocalAddress(e);
    },
    franchiseeListRefresh: function (e) {
      this.franchiseeListRefresh(e);
    },
    changeDiscountList: function (e) {
      this.changeDiscountList(e);
    }
  },
  methods: {
    init: function(compid, pageInstance){
      let _this = this;
      let customFeature = pageInstance.data[compid].customFeature;
      let locationInfo = app.globalData.locationInfo;
      let param = {};
      param.form = "app_shop";
      if (this.withSortCompFlag(compid, pageInstance) || (customFeature.childrenComps !== undefined && !customFeature.childrenComps.position.show)) { // 判断是否有绑定排序组件
        param.sort_key = "weight";
        param.sort_direction = 0;
      } else {
        param.sort_key = "distance";
        param.sort_direction = 1;
      }
      param.page_size = customFeature.loadingNum || 10;
      param.page = 1;
      param.viewed_count = 1;
      param.assess_score = 1;
      param.highest_weight = 3;
      param.get_least_coup = 4;
      param.carousel_imgs = 1;
      param.extra_cond_arr = {score_sub_shop: 1};
      if (customFeature.sourceType == 'industry' && customFeature.source && customFeature.source != 'none') {
        param.industry_type = customFeature.source;
      } else if (customFeature.sourceType == 'shop' && customFeature.source && customFeature.source != 'none') {
        param.idx_arr = {
          "idx": "category",
          "idx_value": customFeature.source
        };
      }
      if (app.globalData.hasFranchiseeTrade) {
        let HisId = app.globalData.historyDataId;
        let tradeInfo = wx.getStorageSync('tradeInfo') || {};
        if (HisId === tradeInfo.online_his_id){
          param.extra_cond_arr.biz_cate = tradeInfo.id;
        }
      }
      if ([1, 2, 3].indexOf(customFeature.type - 0) > -1 && customFeature.childrenComps.topTag === undefined) {
        pageInstance.setData({
          [compid + '.customFeature.childrenComps.topTag']: { show: true }
        });
      }
      app.getNationList(compid);
      if (app.getInvolvedFromRefreshObject(customFeature.id, "new-classify", "refresh_object", pageInstance)) {
        pageInstance.setData({
          [compid + '.param']: param
        });
        this.fLgetLoaction(compid, pageInstance);
        return;
      }
      if (app.getInvolvedFromRefreshObject(customFeature.id, "franchisee-compose", "refresh_object", pageInstance)) {
        pageInstance.setData({
          [compid + '.param']: param
        });
        this.fLgetLoaction(compid, pageInstance);
        return;
      }
      if (locationInfo.latitude) {
        let newdata = {};
        newdata[compid + '.location_address'] = locationInfo.address;
        pageInstance.setData(newdata);
        param.latitude = locationInfo.latitude;
        param.longitude = locationInfo.longitude;
        _this.getFranchiseeList(compid, param, pageInstance);
      } else {
        app.getLocation({
          type: 'gcj02',
          success: function (res) {
            let latitude = res.latitude,
              longitude = res.longitude;
            if (res.latitude) {
              pageInstance.requestNum++;
              app.sendRequest({
                hideLoading: true,
                url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
                data: {
                  latitude: latitude,
                  longitude: longitude
                },
                success: function (res) {
                  let newdata = {};
                  let recommendAddress = res.data.formatted_addresses && res.data.formatted_addresses.recommend;
                  newdata[compid + '.location_address'] = recommendAddress;
                  pageInstance.setData(newdata);
                  app.setLocationInfo({
                    latitude: latitude,
                    longitude: longitude,
                    address: recommendAddress,
                    info: res.data
                  });
                }
              });
              param.latitude = latitude;
              param.longitude = longitude;
              _this.getFranchiseeList(compid, param, pageInstance);
            } else {
              let newdata = {};
              newdata[compid + '.location_address'] = '定位失败';
              pageInstance.setData(newdata);
            }
          },
          fail: function (res) {
            let newdata = {};
            if (res.errMsg === 'getLocation:fail auth deny' || res.errMsg === "getLocation:fail:auth denied") {
              newdata[compid + '.location_address'] = '已拒绝定位';
            } else {
              newdata[compid + '.location_address'] = '定位失败';
            }
            param.sort_key = 'weight';
            _this.getFranchiseeList(compid, param, pageInstance);
            pageInstance.setData(newdata);
          }
        });
      }
    },
    onPageShow: function(compid, pageInstance){
      if (app.globalData['franchiseeTplChange-' + pageInstance.page_router]) {
        this.getMyAppShopList(compid, pageInstance, true);
        app.globalData['franchiseeTplChange-' + pageInstance.page_router] = false;
      }
      if (app.globalData.franchiseeListCompsRefresh) {
        this.franchiseeListRefresh({ currentTarget: { dataset: { compid: compid } } });
        app.globalData.franchiseeListCompsRefresh = false;
      }
    },
    fLgetLoaction: function (compid, pageIns, callback) {
      let pageInstance = pageIns || app.getAppCurrentPage();
      let locationInfo = app.globalData.locationInfo;
      if (locationInfo.latitude) {
        pageInstance.setData({
          [compid + '.location_address']: locationInfo.address,
          [compid + '.param.latitude']: locationInfo.latitude,
          [compid + '.param.longitude']: locationInfo.longitude
        });
        typeof callback === 'function' && callback();
      } else {
        app.getLocation({
          type: 'gcj02',
          success: function (res) {
            let latitude = res.latitude,
              longitude = res.longitude;
              pageInstance.setData({
                [compid + '.param.latitude']: latitude,
                [compid + '.param.longitude']: longitude
              });
            if (res.latitude) {
              pageInstance.requestNum++;
              app.sendRequest({
                hideLoading: true,
                url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
                data: {
                  latitude: latitude,
                  longitude: longitude
                },
                success: function (res) {
                  let newdata = {};
                  let recommendAddress = res.data.formatted_addresses && res.data.formatted_addresses.recommend;
                  newdata[compid + '.location_address'] = recommendAddress;
                  pageInstance.setData(newdata);
                  app.setLocationInfo({
                    latitude: latitude,
                    longitude: longitude,
                    address: recommendAddress,
                    info: res.data
                  });
                }
              });
            } else {
              let newdata = {};
              newdata[compid + '.location_address'] = '定位失败';
              pageInstance.setData(newdata);
            }
            typeof callback === 'function' && callback();
          },
          fail: function (res) {
            let newdata = {};
            if (res.errMsg === 'getLocation:fail auth deny' || res.errMsg === "getLocation:fail:auth denied") {
              newdata[compid + '.location_address'] = '已拒绝定位';
            } else {
              newdata[compid + '.location_address'] = '定位失败';
            }
            param.sort_key = 'weight';
            pageInstance.setData(newdata);
            typeof callback === 'function' && callback();
          }
        });
      }
    },
    getFranchiseeList: function(compid, param, pageInstance){
      let _this = this;
      let newdata = {};
      newdata[compid + '.loading'] = true;
      newdata[compid + '.loadingFail'] = false;
      newdata[compid + '.franchisee_data'] = [];
      newdata[compid + '.is_more'] = 1;
      newdata[compid + '.curpage'] = 0;
      if (param['sort_key'] === 'distance' && !param['latitude']) { // 防止没没有经纬度报错
        param['sort_key'] = 'weight';
        param['sort_direction'] = 0;
      }
      if (app.globalData.commonEcLocationId) {
        param['location_id'] = app.globalData.commonEcLocationId;
      }
      newdata[compid + '.param'] = param;
      pageInstance.setData(newdata);
      app.sendRequest({
        hideLoading: true,
        url: '/index.php?r=AppShop/GetAppShopByPage',
        data: param,
        method: 'post',
        success: function (res) {
          for (let index in res.data) {
            let _data = res.data[index];
            let distance = _data.distance;
            let score = _data.assess_score || 5;
            _data.distance = util.formatDistance(distance);
            _data.new_assess_score = app.changeFranchiseScore(score.toString());
            _data.showDiscountList = _data.coupon_list && _data.coupon_list.length > 3 ? true : false;
            res.data[index] = _data;
          }
          if(app.globalData.isLogin){
            _this.getMyAppShopList(compid, pageInstance);
          }
          let newdata = {};
          newdata[compid + '.franchisee_data'] = res.data;
          newdata[compid + '.is_more'] = res.is_more || 0;
          newdata[compid + '.curpage'] = 1;
          newdata[compid + '.loading'] = false;
          newdata[compid + '.loadingFail'] = false;
          pageInstance.setData(newdata);
        },
        fail: function () {
          let newdata = {};
          newdata[compid + '.loading'] = false;
          newdata[compid + '.loadingFail'] = true;
          pageInstance.setData(newdata);
        }
      });
    },
    getMyAppShopList: function(compid, pageInstance, reset) {
      let that = this;
      app.sendRequest({
        url: '/index.php?r=AppShop/GetMyAppShopList',
        data: {
          parent_app_id: app.getAppId()
        },
        hideLoading: true,
        success: function (res) {
          let newdata = {};
          let oldList = pageInstance.data[compid].franchisee_data || [];
          let list = res.data;
          let listId = [];
          if (reset) {
            let l = 0;
            for (let i = 0; i < oldList.length; i++) {
              if (oldList[i].is_audit == 2) {
                l++;
              } else {
                break;
              }
            }
            oldList.splice(0, l);
          }
          for (let i = 0; i < list.length; i++) {
            if (list[i].is_audit == 2) {
              oldList.unshift(list[i]);
              listId.push(list[i].id);
            }
          }
          if (reset) {
            for (let i = 0; i < oldList.length; i++) {
              if (oldList[i].is_audit == 1 && listId.indexOf(oldList[i].id) > -1) {
                oldList.splice(i, 1);
              }
            }
          }
          newdata[compid + '.franchisee_data'] = oldList;
          pageInstance.setData(newdata)
        }
      });
    },
    tapFranchiseeLocation: function (event) {
      let _this        = this;
      let compid       = event.currentTarget.dataset.compid;
      let pageInstance = app.getAppCurrentPage();
      pageInstance.setData({
        [compid + '.showNationList']: true
      });
      return;
      function success(res) {
        let name    = res.name || res.address || '';
        let lat     = res.latitude;
        let lng     = res.longitude;
        let newdata = {};
        let param = {};
        newdata[compid +'.location_address'] = name;
        pageInstance.setData(newdata);
        param = pageInstance.data[compid].param;
        param.page = 1;
        param.latitude = lat;
        param.longitude = lng;
        app.globalData.locationInfo.latitude = lat;
        app.globalData.locationInfo.longitude = lng
        app._refreshFranchiseeList(compid, param, pageInstance);
        app.sendRequest({
          url: '/index.php?r=Map/GetAreaInfoByLatAndLng',
          data: {
            latitude: lat,
            longitude: lng
          },
          success: function (data) {
            if(!name || name == ' '){
              let newdata = {};
              newdata[compid + '.location_address'] = data.data.formatted_addresses.recommend;
              pageInstance.setData(newdata);
            }
            app.setLocationInfo({
              latitude: lat,
              longitude: lng,
              address: name,
              info: data.data
            });
          }
        });
      }
      function cancel() {
        console.log('cancel');
      }
      function fail() {
        console.log('fail');
      }
      app.chooseLocation({
        success: success,
        fail: fail,
        cancel: cancel
      });
    },
    turnToFranchiseeDetail: function (event) {
      let dataset = event.currentTarget.dataset;
      let franchiseeId = dataset.appid;
      let mode = dataset.mode;
      let pageLink = dataset.newpage;
      let param = {};
      param.detail = franchiseeId;
      if (dataset.audit == 2){
        param.shop_id = dataset.id;
      }
      if (pageLink){
        mode = dataset.newmode;
        let options = { mode, pageLink, franchiseeId, param};
        app.turnToFranchiseePage(options);
        return;
      }
      app.goToFranchisee(mode, param);
    },
    hideNationList: function (event) {
      let _this = this;
      let compid = event.currentTarget.dataset.compid;
      let pageInstance = app.getAppCurrentPage();
      pageInstance.setData({
        [compid + '.showNationList']: false
      });
    },
    reLocalAddress: function (event) {
      let dataset = event.currentTarget.dataset,
        pageInstance = app.getAppCurrentPage();
      let compid = dataset.compid;
      let param = pageInstance.data[compid].param;
      let newdata = {};
      newdata[compid + '.showNationList'] = false;
      pageInstance.setData(newdata);
      if (dataset.nationid) {
        app.turnToPage('/eCommerce/pages/searchAddress/searchAddress?from=franchisee&locateAddress=' + dataset.address + '&compid=' + dataset.compid + '&nationId=' + dataset.nationid + '&nationname=' + dataset.nationname + '&latitude=' + param.latitude + '&longitude=' + param.longitude);
      }
    },
    franchiseeListRefresh: function (event) {
      let compid       = event.currentTarget.dataset.compid;
      let pageInstance = app.getAppCurrentPage();
      let requestData = pageInstance.data[compid].param;
      requestData.page = 1;
      app._refreshFranchiseeList(compid, requestData, pageInstance);
    },
    withSortCompFlag(compid, pageInstance) {
      let pageData = pageInstance.data,
        targetId = pageData[compid].customFeature.id,
        sortCompidsArr = Object.keys(pageData).filter(key => /^sort\d+$/.test(key) && !pageData[key].hidden);
      return sortCompidsArr.some(key => pageData[key].customFeature.sort_object === targetId);
    },
    franchiseeScrollFunc: function (event) {
      let pageInstance = app.getAppCurrentPage();
      let compid = typeof event == 'object' ? event.currentTarget.dataset.compid : event;
      let compData = pageInstance.data[compid];
      let customFeature = compData.customFeature;
      if(customFeature.vesselAutoheight == 2){    // 0自定义高度， 1自定义定义高度 ， 2自定义条数
        return;
      }
      if (!compData || compData.loading || !compData.is_more) {
        return;
      }
      let curpage = compData.curpage + 1;
      let newdata = {};
      let param = compData.param;
      newdata[compid + '.loading'] = true;
      newdata[compid + '.loadingFail'] = false;
      pageInstance.setData(newdata);
      param.page = curpage;
      app.sendRequest({
        url: '/index.php?r=AppShop/GetAppShopByPage',
        data: param,
        method: 'post',
        hideLoading: true,
        success: function (res) {
          for (let index in res.data) {
            let _data = res.data[index];
            let distance = _data.distance;
            let score = _data.assess_score || 5;
            _data.distance = util.formatDistance(distance);
            _data.new_assess_score = app.changeFranchiseScore(score.toString());
            _data.showDiscountList = _data.coupon_list && _data.coupon_list.length > 3 ? true : false;
            res.data[index] = _data;
          }
          newdata = {};
          newdata[compid + '.franchisee_data'] = compData.franchisee_data.concat(res.data);
          newdata[compid + '.is_more'] = res.is_more;
          newdata[compid + '.curpage'] = res.current_page;
          newdata[compid + '.loadingFail'] = false;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        },
        fail: function () {
          let newdata = {};
          newdata[compid + '.loadingFail'] = true;
          newdata[compid + '.loading'] = false;
          pageInstance.setData(newdata);
        },
        complete: function () {
        }
      })
    },
    changeDiscountList: function(event){
      let dataset = event.currentTarget.dataset,
        pageInstance = app.getAppCurrentPage();
      let compid = dataset.compid;
      let ind = dataset.index;
      let newdata = {};
      newdata[compid + '.franchisee_data[' +ind +'].showDiscountList'] = !pageInstance.data[compid]['franchisee_data'][ind]['showDiscountList'];
      pageInstance.setData(newdata);
    }
  }
});
module.exports = franchiseeList;
